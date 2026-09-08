---
title: Compiler diagnostics
description: Prismio 0.1 error rendering, recovery, warnings, notes, source spans, and permanent documentation identifiers.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [compiler, diagnostics, errors, warnings]
related: [testing/regression-suite, tooling/ide-protocol, compiler/cli]
---

Prismio diagnostics include a stable `P####` code, source path, line, column, focused length, severity,
and primary message. The frontend can recover from selected lexer, parser, and semantic failures and
report multiple independent errors in one invocation. Notes and warnings provide secondary context.

The self-hosted declaration surface is in `src/common/diagnostics.psm`; storage, rendering, and JSON
serialization are implemented by the native diagnostic registry. `diag_add_file()` assigns the file
identifier carried by tokens and AST nodes. `diag_set_file_module()` attaches the resolved module
qualifier so later visibility diagnostics can describe both source and namespace.

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

Prismio 0.1 emits permanent string codes grouped by owner: driver/project `P10xx`, lexer `P2001`,
declarations `P30xx`, expressions `P3101`, parser core `P3201`, statements `P33xx`, ownership/FFI
`P41xx`, and AIF `P50xx`. General sema errors currently use `P4001`/`P4002`, so the code identifies
the subsystem more precisely than every individual semantic rule. Preserve an existing code when
only improving prose; allocate a new one when tooling must distinguish a new contract.

## Emission lifecycle

Use `diag_error_at_code()` or `diag_warning_at_code()` for a source-located primary. Add supporting
locations with `diag_note_at()` and prose with `diag_note()`, then call `diag_finish()` to close the
group. Command failures without a source use `diag_error_code()` or `diag_warning_code()`.
`diag_error_count()` is checked by driver stages before AIF and LLVM generation; `diag_reset()`
clears the registry between compiler operations.

`cliCheck()` handles `--diagnostic-format=json` by calling `diag_set_json_mode(1)`. The lexer,
parser, and sema do not select a renderer; the same diagnostic group becomes either human output or
one JSON object. This keeps presentation changes from changing compiler control flow.

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

Regression tests should bind to the stable meaning and relevant source span rather than incidental
punctuation, so diagnostic wording can improve without erasing compatibility intent.
