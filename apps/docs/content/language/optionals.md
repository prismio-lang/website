---
title: Optionals
description: T? is a T or none. A scalar's T? is a value that costs no allocation; a reference's is a nullable pointer. Testing, ??, expect, unwrapOr, containers and printing.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-07"
tags: [optional, nullable, none, coalescing, expect, unwrapOr]
related: [language/types, language/conversions, language/structs, errors/optional-needs-unwrap, stdlib/option]
---

A lookup that may find nothing, a reading a sensor did not take, a number a user
may not have typed: each is a value that might be absent. Append `?` to its type
and the absence is part of the type, so the compiler makes every reader deal with
it.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option

fn half(n: Int) -> Int? {
    if (n % 2 != 0) { return none }
    return n / 2
}

fn main() {
    let a = half(8)
    let b = half(7)
    println(a)                 // 4
    println(b)                 // none
    println(b ?? 0)            // 0
    if (a != none) {
        println(expect(a) + 1) // 5
    }
}
```

`T?` works for every number type, `Bool`, `Char`, a fieldless enum, `String`,
`Vec<T>`, a struct, and `Ptr`. It is the one spelling of "a `T` or nothing": there is
no separate `Option<T>`.

## Two representations, one surface

- **A scalar's `T?`** (a number, `Bool`, `Char`, a fieldless enum) is a present flag
  beside the value. It is copied like `T` and **never allocates**: `let b = a`
  copies, and `Vec<Int?>` stores 8 bytes an element.
- **A reference's `T?`** (`String`, `Vec<T>`, a struct, `Ptr`) is the pointer, and
  `none` is null. It owns what it points at, as `T` does.

Both are written, tested and unwrapped the same way.

## Making one

A `T` goes wherever a `T?` is expected, in a `let`, an assignment, a `return`, an
argument or a struct field. `none` is the absent value. `default` for a `T?` is
`none`.

```prismio
let count: Int? = 3
let missing: Int? = none
let message: String? = none
```

The annotation matters when the initializer is only `none`, which says nothing
about what it would have held.

A [conversion that can fail](/language/conversions) produces one: `300 as U8?` is
`none`, and `"42" as Int?` is 42. So does every [parse function](/stdlib/strings#parsing-and-formatting).

## Reading one

| Written | Answers |
|---|---|
| `o == none`, `o != none` | whether it is absent |
| `o ?? fallback` | the value, or `fallback` when it is `none` |
| `expect(o)` | the value, or a [panic](/language/error-handling#when-the-program-cannot-go-on) naming the line when it is `none` |
| `o.expect("message")` | the value, or a panic that prints `message` when it is `none` (`import std.option`) |
| `o.unwrapOr(fallback)` | the value, or `fallback`: `??` as a method call (a reference's needs `import std.option`) |
| `a == b` | equal when both are `none`, or both present with equal values (a scalar `T?`) |

Comparing with `none` does not narrow the type: `expect` is still needed after
the test.

```prismio
if (candidate == none) {
    println("missing")
} else {
    let present = expect(candidate)
    println(present.value)
}
```

A field of a `T?` struct is not reachable without `expect`:

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }

fn read(item: Item?) -> Int {
    if (item != none) {
        return item.value
    }
    return 0
}

fn main() -> Int { return read(none) }
```

Write `expect(item).value` after handling the absent case. And a `T?` is not a
`T`: `let n: Int = maybe` is refused. Take the value out with `expect`,
`unwrapOr`, or a comparison first.

## None-coalescing

`a ?? b`, a value or a fallback, is `a` when it has a value and `b` when it is `none`. It reads left to right
and stops at the first value, so a chain is a list of places to look:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.process

fn find(key: String) -> String? {
    if (key.equals("name")) { return "ada" }
    return none
}

fn fail(message: String) -> String {
    println(message)
    return ""
}

