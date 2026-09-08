---
title: Add a runtime or standard-library API
description: Choose the correct Prismio implementation layer, specify ownership, connect native symbols, and prove behavior across targets.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
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

Expose application-facing operations through a standard module. Add required sources to embedded
and packaging paths. If a new native library is required, declare it through the UMS target rather
than relying on an ambient developer machine.

Runtime symbols that codegen can emit may also need inclusion in `PRISMIO_CURATED_OPS` and the
curated runtime-IR dependency closure in `build_driver.c`. Update the source inventories used by
bootstrap and packaging. The regression suite checks that codegen-emitted operations are present in
the curated set and that its closure contains every referenced runtime symbol.

## Proof

Test empty, boundary, failure, ownership, and repeated-use cases. Run verifier and value assertions,
inspect emitted declarations, and exercise supported platforms. A runtime helper is not complete
until a packaged toolchain can link it outside the repository.

Add a direct runtime test when C behavior can be isolated, a Prismio execution test for the public
surface, an AIF manifest assertion for ownership, and an IR assertion for symbol selection. Build
with `--verify` to exercise ledger hooks, then run without verification to cover the ordinary ABI.
If the API is platform-specific, test its unavailable path and avoid declaring platform support
from one successful host.
