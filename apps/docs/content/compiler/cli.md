---
title: Compiler command-line reference
description: Complete Prismio 0.1 build, run, bootstrap, AST, AIF, target, optimization, and verification command reference.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-03"
tags: [compiler, cli, flags, commands]
related: [start/build-and-run, compiler/aif, compiler/targets]
---

## General commands

```text
prismio build <source.psm> [-o output] [options]
prismio run <source.psm> [options]
prismio bootstrap [source.psm] [-o output]
prismio dump-ast <source.psm>
prismio aif <source.psm> [aif-options]
prismio runtime-hash
prismio --version
```

Passing a `.psm` file without a command is accepted as a build shorthand. Prefer the explicit form in scripts.

The same commands with **no source named** act on the project the nearest ancestor `build.ums` describes, and a project may declare commands of its own that are invoked the same way:

```text
prismio init [name]
prismio build|run|test|clean [--release]
prismio <declared-command> [args...]
```

Built-in commands take precedence, so a manifest cannot redefine one. See [the package manager](/package-manager) for the manifest and for declaring commands.

`--help` prints the command summary. `--version` reports the Prismio compiler and linked/pinned LLVM version information used to identify documentation compatibility.

## `build`

```bash
prismio build src/main.psm -o build/app
```

`build` resolves source/imports, runs compiler analysis, emits LLVM IR, and—unless the output ends in `.ll`—creates and links a native artifact. The input file's directory is the source import root.

If `-o` is omitted, the driver chooses its current default output. Automation should pass an explicit path so artifacts do not depend on host naming conventions.

## `run`

```bash
prismio run src/main.psm
```

`run` performs a build and launches the resulting program after successful compilation. Compiler or linker failure exits nonzero and does not execute a stale artifact as though it were the requested program.

## `bootstrap`

```bash
prismio bootstrap src/main.psm -o build/prismio-next
```

`bootstrap` is the compiler-development path. It builds the compiler with repository backend/runtime sources rather than linking only the installed application runtime. Prefer repository bootstrap scripts for multi-generation and platform-specific orchestration.

## Inspection commands

`dump-ast` parses a source entry and prints the compiler's current AST representation for development. The textual representation is diagnostic/internal and is not a stable machine protocol.

`runtime-hash` prints the identity used to reason about the embedded/installed runtime content. It helps distinguish a compiler built with different runtime sources.

## Build options

| Option | Effect |
| --- | --- |
| `-o <path>` | Select output path; `.ll` emits LLVM IR only |
| `-O0` … `-O3` | Select requested optimization level |
| `--verify` | Instrument and check allocation/free behavior |
| `--debug` | Use conservative analysis and extra debugging behavior |
| `--target wasm32` | Emit a WebAssembly-targeted module (experimental) |

`-O0` through `-O3` are accepted front-end optimization requests. In 0.1, the object-generation driver also has current Clang optimization behavior, so a flag should not be interpreted as a frozen end-to-end pipeline contract. Record the complete compiler version and command in benchmarks.

`--verify` adds supported allocation/free lifecycle instrumentation. It can change performance and is intended for testing. `--debug` selects conservative analysis/debug behavior; it is not a promise of an integrated source debugger.

WebAssembly changes target layout/pointer width but does not provide complete browser or WASI packaging.

## AIF options

| Option | Effect |
| --- | --- |
| `--manifest` | Print the stable line-oriented compiler/CI manifest |
| `--summary` | Print an allocation-tier summary |
| `--why=<ID\|symbol>` | Explain a numbered report decision or stable manifest symbol |
| `--budget=<n>` | Set a positive analysis budget |
| `--theta-fields` | Include theta field information |
| `--owned-collections` | Treat collection ownership explicitly |
| `--copyable-collections` | Select copyable collection analysis mode |

Unknown commands and malformed flags exit nonzero. The default AIF report is an interactive interface and may evolve; use `aif --manifest` when automation needs the stable line-oriented protocol.

## Exit behavior

Successful inspection/build operations exit zero. Invalid arguments, missing input, compilation failure, IR verification failure, object/link failure, or a failed run step produce a nonzero result.

Do not parse color, whitespace, or prose from interactive commands as a stable API. For AIF records use `--manifest`; for other commands assert the exit status and expected artifact, and for negative compiler tests match only the diagnostic fragment needed to identify the rule.

## Script examples

Build a debuggable IR artifact:

```bash
prismio build src/main.psm -o build/main.ll -O0
```

Build a verified native test artifact:

```bash
prismio build tests/ownership.psm -o build/ownership-test --verify
```

Inspect one allocation decision:

```bash
prismio aif src/main.psm --why=request_buffer
```

Because the CLI is pre-1.0, scripts should also pin `prismio --version` and fail early when it differs from the expected toolchain.
