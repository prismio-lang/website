---
title: AIF layout selection
description: How Prismio chooses object and container layout from access evidence, field temperature, flatness and conversion cost — and why the obvious hot/cold cut can be wrong.
status: experimental
version: "0.1.0"
tags: [aif, layout, soa]
related: [compiler/string-representation, runtime/collection-representations, performance/investigation-method]
lastUpdated: "2026-09-18"
---

A struct's field order is free to change, because nothing in ordinary Prismio source names an
offset. [AIF](/aif/overview) — the Adaptive Inference Framework — uses that freedom to reorder
fields, and even split a struct into a frequently-touched ("hot") part and a rarely-touched
("cold") part behind one pointer, when the traffic it can prove justifies the cost of the split
itself. The purpose is not to make every type exotic. It is to choose a representation whose total
construction, traversal, mutation, and destruction cost is lower than declaration order would have
given you — and to prove that before committing to it, because a locally cheaper split can make a
container globally slower.

## See it work

`tests/test_61_layout_cost_model.psm` builds a 13-field struct, `Sample`, with three real access
groups: two fields (`g`, `h`) touched three times per element by one loop, six fields (`a..f`)
touched once each by another loop, and four fields never read after construction. `--layout` prints
every candidate split it scored:

```bash
prismio aif test_61_layout_cost_model.psm --layout
```

```text
aif-layout 1
source      test_61_layout_cost_model.psm
profile     static
#
# LAYOUT 7.2 argmin over candidates(tau). `*` is the model's choice;
# `emitted` is what codegen actually produced. The two differ when a
# type is vetoed -- for representation cost or soundness -- and when
# --force-layout names a different candidate (LAYOUT 8).
#
# type                      fields  trav  candidate      hot B  cold B  modelled  emitted
  Sample                  13      2     unsplit        104    0       100
  Sample                  13      2     split 2/13     24     88      413
  Sample                  13      2     split 3/13     32     80      210
  Sample                  13      2     split 6/13     56     56      258
  Sample                  13      2     split 9/13 *   80     32      76        emitted
```

## A traced worked example: why the obvious cut loses

The tempting rule is "rank fields by access count, cut where the count drops." Ranked that way,
`g` and `h` (touched three times per pass by `settle`) come out ahead of `a..f` (touched once each
by `advance`), so the first frequency boundary falls after `{tag, g, h}` — a **2/13** split. The
table above scores that candidate at **413**, worse than not splitting at all (**100**).

The reason is what that split does to `advance`: all six of its fields land in the *cold* half,
behind the pointer a split introduces, so a loop that used to walk one flat array now chases a
pointer per element for every field it touches — six times, once per field, in the hot loop that
runs every frame. The candidate the model actually picks, **9/13** (`{tag, a..f, g, h}` hot, four
never-read fields cold), scores **76**: cheaper than not splitting, because it is the only candidate
that keeps both loops' fields on the side they are read from. Reading access counts off a table
would have picked the four-times-worse layout with complete confidence. This is why layout selection
is a cost model over whole candidates, not a ranking of individual fields.

## Explicit layout operations

Reordering and splitting are automatic. `soa()` and `DataView<T>` are the operations that make a
layout change visible to the programmer on purpose, for the case where you want a structure-of-arrays
container yourself rather than waiting for the compiler to infer a split:

<!-- prismio-check: pass -->
```prismio
struct Cell { x: Int, y: Float }

fn main() -> Int {
    let mut rows: Vec<Cell> = []
    rows.push(Cell { x: 1, y: 2.0 })
    let view: DataView<Cell> = soa(rows)
    if (view.length != 1) { return 1 }
    return 0
}
```

```bash
prismio run test_81_data_view_drop.psm --verify
```

```text
Built test_81_data_view_drop
aif-verify: 6 allocated, 6 released, 0 leaked, 0 violation(s)
aif-memory: 204 allocated bytes, 204 released bytes, 0 live bytes, 204 peak live bytes
aif-memory-sizes: <=16:2 <=32:1 <=64:3 <=128:0 <=256:0 <=512:0 <=1024:0 <=4096:0 >4096:0
aif-arena: 0 object(s), 0 byte(s), 0 region(s) on reporting thread
```

A `DataView` you never convert back to rows is still an owned value: it releases every column array
when its scope ends, which is what the ledger above (6 allocated, 6 released) is confirming for a
one-element view of a two-field struct.

## What failure looks like

`soa()` only accepts a `Vec` of a flat struct with no owned fields — it cannot make a
structure-of-arrays view when a field itself needs its own release:

<!-- prismio-check: fail -->
```prismio
struct OwnedRow { name: String }

fn main() -> Int {
    let mut rows: Vec<OwnedRow> = list_new()
    list_push(rows, OwnedRow { name: "owned" })
    let view = soa(rows)
    return 0
}
```

```bash
prismio build neg_36_soa_non_flat.psm -o neg_36.ll
```

```text
error[P4001]: soa requires a flat struct with no owned fields; OwnedRow contains non-flat storage
 --> neg_36_soa_non_flat.psm:9:20
  |
9 |     let view = soa(rows)
  |                    ^^^^
error: aborting due to 1 previous error
```

`String` is owned storage, so a column of `OwnedRow` would need its own release path per column
rather than one release for the struct — exactly the case the automatic layout optimizer also
excludes (see Object and container context, below). The fix is not to force it: restructure so the
owned field lives in its own `Vec` alongside a flat `DataView` of the rest, or keep the rows as an
ordinary `Vec<OwnedRow>`.

### Forcing a candidate for testing

`--force-layout=<Type>:<hot-field-count>` overrides the model's choice, for testing a specific
candidate's codegen rather than trusting the search:

