---
title: Container ownership transfer
description: Fix Prismio list insertion that reuses a moved element or moves from a borrowed parameter.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, list, container, ownership, sink]
related: [stdlib/lists, language/ownership-and-borrowing, errors/use-after-move]
---

## Meaning

An owned list takes ownership of a move-only element. Inserting the same owner again is a use after move; inserting an ordinary borrowed parameter attempts to move something the function does not own.

The container needs an owner for every move-only element it stores. A borrowed view cannot be silently promoted to owned data, and one owner cannot populate two positions.

## Why it happens

`list_push`, `list_set`, and `list_set_exclusive` are sometimes mistaken for copy operations. They copy scalar/enum/array elements, but transfer strings, structs, lists, and owned optional values. `list_set_exclusive` additionally reclaims the displaced boxed struct and is therefore accepted only while the List remains an unobserved local owner.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }
fn main() -> Int {
    let items: List<Item> = list_new()
    let item = Item { value: 1 }
    list_push(items, item)
    list_push(items, item)
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Item { value: Int }
fn hold(items: List<Item>, sink item: Item) { list_push(items, item) }
fn main() -> Int {
    let items: List<Item> = list_new()
    hold(items, Item { value: 1 })
    return list_len(items)
}
```

## Common fixes

Create a separate element for each insertion, or mark a helper parameter `sink` when it transfers ownership into the list.

If the helper should preserve the caller's value, redesign it to inspect rather than store, or construct a distinct element from copyable fields. Use `--verify` for lifecycle-sensitive replacement of owned list elements because destruction behavior remains experimental at that edge.
