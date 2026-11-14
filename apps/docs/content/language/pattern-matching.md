---
title: Pattern matching
description: Match integer, string, and enum values with literal, range, string, guarded and wildcard arms.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [match, patterns, enums, control-flow]
related: [language/enums, language/control-flow, specification/evaluation]
---

`match` is a multi-way statement over an `Int` or fieldless enum value. It compares the scrutinee against arms in source order and executes the block of the first matching arm.

The syntax is:

```prismio
match expression {
    pattern => { statements }
    _ => { fallback statements }
}
```

Parentheses around the expression are optional (`match (expression) {` reads too), and so are the braces around an arm that is one statement:

<!-- prismio-check: pass -->
```prismio
import std.io

enum Shape { Circle, Square, Tri(Int) }

fn main() -> Int {
    let mut out = 0
    let s = Shape.Tri(4)
    match s {
        Shape.Circle => out = 1,
        Shape.Square => print("square"),
        Shape.Tri(n) => out = n * 2
    }
    match out {
        8 => out = out - 8,
        _ =>
    }
    return out
}
```

An arm is a block, or one statement (`out = 1`, a call, `return x`), or nothing: `_ =>` before the closing brace or a comma does nothing. A comma after an arm is optional. A struct literal in the expression is parenthesised, as in an `if`, because its brace would otherwise be taken for the one that opens the arms.

<!-- prismio-check: pass -->
```prismio
enum Color { Red, Green, Blue }

fn score(color: Color) -> Int {
    let mut result = 0
    match (color) {
        Color.Red => { result = 10 }
        Color.Green => { result = 20 }
        _ => { result = 0 }
    }
    return result
}

fn main() -> Int { return score(Color.Green) }
```

Because `match` is a statement, `score` stores the selected number in a mutable binding and returns it afterward. Returning directly from arms is another option when every reachable function path remains valid.

## Enum patterns

Use a qualified `Enum.Variant` pattern. Qualification identifies the enum declaration and validates the variant name, even though the resulting 0.2 value uses `Int` compatibility.

```prismio
enum Direction { North, East, South, West }

fn axis(direction: Direction) -> Int {
    let mut result = 0
    match (direction) {
        Direction.North => { result = 1 }
        Direction.South => { result = 1 }
        Direction.East => { result = 2 }
        Direction.West => { result = 2 }
        _ => { result = 0 }
    }
    return result
}
```

Fieldless enums have no payload to destructure. Raw ordinal assumptions should not cross FFI or persistence boundaries.

## Integer patterns

Integer-like pattern expressions are compared against an `Int` scrutinee.

<!-- prismio-check: pass -->
```prismio
fn category(code: Int) -> Int {
    let mut result = -1
    match (code) {
        0 => { result = 10 }
        1 => { result = 20 }
        2 => { result = 30 }
        _ => { result = 0 }
    }
    return result
}

fn main() -> Int { return category(1) - 20 }
```

[Ranges](#range-string-and-guarded-arms) and string patterns are arms that test; structural patterns and user-defined equality are not implemented.

## Wildcard arm

`_` matches any value that reaches it, so it goes last: an arm after it could never run, and the compiler rejects it ("comes after `_`").

## Exhaustiveness and duplicates

Supported patterns are integer-like expressions, enum variants, and `_`. Arms are tested in source order. The compiler does not currently enforce exhaustiveness or reject duplicate patterns, so include `_` whenever an unmatched value must be handled.

An enum declaration is closed, but the match checker does not yet prove every variant appears. A non-exhaustive statement simply performs no arm action for an unmatched value. That can leave a result binding unchanged and hide a bug when variants are added.

```prismio
let mut label = 0
match (state) {
    State.Ready => { label = 1 }
    _ => { label = -1 }
}
```

Duplicate patterns are also not rejected in 0.1. The first matching arm wins; later duplicates cannot run. Treat duplicates and an early wildcard as code-review errors even when compilation succeeds.

## Scope and control transfer

Every arm body is a block with its own lexical scope. Bindings declared in one arm are unavailable in another arm or after the match. `return` exits the function, while `break` and `continue` apply only when the match appears inside a loop.

A match that every value reaches — a payload enum with each variant covered, or any match with a `_` arm — ends the function when each of its arms does, the way an `if` with an `else` does. So it can be a function's last statement, and a statement after it is unreachable code, which is an error:

<!-- prismio-check: pass -->
```prismio
fn sign(n: Int) -> Int {
    match (n) {
        0 => { return 0 }
        _ => { return 1 }
    }
}

fn main() -> Int {
    return sign(0)
}
```

An integer match without a `_` arm does not end the function, because a value no arm names falls through it.

## Invalid scrutinees

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let text = "ready"
    match (text) {
        _ => { return 0 }
    }
}
```

A string is matched by [string patterns](#range-string-and-guarded-arms), which need a `_` arm; a `match` with only `_` has nothing to test.

## Variant patterns

A match over an enum with [payload variants](/language/enums) uses variant patterns, which bind the values the variant carries:

<!-- prismio-check: pass -->
```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}

