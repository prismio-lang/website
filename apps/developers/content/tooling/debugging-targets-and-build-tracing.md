---
title: Debugging, targets, and build tracing
description: Separate frontend, AIF, LLVM, native-link, target, and runtime failures using Prismio's supported inspection commands.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
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
| Which native build stage is slow? | `PRISMIO_BUILD_TRACE=1` |
| Do source-level debugger views match? | Build with `-g`, then use LLDB or GDB |

## Targets

`--target` and `--sysroot` control cross-target compilation when the LLVM target, SDK,
linker inputs, and matching Prismio runtime archive exist. A successful IR emission does not prove
that the repository ships everything needed to link or run that target.

## Failure isolation

Emit textual IR to separate frontend/codegen success from object and link configuration. Disable
the curated runtime merge with `PRISMIO_INLINE_RUNTIME=0` when diagnosing that optimization
boundary. Use the exact compiler path and target triple in reports.

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
IR triple/layout, object generation, runtime archive availability, and final link.

## Build tracing

`build_trace_enabled` reads the supported trace switch. `build_trace_ms` provides monotonic
timestamps, and `build_trace_stage(name, start)` reports the elapsed stage. Instrumented stages
include runtime discovery/curation, IR-to-object compilation, cache lookup, native runtime objects,
linking, debug-symbol output, publish, and execution.

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
