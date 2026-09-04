---
title: Language reference
description: Canonical reference for syntax and behavior accepted by the Prismio 0.1 compiler.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-30"
tags: [language, reference, syntax]
related: [specification, start/overview, examples]
---

This reference describes the language accepted by Prismio 0.1.0. It is written from the compiler, runtime, and test suite rather than from proposals, so an example labeled as implemented is intended to compile with the released language surface.

Every reference page carries a status:

- **Implemented** — accepted by the audited compiler and covered by tests.
- **Experimental** — present end to end, but its surface or semantics may change substantially.
- **Draft** — a compiler-derived statement that is not yet a frozen language specification.
- **Coming Soon** — not implemented; any syntax is illustrative only.

The status applies to the whole page unless a section says otherwise. Experimental features are real compiler features, but their spelling or behavior may change before 1.0. Coming Soon pages deliberately avoid promising syntax that the compiler does not yet accept.

## Reading paths

If this is your first Prismio program, read these pages in order:

1. [Lexical structure](/language/lexical-structure) for tokens, literals, and comments.
2. [Variables](/language/variables) and [types](/language/types) for stored values.
3. [Functions](/language/functions) for parameters, returns, and overloads, then
   [methods and `impl` blocks](/language/methods) for the `x.f(a)` spelling.
4. [Control flow](/language/control-flow) and [pattern matching](/language/pattern-matching).
5. [Ownership and borrowing](/language/ownership-and-borrowing) before writing code that stores strings, lists, or structs.
6. [Modules](/language/modules) once a program spans multiple files.

For a precise compiler contract, use the [formal specification](/specification). For task-oriented instructions, use the [guides](/guides) and [cookbook](/cookbook). Those sections link back here when a language rule controls the outcome.

## Current surface

Prismio is statement-oriented. Blocks use braces, conditions use parentheses, and statements have no semicolon. Top-level items are imports, global bindings, functions, external functions, structs, and enums.

A minimal executable program is:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("Hello from Prismio")
    return 0
}
```

`main` is the process entry point. Returning `Int` makes the exit status explicit. The compiler also accepts functions without a return type for operations that return no value.

## Implemented language areas

Prismio 0.1 includes:

- statically typed local and global bindings;
- exact-width signed and unsigned integers, a 64-bit float, booleans, byte characters, strings, and raw pointers;
- named functions, exact-type overloads, and foreign function declarations;
- method call syntax and `impl` blocks over concrete types;
- generic traits, structural trait arguments, `impl Trait for Type`, and multiple bounds per type parameter, checked at instantiation;
- anonymous `impl Trait` in argument position (the type parameter you did not write) and in return position (one concrete type, statically dispatched);
- closures, `|x: Int| x + 1`, lowered to a struct and a `call` function;
- nominal structs and fieldless enums;
- fixed stack arrays and owned runtime lists;
- nullable reference-shaped values;
- `if`, `while`, `loop`, integer ranges, and statement-form `match`;
- move tracking for strings, lists, and structs, with default borrows, `sink`, `inout`, and `drop`;
- dotted and wildcard imports relative to the entry file; and
- experimental allocation-inference annotations and regions.

The language does not silently promote numeric operands. It does not insert implicit clones for move-only values. Those two choices explain many diagnostics: use an explicit `as` cast for a numeric conversion, and make ownership transfer explicit in a function signature with `sink`.

## Not part of 0.1

User-written lifetimes, exception syntax, and macros are not implemented, and their dedicated pages are marked Coming Soon: they describe only the current absence, the practical alternatives, and what has to land before the feature can become canonical.

Traits, closures, methods and `impl` blocks **are** implemented, and their pages document them as such — but statically: there is no dynamic dispatch or trait object, and a closure cannot be stored or returned. Concurrency is Experimental rather than absent: `spawn`, `join`, and `Channel<T>` ship, and the spelling may still change before 1.0.

Some words are reserved ahead of their implementation. In particular, the lexer recognizes `throw`, but the parser does not accept a statement using it. A reserved token is not evidence of partial feature support.

## Reference conventions

Syntax fragments use `name: Type` for required type annotations and brackets in prose—not source code—to indicate optional grammar parts. Complete examples include `main`; smaller fragments illustrate only the local syntax under discussion.

Invalid examples are intentional. The text immediately after each example identifies the rule the compiler is expected to enforce. Diagnostic wording can improve between patch releases, but the rejection itself is part of the documented behavior unless marked Draft or Experimental.

The reference deliberately excludes aspirational syntax from implemented pages. Lifetimes, exceptions, and macros each have a separate Coming Soon page so search results do not blur present behavior with roadmap intent.
