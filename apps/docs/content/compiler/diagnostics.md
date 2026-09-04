---
title: Compiler diagnostics
description: Prismio 0.1 error rendering, recovery, warnings, notes, source spans, and permanent documentation identifiers.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [compiler, diagnostics, errors, warnings]
related: [errors, specification/conformance, compiler/cli]
---

Prismio diagnostics include the source path, line, column, source excerpt, and a primary message. The frontend can recover from selected lexer/parser/semantic failures and report multiple independent errors in one invocation. Notes and warnings provide secondary context where available.

## Diagnostic stages

A failure can originate in:

- source loading or import resolution;
- lexical tokenization;
- parsing and recovery;
- name, type, control-flow, or ownership analysis;
- AIF constraint analysis;
- LLVM IR generation/verification; or
- object generation and native linking.

The first useful correction is normally at the earliest failing stage. A parser recovery diagnostic can cause later names to be missing, so fix syntax errors before treating every follow-up message as an independent type defect.

## Source spans

Paths and positions identify the source that contributed the failing declaration after import resolution. A primary span points to the token/expression most directly responsible; notes may identify an earlier declaration, move, or candidate signature.

Column interpretation follows the compiler's current source accounting and should not be parsed as a byte-offset protocol by external tools without a versioned integration contract.

The compiler exits nonzero when compilation fails and does not emit a runnable artifact as though the program were valid.

When selected recovery succeeds, multiple diagnostics can appear. This does not mean later phases run on a program accepted as valid; it is error recovery for developer feedback.

Prismio 0.1 does **not** emit stable numeric error codes. The permanent identifiers used in this documentation—such as `use-after-move`—are URL keys for search and linking, not strings promised in compiler output. Each [error page](/errors) records the message fragment used by the audited tests.

## Reading a diagnostic

1. Locate the first primary error in the earliest source stage.
2. Read any note that points to the declaration, earlier move, or overload candidates.
3. Compare the operation's exact type and ownership mode.
4. Apply the smallest correction rather than casting, cloning through FFI, or adding annotations speculatively.
5. Recompile to reveal independent errors hidden by the first failure.

For ownership messages, distinguish mutability from ownership: `mut` enables assignment but does not revive moved data. For overload/type errors, remember that numeric widening is explicit. For optional errors, comparison with `none` does not flow-narrow; use `expect` where presence is established.

## Warnings and notes

A warning does not make compilation fail unless the driver documents otherwise. A note supplies context and is not independently actionable. 0.1 does not promise a stable warning-control flag set or warning-as-error policy.

When reporting a diagnostic bug, include the compiler version, full command, smallest source file that reproduces it, target platform, and complete output. Do not rely on color escape sequences or exact whitespace as a public API.

Also include imported reproducer files when name resolution matters, and emitted `.ll` when the failure occurs after semantic analysis. Remove secrets and machine-specific paths where possible while preserving the relevant directory layout.

The [error reference](/errors) is organized by permanent concepts rather than unstable numeric codes, so pages can remain linkable while diagnostic wording improves.
