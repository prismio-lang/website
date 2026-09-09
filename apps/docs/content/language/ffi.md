---
title: Foreign function declarations
description: Prismio 0.1 extern fn syntax, C ABI types, and ownership contracts.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [ffi, extern, c-abi, ownership-contracts]
related: [guides/ffi, cookbook/c-ffi, specification/behavior]
---

`extern fn` declares a symbol supplied by the Prismio runtime or a linked C-compatible library. It has a typed signature and no Prismio body.

```prismio
extern fn strlen(text: String borrow) -> Usize
```

Calls use the ordinary function-call syntax after the declaration:

```prismio
let length: Usize = strlen(message)
```

The compiler emits a foreign symbol reference. The build/link step must provide a compatible definition; a declaration alone does not install a library or verify the symbol exists.

## ABI responsibility

Every declared parameter and return type must match the actual foreign function's calling convention, width, pointer representation, and ownership behavior. Prismio can type-check its side of the call, but it cannot inspect the linked implementation.

Use exact-width integer types for C interfaces where the header uses fixed widths. `Isize` and `Usize` follow the selected target's pointer width. `Char` is byte-sized. `String` is Prismio runtime-managed data, not automatically interchangeable with every C string convention.

Raw `Ptr` is available for opaque foreign addresses. Because Prismio 0.1 has no typed pointer dereference or general unsafe block, place pointer operations behind small extern declarations.

## Parameter ownership contracts

Foreign parameter contracts follow the parameter type:

- `borrow` — foreign code does not retain or consume the value.
- `bytes` — `borrow`, and the callee reads no terminator. `String` parameters only.
- `retain` — foreign code keeps a reference.
- `retain_in(k)` — ownership is retained through parameter position `k`.
- `consume` — foreign code takes ownership.
- `out` — the argument is an output location.

A borrow contract is appropriate for a function such as a read-only length calculation. `consume` is appropriate only when the foreign function becomes responsible for releasing the passed resource. `retain` and `retain_in(k)` describe longer-lived aliases that must be represented correctly in AIF and ownership analysis.

The exact postfix placement is part of the extern signature:

```prismio
extern fn inspect(data: String borrow) -> Int
extern fn accept(data: String consume) -> Int
extern fn remember(data: String retain) -> Int
```

Do not add a foreign contract by guesswork. Read the C header and implementation documentation, then test creation, success, error, and cleanup paths.

### `bytes`, for a C function that takes a pointer and a length

`bytes` is the one contract that describes **marshalling rather than ownership**. Its ownership meaning is `borrow` exactly; what it changes is the value the callee receives.

A `String` produced by slicing is a *view*: a pointer and a length into a buffer that continues past it, with no terminator of its own. Under every other contract the boundary therefore hands foreign code a NUL-terminated **copy** of a view, and releases that copy when the call returns. That copy is what makes `strlen`-style C functions safe to call with a slice.

`bytes` says the callee was given the count separately and never looks for a terminator, so the String's own pointer crosses and no copy is made:

```prismio
extern fn write(fd: Int, buffer: String bytes, count: I64) -> I64
extern fn hash_bytes(data: String bytes, len: I64) -> U64
```

Declare it only when the C signature takes an explicit length. If foreign code reads to a NUL and you declare `bytes`, it will read past the end of a view — the copy that prevented that is exactly what you turned off.

It applies to `String` parameters and nothing else; there is no copy to suppress for any other type, and the compiler rejects it elsewhere.

The saving is not incidental. A loop that advances through a buffer — retrying a short `write`, hashing in chunks — takes a view of what remains on every pass, and under `borrow` each pass copies the whole remainder. `std/io.psm` declares `write` this way for exactly that reason.

## Return ownership contracts

Return contracts are `alias` for a borrowed/aliased result and `produce(free_fn)` for newly owned memory with a named release function.

An `alias` result refers to storage owned elsewhere. The application must not treat it as independently owned or outlive the documented source owner. `produce(free_fn)` says the call creates owned storage and names the function required to release it.

These contracts connect foreign behavior to compiler allocation/ownership analysis. They do not cause Prismio to verify that `free_fn` is correct, thread-safe, or compatible with the allocator that created the storage.

## A minimal integration workflow

1. Identify the exported C-compatible symbol and its header signature.
2. Map widths and pointer-shaped values explicitly into Prismio types.
3. State parameter and return ownership contracts.
4. Compile the Prismio source while passing the required object/library options to the compiler driver.
5. Test success, failure, zero-length, and cleanup behavior on every supported target.
6. Keep the extern declarations in one small source boundary so an ABI change is easy to audit.

See the [FFI guide](/guides/ffi) for driver-oriented steps and the [C FFI cookbook](/cookbook/c-ffi) for a focused example.

Contract spelling is optional on legacy/runtime declarations, but ownership-sensitive external APIs should state it. The declaration must match the actual symbol and ABI. Prismio cannot inspect foreign code to validate that promise.

## Safety boundary

An incorrect foreign declaration can cause memory corruption, leaks, double destruction, stale aliases, or platform-specific failures even when the Prismio program passes semantic analysis. FFI correctness is therefore a joint contract between source, compiler target, linker, and foreign implementation.

Keep foreign calls narrow, validate values before crossing the boundary, translate foreign error codes into explicit Prismio states, and avoid exposing raw pointers throughout application code.

Foreign callbacks, C variadics, platform structure packing, and concurrency require additional ABI rules that are not defined as a stable language feature in 0.1.

C++ name mangling, automatic header generation, Rust/Python bindings, dynamic library manifests, and a stable cross-version Prismio ABI are not implemented.
