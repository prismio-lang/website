---
title: "Tutorial: your first complete program"
description: Build a small Prismio program with a function, loop, mutable binding, and output.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-12"
tags: [tutorial, functions, loops, variables]
related: [language/variables, language/functions, language/control-flow]
---

This tutorial builds a complete program that calculates a total, prints it, and returns a successful process status. It introduces a helper function, typed parameters, a mutable binding, a half-open range, and integer output.

## Create the source file

Create `sum.psm` in an empty directory and add:

<!-- prismio-check: pass -->
```prismio
import std.io

fn sum_to(limit: Int) -> Int {
    let mut total: Int = 0
    for value in 1..limit {
        total += value
    }
    return total
}

fn main() -> Int {
    let answer: Int = sum_to(6)
    println(answer)
    return 0
}
```

Run it:

```bash
prismio run sum.psm
```

Expected output:

```text
15
```

## Understand the helper function

```prismio
fn sum_to(limit: Int) -> Int {
```

`sum_to` accepts one `Int` and returns an `Int`. Parameter annotations are required; Prismio does not infer function signatures from calls.

```prismio
let mut total: Int = 0
```

`let` introduces a local binding. `mut` is necessary because the loop updates `total`. The explicit annotation is not required here—`0` can infer `Int`—but it documents the accumulator's width.

```prismio
for value in 1..limit {
    total += value
}
```

`start..end` is half-open. With `limit` equal to `6`, the loop visits `1`, `2`, `3`, `4`, and `5`. The iteration binding `value` exists only inside the loop body.

```prismio
return total
```

A value-returning function must explicitly return on every reachable path. Prismio does not treat the final expression as an implicit result.

## Understand `main`

`main` calls the helper with an exact `Int` argument, selects the `Int` overload of `println`, and returns zero to the operating system.

`println` is an ordinary overloaded function declared in the auto-loaded `std/io.psm` source module. Its `Int` overload formats this value without exposing an integer-specific function name.

`let mut` permits direct reassignment. Parameters are immutable local bindings. The compiler checks that every reachable path in a non-`Void` function returns a value and rejects code after an unconditional return.

Build and run it with `prismio run sum.psm`. The expected output is `15`.

## Make the program branch

Add a function that classifies the total:

<!-- prismio-check: pass -->
```prismio
import std.io

fn sum_to(limit: Int) -> Int {
    let mut total = 0
    for value in 1..limit {
        total += value
    }
    return total
}

fn describe(value: Int) {
    if (value > 10) {
        println("large")
    } else {
        println("small")
    }
}

fn main() -> Int {
    let answer = sum_to(6)
    describe(answer)
    println(answer)
    return 0
}
```

The condition is parenthesized and has type `Bool`. `describe` omits a return type because it returns no value.

## Try an intentional error

Remove `mut` from `total` and run the compiler again. The compound assignment is rejected because immutable bindings cannot be reassigned. Restore `mut`, then change `limit: Int` to `limit: U8` without changing the call. Exact-type call resolution will report that the argument and parameter types do not match.

These failures demonstrate two important Prismio rules: mutation is explicit, and numeric conversion is never silently inserted. Continue with [model owned data](/tutorials/data-model) to learn how strings and structs add move/borrow behavior.
