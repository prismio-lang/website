---
title: Repository tour
description: A source-oriented map of the Prismio compiler, runtime, standard library, UMS build system, tests, and evidence.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [repository, architecture, contributing]
related: [compiler/overview, runtime/overview, tooling/ums-overview]
---

Prismio is organized by responsibility. Start at the directory that owns the earliest decision
your change affects.

| Path | Responsibility |
| --- | --- |
| `src/lexer` | Token vocabulary and UTF-8 scanner |
| `src/parse` | Declarations, statements, expressions, and recovery |
| `src/ast` | Syntax nodes, semantic types, and AST serialization |
| `src/sema` | Symbols, types, overloads, generics, traits, flow, and ownership |
| `src/aif` | Allocation facts, contracts, layout, solving, and reports |
| `src/ir` | LLVM types, expressions, statements, modules, and debug metadata |
| `src/driver` | Imports, workloads, and compile orchestration |
| `src/project` | UMS-facing CLI and project commands |
| `runtime/` | LLVM bridge, native runtime, platform code, and build driver |
| `std/` | Importable Prismio standard modules |
| `ums/` | Manifest parser, model, resolver, build plan, and commands |
| `tests/` | Positive, negative, ownership, AIF, IR, and toolchain regressions |
| `benchmarks/` | Equivalent Prismio, C++, and Rust workloads plus result artifacts |
| `aif/spec/` | Normative AIF model documents |
| `aif/evidence/` | Experiments, rejected ideas, and measured decisions |

## Entry points

`src/main.psm` parses the CLI. `cliCheck()`, `cliDumpAst()`, `cliAif()`, and `cliBootstrap()`
validate command-specific arguments; project-shaped commands are offered to `src/project/ums_cli.psm`.
`src/driver/compile.psm` then provides `checkCommand()`, `dumpAstCommand()`, `aifCommand()`, and
`compileSource()` so analysis-only commands share the same imports and sema as native compilation.

The frontend entry sequence is `scan()` → `parserCreate()` → `Parser.parseModule()` → recursive
import loading → semantic analysis. `src/sema/checker.psm` owns the main `semaExpr()` and
`semaStatement()` visitors, but specialized behavior lives beside its domain: generics, enums,
ownership, traits, flow, imports, and symbol resolution are separate modules. Follow a call before
assuming the large checker owns the entire rule.

At the backend boundary, `src/ir/module.psm` creates a module and stages declarations before bodies;
`src/ir/expr.psm` and `statement.psm` lower typed nodes. Their `ir_*` extern calls cross into
`runtime/llvm-api-backend.c`, where numeric handles index LLVM objects owned by the bridge.

The C boundary is split by trust and lifecycle. `runtime/llvm-api-backend.c` wraps the LLVM C API;
`runtime/lang_runtime.c` supplies managed values, collections, tasks, channels, and verifier hooks;
`runtime/program_support.c` implements arguments, files, processes, diagnostics, and platform-facing
services; `runtime/build_driver.c` turns verified IR into objects and native artifacts. Adding a
function to one file does not expose it automatically: declarations, AIF contracts, the shipped
bitcode module set, and packaging may all need updates.

## Tests and executable evidence

`tests/test_runner.py` is a registry plus specialized assertions, not only a directory glob.
Straightforward `test_*.psm` programs build and run; `neg_*.psm` programs assert rejection; ownership,
AIF, debug-info, cache, JIT, packaging, and fixed-point cases use dedicated Python functions that
inspect manifests or IR. `tools/aif_differential.py` compares the production pass with the Python
oracle. `tools/release_gate.py` composes the release-level checks. `benchmarks/run.py` owns the
cross-language measurement contract.

## Finding behavior

Search the positive and negative suites before changing source. Tests often provide the shortest
statement of current behavior. For memory decisions, inspect both `src/aif` and the matching
evidence document: AIF policy has changed through measurement, and historical prose can describe a
superseded experiment.

Use `rg` on the exact diagnostic text, runtime symbol, node kind, or `ir_*` call. Then read one
caller above and one callee below the match. That usually reveals whether the apparent owner is a
parser rewrite, semantic rewrite, AIF fact producer, LLVM operation, or runtime implementation.
