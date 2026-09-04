---
title: Error handling
description: Signalling failure in Prismio with Result and Option instead of sentinel return values.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-19"
tags: [errors, result, option, enums]
related: [stdlib/option, language/enums, language/optionals, language/generics]
---

Prismio has no exceptions, no `try`/`catch`, and no propagation operator. Failure is a value: a function that can fail returns [`Result<T, E>`](/stdlib/option), and a function whose answer may be absent returns `Option<T>`.

Both are ordinary generic enums with payload-carrying variants, defined in `std/option.psm`. Nothing about them is built into the compiler.

<!-- prismio-check: pass -->
```prismio
import std.io

import std.option

fn half(n: Int) -> Result<Int, String> {
    if (n % 2 != 0) { return Result<Int, String>.Err("odd") }
    return Result<Int, String>.Ok(n / 2)
}

fn main() -> Int {
    match (half(10)) {
        Result.Ok(v) => { return v - 5 }
        Result.Err(e) => { println(e) return 1 }
    }
    return 1
}
```

## Why not a sentinel

Before these types, a failing function returned `-1`, `0`, or an empty string, and nothing in the signature said so. Nothing obliged a caller to check, and nothing distinguished a legitimate `-1` from a failure.

`Result<T, E>` makes the failure case part of the type. `match` is the only way to read the value out, so the error arm cannot be skipped by accident.

## Option is not the same as `T?`

[Optionals](/language/optionals) (`T?`) predate `Option<T>` and remain the right tool for a *reference* that may be absent — an optional struct link, a string that may be missing. They cost nothing: absence is the null pointer.

`Option<T>` works for **every** type, including scalars. `Int?` is rejected by the language, because an integer has no spare representation to mean "absent"; `Option<Int>` carries a separate tag, so it can.

Use `T?` for reference fields, and `Option<T>` when the type is a scalar or a type parameter.

## Propagation is manual

There is no `?` operator. A caller that wants to forward an error writes the match:

```prismio
match (half(n)) {
    Result.Err(e) => { return Result<Int, String>.Err(e) }
    Result.Ok(v) => { doubled = v * 2 }
}
```

A propagation operator needs a defined interaction with ownership and with cleanup during a non-local exit. Neither is specified, so the syntax is not provided rather than provided provisionally.

## Limits in 0.1

- **No `unwrap`.** `optionOr` and `resultOr` take a fallback. There is deliberately no unchecked accessor, since the point of the type is that the absent case is handled at the use site.
- **Type arguments cannot always be inferred.** `Option.Some(5)` infers `T`, but `Result.Ok(5)` cannot infer `E` — nothing in the argument mentions it — so it must be written as `Result<Int, String>.Ok(5)`. The compiler says so by name.
- `throw` is still reserved by the lexer and is not parsed.
