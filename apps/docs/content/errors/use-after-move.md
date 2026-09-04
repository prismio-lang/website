---
title: Use after move
description: Fix Prismio ownership errors caused by reading a string, list, or struct after transfer or drop.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, ownership, move, drop]
related: [language/ownership-and-borrowing, language/functions, errors/move-from-borrow]
---

## Meaning

A move-only value was consumed by assignment, `sink`, container insertion, or `drop`, then used again.

Strings, lists, structs, and optional wrappers around owned reference-shaped values are move-only. Their binding can remain in lexical scope after transfer while no longer containing an accessible owned value.

## Why it happens

Assignment into another owner, a consuming function call, list insertion, or explicit destruction is sometimes mistaken for a copy. Adding `mut` does not change this: mutability and ownership are separate rules.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Point { x: Int, y: Int }
fn main() -> Int {
    let first = Point { x: 1, y: 2 }
    let second = first
    return first.x
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Point { x: Int, y: Int }
fn read(point: Point) -> Int { return point.x }
fn main() -> Int {
    let point = Point { x: 1, y: 2 }
    let x = read(point)
    return x + point.y
}
```

## Common fixes

Borrow through an ordinary parameter, delay the transfer until the last use, or read needed copyable fields before moving the owner.

If both destinations genuinely require independent data, construct two values through an application-defined operation; Prismio does not insert an implicit clone. If a callee only reads, remove `sink` from its contract. If it truly consumes, make the call the last use.

The earlier diagnostic note or source span should identify the operation that moved the value. Fix the ownership flow there rather than only changing the later read.
