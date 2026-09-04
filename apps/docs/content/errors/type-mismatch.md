---
title: Type mismatch
description: Fix Prismio diagnostics where an initializer, argument, assignment, or return has the wrong type.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
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

## Compiler behavior

The diagnostic should identify both expected and actual types at the source operation. One earlier parse/name error can cause a cascade, so resolve earlier diagnostics first. See [integer width mismatch](/errors/integer-width-mismatch) for the most common numeric specialization.
