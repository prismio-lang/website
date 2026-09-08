---
title: Debug information
description: How Prismio emits DWARF compile units, files, functions, lexical scopes, variables, globals, structs, enums, strings, and source locations.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, debug, dwarf]
related: [llvm/types-and-abi, llvm/functions-and-calls, tooling/debugging-targets-and-build-tracing]
---

Debug information has two layers. `src/ir/debug.psm` translates Prismio AST/type information into
a small `ir_debug_*` protocol. `runtime/llvm-api-backend.c` owns `LLVMDIBuilderRef`, metadata
nodes, file/type caches, and instruction locations.

The feature is conditional. `irSetDebugInfo` stores the command-line choice. `debugBeginModule`
calls `ir_debug_begin` only when enabled, and `debugEndModule` finalizes it. Optimized builds may
still carry debug information; the compile unit records whether optimization was enabled.

## Module and compile unit

`ir_debug_begin(producer, mainPath, isOptimized)` performs the root setup:

- `LLVMCreateDIBuilder` creates the builder;
- `LLVMDIBuilderCreateFile` creates the primary file;
- `LLVMDIBuilderCreateCompileUnit` creates a full DWARF unit using the C99 source-language code
  currently selected for debugger compatibility; and
- `LLVMAddModuleFlag` installs the required debug-info and DWARF version flags.

Source files are interned by numeric file ID. `di_file` returns an existing
`LLVMMetadataRef` or creates one from the compiler's source table. The cache ensures locations,
scopes, and types point at consistent file nodes.

`ir_debug_end` calls `LLVMDIBuilderFinalize` before the module is verified or printed, then
disposes the builder. Finalizing twice or disposing before all replaceable composite types are
resolved produces invalid metadata.

## Function lifecycle

| Prismio helper | Bridge operation | Result |
| --- | --- | --- |
| `debugOpenFunction` | `ir_debug_function_begin` | Opens a subprogram for the active LLVM function and records linkage/source name |
| `debugSignature` | `ir_debug_signature` | Records the resolved return type |
| `debugSignatureParam` | `ir_debug_signature_param` | Appends one parameter type in declaration order |
| `debugAt` | `ir_debug_location` | Sets the current file, line, and column used by following instructions |
| `debugPushScope` | `ir_debug_scope_push` | Creates a lexical block at a source block |
| `debugPopScope` | `ir_debug_scope_pop` | Restores the enclosing lexical scope |
| `debugCloseFunction` | `ir_debug_function_end` | Clears the active subprogram and location |

The native side builds a subroutine type with `LLVMDIBuilderCreateSubroutineType` and a
subprogram with `LLVMDIBuilderCreateFunction`. The function metadata is attached to the
`LLVMValueRef`. `LLVMDIBuilderCreateDebugLocation` supplies instruction locations.

The first active location is installed after `ir_function_body_start`; before that point no LLVM
function or insertion block exists. The final location is cleared only after the implicit return
is emitted so that a fall-through return still belongs to the source function.

## Local and global variables

`debugLocal` receives the source name, alloca slot, semantic type key, display name, declaration
node, and one-based parameter index. `ir_debug_local` chooses
`LLVMDIBuilderCreateParameterVariable` for parameters and
`LLVMDIBuilderCreateAutoVariable` for locals. It creates an empty expression with
`LLVMDIBuilderCreateExpression` and inserts a declaration record at the current block through
`LLVMDIBuilderInsertDeclareRecordAtEnd`.

`debugGlobal` calls `ir_debug_global`, which uses
`LLVMDIBuilderCreateGlobalVariableExpression` and attaches it to the LLVM global. Globals must
have their metadata emitted after their initializer/type is known.

Optimizers may promote allocas, split ranges, or remove dead variables. The declaration metadata
describes the source variable; it does not prevent legal optimization. A debug regression test
should therefore inspect both metadata shape and debugger-visible values at the intended
optimization level.

## Type metadata

`debugTypeName` chooses a human-readable source name from the resolved annotation or initializer.
`di_type_for` maps the backend key:

- scalar integers and `double` use `LLVMDIBuilderCreateBasicType` with the matching bit width
  and DWARF encoding;
- opaque pointers use `LLVMDIBuilderCreatePointerType`;
- the fat string and slice built-ins receive explicit struct members;
- nominal structs use a replaceable composite node while recursive members are resolved; and
- enums use `LLVMDIBuilderCreateEnumerator` and
  `LLVMDIBuilderCreateEnumerationType` for fieldless forms or struct metadata for payload forms.

`debugFieldType` records source field type names before the final struct node is requested.
`debugStruct` and `debugEnum` force materialization at the declaration's source location.
`LLVMDIBuilderCreateMemberType` uses target-derived size, alignment, and offset; debug layout
must match the actual LLVM struct, including any AIF field order.

The cache functions `di_cached` and `di_cache` prevent duplicate nodes and break recursive type
construction. `LLVMTemporaryMDNode` or a replaceable composite stands in while members are built,
then LLVM metadata replacement resolves references to the final type.

## Disabled builds and platform guards

The C file includes no-op `ir_debug_*` implementations when the LLVM build lacks the required
debug API. `ir_debug_enabled` returns zero in that configuration, allowing self-hosted code to
skip debug-only behavior such as preserving frames that would otherwise be always-inlined.

When extending debug support, test file paths, line/column changes, shadowed locals, nested scopes,
parameters, globals, recursive structs, payload enums, strings, slices, optimized and unoptimized
builds, and at least one real debugger session. A module passing `LLVMVerifyModule` does not by
itself guarantee useful debugger presentation.
