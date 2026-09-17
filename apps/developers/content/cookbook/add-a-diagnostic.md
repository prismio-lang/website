---
title: Add or change a diagnostic
description: Implement Prismio diagnostics with accurate source spans, recovery behavior, human prose, JSON output, and negative-suite coverage.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [cookbook, diagnostics, testing]
related: [compiler/diagnostics, tooling/ide-protocol, testing/regression-suite, start/repository-tour]
---

## What a diagnostic is for

A diagnostic is the only thing standing between "the compiler rejected my program" and "I know what to change." A vague message sends the reader back into the source to guess; a good one names the exact rule, points at the token to fix, and — because a tool may be reading the same stream instead of a person — carries a code that stays stable while the prose around it improves. This page walks through adding one: which function to call, at which compiler stage, and how to prove the result holds up under both the human renderer and an editor's automation.

Emit a diagnostic at the earliest stage that has enough information to explain the violation. The lexer owns malformed characters and literals; the parser owns syntax; semantic analysis (**sema**) owns names, types, ownership, bounds, and control-flow validity. Reporting a syntax problem as a type error, or vice versa, means the wrong stage is doing the wrong job.

## See it work

Given a program that assigns a `String` where an `Int` is declared:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count: Int = "three"
    return count
}
```

The human-facing form:

```bash
prismio check broken.psm
```

```text
error[P4001]: initializer for `count`: expected Int, found String
 --> broken.psm:2:22
  |
2 |     let count: Int = "three"
  |                      ^^^^^^^
error: aborting due to 1 previous error
```

And the same diagnostic as JSON (JavaScript Object Notation), the form an editor's language server reads:

```bash
prismio check broken.psm --diagnostic-format=json
```

```text
{"kind":"diagnostic","schemaVersion":1,"severity":"error","code":"P4001","file":"broken.psm","line":2,"column":22,"length":7,"message":"initializer for `count`: expected Int, found String"}
{"kind":"summary","schemaVersion":1,"errors":1,"warnings":0}
```

Both forms come from one call to `diag_error_at_code()`; nothing in the analysis path branches on which renderer is active. `prismio check` prints nothing at all when a program is valid — silence is the success case, not an omission you need to go looking for.

## What failure looks like

The same rule has to reject the program at `build`, not only at `check`, and it must not leave a stray output file behind when it does:

```bash
prismio build broken.psm -o broken.ll
```

```text
error[P4001]: initializer for `count`: expected Int, found String
 --> broken.psm:2:22
  |
2 |     let count: Int = "three"
  |                      ^^^^^^^
error: aborting due to 1 previous error
```

`broken.ll` is not written. If your new diagnostic fires under `check` but a later stage still produces an artifact, an error node reached code generation instead of stopping the pipeline — see **Recovery is part of the contract** below.

The other way a new diagnostic fails is quieter: its fixture's expected text drifts from what the compiler actually prints. `run_negative_test()` in `tests/test_runner.py` does not accept "the program was rejected, for any reason" — it reads every `// expect-error: <substring>` comment in the fixture and requires each one to appear in the compiler's combined output. A mismatch reports `Rejected, but not for the expected reason. Missing: [...]` and prints what the compiler said instead, so a message that quietly changed meaning is caught in the same test that would otherwise call it a pass.

## A worked example: two independent errors

Redeclaring a function shows both the source-located note and the parser's recovery behavior in one run:

<!-- prismio-check: fail -->
```prismio
fn helper() -> Int {
    return 1
}

fn helper() -> Int {
    return 2
}

fn main() -> Int {
    return helper()
}
```

```bash
prismio check dup.psm
```

```text
error[P4001]: duplicate definition of `helper` with the same parameter types
 --> dup.psm:5:4
  |
5 | fn helper() -> Int {
  |    ^^^^^^
  note: the first definition is here
 --> dup.psm:1:4
  |
1 | fn helper() -> Int {
  |    ^^^^^^
error[P4001]: ambiguous call to `helper`: more than one overload matches these arguments
  --> dup.psm:10:12
   |
10 |     return helper()
   |            ^^^^^^
error: aborting due to 2 previous errors
```

Two things worth separating here:

- The **note** under the first error is `diag_note_at()`, attached to the *earlier* declaration rather than the one that failed. That is the general pattern for duplicate definitions, conflicting `impl`s, and mismatched signatures: point the primary span at what the reader must change, and note the thing it conflicts with.
- The **second, independent error** is recovery: sema kept going after the duplicate definition and found a real, separate problem — the call to `helper()` is now ambiguous. Recovery is only useful when the second error is genuine. Letting an error node stand in for a valid one and reporting a cascade of nonsense would be worse than stopping after the first failure.

## Which function to call

Diagnostics are stored by the native registry declared in `src/common/diagnostics.psm`. The operations are not interchangeable:

