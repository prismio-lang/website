---
title: Float loop reductions
description: Why a float accumulator's sum may be added in any order, which loops the compiler recognises, how the mark reaches LLVM, and what it measured against C++ and Rust.
status: stable
version: "0.3.0"
lastUpdated: "2026-11-12"
tags: [compiler, loops, performance, codegen, vectorization, floating-point]
related: [compiler/loop-guards, compiler/stride-tiling, performance/decisions-and-rejected-experiments]
---

A loop that adds floats into one variable cannot be vectorised in C++ or Rust. Both languages
promise that `sum += x` adds in source order, and splitting a sum across SIMD lanes keeps several
partial sums, which rounds differently. Their only ways out are a whole-file `-ffast-math`, which also
gives up NaN and infinity handling, or hand-written partial accumulators. Prismio's specification
instead says that a *loop reduction*'s terms may be added in any grouping, and the compiler lets LLVM
use that:

[//]: # (<!-- prismio-check: pass -->)

```prismio
fn total(values: Vec<Float>) -> Float {
    let mut sum = 0.0
    for value in values {
        sum += value
    }
    return sum
}

fn main() -> Int {
    let mut values: Vec<Float> = []
    for i in 0..<1000 {
        values.push((i as Float) * 0.5)
    }
    if (total(values) == 249750.0) { return 0 }
    return 1
}
```

The loop in `total` runs in about a fifth of the time of the same loop in C++ or Rust (the
[measurements](#measured) are below). The answer above is exact in any order, which is why the check is
exact. For data that does not add exactly, results can differ from source order in the last bits.

## The rule

A loop reduction is a local of float type (`Float`, `F32`, or any other float width), declared outside
a loop, that the loop's body references **only** as `x = x + e`, `x = x - e`, `x += e` or `x -= e`,
where `e` does not reference `x`. For one execution of that loop, the terms may be added in any grouping
and order. Every term is still computed and added exactly once. The rule is in the [numeric
behavior](https://docs.prismio.org/specification/behavior#numeric-behavior) section of the specification.

The "only" is what keeps order-sensitive code safe. It does not need an annotation:

| Shape | Reduction? | Why |
|---|---|---|
| `sum += a[i]`, `sum = sum + f(i)`, `sum -= a[i]` | yes | |
| `sum += a[i] * b[i]` | yes | the emitted `llvm.fmuladd` takes the mark, which is LLVM's fused multiply-add recurrence |
| `if (c) { sum += a[i] }` | yes | every reference is an update; LLVM vectorises it as a select |
| two updates in one body | yes | both are terms of the same sum |
| an update in an inner loop, the sum read by the outer loop | yes, for the inner loop | the rule is per execution of a loop |
| Kahan summation: `t = sum + y; c = (t - sum) - y; sum = t` | no | `sum` is read outside an update |
| time-stepping: `t += dt; x = f(t)` | no | `t` is read |
| `sum = sum * 0.5 + x`, `sum = e - sum` | no | not the shape |
| a global, a field, a parameter, a name the loop declares again | no | not one local of this function |
| `prod *= a[i]` | no | products are left out: overflow and underflow depend on order far more than a sum's rounding does |
| `Int` accumulators | unaffected | integer addition is already associative |

`max` and `min` reductions need nothing: `llvm.maxnum` and `llvm.minnum` already vectorise.

## How it is built

**The analysis** is `src/ir/reductions.psm`. It runs once per function that has a loop, beside the
no-wrap walk in `src/ir/module.psm`. It walks the function keeping the scope, and at each `for`,
`while` or `repeat` it takes as candidates the innermost binding of every name that is a float `let`
of this function. It then reads the loop's whole subtree, condition and range included. An update of
the recognised shape is recorded; any other identifier naming a candidate disqualifies it, and a
declaration of the same name inside the loop disqualifies it for good. The key is the declaration in
scope at loop entry, not the spelling, so shadowing cannot make two variables look like one. `x += e`
reaches the analysis as an assignment holding a combined binary (`parseCompoundAssignment`), so it is the
same shape as `x = x + e`.

**The mark** is a side table in `src/symbols/facts.psm`, keyed by the `+`/`-` node's address and the
pass that set it, as the no-wrap marks are. A pass number is never reused, so a node freed and
reallocated at the same address matches no later pass.

**Codegen**: `generateBinary`'s float branch in `src/ir/expr.psm` calls `ir_fp_mark_reassoc` for a
marked node. That ORs `reassoc` onto the instruction in `runtime/llvm-api-backend.c`: on an `fadd` or
`fsub`, or on the `llvm.fmuladd` call that `fuse_multiply` has already made of `sum + a * b`. A folded
constant has no flags and is skipped. `reassoc` is the one flag LLVM's loop vectorizer needs to treat the
chain as a reduction. `nsz`, `nnan` and `ninf` are not set, because they are not needed, so NaN,
infinities and signed zeros behave exactly as before, and `contract` stays as it was.

## Opting out and tracing

`--strict-float` turns the analysis off for a build, and `strictFloat` does the same in a manifest's
`profiles` block. Every float add then keeps source order. It is meant for code that must reproduce a
sequential result bit for bit, such as a test comparing against output recorded elsewhere.

`PRISMIO_REDUCTION_TRACE=1` prints one `float reduction: file:line` line per marked update while the
compiler runs. The library and the compiler take no mark: `std/` (every module compiled alone) and `src/`
print nothing. `std.float_text`, whose correct rounding depends on the order of its arithmetic, is held to
that by the suite.

The tests are `tests/test_386_float_reductions.psm`, which checks the answers for every row of the
table above (by tolerance where the grouping is free), and `run_float_reductions_test` in
`tests/test_runner.py`. The harness test reads the IR function by function: `reassoc` on the 13
reduction shapes, on none of the 11 sequential ones, on nothing under `--strict-float`, and nowhere in
`std.float_text`. It has to read the IR because a misplaced flag changes an answer only in its last bits,
which a tolerance forgives.

## Measured

The hosted suite's `float_sum` (a plain sum of 1M values, 20 passes) and `float_dot` (a dot product of two
1M-value vectors, 20 passes) exist for this, beside `numerical_integration`. All three arms are written
plainly: a range-`for` in C++, `iter().sum()` and `zip().map().sum()` in Rust, `sum += x` in Prismio,
with no `-ffast-math` and no hand-split accumulators. The values are small multiples of 1/8 and 1/16, so
every grouping is exact and the three arms print the same checksum. Apple M-series, `benchmarks/run.py`,
medians of 24–101 interleaved runs:

| Workload | Prismio | C++ | Rust | vs C++ | vs Rust |
|---|---:|---:|---:|---:|---:|
| `numerical_integration` | 1.1 ms | 2.2 ms | 2.1 ms | 0.51× | 0.52× |
| `float_sum` | 2.2 ms | 11.2 ms | 10.6 ms | 0.20× | 0.21× |
| `float_dot` | 4.2 ms | 12.7 ms | 11.5 ms | 0.33× | 0.37× |

The same suite built with `--strict-float` lands on C++: `float_sum` 10.44 ms against 11.08,
`float_dot` 11.42 against 12.59, `numerical_integration` 2.15 against 2.16. So the gain is the rule and
nothing else.

**Accuracy does not get worse.** The vectorizer here keeps 8 partial sums (2 lanes × 4 interleaved) and
adds them pairwise at the end. An exact model of that order reproduced the compiled programs' printed
results digit for digit. Against the correctly rounded sum of 1M terms:

| Kernel | Source order | 8 partial sums |
|---|---:|---:|
| harmonic sum, `1 / (i + 1)` | −414 ulp | −52 ulp |
| dot product | −40 ulp | +38 ulp |

Several short chains accumulate rounding error more slowly than one long one, so this direction is
expected rather than lucky.

**Determinism.** The same source, compiler, target and flags give the same bits, because LLVM chooses its
lanes deterministically. Different targets can differ in the last bits. That was already true through
`contract`, which fuses on AArch64 (FMA always present) and does not on baseline x86-64, so the rule adds
no new kind of non-portability.

## What was not done

- **A global fast-math mode.** It would buy the same vectorisation and also license transformations that
  change NaN and infinity results, which is the reason C++ users avoid `-ffast-math`.
- **An opt-in annotation.** It would leave every naive loop sequential, and naive loops are where Prismio
  beats C++ and Rust. The shape test already excludes the order-sensitive idioms.
- **Products.** See the table.
- **x86-64 numbers.** Not measured; the mechanism is LLVM's own vectorizer, so it applies there too.
