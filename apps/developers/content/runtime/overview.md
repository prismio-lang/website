---
title: Runtime architecture
description: The native support Prismio programs link, the boundary with compiler builtins and standard modules, and the runtime's ownership obligations.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [runtime, architecture, native]
related: [runtime/supported-surface, runtime/allocation-arenas-rc-and-cycles, llvm/runtime-ir-and-optimization]
---

The Prismio runtime supplies operations that cannot be expressed as ordinary portable Prismio or
that must coordinate directly with generated representations and the operating system.

`runtime/lang_runtime.c` contains language data operations and memory machinery.
`program_support.c` provides tasks, channels, files, processes, and other program services.
`aif_support.c` supports the compiler's allocation and layout engine.
`build_driver.c` owns native build orchestration and embedded toolchain sources.

## Three surfaces

Compiler builtins are operations whose semantics and lowering belong to the compiler, such as
reading the carried length of a tagged string. Standard modules provide supported application APIs
implemented in Prismio where possible. Foreign `extern fn` declarations connect to C-compatible
symbols and must state ownership behavior.

These surfaces are not interchangeable. Moving a helper into C makes it opaque to ordinary
analysis; pretending a representation operation is an extern creates a symbol and ABI that should
not exist.

## Runtime compatibility

The runtime and compiler are shipped as a matched toolchain. Internal layouts and symbols are not a
stable cross-version ABI. Packaged applications merge the runtime bitcode modules discovered
relative to the compiler executable, plus native inputs declared by their UMS target.

Runtime changes require compiler tests, native link tests, verifier coverage where relevant, and
platform validation. A successful C compilation alone does not prove ownership or ABI agreement.

## Runtime file boundaries

| File | Major entry points | Ownership |
| --- | --- | --- |
| `lang_runtime.c` | `rt_base_alloc`, strings, arenas, RC, cycles, lists, DataView, slices, profiling | Language data representations and memory mechanisms |
| `program_support.c` | files, paths, process execution, CLI args, tasks, channels | Operating-system services and executable support |
| `build_driver.c` | compiler output paths, runtime discovery, object cache, linking, promotion | Native build and installed-toolchain mechanics |
| `aif_support.c` | AIF graph, solver, layout, placement, reports | Native analysis engine used by the self-hosted compiler |
| `llvm-api-backend.c` | `ir_*` implementation | LLVM object ownership and IR construction |
| `ir_symbols.c` | names, declarations, scoped bindings, drop lists | Native tables needed during self-hosted lowering |

The public declarations are collected in `prismio_runtime.h`, `prismio_platform.h`, and
`prismio_llvm.h`. `prismio_runtime.h` also carries `PRISMIO_HOST_ABI`, the version of the pairing
between what a compiler generation emits and what the runtime it links defines.

## Allocation entry points

`rt_base_alloc`, `rt_base_realloc`, and `rt_free` are the ordinary base allocator seam.
`rt_alloc` routes through the current arena hint when one is active. Compiler-selected mechanisms
call `arena_alloc`, `rc_alloc`, or `cyc_alloc` directly through LLVM bridge helpers.

`prismio_memory_threads_enable` turns on thread-safe memory state before spawned work can overlap.
`prismio_memory_thread_enter` marks a worker and `prismio_memory_thread_cleanup` releases its
thread-local arenas/pools. Generated code must not call the single-threaded RC path after a value
has become cross-thread.

## Runtime visibility to source

Some symbols are implementation details called only by generated IR: `rc_retain`,
`list_push_slot`, `prismio_slice_check`, or `data_view_add_column`. Others back compiler
builtins. The `std.*` modules provide the supported source-facing layer for ordinary programs.
The compiler's `irRuntimeProvides` table controls which undeclared runtime helpers may be
synthesized as LLVM declarations.

Adding a C function requires an explicit caller:

- a standard module declares it with a reviewed FFI contract;
- a compiler builtin emits it through `src/ir`; or
- a build/tooling module declares it for compiler-process use.

Also update the public header, embedded/runtime build inputs, platform implementation or rejection,
ownership summary, link tests, installed-runtime hash, and packaged-toolchain test. An unused C
symbol is not an API.
