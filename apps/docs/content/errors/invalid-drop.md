---
title: drop requires an owned move-only value
description: Fix Prismio drop calls applied to arrays, scalars, enums, borrows, or other non-owned operands.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, drop, ownership, array]
related: [language/ownership-and-borrowing, language/arrays-and-lists, errors/move-from-borrow]
---

## Meaning

`drop` may consume an owned string, list, or struct. Copy-only values and borrowed values do not own a releasable allocation in this operation.

Arrays, integers, floats, booleans, characters, raw pointer scalar values, and fieldless enums use copy behavior under the current source model. A raw pointer address also does not prove ownership of its pointee.

## Why it happens

Code may try to imitate manual destruction from another language or may call `drop` inside a function whose ordinary parameter only borrows.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let values = [1, 2, 3]
    drop(values)
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Box { value: Int }
fn main() -> Int {
    let box = Box { value: 1 }
    drop(box)
    return 0
}
```

## Common fixes

Remove `drop` for copy-only data, or ensure the function receives ownership with `sink` before dropping a parameter.

For a foreign resource, use its declared compatible release operation and ownership contract rather than dropping the raw `Ptr`. Do not change a parameter to `sink` unless the function should truly consume the caller's value.
