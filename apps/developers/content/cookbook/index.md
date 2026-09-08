---
title: Prismio cookbook
description: Task-oriented Prismio 0.1 recipes that combine language and compiler features.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cookbook, recipes, practical]
related: [cookbook/cli-arguments, cookbook/c-ffi, cookbook/add-a-language-feature]
---

The cookbook answers “how do I?” questions that cross reference-page boundaries. Recipes assume Prismio 0.1.0 and state when they depend on the compiler runtime rather than an importable standard-library module.

A recipe is task-oriented: it gives a safe current approach, identifies the compiler/runtime contract involved, and calls out what remains unavailable. It does not establish new syntax or library surface.

## Integration recipes

- [Read command-line arguments](/cookbook/cli-arguments)
- [Wrap a C function](/cookbook/c-ffi)
- [Investigate an allocation decision](/aif/reuse-reports-and-verification)

## Compiler contributor recipes

- [Add a language feature](/cookbook/add-a-language-feature) follows a construct from token and AST
  through sema, AIF, LLVM, and regression coverage.
- [Add or change a diagnostic](/cookbook/add-a-diagnostic) covers permanent codes, spans, notes,
  recovery, and JSON Lines output.
- [Add a runtime or standard-library API](/cookbook/add-a-runtime-or-stdlib-api) chooses the correct
  implementation boundary and closes the contract, curation, and packaging loops.
- [Extend the UMS manifest](/cookbook/extend-ums) carries one field through syntax, typed models,
  validation, build planning, and host compatibility.
- [Debug a compiler or AIF regression](/cookbook/debug-a-compiler-regression) uses stage-specific
  probes to find the first incorrect representation.

Each recipe is a change path, not a second architecture reference. It names the exact functions to
start from, the cross-layer contracts that are easy to miss, and the evidence required before the
change is complete.

## Choose the right section

- Use the public language documentation when you need application-facing syntax or library rules.
- Use [compiler internals](/compiler/overview) when a recipe crosses pipeline stages.
- Use the [negative regression guide](/testing/regression-suite) when changing a diagnostic.
- Use [the benchmark contract](/performance/benchmark-contract) before adding performance evidence.
- Use the cookbook for an end-to-end task involving more than one rule.

Recipes stay focused and avoid inventing package or library APIs that are still Coming Soon.

## Completion rule

A compiler recipe is complete only when the earliest owning stage, every downstream consumer, and
the smallest discriminating test agree. A C symbol existing in `runtime/` is not an API until
Prismio declarations, ownership contracts, emitted references, curated-runtime closure where
applicable, and packaged linking all work. A parser production is not a language feature until
`check` and codegen implement its semantics. An AIF tier change is not a performance improvement
until the emitted mechanism and benchmark evidence support it.

Because Prismio 0.1 has no package *registry* — and because a resolved path dependency is not yet on the import search — several practical recipes use local `extern fn` wrappers. Those recipes must be read with the FFI safety boundary: symbol linking and foreign ownership cannot be proven by the Prismio compiler alone.
