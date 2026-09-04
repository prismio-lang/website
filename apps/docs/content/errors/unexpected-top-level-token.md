---
title: Expected a declaration
description: Fix unexpected tokens at Prismio top level and understand parser recovery.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, syntax, parser, declaration]
related: [language/lexical-structure, specification/grammar, errors/unclosed-block]
---

## Meaning

The parser found a token that cannot begin a top-level import, binding, function, external function, struct, or enum declaration.

Top-level expressions and calls are not initialization scripts. Executable statements belong inside a function such as `main`.

## Why it happens

Common causes are a stray literal/operator, unsupported semicolon, missing brace that ended a declaration early, proposed syntax for a Coming Soon feature, or a call placed directly in the file.

## Invalid code

<!-- prismio-check: fail -->
```prismio
9
fn main() -> Int { return 0 }
```

## Correct code

<!-- prismio-check: pass -->
```prismio
let value = 9
fn main() -> Int { return value }
```

## Common fixes

Put executable expressions inside a function, complete the preceding declaration, or remove stray punctuation. The parser synchronizes at later declaration starters and may report more than one top-level error.

Fix the earliest structural error first. `trait`, `impl`, and `throw` are reserved tokens but do not begin supported 0.1 declarations/statements.
