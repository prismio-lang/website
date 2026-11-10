---
title: Migration guides
description: Version-aware migration policy, the 0.1 to 0.2 guide, and known compatibility considerations.
status: stable
draft: false
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [migration, compatibility, versions]
related: [migration/0.1-to-0.2, releases/0.2.0, releases/0.1.0, specification/conformance, roadmap]
---

Version 0.1.0 was the first documentation baseline, so there is no earlier stable language release to migrate from. Code written against prototypes or the archived website may mention features that never existed in the self-hosted compiler.

Audit older code for these common mismatches:

- `I32` is accepted again, as another spelling of `Int`.
- Remove semicolons and expression-bodied functions.
- Replace namespaced module use with flattened dotted imports.
- Traits, `impl` blocks, generics and closures exist; exceptions and macros do not yet — see the [roadmap](/roadmap).
- Treat ordinary move-only parameters as borrows; use `sink` for transfer and `inout` for mutable borrowing.
- Replace nullable sentinel tricks with `T?`, `none`, and `expect` where `T` is reference-shaped.
- Replace assumed `std.*` imports with compiler-known functions or explicit local FFI wrappers.

Moving from 0.1 to 0.2 has its own page, [Migrating from 0.1 to 0.2](/migration/0.1-to-0.2). Each release receives a dedicated `/migration/<from>-to-<to>` page, with executable before/after examples and links from both releases.

