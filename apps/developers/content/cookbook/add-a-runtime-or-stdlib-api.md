---
title: Add a runtime or standard-library API
description: Choose the correct Prismio implementation layer, specify ownership, connect native symbols, and prove behavior across targets.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [cookbook, runtime, stdlib]
related: [runtime/supported-surface, aif/ffi-contracts, llvm/llvm-c-bridge]
---

First decide whether the operation is a compiler builtin, portable Prismio library code, an
operating-system capability, an LLVM bridge operation, or an application-provided foreign API.

Prefer `std/*.psm` for algorithms and supported APIs expressible in Prismio. Reserve compiler
builtins for representation-aware operations that lower directly to existing IR. Use C for
platform services, architecture intrinsics, LLVM objects, or narrow adapters Prismio cannot yet
express.

## Choose the owning layer

| Need | Owner | Typical integration |
| --- | --- | --- |
| Portable algorithm over public values | `std/*.psm` | Importable Prismio function |
| Representation-aware primitive | sema + `src/ir` | Recognized builtin lowered to IR/runtime call |
| Managed allocation or collection operation | `runtime/lang_runtime.c` | `extern fn` plus AIF contract |
| Arguments, files, processes, diagnostics | `runtime/program_support.c` | Platform adapter plus std wrapper |
| LLVM construction | `runtime/llvm-api-backend.c` | Numeric-handle `ir_*` bridge only |
| Object emission and native linking | `runtime/build_driver.c` | Compiler-only driver API |

Do not place an application API directly in the LLVM bridge. Bridge functions manipulate compiler
objects and are linked into the compiler; program runtime functions are linked into generated
applications.

## Native boundary

Declare the exact C-compatible signature. Specify whether pointer-shaped parameters borrow,
consume, escape, or alias and whether a return is static, borrowed, or newly produced with a named
deallocator. Add the contract to the compiler's known table when it is a shipped runtime symbol.

`parseFfiContract()` accepts parameter contracts such as `borrow`, `retain`, `retain_in(k)`,
`consume`, and `out`, and return contracts `alias` or `produce(free_fn)`. `semaCheckExternContracts()`
rejects missing, nonsensical, and unsafe combinations before AIF. The AIF contract registry must
match any shipped builtin that appears without a source declaration; otherwise the compiler and
oracle can classify the same call differently.

For an allocating return, every success and failure path must return storage accepted by the named
deallocator. A function that sometimes returns a literal cannot honestly be declared
`produce(free)`. For an alias, document the owner and the event that invalidates the result.

## Integration

Expose application-facing operations through a standard module. A new `std/*.psm` file needs no
inventory update — both producers enumerate the directory — but it does need a packaged toolchain
before anything outside a checkout can import it, because installed modules are compiled
`stdlib/*.plib` artifacts rather than source. If a new native library is required, declare it
through the UMS target rather than relying on an ambient developer machine.

A **new runtime translation unit** is different: its name is duplicated across four lists, and
`tools/check_source_lists.py` is what keeps them in step. See
[Library artifacts](/runtime/library-artifacts).

Adding a symbol to an existing runtime file needs no packaging change, but it is not shipped until
the bitcode is rebuilt — `prismio build` refreshes the project-local toolchain, and `prismio dist`
refreshes a packaged one. Runtime symbols that codegen can emit should also appear in
`PRISMIO_CURATED_OPS` in `build_driver.c`, or carry a recorded waiver: the `curated_emits` and
`curated_closure` fixtures compare that list against what codegen actually emits, and a name may be
absent only with a reason written beside it.

**Removing or renaming a runtime symbol codegen emits is the dangerous direction.** It does not
fail where you make the change; it fails one generation later, in the compiler still emitting the
call, as an undefined-symbol list naming generated functions. Keep the old symbol for one
generation under `PRISMIO_BOOTSTRAP_COMPAT` and bump `PRISMIO_HOST_ABI` — see
[Compiler host and promotion](/tooling/compiler-host-and-promotion).

## Proof

Test empty, boundary, failure, ownership, and repeated-use cases. Run verifier and value assertions,
inspect emitted declarations, and exercise supported platforms. A runtime helper is not complete
until a packaged toolchain can link it outside the repository.

Add a direct runtime test when C behavior can be isolated, a Prismio execution test for the public
surface, an AIF manifest assertion for ownership, and an IR assertion for symbol selection. Build
with `--verify` to exercise ledger hooks, then run without verification to cover the ordinary ABI.
If the API is platform-specific, test its unavailable path and avoid declaring platform support
from one successful host.
