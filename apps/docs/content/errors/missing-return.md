---
title: Missing return
description: Fix Prismio value-returning functions that can reach the end without returning.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, return, control-flow, functions]
related: [language/functions, language/control-flow, errors/unreachable-code]
---

## Meaning

A function declares a return type, but at least one reachable control-flow path falls off the end.

Prismio requires explicit `return expression`; it does not use the final expression of a block as an implicit result. The check considers branches and terminating loops.

## Why it happens

One `if` branch returns while the false path continues, a `match` lacks a fallback/return path, or a function's signature still promises a value after its body was changed to side effects only.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn sign(value: Int) -> String {
    if (value > 0) { return "positive" }
}
fn main() -> Int { return 0 }
```

## Correct code

<!-- prismio-check: pass -->
```prismio
import std.io

fn sign(value: Int) -> String {
    if (value > 0) { return "positive" }
    return "not positive"
}
fn main() -> Int {
    println(sign(1))
    return 0
}
```

## Common fixes

Return in the remaining branch, add a final return, or remove the declared return type when no value should be produced.

The returned expression must exactly match the declared type. Do not add a dummy return merely to satisfy the compiler if the uncovered path represents a real application error; model that outcome explicitly since exceptions are not implemented.
