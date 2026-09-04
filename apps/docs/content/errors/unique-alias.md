---
title: Aliased unique parameters
description: Fix a Prismio call that passes one value to two parameters both asserting unique no-alias access.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, unique, alias, aif]
related: [language/annotations, language/ownership-and-borrowing, compiler/aif]
---

## Meaning

The same argument is passed to two `unique` parameters in one call. Their no-alias assertions cannot both be true.

`unique` is an experimental checked intent. Even when both parameters only read today, their signatures promise independent exclusive alias conditions to analysis.

## Why it happens

A caller reused one owner for multiple formal parameters, or a function was annotated more strongly than its actual algorithm requires.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Buffer { value: Int }
fn combine(unique left: Buffer, unique right: Buffer) -> Int {
    return left.value + right.value
}
fn main() -> Int {
    let buffer = Buffer { value: 1 }
    return combine(buffer, buffer)
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Buffer { value: Int }
fn combine(unique left: Buffer, unique right: Buffer) -> Int {
    return left.value + right.value
}
fn main() -> Int {
    let left = Buffer { value: 1 }
    let right = Buffer { value: 2 }
    return combine(left, right)
}
```

## Common fixes

Pass distinct owners or remove `unique` when exclusive aliasing is not a true requirement. Removing an optimization assertion is always safer than making a false one.

Do not manufacture duplicate raw pointers to bypass the check. If the operation intentionally compares a value with itself, ordinary borrowed parameters express that semantics better.
