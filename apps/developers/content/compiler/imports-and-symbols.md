---
title: Imports, modules, and symbols
description: How the compiler turns several .psm files into one flattened program, resolves std.* to precompiled .plib interfaces, and enforces public/private/internal visibility during lookup.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [imports, modules, symbols]
related: [compiler/frontend, compiler/semantic-analysis-and-types, compiler/diagnostics]
---

A Prismio program is rarely one file. Before semantic analysis can check a single call, it needs to know every declaration reachable from every file the program touches, which files are allowed to see which of those declarations, and where each one came from so a diagnostic can point at it. Building that is the job of import resolution: turn a graph of `import` statements into one flattened program, stamp provenance on every node, and enforce the visibility each declaration was written with.

Get this step wrong in either direction and a reader hits one of two confusing failures: a name that should exist reports `unknown function`, or a name the author marked private turns out to be reachable from somewhere it shouldn't be.

`src/driver/imports.psm` does this work, before semantic analysis runs. The entry file's own directory anchors ordinary dotted imports; canonical paths stop the same file loading twice, and memoized resolution handles cycles and diamond-shaped import graphs without re-parsing anything.

## See two files become one program

Given a library file and a program that imports it (two files, so neither compiles alone — `lib2.psm`):

```prismio
import std.io

public fn greet(name: String) -> String {
    return "hello, ".concat(name)
}
```

and `main.psm`, which imports it:

```prismio
import std.io
import std.string
import lib2

fn main() -> Int {
    println(lib2.greet("prismio"))
    return 0
}
```

```bash
prismio run main.psm
```

```text
Built main
hello, prismio
```

Nothing here links `lib2.psm` as a separate object. Both files are parsed, and their declarations are merged into one **AST** (abstract syntax tree) before semantic analysis ever runs, so `main.psm` can call `greet` either qualified (`lib2.greet(...)`) or, since an import also brings a module's names in unqualified, as plain `greet(...)`. Only calls can be qualified this way — a type, enum, or global cannot be.

## What a visibility violation looks like

Function visibility defaults to **private**: no modifier and `private` are the same declaration. A helper you say nothing about is not part of your file's surface, so adding one cannot widen that surface by accident — the opposite of the opt-in scheme this replaced, where forgetting to mark something private was the mistake that leaked it.

Add a second, unmarked function to the library above and call it from `main.psm`:

```prismio
private fn secret() -> Int {
    return 42
}
```

```bash
prismio check main.psm
```

```text
error[P4001]: `secret` is private to the file that declares it
 --> main.psm:5:10
  |
5 |     lib2.secret()
  |          ^^^^^^
  note: mark it `public` to make it part of its module's surface, or `internal` to share it within its package
```

