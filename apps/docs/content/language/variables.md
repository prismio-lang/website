---
title: Variables and bindings
description: Declare local and global bindings, type annotations, mutability, shadowing, and initialization in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [variables, let, mutability, scope]
related: [language/types, language/control-flow, errors/immutable-assignment]
---

`let` introduces a named binding. A binding associates a name with a type, storage, and—when the type is move-only—an ownership state. Supply an initializer, a type annotation, or both.

```prismio
let count = 3
let name: String = "Prismio"
let mut total: Int = 0
```

The compiler infers `count` as `Int` and `name` as `String`. In `total`, the annotation fixes the type and the initializer must be assignable to it.

The declaration shape is:

```text
let [mut] [unique] [pin(Tn)] name [: Type] [= expression]
```

`unique` and `pin(Tn)` belong to the experimental Allocation Inference Framework. See [memory annotations and regions](/language/annotations) before using them in production code.

## Type inference and annotations

An initializer normally provides enough information for a local type:

```prismio
let enabled = true
let ratio = 1.5
let values = [1, 2, 3]
```

Use an annotation when the intended type differs from the literal default, when declaring an optional `none`, or when the type makes an interface clearer.

```prismio
let port: U16 = 8080
let bytes: [U8] = [80, 83, 77]
let pointer: Ptr? = none
```

An annotation without an initializer is accepted by the current compiler and allocates storage, but 0.1 does not implement a complete definite-initialization analysis for later reads. Prefer initializing a binding at its declaration. Reading annotation-only storage before assigning it can expose unspecified backend data and should not be used as a language feature.

## Immutability and reassignment

Bindings are immutable by default. `mut` permits direct assignment and compound assignment.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count = 1
    count = 2
    return count
}
```

The compiler reports `cannot assign to immutable variable 'count'`.

`mut` controls reassignment of the binding itself:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut total = 1
    total += 4
    total = total * 2
    return total
}
```

Compound assignment is supported for a plain mutable binding. It is not currently a general place-expression feature, so use `item.field = item.field + 1` instead of `item.field += 1`, and read-modify-write an indexed element with the relevant collection operation.

Struct field assignment has a notable 0.1 behavior: the compiler permits it even when the containing binding lacks `mut`. Directly replacing that binding still requires `mut`. This distinction is documented for compatibility, but may be tightened in a future language version.

## Scope and shadowing

Bindings have lexical block scope. A binding declared inside a function, `if` arm, loop, region, or match arm is not visible outside that block.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let value = 10
    if (value > 0) {
        let value = value + 5
        println(value)
    }
    return value
}
```

The inner declaration shadows the outer name. Its initializer is evaluated before the new binding becomes active, so the right-hand `value` refers to the outer binding. When the block ends, the outer `value` is visible again.

Shadowing creates a new binding; it does not mutate or revive an old one. Ownership checks apply to the specific binding selected by name resolution.

## Global bindings

`let` declarations may appear at the top level. Global initializers must be static literal values supported by the compiler; arbitrary function calls and runtime expressions cannot initialize a global.

<!-- prismio-check: pass -->
```prismio
let mut requests: Int = 0
let service_name: String = "prismio"

fn record_request() {
    requests += 1
}

fn main() -> Int {
    record_request()
    return requests - 1
}
```

Globals share the flattened program namespace after imports are resolved. A mutable global can be assigned by a function. Prefer passing state explicitly where practical: global mutation makes ownership, initialization order, and foreign integration harder to reason about.

<!-- prismio-check: fail -->
```prismio
fn initial() -> Int { return 3 }
let count: Int = initial()

fn main() -> Int { return count }
```

This program is rejected because the global initializer is a call rather than a supported static literal.

## Ownership state

Strings, lists, and structs add an ownership state to ordinary scope and mutability rules. Moving a value into another owned location, passing it to a `sink` parameter, inserting it into an owning list, or calling `drop` consumes the source binding.

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    let first = "hello"
    let second = first
    println(second)
    println(first)
    return 0
}
```

The final call tries to read `first` after its string has moved to `second`. Declaring `first` as `mut` would not change the ownership rule. Read [ownership and borrowing](/language/ownership-and-borrowing) for parameter modes and legal transfer patterns.

## Rules summary

- A binding needs an initializer, an annotation, or both.
- An initializer must have the declared type; numeric coercions are not implicit.
- Direct reassignment and compound assignment require `mut`.
- A binding is visible only in its lexical scope and may shadow an outer name.
- Global initialization is restricted to supported static literals.
- Move-only bindings cannot be read after consumption.
- Annotation-only local storage exists in 0.1, but reading it before explicit assignment is not a supported safe pattern.

For type spelling and conversion rules, continue to [types](/language/types). For diagnostics, see [immutable assignment](/errors/immutable-assignment) and [use after move](/errors/use-after-move).
