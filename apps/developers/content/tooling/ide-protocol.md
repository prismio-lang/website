---
title: IDE and JSON diagnostics protocol
description: The analysis-only check command, versioned JSON Lines diagnostics, source positions, severities, and editor integration rules.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [ide, diagnostics, json]
related: [compiler/diagnostics, compiler/cli, cookbook/add-a-diagnostic]
---

Editors should invoke `prismio check <source.psm> --diagnostic-format=json`. The command runs
imports, parsing, semantic analysis, ownership checks, and relevant analysis without generating
LLVM IR, invoking the native linker, or creating an output artifact.

The wire contract is documented in the repository's `IDE_PROTOCOL.md`. Output is JSON Lines so a
client can process one diagnostic record at a time. Records identify schema version, severity,
message, source file, and source range according to the current protocol.

## Stream discipline

Machine records belong on stdout. Human status, routing information, and actionable host failures
belong on stderr. A single non-JSON prefix can make the entire stream unusable to an editor.

## Source positions

Lexer and parser ranges must survive import loading and later semantic diagnostics. Recovery can
produce multiple records from one file; clients must not assume one invocation stops after the
first error.

## Compatibility

Treat schema changes as protocol changes. Add fields compatibly where possible, update the version
when interpretation changes, and keep fixtures for multi-file paths, Unicode source, zero-width
locations, warnings, multiple errors, and malformed input. Exact human prose may evolve without
changing a stable machine category when the protocol provides one.

## Diagnostic production

`common/diagnostics.psm` owns compiler diagnostics. Parser and sema code call location-aware
helpers rather than printing directly. `semaErrorAt`, `semaWarningAt`, and
`semaTypeErrorAt` supply the node span and source-level meaning; the shared diagnostic layer
chooses human or machine serialization.

The file table is created while the entry source and imports are loaded. Each AST/token span carries
that file ID plus line, column, and source offsets. Machine output resolves it to the original path;
it must not relabel all imported diagnostics as the entry file.

A machine record contains, at minimum, severity, message, source path, start/end position, and the
compiler's available stable category/code. Multiple records use JSON Lines: one complete JSON
object per line, never a JSON array mixed with status text.

## Stream discipline

Machine data goes to stdout. Build progress, host forwarding, target selection, and explanatory
status go to stderr. `aif --manifest` follows the same rule. Callers can then pipe stdout into an
IDE/parser without filtering human text.

`umsDiagnosticAdd` is the UMS counterpart. It stores code, manifest path, line, column, token
length, message, and recovery. `umsDiagnosticsPrint` renders the collection after parsing,
lowering, and validation, allowing one run to report several independent manifest issues.

## AST and source tooling

`dumpAstCommand` uses `dumpAstJson` for a resolved compiler view. `jsonString`,
`jsonFieldStr`, `jsonFieldInt`, `dumpNode`, `dumpChain`, and `dumpFileTable` guarantee
valid escaping and stable structural names. This output is useful to editors and compiler tests,
but it is not a source formatter or a stable public semantic API.

Protocol tests should parse every emitted line with a real JSON parser; assert Unicode escaping,
CRLF and multiline spans, imported-file paths, zero-width EOF errors, warnings mixed with errors,
several recoverable errors, UMS diagnostics, empty success output, and strict stderr separation.
