---
title: Prismio cookbook
description: Task-oriented Prismio 0.1 recipes that combine language and compiler features.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cookbook, recipes, practical]
related: [examples, cookbook/cli-arguments, cookbook/c-ffi]
---

The cookbook answers “how do I?” questions that cross reference-page boundaries. Recipes assume Prismio 0.1.0 and state when they depend on the compiler runtime rather than an importable standard-library module.

A recipe is task-oriented: it gives a safe current approach, identifies the compiler/runtime contract involved, and calls out what remains unavailable. It does not establish new syntax or library surface.

## Integration recipes

- [Read command-line arguments](/cookbook/cli-arguments)
- [Wrap a C function](/cookbook/c-ffi)
- [Investigate an allocation decision](/guides/memory-and-aif)

## Choose the right section

- Use the [language reference](/language) to answer “what does this syntax mean?”
- Use the [specification](/specification) for conformance and exact rule boundaries.
- Use the [error reference](/errors) to repair a diagnostic.
- Use [examples](/examples) for small compiler-verified complete programs.
- Use the cookbook for an end-to-end task involving more than one rule.

Recipes stay focused and avoid inventing package or library APIs that are still Coming Soon.

Because Prismio 0.1 has no package *registry* — and because a resolved path dependency is not yet on the import search — several practical recipes use local `extern fn` wrappers. Those recipes must be read with the FFI safety boundary: symbol linking and foreign ownership cannot be proven by the Prismio compiler alone.
