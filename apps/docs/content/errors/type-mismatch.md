---
title: Type mismatch
description: Fix Prismio diagnostics where an initializer, argument, assignment, or return has the wrong type.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [error, type-mismatch, type-system]
related: [language/types, specification/type-system, errors/integer-width-mismatch]
---

## Meaning

An expression does not have the type required by its context. The diagnostic usually says `expected <type>, found <type>`.

The context can be a binding annotation, assignment destination, function argument, returned expression, struct field, array element, or list operation. Prismio checks the mismatch before code generation.

## Why it happens

Common causes are an incorrect annotation, selecting the wrong overload, returning a value from the wrong branch, confusing `T?` with `T`, or expecting implicit numeric/Boolean conversion. Nominal structs with identical fields are also distinct types.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count: Int = true
    return count
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let count: Int = 1
    return count
}
```

## Common fixes

Change the annotation, change the expression, or add a supported explicit `as` conversion. Do not assume implicit numeric or Boolean coercions.

Use `expect` rather than a cast for an optional reference. Construct a new struct explicitly rather than casting between nominal types. For numbers, check the source range before narrowing—the `as` operator states intent but does not validate external data.

## An empty literal with no type

`[]` has no element to infer a type from, so it takes its type from where it is written: an annotation, a struct field, or a function's return type. Anywhere else there is nothing to take it from:

```text
error[P4001]: cannot infer the element type of an empty literal
 --> empty.psm:2:14
  |
2 |     let v = []
  |              ^
  note: write the type: `let v: Vec<Int> = []` or `let v: [Int] = []`
```

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let v = []
    return 0
}
```

A call argument counts as "anywhere else": overloads are chosen from the argument types, so an argument cannot borrow its type from a parameter. Bind the empty value with a type first, then pass the name:

<!-- prismio-check: pass -->
```prismio
fn total(values: Vec<Int>) -> Int {
    let mut sum = 0
    for v in values {
        sum = sum + v
    }
    return sum
}

fn main() -> Int {
    let empty: Vec<Int> = []
    return total(empty)
}
```

## Compiler behavior

The diagnostic should identify both expected and actual types at the source operation. One earlier parse/name error can cause a cascade, so resolve earlier diagnostics first. See [integer width mismatch](/errors/integer-width-mismatch) for the most common numeric specialization.
