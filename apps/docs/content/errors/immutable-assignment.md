---
title: Assignment to an immutable binding
description: Fix Prismio assignment where the target was declared with let rather than let mut.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, mutability, assignment, let]
related: [language/variables, language/operators, errors/type-mismatch]
---

## Meaning

Direct assignment or compound assignment targets a binding not declared `mut`.

Bindings are immutable by default so state changes remain visible at the declaration. This diagnostic concerns reassignment, not whether a move-only value is still owned.

## Why it happens

An accumulator, loop counter, or state binding was declared without `mut`, or a refactor changed an expression into in-place assignment.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let value = 5
    value += 1
    return value
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut value = 5
    value += 1
    return value
}
```

## Common fixes

Add `mut` when mutation is intentional, or compute a new binding instead of reassigning.

Do not add `mut` automatically to silence unrelated ownership errors. It does not permit use after move. Struct field assignment has a documented 0.1 edge case that is currently less strict than direct binding assignment; do not depend on it as the future mutability model.
