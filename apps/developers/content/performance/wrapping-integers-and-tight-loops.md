---
title: Wrapping integers and tight loops
description: Why a language whose Int wraps fell 5–12% behind C on tight integer loops, the shapes behind it, what was built to close the gap without making overflow undefined, every alternative that was measured, and the prior art and references.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-08"
tags: [performance, llvm, nsw, overflow, loops, freestanding, research]
related: [compiler/loop-guards, performance/freestanding-benchmarks, performance/decisions-and-rejected-experiments, llvm/runtime-ir-and-optimization]
---

Prismio's `Int` is signed 32-bit and **wraps on overflow by definition**. C's signed overflow is
undefined, so LLVM may assume a C `int` never wraps: it can rewrite `min(a + 1, b + 1)` as
`min(a, b) + 1`, and widen an `int` loop index to 64 bits so it addresses memory without a sign
extension. For Prismio it may do neither unless the frontend proves the arithmetic cannot wrap and
says so with LLVM's `nsw` flag. On the [freestanding suite](/performance/freestanding-benchmarks),
which counts instructions exactly, that was the whole of the remaining gap to C: `quicksort`,
`knapsack` and `edit_distance` were 5–12% behind, and `heapsort` 2%.

This page records the investigation (2026-10-08): what the gap was made of, what was built, what
every alternative measured, and the prior art. Wraparound stays the language's default throughout.
The question was how much of C's speed a compiler can get back *without* undefined overflow.

## Where the instructions went

Every row below was attributed by adding `nsw` to one operation at a time in the compiler's own IR
and counting again. Instructions executed, aarch64 freestanding, NEON off:

| workload | Prismio | C | all signed `+ - *` `nsw` | what carries the whole difference |
| --- | ---: | ---: | ---: | --- |
| `quicksort` | 11,304,368 | 10,096,384 | 9,991,296 | `i = i + 1` and `j = j - 1` in the two scans `while (a[i] < p)` and `while (a[j] > p)` |
| `knapsack` | 5,690,512 | 5,122,624 | 5,122,720 | both `c - 1` and the subscript `c - w`. **`c - 1` alone is worse: 6,258,704** |
| `edit_distance` | 5,900,624 | 5,596,832 | 5,540,608 | the value adds `prev[j] + 1` and `cur[j - 1] + 1`. The index arithmetic contributes nothing |
| `heapsort` | 10,907,456 | 10,702,272 | 10,555,632 | `root * 2 + 1` in the `sift` loop's condition. Marking only the `let child` copy does nothing, because GVN merges the two and keeps only the flags they share |

So the four rows are three shapes:

- **An index counter that cannot be widened** (`quicksort`, `knapsack`). Each step addresses
  through a 32-bit register with `sxtw`, and quicksort also keeps a `mov` of the pre-increment
  value. A scan loop runs 5 instructions per element against C's 4.
  - Quicksort's scans have no bound in their condition: they stop on the data, because the pivot is
    a sentinel.
  - Knapsack's counter is bounded by `c >= w`, but the subscript `c - w` must be proved as well.
- **A data-dependent recurrence in a loop condition** (`heapsort`). `root = pick` is not an
  induction variable, so no counter analysis applies.
- **Arithmetic on array contents** (`edit_distance`). `smin(a + 1, b + 1)` becomes
  `smin(a, b) + 1` only if neither add can wrap, and what bounds `a` and `b` is the history of the
  arrays, not any index.

C built with `-fwrapv` reproduces Prismio's counts on three rows and lands on 6,258,608 on
knapsack, the same count as `c - 1` marked alone. It gets there because clang marks C loops
`mustprogress`, so SCEV may assume a loop cannot run forever and widen the counter. The subscript
`c - w` is still computed in 32 bits.

## What was built

Four analyses, all in the compiler and none changing what a program means.

