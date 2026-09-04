---
title: Unreachable code
description: Fix Prismio statements that can never execute after return or another terminator.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, unreachable, control-flow, return]
related: [language/control-flow, language/functions, errors/missing-return]
---

## Meaning

A statement follows control flow that cannot continue, most commonly an unconditional `return` in the same block.

Other terminators include `break` and `continue` in their valid loop positions, or control flow proven never to fall through. Rejecting unreachable statements prevents dead ownership actions and stale code from hiding behind a terminator.

## Why it happens

A return was inserted above existing code, branches were simplified, or a copied statement was placed after an unconditional loop transfer.

## Invalid code

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    return 0
    println("never")
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("before")
    return 0
}
```

## Common fixes

Delete or move the unreachable statement, or restructure the branch so control can reach it.

Do not weaken a correct early return solely to retain dead code. If the statement belongs on another path, place it before the terminator or inside the appropriate conditional branch.
