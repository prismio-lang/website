---
title: Cannot return a local array
description: Fix Prismio functions that return stack-array storage created in their own frame.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-25"
tags: [error, array, slice, lifetime, return]
related: [language/arrays-and-lists, language/lifetimes, specification/memory-model]
---

## Meaning

Array literals are stack allocated. Returning a local array would expose storage after its function frame ends.

Although arrays use copy behavior in ordinary local assignment, the current source type/lowering does not provide a caller-owned return representation for a local stack array.

## Why it happens

`[T]` resembles an ordinary value type, but its length is tied to initializer/compiler storage rather than a source-spelled fixed-size ABI. The escape check prevents a dangling frame reference.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn make() -> [Int] {
    let values = [1, 2, 3]
    return values
}
fn main() -> Int { return 0 }
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn first() -> Int {
    let values = [1, 2, 3]
    return values[0]
}
fn main() -> Int { return first() }
```

## Common fixes

Consume the array inside the function, return a copyable element/result, or use an owned list when data must escape.

When the caller already owns a `List<T>`, a function may instead return a `Slice<T>` that views a
bounded range of that list. A Slice cannot view a local stack array, and it is not an FFI
output-buffer ABI. Do not use `Ptr` casts to bypass the lifetime check.
