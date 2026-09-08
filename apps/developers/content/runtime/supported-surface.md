---
title: Builtins, standard modules, and foreign code
description: How contributors decide whether an operation belongs in compiler lowering, an importable Prismio module, or the C-compatible runtime surface.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [runtime, stdlib, ffi]
related: [runtime/overview, aif/ffi-contracts, cookbook/add-a-runtime-or-stdlib-api]
---

Choose the narrowest layer that can express an operation truthfully.

## Compiler builtins

Use a builtin when the operation exposes a representation invariant or must lower directly to IR.
String length and bounded byte access are examples: they operate on the tagged value and compile to
ordinary LLVM instructions rather than linked symbols.

## Standard modules

Use Prismio for portable algorithms and supported APIs that can be expressed in the language.
String search orchestration, formatting, collection algorithms, and ownership-safe wrappers belong
here. This keeps their control flow visible to sema and AIF.

There is no implicit prelude. Operators and iteration that rewrite to a standard-module function
require the corresponding import. The compiler's module resolver selects the checkout or packaged
standard library according to documented search order.

## Foreign runtime operations

Use C for operating-system capabilities, the LLVM API, architecture intrinsics Prismio cannot
express, or a narrow stable adapter to an external library. Give every pointer-shaped parameter and
result an explicit AIF ownership contract.

Applications should call `std.*` for supported platform behavior. Raw `extern fn` is for
foreign code the application or compiler component intentionally brings.

## Runtime service inventory

`program_support.c` provides the implementation surface used by compiler code and standard
modules:

| Area | Functions |
| --- | --- |
| Files | `file_exists`, `directory_exists`, `make_directory`, `read_file`, `write_file`, `delete_file` |
| Paths | `get_directory`, `join_path`, `current_directory`, `list_modules`, `executable_directory`, `prismio_executable_directory` |
| Processes | `command_quote_arg`, `execute_command`, `host_is_windows` |
| Arguments | `cli_arg_count`, `cli_arg` |
| Tasks | `prismio_task_spawn`, typed join functions, `prismio_task_release` |
| Channels | `chan_new`, `chan_send`, `chan_recv`, `chan_close`, `chan_share`, `chan_len`, `chan_free` |

`lang_runtime.c` supplies printing (`print*`, `println*`, stderr variants), string operations
(`str_equals`, `str_concat`, `str_substring`, `str_slice`, `str_find_byte`,
`str_clone*`, `str_own`, `int_to_str`), optional failure
(`prismio_expect`), overflow traps, collections, memory mechanisms, and profiling.

## Standard-module boundary

The importable module set lives under `lib/std`. A standard module may wrap a runtime function,
implement behavior in Prismio, or combine both. The module owns the public source types and
semantics; the C symbol is an internal ABI unless explicitly documented otherwise.

When documenting availability, verify all three layers:

1. a module or compiler builtin exposes the operation to source;
2. the runtime symbol exists for every claimed platform; and
3. the packaged runtime/archive includes that symbol.

The presence of a C function alone does not make networking, JSON, regex, time, atomics, mutexes,
or async I/O supported. Conversely, tasks and channels are language/compiler builtins backed by
runtime symbols, not modules that must appear in the `std.*` directory.

## Failure and ownership conventions

File/process helpers return status values or owned strings according to their exact declaration.
Any returned allocation needs a `produce` contract and matching free function. Borrowed input
paths must not be retained. Functions that terminate, such as bounds/DataView failure helpers or
`prismio_overflow_trap`, must be declared non-returning in the backend when LLVM relies on that
control-flow fact.

To add supported surface, implement the runtime path on Windows and POSIX, add the standard
module/builtin declaration, specify ownership and errors, expose no repository-only paths, test a
packaged compiler, and update the unsupported catalog when the capability unlocks benchmarks.
