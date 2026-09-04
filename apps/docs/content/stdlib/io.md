---
title: Console I/O
description: Source-defined print and println overloads available to Prismio programs.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-12"
tags: [standard-library, io, print, console]
related: [start/hello-world, stdlib, language/ffi]
---

Console output has two public functions: `print` and `println`. They are ordinary exact-type overloads implemented in the shipped `std/io.psm` source module. **There is no prelude — `import std.io` is required**, like any other module. That is deliberate: a program that names no I/O carries none, which is what lets a target with no stdout link at all.

```prismio
print("value: ")
println(42)
println(3.5)
println(true)
println('A')
```

The functions write to the runtime's console output stream. Newline variants append a line ending; non-newline variants leave subsequent output on the current line.

## String output

```prismio
print("progress: ")
println("done")
```

`print` and `println` accept `String`. Their parameters borrow, so printing does not consume the caller's owned string.

## Standard error

`eprint` and `eprintln` write a `String` to stderr instead of stdout.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    eprintln("scanning 3 files")
    println("result: 42")
    return 0
}
```

They exist so that a program whose **stdout carries a format** can still say
something to the person watching without corrupting it. Anything a caller may
pipe into another tool -- a manifest, JSON, a column of numbers -- is a format in
this sense, and a progress line printed alongside it is no longer parseable
output. The compiler's own host-routing banner is on stderr for exactly this
reason: while it printed to stdout it prefixed `aif --manifest` and broke that
format's one guarantee, that its first line is `aif-manifest 1`.

Only `String` is overloaded. Every other `print` overload exists to render a
number, and status text is composed before it is written.

## Exact overloads

The same two names accept the five supported console value types. Overload selection uses the argument's exact type; it is not a variadic formatter or a runtime `Any` conversion.

| Value type | No newline | With newline |
| --- | --- | --- |
| `String` | `print` | `println` |
| `Int`, `I8`, `I16`, `I64`, `Isize` | `print` | `println` |
| `U8`, `U16`, `U32`, `U64`, `Usize` | `print` | `println` |
| `Float` | `print` | `println` |
| `Bool` | `print` | `println` |
| `Char` | `print` | `println` |

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let code: U8 = 255
    let bytes: U64 = 4294967296
    println(code)
    println(bytes)
    return 0
}
```

These are separate exact overloads, not implicit integer promotion. Arithmetic and assignment still require compatible widths, while output preserves the complete signed or unsigned value without a narrowing cast.

`Char` is byte-sized in 0.1, so its overload is not a complete Unicode scalar-output API. String source/runtime encoding details should be handled through the documented string/FFI contract.

## Formatting values

There is no string interpolation or generic `format` surface. Compose simple output through multiple calls:

```prismio
print("items: ")
println(list_len(items))
```

For application-specific rich formatting, write typed helper functions or use a carefully declared foreign formatting wrapper. Avoid C variadic APIs unless a stable adapter fixes the signature because source-level FFI variadics are not documented.

The old chunked names such as `println_int`, `print_float`, and `println_bool` are not public Prismio functions. Use the overload set directly.

## Errors and buffering

The 0.1 print functions do not expose a structured recoverable I/O result, writer handle, flush API, or buffering selection. Console/pipe failures follow the runtime/platform implementation rather than a language exception model.

`std/io.psm` is currently a minimal output module. Formatted output, input streams, files, buffering controls, error objects, and pluggable writers are not part of the 0.1 standard library.

For input or file access, define a local C-compatible wrapper and state its ownership/error contracts. The planned [filesystem](/stdlib/filesystem) and broader I/O modules remain Coming Soon.
