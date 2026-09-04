---
title: Region requires a name
description: Fix a Prismio AIF region block declared without its required identifier.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, region, aif, syntax]
related: [language/annotations, compiler/aif, errors/region-budget-exceeded]
---

## Meaning

Every `region` block requires an identifier so reports and placement constraints can refer to it.

The name also provides a stable local label in AIF explanations. It does not create a source namespace.

## Why it happens

The code used `region { ... }` as though the name were optional, perhaps following a proposal or another arena language.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    region { let value = 1 }
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    region work { let value = 1 }
    return 0
}
```

## Common fixes

Add a unique descriptive name immediately after `region`.

If a byte assertion is needed, place `pin(N)` after the name: `region request pin(4096) { ... }`. Region syntax and budget semantics are experimental, so keep compiler-version-sensitive tests.
