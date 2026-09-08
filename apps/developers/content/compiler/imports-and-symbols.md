---
title: Imports, modules, and symbols
description: How Prismio resolves files, flattens modules, applies visibility, and builds the symbol environment used by semantics.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [imports, modules, symbols]
related: [compiler/frontend, compiler/semantic-analysis-and-types, tooling/build-manifest]
---

`src/driver/imports.psm` resolves source files before semantic analysis. The entry file's
directory anchors ordinary dotted imports. Canonical paths prevent duplicate loading, and memoized
resolution handles diamonds and import cycles.

## Flattening and names

Resolved syntax trees are flattened into the program analyzed by sema. Module-qualified calls and
selective imports preserve the source-level names needed for lookup, but the backend does not
compile an independently linked object per source file.

Wildcard imports include direct `.psm` children in deterministic sorted order; they are not
recursive filesystem globbing. Duplicate declarations and invalid overload sets are diagnosed after
the participating files are known.

## Standard modules

`std.*` uses compiler-owned search rules so a compiler checkout can build against its matching
standard library and an installed toolchain can resolve its packaged `stdlib`. Check
`prismio --version` when an unexpected standard module appears: it prints the compiler and
resolved library location.

## Visibility

Public, private, and internal function visibility is enforced during module-aware lookup. Trait
methods and inherent methods still pass through ordinary overload machinery after the receiver
rewrite. Visibility must be tested both from the declaring package and across a package boundary.

Symbols are managed under `src/sema/symbols.psm`. Add names there only after import resolution
has established the declarations that can participate.

## Import resolver call graph

`resolveImports(module, baseDir, entryPath)` creates the merged module and visited set, records the
entry file, and calls `mergeModuleImports`. Each import is resolved before non-import
declarations are appended, giving semantic analysis one program-wide declaration chain.

| Function | Responsibility |
| --- | --- |
| `moduleRelativePath` | Converts a dotted module name to the platform-neutral relative `.psm` path |
| `resolveUnder` | Joins and validates a candidate below a base directory |
| `importBaseDir` | Selects package-relative versus current-module search roots |
| `joinImportPath` | Builds the path for a specific module file |
| `joinImportDir` | Builds the directory used by package/module discovery |
| `standardModulePath` | Resolves `std.*` through the compiler's selected standard-library root |
| `resolveImportPath` | Applies source-root, standard-library, and file-existence rules |
| `parseSource` | Reads one imported file, allocates its file ID, lexes, and parses it |
| `mergeNamedModule` | Applies selective/qualified import behavior and records selection metadata |
| `mergePackageImport` | Discovers package members through `list_modules` and merges them deterministically |
| `importMemoKey` | Produces the identity used to break repeated and cyclic traversal |

`appendStatement` preserves source order while `hasNamedTopLevel` and `sameTopLevelName`
prevent accidental duplicate declarations from being silently merged. The visited key describes
the resolved file/import selection, not only the written spelling; otherwise two relative paths
could parse the same file twice.

## Symbol identity and lookup

After merge, `indexModuleDeclarations` records named top-level nodes. `semaCacheFunctionSymbols`
computes the final linkage identity for each function before call checking. `semaFunctionSymbol`
combines source name, parameter signature, specialization, and owning trait/implementation context.
`semaMangleType` provides an unambiguous type fragment rather than relying on human display text.

`semaFindFunctionOverload` filters candidates in this order: active import selection, visibility
from the call file, name/qualifier, arity, exact/coercible parameter types, generic applicability,
and default-literal score. It records the chosen emitted symbol on the call node. A later backend
lookup should use that symbol instead of repeating overload resolution.

Module visibility is handled by `semaFileQualifier`, `semaModuleWithLeaf`,
`semaModuleDeclares`, `semaQualifierNamesModule`, and `semaDeclVisibleFrom`.
`semaNoteTraitQualifiers` also brings trait method candidates into scope only when the relevant
trait/module import makes them visible.

Add resolver tests for relative and standard imports, duplicate textual paths, cycles, package
ordering, selective imports, local shadow attempts, same-name declarations in separate modules,
private/internal/public access, ambiguous overloads, default numeric literals, and diagnostics
that point to the importing site rather than only the imported file.
