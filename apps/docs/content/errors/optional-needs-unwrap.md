---
title: Optional value needs unwrap
description: Fix Prismio member access on T? by checking and unwrapping with expect.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, optional, none, expect]
related: [language/optionals, language/structs, specification/type-system]
---

## Meaning

An optional struct `T?` is not itself a struct value, because it may be `none`. Member access requires `T`.

The same principle applies to other operations that require the underlying reference-shaped type. Optionality is part of the static type until `expect` checks presence.

## Why it happens

Comparing a value with `none` does not flow-narrow it in 0.1. Syntax such as optional chaining, postfix force unwrap, or `if let` is not implemented, so code copied from another language will not remove `?`.

## Invalid code

<!-- prismio-check: fail -->
```prismio
struct Node { id: Int, parent: Node? }
fn main() -> Int {
    let node = Node { id: 1, parent: none }
    return node.parent.id
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
struct Node { id: Int, parent: Node? }
fn parent_id(node: Node) -> Int {
    if (node.parent == none) { return 0 }
    return expect(node.parent).id
}
fn main() -> Int { return 0 }
```

## Common fixes

Handle `none`, then call `expect`. A preceding comparison does not flow-narrow the optional automatically.

Store the unwrapped value in a local when it is used more than once. Use `expect` only after absence has been handled or at an intentional fail-fast boundary; `expect(none)` terminates at runtime and cannot be caught as a language exception.

Wrapping a move-only value in `T?` preserves its ownership. Unwrapping does not make the original owner freely copyable.