fn main() {
    println(find("name") ?? "anonymous")                // ada
    println(find("nickname") ?? "anonymous")            // anonymous
    println(find("nickname") ?? find("name") ?? "?")    // ada
    let port = process.env("PORT") ?? "8080"
    println(port)                                       // 8080 unless PORT is set
    println(find("name") ?? fail("never printed"))      // ada
}
```

- **The right side is a `T`, and the result is a `T`.** Or the right side is another
  `T?`, and the result stays one: `a ?? b ?? 0` is `a ?? (b ?? 0)`, and only the last
  fallback makes it a plain value.
- **The right side runs only when it is needed.** `fail("never printed")` above is not
  called, because `find("name")` has a value. That is what makes `value ?? computeDefault()`
  and `line ?? exit(1)` safe to write.
- **It binds looser than arithmetic and tighter than a comparison**: `a ?? b + 1` is
  `a ?? (b + 1)`, and `a ?? b == c` is `(a ?? b) == c`.
- **It needs `import std.option`**, because `a ?? b` is a call to `optionCoalesce` there.
  A String result is the optional's own, or the fallback: it borrows from them as the
  result of any function that returns one of its arguments does.

## In containers, and printing

A scalar `T?` goes in a `Vec`, a slice, an array or a `Map` value like any
scalar, with no allocation per element. The standard library knows about it:
`contains`, `indexOf`, `sort` (`none` sorts first), `clone` and `pop` work on a
`Vec<Int?>`, and `println` writes the value or `none`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let mut readings: Vec<Int?> = [3, none, 1]
    readings.push(2)
    readings.sort()
    for r in readings {
        print(r)
        print(" ")
    }
    println("")                          // none 1 2 3
    println(readings.contains(none))     // true
    return 0
}
```

`Display`, `Eq`, `Ord` and `Copy` are implemented for every scalar `T?`.

## Linked data

A reference `T?` is how a struct refers to one of its own kind:

<!-- prismio-check: pass -->
```prismio
struct Node {
    value: Int,
    next: Node?
}

fn valueAfter(node: Node) -> Int {
    if (node.next == none) { return 0 }
    let next = expect(node.next)
    return next.value
}

fn main() -> Int {
    let tail = Node { value: 2, next: none }
    let head = Node { value: 1, next: tail }
    return valueAfter(head)
}
```

Constructing `head` moves the owned `tail` into its `next` field, under the
ordinary struct ownership rules.

## `expect`

`expect(o)` checks for `none` at run time and produces the value when it is
there. On `none` the program stops with `expect() called on a none value` and the
file and line. There is no catchable exception for it.

Use `expect` where the program's logic has already ruled absence out, or at a
deliberate fail-fast boundary. Where absence is normal, compare with `none` or
use `unwrapOr`.

`expect` borrows: inspecting a present value does not consume the optional.

## Ownership

Wrapping a move-only value in `T?` does not change its ownership. Storing it
still moves it:

<!-- prismio-check: fail -->
```prismio
import std.io

struct Item { value: Int }

fn main() -> Int {
    let item = Item { value: 4 }
    let optional: Item? = item
    println(expect(optional).value)
    return item.value
}
```

Creating `optional` moves `item`; the later read of `item` is refused.

## Results, and where `T?` stops

A `T?` says a value may be absent and not why. When the reason matters, return a
[`Result<T, E>`](/stdlib/option#result), and turn between the two with `ok()` and `err()` (a
`Result` to an optional) and `okOr(error)` (an optional to a `Result`).

## Not in 0.1

- optional chaining such as `value?.field`: test with `!= none` and read through
  `expect`, or use `??`;
- a postfix force-unwrap such as `value!`: use `expect`;
- `if let`, flow narrowing after a comparison, and `match` on a `T?`: compare with
  `none` and read the value with `expect(o)`;
- `T??`, and `Channel<Int?>`: a channel carries references;
- a `Map` whose value is an owned `T?` (`String?`), for the reason a `Map`'s
  value may not be an owned type yet.
