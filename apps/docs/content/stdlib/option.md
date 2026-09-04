---
title: Option and Result
description: The std.option module — Option<T> for absence, Result<T, E> for failure, and how they are represented.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-19"
tags: [standard-library, option, result, errors, generics]
related: [language/error-handling, language/enums, language/generics]
---

`std/option.psm` defines two generic enums and the functions that read them. Import it explicitly:

<!-- prismio-check: pass -->
```prismio
import std.option

fn main() -> Int {
    let found = Option.Some(7)
    let absent = Option<Int>.None
    return optionOr(found, 0) - optionOr(absent, 7)
}
```

## Option

```prismio
enum Option<T> {
    None,
    Some(T)
}
```

| Function | Meaning |
|---|---|
| `optionIsSome(o)` | Whether a value is present. |
| `optionIsNone(o)` | Whether it is absent. |
| `optionOr(o, fallback)` | The value, or `fallback`. |

`Option.Some(x)` infers `T` from `x`. `Option<Int>.None` must name it, because nothing in a `None` says what it would have carried.

## Result

```prismio
enum Result<T, E> {
    Err(E),
    Ok(T)
}
```

| Function | Meaning |
|---|---|
| `resultIsOk(r)` / `resultIsErr(r)` | Which variant it is. |
| `resultOr(r, fallback)` | The success value, or `fallback`. |
| `resultErrOr(r, fallback)` | The error value, or `fallback`. |

Both type arguments must be written at a construction site — `Result<Int, String>.Ok(v)` — because neither variant mentions both parameters.

## Matching

`match` is how a value comes out, and it must cover every variant or carry a `_` arm — see [exhaustiveness](/language/pattern-matching). There is deliberately no unchecked `unwrap`: `optionOr` and `resultOr` take a fallback, so the absent case is handled at the use site rather than deferred to a crash.

## Representation

A payload-carrying enum compiles to a **tagged struct**: a tag field followed by one field per payload slot. `Option<Int>` is `{ i32 tag, i32 payload }`.

Two consequences worth knowing:

- **The variants do not overlap.** A real tagged union stores every variant's payload in the same space, sized to the widest. That needs the size of a type, which 0.1 does not expose, so each payload slot gets its own field. `Option<T>` loses nothing by this — only one variant carries anything — while a many-armed enum with large payloads is larger than it needs to be.
- **These are owned, move-only values, not scalars.** `Option<Int>` is a struct, so it allocates and moves rather than being copied in a register. For a hot inner loop over scalars, `T?` or a plain sentinel is still cheaper.

**Variant order is part of the compiled form.** The tag is the variant's position in the declaration, so reordering the variants of an enum changes the tag that already-compiled code expects. Append variants; do not insert them.
