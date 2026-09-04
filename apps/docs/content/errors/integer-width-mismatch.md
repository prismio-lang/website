---
title: Integer width mismatch
description: Fix Prismio operators applied to integers of different signedness or bit widths.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [error, integers, casts, operators]
related: [language/types, language/operators, errors/type-mismatch]
---

## Meaning

Binary arithmetic and bitwise operands must use compatible exact integer types. Prismio does not silently widen them.

Signedness matters as well as width. `Int` is signed 32-bit and is not interchangeable with `U32`; `Isize`/`Usize` vary with target pointer width.

## Why it happens

The error often appears when a fixed-width value crosses an API boundary, an unannotated literal receives an unexpected context, or a length/index type is mixed with ordinary `Int` arithmetic. Prismio avoids C-style promotion so the conversion decision stays visible.

## Invalid code

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let wide: I64 = 10
    let normal: Int = 5
    let result = wide + normal
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let wide: I64 = 10
    let normal: Int = 5
    let result = wide + normal as I64
    return result as Int
}
```

## Common fixes

Cast one operand to the other's type, or choose one width at the data boundary and use it consistently.

Prefer widening to a type that can represent both values. Before narrowing, validate the range in application logic. Parenthesize a cast when precedence could be unclear: `(small as Int) + normal`.

Do not fix a signedness mismatch merely by choosing the unsigned side if negative values are meaningful. Pick the domain type first, then convert deliberately.
