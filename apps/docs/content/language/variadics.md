---
title: Variadic parameters and typelists
description: Take any number of arguments with a pack parameter, and say which types it accepts with a typelist, as an unordered set or an ordered sequence.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-22"
tags: [functions, variadics, typelist, packs]
related: [language/functions, language/generics, language/traits, stdlib/io]
---

A function can take **any number of arguments** with a parameter written `...name`. A `typelist` says which types those arguments may have. Both are resolved at compile time: each call shape gets its own copy of the function, so there is no array, no length and no boxing at run time.

## A typelist

A `typelist` is a named list of types. **The delimiter chooses whether order matters**: braces make an unordered set, parentheses an ordered sequence.

```prismio
typelist Scalars { Int, I64, Float, Bool }     // a set: any of these, in any order
typelist Printable { Display }                 // a set with a trait: every type that implements it
typelist Row (Int, String, Bool)               // a sequence: an Int, then a String, then a Bool
typelist Named (id: Int, name: String)         // a sequence with a name for each position
```

An entry is a type, a trait (any type implementing it fits) or another typelist. `typelist` is a contextual word, like `codeset`, and a name that is not followed by a typelist declaration is an ordinary identifier. A typelist exists only at compile time: it is not a type and not a value.

## A pack

Bound a type parameter by a typelist, and take its values with `...`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.display

typelist Printable { Display }

fn joined<Ts: Printable>(...args: Ts) -> String {
    let mut out = ""
    let mut first = true
    for arg in args {
        if (first == false) { out = out.concat(" ") }
        first = false
        out = out.concat(arg.show())
    }
    return out
}

fn main() -> Int {
    println(joined("x =", 5, true))      // x = 5 true
    return 0
}
```

- A **set** pack takes any number of arguments, each a type from the set, in any order, and they may differ from one another. Zero is allowed.
- A **sequence** pack takes that sequence **in that order, repeated any number of times** (zero included). Exactly one group needs no pack: write the parameters.
- The pack is the last parameter. `extern fn` cannot have one.

```prismio
typelist Row (Int, String, Bool)

fn rows<Ts: Row>(...args: Ts) -> Int {
    let mut total = 0
    for row in args {              // once per group of three
        total = total + row[0]     // the Int; row[1] is the String, row[2] the Bool
    }
    return total
}
```

`rows(1, "a", true, 2, "b", false)` is two groups; `rows(1, "a")` is an error, because the last group is short.

### What the body can do

Everything is resolved at compile time, because the number and types of the arguments are known at each call.

| Written | Means |
|---|---|
| `args.length` | the number of arguments |
| `args.count` | for a sequence, the number of groups |
| `args[2]` | the third argument, typed as itself; the index must be a literal |
| `for arg in args { ... }` | the body repeated once per argument (once per group for a sequence), each copy in its own scope and with the argument's own type |
| `row[1]`, `row.name` | an entry of a group, by position or by the name a typelist gave it |
| `f(...args)` | pass the pack on as separate arguments |

`for` over a pack is not a loop at run time: it is the body written out once per argument. That is why `arg.show()` can pick a different implementation for each type, and why `break` and `continue` are not allowed in it.

### One type, no list

When every argument has the same type, name the type and skip the list:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn glue(sep: String, ...parts: String) -> String {
    let mut out = ""
    let mut first = true
    for part in parts {
        if (first == false) { out = out.concat(sep) }
        first = false
        out = out.concat(part)
    }
    return out
}

fn main() -> Int {
    println(glue("-", "a", "b", "c"))    // a-b-c
    return 0
}
```

The annotation is the type of **each argument**, not of the collection (the opposite of TypeScript's `...args: string[]`).

### More than one pack

A function may have several packs. Their arguments are consecutive, in declaration order: all of the first pack's, then all of the second's. A set ends at the first argument not in it, so two set packs must not overlap.

<!-- prismio-check: pass -->
```prismio
typelist Ids { Int, String }
typelist Flags { Float, Bool }

fn both<A: Ids, B: Flags>(...ids: A, ...flags: B) -> Int {
    return ids.length * 10 + flags.length
}

fn main() -> Int {
    return both(1, "a", 2.5, true) - 22
}
```

## Overloads

A fixed overload that takes the call always wins over a variadic one. `println(5)` still calls the `Int` overload, and a function with a pack handles only the calls no fixed overload takes.

## Errors

A pack names the list and the rule that was broken.

<!-- prismio-check: fail -->
```prismio
import std.display

typelist Printable { Display }
struct Opaque { x: Int }

fn show<Ts: Printable>(...args: Ts) { }

fn main() -> Int {
    show(1, Opaque { x: 2 })
    return 0
}
```

The error is ``argument 2 has type `Opaque`, which is not in `Printable` ``. For a sequence it is ``argument 5 must be `String` (the arguments repeat `Int, String, Bool`), found `Bool` ``, or ``takes `Row` arguments in groups of 3; the last group has 2``.

## In the standard library

- `print`, `println`, `eprint` and `eprintln` take any number of printable arguments and separate them with a space (`import std.display`): `println("n =", n, "ok =", ok)`. One argument still calls the per-type overload in `std.io`.
- `concat` takes any number of strings. Two to six parts have hand-tuned overloads; seven or more use a pack. String interpolation is always one `concat`.

## Not available yet

- Keyword arguments and a keyword pack: the language has no named arguments.
- A pack in a closure.
- A minimum count ("at least one").
