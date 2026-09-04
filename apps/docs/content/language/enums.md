---
title: Enums
description: Define and use fieldless nominal enum variants in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [enums, variants, nominal-types]
related: [language/pattern-matching, language/types, specification/evaluation]
---

Enums declare a closed set of fieldless variant names. They are useful for readable states, tags, and small result categories that carry no attached payload. In compiler 0.1, their static separation is limited by compatibility with `Int`, described below.

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

The enum name qualifies and validates a variant. However, a variant expression currently types as plain `Int`, and semantic compatibility treats an enum type and `Int` as interchangeable. Separate enum declarations are therefore not strongly isolated at assignment and call boundaries in 0.1.

<!-- prismio-check: fail -->
```prismio
enum LeftState { Ready, Waiting }
enum RightState { Ready, Waiting }

fn main() -> Int {
    let left: LeftState = LeftState.Missing
    return 0
}
```

The declaration has no `Missing` variant. Unknown variants are rejected even though valid variant values use the integer-compatible representation.

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

`match` can select enum variants in source order:

```prismio
fn code(state: ConnectionState) -> Int {
    let mut result = 0
    match (state) {
        ConnectionState.Disconnected => { result = 1 }
        ConnectionState.Connecting => { result = 2 }
        ConnectionState.Connected => { result = 3 }
        _ => { result = 0 }
    }
    return result
}
```

Match is statement-form in 0.1, so store a selected result in a mutable binding or return inside arms. The compiler does not yet prove exhaustiveness; include `_` when unmatched input must be handled.

## Runtime representation

Variants are selected as `Enum.Variant`. Their current runtime representation uses zero-based integer ordinals in declaration order. Treat that representation as implementation-defined at FFI or persistence boundaries unless an explicit ABI guarantee is introduced.

Reordering variants can therefore change the emitted ordinal today, even though source-level code normally observes only named variants. Do not serialize raw ordinals or pass them through a foreign ABI without a conversion function that fixes an application-owned numeric contract. The same applies to a payload enum's tag, which is the variant's one-based position.

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

An enum with any payload variant compiles to a tagged struct rather than an integer, which makes its values owned and move-only — including the variants that carry nothing. Take them apart with [variant patterns](/language/pattern-matching). See [Option and Result](/stdlib/option) for the representation and its costs.

Discriminant assignments and methods are still not implemented. A fieldless enum is entirely unaffected by any of this and keeps its integer ordinals.

```prismio
enum ParseStatus { Success, Failure }

struct ParseResult {
    status: ParseStatus,
    value: Int
}
```

This is not a tagged union: every `ParseResult` always stores every declared field, and the compiler does not relate `status` to validity of `value`. Establish and check that invariant in ordinary functions.

## Current limitations

- Variants cannot carry fields or tuple payloads.
- Source code cannot assign explicit discriminant values.
- There are no enum methods or implementations.
- Explicit discriminants and methods are unavailable.
- Exhaustiveness and duplicate-arm detection apply to payload enums only. A fieldless enum still matches as an integer, where the scrutinee is not confined to the declared variants, so matching a subset stays legal.
- Enum and `Int` compatibility means different enum declarations are not strongly isolated by the type checker in 0.1.
- The ordinal representation is not a stable serialization or FFI contract.
