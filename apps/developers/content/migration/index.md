---
title: Migration guides
description: Version-aware migration policy and known compatibility considerations for Prismio 0.1.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [migration, compatibility, versions]
related: [releases/0.1.0, specification/conformance, roadmap]
---

Version 0.1.0 is the first documentation baseline, so there is no earlier stable language release to migrate from. Code written against prototypes or the archived website may mention features that never existed in the self-hosted compiler.

Audit older code for these common mismatches:

- Replace `I32` with `Int`.
- Remove semicolons and expression-bodied functions.
- Replace namespaced module use with flattened dotted imports.
- Do not use traits, `impl`, generics, closures, exceptions, async, or macros.
- Treat ordinary move-only parameters as borrows; use `sink` for transfer and `inout` for mutable borrowing.
- Replace nullable sentinel tricks with `T?`, `none`, and `expect` where `T` is reference-shaped.
- Replace assumed `std.*` imports with compiler-known functions or explicit local FFI wrappers.

Future releases will receive dedicated `/migration/<from>-to-<to>` pages, with executable before/after examples and links from both releases.

