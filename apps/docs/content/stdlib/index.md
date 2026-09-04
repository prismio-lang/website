---
title: Standard library status
description: Prismio's shipped source standard library and the modules still planned.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-29"
tags: [standard-library, runtime, status]
related: [stdlib/io, stdlib/strings, stdlib/lists, stdlib/map, stdlib/option, roadmap]
---

Prismio ships ten source standard-library modules: `std/io.psm`, `std/string.psm`, `std/fs.psm`, `std/process.psm`, `std/list.psm`, `std/map.psm`, `std/option.psm`, `std/key.psm`, `std/ord.psm` and `std/copy.psm`. Packaged toolchains install them as `stdlib/*.psm` — the directory is **flattened**, so never derive a module's logical name from its path on disk.

**There is no prelude.** `std.io` is an ordinary import: a program that prints nothing carries no I/O, which is what lets a target with no stdout link at all. Calling `println` without `import std.io` is `error: unknown function \`println\``.

`std.*` imports resolve against the compiler's own library rather than relative to the importing program, so a local `std/` directory cannot shadow them.

`std.net` and `std.time` remain unavailable. There is no `std.concurrency` either, and that is not a gap: `spawn`/`join`/`Task<R>` and `Channel<T>` are language features rather than libraries — see [concurrency](/language/concurrency).

## Available without imports

The compiler provides a small built-in surface that needs no import at all:

- Explicit `drop` and checked `expect`
- `list_new`, `list_new_with_capacity`, `list_len`, `list_get`, `list_push`, `list_set`, and `list_set_exclusive`

That is the whole of it. `print` and `println` are **not** in this list — they are ordinary source-defined overloads in `std/io.psm` and need `import std.io` like anything else.

The output overloads participate in normal declaration lookup, overload resolution, type checking, and ownership analysis. The private C ABI symbols beneath them are implementation details and should not be declared by applications.

## Output

`String`, `Int`, `Float`, `Bool`, and `Char` have exact `print`/`println` overloads. There is no generic formatting trait, interpolation syntax, standard input abstraction, or writer protocol.

## Strings

`String` is an owned move-only runtime value. [`std.string`](/stdlib/strings) provides searching, trimming, splitting, joining, replacement, padding, case mapping, and integer parsing, plus wrappers carrying the ownership contract for the eight runtime primitives that must stay in C.

Still absent: interpolation syntax, Unicode scalar iteration, a string builder, and a formatting trait. `Char` is a byte, not a Unicode scalar.

## Lists

`List<T>` is a built-in growable owned sequence with compiler-known construction, length, read, append, and replace operations. It is built into the compiler rather than defined in the library, and it is the language's growable vector — there is no separate `Vec<T>`.

For boxed struct elements, `list_set_exclusive(items, index, value)` replaces and reclaims the old
element when the compiler can prove `items` is still an unobserved local List. A prior element read,
Slice construction, or arbitrary borrowing call closes that capability. `list_set` remains the
general conservative replacement operation.

[`Map<K, V>`](/stdlib/map) is defined in Prismio, in `std/map.psm`, as an open-addressed table over `List`. Its key type carries `Key + Copy` bounds: [`std.key`](/stdlib) supplies `hash` and `eq`, while `std.copy` supplies `copyOf` so the table can retain a key — therefore **`String` keys work**, and every integer width does. `Float` deliberately has no `impl Key`: NaN is not equal to itself, so a NaN key could be inserted and never found again.

[`std.list`](/stdlib/lists) adds `sort` for a `T: Ord`, `sortBy` with a closure comparator, `binarySearch`, `filter`, `mapInto`, `countWhere`, `anyOf` and `allOf`. There is still no iterator protocol.

## Memory primitives

`drop(value)` explicitly consumes owned move-only data. `expect(optional)` performs a checked presence assertion for reference-shaped optionals. These are language/runtime primitives, not exception or destructor frameworks.

## Foreign extensions

Programs can declare C-compatible symbols with `extern fn`. It is the escape hatch for clocks, networking, and platform services — **not** the way to reach the Prismio runtime. Files, paths, arguments, and string operations are covered by [`std.fs`](/stdlib/filesystem), [`std.process`](/stdlib/process), and [`std.string`](/stdlib/strings), which carry the ownership contracts so applications do not have to.

An `extern fn` with no contract has unknown provenance: the analysis widens it to Shared, the result gets no owner, and it leaks. Worse, `produce(free)` on a function that returns a borrowed pointer hands that pointer to the deallocator. See the contract table in the compiler repository's `RUNTIME.md`.

These pages separate existing runtime surface from planned modules. I/O, strings, and lists describe implemented capabilities. Filesystem, networking, time, and concurrency pages are marked Coming Soon.

Coming Soon pages intentionally do not invent final module names or signatures. They define what is missing and the semantic questions that must be resolved before the status changes.

Until module APIs exist, bind needed platform or C-library functions through a local FFI wrapper and document their ownership contracts.

## Stability rules

- Use only documented public operations and shipped source modules.
- Do not assume that planned `std.*` names resolve merely because `std.io` now ships.
- Treat internal runtime declarations as implementation details unless explicitly documented.
- Keep FFI wrappers small and target-tested.
- Expect module names and APIs to receive their own versioned reference pages when implemented.
