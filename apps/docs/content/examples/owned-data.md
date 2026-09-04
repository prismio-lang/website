---
title: "Example: borrow and consume a struct"
description: A complete Prismio program demonstrating default borrowing, inout mutation, and a sink ownership transfer.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [example, ownership, struct, sink, inout]
related: [language/ownership-and-borrowing, language/functions, tutorials/data-model]
---

<!-- prismio-check: pass -->
```prismio
import std.io

struct Counter { value: Int }

fn read(counter: Counter) -> Int {
    return counter.value
}

fn bump(inout counter: Counter) {
    counter.value = counter.value + 1
}

fn finish(sink counter: Counter) -> Int {
    return counter.value
}

fn main() -> Int {
    let counter = Counter { value: 4 }
    println(read(counter))
    bump(counter)
    println(finish(counter))
    return 0
}
```

Expected output is `4` and then `5`. `counter` remains usable after `read` and `bump`, but not after `finish`.

## Call-by-call ownership

1. `Counter { value: 4 }` creates one owned struct.
2. `read(counter)` uses an ordinary parameter and therefore borrows it.
3. `bump(counter)` uses `inout`, mutating through an exclusive call-scoped borrow.
4. `finish(counter)` uses `sink`, transferring the owner to the final callee.

The caller writes no `&` or `&mut` operator. Parameter declarations determine borrow mode.

## Why `counter` does not need `mut`

The 0.1 compiler currently permits field assignment through a struct binding even when that binding was not declared `mut`; direct replacement of the `counter` binding would require `mut`. This is a documented version-specific edge and may be tightened later.

## Intentional failure

Adding `println(counter.value)` after `finish(counter)` produces a use-after-move diagnostic. Adding `mut` would not repair it because ownership, not reassignment permission, was transferred.

This example is a compact API-design template: ordinary parameter for observation, `inout` for caller-visible update, and `sink` for final ownership transfer.
