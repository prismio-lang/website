---
title: Wrong number of arguments
description: Fix Prismio calls whose argument count does not match a builtin, function, or overload.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-10"
tags: [error, functions, arguments, arity]
related: [language/functions, errors/duplicate-overload, specification/name-resolution]
---

## Meaning

No callable candidate accepts the number of arguments supplied.

An overload is applicable only when both its arity and exact parameter types match. The `twice` call below has no two-argument candidate.

`print` and `println` are the exception, and not by having a two-argument overload: [several values in one call](/stdlib/io) is a rewrite in the compiler, so `println(1, 2)` is a program rather than this error.

## Why it happens

The caller may be using an outdated signature, combining two output calls into one, omitting a required value, or assuming default/variadic arguments from another language.

## Invalid code

<!-- prismio-check: fail -->
```prismio
import std.io

fn twice(value: Int) -> Int {
    return value + value
}

fn main() -> Int {
    twice(1, 2)
    return 0
}
```

## Correct code

<!-- prismio-check: pass -->
```prismio
import std.io

fn twice(value: Int) -> Int {
    return value + value
}

fn main() -> Int {
    println(twice(1))
    return 0
}
```

## Common fixes

Add or remove arguments, check the signature, or call the intended overload. Prismio has no default or variadic arguments in 0.1.

After the count matches, the compiler may report exact type differences. Fix those separately rather than adding casts while the signature is still wrong. For output, `print` and `println` do take several values — see [Console I/O](/stdlib/io) — but that is a compiler rewrite over the one-value overloads, not a variadic formatting API, and it applies to those four names only.
