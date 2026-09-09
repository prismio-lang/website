---
title: Compiler architecture
description: The self-hosted Prismio 0.1 pipeline from source and imports through semantics, AIF, LLVM IR, and native linking.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [compiler, architecture, self-hosting, llvm]
related: [compiler/pipeline-and-driver, llvm/overview, compiler/bootstrap]
---

The Prismio compiler is a self-hosted command-line program: its main lexer, parser, semantic analysis, allocation inference, import resolver, LLVM generation, and driver orchestration are written in Prismio itself.

A source file moves through these stages:

```text
.psm source
  → lexer and parser
  → import resolution and AST flattening
  → semantic/type/ownership analysis
  → Adaptive Inference Framework (AIF)
  → LLVM IR generation through the LLVM C API
  → Clang object generation and runtime link
  → native executable
```

Emitting an output ending in `.ll` stops after LLVM IR generation. A normal native build continues through object generation and runtime linking.

## Source loading and imports

The CLI selects an entry `.psm` file. Its directory anchors dotted imports. The import resolver canonicalizes each file, memoizes cycles and diamonds, expands direct wildcard imports in sorted order, and flattens resulting syntax trees into one program.

No module namespace survives flattening. Semantic analysis sees the combined declarations and diagnoses duplicates or invalid overload sets.

## Lexer and parser

The lexer converts UTF-8 source into tokens, preserving source positions for diagnostics. The parser constructs the AST for top-level declarations, statements, types, and precedence-climbed expressions.

Parser recovery can continue after selected failures to report independent issues in one run. Token
presence is not feature evidence: `trait` and `impl` are implemented, while `throw` remains
reserved without an accepted statement production.

## Semantic analysis

Semantic passes establish lexical scopes, resolve declarations, assign types, select overloads, validate fields/variants, enforce return/control-flow rules, and track ownership state.

This stage rejects invalid numeric combinations, wrong calls, member access on optional values, use after move, illegal drops, loop ownership hazards, and other static errors before code generation.

## Allocation inference

AIF runs after semantic/type/ownership analysis. It consumes escape, alias, field, container, region, and ownership evidence to choose a supported allocation tier or refute an annotation. AIF is experimental; the source-level ownership contract remains independent of which tier is selected.

## LLVM generation and verification

The IR layer maps Prismio types and statements through the LLVM C API exposed by linked C/backend support. It creates functions/globals, lowers control flow and runtime calls, and verifies the resulting module before emission.

LLVM module verification checks IR structural validity; it is not a substitute for language semantic analysis or runtime ownership verification.

## Object generation and linking

For a native executable, the driver merges library bitcode into the program module before the optimizer runs, then compiles and links the result. The inputs are the program's IR, one PLIB bitcode section per imported `std.*` module, and one `.bc` per runtime translation unit from `lib/runtime/`. `ir_link_library_modules` does all of it in **one LLVM context, one transaction**; the earlier design reparsed and reprinted the growing program once per artifact, which made a module-wise package accidentally quadratic in serialization work — a large program crossed the text-IR boundary sixteen times before optimization.

There is no curated subset, no source fallback and no opt-out. The obsolete `PRISMIO_INLINE_RUNTIME` variable is ignored, and a missing module is an installation error naming the exact file. See [Library artifacts](/runtime/library-artifacts) for the two formats and [Platforms and packaging](/runtime/platform-and-packaging) for the layout they live in.

Two policies apply at that boundary. Imported functions get LLVM's `inlinehint` when they pass a cost filter that scores a call far higher than arithmetic — an eligibility filter, not a decision; LLVM's target-aware model still chooses. Wrappers that read the environment or take a thread-local address get `noinline` instead: their calls stay dynamic after inlining while the expanded control flow changes the greedy inliner's later ordering, and that is a property of the IR rather than a list of blessed names. After the merge, imported definitions with no IR users are deleted, repeatedly, because removing one wrapper can make its callees dead; without it every executable would export the whole runtime surface.

The bootstrap command is the exception. It rebuilds compiler backend and runtime C sources from the repository, because a compiler generation needs more than the application runtime and must pick up C changes made after its host was built.

Setting `PRISMIO_BUILD_TRACE=1` prints one wall-clock line per build stage — `library bitcode merge`, program optimization, and the link — which is the supported way to attribute a compile-time question to a stage.

The compiler sources are organized by stage under `src/`: `lexer`, `parse`, `ast`, `sema`, `aif`, and `ir`. `src/main.psm` owns the CLI, import resolver, and build orchestration. The LLVM bridge is declared to Prismio through `extern fn` and implemented in the linked C runtime/backend.

This stage-oriented layout is a maintenance contract: language changes should enter through the earliest appropriate layer and be reflected in later layers, tests, diagnostics, specification, and documentation.

LLVM **22.1.8** is the supported backend line. Generated modules are verified before artifact emission. The build driver embeds the runtime/toolchain sources needed to link ordinary programs.

Using a materially different LLVM line can fail even when a system `clang` exists, because textual/bitcode expectations and C API availability evolve. The setup scripts select the pinned toolchain.

The reference compiler reports version `0.1.0`. Self-hosted does not mean compiler behavior is frozen; generation and fixed-point checks protect reproducibility while the language evolves.

## Trust and fixed points

A committed target-neutral seed breaks the initial self-hosting cycle. The seed builds a new compiler generation, which builds the next. Fixed-point comparison detects when successive generations disagree about the compiler source.

CI combines that check with positive/negative programs, AIF oracle tests, generated-symbol checks, and multi-platform builds. See [bootstrapping](/compiler/bootstrap) for the exact operational model.
