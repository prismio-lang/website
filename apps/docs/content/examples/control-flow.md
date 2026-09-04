---
title: "Example: classify a range"
description: A complete Prismio program using a half-open for range, modulo, conditions, and mutable accumulation.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [example, loop, if, modulo]
related: [language/control-flow, language/operators, tutorials/first-program]
---

The range `1..11` visits 1 through 10. This program sums the even values.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let mut total = 0
    for value in 1..11 {
        if (value % 2 == 0) {
            total += value
        }
    }
    println(total)
    return 0
}
```

Expected output: `30`.

## Why it works

`total` is declared `mut` because compound assignment changes the binding. The `for` range is half-open, so the end value `11` is excluded. `% 2` computes the remainder and `== 0` produces the Boolean required by `if`.

The compiler infers each ordinary integer as `Int`, keeping `%`, `==`, and `+=` on compatible exact types. Mixing `U8` or `I64` into the expression would require explicit casts.

## Variation: count matches

Replace `total += value` with `total += 1` to count even values rather than sum them. The expected result becomes `5`. This variation preserves the same control-flow structure while changing only the accumulator invariant.

## Boundaries demonstrated

- `for value in 1..11` is an integer range, not collection iteration.
- `if` is a statement and does not return the selected value.
- The condition must be `Bool`; `if (value % 2)` is invalid.
- Loop and branch bodies establish nested lexical scopes.
- `return 0` reports success separately from printed program output.
