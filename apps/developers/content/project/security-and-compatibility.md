---
title: Security and compatibility boundaries
description: Prismio compiler trust, unsafe foreign code, runtime verification limits, pre-1.0 compatibility, and responsible reporting.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [security, compatibility, ffi]
related: [aif/ffi-contracts, runtime/platform-and-packaging, releases/0.1.0]
---

Prismio's static checks and AIF operate inside a trust boundary. The compiler can enforce rules for
the source and contracts it understands; it cannot prove an arbitrary C implementation obeys a
false declaration.

## Trusted and unsafe boundaries

The bootstrap seed, self-hosted compiler, LLVM backend, linked runtime, standard library, manifest,
native libraries, and foreign contracts all influence the produced program. A compromised or
mismatched component can invalidate source-level guarantees.

Raw pointers and `extern fn` calls require exact ABI and ownership declarations. Native link
inputs execute with the program's authority. Build scripts and local compiler hosts should be
reviewed before running an untrusted checkout.

## Boundary map

| Boundary | Compiler enforcement | Outside the proof |
| --- | --- | --- |
| Prismio source | Parser, types, ownership, AIF, LLVM verification | Compiler implementation defects |
| `extern fn` | Contract syntax and static propagation | Whether the C body obeys the declaration |
| LLVM bridge | Numeric handle/type checks implemented by the wrapper | LLVM defects and unchecked wrapper misuse |
| UMS project | Typed manifest validation and planned arguments | Executables, scripts, and linked files it invokes |
| Bootstrap | Successive-generation and seed checks | Trustworthiness of the committed seed/toolchain |
| Packaged runtime | Source hash and separation checks | Tampering after packaging or an unverified distributor |

`semaCheckExternContracts()` validates `borrow`, `retain`, `retain_in(k)`, `consume`, `out`,
`alias`, and `produce(free_fn)` structurally. AIF then trusts those facts. It cannot inspect an
arbitrary foreign body, confirm the named deallocator matches its allocator, or prevent a retained
pointer from being used after the Prismio owner dies if the declaration says `borrow`.

`--verify` is diagnostic instrumentation, not a sandbox or complete memory-safety proof. It does
not automatically cover every foreign allocation, platform handle, race, or premature release that
happens to balance bookkeeping.

The verifier instruments the Prismio runtime allocation/release ledger. It catches leaks, invalid
releases, and supported ownership violations in instrumented code. It does not establish value
correctness: an early release followed by a compensating allocation can balance counts. Pair every
ledger assertion with the program's output and use ASan/TSan for native memory and concurrency paths.

UMS command steps and native link inputs are code-execution boundaries. `dispatchToUmsHost()` can
run a checkout-local compiler and declared commands can run arbitrary tools with the user's
authority. Inspect `build.ums`, dependencies, and scripts before building an untrusted repository.

## Compatibility

Before 1.0, syntax, diagnostics, AIF policy, manifests, internal symbols, runtime layouts, and ABI
details may change. Pin the compiler revision for persistent experiments. Release and migration
notes should identify source, manifest, generated-artifact, and runtime compatibility separately.

Compatibility has independent axes. Source compatibility asks whether parsing and semantics remain
accepted. Manifest compatibility belongs to `umsLex()` / `umsParse()` and the typed model. Report
compatibility covers AIF manifests and diagnostic JSON. ABI compatibility covers type layout,
runtime symbols, calling convention, and foreign boundaries. Artifact compatibility covers seed IR,
LLVM bitcode, objects, and packaged runtimes. Never infer one axis from another.

Report suspected vulnerabilities privately to `security@prismio.org`; do not open a public issue.
Include the compiler revision, host and target, minimal source or manifest, exact command, observed
artifact or behavior, and whether foreign code is involved.
