---
title: Contributing to the Prismio compiler
description: The entry point for developers building, testing, debugging, and extending the self-hosted Prismio toolchain.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [contributing, compiler, onboarding]
related: [start/repository-tour, start/development-setup, start/local-compiler-loop]
---

This portal documents the implementation of Prismio. It is for compiler, runtime,
standard-library, build-system, and tooling contributors. The language guide explains
how to write Prismio programs; these pages explain why the compiler accepts them, what
it generates, and how to change that behavior safely.

## Read in this order

1. [Tour the repository](/start/repository-tour) to learn which directory owns each decision.
2. [Prepare a development environment](/start/development-setup) with the pinned LLVM line.
3. [Learn the local compiler loop](/start/local-compiler-loop), including host promotion.
4. [Trace a first compiler change](/start/first-compiler-change) across the pipeline.
5. Use the compiler, AIF, LLVM, runtime, UMS, testing, and performance sections as reference.

## What counts as evidence

The current self-hosted source and regression suite are the executable authority. Architecture
documents explain intent; AIF evidence records explain measured decisions; generated LLVM IR and
native assembly explain what the backend actually emitted. When those layers disagree, document
the disagreement and add the smallest test that preserves the corrected behavior.

Every implementation claim in this portal should name its owning source or test. Performance
claims must additionally identify the result artifact, host, compiler flags, sample count, and
statistic being reported.

## How to read an implementation page

Paths are relative to the compiler checkout. Backticked function names are current source symbols,
not public API promises. A page should tell you four things: where a behavior enters the compiler,
which representation carries it, where the next stage consumes it, and which test fails if the
contract breaks. Use the source link as the starting point and follow the actual call graph; these
pages intentionally do not duplicate entire modules.

The status in front matter has a precise meaning. `implemented` means an audited end-to-end path
exists. `experimental` means that path exists but its policy or representation is expected to move.
`draft` describes a working document or proposal and must not be read as accepted compiler surface.

## Before opening a change

Confirm the selected compiler with `prismio --version`, reduce the behavior to one source file, and
find the nearest positive and negative tests. Record generated artifacts before editing when the
change affects AIF, LLVM, runtime layout, diagnostics, or build commands. That baseline is what
separates an intended change from collateral movement.

Use a named compiler generation for evidence. The project-local debug host is designed to move
during development; it is convenient, but an unqualified “current compiler” is not reproducible.

## Boundaries

Prismio is pre-1.0. Source syntax, internal representations, report schemas, and runtime ABI may
change. “Implemented” means present in the audited compiler, not permanently stable. Experimental
work must be labeled, and an unsupported capability must not be documented as a scheduled feature
unless the project has made that commitment elsewhere.
