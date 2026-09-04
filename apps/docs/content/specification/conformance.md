---
title: Conformance and versioning
description: What it means to conform to the Prismio 0.1 draft specification and how future documentation versions will coexist.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [specification, conformance, versioning, compatibility]
related: [releases/0.1.0, migration, roadmap]
---

A Prismio 0.1 compiler conforms when it accepts valid programs described by this specification, rejects required static errors, and preserves the observable semantics covered here for supported targets.

Conformance is version-specific. Claiming conformance to “Prismio” without a language version is insufficient while the language is pre-1.0.

## Required behavior

A conforming implementation must:

- accept the implemented grammar when semantic requirements are met;
- assign compatible static types and enforce explicit conversion boundaries;
- implement documented control-flow and short-circuit behavior;
- reject required ownership violations and invalid control transfer;
- resolve dotted/wildcard imports with the specified entry-root and flattening rules;
- preserve documented copy, move, borrow, `sink`, `inout`, and `drop` behavior; and
- identify compilation failure with a nonzero process status.

It may choose a different internal AST, allocator strategy, IR, optimizer, object format, or linker pipeline as long as observable behavior and documented target requirements remain conforming.

## Reference oracle

The reference implementation and its positive/negative regression suite are the executable conformance oracle for 0.1. Diagnostics must identify the source location and cause, but exact prose and stable numeric error codes are not part of 0.1 conformance.

The suite includes positive programs that must compile and negative programs that must fail. A useful alternative-implementation harness should also test runtime output/exit behavior, import graphs, overload resolution, ownership transfers, optional failure behavior, and compiler self-host cases where applicable.

The reference implementation is not infallible. When a test contradicts a documented normative rule, the discrepancy is a conformance/specification defect requiring a deliberate decision—not an automatic new feature.

## Diagnostics

An implementation should report a path, source position, primary cause, and enough context for correction. It may recover and emit more than one independent diagnostic. Stable numeric error codes are not required in 0.1; documentation slugs such as `use-after-move` are permanent web identifiers rather than compiler protocol values.

## Experimental extensions

An implementation can expose extensions only when they do not cause invalid 0.1 programs to be silently reinterpreted as conforming standard programs. Extensions should be gated or clearly diagnosed. AIF experimental policy and WebAssembly integration must state their version/status separately.

Coming Soon pages are explicitly non-normative. A reserved lexer word, proposal, syntax highlighter rule, or documentation placeholder does not expand conformance until parser, semantics, lowering, diagnostics, and tests exist.

## Target conformance

Native compiler/build workflows are exercised on Windows, macOS, and Linux. Target conformance does not imply a stable binary ABI, identical system library surface, or universal foreign-library availability. WebAssembly output is experimental and does not yet carry the same end-to-end support promise.

## Documentation versioning

The current documentation uses unprefixed canonical URLs and places `version: 0.1.0` in every reference record. When a compatibility-breaking language version is published, the current tree can be snapshotted under `/versions/<version>/`, while unprefixed URLs continue to identify the latest release. Search indexes and `llms-full.txt` include the version and status of each record to avoid mixing versions.

Older pages must remain accessible with their own canonical version identity and must not claim to describe the latest compiler. Cross-version search results and AI retrieval should surface status/version metadata with every record.

## Conformance report checklist

A report should identify implementation name/version, language version, target triple or platform, host toolchain, optimization/configuration flags, the smallest source program, expected rule, observed behavior, and whether the reference compiler agrees. Generated LLVM IR can help diagnose the reference implementation but is not required for every alternate compiler.

Coming Soon pages are explicitly non-normative. They do not expand the conformance surface until moved to Implemented or Experimental and backed by compiler tests.
