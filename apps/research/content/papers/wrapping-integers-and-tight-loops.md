---
title: Closing the gap to C on wrapping integer loops
description: Prismio's Int wraps on overflow and fell 5 to 12 percent behind C on tight loops. Four compiler analyses recover the gap without making overflow undefined.
abstract: Prismio's Int is a signed 32-bit integer that wraps on overflow by definition, whereas signed overflow in C is undefined and lets LLVM rewrite arithmetic and widen loop counters freely. On an instruction-counting freestanding suite, four tight integer workloads ran 2 to 12 percent behind C for that reason alone. We attribute the gap by marking one operation at a time as non-wrapping, find three distinct shapes behind it, and build four compiler analyses that prove the facts LLVM needs while leaving wraparound defined. After the change four of twenty workloads beat C, sixteen are level and none are behind, with a geometric mean of 0.95 times C. We also report ten alternatives that were measured, including undefined overflow by default, which moved the hosted suite's geometric mean by 0.9986 times and so was rejected as a language change with no measurable benefit there.
authors:
  - name: Saksham Jaiswal
    url: https://saksham1319.vercel.app
status: published
published: 2026-10-08
updated: 2026-10-22
version: "0.1.0"
tags: [compiler, llvm, integer-overflow, loops, performance, benchmarks]
related: [papers/telling-a-difference-from-noise, notes/int-is-32-bit-and-wraps]
findings:
  - "Before the change, quicksort, knapsack and edit_distance ran 5 to 12 percent behind C and heapsort 2 percent, measured in executed instructions on AArch64."
  - "The gap has three shapes: a loop counter that cannot be widened, a data-dependent recurrence in a loop condition, and arithmetic on array contents."
  - "Knapsack went from 5,690,512 to 3,139,600 instructions, 0.613 times C, from one fact: the subscript's left operand is non-negative."
  - "Making every signed add, subtract and multiply non-wrapping moved the 62-workload hosted suite's geometric mean by 0.9986 times, inside noise."
  - "Marking the loop counter alone made knapsack worse, at 6,258,704 instructions, because the subscript still wraps."
evidence:
  - label: "Range guard for sized arrays: src/ir/ranges.psm"
    url: https://github.com/prismio-lang/prismio/blob/main/src/ir/ranges.psm
  - label: "Facts an unchecked access implies: src/ir/nowrap.psm"
    url: https://github.com/prismio-lang/prismio/blob/main/src/ir/nowrap.psm
  - label: "Counted loops: src/ir/counters.psm"
    url: https://github.com/prismio-lang/prismio/blob/main/src/ir/counters.psm
  - label: "What a local array holds: src/ir/contents.psm"
    url: https://github.com/prismio-lang/prismio/blob/main/src/ir/contents.psm
  - label: "Benchmark runner"
    url: https://github.com/prismio-lang/prismio/blob/main/benchmarks/run.py
  - label: "Full references and prior art in the developer reference"
    url: https://developers.prismio.org/performance/wrapping-integers-and-tight-loops
faq:
  - q: "Why not make signed overflow undefined, as C does?"
    a: "It would change the language, and it did not help where it was measured. Over 62 hosted workloads the geometric mean against C++ moved from 0.8476 to 0.8465, a ratio of 0.9986, inside run-to-run noise. The four tight loops it did help are recovered by compiler analyses without changing what a program means."
  - q: "Does C get these gains from undefined overflow?"
    a: "Not for knapsack. Giving C the same fact in its source, with one unreachable-statement line, brought it to 3,139,120 instructions, and 3,139,104 with wrapping defined. Undefined overflow never supplied that fact."
---

Prismio's `Int` is signed 32-bit and **wraps on overflow by definition**. C's signed overflow is undefined, so LLVM may assume a C `int` never wraps. It can rewrite `min(a + 1, b + 1)` as `min(a, b) + 1`, and widen an `int` loop index to 64 bits so it addresses memory without a sign extension. For Prismio it may do neither unless the frontend proves the arithmetic cannot wrap and says so with LLVM's `nsw` flag. The reasons `Int` is 32 bits at all are in [Why Prismio's Int is 32 bits and wraps](/notes/int-is-32-bit-and-wraps).

On the freestanding suite, which counts instructions exactly, that was the whole of the remaining gap to C. The investigation took place on 2026-10-08. Wraparound stays the language's default throughout; the question was how much of C's speed a compiler can recover without undefined overflow.

## Where the instructions went

Each row was attributed by adding `nsw` to one operation at a time in the compiler's own IR and counting again. The counts are instructions executed on aarch64 freestanding with NEON off.

