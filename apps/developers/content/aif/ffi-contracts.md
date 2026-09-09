---
title: AIF foreign-function contracts
description: How extern declarations describe borrowed, consumed, produced, aliased, escaping, and released foreign storage.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [aif, ffi, ownership]
related: [cookbook/c-ffi, runtime/supported-surface, aif/tiers-and-analysis-domains]
---

Foreign code is opaque to the Prismio analyzer. An extern contract supplies the ownership and
escape facts that an ordinary Prismio body would have revealed.

Contracts distinguish parameters that are borrowed, consumed, retained, or allowed to alias, and
results that are borrowed aliases versus newly produced ownership. A produced result names the
matching release operation. The exact grammar is defined by the compiler and AIF specification;
do not infer a contract from C type spelling alone.

## Why defaults are conservative

A pointer-shaped return does not reveal whether the callee allocated, returned static storage, or
returned an interior pointer into an argument. Guessing “owned” can free foreign memory; guessing
“borrowed” can leak. Incomplete contracts therefore restrict optimization and may raise allocation
tiers.

`src/aif/contracts.psm` contains known runtime/backend contracts. Application-facing system APIs
should normally be wrapped in `std.*`, where the contract is declared once. Raw `extern fn`
remains appropriate for foreign code supplied by an application or compiler component.

## Tests

Cover success and misuse: produced results with the correct deallocator, aliases that outlive an
argument, consuming calls, two arguments that may alias, and escaping callbacks or task transfers.
Use `--verify` where the runtime can observe the boundary, but retain value assertions and native
sanitizer coverage for behavior outside the ledger.

## Contract resolution order

`aifFfiContract(name, index)` selects one parameter contract using this precedence:

1. `aifDeclaredContract` reads the annotation encoded from the source declaration;
2. `aifCompilerBuiltinContract` supplies semantics for compiler-recognized operations;
3. `aifRuntimeContract` supplies reviewed behavior for shipped runtime functions; and
4. the fallback is opaque/foreign and therefore conservative.

The distinction matters because a user declaration may intentionally describe an application
symbol with the same shape as a runtime function. Declared behavior wins; the runtime table is not
a name-based capability granted to arbitrary source.

| Query | What the walker needs |
| --- | --- |
| `aifCallIsSummarised(name, argc)` | Whether all relevant behavior is represented by a known summary |
| `aifFfiAliasOf(name)` | Which argument owns storage referenced by the return value |
| `aifFfiReadsElement(name)` | Which container argument has an element read/view relationship |
| `aifArgTypeAt(call, index)` | The fully resolved source type for element/container policy |
| `aifDeclaredReturnIsProduce(name)` | Whether the caller receives fresh owned storage |
| `aifDeclaredReturnIsAlias(name)` | Whether the result borrows existing storage |
| `aifFfiTransfersExisting(name)` | Whether ownership of an argument crosses the boundary |
| `aifFfiProduces(name)` | Whether the call creates a site/result that AIF must track |

`parseFfiContract` parses annotations and `semaCheckExternContracts` validates legal placement,
argument indices, deallocator names, and incompatible combinations. `aif_extern_contract_set`
stores the checked encoding for the native solver; `aif_extern_contract` retrieves it by function
and parameter.

## Constraint and ABI effects

A borrowed parameter applies `aif_con_borrow` and does not transfer ownership. A consuming
parameter applies the call's transfer/escape behavior and prevents later source use. An aliasing
return calls `aif_vs_view_of` or connects the result to the selected argument's value set. A
produced return creates or exposes an allocation site and uses the declared deallocator in codegen.

An unsummarised foreign call applies `aif_con_foreign` or `aif_con_opaque` to reachable values.
That can raise escape, alias, and thread facts because the compiler cannot inspect retention,
mutation, callbacks, or concurrency inside the callee.

`declareExternFunction` uses `ffiType`, not ordinary `storageType`. A Prismio fat string
becomes the NUL-terminated pointer half for C. `ir_call_arg_cstr` extracts that pointer and
records whether a temporary conversion must be released after the call.

### `bytes`, the contract that changes marshalling rather than ownership

`bytes` is `borrow` to the solver — `aifDeclaredContract` maps it to `AIF_FFI_BORROW` and the
lattice gains no fourth state. What it changes is codegen: the argument takes
`ir_call_arg_borrow("ptr", …)` instead of `ir_call_arg_cstr`, so a **view** crosses as its own
pointer rather than as a NUL-terminated copy that must be released afterwards. Sema restricts it
to `String` parameters, where a copy is the only thing there is to suppress.

Declare it for any C signature that carries an explicit length. A loop that advances through a
buffer takes a view of the remainder on every pass, and under `borrow` each pass materialises the
whole remainder — the reason `std/io.psm` could not express a `write` retry loop before this
contract existed.

**A view bound to a local escapes; one written into the call does not.** `aifFfiAliasOf` reports
`__builtin_string_view` as argument 0's storage on purpose, so the base cannot be released while a
view of it is live. The consequence is that `let rest = __builtin_string_view(text, …)` raises
`text`'s escape to Caller, and every caller's drop of the value it passed in is declined with it.
Building the view directly into the call argument keeps it Local. The symptom is a `--verify`
ledger imbalance rather than a diagnostic, and `aif --why` names the binding as an `E-BIND`.

Contract correctness is outside LLVM type checking. A declaration can verify and link while lying
about retention or deallocation. Test native behavior under ASan/TSan where applicable, pair
produced storage with its exact allocator family, and keep wrappers narrow enough to audit.