| Function | Use |
| --- | --- |
| `diag_error_at_code()` | Error with a stable code and a source span |
| `diag_warning_at_code()` | Warning with a stable code and a source span |
| `diag_note_at()` | Source-located supporting context (an earlier declaration, a conflicting signature) |
| `diag_error_code()` / `diag_warning_code()` | Command or environment failure with no source span |
| `diag_note()` | Non-primary explanation or suggested correction |
| `diag_finish()` | Close the current diagnostic group |

`semaErrorAt()` is the one function behind the generic `P4001` code — every general semantic error that has not been given its own identity goes through it. That makes `P4001` a poor search target: grepping for the code lands you in one function that emits hundreds of different messages, not the rule you are chasing. Search for a fragment of the message text instead, then read one caller above and one callee below the match; [the repository tour](/start/repository-tour) traces exactly this diagnostic as a worked example. Allocate a dedicated code instead of `P4001` when a rule needs a stable identity across message wording changes, or when tooling needs to distinguish it from every other semantic error.

The file identifier a diagnostic reports comes from `diag_add_file()`, called during source loading — do not invent a path or recompute a line/column from a substring search when the AST node already carries the original span. Call `diag_finish()` once the group is complete; skipping it can let a later note attach to the wrong diagnostic, or leave a buffered JSON record incomplete.

## Required information

A diagnostic needs the source file, a focused span, a severity, a concise problem statement, and a recovery action when one is known. Prefer the source-level explanation over the internal rewrite that produced it: if `a + b` requires `import std.string` because addition on two values desugars to a string method, say so — do not expose the name of the helper function sema selected internally.

Focus the primary span on the token the reader must change, as `broken.psm:2:22` does above. Use `diag_note_at()` for context located elsewhere, as `dup.psm` does above.

## Recovery is part of the contract

`Parser.error()` reports and synchronizes according to the parser's own recovery boundary — one bad token does not have to abort the whole file. Semantic visitors normally report an error and continue with an error type or a conservative substitute, so that one mistake does not hide the next one, exactly as `dup.psm` showed above. Callers of `compileSource()` check `diag_error_count()` before allocation inference and before code generation; an error node must never reach LLVM as a stand-in for correct recovery, because the compiler's guarantee is that everything past semantic analysis is a program sema has already accepted.

## Human and machine forms

`cliCheck()` switches the registry into machine mode with `diag_set_json_mode(1)` when it sees `--diagnostic-format=json`, as shown in **See it work** above. Lexer, parser, and sema code never branch on which mode is active — a diagnostic is raised once and rendered twice. Native diagnostic code serializes one JSON object per completed diagnostic; the human renderer may add color and source context on top of the same data. Status and routing messages belong on stderr, so stdout stays a valid JSON Lines stream for a tool that only wants the diagnostics.

## Testing checklist

- Add the smallest `neg_*.psm` fixture that reproduces the rule, with a `// expect-error:` comment naming the stable part of the message (see `dup.psm` and `broken.psm` above for the shape).
- Run it on its own before touching anything else:

```bash
python3 tools/run_suite.py --no-interactive -k neg_01_type_mismatch
```

```text
Found 1 negative test(s)
Running file fixtures on 8 worker(s)

  [  1/1] (100%) ok     0.68s  neg_01_type_mismatch

  file fixtures: 0.7s (1 passed, 0 failed)
```
(excerpt — trimmed the banner header and the final pass/fail summary, both unchanged boilerplate)

- Exercise the diagnostic through `prismio check`, because that is the editor-facing path. If the same rule is also reachable from `build`, confirm it exits nonzero there too and writes no output file, as shown above.
- When analysis should continue past the error, add a recovery case containing a later, independent error — the way `dup.psm`'s ambiguous-call error follows its duplicate-definition error.
- Assert the code, severity, path, line, column, length, message, and any notes that consumers rely on. Do not freeze terminal color or decorative whitespace; those are not part of the contract.
- Changing prose is not a reason to discard a stable diagnostic identity or a machine field. Changing the *rule* itself requires updating the language reference, migration notes when compatibility is affected, and any related developer-portal pages.

## If you are changing diagnostic infrastructure

The full family of codes — driver/project `P10xx`, lexer `P2001`, declarations `P30xx`, expressions `P3101`, parser core `P3201`, statements `P33xx`, ownership/FFI (foreign function interface) `P41xx`, AIF (Adaptive Inference Framework) `P50xx`, and general sema `P4001`/`P4002` — is listed on the [diagnostics reference](/compiler/diagnostics), with the emission lifecycle (`diag_error_at_code()` → `diag_note_at()`/`diag_note()` → `diag_finish()`) and the JSON schema. Read it before adding a code so a new one does not collide with an owner it does not belong to.

`diag_set_file_module()` attaches the resolved module qualifier a file was imported by, so later visibility diagnostics (`public`/`private`/`internal`) can name both the source file and the namespace it was reached through. `diag_reset()` clears the registry between independent compiler operations, which matters for anything that runs `compileSource()` more than once in a process, such as a language-server host.
