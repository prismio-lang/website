---
title: Wrap a C function
description: Create a narrow Prismio 0.1 module around a C ABI function and state its ownership contract.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cookbook, c, ffi, ownership]
related: [aif/ffi-contracts, runtime/supported-surface, tooling/build-graph-and-linking]
---

Put raw declarations in one source file, match C-compatible types, and state pointer ownership.

Suppose a C-compatible library exports a byte-length function that reads but does not retain the passed runtime-compatible string. Declare that contract at the boundary:

<!-- prismio-check: pass -->
```prismio
extern fn c_strlen(text: String borrow) -> Usize

fn string_byte_length(text: String) -> Usize {
    return c_strlen(text)
}
```

## Why the wrapper exists

The wrapper's ordinary `String` parameter borrows from its Prismio caller. The external `borrow` contract promises that C does not store or free that string. The return is a copyable unsigned size.

The wrapper gives application code a Prismio-named operation and keeps the raw foreign symbol in one place. It is also the place to validate ranges, translate return codes, or adapt a representation.

## Verify the real ABI

Before using the declaration, confirm:

- the symbol uses C-compatible linkage and exact spelling;
- the parameter representation truly accepts the Prismio runtime string passed here;
- the function does not retain, mutate, or release the argument;
- the return width matches `Usize` on the selected target; and
- the linked library uses the same target ABI.

If any representation detail differs, write a C adapter with a narrow stable signature instead of guessing in Prismio source.

## Link and test

The symbol still has to be present at link time. Declare native libraries, search paths, files, or
platform frameworks in the target's `link` block in `build.ums`. A mismatched signature or
false ownership contract remains outside compiler safety guarantees.

Emit `.ll` first if you need to separate front-end acceptance from native link configuration. Then test empty strings, ordinary content, large lengths, repeated calls, and every supported target.

## Owned foreign results

When a C function returns newly allocated storage, use the supported `produce(free_fn)` return contract and name the matching deallocator. Use `alias` only when the result borrows storage owned elsewhere. Never pair a produced pointer with an unrelated allocator's free function.

The exact declaration must follow the compiler's FFI contract grammar. Keep produced/aliased pointer handling inside the wrapper because raw `Ptr` values do not carry an automatically verified pointee lifetime.

`parseFfiContract()` stores the encoded contract on the extern AST. `semaCheckExternContracts()`
checks parameter and return positions, including `retain_in(k)` indices and the required deallocator
for `produce`. During AIF, declared contracts take precedence over builtin fallback tables and add
the corresponding borrow, retain, container, consume, escape, or production facts. Codegen then
emits an ordinary external LLVM declaration and call; it does not make the C implementation safe.

Use `out` only for a parameter whose pointee is initialized by C and whose exact ABI is modeled.
Use `retain` when C keeps a reference independently, and `retain_in(k)` when the value is stored in
another argument named by zero-based index. `consume` transfers the value to C. These distinctions
change release placement and cannot be approximated by `borrow` for convenience.

## What this recipe does not promise

It does not provide automatic header parsing, C++ name mangling, variadic calls, stable struct layout, dynamic-library manifests, or a cross-version Prismio ABI. Those capabilities are not hidden behind `extern fn`.
