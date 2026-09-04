---
title: Macros
description: Status of planned metaprogramming support in Prismio; no macro system exists in compiler 0.1.
status: coming-soon
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [macros, metaprogramming, coming-soon]
related: [language/lexical-structure, compiler/overview, roadmap]
---

Prismio 0.1 has **no macro system**: no textual preprocessor, hygienic syntax macros, procedural macros, derive system, or compile-time execution facility.

Use ordinary functions or generate `.psm` source outside the compiler when necessary. Any future design must specify expansion order, hygiene, diagnostics, reproducibility, and interaction with imports.

