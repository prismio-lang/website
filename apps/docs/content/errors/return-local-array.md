---
title: Cannot return a local array
description: Fix Prismio functions that return stack-array storage created in their own frame.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [error, array, slice, lifetime, return]
related: [language/arrays-and-lists, language/lifetimes, specification/memory-model]
---

## Meaning

Array literals are stack allocated. Returning a local array would expose storage after its function frame ends.

Although a local array is copied by `let` and by assignment, 0.1 has no way to hand one back by value: the caller would need storage of the array's length, and a length in a return type is not accepted yet.

## Why it happens

`[T]` resembles an ordinary value type, but its storage belongs to the frame that declared it. Returning arrays by value, as `Array<T, N>`, is planned. Until then the escape check prevents a dangling frame reference.

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

Consume the array inside the function, return a copyable element/result, or use a `Vec<T>` when data must escape.

To produce an array's contents in another function, let the caller own the storage and fill it through a `[T]` parameter, which writes the caller's array:

<!-- prismio-check: pass -->
```prismio
fn fill(out: [Int]) {
    out[0] = 1
    out[1] = 2
}

fn main() -> Int {
    let values: Array<Int, 2>
    fill(values)
    return values[0] + values[1] - 3
}
```

When the caller already owns a `Vec<T>`, a function may instead return a `Slice<T>` that views a
bounded range of that Vec. A Slice cannot view a local stack array, and it is not an FFI
output-buffer ABI. Do not use `Ptr` casts to bypass the lifetime check.
