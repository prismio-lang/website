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

A function declared `-> [T]` returns a view — the address of elements someone else stores — so a local array cannot leave through it. To hand one back, declare the length: `-> Array<T, N>` returns the array by value, and the caller gets storage of its own.

## Why it happens

`[T]` resembles an ordinary value type, but its storage belongs to the frame that declared it. Without a length in the return type there is nothing to copy it into, and the escape check prevents a dangling frame reference.

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
fn make() -> Array<Int, 3> {
    let values = [1, 2, 3]
    return values
}
fn main() -> Int {
    let values = make()
    return values[2] - 3
}
```

## Common fixes

Declare the length in the return type, `-> Array<T, N>`, when the elements own nothing: the array is returned by value. Otherwise consume the array inside the function, return a copyable element or result, or use a `Vec<T>` when the data must escape.

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
