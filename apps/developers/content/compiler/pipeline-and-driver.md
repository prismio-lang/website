---
title: Compiler pipeline and driver
description: How the Prismio driver carries source through imports, semantics, AIF, LLVM generation, object emission, and linking.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [compiler, pipeline, driver]
related: [compiler/overview, llvm/overview, runtime/overview]
---

`src/driver/compile.psm` owns the transition from a requested command to a verified artifact. It
connects stages that intentionally know little about one another.

## Pipeline

```text
entry source
  → recursive import loading and flattening
  → parsing and semantic analysis
  → AIF fact collection and tier selection
  → LLVM module construction and verification
  → optional IR emission
  → optimized object generation
  → runtime and native input linking
```

The frontend must reject invalid programs before IR generation. AIF is allowed to choose a more
conservative allocation tier, but it must not make an invalid source program valid. LLVM module
verification checks backend structure, not language semantics.

## Command-dependent exits

`check` runs the complete frontend without creating LLVM IR or invoking the linker.
`dump-ast` serializes frontend output for tooling and the AIF oracle. An output ending in
`.ll` stops after module generation. Native `build`, `run`, and `test` continue through
object generation and linking.

## Native compilation

The driver coordinates the generated program module, curated runtime IR when available, runtime
objects, and user-declared native link inputs. Curated-runtime construction is optional for
correctness: a failure falls back to separately compiled runtime code. Tests distinguish the normal
optimized path from that safe fallback.

`PRISMIO_BUILD_TRACE=1` prints timings for major native build stages. Use it to identify whether
a regression belongs to frontend work, program optimization, runtime compilation, or linking.

## Change discipline

New behavior should enter at its earliest semantic owner. Keep CLI parsing in `src/main.psm`,
project behavior in `src/project`, compilation orchestration in the driver, and target-specific
mechanics behind the runtime/backend bridge.

## Driver function reference

| Function | Inputs and result | Role in the pipeline |
| --- | --- | --- |
| `analyzedModule(path)` | source path → merged AST | Reads source, lexes/parses it, resolves imports, indexes declarations, desugars enums, expands monomorphization work, and runs semantic analysis |
| `dumpAstCommand(path)` | source path → exit status | Stops after analysis and serializes the resolved AST as JSON |
| `checkCommand(path)` | source path → exit status | Runs the full frontend without producing IR or a native artifact |
| `aifCommand(...)` | path plus report flags → exit status | Runs the analyzed module through AIF and selects human, summary, ownership, theta-field, explanation, or manifest output |
| `compileSource(...)` | path, output, run/bootstrap/JIT/debug/verify/optimization flags → exit status | Owns target setup, AIF profile passes, module generation, output paths, native build, optional execution, and cleanup |
| `checkRuntimeFreshness()` | no input | Compares the runtime embedded in the compiler with the working-tree/runtime hash before a build that depends on current C support |
| `reportForcedLayouts()` | no input | Reports command-line AIF layout overrides after analysis |

`src/main.psm` parses the public CLI. `main` dispatches to `cliCheck`, `cliDumpAst`,
`cliAif`, `cliBootstrap`, or the build/run path. It reads process arguments only through
`cli_arg_count` and `cli_arg`, so platform-specific `argc/argv` handling stays in
`runtime/program_support.c`.

For an ordinary build, `compileSource` configures `compiler_set_debug_info`,
`compiler_set_verify_mode`, the selected target/sysroot, overflow checks, and LLVM optimization.
It asks `compiler_temp_ir_path` for a private intermediate, calls `generateModule`, and writes
IR. An `.ll` output ends there. A native output continues through
`compiler_build_executable`; bootstrap uses `compiler_bootstrap_executable` so runtime C is
rebuilt from the checkout instead of copied from the older host. `run --jit` calls
`ir_jit_run_main`; ordinary `run` executes the linked temporary with
`compiler_run_executable`.

Workload-guided AIF is a deliberate two-pass path. `runWorkloadProfile` enables workload mode,
generates an instrumented executable, runs it with `compiler_run_workload`, and publishes the
profile only on success. The final analysis consumes that profile. `discardWorkloadProfile` and
`endWorkloadPass` reset mode and delete temporary state so one compile cannot contaminate the
next compiler invocation.

When adding a pipeline phase, define whether it requires parsed, imported, semantically resolved,
or AIF-annotated input; whether it mutates the AST or writes side tables; how it reports failure;
which temporary files it owns; and whether it must run in `check`, `dump-ast`, bootstrap,
workload, JIT, and native-build modes. Add order assertions, because a phase that happens to work
after code generation on one fixture may still violate the compiler's data contract.
