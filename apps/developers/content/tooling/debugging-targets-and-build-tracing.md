---
title: Debugging, targets, and build tracing
description: Separate frontend, AIF, LLVM, native-link, target, and runtime failures using Prismio's supported inspection commands.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [debugging, targets, tracing]
related: [llvm/debug-information, compiler/cli, runtime/platform-and-packaging]
---

Choose the inspection boundary that can still reproduce the failure.

| Question | Tool |
| --- | --- |
| Does the source parse and type-check? | `prismio check` |
| What frontend structure was produced? | `prismio dump-ast` |
| Where will values live? | `prismio aif` and `--why` |
| Did runtime ownership match the plan? | `prismio build --verify` |
| Is generated IR valid? | Emit `.ll` and use LLVM verification |
| Which native build stage is slow? | `PRISMIO_BUILD_TRACE=1` (then `PRISMIO_SAVE_IR=<file>` to time `opt`/`llc` on the exact module) |
| Which frontend phase is slow? | `PRISMIO_PHASE_TIMES=1` |
| What does unused standard library still cost? | `PRISMIO_PRUNE=0` turns off unreachable-function pruning, for an A/B |
| Is a parallel-codegen partition malformed? | `PRISMIO_CODEGEN_VERIFY=1`, or `PRISMIO_CODEGEN_THREADS=1` to emit whole |
| Do source-level debugger views match? | Build with `-g`, then use LLDB or GDB |

## Targets

`--target` and `--sysroot` control cross-target compilation when the LLVM target, SDK, linker
inputs, and runtime bitcode for that triple exist under `lib/runtime/<triple>/`. A successful IR
emission does not prove that the toolchain ships everything needed to link or run that target; a
missing module is reported by name rather than as a generic link failure.

## Failure isolation

Emit textual IR to separate frontend/codegen success from object and link configuration. The
library bitcode merge has no bypass — there is no supported build that skips it, and the obsolete
`PRISMIO_INLINE_RUNTIME` is ignored — so isolate that boundary by reading the merged module
(`-o out.ll` before the merge, `PRISMIO_BUILD_TRACE=1` for the stage timing) rather than by turning
it off. Use the exact compiler path and target triple in reports.

For memory bugs, combine value assertions, the verifier ledger, AIF explanation, and a native
sanitizer. Each observes a different class of failure.

## Target selection

`common/target.psm` owns the selected triple, data layout, pointer width, and explicit/default
state. `ir_target_select` asks LLVM to validate a triple and derive its layout.
`ir_target_triple`, `ir_target_data_layout`, `ir_target_pointer_bits`, and
`ir_target_is_explicit` expose the result. `ir_module_set_target` stamps both strings on every
generated module.

`compiler_set_sysroot` records an explicit SDK root. `target_clang_flags` converts target and
sysroot into native compiler arguments. `find_llvm_paths` resolves the LLVM installation used to
build/link backend and runtime support. Diagnose these layers separately: frontend acceptance,
IR triple/layout, object generation, runtime bitcode availability for the triple, and final link.

## Build tracing

`build_trace_enabled` reads the supported trace switch. `build_trace_ms` provides monotonic
timestamps, and `build_trace_stage(name, start)` reports the elapsed stage. Instrumented stages
include runtime discovery/curation, IR-to-object compilation, cache lookup, native runtime objects,
linking, debug-symbol output, publish, and execution.

`PRISMIO_PHASE_TIMES=1` times the frontend the same way, one line per phase on stderr
(`diag_phase_time` in `runtime/diagnostics.c`), keyed on the names the progress line already
carries: parsing, resolving imports, checking types, analysing ownership, generating IR. It costs a
`getenv` per phase. Read it beside `PRISMIO_BUILD_TRACE=1`: on a program that prints one line the
frontend is about 3 ms of a 36 ms build, the runtime and library bitcode merge 7 ms (1.6 ms
less on macOS and Linux, where only the definitions a program reaches are read and linked), optimisation
and machine code 6 ms, and the link 15 ms.

The link is `ld` run directly. `cc -###` is asked once what it would run, and the answer is kept
in `$TMPDIR/prismio-link-cache` with the object and output as markers; each absolute path in it,
and `/var/db/xcode_select_link`, is recorded by identity, so an Xcode update or an `xcode-select`
switch sends the next build back to the driver. The trace says which path a build took:
`link (ld)` or `link (driver)`. A target with native objects, link arguments or exports, a
freestanding target and every non-Mach-O target always take the driver. `PRISMIO_LINK_CACHE=0`
forces the driver, for an A/B; the two produce byte-identical executables.

`PRISMIO_PRUNE=0` keeps every imported standard-library function through the ownership analysis and
IR generation instead of dropping the ones the program cannot call (`src/driver/prune.psm`). The two
must emit the same machine code for anything the program does call; the switch exists to measure
what the unused ones cost and to A/B a change to reachability.

Object-cache tracing is separate. `object_cache_trace` reports the computed key and hit/miss
decision; `object_cache_disabled` forces a real rebuild. A suspicious performance or correctness
result should be reproduced with caching disabled.

## Compiler inspection boundaries

- `prismio check` isolates lexer/parser/import/sema.
- `prismio dump-ast` exposes the resolved AST before AIF/backend.
- `prismio aif --why <site>` explains memory facts and placement.
- `prismio build file.psm -o file.ll` stops at textual LLVM IR.
- Native build tracing exposes object/runtime/link steps.
- `--verify` instruments runtime memory actions.
- ASan and TSan cover native memory/race behavior outside the verifier's model.

When filing a target failure, include `prismio --version`, host OS/architecture, requested triple,
sysroot, compiler path, runtime hashes, complete command, first failing stage, emitted IR/object
availability, and the relevant trace. “Cross compilation failed” is not enough to identify whether
LLVM, the runtime, SDK, linker, or manifest owns the problem.