The note names both fixes: `public` opens the declaration to every file that imports it; `internal` opens it to the rest of its own package — the qualifier with its last dotted segment removed — without going fully public. [Modules and imports](https://docs.prismio.org/language/modules) is the user-facing reference for all three levels; this page is about how the compiler enforces them.

## Why a working call can depend on a file that imports nothing

Here is the counter-intuitive part, verified against the compiler rather than assumed from the rule above. `lib2.psm` calls `"hello, ".concat(name)` and imports nothing but `std.io` — no `import std.string` anywhere in it. Compiled as its own entry file, that fails:

```bash
prismio check lib2.psm
```

```text
error[P4001]: unknown function `concat`
 --> lib2.psm:4:22
  |
4 |     return "hello, ".concat(name)
  |                      ^^^^^^
error[P4001]: return: expected String, found Void
 --> lib2.psm:4:22
  |
4 |     return "hello, ".concat(name)
  |                      ^^^^^^
```

But wired into `main.psm` above — which does `import std.string` — the identical `lib2.psm` compiles clean. Nothing in `lib2.psm` changed.

The reason is what "one flattened program" actually means. `concat` is an ordinary `public` method on `String`, declared in `std/string.psm`. A method is reached through its receiver's type, not through the calling file's own import list — the same way an inherent method in Rust needs no `use` at the call site — so there is no per-file import gate on it. But the method still has to exist *somewhere* in the merged program before any file can find it, and a module only enters that merge because some file's `import` statement asked for it. `main.psm`'s `import std.string` is what pulls `std/string.psm`'s declarations — including `concat` — into the one AST that every file in the program shares, `lib2.psm` included. With nothing importing `std.string` anywhere, `concat` is not merely inaccessible from `lib2.psm`; it does not exist in the program at all, which is exactly what "unknown function" reports.

Free functions do not get this leniency: calling an unqualified free function still requires the calling file to import the module that declares it, even when some other file already imported it for an unrelated reason (this is deliberate — see [imports are not transitive](https://docs.prismio.org/language/modules#imports-are-not-transitive)). It is specifically methods, reached by receiver type rather than by namespace, that cross this boundary.

## Standard modules

`std.*` is not parsed from an ordinary relative path. It resolves through compiler-owned search rules to a precompiled `.plib`, and the resolver reads that file's interface rather than lexing source — so a compiler checkout builds against its matching standard library, and an installed toolchain resolves its packaged `stdlib`. When an unexpected standard module shows up, check `prismio --version`: it prints both the compiler and the resolved library location.

```bash
prismio --version
```

```text
prismio 0.1.0
llvm 23.1.1
compiler ~/prismio/.prismio/build/debug
stdlib ./std
```

A `.plib` that will not open at all — missing, incompatible, or corrupted — is a separate failure from a source file that is simply absent: it is an installation problem, not a typo in an import, so it gets its own code (`P1068`) telling the reader to reinstall rather than to go hunting through their own tree. An ordinary missing source file reports `P1001` instead: `cannot read imported module … : no such file …`.

## If you are changing the import resolver

### Flattening and names

Wildcard imports (`pkg.*`) include direct `.psm` children in deterministic sorted order — not recursive filesystem globbing. Duplicate declarations and invalid overload sets are only diagnosed once every participating file is known, since flattening has to finish first. Which file a declaration came from travels on the node itself as a file id into the diagnostics registry, together with the logical module path that file was imported by; that pair is what qualified calls, selective imports, and visibility checks are tested against.

### Import resolver call graph

`resolveImports(module, baseDir, entryPath)` creates the merged module and visited set, records the entry file, and calls `mergeModuleImports`. Each import is resolved before non-import declarations are appended, giving semantic analysis one program-wide declaration chain.

| Function | Responsibility |
| --- | --- |
| `moduleRelativePath` | Converts a dotted module name to the platform-neutral relative `.psm` path |
| `resolveUnder` | Joins and validates a candidate below a base directory |
| `importBaseDir` | Selects package-relative versus current-module search roots |
| `joinImportPath` | Builds the path for a specific module file |
| `joinImportDir` | Builds the directory used by package/module discovery |
| `standardModulePath` | Resolves `std.*` through the compiler's selected standard-library root |
| `resolveImportPath` | Applies source-root, standard-library, and file-existence rules |
| `parseSource` | Reads one imported file, allocates its file id, lexes, and parses it |
| `mergeNamedModule` | Applies selective/qualified import behavior and records selection metadata |
| `mergePackageImport` | Discovers package members through `list_modules` and merges them deterministically |
| `importMemoKey` | Produces the identity used to break repeated and cyclic traversal |

`appendStatement` preserves source order, while `hasNamedTopLevel` and `sameTopLevelName` prevent accidental duplicate declarations from being silently merged. The visited key describes the resolved file/import selection, not only the written spelling, so two relative paths that resolve to the same file cannot be parsed twice under different names.

### Symbol identity and lookup

After the merge, `indexModuleDeclarations` records named top-level nodes. `semaCacheFunctionSymbols` computes the final linkage identity for each function before call checking. `semaFunctionSymbol` combines source name, parameter signature, specialization, and owning trait/implementation context; `semaMangleType` provides an unambiguous type fragment rather than relying on human display text.

`semaFindFunctionOverload` filters candidates in this order: active import selection, visibility from the call file, name/qualifier, arity, exact/coercible parameter types, generic applicability, and default-literal score. It records the chosen emitted symbol on the call node, and a later backend lookup should use that recorded symbol instead of repeating overload resolution.

Module visibility is handled by `semaFileQualifier`, `semaModuleWithLeaf`, `semaModuleDeclares`, `semaQualifierNamesModule`, and `semaDeclVisibleFrom` (the three levels: `0` public — everywhere; `1` private — the declaring file, and the default; `2` internal — the declaring package). `semaNoteTraitQualifiers` brings trait method candidates into scope only when the relevant trait/module import makes them visible. Symbols themselves are managed under `src/sema/symbols.psm`; add names there only after import resolution has established the declarations that can participate.

Add resolver tests for relative and standard imports, duplicate textual paths, cycles, package ordering, selective imports, local shadow attempts, same-name declarations in separate modules, private/internal/public access, ambiguous overloads, default numeric literals, and diagnostics that point at the importing site rather than only at the imported file.
