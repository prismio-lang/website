---
title: Closures
description: Prismio 0.1 closures -- a struct, a call function, and overload resolution. No function pointers and no indirect calls.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-29"
tags: [closures, lambdas, higher-order, generics, captures]
related: [language/traits, language/methods, stdlib/lists]
---

A closure is written `|parameters| expression`.

<!-- prismio-check: pass -->
```prismio
import std.io

fn applyTwice<F>(f: F, x: Int) -> Int {
    return f(f(x))
}

fn main() -> Int {
    println(applyTwice(|x: Int| x + 3, 10))
    return 0
}
```

## What a closure actually is

A closure is **a struct and a function**, and the dispatch is
[overload resolution](/language/functions). `|x: Int| x > threshold` lowers to:

```text
struct Closure$12$0 { threshold: Int }
fn call(self: Closure$12$0, x: Int) -> Bool { return x > self.threshold }

Closure$12$0 { threshold: threshold }        // at the use site
```

and `f(x)` inside the generic that received it is rewritten to `call(f, x)`.

The consequences are worth stating, because they are what make closures cheap here:

- **There is no function pointer, no vtable and no indirect call.** Each closure has its own type,
  each generic that takes one is specialized for it, and the call is direct.
- **A closure has no spellable type.** `Closure$12$0` is compiler-generated, so a closure is always
  received through a type parameter — `fn each<T, F>(items: List<T>, f: F)`.
- **A closure cannot be stored.** A generic parameter is a borrow, and moving a borrowed value into
  a container is already rejected, so a closure lives for the call it is passed to.

## Parameter types are written

`|x: Int| x + 1`, not `|x| x + 1`. Inferring a closure parameter means solving it from the callee's
signature at the call site, which is a separate feature; the syntax does not change when it arrives.

The body is an **expression**, not a block. `|a: Int, b: Int| a * b + 1` is one closure.

`||` is a closure with no parameters:

<!-- prismio-check: pass -->
```prismio
import std.io

fn run<F>(f: F) -> Int {
    return f()
}

fn main() -> Int {
    println(run(|| 42))
    return 0
}
```

## Captures are by value

A free name in the body that refers to a local becomes a field of the closure's struct, initialized
from that local. Globals and function names are not captured — they are reachable already.

For a scalar that is a copy. **For an owned value it is a move**, and the original binding is dead
afterwards:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.list

fn main() -> Int {
    let mut names: List<String> = list_new()
    list_push(names, "apple")
    list_push(names, "apricot")
    list_push(names, "fig")

    let needle = "ap".concat("")
    println(countWhere(names, |s: String| strStartsWith(s, needle)))
    return 0
}
```

By value is not a default chosen over borrowing — it is the only sound option today, because
Prismio has no way to hold a borrow in a struct field. `strClone` the value first if the original
is needed afterwards.

This is also why closures cost the ownership model nothing. A capture is spelled as an ordinary
struct-literal field, so an owned capture is moved into a field exactly the way any other struct
literal moves one; there is no new escape route and no new lifetime rule.

## Three spellings of one call

`call`'s first parameter is the receiver, so a closure is a [method](/language/methods) like any
other, and these are the same call:

```text
f(x)
call(f, x)
f.call(x)
```

## Not in 0.1

- Inferred parameter types.
- Block bodies (`|x: Int| { ... }`).
- Storing a closure in a struct, a list, or a global.
- Returning a closure from a function.
- Borrowing captures, and a `move` keyword to opt out of them.
- Recursive closures.

A closure taken as a `F` type parameter and called within the call covers `map`, `filter`, `sortBy`
and the rest of [the list algorithms](/stdlib/lists), which is what 0.1 set out to reach.
