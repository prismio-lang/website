---
title: Container ownership transfer
description: Fix a Prismio Vec insertion that reuses a moved element or moves from a borrowed parameter.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [error, vec, container, ownership, sink]
related: [stdlib/vec, language/ownership-and-borrowing, errors/use-after-move]
---

## Meaning

A Vec takes ownership of a move-only element. Inserting the same owner again is a use after move; inserting an ordinary borrowed parameter attempts to move something the function does not own.

The container needs an owner for every move-only element it stores. A borrowed view cannot be silently promoted to owned data, and one owner cannot populate two positions.

## Why it happens

`push`, `insert` and `set` are sometimes mistaken for copy operations. They copy scalar/enum/array elements, but transfer strings, structs, vectors, and owned optional values. `list_set_exclusive`, the runtime-layer replacement, additionally reclaims the displaced boxed struct and is therefore accepted only while the Vec remains an unobserved local owner.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }
fn main() -> Int {
    let items: Vec<Item> = []
    let item = Item { value: 1 }
    items.push(item)
    items.push(item)
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Item { value: Int }
fn hold(items: Vec<Item>, sink item: Item) { items.push(item) }
fn main() -> Int {
    let items: Vec<Item> = []
    hold(items, Item { value: 1 })
    return items.length - 1
}
```

## Common fixes

Create a separate element for each insertion, or mark a helper parameter `sink` when it transfers ownership into the Vec.

If the helper should preserve the caller's value, redesign it to inspect rather than store, or construct a distinct element from copyable fields. Use `--verify` for lifecycle-sensitive replacement of owned Vec elements because destruction behavior remains experimental at that edge.
