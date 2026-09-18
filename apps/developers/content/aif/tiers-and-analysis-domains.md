---
title: AIF tiers and analysis domains
description: The escape, alias, thread, and cycle facts that place Prismio allocations into T0 through T4 storage tiers, and how to read a placement that surprises you.
status: experimental
version: "0.1.0"
tags: [aif, allocation, analysis]
related: [aif/overview, aif/regions-views-and-provenance, runtime/allocation-arenas-rc-and-cycles]
lastUpdated: "2026-09-18"
---

A storage tier is the compiler's answer to one question: given everything it can prove about a
single allocation, how cheaply can it be reclaimed without being wrong? [AIF](/aif/overview) — the
Adaptive Inference Framework — answers that by tracking four separate facts per allocation site
(whether it escapes its function, how many names may refer to it, whether it crosses a thread, and
whether its type can form a cycle) and combining them. This page is the reference for those four
facts and the tier ladder they produce; [the overview](/aif/overview) is the place to start if
that ladder is new to you.

## See it work

`tests/aif_tiers.psm` (the compiler repository's own regression fixture for this page) has one
function per tier, deliberately:

```bash
prismio aif aif_tiers.psm
```

```text
AIF analysis
  Source   aif_tiers.psm
  Result   converged in 8 rounds
  Sites    15 potential allocation site(s), not runtime allocation counts

Storage plan
  Stack                   1
  Arena                   7
  Scoped heap             1
  Unique heap             4
  Shared heap             1
  Cycle-managed heap      1
  Cross-thread heap       0

Your code
ID   location                 type            storage                           reason
1    aif_tiers.psm:116:18     [String]        arena:auto                        lifetime fits the region
2    aif_tiers.psm:116:18     String          arena:auto                        lifetime fits the region
3    aif_tiers.psm:116:40     String          arena:auto                        lifetime fits the region
4    aif_tiers.psm:109:13     Tree            heap (cycle management unavailable) may participate in a cycle
5    aif_tiers.psm:86:19      Small           scoped heap                       scope-bound; no arena selected
6    aif_tiers.psm:64:18      String          arena:auto                        lifetime fits the region
7    aif_tiers.psm:70:18      Wide            arena:auto                        lifetime fits the region
8    aif_tiers.psm:102:15     String          heap (RC unavailable)             multiple owners in one thread
9    aif_tiers.psm:95:18      Small           unique heap                       returned to the caller
10   aif_tiers.psm:56:19      Small           stack                             small value does not escape
```

| Tier | Storage | What it takes to qualify |
| --- | --- | --- |
| T0 | Stack storage | Small, non-escaping, never explicitly `drop`ped |
| T1 | Region (arena) | A bounded lifetime a lexical or non-lexical scope can bracket |
| T2 | Unique heap | Escapes, but AIF can prove only one name ever refers to it |
| T3 | Reference-counted heap | More than one name may refer to it, and it stays on one thread |
| T4 | Cross-thread or cycle-managed heap | Crosses a thread boundary, or its type may form a reference cycle |

Tier names describe a compiler strategy, not a source type: `Small` above appears at T0 (site 10),
T1 (site 5), and T2 (site 9) depending on what each specific use proves about it.

## Reading one decision

`--why=<id>` explains a single row. Site 8 above is `String`, and its `--why` shows the fact that
put it at T3 rather than the T1 that a similarly local `String` gets:

```bash
prismio aif aif_tiers.psm --why=8
```

```text
Allocation 8
  Location   aif_tiers.psm:102:15
  Type       String
  Storage    heap (RC unavailable)
  Reason     multiple owners in one thread

Compiler evidence
  Symbol     tier_three__Void#0
  Tier       T3
  Thread     Isolated

  minimal cause
    A rose to Shared
      <- E-OPAQUE  aif_tiers.psm                        102:23
```

`A` is the alias domain; `E-OPAQUE` means the value came back from a call the compiler cannot see
into — an `extern fn` with no return contract at the FFI (foreign function interface) boundary, see
[FFI contracts](/aif/ffi-contracts). "RC
unavailable" names the mechanism this tier would need: RC (reference counting) is what makes a
shared, single-thread value safe to free once, and AIF reaches for it here because it cannot prove
there is only one owner. Compare that with a `String` built one line away, at site 6:

```bash
prismio aif aif_tiers.psm --why=6
```

```text
Allocation 6
  Location   aif_tiers.psm:64:18
  Type       String
  Storage    arena:auto
  Reason     lifetime fits the region

  minimal cause
    E is still Region
      <- ALLOC     aif_tiers.psm                        64:18

  placement
    region:auto  -- bump-allocated, and released in bulk when the region exits
```

Same type, two tiers apart, because the *evidence* differs: site 6 never leaves its function, so
`E` (the escape domain) never rises past `Region`; site 8 comes back from an opaque call, so `A`
(the alias domain) is driven to `Shared` before escape is even in question. Reading `--why` is
reading which domain moved and why — not inferring it from the storage name alone.

## A surprising one, traced

Site 5 looks like it should be T0: `Small` is a two-`Int` struct, it never leaves
`tier_one_dropped`, and nothing aliases it.

```bash
prismio aif aif_tiers.psm --why=5
```

```text
Allocation 5
  Location   aif_tiers.psm:86:19
  Type       Small
  Storage    scoped heap
  Reason     scope-bound; no arena selected

  minimal cause
    E is still Region
      <- ALLOC     aif_tiers.psm                        86:19

  placement
    heap  -- no arena serves this site
      because  an explicit `drop` frees this value, and a deallocator cannot take an arena pointer
```

The escape fact (`E is still Region`) is identical to a true T0 case — nothing here escapes. What
moves it up one rung is `tier_one_dropped`'s explicit `drop(s)`: a stack slot has no address a
deallocator can be handed, so a value that is going to be freed by name cannot be stack storage no
matter how local it is. That is a **codegen constraint layered on top of a fact**, not the fact
itself, which is why the report still says the escape evidence is as good as T0's — the reason
field just names a different requirement that also has to hold.

## How to read a failure

Asking for an allocation ID that does not exist is the most common mistake, usually from re-running
`--why` after editing the file (IDs are reassigned on every run):

```bash
prismio aif aif_tiers.psm --why=999
```

```text
no allocation numbered 999
run `prismio aif <file>` to list the available allocation ids
```

The command exits with status 1. Re-run the plain `prismio aif <file>` first and copy an ID from
its output rather than reusing one from a previous run or a previous version of the source.

## Machine-readable forms

`--summary` is what tooling should parse (it is what [the AIF differential test](/testing/aif-differential)
reads); `--manifest` lists every function's placement:

```bash
prismio aif aif_tiers.psm --summary
```

```text
# aif_tiers.psm  (75 functions, 3 nominal types)
aif-manifest 1 (in-compiler)  rounds=8  converged=yes  constraints=507
sites        15   (excluded: 49 string literals -- static, not allocated)
opaque-ret   2  (undeclared extern/sealed returns -- provenance unknown)
extern-alloc 10  (values produced by runtime calls, e.g. str_concat)
static-ret   0  (declared `alias` with nothing to alias -- static, not allocated)
#
# tier distribution  (BENCHMARKS H1: static D over abstract values)
  T0   1       6%    ####
  T1   8       53%   ################################
  T2   4       26%   ################
  T3   1       6%    ####
  T4b  1       6%    ####
  T4a  0       0%
```

`opaque-ret` and `extern-alloc` on this fixture are the [FFI contracts](/aif/ffi-contracts) page's
subject from the other side: every one of those 2 opaque returns is a call whose contract, if
written, would let AIF prove more than "shared, isolated to one thread."

## Deliberate omissions

This fixture has no `T4a` (cross-thread) site — that domain needs a `spawn`ed task or a shared
channel to exercise, which is [regions, views, and provenance](/aif/regions-views-and-provenance)'s
and the runtime concurrency page's territory, not this one's. Full flow-, object-, and
context-sensitivity are also out of scope by design (see below) — this page covers what the four
domains mean and how a tier follows from them, not every rule that can raise a domain.

## If you are changing this

### Conservative joins

Unknown calls, foreign boundaries without a precise contract, merged control-flow paths, and
dynamic dispatch can raise a site to a more conservative state. AIF is field-sensitive but does
not provide full flow, object, or context sensitivity. Contributors should distinguish a genuine
semantic requirement from precision lost by the analysis.

### Thread and cycle facts

Passing ownership into a task and joining within the enclosing lifetime differs from allowing a
value to remain shared after the scope exits. Likewise, a recursive type is not automatically a
runtime cycle, but it can require cycle-capable policy when the compiler cannot rule one out.
Runtime tests for T3 and T4 must validate both edge instrumentation and concurrent behavior.

### Native fact representation

Each `Site` in `runtime/aif_support.c` stores the current escape, alias, thread, and cyclicity
values plus identity, type, source, scope, size, pin, widening, arena, and ownership metadata.
`Constraint` records are grouped by the domain they can change. Dense `Bits` sets from
`aif_containers.c` represent points-to/value relations; `bits_set` reports whether a set grew,
which is the fixed-point work signal.

`aif_con_unique`, `aif_con_borrow`, `aif_con_live_in`, `aif_con_escape_caller`,
`aif_con_escape_global`, `aif_con_no_stack`, `aif_con_transferred`,
`aif_con_spawn`, and `aif_con_opaque` add constraints rather than changing a site immediately.
`aif_solve` first closes points-to edges, then repeatedly applies domain transfers until no fact
grows or the round budget is exhausted. `aif_pt_rounds` and `aif_rounds` expose both counts (the
manifest's `rounds=8 (points-to 5)` above is exactly these two counters).

### Tier selection function

`aif_tier_of(site)` derives a storage tier from the converged facts, site kind, exact size,
stack threshold, explicit region constraints, container ownership, and supported runtime
mechanisms. It is queried after solving; callers must not infer a tier from one domain in isolation.

`aif_set_theta_mode` selects the stack threshold policy and `aif_theta_stack` reports the
effective byte limit (256 bytes on the manifest above — the reason `Wide` in the fixture needs 33
`String` fields to cross it: every field is at most 8 bytes, so the threshold is a byte count, not
a field count). `aif_site_is_rc`, `aif_site_is_cyclic`, and `aif_type_is_counted` expose the
runtime mechanism implied by the final plan. `aif_site_thread` distinguishes isolated, transferred,
and cross-thread values so codegen can select atomic RC only when required.

**The T1 clause reads A for one kind of site.** SPEC 4.2's T1 tests only escape, on the grounds
that "region membership dominates aliasing": an arena reset frees nothing individually, so sharing
inside a region costs nothing. A container element is never arena-served — its container frees it
through the deallocator — so a container element that is `Shared` would be freed once per holder.
`derived_tier` (and the oracle's `tier_of`) therefore let `in_container && A == Shared` fall through
to T3, or T4b for a recursive type. Before 2026-09-18 that site stayed T1, and
`list_push(ys, list_get(xs, 0))` on a struct literal read `release of a pointer that is not live`
while `--why` said "A rose to Shared <- A-CONTAIN" over the T1 site.

**A stored view is a second holder.** A-CONTAIN counts *containers* (`container_of`), so a move
within one list — `list_set(xs, i, list_get(xs, j))`, or `v[i] = v[j]` — never reached it. The
RETAIN_IN rule now raises every site of a stored value that is a view (SPEC 8.4 provenance) to
`Shared`, attributed to A-CONTAIN; a `String` is exempt, because storing a string view copies it.
Because an element read resolves through the container type's element key, this counts every site
of that element type that reaches such a list, which keeps one type's elements in one tier.

A value returned from a helper was already counted — a return is `Caller` — which is why these
probes read clean when the element came from a function and double-freed when it was a literal.
Probe with literals. The regression guard is `tests/test_157_shared_container_elements.psm`.

### Pins and widening

`aif_con_pin` records a requested tier and `aif_check_pins(converged)` compares it with the
derived safe tier. `aif_site_pin_verdict`, `aif_site_pin_tier`, and
`aif_site_derived_tier` feed diagnostics. A pin is an assertion to verify, not an instruction to
override analysis — every `pin(...)` repair line in this page's `--why` output above was rejected
for exactly this reason: inference had already converged on a different, proven answer.

When solving does not converge within the configured budget, `aif_widen` raises unresolved facts
to safe conservative values. `aif_site_widened` marks affected sites for reports.
`aif_cause_domain_for`, `aif_cause_build`, and the `aif_cause_*` accessors reconstruct a
witness chain explaining which rule and source location raised a domain — the `minimal cause`
block in every `--why` above is this chain rendered for a human.

A domain-rule change needs a minimal graph fixture, expected fact values, expected tier, a
`--why` witness, widening behavior, emitted allocation/release symbols, runtime verification, and
the independent Python differential (see [AIF oracle and differential testing](/testing/aif-differential)).
