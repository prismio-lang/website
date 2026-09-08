---
title: LLVM backend overview
description: The complete path from Prismio's checked AST and AIF plan to verified LLVM IR, optimized objects, linked programs, and JIT execution.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, backend, codegen]
related: [compiler/pipeline-and-driver, llvm/llvm-c-bridge, llvm/runtime-ir-and-optimization]
---

Prismio's backend is split deliberately. The self-hosted compiler decides what the program means
in `src/ir/*.psm`; `runtime/llvm-api-backend.c` owns LLVM objects and calls the LLVM 22 C API.
The boundary between them is the `ir_*` ABI declared in `src/ir/bridge.psm`.

The split keeps LLVM headers, opaque reference types, error objects, and version churn out of
self-hosted Prismio code. It does **not** move language policy into C. Type selection, ownership
actions, AIF tier use, declaration order, expression lowering, and control-flow shape remain
visible in Prismio.

## End-to-end call path

| Stage | Main function | What it contributes |
| --- | --- | --- |
| Driver | `compileSource` in `src/driver/compile.psm` | Runs imports, semantic analysis, AIF, target selection, code generation, and output handling |
| Module orchestration | `generateModule` | Resets backend state, registers types and declarations, emits globals, helpers, functions, and vtables |
| Function emission | `generateFunction` | Materializes a signature and entry block, stores parameters, opens debug scope, emits the body, and supplies an implicit return |
| Statement emission | `generateBlock` and `generateStatement` | Creates scopes, blocks, branches, loop exits, drops, region exits, and returns |
| Expression emission | `generateExpression` | Produces a backend value handle for literals, names, calls, aggregates, operators, casts, indexing, and closures |
| Type mapping | `mapTypeNode`, `storageType`, `ffiType` | Converts resolved Prismio types into bridge type keys |
| LLVM bridge | `ir_module_start`, `ir_function_begin`, `ir_call_end`, and other `ir_*` functions | Converts string keys and integer handles into LLVM objects |
| Validation/output | `ir_write_file` | Verifies the module, runs the configured optimization pipeline, and emits textual IR, bitcode, or an object |

`generateModule` is the backend entry point. It first discovers whether optional runtime families
such as slices and DataView are actually used. It registers nominal names before bodies so recursive
references can resolve, reserves null tags for nullable enums, declares external functions, builds
struct bodies, generates per-type release and cyclic-child walkers, and only then emits executable
functions. Trait-object vtable declarations and definitions are separate late passes because their
entries require fully resolved implementation symbols.

## State owned on each side

The Prismio side holds AST nodes, resolved semantic types, AIF queries, the active function and
body, source locations, and decisions such as whether a value is owned. It passes compact type keys
like `i32`, `ptr`, or `struct:Packet`, plus textual value handles such as `%17`.

The C backend owns:

- `LLVMContextRef g_ctx`, `LLVMModuleRef g_module`, and `LLVMBuilderRef g_builder`;
- the selected target triple, data layout, pointer width, target machine, and optimization level;
- interned `LLVMValueRef` and `LLVMBasicBlockRef` handles;
- pending function declarations and call frames;
- named struct bodies, hot/cold split metadata, enum null tags, and TBAA nodes;
- debug-info builder state and type caches; and
- ORC JIT state when `run` executes without a native link.

`ir_reset` disposes the previous module, builder, target objects, debug builder, and temporary
tables. A compilation must begin from that clean state: backend handles are process-local indices,
not stable identifiers that may be reused across modules.

## The bridge's value protocol

Self-hosted code cannot carry an `LLVMValueRef` directly. Builder functions therefore return an
`Int` handle. `intern_value` stores the LLVM value and produces that integer; Prismio converts it
to the textual form expected by the next bridge call. `resolve_value` recognizes temporaries,
parameters, constants, globals, and null values, checks the requested type key, and returns the
actual LLVM value.

This is why the frontend must use structured operations such as `ir_add`,
`ir_struct_field_ptr`, and `ir_call_end`. `ir_append` remains only as a compatibility seam;
the real LLVM backend cannot safely recover typed SSA objects from arbitrary handwritten IR text.

## Module lifecycle in LLVM

`ir_module_start` creates the context, module, and builder as needed, then installs the selected
target and data layout. `ir_module_set_target` writes the exact triple/layout selected by
`common.target`.

Function declarations use `LLVMFunctionType` and `LLVMAddFunction`. Definitions are staged:
`ir_function_begin` records the return type, `ir_function_param` records each parameter,
`ir_function_body_start` materializes the function and entry block, and `ir_function_end`
closes the pending state. This staging lets attributes be applied only after the complete signature
exists.

Before output, `LLVMVerifyModule` rejects malformed control flow, type mismatches, invalid calls,
and broken PHI edges. Verification failure is a compiler bug, not a user diagnostic. The C bridge
prints the LLVM verifier message and returns failure to the driver.

## Where to make a change

- Add source syntax or semantic behavior in `src/parse` and `src/sema`, not in the backend.
- Add a new AST lowering in `expr.psm`, `stmt.psm`, or `module.psm`.
- Add a reusable typed LLVM operation to `bridge.psm` and `llvm-api-backend.c` together.
- Add or change a representation in `types.psm`, then audit fields, calls, debug types, releases,
  target sizing, and FFI conversion.
- Change allocation policy in AIF; code generation should consume the selected tier rather than
  infer it again.
- Add an LLVM pass only in `run_optimization`, with IR and performance evidence.

Every backend change should pass a focused source test, textual IR or symbol assertion when shape
matters, `LLVMVerifyModule`, native execution, the fixed-point compiler build, and the relevant
AIF/runtime verification.
