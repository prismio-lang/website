---
title: Prismio language specification
description: Draft compiler-derived specification for Prismio 0.1 syntax, semantics, types, names, memory, and conformance.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [specification, semantics, normative]
related: [language, specification/conformance, releases/0.1.0]
---

This section is the canonical **draft specification for Prismio 0.1.0**. It is derived from the self-hosted lexer, parser, semantic analyzer, AIF pass, LLVM code generator, and regression suite.

Normative words such as “must” describe behavior expected of a conforming 0.1 implementation. Because 0.1 predates a frozen language standard, tested compiler behavior takes precedence when this text and the compiler disagree. Report that disagreement as a specification defect.

## Scope

The specification covers source acceptance, static semantics, observable evaluation, ownership behavior, supported targets, and conformance for the 0.1 language. It does not standardize editor protocols, package registries, source formatting, native distribution channels, or features marked Coming Soon.

The LLVM IR emitted by the reference compiler is evidence about one implementation, not an additional source-language feature. An alternative conforming implementation may lower the same observable behavior differently.

## Normative vocabulary

- **must** or **must not** states a conformance requirement;
- **should** recommends portable or diagnosable behavior while allowing a documented reason to differ;
- **may** permits behavior without requiring it;
- **implementation-defined** means an implementation chooses and documents behavior;
- **unspecified** means the specification does not select among allowed outcomes; and
- **undefined** identifies a boundary for which the language promises no portable behavior.

Not every backend edge case is completely classified in 0.1. The [behavior boundary](/specification/behavior) page records known areas until that taxonomy is frozen.

The specification separates:

- [Grammar](/specification/grammar) and lexical acceptance
- [Name resolution](/specification/name-resolution)
- [Type-system rules](/specification/type-system)
- [Evaluation and control flow](/specification/evaluation)
- [Memory and ownership](/specification/memory-model)
- [Undefined and implementation-defined behavior](/specification/behavior)
- [Conformance and versioning](/specification/conformance)

Coming Soon features are excluded from normative grammar and semantics, even when a keyword token already exists.

## Evidence hierarchy

For 0.1, interpret conflicts in this order:

1. positive and negative behavior in the released reference compiler and regression suite;
2. this versioned specification;
3. the explanatory language reference;
4. tutorials, guides, cookbook entries, and examples; and
5. proposals or Coming Soon pages.

This hierarchy is a defect-resolution rule, not permission to leave disagreement in place. A confirmed mismatch should result in tests and documentation being updated together.

## Feature status

Implemented pages describe accepted surface for the 0.1 release. Experimental pages, including parts of AIF and WebAssembly lowering, are conforming only to their explicitly versioned experimental behavior and may change more aggressively. Draft pages are compiler-derived but not yet a frozen independent standard.

Traits, `impl`, user-defined generics, closures, user-written lifetimes, exceptions, macros, language concurrency, an importable standard library, and package-manager semantics are outside this specification.

## Version identification

Every specification record includes its language version. Unprefixed URLs currently describe the latest published version; future breaking versions may be snapshotted below `/versions/<version>/`. A tool retrieving documentation should use both URL and version metadata rather than combining rules from separate releases.
