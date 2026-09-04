---
title: Control flow
description: Use if, while, loop, for ranges, break, continue, and return in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-30"
tags: [control-flow, if, loops, return]
related: [language/pattern-matching, language/functions, specification/evaluation]
---

Control-flow constructs are statements. Conditions are parenthesized and bodies are blocks. In 0.1, `if`, loops, and `match` do not produce values; assign into a mutable binding or return from a branch when a computation must select a result.

## Conditional execution

```prismio
if (ready) {
    println("ready")
} else {
    println("waiting")
}
```

The condition must have type `Bool`. Integers, pointers, strings, and optionals are not implicitly interpreted as truth values.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count = 1
    if (count) { return 0 }
    return 1
}
```

Compare explicitly, such as `count != 0`.

Each branch establishes its own lexical scope. Since `if` is a statement, syntax such as `let sign = if (...) { ... } else { ... }` is not supported.

```prismio
fn sign(value: Int) -> Int {
    if (value < 0) {
        return -1
    } else {
        if (value > 0) {
            return 1
        }
    }
    return 0
}
```

## `while`

`while` repeats while a Boolean condition is true. `loop` repeats indefinitely until `break` or `return`. `continue` begins the next iteration.

```prismio
let mut i = 0
while (i < 3) {
    i += 1
}

loop {
    if (i == 3) { break }
}
```

The `while` condition is evaluated before every iteration. If it begins false, the body does not execute.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut sum = 0
    let mut value = 1
    while (value <= 4) {
        sum += value
        value += 1
    }
    return sum - 10
}
```

## Infinite `loop`

`loop` has no condition. It is useful when the termination test belongs in the middle of the body.

```prismio
let mut value = 0
loop {
    value += 1
    if (value >= limit) { break }
}
```

An unconditionally diverging loop can satisfy definite-return analysis in relevant positions. Code that follows an unconditional control transfer is rejected when it is statically unreachable.

## Integer range loops

A range loop `for item in start..end` iterates from the start, inclusive, to the end, exclusive.

```prismio
for value in 0..3 {
    println(value)
}
```

The range is ascending and half-open: `0..3` produces `0`, `1`, and `2`. A start that is not below the end produces no iterations. There is no descending or inclusive-range spelling in 0.1.

The iteration name is scoped to the loop body.

### Iterating a String or a List

Leaving out the `..` iterates a collection instead of a range. A `String` yields
each byte as a `Char`; a `List<T>` yields each element.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let word = "prismio"
    let mut vowels = 0

    for c in word {
        if (c == 'i' or c == 'o') { vowels = vowels + 1 }
    }
    println(vowels)

    let parts = "a,b,c".split(',')
    for p in parts {
        println(p)
    }
    return 0
}
```

The collection is borrowed, not moved, so it is still usable after the loop.

**The collection must be a name.** `for line in text.lines()` is refused: the loop
needs the collection more than once, and an expression after `in` would be
evaluated per iteration. Bind it first — which is the same rule that already
applies to any owned result:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let report = "alpha\nbeta\n"
    for line in report.lines() {
        println(line)
    }
    return 0
}
```

Only `String` and `List<T>` may follow `in` without a range. Anything else —
arrays, `Slice<T>`, `Map<K, V>` — is iterated by index with `for i in 0..n`.

This is a desugaring, not an iterator protocol: `for c in s` becomes the range loop
over `s[i]`, so there is no trait a user type can implement to participate.

```prismio
for row in 0..2 {
    for column in 0..3 {
        println(row * 3 + column)
    }
}
```

## `break` and `continue`

`break` exits the nearest enclosing loop. `continue` skips the remainder of the current iteration and begins the next one. Neither carries a value.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    break
    return 0
}
```

The compiler rejects `break` and `continue` outside a loop. In nested loops they affect only the innermost one; labels are not implemented.

## `return`

`return expression` exits a value-returning function. A function without a result may use `return` without an expression. Every reachable path through a value-returning function must return the declared type.

```prismio
fn absolute(value: Int) -> Int {
    if (value < 0) { return -value }
    return value
}
```

## Ownership inside loops

The compiler rejects moving an outer move-only binding from inside a loop when a later iteration could observe it after the move. Borrow it with an ordinary parameter, mutate through `inout`, or arrange a single ownership transfer outside the repeating region.

This conservative restriction prevents a path that succeeds once and becomes a use-after-move on the next iteration.

`if`, loops, and `match` do not produce values in 0.1. `break` and `continue` are only valid inside loops. The compiler performs definite-return and unreachable-code analysis.

## Not implemented

Prismio 0.1 has no labeled loops, value-carrying `break`, `do while`, `defer`, exception control flow, conditional binding syntax, or expression-form `if` and `match`. Collection iteration covers `String` and `List<T>` only, as a desugaring rather than an extensible iterator protocol.
