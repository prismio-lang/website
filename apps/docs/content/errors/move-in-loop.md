---
title: Move inside a loop
description: Fix Prismio ownership transfers that would repeat for an outer binding across loop iterations.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, ownership, loop, move]
related: [language/ownership-and-borrowing, language/control-flow, errors/use-after-move]
---

## Meaning

A loop consumes a move-only binding declared before the loop. A later iteration would try to consume it again.

The compiler rejects the repeating ownership path conservatively even when a branch seems likely to run only once. The source loop still permits another iteration unless control flow proves otherwise under the implemented analysis.

## Why it happens

Typical consuming operations are `drop`, assignment into an owned location, list insertion, and calls to `sink` parameters.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Box { value: Int }
fn main() -> Int {
    let box = Box { value: 1 }
    let mut i = 0
    while (i < 3) {
        drop(box)
        i += 1
    }
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
import std.io

struct Box { value: Int }
fn read(box: Box) -> Int { return box.value }
fn main() -> Int {
    let box = Box { value: 1 }
    for i in 0..3 { println(read(box) + i) }
    drop(box)
    return 0
}
```

## Common fixes

Borrow inside the loop, create a fresh owned value each iteration, or move/drop once after leaving the loop.

If only one iteration should consume, restructure the control flow so the transfer occurs after the loop chooses a result. If every iteration needs ownership, construct a distinct owned value inside the loop. Adding `mut` does not allow repeated ownership transfer.