```bash
prismio aif test_61_layout_cost_model.psm --layout --force-layout=Sample:2
```

```text
# type                      fields  trav  candidate      hot B  cold B  modelled  emitted
  Sample                  13      2     unsplit        104    0       100
  Sample                  13      2     split 2/13     24     88      413       emitted
  Sample                  13      2     split 3/13     32     80      210
  Sample                  13      2     split 6/13     56     56      258
  Sample                  13      2     split 9/13 *   80     32      76
```

Naming a hot-field count no real candidate has does not fail the build — it warns and falls back to
the model's own choice:

```bash
prismio aif test_61_layout_cost_model.psm --force-layout=Sample:999
```

```text
warning[P1003]: --force-layout did not apply: no candidate of `Sample` keeps 999 fields hot (see `aif --layout` for the candidates)
```

## Object and container context

A locally cheaper object split can be globally worse when it turns one flat container element into
two allocations connected by a pointer — the `advance` loop above is exactly that failure mode, and
current evidence includes real cases of it. Layout work must price allocation and release traffic,
flat storage eligibility, pointer chasing, copying, and vectorization together, not one at a time.

Automatic layout remains constrained by observable identity, FFI (foreign function interface)
boundaries, debug information, and safe element views. `soa`/`DataView` push past those constraints
only where the programmer states the intent explicitly, and only for types that qualify, as above.

## Acceptance

A cost-model change needs a discriminating layout test (one where the naive rule and the real model
disagree, as above), a runtime value test, a manifest assertion, and an A/B workload that measures
the representation actually selected. A predicted improvement is not a measured improvement.

## Deliberate omissions

This page covers the field-order and hot/cold decision and the explicit `soa`/`DataView`
operations. It does not cover measured workload profiles (`aif_profile_load`, distinguishing
observed access counts from the static estimate used throughout this page) in worked-example form —
that machinery is real and referenced under "If you are changing this" below, but demonstrating it
needs a two-build measure-then-recompile workflow outside this page's scope.

## If you are changing this

### Inputs

The layout model consumes type size and alignment, field access frequency, traversal structure,
container use, and workload annotations where available. `src/aif/layout.psm` defines the
self-hosted model, while `runtime/aif_support.c` contains supporting evaluation machinery.

### Type graph and exact sizing

`aifRegisterTypeEdges` records nominal containment/reference edges for every struct and enum.
The native `aif_compute_type_acyclic` computes strongly connected components so recursive types
are not classified from a shallow field check.

`aifComputeSizes` walks declarations through `aifComputeSizesOf`.
`aifComputeStructSize` uses `aifTypeBytes`, `aifStructFieldBytes`, `aifTypeAlign`, and
`aifAlignUp` to model the selected target. It writes exact sizes through
`aif_struct_set_size`. The model is checked against backend `ir_struct_size`,
`ir_struct_field_offset`, and `ir_struct_field_size`, which query LLVM target data directly.

`aifFieldIsInlineExact` distinguishes embedded value storage from pointer/reference fields.
An optional struct is a reference edge; a non-optional struct field is embedded. Getting this
wrong changes both size and lifetime traversal. An `Array<T, N>` field is embedded too:
`aifTypeBytes` sizes it at `N` elements and `aifTypeAlign` aligns it to its element, as LLVM lays
out `[N x T]`. `aifLayoutVetoInline` keeps a struct holding one unsplit — the split's cost model
has never sized an array, and a cold block would be a second place its bytes could live.

### Field-order selection

`aif_struct_new`, `aif_enum_new`, and `aif_struct_add_field` register nominal layout inputs.
`aif_field_access(type, field, weight)` accumulates static or measured access weights.
`aif_traversal_begin`, `aif_traversal_elem`, and `aif_traversal_end` record sequential
access patterns.

`aif_layout_select` evaluates candidate orders — this is the search that produced the table above.
The report API exposes `aif_layout_candidates`, `aif_layout_best`, `aif_layout_cand_at_rank`,
`aif_layout_cand_field_hot`, `aif_layout_cand_bytes`, and `aif_layout_cand_ratio`. The selected
field order is read with `aif_layout_field` and `aif_layout_field_bytes`; `aif_layout_reordered`
reports whether it differs from source order.

A workload profile enters through `aif_profile_load`. `aif_profile_source` and
`aif_profile_is_measured` distinguish observed data from static estimates — the `profile static`
line in every `--layout` output above is this accessor. Field ranges use
`aif_field_range_lo`, `aif_field_range_hi`, and `aif_field_range_bytes`; an observed range
may guide layout but never justify a source-semantic narrowing.

### Split selection and vetoes

`aif_layout_split_select` chooses the hot-field count. `aif_layout_hot_count` is consumed by
`ir_struct_type_split`. Before selection, `aifLayoutVetoInline`,
`aifLayoutVetoListElements`, and `aifLayoutVetoDataViews` reject layouts whose address,
container, view, FFI, or full-scan behavior cannot preserve semantics.

Native veto functions include `aif_layout_no_split`,
`aif_layout_no_split_unmodelled`, and `aif_layout_no_split_list_full_scan`.
`aif_layout_veto_reason` gives the diagnostic explanation.
`aif_layout_force(type, hotCount)` is the test/diagnostic assertion behind `--force-layout` above;
the `aif_layout_forced_*` queries report whether the requested split was legal and applied — the
`P1003` warning above is what it means for it not to have been.

Layout tests should compare source order, selected order, exact offsets, hot/cold byte counts,
generated GEP (getelementptr, LLVM's address-computation instruction) paths, release of cold-owned
fields, debug metadata offsets, list/DataView vetoes, and measured runtime behavior.
