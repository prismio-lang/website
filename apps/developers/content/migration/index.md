---
title: Migration guides
description: Version-aware migration policy and current checks for code written against earlier Prismio prototypes or documentation.
status: draft
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [migration, compatibility, versions]
related: [releases/0.1.0, project/security-and-compatibility, roadmap]
---

Version 0.1.0 is the first maintained documentation baseline, so there is no earlier stable release
to migrate from. Prototype-era source and archived documentation can contain both removed syntax
and assumptions that newer compiler work has since implemented differently.

## Audit prototype code

- Replace obsolete scalar names with the current explicit-width types.
- Recheck semicolon, return, and expression-body syntax against the current parser.
- Recheck imports, visibility, selective imports, and module-qualified calls.
- Treat ordinary move-only parameters as borrows; use `sink` for transfer and `inout` for
  mutable borrowing.
- Replace hand-written generic or trait workarounds where the current implementation now supports
  generics, impl blocks, traits, associated items, trait objects, or `impl Trait`.
- Recheck closure captures because current closures capture by value.
- Recheck enum and optional layouts; payload enums, `Option`, `Result`, and null-variant
  optimizations now have compiler support.
- Move project configuration into `build.ums` and declare native link inputs explicitly.
- Replace direct calls into internal runtime symbols with supported `std.*` wrappers where one exists.

## Verification

Pin the compiler revision, run `check`, add negative cases for assumptions the new compiler
rejects, then execute with `--verify` when ownership or allocation behavior changed. Compare
generated IR only after source semantics pass.

Future compatibility breaks receive dedicated from-to guides with complete before and after
examples, manifest changes, and links from both releases.

## Find the owning break

Use the earliest failing command to classify old code:

| Failure | Inspect first |
| --- | --- |
| Token or syntax rejection | `src/lexer`, `src/parse`, and negative tests |
| Import/name failure | `src/driver/imports.psm`, `src/sema/symbols.psm` |
| Type, trait, or generic failure | `src/sema/types.psm`, `checker.psm`, `generics.psm` |
| Use-after-move or FFI contract failure | `src/sema/ownership.psm` |
| Project manifest failure | `ums/parser` and `ums/model` |
| Native link/runtime failure | emitted `.ll`, `runtime/`, target and UMS link inputs |

Run `prismio check --diagnostic-format=json` when converting many files so stable codes and spans
can be collected without parsing terminal decoration. Do not bulk-rewrite after the first parser
error: one obsolete delimiter can change recovery and create misleading downstream failures.

## Generated artifacts are not migration inputs

Do not carry LLVM IR, object files, `.prismio/build` outputs, or a project-local compiler host from
an older compiler into a new baseline. Rebuild them from source and a named trusted generation.
When the runtime or LLVM major changes, clear or bypass the object cache once and compare build
traces. Persistent caches are keyed, but a migration investigation should prove the new path rather
than assume it.

For memory-semantic changes, preserve both the old and new AIF manifests. A different tier can be a
policy change without a source error; verify the program's value, `--why` witness, and `--verify`
ledger. For ABI changes, rebuild every foreign adapter and validate widths/layouts on each target.
