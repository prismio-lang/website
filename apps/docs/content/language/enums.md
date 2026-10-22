---
title: Enums
description: Define enums with payloads, struct variants, explicit discriminants and representation types, and codesets for aliased numeric constants.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-22"
tags: [enums, variants, nominal-types]
related: [language/pattern-matching, language/types, language/conversions, language/modules, specification/evaluation]
---

Enums declare a closed set of fieldless variant names. They are useful for readable states, tags, and small result categories that carry no attached payload. Each enum is a type of its own: a `Color` is always one of `Color`'s variants, never an arbitrary number.

<!-- prismio-check: pass -->
```prismio
enum Color {
    Red,
    Green,
    Blue
}

fn main() -> Int {
    let color = Color.Green
    if (color == Color.Green) { return 0 }
    return 1
}
```

## Declaration and construction

An enum declaration contains variant names separated by commas:

```prismio
enum ConnectionState {
    Disconnected,
    Connecting,
    Connected
}
```

Select a value with `EnumName.VariantName`:

```prismio
let state: ConnectionState = ConnectionState.Connecting
```

The enum name qualifies and validates a variant, and the variant has the enum's type. An `Int` is not a `Color`, and one enum is not another: `let c: Color = 1`, an `Int` passed for a `Color` and a `LeftState` assigned to a `RightState` are all refused.

<!-- prismio-check: fail -->
```prismio
enum LeftState { Ready, Waiting }
enum RightState { Ready, Waiting }

fn main() -> Int {
    let left: LeftState = LeftState.Missing
    return 0
}
```

The declaration has no `Missing` variant, so the selection is rejected.

## Visibility

