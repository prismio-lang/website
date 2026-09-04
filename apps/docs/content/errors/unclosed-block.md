---
title: Unclosed block
description: Fix a Prismio opening brace that reaches end of file without a matching closing brace.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, syntax, block, brace]
related: [specification/grammar, language/control-flow, errors/unexpected-top-level-token]
---

## Meaning

A `{` starts a function, control-flow, match-arm, region, struct, or enum block and no matching `}` appears before end of file.

One missing brace can make the parser treat later declarations as nested statements and create several follow-up diagnostics.

## Why it happens

Nested `if`, loop, match-arm, and struct literals can make visual pairing difficult, especially after code is moved. Prismio has no semicolon-based recovery boundary to compensate for an open block.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    return 0
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    return 0
}
```

## Common fixes

Add the missing closing brace at the correct nesting level. The diagnostic span points to the block's opening brace.

Indent nested blocks consistently and recompile after fixing the first unmatched brace. Do not append a brace blindly at end of file if the intended block should have closed earlier.
