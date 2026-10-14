---
title: Stride tiling and square bounds
description: How Prismio turns a plain sieve into a segmented one, why reordering its stores is legal, what LLVM needed to make the result fast, and what was measured and rejected on the way.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [compiler, loops, performance, codegen, vectorization, cache]
related: [compiler/loop-guards, performance/decisions-and-rejected-experiments, performance/wrapping-integers-and-tight-loops]
---

A sieve's inner loop stores at a stride. Once the list outgrows L1, nearly every store touches a
different cache line, and the loop waits on L2 or memory for each one. The cure is a segmented
sieve: sweep one cache-sized window of the list at a time, across every stride, instead of the
whole list once per stride. Prismio writes the segmented sieve itself, from the plain source:

[//]: # (<!-- prismio-check: pass -->)

```prismio
fn countPrimes(n: Int) -> Int {
    let mut prime = Vec<Bool>.filled(n + 1, true)
    let mut p = 2
    while (p * p <= n) {
        if (prime[p]) {
            let mut multiple = p * p
            while (multiple <= n) {
                prime[multiple] = false
                multiple = multiple + p
            }
        }
        p = p + 1
    }
    let mut count = 0
    for i in 2..n {
        if (prime[i]) { count = count + 1 }
    }
    return count
}

fn main() -> Int {
    if (countPrimes(1000000) == 78498) { return 0 }
    return 1
}
```

Two mechanisms make this fast, and they are independent: a **square bound**, which lets LLVM
count the inner loop and interleave its stores, and **stride tiling**, which keeps those stores in
L1. This page covers both, the measurements that chose them, and the alternative that lost.

## What was measured first

Before any compiler change, the candidate shapes were written by hand in C (Apple M5, clang 23
`-O3`, marking loop only, best of 40, ratio against the plain loop):

| n | plain | tiled, 64K windows | plain loop, 64-bit bound | bit-packed, tiled |
| --- | ---: | ---: | ---: | ---: |
| 100K | 0.071 ms | 2.03× | 2.03× | 0.21× |
| 400K | 0.242 ms | 2.52× | 1.29× | 0.24× |
| 1M | 0.672 ms | 2.69× | 1.25× | 0.26× |
| 10M | 8.74 ms | 3.11× | 1.18× | 0.33× |
| 100M | 286 ms | 7.83× | 1.04× | 1.06× |

`benchmarks/hosted` runs `scale = 4`, so the benchmark's sieve is n = 400,000: 400 KB of `Bool`,
three L1s.

**The 64-bit-bound column is not about cache.** It is the same single-pass loop, and it is 2.03×
at 100K, where the whole list is L1-resident. LLVM can count that loop, so the vectorizer
interleaves it four ways: four `strb` per branch instead of one. The plain loop's `m <= n` over an
`i32` whose step `p` is not known to be positive cannot be counted. That is what square bounds fix.

**Tiling is the rest**, and it grows with n: 2.5× at the benchmark's size, 8× once the list is in
memory.

## Rejected: packing `Vec<Bool>` to bits

Packing a `Vec<Bool>` one bit per element lost at every size, from 0.21× to 1.06×, tiled or not.
A byte store is one `strb`. Clearing a bit is a load, a shift, a `bic` and a store, and stores to
the same word serialise behind each other. The 8× smaller footprint pays only when the untiled loop
is memory-bound, and tiling removes that case.

Packing would also have changed the layout of every `Vec<Bool>` a function can receive, undone the
byte representation that lets `memset` and vectorised scans work on it, and made the address of an
element impossible. A packed bitset is a type a program asks for (`BitSet`), not a layout the
compiler picks silently.

## Square bounds

`emitSquareBound` in `src/ir/ranges.psm` lets a conjunct `x * x <= B` (or `<`, or mirrored) bound a
counter `x` that only counts up. The square is `Int` arithmetic: past 46340 it wraps negative and
the condition stays true, so the conjunct says nothing until the square is known exact. The range
guard folds two facts that keep `x` inside 46340 at every loop head:

- a start in [-46340, 46340];
- `isqrt(B) + growth <= 46340`, where growth is the most one iteration can add to `x`.

Under those facts, `x <= isqrt(B)` in the body. The root is `llvm.sqrt.f64` of the radicand clamped
at zero. It is exact below 2^52, because the square root is correctly rounded. The clamp matters: the
root of a negative is NaN, and `fptosi` of NaN would put poison into the guard.

For the sieve this proves `prime[p]`, which used to be checked. Then `foldVar` marks `p = p + 1`
`nsw`, which matters more. With `p` known not to wrap, LLVM can count the inner
`multiple = multiple + p` loop and interleave it: 8–15% on a sieve whose `n` arrives at run time.
On the hosted benchmark, whose `n` LLVM had already propagated as a constant, this change alone
measured 1.5% slower with the hot loop instruction-identical, which is
[layout](/performance/decisions-and-rejected-experiments#code-layout-moves-single-workloads-by-20-and-cannot-be-tuned-away).

`tests/test_169_loop_range_proofs.psm` has the shapes and the adversarial cases: a bound past
46339², where the square wraps and the loop runs on; a step that jumps the edge from below it; a
wrapping step; a negative start.

## Stride tiling

`src/ir/tiling.psm`, tried first by `generateWhile` in `src/ir/stmt.psm`.

### The shape

```text
while (C) {                      // C reads scalars only
    if (v[r]) {                  // optional; r a scalar expression
        let mut m = E0
        while (m <= N) {         // or `<`; N invariant over the whole nest
            v[m] = K             // K invariant over the whole nest
            m = m + S            // S invariant in the inner loop
        }
    }
    ... scalar updates ...       // no element access, no call
}
```

`v` is a local `Vec` of a non-optional scalar element type, not rebound in the nest. `C`, `r`,
`E0`, `N`, `S` and the updates are built from local `Int` and `Bool` scalars with `+ - *`,
comparisons and logic. They contain no call, no element access and no `/` or `%`: the tiled copy may
evaluate `S` where the original does not, so nothing in it may trap. Nothing else matches: across
`src/` and every fixture in `tests/`, only `test_286`'s two nests are tiled, and in the hosted
benchmarks only `prime_sieve`.

### Why it is legal

The inner loop's stores all write the same `K`. Stores of one value commute and are idempotent, so
the list's final contents depend only on the *set* of indices written, not their order. That set is
the same as long as every outer iteration decides the same way: the same `C`, the same guard
outcome, the same `E0`, `N` and `S`. Everything but the guard reads scalars, which the tiled copy
updates in the original order.

The guard reads `v[r]`. The copy runs the outer loop as written, but stops each inner loop at the
end of the first window `[0, W)` and records where it stopped and its step. If `r < W`, the read sees
every write an earlier iteration made to index `r`, because those all land in the first window,
which was swept in order. It sees no write from a later iteration. So the guard's outcome is the
original's. The later windows are swept afterwards, each across every recorded iteration, and they
never write below `W`, where every read was.

No ownership fact is involved. Nothing else can observe `v` while the nest runs, because the nest
contains nothing else.

### Entry and hand-over

The copy is entered when `v` is flat, `N < len(v)` (so no store needs a check) and `N` spans at least
two windows. Below that, the plain loop is the same work without the bookkeeping.

Each iteration is checked before it does anything: `0 <= r < W`, `E0 >= 0` and `1 <= S <= Int.MAX - N`.
When one fails, the copy finishes the recorded iterations across the remaining windows, which leaves
the list exactly as the original would have it before this iteration. Then a plain copy of the loop
runs on from there. For a sieve, `r = p <= isqrt(N) < 46341 < 65536`, so the hand-over never
happens.

The records are two `[4096 x i32]` arrays on the stack. A nest with more live iterations runs in
batches, each finishing every window before the next starts. The copy is never emitted under
`--freestanding`, whose stacks are small and whose data is L1-sized, or `--overflow-checks`.

### What LLVM needed

Windows are 64 KB of elements on Apple silicon, whose performance cores have a 128 KB L1D, and 32 KB
elsewhere. On the M5, 64 KB beat 32 KB by 1.10× at n = 10^8 and 1.28× at 10^9.

Three things decided whether the sweeps are fast. Each was found by running
`-Rpass-analysis=loop-vectorize` over the emitted IR:

- **No counter live after a sweep.** The resume point is computed in closed form,
  `start + ((hi - start) / s + 1) * s`. Reading the counter after the loop made it "a value used
  outside the loop", and the vectorizer declined to interleave.
- **A step that is positive by range, not by branch.** Neither the dominating `s >= 1` test nor an
  `llvm.assume` reaches the range analysis that decides whether a loop can be counted. The step is
  rebuilt as `zext(trunc(s - 1)) + 1`, whose range is [1, 2^32], and the records hold `s - 1` as an
  `i32`.
- **The hand-over gets its own copy of the loop.** Branching back to the loop's normal entry made
  `p`'s start a merge of 2 and wherever the copy stopped. With `p`'s range gone, the plain path's
  inner loop stopped being counted, which undid square bounds for every sieve below two windows.

## Measurements

Whole sieve (allocate, mark, count) on the M5, best of 31 (5 at 10^8):

| n | before | square bounds | + stride tiling | C, plain | C, hand-tiled |
| --- | ---: | ---: | ---: | ---: | ---: |
| 100K | 85–97 µs | 66–69 µs | 61–64 µs | | |
| 400K | 411 µs | 358 µs | 269–275 µs | | |
| 1M | 1.18–1.22 ms | 1.02 ms | **0.69–0.70 ms** | 1.21 ms | 0.71 ms |
| 10M | 13.4–14.2 ms | 12.2 ms | **7.2–7.4 ms** | 13.8 ms | 7.6 ms |
| 100M | 336–342 ms | 321–328 ms | **77–82 ms** | 340 ms | 84 ms |

Hosted `prime_sieve`, medians of 41 interleaved runs: 482 → **420 µs**, against C++'s 454 and
Rust's 622. Each benchmark run is a fresh process, so first-touch page faults are part of every
arm's time.

## Open

- The first window's sweep still stores one byte per branch; the later windows' sweeps are
  interleaved four ways. At the benchmark's size the first window is 16% of the list.
- At n = 400K most of what remains is allocation, first touch and the count loop, which tiling does
  not touch.

## Testing and debugging

`tests/test_286_stride_tiling.psm` runs the sieve and a strided `Vec<Int>` fill below two windows,
at the edge and across several. Its adversarial cases cover a guard index past the first window and
one before the list, a negative start and a wrapping step (each a hand-over), more live iterations
than one batch, and a nest whose stored value reads the list, which must never be tiled. Expected
values come from a model of the language, not from the compiler.

The `stride_tiling` harness test in `tests/test_runner.py` reads `PRISMIO_TILE_TRACE=1`, which
prints one line per tiled nest. It asserts that exactly the loops marked `// tile` are tiled. That
matters because a copy that is never emitted gives every right answer: the plain loop is correct by
construction.

Each path was mutation-checked. Sending the hand-over to the loop's end fails 4 cases, ending at a
full batch fails the batching case, and skipping the later windows fails 8. A first version of the
batching case failed nothing, because its `p = 1` marked every index by itself; after a change here,
break the path you changed and confirm a case fails.

| Concern | Location |
| --- | --- |
| Square bounds | `emitSquareBound`, `rangeIsSquareOf` in `src/ir/ranges.psm` |
| Shape recognition | `strideNestOf`, `tileInnerLoop`, `tilePure` in `src/ir/tiling.psm` |
| Tiled copy | `generateStrideTiling`, `tileFirstWindow`, `tileFlush`, `tileSweep` in `src/ir/tiling.psm` |
| Hand-over copy | `generateWhile` in `src/ir/stmt.psm` |
| Tests | `tests/test_286_stride_tiling.psm`, `tests/test_169_loop_range_proofs.psm`, `stride_tiling` in `tests/test_runner.py` |
