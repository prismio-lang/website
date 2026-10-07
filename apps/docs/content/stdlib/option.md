---
title: Optional functions and Result
description: The std.option module — the functions that read a T? (unwrapOr, expect with a message, map, andThen, okOr, and the call behind ??) and Result<T, E> for failure, with their methods and representation.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-07"
tags: [standard-library, option, optional, result, errors, generics]
related: [language/error-handling, language/enums, language/generics, language/closures]
---

`import std.option`. [`T?`](/language/optionals) is the language's own optional, and this module is what reads one beyond `== none`, `expect(o)` and a number's `unwrapOr`: the functions below work for every `T?`. `Result<T, E>` is a value or the error that stopped it: an ordinary generic enum with methods for the common ways of reading one.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.string

fn parsePort(text: String) -> Result<Int, String> {
    let n = text.parseInt()
    if (n == none) { return Result<Int, String>.Err("not a number: " + text) }
    let v = expect(n)
    if (v > 0 and v < 65536) { return Result<Int, String>.Ok(v) }
    return Result<Int, String>.Err("out of range: " + text)
}

fn main() {
    let given: Int? = 8080
    println(given.map(|p: Int| p + 1).unwrapOr(80))  // 8081
    println(given ?? 80)                             // 8080

    let port = parsePort("443")
    println(port.isOk)                               // true
    println(port.unwrapOr(80))                       // 443

    let next = parsePort("21").andThen(|p: Int| parsePort((p * 2).toString()))
    println(next.expect("a port"))                   // 42

    let asOptional = parsePort("22").ok()
    println(asOptional.unwrapOr(80))                 // 22
}
```

## Reading a `T?`

| On a `T?` | Returns |
|---|---|
| `o ?? fallback` | the value, or `fallback` when it is `none`; the fallback is evaluated only then (it is the call `optionCoalesce(o, fallback)`) |
| `o.unwrapOr(fallback)` | the value, or `fallback` when there is none (a number's `T?` needs no import for this one) |
| `o.expect(message)` | the value, or a [panic](/language/error-handling#when-the-program-cannot-go-on) with `message` when there is none |
| `o.okOr(error)` | `Result<T, E>`: `Ok` of the value, or `Err(error)` |
| `o.map(f)` | `U?`: `f` of the value, or `none` |
| `o.andThen(f)` | `U?`: `f` of the value, where `f` itself returns a `U?`; or `none` |

They are ordinary generic functions whose first parameter is a `T?`, so `o.unwrapOr(x)` and `unwrapOr(o, x)` are one call. There is no `isSome` or `isNone`: `o != none` and `o == none` say it, and say it without an import. And there is no `Option<T>` to wrap a value in; see [Optionals](/language/optionals).

`expect(o)` with no message is the compiler's, and needs no import: it stops with the line it was written on. `o.expect("message")` is this module's, and it makes you say why the value had to be there:

```text
panic: PORT must be a number
  --> .../stdlib/option.plib:...
```

The location printed is `expect`'s own line inside the standard library, not your call, so make the message specific enough to find the call by. The process exits with status 101.

**There is deliberately no bare `unwrap`.** `unwrapOr` and `??` take a fallback, so the absent case is handled where the value is used, and `expect` stops the program only after saying why.

### `map` and `andThen` take a closure

`map` changes the value inside and leaves an absent one absent; `andThen` runs a step that can itself be absent. Both take a [closure](/language/closures), and the result's type is whatever the closure returns — `given.map(|p: Int| p.toString())` is a `String?` with nothing written to say so. That comes from the closure bound in their signatures:

```prismio
fn map<T, U, F: Fn(T) -> U>(o: T?, f: F) -> U?
```

`U` appears only in the result, so it is solved from the closure's return type. The same bound is available to your own functions; see [closure bounds](/language/closures#closure-bounds). A closure whose parameter does not match is refused with both signatures:

```text
error[P4001]: this closure is `Fn(String) -> String`, and `map` needs `Fn(Int) -> String`
```

A `T?` parameter takes its `T` from an **optional** argument and only from one, so `a.map(f)` on something that is not an optional is never read as this module's `map`.

## Result

```prismio
enum Result<T, E> {
    Err(E),
    Ok(T)
}
```

| On a `Result<T, E>` | Returns |
|---|---|
| `r.isOk`, `r.isErr` | `Bool`; [properties](/language/methods#properties), read without parentheses |
| `r.unwrapOr(fallback)` | the success value, or `fallback` for an error |
| `r.expect(message)` | the success value, or a panic with `message` for an error |
| `r.ok()` | `T?`: the value, dropping the error |
| `r.err()` | `E?`: the error, dropping the value |
| `r.map(f)` | `Result<U, E>`: `Ok(f(value))`, or the error unchanged |
| `r.mapErr(f)` | `Result<T, G>`: the value unchanged, or `Err(f(error))` |
| `r.andThen(f)` | `Result<U, E>`: `f(value)`, where `f` itself returns a `Result`; or the error unchanged |

The functions remain here too: `resultIsOk(r)`, `resultIsErr(r)`, `resultOr(r, fallback)` and `resultErrOr(r, fallback)`.

Neither variant mentions both parameters, so a construction takes them from its context: `return Result.Ok(v)` in a function declared `-> Result<Int, String>`. With no context, write them: `Result<Int, String>.Ok(v)`.

`match` is the general way a `Result` comes out, and it must cover every variant or carry a `_` arm — see [exhaustiveness](/language/pattern-matching). **Bind a call's result before you match it.** `match (parse(key)) { ... }` compiles, but leaks the `Result` on every call; `let parsed = parse(key)` and then `match (parsed)` releases it.

## Representation

A payload-carrying enum compiles to a **tagged struct**: a tag field followed by one field per payload slot. `Result<Int, String>` is a tag and one field for each of its two payloads.

Two consequences worth knowing:

- **The variants do not overlap.** A real tagged union stores every variant's payload in the same space, sized to the widest. That needs the size of a type, which 0.1 does not expose, so each payload slot gets its own field.
- **These are owned, move-only values, not scalars.** A `Result` is a struct, so it allocates and moves rather than being copied in a register. A `T?` of a number is copied and allocates nothing, and a reference's is the pointer itself.

**Variant order is part of the compiled form.** The tag is the variant's position in the declaration, so reordering the variants of an enum changes the tag that already-compiled code expects. Append variants; do not insert them.

## Limits

- **Moving a payload into a new enum can leak it.** `map` and `andThen` on a `Result`, which move the error along, and `mapErr`, put a payload into a new enum. The compiler never frees it twice. Where it cannot prove the original gives the payload up, it keeps the original alive instead, which is a leak. `--verify` shows it, as `leaked` with 0 violations.
- **No `?` operator.** Propagating an error is a `match` that returns the `Err`, or `andThen`.
- **No `unwrapOrElse`, `filter`, `zip`, `flatten` or `or` on a `T?`.** `??` is the `or`.