fn area(s: Shape) -> Int {
    match (s) {
        Shape.Dot => { return 0 }
        Shape.Circle(r) => { return 3 * r * r }
        Shape.Rect(w, h) => { return w * h }
    }
}

fn main() -> Int {
    return area(Shape.Rect(3, 4)) - 12
}
```

Each name in a pattern is a fresh binding scoped to that arm, typed from the variant's declaration. The number of names must equal the number of values the variant carries. A `_` arm may accompany variant arms and matches anything not already taken.

### Exhaustiveness

A match over a payload enum must handle every variant, or carry a `_` arm. Omitting one is an error that names what is missing:

```
error: this match does not cover Dot, Rect of `Shape`; add the missing arms or a `_` arm
```

Without the check, an unhandled variant fell through the tag comparisons to the end of the statement, so the match silently did nothing for exactly the input the author forgot — and for a `Result`, that input is usually the error.

A second arm for a variant an earlier arm already matches is rejected as unreachable, since the arms are tested in source order and the first one always wins.

Exhaustiveness applies to **payload** enums only. A fieldless enum still matches as an integer, where the scrutinee is not confined to the declared variants, so matching a subset stays legal there.

## Range, string and guarded arms

Three more kinds of arm *test* the value instead of naming it:

| Arm | Takes the value when |
| --- | --- |
| `1..9`, `1..<9` | it is from 1 to 9 (end included), or from 1 up to but not including 9 |
| `"stop"` | it equals the string |
| `x if x < 0`, `_ if cond` | the guard holds; a bare name before `if` binds the value |
| `Shape.Circle(r) if r > 10` | it is that variant and the guard holds (the guard sees `r`) |

<!-- prismio-check: pass -->
```prismio
import std.string

enum Shape { Circle(Int), Rect(Int, Int), Empty }

fn bucket(n: Int) -> String {
    match n {
        0 => { return "zero" }
        1..9 => { return "small" }
        10..<100 => { return "medium" }
        x if x < 0 => { return "negative" }
        _ => { return "large" }
    }
}

fn command(s: String) -> Int {
    match s {
        "start" => { return 1 }
        "stop" => { return 2 }
        _ => { return 0 }
    }
}

fn size(s: Shape) -> String {
    return match s {
        Shape.Circle(r) if r > 10 => "big circle",
        Shape.Circle(r) => "circle",
        Shape.Rect(w, h) if w == h => "square",
        _ => "other"
    }
}

fn main() -> Int {
    if bucket(5) != "small" or bucket(-3) != "negative" { return 1 }
    if command("stop") != 2 { return 2 }
    if size(Shape.Circle(20)) != "big circle" or size(Shape.Rect(3, 3)) != "square" { return 3 }
    return 0
}
```

Arms are tried in order, and a guard that fails goes on to the next arm. A `match` that has any of these arms **ends in an unguarded `_`**: a range or a guard may leave values over, and the compiler does not try to prove which. The value is evaluated once, and the arms work in `match` expressions too ([`if` and `match` as values](/language/control-flow#if-and-match-as-values)).

How it is read: a range, a string and a guard on a name or `_` are an `if`/`else` chain over the value, with the arms after each as its `else`. A guard on a *variant* has to bind first and still fall through, so its pattern is matched twice, once to find out whether the guard holds and once to run the arm; the guard runs once, and only when the pattern matched. Either way a function whose every arm returns still returns on every path.

A bare name before `if` is always a binding, even when a variable of that name is in scope: `limit if n > 3` binds a new `limit`. There is no `|` between patterns.

## Patterns inside a pattern

What a variant carries can itself be matched: a variant pattern, or a number or text to compare with, in place of a name. Any depth, and `_` skips a value:

<!-- prismio-check: pass -->
```prismio
import std.string

enum Inner { A(Int), B(String), None }

enum Outer { Wrap(Inner), Two(Inner, Int), Plain(Int) }

fn describe(o: Outer) -> String {
    match o {
        Outer.Wrap(Inner.A(v)) => { return "A ".concat(v.toString()) }
        Outer.Wrap(Inner.B(s)) => { return "B ".concat(s) }
        Outer.Two(Inner.A(v), 0) => { return "zero" }
        Outer.Two(Inner.A(v), n) if n > 5 => { return "big" }
        Outer.Two(_, n) => { return "two" }
        Outer.Plain(7) => { return "seven" }
        _ => { return "else" }
    }
}

fn wrap(v: Int) -> Outer { return Outer.Wrap(Inner.A(v)) }

fn main() -> Int {
    if describe(wrap(3)) != "A 3" { return 1 }
    return 0
}
```

Arms are tried in order, and an arm whose inner pattern does not match goes on to the next, as a guard that fails does. A guard sees every name in the pattern. It works in `match` statements and expressions, in [`if let`, `while let` and `let ... else`](/language/control-flow#if-let-and-let--else) (`let Outer.Wrap(Inner.B(s)) = o else { return }`), and the same rule holds: a `match` with a pattern inside a pattern ends in an unguarded `_`.

A `String` or a struct held in the inner value is released once, as with any pattern. A binding is a borrow of the value that was matched.

Not built: `|` between patterns, and a struct pattern (`Point { x, y }`) or a tuple pattern inside a variant's pattern.
