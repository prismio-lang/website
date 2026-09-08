---
title: Functions and calls
description: Declaration staging, symbol selection, parameter attributes, direct and indirect calls, task thunks, vtables, and temporary ownership.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, functions, calls]
related: [llvm/types-and-abi, compiler/traits-impls-and-dispatch, runtime/tasks-and-channels]
---

Function emission begins with a semantic symbol, not necessarily the source name. Overloads,
generic specializations, methods, trait implementations, closures, task adapters, and generated
release functions all need distinct linkage names. `functionSymbolName` returns the resolved
symbol stored on the AST when present and falls back to the written name only for unspecialized
declarations.

## Definitions

`generateFunction` performs this sequence:

1. Determine the emitted symbol, declared return key, and whether the function is source `main`.
2. Call `ir_function_begin(name, returnType)`.
3. Add parameters through `ir_function_param` or `ir_function_param_unique`.
4. Call `ir_function_body_start` to create the `LLVMValueRef` and entry block.
5. Allocate one entry-block slot per source parameter and store the incoming `%p_name` value.
6. Register variable type/debug information and cache string data pointers.
7. Emit the body through `generateBlock`.
8. Emit a default `ret void` or `ret i32 0` for a fall-through `main`.
9. Close debug state and call `ir_function_end`.

On the C side, `ir_function_begin` records a pending return `LLVMTypeRef`.
`ir_function_param` converts and appends each parameter type. `materialize_function` creates
`LLVMFunctionType`, calls `LLVMAddFunction`, applies collected attributes, and names the
parameters. `ir_function_body_start` appends the entry block with
`LLVMAppendBasicBlockInContext` and positions the builder at the entry block.

`ir_function_param_unique` records that a pointer parameter is uniquely reachable for this
call. `apply_param_attrs` uses `LLVMCreateEnumAttribute` and `LLVMAddAttributeAtIndex` to
attach the supported aliasing/capture facts. Those attributes are proof obligations: applying
`noalias` to a borrowed or shared value can miscompile otherwise valid code.

## Declarations and foreign symbols

External declarations use a parallel staging API:

- `ir_declare_function_begin` starts the return/signature record;
- `ir_declare_function_param` appends ABI-level parameter keys;
- `ir_declare_function_fresh` marks a constructor-like pointer result as fresh; and
- `ir_declare_function_end` materializes the declaration.

`declareExternFunction` chooses `ffiType` for each parameter and return. String arguments
therefore become C pointers, while ordinary Prismio functions receive the fat pair. A
`produce(free_fn)` contract may justify a fresh return; an aliasing return must not be marked
fresh merely because its type is a pointer.

`generateExternStub` emits a diagnostic stub for runtime functions unavailable on the selected
platform. `irRuntimeProvides` is the allowlist that distinguishes compiler-known runtime symbols
from arbitrary external declarations.

## Direct call builder

Calls are accumulated because LLVM requires the complete argument array and exact function type:

| Bridge call | Backend action |
| --- | --- |
| `ir_call_begin()` | Push an empty `CallFrame` |
| `ir_call_arg(type, value)` | Resolve and coerce an owned/value argument |
| `ir_call_arg_borrow(type, value)` | Record a non-capturing borrowed argument and its call-site attributes |
| `ir_call_arg_cstr(value, isBorrow)` | Extract a NUL-terminated pointer from a fat string and record whether a temporary must be released |
| `ir_call_end(retType, symbol)` | Find or synthesize the declaration, emit `LLVMBuildCall2`, apply attributes, release call temporaries, and return a value handle |

`ir_call_end` first tries `LLVMGetNamedFunction`. If an undeclared runtime helper is permitted,
it synthesizes a signature from the resolved argument `LLVMTypeOf` values and the requested
return key. The final call uses `LLVMBuildCall2`; void calls return no usable result handle.
`apply_borrow_attrs` adds call-site rather than declaration-wide facts when ownership differs by
call.

`str_cstr_for_call` extracts the data member of `{ ptr, len }`. A string expression that
materializes owned temporary storage is remembered in the call frame. `release_call_temps`
runs after the call so a borrowed C pointer stays live for the entire foreign invocation but not
for the surrounding scope.

## Owned temporary arguments

`irArgumentIsOwnedTemporary` and `irOwnedTemporaryKind` classify arguments such as freshly
concatenated strings or constructed aggregates. `generateOwnedTemporaryRelease` emits the
matching `str_release`, list/data-view release, generated typed release, RC release, or cycle
release after the callee has consumed or borrowed the value according to its contract.

This is separate from lexical scope drops. A temporary has no user binding to appear in the scope
table, but it still has exactly one lifetime end. Moving this logic into a generic “release every
call result” rule would free aliases and borrowed views.

## Indirect calls and trait objects

`ir_func_addr` converts an `LLVMValueRef` function into an opaque pointer. Vtables are emitted
with `ir_vtable_declare`, `ir_vtable_begin`, repeated `ir_vtable_entry`, and
`ir_vtable_end`; the backend builds a constant pointer array through `LLVMConstArray2` and
`LLVMAddGlobal`. `ir_vtable_addr` obtains the table address, and `ir_ptr_slot` addresses a
method entry.

`generateDynMake` packages the data pointer and vtable pointer. `generateDynCall` selects the
slot, loads the function pointer, pushes the receiver and explicit arguments into a call frame,
and finishes with `ir_call_end_indirect`. That backend function constructs the exact
`LLVMFunctionType` from the runtime argument values and emits `LLVMBuildCall2` against the
loaded callee.

## Task thunks and inlining

`functionNeedsTaskThunk` detects signatures whose string ABI differs from the runtime's generic
task entry. `generateTaskThunk` adapts the runtime payload to the real function, including
packing or unpacking string values. `taskThunkName` appends a stable `__task` suffix.

`markSingleLoopCallsiteFunctions` counts direct call sites and loop-local calls. A non-recursive
function with one total call site and one call in a loop can be marked by
`ir_function_always_inline`. `LLVMAddAttributeAtIndex` applies the attribute only outside
debug builds. This is a measured, bounded policy—not a blanket instruction to inline every small
function.

Tests for call changes must cover overload/specialization symbol choice, direct and indirect
calls, void and aggregate returns, borrowed and owned strings, extern contracts, task thunks,
recursive exclusion from inlining, LLVM verification, and native linkage.
