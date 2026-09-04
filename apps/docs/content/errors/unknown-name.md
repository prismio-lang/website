---
title: Unknown identifier
description: Fix Prismio names that are misspelled, undeclared, outside their lexical scope, or absent from imports.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, identifier, scope, imports]
related: [language/variables, language/modules, specification/name-resolution]
---

## Meaning

No visible declaration matches the identifier at that source location.

Lookup considers lexical bindings, flattened top-level declarations, fields in the receiver's nominal type, and qualified enum variants according to the syntactic context.

## Why it happens

The name may be misspelled, used before declaration, outside its block, absent from the resolved import set, or incorrectly qualified as though file imports created namespaces.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    if (true) { let inner = 42 }
    return inner
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let inner = 42
    if (true) { println(inner) }
    return inner
}
```

## Common fixes

Correct the spelling, move the declaration to an enclosing scope, or add the local source import that contains the top-level declaration.

For imports, resolve dots beneath the entry file's directory and remember wildcard imports are non-recursive. Imported names are used directly, not as `module.name`. Fix earlier parse errors first because recovery can make later declarations appear missing.
