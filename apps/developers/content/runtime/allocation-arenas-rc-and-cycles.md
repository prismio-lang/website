---
title: Allocation, arenas, reference counts, and cycles
description: Native memory mechanisms supporting AIF stack, region, unique, shared, and cycle-aware storage decisions.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [runtime, allocator, aif]
related: [aif/tiers-and-analysis-domains, aif/reuse-reports-and-verification, performance/investigation-method]
---

AIF chooses a management strategy; the runtime implements strategies that need dynamic support.
`runtime/lang_runtime.c` contains allocation bookkeeping, region chunks, unique release,
reference counts, and cycle-management machinery.

## Regions

T1 regions use aligned bump allocation from linked chunks. A region exit reclaims its chunks
together, and a small pool can retain default-sized chunks for reuse. Oversized chunks are returned.
Growing a region-backed list allocates another buffer without reclaiming the previous capacity until
the region ends.

## Unique and shared storage

T2 storage has one owning path and deterministic release. T3 storage adds reference-count metadata
for shared acyclic values. Cycle-capable storage adds candidate and traversal state for graphs that
plain counts cannot reclaim.

The current ambient arena and cycle state includes process-global mutable data. Native task use
therefore has correctness work remaining; thread-local or synchronized state and stress coverage
must precede performance conclusions.

## Verification

`--verify` records selected allocations, releases, leaks, and violations. Arena statistics are
partly separate, and ordinary benchmark output does not yet provide unified per-site byte,
high-water, lifetime, copy, or reference-count telemetry.

Do not present “zero leaks” as complete memory proof. Foreign allocations, platform handles,
premature balanced releases, and concurrency races require additional tests and tools.

## Base allocator and pools

`rt_base_alloc` and `rt_base_realloc` are no-inline allocation boundaries so verifier,
profiling, and native instrumentation can observe them. `rt_free` is the matching release, and
both names are what codegen emits: every heap object a program allocates and every release.
`rt_alloc` checks whether a runtime allocation should follow the active arena hint.

On 64-bit macOS and Linux the seam is a **slab allocator** (`runtime/lang_runtime.c`): a 64 GiB
address range reserved once, carved into 64 KiB spans, each owned by one of 32 size classes from
16 to 512 bytes. A block's class is its span's entry in a side table, so a release is a range
compare, a load and a push onto a cache. The main thread uses a process-local cache, workers a
thread-local one, and once a thread exists full caches spill batches of 64 blocks to a
per-class shared list that the other threads refill from. Larger requests, and everything after
a refused reservation, come from the C library. `PRISMIO_SLAB=0` in the environment turns the
slab off at run time, which is what a sanitizer or valgrind needs, because neither can see slab
blocks. Windows keeps the older small-block recycler, which classifies a block with `_msize`.
A 32-bit or freestanding build uses the C library (or the program's `prismio_alloc`) directly.

The invariant this sets is **one-way**. A C library block may reach `rt_free`, since anything
outside the slab's range goes to `free`. A block from `rt_base_alloc` must never reach libc
`free` or `realloc`, because that is corruption, not a leak. In the runtime sources the two are
spelled `tmp_free`/`tmp_realloc` (libc) and `rt_free`/`rt_base_realloc` (seam), and the bare
names are poisoned, so a release that does not say which allocator its block came from does
not compile. The measurements and the staged rollout are in `docs/ALLOCATOR_PLAN.md` in the
compiler repository.

The verifier replaces the base path with `aif_verify_alloc`, `aif_verify_realloc`, and
`aif_verify_release`. Its ledger hashes live pointers, stores sizes/state, poisons released
storage, and reports duplicate/invalid releases. `aif_verify_usable_size` supports realloc and
container growth without losing accounting.

## Arenas

`arena_push` creates a dynamic region frame. `arena_chunk_new` allocates the first or next
chunk sized for the requested object. `arena_alloc_slot` performs aligned bump allocation in a
specific frame; `arena_alloc` uses the current frame and `arena_alloc_at` uses an explicit slot
chosen by AIF. `arena_pop` frees all chunks owned by the frame at once.

`arena_current_slot`, `arena_objects`, and `arena_regions` expose runtime counters.
`rt_arena_hint_push` and `rt_arena_hint_pop` let call-produced values use the active region even
when allocation occurs inside a runtime helper such as string concatenation.

Every return, break, continue, and early branch leaving a region must emit the matching pop.
Individual arena objects must not enter ordinary drop lists.

## Reference counting

`rc_alloc` reserves a header immediately before the user pointer and initializes the count.
`rc_slot` recovers it. `rc_retain` increments, while `rc_release` decrements and frees on zero.
`rc_attach_cold` associates hot/cold split storage so the final release reclaims both records;
`rc_cold_slot` locates that companion.

`rc_retain_atomic` and `rc_release_atomic` are the cross-thread variants. AIF's thread domain
selects them only when overlap is possible. Using atomics for every value would be safe but would
erase an intended optimization; using non-atomic operations for a shared value is incorrect.

## Cycle collection

`cyc_alloc` creates a colored RC header. `cyc_set_type` installs two generated callbacks: one
enumerates cyclic child edges and one releases the concrete object. `cyc_retain` and
`cyc_release` maintain the count and buffer possible roots.

The collector follows the trial-deletion phases:

- `cyc_mark_grey` subtracts internal references through the visitor;
- `cyc_scan` identifies zero-count candidates;
- `cyc_scan_black` restores live subgraphs;
- `cyc_collect_white` reclaims the unreachable cycle; and
- `cyc_free_object` runs the typed release path.

**A buffered root that reaches zero is freed by the collector, not by `cyc_release`.** This is
Bacon and Rajan's *Release*: when a count drops to zero on an object sitting in the roots buffer,
`cyc_release` colours it black and returns, and the first pass of the next `cyc_collect` frees every
root whose count is zero before trial deletion starts — nothing refers to such a root, so no walk
can reach it. Freeing it in `cyc_release` left a dangling entry in the buffer that
`cyc_collect_white` freed again; it became reachable once a local value could be T4b (two lists
sharing a recursive enum, the first teardown buffering the node and the second reaching zero).

`cyc_collect` processes buffered roots, `cyc_collect_now` provides an explicit test boundary,
and `cyc_final` performs final cleanup. `cyc_objects`, `cyc_reclaimed`, and
`cyc_collections_run` expose evidence counters. Platform mutex helpers protect collector state
when memory threading is enabled.

Tests must build acyclic and cyclic graphs, retain a live cycle through an external root, break an
edge, collect explicitly and at shutdown, exercise recursive payloads and hot/cold fields, and run
cross-thread stress under TSan.
