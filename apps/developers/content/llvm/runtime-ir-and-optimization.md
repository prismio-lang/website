---
title: Runtime IR and optimization
description: Runtime-module curation, module linking, LLVM verification, optimization levels, alias metadata, object emission, and ORC JIT execution.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, runtime-ir, optimization]
related: [llvm/llvm-c-bridge, compiler/loop-guards, performance/investigation-method]
---

Prismio emits program IR and combines it with runtime support before producing a native artifact.
The backend also runs LLVM's standard optimization pipeline and offers an opt-in ORC JIT path.
These are separate mechanisms: changing execution mode must not change the module generated from
the source program.

## Verification and optimization order

`ir_set_opt_level` clamps the requested level to 0–3. `ir_write_file` then:

1. calls `LLVMVerifyModule` on the unoptimized module;
2. runs `run_optimization` when the level is greater than zero;
3. verifies the optimized module again; and
4. writes textual IR using `LLVMPrintModuleToFile`.

Verifying before optimization preserves the useful failure boundary. Passing invalid IR into the
pass pipeline can produce an opaque crash or a secondary error far from the builder call that
created it. Verifying afterward catches any invalid metadata or transformation assumptions exposed
by the pipeline.

`run_optimization` constructs `default<O1>`, `default<O2>`, or `default<O3>`, creates
`LLVMPassBuilderOptionsRef`, and calls `LLVMRunPasses`. It passes no target machine, so this is
LLVM's target-independent module pipeline; the later native tool still performs target-specific
instruction selection and machine optimization.

`O1` already matters because Prismio deliberately emits addressable slots for source bindings.
Mem2reg and SROA remove ordinary stack traffic. Higher levels add inlining, loop transforms,
vectorization, global simplification, and more aggressive code-size/runtime tradeoffs.

## Metadata supplied to the optimizer

Optimization is only sound when the backend exposes facts it has proved:

- `tag_scalar` attaches scalar TBAA to ordinary loads and stores.
- `struct_field_tbaa_tag` creates struct-path tags using target offsets.
- `tag_list_header` separates header fields such as length, capacity, element size, and data.
- `tag_list_element` identifies element storage without claiming it cannot alias another element.
- `tag_list_region` scopes a proven non-overlapping element region.
- `tag_data_view` distinguishes view fields and backing storage.
- `tag_invariant_load` marks a load invariant only when mutation cannot invalidate it.
- `tag_list_count_range` attaches a valid integer range after the runtime invariant is known.

The backend also tags known runtime declarations. List constructors can receive return `noalias`
and function memory/nounwind/willreturn attributes. Mutator declarations receive conservative
memory behavior. These are not performance hints: an incorrect alias or memory attribute gives
LLVM permission to change observable behavior.

The guarded list operations in `llvm-api-backend.c` are designed to expose fast paths:
`ir_list_flat_scalar_elem`, `ir_list_flat_scalar_set`, `ir_list_flat_push_scalar`,
`ir_list_flat_copy`, and `ir_list_flat_zero_append` create checked straight-line access when
the frontend has emitted the necessary representation, capacity, and range guards. The fallback
calls the ordinary runtime helper.

## Runtime-module curation

Runtime support may arrive as LLVM IR. The curation path parses the module, finds declaration-only
list functions, and attaches attributes the generic runtime build cannot express portably. It uses
`LLVMGetFirstFunction` and `LLVMGetNextFunction` to inspect symbols, then verifies and writes
the curated module.

`ir_link_modules(dest_ir, src_ir, out_path)`:

- creates a fresh context;
- reads both files with `LLVMCreateMemoryBufferWithContentsOfFile`;
- parses them with `LLVMParseIRInContext`;
- calls `LLVMLinkModules2`, which consumes the source module;
- writes the combined module; and
- disposes only the objects still owned by the caller.

LLVM object ownership matters here. Disposing the source module after a successful
`LLVMLinkModules2` is a double-free; omitting disposal of the destination/context on an early
parse error leaks compiler-process memory.

## Object and native output

Target selection creates `LLVMTargetMachineRef` from the chosen triple. The object path sets the
module triple/layout, runs verification and optimization, and emits a target object with
`LLVMTargetMachineEmitToFile`. The build driver then invokes the platform linker with the
runtime archive and UMS native link inputs.

An `.ll` output intentionally stops before native object/link stages. It is the best debugging
boundary for checking type shapes, call attributes, ownership helpers, vtables, blocks, and
optimizer effects.

## ORC JIT path

`ir_jit_run_main` is used only for explicit JIT execution. It initializes the native target and
assembly printer, creates an LLJIT instance, and makes host-process symbols visible. The existing
module cannot be handed directly to LLJIT because it belongs to the backend's context.

The function therefore:

1. serializes `g_module` with `LLVMWriteBitcodeToMemoryBuffer`;
2. creates a new `LLVMContextRef`;
3. parses the bitcode into that context;
4. transfers the context to an ORC thread-safe context;
5. transfers the parsed module to a thread-safe module;
6. adds it to the JIT dylib;
7. looks up the generated `main`; and
8. calls it with the program-support argument globals already initialized.

Every ORC operation returns `LLVMErrorRef`. `jit_failed` and `jit_failed_unresolved` convert
those objects to messages and dispose them. Ownership transfer is explicit: after an ORC
constructor consumes a context/module, the original cleanup path must not dispose it.

## Evaluating an optimization change

Start from equal source and checksums. Compare unoptimized IR, optimized IR, and final assembly.
Record function mnemonic counts so metadata-only movement does not look like code growth. Use an
A/A timing floor, multiple samples, medians, and the checked-in benchmark harness. Finally run
fixed-point generation: an optimization that speeds a small program but destabilizes or
miscompiles the self-hosted compiler is not acceptable.
