---
title: AIF layout selection
description: How Prismio evaluates object and container layout using access evidence, field temperature, flatness, and conversion cost.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [aif, layout, soa]
related: [compiler/string-representation, runtime/collection-representations, performance/investigation-method]
---

AIF can evaluate field order, flat aggregate storage, linked hot/cold splitting, and explicit data
views. The purpose is not to make every type exotic; it is to choose a representation whose total
construction, traversal, mutation, and destruction cost is justified by evidence.

## Inputs

The layout model consumes type size and alignment, field access frequency, traversal structure,
container use, and workload annotations where available. `src/aif/layout.psm` defines the
self-hosted model, while `runtime/aif_support.c` contains supporting evaluation machinery.

## Object and container context

A locally cheaper object split can be globally worse when it turns one flat container element into
two allocations connected by a pointer. Current evidence includes exactly that failure mode.
Layout work must price allocation and release traffic, flat storage eligibility, pointer chasing,
copying, and vectorization together.

Explicit `soa`, `aos`, and `DataView` operations make selected layout changes visible to the
programmer. Automatic layout remains constrained by observable identity, FFI boundaries, debug
information, and safe element views.

## Acceptance

A cost-model change needs a discriminating layout test, a runtime value test, a manifest assertion,
and an A/B workload that measures the representation actually selected. A predicted improvement is
not a measured improvement.

## Type graph and exact sizing

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
wrong changes both size and lifetime traversal.

## Field-order selection

`aif_struct_new`, `aif_enum_new`, and `aif_struct_add_field` register nominal layout inputs.
`aif_field_access(type, field, weight)` accumulates static or measured access weights.
`aif_traversal_begin`, `aif_traversal_elem`, and `aif_traversal_end` record sequential
access patterns.

`aif_layout_select` evaluates candidate orders. The report API exposes
`aif_layout_candidates`, `aif_layout_best`, `aif_layout_cand_at_rank`,
`aif_layout_cand_field_hot`, `aif_layout_cand_bytes`, and
`aif_layout_cand_ratio`. The selected field order is read with `aif_layout_field` and
`aif_layout_field_bytes`; `aif_layout_reordered` reports whether it differs from source order.

A workload profile enters through `aif_profile_load`. `aif_profile_source` and
`aif_profile_is_measured` distinguish observed data from static estimates. Field ranges use
`aif_field_range_lo`, `aif_field_range_hi`, and `aif_field_range_bytes`; an observed range
may guide layout but never justify a source-semantic narrowing.

## Split selection and vetoes

`aif_layout_split_select` chooses the hot-field count. `aif_layout_hot_count` is consumed by
`ir_struct_type_split`. Before selection, `aifLayoutVetoInline`,
`aifLayoutVetoListElements`, and `aifLayoutVetoDataViews` reject layouts whose address,
container, view, FFI, or full-scan behavior cannot preserve semantics.

Native veto functions include `aif_layout_no_split`,
`aif_layout_no_split_unmodelled`, and `aif_layout_no_split_list_full_scan`.
`aif_layout_veto_reason` gives the diagnostic explanation.
`aif_layout_force(type, hotCount)` is a test/diagnostic assertion; the
`aif_layout_forced_*` queries report whether the requested split was legal and applied.

Layout tests should compare source order, selected order, exact offsets, hot/cold byte counts,
generated GEP paths, release of cold-owned fields, debug metadata offsets, list/DataView vetoes,
and measured runtime behavior.
