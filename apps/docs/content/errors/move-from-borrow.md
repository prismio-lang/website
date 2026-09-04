---
title: Cannot move from a borrowed value
description: Fix Prismio code that drops or transfers ownership from an ordinary borrowed parameter.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, borrow, sink, ownership]
related: [language/ownership-and-borrowing, language/functions, errors/container-ownership]
---

## Meaning

Ordinary move-only parameters are borrowed. A function cannot drop them or transfer them into another owner.

The caller remains responsible for a default-borrowed value after the call. Allowing the callee to consume it would violate that signature contract.

## Why it happens

A helper may have evolved from observation to storage/destruction without changing its parameter mode. Container insertion also needs ownership, so pushing an ordinary borrowed struct/string/list triggers the same class of error.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }
fn consume(item: Item) { drop(item) }
fn main() -> Int {
    consume(Item { value: 1 })
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Item { value: Int }
fn consume(sink item: Item) { drop(item) }
fn main() -> Int {
    consume(Item { value: 1 })
    return 0
}
```

## Common fixes

Add `sink` when consumption is the function's contract, or stop consuming and keep the ordinary borrowed parameter.

Use `inout` instead when the callee needs caller-visible mutation but not ownership. Do not add `sink` solely to silence the diagnostic: doing so invalidates the caller's binding and is a public API change.