| workload | Prismio | C | all signed `+ - *` `nsw` | what carries the whole difference |
| --- | ---: | ---: | ---: | --- |
| `quicksort` | 11,304,368 | 10,096,384 | 9,991,296 | `i = i + 1` and `j = j - 1` in the two scans |
| `knapsack` | 5,690,512 | 5,122,624 | 5,122,720 | both `c - 1` and the subscript `c - w`; `c - 1` alone is worse, at 6,258,704 |
| `edit_distance` | 5,900,624 | 5,596,832 | 5,540,608 | the value adds `prev[j] + 1` and `cur[j - 1] + 1`; the index arithmetic contributes nothing |
| `heapsort` | 10,907,456 | 10,702,272 | 10,555,632 | `root * 2 + 1` in the loop condition of `sift` |

The four rows are three shapes.

- **An index counter that cannot be widened** (`quicksort`, `knapsack`). Each step addresses through a 32-bit register with a sign extension, and quicksort also keeps a `mov` of the pre-increment value, so a scan loop runs 5 instructions per element against C's 4.
- **A data-dependent recurrence in a loop condition** (`heapsort`). `root = pick` is not an induction variable, so no counter analysis applies.
- **Arithmetic on array contents** (`edit_distance`). `min(a + 1, b + 1)` becomes `min(a, b) + 1` only if neither add can wrap, and what bounds `a` and `b` is the history of the arrays, not any index.

C built with wrapping defined reproduces Prismio's counts on three rows and lands on 6,258,608 on knapsack, the same as `c - 1` marked alone. It gets there because clang marks C loops as guaranteed to make progress, so LLVM may widen the counter. The subscript `c - w` is still computed in 32 bits.

## What was built

Four analyses, all in the compiler, none changing what a program means.

1. **A range guard for loops over sized arrays.** An `Array<T, N>` access is never checked, so there was nothing for a guard to remove, and the range analysis used to run only for loops with a list guard. It now serves an innermost loop's sized-array accesses with the type's `N` as the length. Knapsack's guard is `w >= 0`, read off `best[c - w]` in `[0, 1501)` over `c` in `[w, 1500]`. From that one fact LLVM proves the loop cannot wrap and writes the `nsw` itself.
2. **Facts an unchecked access implies.** The language requires an index to be in range, so an access that ran had its index in `[0, len)`, and every length fits `Int`. That marks any add or subtract whose operands the facts bound, which covers quicksort's scans where no guard can reach, and any subscript whose left operand is known non-negative. A counter's update is marked only when every subscript in its loop that uses it is, because the knapsack regression is exactly an update marked without its subscript.
3. **Counted loops.** A `while` whose condition bounds a counter and whose last statement steps it by a literal bounds the counter in the body. With a fact on where the counter starts, the walk also counts the iterations.
4. **What a local array holds.** A local array that nothing but a subscript names keeps a bound on its elements over one lifetime. Edit distance's rows start at zero and take 600 × 600 stores of at most one more than an element, so they stay in `[0, 360600]`, which marks the value adds. The two adds alone predicted 5,540,608 from hand-edited IR, and the analysis gives 5,540,624.

## Results

| instructions | before | after | C | after / C |
| --- | ---: | ---: | ---: | ---: |
| `quicksort` | 11,304,368 | **9,991,296** | 10,096,384 | 0.990 |
| `knapsack` | 5,690,512 | **3,139,600** | 5,122,624 | **0.613** |
| `sha256` | 9,018,112 | **8,634,112** | 9,546,064 | 0.904 |
| `edit_distance` | 5,900,624 | **5,540,624** | 5,596,832 | 0.990 |
| `heapsort` | 10,907,456 | 10,907,440 | 10,702,272 | 1.019 |

Against C that is 4 workloads fewer instructions, 16 level and none more, with a geometric mean of 0.95 times. The first results read 3, 14 and 3, with a mean of 0.99 times.

- **Each row has one cause.** Quicksort's gain is entirely the access facts: switching the mark source off puts it back at 11,304,368. Knapsack's is entirely the guard, and stays at 3.14 million with both mark sources off. Edit distance's is entirely the content bound.
- **`sha256` was not a target and its gain is not a proof.** With both mark sources off it still reads 8,634,112. What changed is two `mov`s per round, 64 rounds times 3,000 blocks, which is 384,000. It is code shape that happened to fall the right way. `heapsort` shows the other side: with only the access facts off it reads 11,108,928, because an inlining decision near its threshold flipped.
- **Everything else is unchanged.** The other 15 rows moved by at most one 16-instruction tick, with every checksum equal, and the text section grew 200 bytes (1.3%).
- **The hosted suite is untouched.** Against a baseline built from the same tree, its 140 functions are instruction-identical.
- **The compiler changes a little.** Its own IR gains 41 `nsw` marks, from 369 to 410. Emitting it costs 0.9% more instructions, a median of 10.53 billion against 10.43 over five runs. Two compiler generations still reach a byte-identical fixpoint.

