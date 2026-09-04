---
title: Multiple compiler errors
description: Understand Prismio's recovered diagnostics and final abort count after several independent errors.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, diagnostics, recovery, cascade]
related: [compiler/diagnostics, errors/type-mismatch, errors/unexpected-top-level-token]
---

## Meaning

The compiler recovered after earlier failures, reported several issues, then printed `aborting due to N previous errors`. The final line summarizes; it is not a separate source defect.

Recovery keeps later declarations visible enough to find independent errors, but malformed syntax can still cause cascades in types and names.

## Why it happens

The file contains multiple genuine mistakes, or one early structural problem changed how the parser understood the remainder.

## Invalid code

```prismio
fn main() -> Int {
    let count: Int = "wrong"
    return missing
}
```

## Correct code

```prismio
fn main() -> Int {
    let count: Int = 1
    return count
}
```

## Common fixes

Fix primary errors from top to bottom, then compile again. Later messages may disappear if they were cascades, but Prismio's semantic recovery is designed to keep independent diagnostics useful.

Do not search for a page named after the abort summary. Use the individual primary messages above it. When reporting a compiler bug, include the complete output so recovery order is visible.
