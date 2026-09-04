---
title: Region budget exceeded
description: Fix a Prismio region pin(bytes) whose converged AIF estimate exceeds the asserted memory budget.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, region, budget, aif]
related: [language/annotations, compiler/aif, errors/refuted-pin]
---

## Meaning

Converged analysis estimates that a named region needs more bytes than its asserted `pin(N)` budget.

The budget is a compile-time AIF assertion for that region, not a process-wide memory limit or a request to truncate allocation.

## Why it happens

Allocation sites were added, inferred sizes increased, ownership now keeps data in the region longer, or an earlier budget was chosen without analysis evidence.

## Invalid code

```prismio
fn main() -> Int {
    region work pin(1) {
        let text = "allocation"
        println(text)
    }
    return 0
}
```

Whether a minimal illustration exceeds the budget depends on inference details; the diagnostic is issued only after a converged estimate proves the claim false.

## Correct code

```prismio
fn main() -> Int {
    region work {
        let text = "allocation"
        println(text)
    }
    return 0
}
```

## Common fixes

Remove the budget, increase it using measured evidence, reduce region allocations, or split work across regions. Do not use the budget as an optimization hint; it is an assertion.

Opaque foreign allocations and runtime overhead may not be included, so passing the compiler budget is not proof of total peak memory. Record the compiler/AIF version with budget-sensitive tests.
