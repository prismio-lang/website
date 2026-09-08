---
title: Add or change a diagnostic
description: Implement Prismio diagnostics with accurate source spans, recovery behavior, human prose, JSON output, and negative-suite coverage.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [cookbook, diagnostics, testing]
related: [compiler/diagnostics, tooling/ide-protocol, testing/regression-suite]
---

Emit a diagnostic at the earliest stage that has enough information to explain the violation.
Lexer errors own malformed characters and literals; parser errors own syntax; sema owns names,
types, ownership, bounds, and control-flow validity.

Prismio diagnostics are stored by the native registry exposed through
`src/common/diagnostics.psm`. The compiler-facing operations are not interchangeable:

| Function | Use |
| --- | --- |
| `diag_error_at_code()` | Error with stable code and source span |
| `diag_warning_at_code()` | Warning with stable code and source span |
| `diag_note_at()` | Source-located supporting context |
| `diag_error_code()` / `diag_warning_code()` | Command or environment failure without a source span |
| `diag_note()` | Non-primary explanation or suggested correction |
| `diag_finish()` | Finish the current diagnostic group |

`semaErrorAt()` supplies the general semantic error code; use a dedicated code when a rule needs a
stable identity across messages or tools. The file identifier comes from `diag_add_file()` during
source loading. Do not invent a path or recompute line/column from substrings when the AST node
already carries the original span.

## Required information

A diagnostic needs the source file, focused span, severity, concise problem, and a recovery action
when one is known. Prefer the source-level operation over the internal rewrite. If `a + b`
requires `std.string`, explain the missing import rather than exposing the helper name selected
inside sema.

Focus the primary span on the token the user must change. Attach a note to an earlier declaration
with `diag_note_at()` for duplicate definitions, conflicting impls, or mismatched signatures. Call
`diag_finish()` after the group; otherwise notes can attach to the next error or buffered JSON may
not form the expected record.

## Human and machine forms

`cliCheck()` switches the registry with `diag_set_json_mode(1)` when it sees
`--diagnostic-format=json`. The analysis path itself should not branch on presentation mode. Native
diagnostic code serializes one JSON object per completed diagnostic, while the human renderer may
add color and source context. Status and routing messages belong on stderr so stdout remains a
valid JSON Lines stream.

Recovery is part of the diagnostic contract. `Parser.error()` reports and synchronizes according to
the parser boundary; semantic visitors normally report and continue with an error or conservative
type. Callers of `compileSource()` check `diag_error_count()` before AIF and codegen. Never let an
error node reach LLVM as a substitute for correct recovery.

## Testing

Add a smallest `neg_*.psm` fixture and assert the stable meaning of the message. Check the span,
human form, and JSON record. When analysis should continue, add a recovery case containing a later
independent error.

Exercise the diagnostic through `prismio check`, because that is the editor-facing path. When the
same rule is reachable from `build`, verify it also exits nonzero and emits no output artifact. Test
the code, severity, path, line, column, length, message, and notes that consumers rely on; avoid
freezing terminal color or decorative whitespace.

Changing prose is not a reason to discard a stable diagnostic identity or machine field. Changing
the rule itself requires updating the language reference, migration notes when compatibility is
affected, and related compiler articles.