**1. Loops over sized arrays get the range guard** (`arrays` in `src/ir/ranges.psm`). See
[Loop guards](/compiler/loop-guards#loops-over-sized-arrays).

- The existing range analysis used to run only for loops with a list guard. An `Array<T, N>`
  access is never checked, so there was nothing for a guard to remove.
- It now also serves an innermost loop's sized-array accesses, with the type's `N` as the length,
  when the proof marks some arithmetic.
- The guard dominates the proved copy, and its facts are what LLVM was missing. Knapsack's guard is
  `w >= 0`, read off `best[c - w]` in `[0, 1501)` over `c` in `[w, 1500]`.
- From that one fact LLVM proves the loop cannot wrap and writes the `nsw` itself. It also sees that
  every read trails the store, and interleaves four iterations into `ldp`/`stp` pairs.
- C gets the same count once the fact is in its source (`if (w < 0) __builtin_unreachable();`):
  3,139,120, and 3,139,104 with `-fwrapv`. Undefined overflow never supplied this fact.

**2. Facts an unchecked access implies** (`src/ir/nowrap.psm`). See
[Loop guards](/compiler/loop-guards#facts-an-unchecked-access-implies).

- An `Array<T, N>` or `[T]` element is addressed without a check, and the language requires an
  index to be in range. An access that ran therefore had its index in `[0, len)`, and every length
  fits `Int`.
- That marks two kinds of `+`/`-` `nsw`. The first is any whose operands the facts bound, so it
  provably cannot wrap. That covers quicksort's scans, where no guard can reach.
- The second is a subscript whose left operand is known non-negative, which can only wrap to a
  negative, out-of-range value.
- A counter's update is marked only when every subscript in its loop that combines it is, because
  the measured knapsack regression is exactly an update marked without its subscript.

**3. Counted loops** (`src/ir/counters.psm`). See
[Loop guards](/compiler/loop-guards#counted-loops).

- A `while` whose condition bounds a counter, and whose last statement steps it by a literal, bounds
  the counter in the body, from the bounding conjunct on.
- With a fact on where the counter starts, the walk also counts the iterations, unless a `continue`
  can skip the step. The count is what the fourth analysis needs.

**4. What a local array holds** (`src/ir/contents.psm`). See
[Loop guards](/compiler/loop-guards#what-a-local-array-holds).

- A local `Array<Int, N>` that nothing but a subscript names keeps a bound on its elements over one
  lifetime, from its zero-filling declaration to the end of its block.
- Each store's value is described relative to the elements it reads, and the counted loops between
  the declaration and the store bound how far the stores can raise the maximum.
- Edit distance's rows start at zero and take 600 × 600 stores of at most one more than an element,
  so they stay in `[0, 360600]`. The value adds `prev[j] + 1`, `cur[j - 1] + 1` and
  `prev[j - 1] + cost` are marked, and `min(a + 1, b + 1)` becomes `min(a, b) + 1`, as in C.
- This is the "array-content analysis" the first version of this page deferred as a new abstract
  domain for one row. With the counted loops it needs, it came to about 870 lines, and the
  measured gain matched the hand-edited IR: the two adds alone predicted 5,540,608, and the
  analysis gives 5,540,624.

| instructions | before | after | C | after / C |
| --- | ---: | ---: | ---: | ---: |
| `quicksort` | 11,304,368 | **9,991,296** | 10,096,384 | 0.990 |
| `knapsack` | 5,690,512 | **3,139,600** | 5,122,624 | **0.613** |
| `sha256` | 9,018,112 | **8,634,112** | 9,546,064 | 0.904 |
| `edit_distance` | 5,900,624 | **5,540,624** | 5,596,832 | 0.990 |
| `heapsort` | 10,907,456 | 10,907,440 | 10,702,272 | 1.019 |

Against C that is 4 fewer, 16 level and none more, geomean 0.95×. The first results read 3, 14 and 3,
0.99×.

- **sha256** was not one of the target rows, and its gain is not a proof.
  - With both mark sources switched off (`PRISMIO_NOWRAP=0 PRISMIO_RANGE_PROOFS=0`) it still reads
    8,634,112.
  - What changed is two `mov`s per round of the compression loop: 64 rounds × 3,000 blocks is the
    384,000. The versioned loop's IR shape let the register allocator coalesce the round's
    rotation differently.
  - Read it as code shape that happened to fall the right way. `heapsort` shows the other side:
    with only the access facts switched off it reads 11,108,928, because an inlining decision near
    its threshold flipped, and with them on it is level with before.
- **Each row has one cause.**
  - Quicksort's gain is entirely the access facts: `PRISMIO_NOWRAP=0` puts it back at 11,304,368.
  - Knapsack's is entirely the guard: it stays at 3.14M with both mark sources off.
  - Edit distance's is entirely the content bound: `PRISMIO_NOWRAP=0` puts it back at 5,900,624.
- **Everything else is unchanged.** The other 15 rows moved by at most one 16-instruction tick,
  with every checksum equal. `.text` grew 200 bytes (1.3%), mostly the interleaved loop. The
  counted loops and content bounds changed no row but `edit_distance`.
- **The hosted suite is untouched.** Against a baseline built from the same tree without the
  change, its 140 functions are instruction-identical.
- **The compiler changes a little.** Its own IR gains 41 `nsw` marks (369 → 410): 16 from the
  access facts, most of them in the Unicode tables' searches, and 25 from counted loops, such as
  `strTrimEnd`'s `n - 1`. Two generations still reach a byte-identical fixpoint.
  - Against the baseline, both built to their own fixpoint, emitting the compiler's IR costs 0.9%
    more instructions: a median of 10.53 billion against 10.43 over five runs, counted with
    `time -l`. That is the four analyses; the first two alone measured 0.4%.
  - A full build of the compiler is 91.0 billion instructions either way, inside its ±0.3%
    run-to-run spread, because LLVM's pipeline is nine-tenths of it.

## What every alternative measured

Each was run in a scratch compiler or by hand-editing the pre-pipeline IR. Only the array-content
analysis is in the tree.

| alternative | rows it recovered | verdict |
| --- | --- | --- |
| Signed overflow undefined by default (every signed `+ - *` `nsw`) | all four | **rejected**: changes the language. Hosted, over 62 workloads, it moved nothing: Prismio/C++ geomean 0.8476 against 0.8465 (0.9986×), inside run-to-run noise |
| An opt-in build mode with the same marks, trapping in debug (Zig's `ReleaseFast` model) | all four | **deferred**: a semantics mode, and the content bound recovered `edit_distance` without one |
| Version knapsack's loop on `w != Int.MIN`, the guard that keeps `c - 1` from wrapping | none: **6,259,472**, worse than nothing | **rejected**: a widened counter with an unproved `c - w` costs a truncation and an extension per access |
| Overflow yields an unspecified value: `nsw` plus a `freeze` before every store, branch, address, call and return | `edit_distance` only (5,540,608). Quicksort and knapsack unchanged, **heapsort 11,059,840, worse** | **rejected**: a counter must be frozen before its first use, which hides it from SCEV, and InstCombine drops `nsw` when it moves a `freeze` |
| `mustprogress` (assume every loop terminates) | knapsack's counter only, which is the 6.26M shape | **rejected**: makes a side-effect-free infinite loop undefined, a trap in freestanding code |
| `llvm.assume(i u< N)` after every access, leaving LLVM to derive the rest | quicksort to 10,124,800, knapsack unchanged | **rejected**: LVI derives the counter's bound but not the subscript's |
| The access-implied invariant as one `assume(w >= 0)` in the preheader, with no second loop copy | knapsack 3,139,216 | **not built**: same count as the guard, but it widens what a latent out-of-range bug can do, and LLVM backed out the equivalent inference for that reason |
| Array-content range analysis for `edit_distance` | `edit_distance`, 5,540,624 | **built**: analysis 4 above, sound for local arrays whose stores counted loops bound |
| 64-bit induction variables with a wrap guard | none of its own | **not separate work**: the same proof obligation, and IndVarSimplify widens once a proof exists |
| Explicit operators or range types (Zig `+%`, Rust `wrapping_*`, Ada ranges) | none without rewriting the programs | **deferred**: language surface, and the benchmarks are the same algorithm in every language |

Heapsort's recipe is known and measured, but not built. The guard `start >= 0 and end >= -1` plus
`root >= 0` carried inductively through `root = pick` makes `root * 2 + 1` provably unable to wrap.
The guard folds away once `sift` is inlined, and the row reaches 10,555,648. It is a fifth analysis
for a row already inside the suite's ±2% band, and the one row still behind C. It is tracked in
`docs/KNOWN_ISSUES.md`.

## Method

The first check needs no IR. Run the two rows from a Prismio checkout, then again with one
mechanism's marks switched off:

```bash
python3 benchmarks/run.py --suite freestanding --only quicksort --only knapsack
PRISMIO_NOWRAP=0 python3 benchmarks/run.py --suite freestanding --only quicksort --only knapsack
```

```text
    workload     Prismio        C      Rust     vs C  vs Rust
    quicksort     9.99 M  10.10 M  12.96 M    0.99×    0.77×
    knapsack      3.14 M   5.12 M   7.40 M    0.61×    0.42×
```

With `PRISMIO_NOWRAP=0` quicksort reads 11.30 M again and knapsack stays at 3.14 M, because
knapsack's gain is the guard's and not a mark's. `PRISMIO_RANGE_PROOFS=0` leaves both where they
are.

The experiments behind the rest of this page used the compiler's own IR rather than a model of
it, in four steps:

1. Save the module the pipeline is about to run on with `PRISMIO_SAVE_IR=<file>`.
2. Mark every function `internal` except `main`, as `internalize_executable` does.
3. Run `opt -passes='globaldce,default<O3>'` and `llc -O3` with
   `-mtriple=aarch64-unknown-none-elf -mcpu=generic -mattr=-neon,-fp-armv8,+strict-align`.
4. Link with the suite's harness and linker script, and boot under QEMU with `-icount shift=0`.

This reproduces the compiler's counts to within one tick, so an edit to the IR is a
compiler change measured for free. Four rules came out of it:

- **Attribute before you theorise.** Mark one operation at a time. Knapsack's regression with the
  counter alone was invisible to reasoning and obvious to a count.
- **Version in loop form, not function form.** A function-level emulation of heapsort's guard
  measured +0.7%, while the same guard as the frontend's two loop copies measured −3.2%. The
  difference is pass ordering.
- **Give C the same fact before crediting undefined overflow.** C's knapsack sped up by 39% from a
  one-line `__builtin_unreachable`, under `-fwrapv` as well. That made the guard's value obvious.
- **`PRISMIO_RANGE_PROOFS=0` and `PRISMIO_NOWRAP=0` switch off the marks and keep everything else.**
  They separate what a proof buys from what versioning around it costs, in one binary.

## Prior art

- **HotSpot C2.** Java has Prismio's contract: 32-bit wrapping `int` indices, and 64-bit addresses.
  - **Range checks narrow the sign extension.** C2 narrows the `ConvI2L` (sign extension) of an
    array index to the range its range check established [1]. It pushes the conversion through an
    `AddI` only when the narrowed operands show the add cannot overflow [2]. It drops the conversion
    when the index is known non-negative [3]. That is the access-implied fact, with a trapping check
    where Prismio has undefined behaviour.
  - **Loop limit check predicate.** A counted loop whose limit could overflow gets one on entry [4].
    That is the range guard.
- **Go.** The `prove` pass and `loopbce.go` build induction-variable facts with explicit overflow
  checks [5].
  - CVE-2026-27143 was a wrong overflow helper in exactly that reasoning, which let an invalid index
    through [6]. It is the risk profile of fact tracking.
  - Hence the adversarial fixture `test_270_array_nowrap.psm`: shadowing, `and`/`??` that may not
    run, a loop head and a reassignment.
- **Flang** had the same IR problem with Fortran's 32-bit subscripts [7][22].
  - It now marks `nsw` on subscript arithmetic by default [8] and on DO-loop increments [9],
    because the Fortran standard forbids overflow there.
  - Its review raised the CSE flag-merging problem that also explained heapsort's `child` [7].
- **LLVM.**
  - `PredicatedScalarEvolution` and `SCEVWrapPredicate` version loops on no-wrap assumptions, but
    only inside LoopAccessAnalysis and the vectoriser [10][11]. Scalar induction-variable widening
    does not use them.
  - An InstCombine inference of `nuw` for in-bounds GEPs off an alloca was committed in December
    2024 and reverted for its interaction with latent undefined behaviour and sanitizers [12].
  - Deriving undefined behaviour from `inbounds` and poison for SCEV was proposed as early as 2015
    [13].
  - `freeze` is how LLVM tames poison [14][15], and InstCombine drops poison-generating flags when it
    pushes one through an instruction [16].
- **Popescu and Lopes (PLDI 2025)** found the end-to-end gain from exploiting undefined behaviour
  in LLVM small. Where removing it regressed, small optimiser improvements usually recovered the
  loss [17]. Both findings match the hosted suite and these three rows.
- **Zig** makes `+` an error on overflow, checked in `Debug` and `ReleaseSafe` and assumed away in
  `ReleaseFast`, with `+%` for wrapping [18]. That is the shape the deferred opt-in mode would take.
  Rust and Julia avoid the widening problem with pointer-width indices [19][20].
- **Array-content analysis**, the general form of what `edit_distance` would need, is
  Halbwachs–Péron segmentation [21].

## References

1. JDK-6675699, *need comprehensive fix for unconstrained ConvI2L with narrowed type* (the `CastII` range-check dependency). <https://android.googlesource.com/platform/libcore/+/f51da0f1a05%5E%21>
2. JDK-8254317, `ConvI2LNode::Ideal()` pushing the conversion through deep `AddI` chains. <https://bugs.openjdk.org/browse/JDK-8254317>
3. JDK-6464263, bypassing `ConvI2L` for a known-positive index. <https://bugs.openjdk.org/browse/JDK-6464263>
4. OpenJDK hotspot-dev, *RFR: 8308994: C2: Re-implement experimental post loop vectorization* (the loop limit check predicate). <https://mail.openjdk.org/pipermail/hotspot-dev/2023-July/076507.html>
5. Go, `src/cmd/compile/internal/ssa/loopbce.go`. <https://go.googlesource.com/go/+/c03ee1985cb6e4467246a2bdb07bb1c62e05f8e9/src/cmd/compile/internal/ssa/loopbce.go>
6. CVE-2026-27143, Go compiler arithmetic over induction variables not checked for overflow. <https://explore.alas.aws.amazon.com/CVE-2026-27143.html>
7. LLVM Discourse, *RFC: Add nsw flags to arithmetic integer operations using the option -fno-wrapv* (Flang). <https://discourse.llvm.org/t/rfc-add-nsw-flags-to-arithmetic-integer-operations-using-the-option-fno-wrapv/77584>
8. llvm-project PR #110060, *[flang] Add nsw to operations in subscripts*. <https://github.com/llvm/llvm-project/pull/110060>
9. llvm-project PR #91579, *[flang] Add nsw flag to do-variable increment with a new option*. <https://github.com/llvm/llvm-project/pull/91579>
10. LLVM, `SCEVWrapPredicate` class reference. <https://llvm.org/doxygen/classllvm_1_1SCEVWrapPredicate.html>
11. LLVM, `LoopVersioning.h`. <https://llvm.org/docs/doxygen/LoopVersioning_8h_source.html>
12. llvm-project, InstCombine history: the December 2024 `nuw` inference for in-bounds GEPs from an alloca or global, and its revert (PR #120460). <https://src.rcs.uwaterloo.ca/source/history/llvm-project/llvm/lib/Transforms/InstCombine/InstructionCombining.cpp>
13. llvm-dev, *Deriving undefined behavior from nsw/inbounds/poison for scalar evolution* (2015). <https://lists.llvm.org/pipermail/llvm-dev/2015-June/087361.html>
14. Lee, Kim, Song, Hur, Das, Majnemer, Regehr, Lopes, *Taming Undefined Behavior in LLVM*, PLDI 2017. <https://research.google/pubs/taming-undefined-behavior-in-llvm/>
15. LLVM, *LLVM IR Undefined Behavior (UB) Manual*. <https://llvm.org/docs/UndefinedBehavior.html>
16. llvm-project PR #89138, `dropPoisonGeneratingAnnotations`, used when a `freeze` is pushed through an instruction. <https://github.com/llvm/llvm-project/pull/89138>
17. Popescu and Lopes, *Exploiting Undefined Behavior in C/C++ Programs for Optimization: A Study on the Performance Impact*, PLDI 2025. <https://pldi25.sigplan.org/details/pldi-2025-papers/15/Exploiting-Undefined-Behavior-in-C-C-Programs-for-Optimization-A-Study-on-the-Perf>
18. *Integer Rules*, zig.guide. <https://zig.guide/language-basics/integer-rules>
19. Rust users forum, *Should I use small datatypes when I know my numbers are small?* (`usize` indices avoid the extension). <https://users.rust-lang.org/t/should-i-use-small-datatypes-when-i-know-my-numbers-are-small/43091/2>
20. Bezanson, Edelman, Karpinski, Shah, *Julia: A Fresh Approach to Numerical Computing*. <https://arxiv.org/pdf/1411.1607>
21. Halbwachs and Péron, *Discovering Properties about Arrays in Simple Programs*, PLDI 2008. <https://www.microsoft.com/en-us/research/?p=182466>
22. The Iijima talk on Flang's `nsw` in LLVM IR generation, EuroLLVM 2025. <https://www.llvm.org/devmtg/2025-04/slides/quick_talk/minato_nsw.pdf>
