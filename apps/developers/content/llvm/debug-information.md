---
title: Debug information
description: How Prismio emits DWARF compile units, files, functions, lexical scopes, variables, globals, structs, enums, strings, and source locations, and how to inspect what it emitted.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [llvm, debug, dwarf]
related: [llvm/types-and-abi, llvm/functions-and-calls, tooling/debugging-targets-and-build-tracing]
---

## What this is for

Without it, a debugger can single-step machine instructions but has no way to say which line of
your `.psm` file produced them, what a struct field is named, or what to print for a local variable
you ask about. **DWARF** (Debugging With Attributed Record Formats) is the standard
debug-information format lldb and gdb both read, and
Prismio emits it directly through LLVM's own metadata builder rather than inventing a format of its
own. `src/ir/debug.psm` translates Prismio AST and type information into a small `ir_debug_*`
protocol; `runtime/llvm-api-backend.c` owns the actual `LLVMDIBuilderRef`, metadata nodes, file and
type caches, and instruction locations.

The feature is conditional. `irSetDebugInfo` stores the command-line choice. `debugBeginModule`
calls `ir_debug_begin` only when enabled, and `debugEndModule` finalizes it. Optimized builds may
still carry debug information; the compile unit records whether optimization was enabled.

## See it work

`-g` builds with DWARF, and — because a variable folded into a register is a variable a debugger
cannot show you — it also forces the object step down to `-O0` (`prismio --help` says this plainly;
`--debug` is a different flag entirely, the compiler's own analysis verbosity, and says nothing
about debug info):

<!-- prismio-check: pass -->
```prismio
struct Reading {
    id: Int,
    scale: Float
}

fn scaled(r: Reading) -> Float {
    return r.scale * 2.0
}

fn main() -> Int {
    let sample = Reading { id: 1, scale: 3.5 }
    let total = scaled(sample)
    if (total > 0.0) {
        return 0
    }
    return 1
}
```

```bash
prismio build reading.psm -g -o reading
```

```text
Built reading
```

On macOS this leaves debug information in a `reading.dSYM` bundle beside the executable, which
`dwarfdump` reads directly:

```bash
dwarfdump --debug-info reading.dSYM
```

```text
0x0000000b: DW_TAG_compile_unit
              DW_AT_producer	("prismio 0.1.0")
              DW_AT_language	(DW_LANG_C99)
              DW_AT_name	("reading.psm")
              ...

0x0000002a:   DW_TAG_subprogram
                DW_AT_linkage_name	("scaled__Struct_Reading")
                DW_AT_name	("scaled")
                DW_AT_decl_line	(6)
                DW_AT_type	(0x0000009e "Float")
...
0x000000b5:   DW_TAG_structure_type
                DW_AT_name	("Reading")
                DW_AT_byte_size	(0x10)
                DW_AT_alignment	(8)

0x000000be:     DW_TAG_member
                  DW_AT_name	("id")
                  DW_AT_type	(0x000000a5 "Int")
                  DW_AT_data_member_location	(0x00)

0x000000c9:     DW_TAG_member
                  DW_AT_name	("scale")
                  DW_AT_type	(0x0000009e "Float")
                  DW_AT_data_member_location	(0x08)
```