## What every alternative measured

Each alternative was run in a scratch compiler or by hand-editing the pre-pipeline IR. Only the array-content analysis is in the tree.

| alternative | rows recovered | verdict |
| --- | --- | --- |
| Signed overflow undefined by default | all four | **Rejected.** It changes the language, and over 62 hosted workloads the geometric mean moved 0.9986 times |
| An opt-in build mode with the same marks, trapping in debug | all four | **Deferred.** A semantics mode, and the content bound recovered `edit_distance` without one |
| Version knapsack's loop on `w != Int.MIN` | none: 6,259,472, worse than nothing | **Rejected.** A widened counter with an unproved subscript costs a truncation and an extension per access |
| Overflow yields an unspecified value, with a `freeze` before every use | `edit_distance` only; heapsort worse, at 11,059,840 | **Rejected.** A counter must be frozen before its first use, which hides it from scalar evolution |
| Assume every loop terminates | knapsack's counter only, the 6.26M shape | **Rejected.** It makes a side-effect-free infinite loop undefined, a trap in freestanding code |
| An `assume` after every access | quicksort to 10,124,800; knapsack unchanged | **Rejected.** The counter's bound is derived but not the subscript's |
| The access-implied invariant as one `assume` in the loop preheader | knapsack 3,139,216 | **Not built.** It widens what a latent out-of-range bug can do |
| Array-content range analysis | `edit_distance`, 5,540,624 | **Built.** Analysis 4 above |

Heapsort's recipe is known and measured but not built: a guard on `start` and `end` plus `root >= 0`, carried through the recurrence, makes `root * 2 + 1` provably unable to wrap and brings the row to 10,555,648. It would be a fifth analysis for a row already inside the suite's ±2% band, and it is the one row still behind C.

## Method

The first check needs no IR. Run the two rows, then again with one mechanism's marks switched off:

```bash
python3 benchmarks/run.py --suite freestanding --only quicksort --only knapsack
PRISMIO_NOWRAP=0 python3 benchmarks/run.py --suite freestanding --only quicksort --only knapsack
```

```text
    workload     Prismio        C      Rust     vs C  vs Rust
    quicksort     9.99 M  10.10 M  12.96 M    0.99×    0.77×
    knapsack      3.14 M   5.12 M   7.40 M    0.61×    0.42×
```

With the access-fact marks off, quicksort reads 11.30 M again and knapsack stays at 3.14 M, because knapsack's gain is the guard's and not a mark's. The experiments used the compiler's own IR: save the module the pipeline is about to run on, internalise every function but `main`, run the optimiser and code generator for the freestanding target, and boot the result under QEMU with instruction counting. That reproduces the compiler's counts to within one tick, so an edit to the IR is a compiler change measured for free. Four rules came out of it.

- **Attribute before you theorise.** Mark one operation at a time. Knapsack's regression with the counter alone was invisible to reasoning and obvious to a count.
- **Version in loop form, not function form.** A function-level emulation of heapsort's guard measured +0.7%, while the same guard as the frontend's two loop copies measured −3.2%. The difference is pass ordering.
- **Give C the same fact before crediting undefined overflow.** C's knapsack sped up by 39% from a one-line unreachable statement, with wrapping defined as well.
- **Separate what a proof buys from what versioning costs.** Switching the marks off while keeping everything else does that in one binary.

## Prior art

HotSpot's C2 compiler has the same contract, with 32-bit wrapping indices and 64-bit addresses. It narrows the sign extension of an index to the range its range check established, and gives a counted loop whose limit could overflow a check on entry, which corresponds to the range guard here. Go's prove pass builds induction-variable facts with explicit overflow checks, and a wrong overflow helper in that reasoning was the subject of CVE-2026-27143, which is the risk profile of fact tracking; an adversarial fixture covers shadowing, conditionally evaluated operands, loop heads and reassignment. Flang had the same problem with Fortran's 32-bit subscripts and now marks subscript arithmetic as non-wrapping by default. Popescu and Lopes (PLDI 2025) found the end-to-end gain from exploiting undefined behaviour in LLVM small, and that small optimiser improvements usually recovered the loss where removing it regressed. The numbered references are in the [developer reference](https://developers.prismio.org/performance/wrapping-integers-and-tight-loops).