An enum carries a visibility marker, written before `enum`, with the levels a [function](/language/modules#visibility) and a [struct](/language/structs#visibility) have: `public` is everywhere, `internal` the declaring package, `private` the declaring file. **An enum is `internal` unless marked**, so a type is a closed box until its author opens it.

<!-- prismio-check: pass -->
```prismio
public enum Mode { Fast, Slow }

internal enum Phase { Warm, Hot }

private enum Scratch { Used, Free }

fn main() -> Int {
    let mode = Mode.Slow
    let phase: Phase = Phase.Hot
    let scratch = Scratch.Free
    if (mode == Mode.Slow and phase == Phase.Hot and scratch == Scratch.Free) { return 0 }
    return 1
}
```

`Mode` is nameable from any file, `Phase` from files in the same package, and `Scratch` only from the file that declares it. A variant takes its enum's level, so there is nothing to mark on one: writing `Scratch.Used` names `Scratch`. The rule is the same for an enum with payloads and for a generic one, `public enum Result<T, E>`.

Naming an enum you cannot see is a compile error that says which level stops you and what to write. It is raised wherever the name is used: in a type annotation, where a variant is built (`Mode.Fast`), and in a `match` arm that names a variant. A value of a hidden enum can still reach a file that cannot name it, because a `public` function may return it; that file can hold the value and pass it on, but cannot annotate it, build another one, or write an arm for it.

## Numbers and enums

`c as Int` is a variant's value: its zero-based ordinal, or the number it was given when the enum has [discriminants](#discriminants-and-representation). The way back is the [checked conversion](/language/conversions#into-an-enum) `n as Color?`: the variant with that ordinal, or `none` when there is none. A plain `n as Color` is an error that names `as Color?`, because `n` might be no variant at all.

<!-- prismio-check: pass -->
```prismio
import std.io

enum Color { Red, Green, Blue }

fn main() -> Int {
    println(Color.Blue as Int)               // 2
    let saved = 1
    let restored = saved as Color?
    println(restored == Color.Green as Color?) // true
    println(9 as Color? == none)             // true
    return 0
}
```

<!-- prismio-check: fail -->
```prismio
enum Color { Red, Green }

fn main() -> Int {
    let c = 7 as Color
    return 0
}
```

The error is `an Int might not be a Color; write `as Color?` and handle `none``.

## Comparison and copying

Enum values can be compared with `==` and `!=`. They are copyable, so assigning or passing one does not move the source binding.

<!-- prismio-check: pass -->
```prismio
enum Mode { Development, Production }

fn is_production(mode: Mode) -> Bool {
    return mode == Mode.Production
}

fn main() -> Int {
    let first = Mode.Production
    let second = first
    if (is_production(first) and second == Mode.Production) {
        return 0
    }
    return 1
}
```

Ordering comparisons are not the public way to compare semantic enum states. Use equality or a `match`, even though the current backend representation is integer-like.

## Matching

`match` selects enum variants. Since a value of the enum is always one of its variants, a `match` that names every variant is **exhaustive** without a `_` arm, and a function whose arms all return needs nothing after the `match`:

<!-- prismio-check: pass -->
```prismio
enum ConnectionState {
    Disconnected,
    Connecting,
    Connected
}

fn code(state: ConnectionState) -> Int {
    match (state) {
        ConnectionState.Disconnected => { return 1 }
        ConnectionState.Connecting => { return 2 }
        ConnectionState.Connected => { return 3 }
    }
}

fn main() -> Int {
    return code(ConnectionState.Connected) - 3
}
```

A `match` naming only some variants is still allowed; it runs no arm for the others. Match is statement-form in 0.1, so store a selected result in a mutable binding or return inside arms.

## Discriminants and representation

An enum can say what integer it is stored as, and what number each variant has. The type goes after the name; a number goes after a variant, with `=`:

<!-- prismio-check: pass -->
```prismio
import std.io

enum HttpStatus: U16 {
    Ok = 200,
    NotFound = 404,
    ServerError = 500
}

fn main() -> Int {
    println(HttpStatus.NotFound as Int)   // 404
    return 0
}
```

The representation applies to the whole enum and is how it is **stored**: an `enum Color: U8` field takes one byte, a `HttpStatus` field two. `as Int` converts through it, so a `U8` enum above 127 widens by zero extension and an `I8` one below zero by sign extension.

**Numbering.** The first variant is `0`, and every variant without a number is the previous one plus one. The compiler never skips to a free number and never wraps:

<!-- prismio-check: pass -->
```prismio
enum Level: I8 { Low = -5, Mid, High = 100 }   // -5, -4, 100

enum Opcode: U8 { Nop, Load = 0x10, Store, Halt = 0xFF }   // 0, 16, 17, 255

fn main() -> Int {
    if (Level.Mid as Int == -4 and Opcode.Store as Int == 17) { return 0 }
    return 1
}
```

A number is a compile-time integer: a literal, or literals combined with `+ - * << |`, such as `1 << 3`. It must fit the representation. Without a representation type, the numbers are `Int`.

<!-- prismio-check: fail -->
```prismio
enum State: U8 { Ready = 256 }
```

The error is ``the discriminant 256 of `Ready` does not fit `U8` (0 to 255)``. Three more are refused the same way: a number that is not constant, a variant left to count past the end of the type (``the implicit discriminant of `B` is past the range of `U8` ``), and two variants with one number:

<!-- prismio-check: fail -->
```prismio
enum Message: U8 {
    Quit = 0,
    Text(String),                    // implicitly 1
    Move { x: Int, y: Int } = 1      // collides with Text
}
```

A tagged enum's tag must tell its variants apart, so the compiler does not renumber either one; it names both. For names that are meant to share a number, use a [`codeset`](#codesets).

The number is a variant's identity and **not** its payload: `Text(String) = 5` is variant 5 carrying a `String`. A payload enum's tag is stored in the representation type, so the first variant may be `0`.

`n as Color?` is present when some variant has the number `n` and `none` otherwise, so with gaps it is a set, not a range:

<!-- prismio-check: pass -->
```prismio
enum HttpStatus: U16 { Ok = 200, NotFound = 404 }

fn main() -> Int {
    let found = 404 as HttpStatus?
    let missing = 405 as HttpStatus?
    if (found != none and missing == none) { return 0 }
    return 1
}
```

An enum that writes neither a representation nor a number is unchanged: ordinals in declaration order, stored as an `Int`. Even so, treat the representation as implementation-defined at FFI and persistence boundaries unless the enum states one.

## Struct variants

A variant can name its payload fields. They are stored in the order written, exactly as the tuple form's are, and may be built and matched either way:

<!-- prismio-check: pass -->
```prismio
enum Event {
    Click { x: Int, y: Int },
    Key { code: Int },
    Close
}

fn weight(e: Event) -> Int {
    match (e) {
        Event.Click { x, y } => { return x * 100 + y }
        Event.Key { code } => { return code }
        Event.Close => { return 0 }
    }
}

fn main() -> Int {
    let click = Event.Click { y: 2, x: 7 }
    if (weight(click) != 702) { return 1 }
    if (weight(Event.Key(65)) != 65) { return 2 }
    return 0
}
```

Fields can be written in any order when building a value, and every field is required; a missing, repeated or unknown field is an error naming the variant. In a pattern, `{ x, y }` binds each field to the name written, and every field must appear.

## Codesets

Protocol codes and status numbers sometimes share a value on purpose. A `codeset` is a set of named integers, not a type, so it allows that:

<!-- prismio-check: pass -->
```prismio
codeset Status: U16 {
    Ok = 200,
    Success = 200,
    NotFound = 404
}

fn describe(code: U16) -> Int {
    if (code == Status.Ok) { return 0 }
    if (code == Status.NotFound) { return 1 }
    return 2
}

fn main() -> Int {
    return describe(Status.Success)
}
```

`Status.Ok` is a `U16`, the representation, wherever it is written, and it can be matched on like any integer. A codeset needs its representation type, may repeat a number, takes the same numbers and the same range check as an enum's, and has no payloads. It is `internal` unless marked, like an enum.

## Modeling data with a tag

A **fieldless** enum's values are copyable integer ordinals, as described above.

A variant may also carry values, and an enum may be generic:

```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}
```

An enum with any payload variant compiles to a tagged struct rather than an integer, which makes its values owned and move-only — including the variants that carry nothing. Take them apart with [variant patterns](/language/pattern-matching). See [`Result`](/stdlib/option#result) for the representation and its costs.

A fieldless enum is unaffected by this and keeps its integer values.

```prismio
enum ParseStatus { Success, Failure }

struct ParseResult {
    status: ParseStatus,
    value: Int
}
```

This is not a tagged union: every `ParseResult` always stores every declared field, and the compiler does not relate `status` to validity of `value`. Establish and check that invariant in ordinary functions.

## Current limitations

- There are no enum methods or implementations.
- Duplicate-arm detection, and a missing-arm error, apply to payload enums only. A fieldless enum's `match` is exhaustive when it names every variant, and a subset stays legal.
- An enum that states no representation has an ordinal representation that is not a stable serialization or FFI contract.
- A struct variant of a generic enum is built positionally; the braces form needs a non-generic enum.
- `I32` is not a type name: the 32-bit signed integer is `Int`.
