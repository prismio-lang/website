---
title: Call C with ownership contracts
description: Declare C ABI functions and document pointer ownership at the Prismio 0.1 FFI boundary.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [guide, ffi, c-abi, ownership]
related: [language/ffi, cookbook/c-ffi, specification/memory-model]
---

`extern fn` declarations bind directly to C ABI symbols. Prismio does not generate bindings, read headers, marshal arbitrary layouts, or install libraries for you.

Treat every foreign declaration as a manually verified contract among the Prismio type checker, target ABI, linker, and external implementation.

## Start from the C declaration

Record the exact C header, target, and ownership notes. Map fixed-width integers to `I8`/`U8` through `I64`/`U64`, pointer-sized counts to `Isize`/`Usize`, and opaque addresses to `Ptr` or `Ptr?` as appropriate.

`Char` is byte-sized. `String` is a Prismio runtime-owned string, not a promise that every C `char *` can be passed without a wrapper. When representation is uncertain, expose a narrow C adapter with an ABI you control.

## Declare the symbol

```prismio
extern fn puts(text: String borrow) -> Int
extern fn release_buffer(buffer: Ptr consume) -> Int
```

The first declaration promises that `puts` does not retain or consume the passed string. The second says `release_buffer` takes responsibility for the pointer-shaped resource.

Return ownership can be described with `alias` or `produce(free_fn)` when the parser/type form supports the foreign signature. An aliased result must not outlive its source owner; a produced result names the compatible release function.

## Centralize raw declarations

Keep extern declarations in one small source boundary and expose ordinary Prismio wrapper functions. The wrapper can:

- validate ranges before narrowing;
- translate integer error codes into fieldless enums or explicit status structs;
- keep raw pointers out of application code;
- ensure a produced resource follows one cleanup path; and
- document platform differences next to the ABI.

Mark the raw `extern fn` declarations `private` so only the wrapper file may call them, and expose the typed Prismio functions without a modifier. That makes the boundary enforced rather than conventional: a caller elsewhere in the program cannot reach past the wrapper to the raw declaration.

Use `internal` instead where the wrapper spans several files of one package. Visibility applies to `fn` and `extern fn`; a struct used in the ABI cannot be hidden this way.

FFI ownership contracts are part of semantic analysis. Parameter contracts are `borrow`, `retain`, `retain_in(k)`, `consume`, and `out`; return contracts are `alias` and `produce(free_fn)`.

Only use a contract that matches the C implementation. The compiler can enforce transfers at the Prismio boundary, but it cannot prove that foreign code obeys its declaration. Prefer a small wrapper module that centralizes raw declarations and exposes typed Prismio functions.

## Link the implementation

The declaration emits a reference; the native link must still receive a library or object that defines the symbol. Use the compiler driver's supported linker inputs for your target. There is no Prismio package manifest that declares a native dependency.

Separate front-end and linker failures by emitting LLVM IR:

```bash
prismio build app.psm -o app.ll
```

If IR generation succeeds but the native build reports an unresolved symbol, the source declaration was accepted and the remaining problem is link configuration or symbol spelling.

## Verify ownership paths

For ownership-sensitive functions, test:

1. normal success;
2. foreign error return;
3. empty and null-shaped inputs where allowed;
4. early return after acquisition;
5. repeated calls; and
6. verified allocation/free instrumentation.

Compile a test build with `--verify` where applicable. Verification can observe supported runtime contracts, but cannot prove that arbitrary C code never retains a borrowed pointer or writes out of bounds.

## Portability rules

- Use exact-width values when the C ABI does.
- Do not serialize `Isize`/`Usize` as fixed-width data.
- Do not assume struct layout is stable across Prismio versions.
- Avoid C++ symbols unless exposed through an `extern "C"` adapter.
- Do not assume a foreign allocator can be paired with a different deallocator.
- Re-test declarations for every target architecture and operating system.

The linker must still be able to resolve every external symbol. Prismio 0.1 does not have a manifest-level library-dependency declaration.

Automatic header generation, callbacks, source-level C variadics, dynamic library manifests, Rust/Python binding generation, and a stable Prismio ABI are Coming Soon or unspecified—not hidden capabilities.