(excerpt — full output also lists `main`'s lexical block and locals). Two things worth noting
against the source: the subprogram's `DW_AT_linkage_name` is the overload-mangled symbol
(`scaled__Struct_Reading`, the same mangling [functions and calls](/llvm/functions-and-calls)
describes), while `DW_AT_name` keeps the plain source name — a debugger sets breakpoints by the
name you wrote and only uses the mangled one to find the machine code. And the `Reading` struct's
member offsets (`0x00`, `0x08`) are read from the real LLVM layout, not recomputed by the debug
layer — `LLVMDIBuilderCreateMemberType` takes target-derived size, alignment, and offset, so a
debugger's view of a field can never drift from where codegen actually put it.

An actual debugger session, driven non-interactively, confirms the same file/line/variable data is
usable, not just present in the object file:

```bash
lldb --batch -o 'b reading.psm:13' -o run -o 'frame variable' ./reading
```

```text
Breakpoint 1: where = reading`main + 60 at reading.psm:13:8, address = 0x0000000100000734
Process 10611 launched: '.../reading' (arm64)
Process 10611 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x0000000100000734 reading`main at reading.psm:13:8
   10  	fn main() -> Int {
   11  	    let sample = Reading { id: 1, scale: 3.5 }
   12  	    let total = scaled(sample)
-> 13  	    if (total > 0.0) {
(lldb) frame variable
(Reading *) sample = 0x000000016fdfe430
(double) total = 7
```

lldb resolved a source-file-and-line breakpoint, stopped there, and printed both a struct-typed
local and a `Float` local by name — `total` reports as lldb's `double`, which is exactly what
Prismio's `Float` is under the hood.

## What failure looks like

There is no `-g`-specific rejection — a program that builds without it builds with it, since debug
information is metadata added alongside the same **IR** (intermediate representation — the LLVM
form [the backend overview](/llvm/overview) covers), not a different lowering. The failure mode
worth knowing about instead is silent: asking for a variable, global, or breakpoint that debug info
was never emitted for. `tests/debug_info.psm`, the compiler repository's dedicated debug-info
fixture, notes one real instance from its own history — a call statement's AST node used to be
built *after* its expression was parsed, so it was stamped with the line of whatever token followed
it (the next statement, or a closing `}`) instead of its own line. A breakpoint set on the call
itself would have landed one statement late, and nothing about the build would have said so; the
fixture now pins a marked line specifically to catch that class of regression.

If a lookup does fail — asking lldb for a name debug info never described — it says so directly
rather than misleading you:

```text
(lldb) target variable tally
error: can't find global variable 'tally'
```

(from a build of a program that, unlike the fixture, never declared a global named `tally` — the
same message appears for any name debug info has no record of.)

## If you are changing debug-info support

### Module and compile unit

`ir_debug_begin(producer, mainPath, isOptimized)` performs the root setup:

- `LLVMCreateDIBuilder` creates the builder;
- `LLVMDIBuilderCreateFile` creates the primary file;
- `LLVMDIBuilderCreateCompileUnit` creates a full DWARF unit using the C99 source-language code
  currently selected for debugger compatibility (visible above as `DW_LANG_C99`); and
- `LLVMAddModuleFlag` installs the required debug-info and DWARF version flags.

Source files are interned by numeric file ID. `di_file` returns an existing
`LLVMMetadataRef` or creates one from the compiler's source table. The cache ensures locations,
scopes, and types point at consistent file nodes.

`ir_debug_end` calls `LLVMDIBuilderFinalize` before the module is verified or printed, then
disposes the builder. Finalizing twice or disposing before all replaceable composite types are
resolved produces invalid metadata.

### Function lifecycle

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

### Local and global variables

`debugLocal` receives the source name, alloca slot, semantic type key, display name, declaration
node, and one-based parameter index. `ir_debug_local` chooses
`LLVMDIBuilderCreateParameterVariable` for parameters and
`LLVMDIBuilderCreateAutoVariable` for locals. It creates an empty expression with
`LLVMDIBuilderCreateExpression` and inserts a declaration record at the current block through
`LLVMDIBuilderInsertDeclareRecordAtEnd`.

`debugGlobal` calls `ir_debug_global`, which uses
`LLVMDIBuilderCreateGlobalVariableExpression` and attaches it to the LLVM global. Globals must
have their metadata emitted after their initializer/type is known. A global has no `alloca` and no
scope stack, so it reaches the debugger through this entirely separate path from every local
variable above — miss it, and a debugger can still stop inside any function and print everything
local there, with no visible sign that globals are missing until someone asks for one specifically.

Optimizers may promote allocas, split ranges, or remove dead variables. The declaration metadata
describes the source variable; it does not prevent legal optimization. A debug regression test
should therefore inspect both metadata shape and debugger-visible values at the intended
optimization level.

### Type metadata

`debugTypeName` chooses a human-readable source name from the resolved annotation or initializer.
`di_type_for` maps the backend key:

- scalar integers and `double` (backing Prismio's `Float`, as seen above) use
  `LLVMDIBuilderCreateBasicType` with the matching bit width and DWARF encoding;
- opaque pointers use `LLVMDIBuilderCreatePointerType`;
- the fat string and slice built-ins receive explicit struct members;
- nominal structs use a replaceable composite node while recursive members are resolved; and
- enums use `LLVMDIBuilderCreateEnumerator` and
  `LLVMDIBuilderCreateEnumerationType` for fieldless forms or struct metadata for payload forms —
  load-bearing because every Prismio enum lowers to `i32` in the actual data representation, so the
  source-level variant name only survives through this metadata.

`debugFieldType` records source field type names before the final struct node is requested.
`debugStruct` and `debugEnum` force materialization at the declaration's source location.
`LLVMDIBuilderCreateMemberType` uses target-derived size, alignment, and offset; debug layout
must match the actual LLVM struct, including any AIF (Adaptive Inference Framework) field order.

The cache functions `di_cached` and `di_cache` prevent duplicate nodes and break recursive type
construction. `LLVMTemporaryMDNode` or a replaceable composite stands in while members are built,
then LLVM metadata replacement resolves references to the final type.

### Disabled builds and platform guards

The C file includes no-op `ir_debug_*` implementations when the LLVM build lacks the required
debug API. `ir_debug_enabled` returns zero in that configuration, allowing self-hosted code to
skip debug-only behavior such as preserving frames that would otherwise be always-inlined.

When extending debug support, test file paths, line/column changes, shadowed locals, nested scopes,
parameters, globals, recursive structs, payload enums, strings, slices, optimized and unoptimized
builds, and at least one real debugger session — `tests/debug_info.psm` in the compiler repository
is the fixture that already does most of this, compiled twice (with and without `-g`) and read both
ways. A module passing LLVM's verifier does not by itself guarantee useful debugger presentation.
