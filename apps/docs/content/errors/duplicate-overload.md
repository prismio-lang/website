---
title: Duplicate function overload
description: Fix Prismio functions that repeat the same name and parameter types.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, functions, overloads, duplicate]
related: [language/functions, specification/name-resolution, errors/wrong-arity]
---

## Meaning

Two functions have the same name and exact parameter-type sequence. Parameter names and return types do not distinguish overloads.

The conflict is checked after imports are flattened, so the duplicate definitions may originate in different files. File paths do not create namespaces.

## Why it happens

Renaming a parameter does not change the callable signature. Changing only the return type also cannot work because a call must be selected before its result context is used.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn choose(value: Int) -> Int { return value }
fn choose(other: Int) -> Int { return other + 1 }
fn main() -> Int { return choose(1) }
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn choose(value: Int) -> Int { return value }
fn choose(value: Float) -> Int { return value as Int }
fn main() -> Int { return choose(1) }
```

## Common fixes

Remove or rename one definition, or change its parameter arity/types to represent a real overload.

If the functions express different operations, distinct names are usually clearer than artificial parameter differences. If the duplicate came from imports, remove the redundant declaration or reorganize names; import aliases and module qualifiers are not available in 0.1.
