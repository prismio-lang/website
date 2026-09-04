---
title: Modules and imports
description: Resolve Prismio 0.1 dotted file imports, wildcard imports, cycles, and declaration names.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [modules, imports, name-resolution]
related: [guides/modules, specification/name-resolution, package-manager]
---

Imports combine multiple `.psm` files into one compilation. An import path is resolved beneath the entry source file's directory—not relative to every importing file and not through a package registry. Dots become path separators and `.psm` is appended.

```prismio
import syntax.token
import syntax.*
```

Imports are top-level declarations. They do not introduce runtime operations, and imported files do not become first-class module objects.

There is no prelude. `std.io` is an ordinary import, so a program that names no I/O carries none — which is what lets a target with no stdout link at all. `std.*` modules differ from application modules only in where they are found: they ship with the compiler rather than being resolved beneath the entry file.

## Dotted file imports

For `src/main.psm`, `syntax.token` resolves to `src/syntax/token.psm`. `syntax.*` imports direct `.psm` files in `src/syntax/`, sorted by path. It is not recursive.

For example:

```text
src/
├── main.psm
└── syntax/
    ├── parser.psm
    ├── token.psm
    └── internal/
        └── cursor.psm
```

From `src/main.psm`:

- `import syntax.token` resolves `src/syntax/token.psm`;
- `import syntax.parser` resolves `src/syntax/parser.psm`;
- `import syntax.*` includes `parser.psm` and `token.psm` in sorted path order;
- the wildcard does not recursively include `syntax/internal/cursor.psm`.

Import `syntax.internal.cursor` explicitly when it is needed.

## A flattened declaration space

Imported syntax trees are flattened into one program before semantic analysis. This means declarations are not selected through a module namespace at use sites. The resolver memoizes files, so cycles and diamond-shaped dependency graphs do not repeatedly merge the same source.

Suppose `syntax/token.psm` declares `struct Token`. After import, callers write `Token`, not `syntax.token.Token`. Types are referenced by their declaration name alone.

Function calls are the exception, and the only one: an import path may qualify a call. See [module qualifiers](#module-qualifiers).

Flattening also means declarations from different files can conflict. Two same-kind declarations with the same name are rejected unless they are functions that form a valid overload set.

## Module qualifiers

A call may be written with the import path of the module that declares it. The qualifier is the path exactly as it is imported — `std.string`, not the file's leaf name and not the directory it happens to occupy on disk.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    print(std.string.strTrim("  padded  "))
    return 0
}
```

Qualifying is optional. An import still brings its declarations into the program unqualified, so `strTrim("  padded  ")` remains correct and is the usual spelling. A qualifier is worth reaching for when two modules declare the same function name, which flattening would otherwise make ambiguous.

Only the full path resolves. A leaf alone is not a qualifier, because leaves are not unique — a source tree may hold several files named `types.psm`.

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn main() -> Int {
    print(string.strTrim("  padded  "))
    return 0
}
```

The compiler recognizes this case and names the module you likely meant rather than reporting an unknown identifier.

Qualifiers apply to calls only. A type, a global, or an enum variant cannot be qualified.

## Visibility

A function declaration may carry one of three modifiers. Without one, a declaration is public.

| Modifier | Visible in |
| --- | --- |
| `public` | everywhere; the default, so writing it is optional |
| `private` | the file that declares it |
| `internal` | the package that declares it — its import path minus the last segment |

<!-- prismio-check: pass -->
```prismio
import std.io

public fn doubled(x: Int) -> Int { return x * 2 }

private fn scale(x: Int) -> Int { return x * 3 }

fn tripled(x: Int) -> Int { return scale(x) }

fn main() -> Int {
    print(doubled(4))
    print(tripled(4))
    return 0
}
```

`private` is enforced against the declaring **file**, so a sibling file in the same directory cannot call it. `internal` is enforced against the declaring **package**: `store.index` and `store.cache` may call each other's `internal` functions, and a module outside `store` may not.

Visibility is opt-in rather than private-by-default. That is the opposite of most languages, and it is deliberate: every declaration written before these modifiers existed is public, so a private default would have changed the meaning of existing code rather than adding to it.

Modifiers apply to `fn`, `extern fn`, and a method inside an [`impl` block](/language/methods#visibility-on-methods) -- a method *is* a free function whose first parameter is the receiver, so the marker means the same thing there. A modifier on a type, an enum, or a global is rejected rather than accepted and ignored, because the check runs during overload resolution and would otherwise promise a guarantee the compiler does not enforce.

## Selective imports

`import std.string.strTrim` brings in one name rather than the whole module.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string.strTrim

fn main() -> Int {
    println(strTrim("  hello  "))
    return 0
}
```

Whether a trailing segment names a module or a name inside one is decided by resolution rather than by the grammar. The full path is tried as a file first, and only when there is no such file is the last segment treated as a selected name in its parent -- so `std.string.strTrim` would mean the module `std/string/strTrim.psm` if that file existed.

Select several names with several imports. A name the file did not select is not in scope in that file, even though the merge still places every declaration of the module into one flat program:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string.strTrim

fn main() -> Int {
    println(strToUpper("shout"))
    return 0
}
```

The diagnostic is `unknown function`, not a visibility error. The name was never brought into this file, so the fix is to add it to the import rather than to change a modifier in the file that declares it.

Selection is per importing file. A module that imports `std.string` wholesale keeps every name in it, whatever another file selected from that same module, and this holds even though the module itself is merged only once.

## Wildcard imports

`directory.*` discovers direct `.psm` children and merges them in sorted path order. Sorting makes discovery deterministic for a fixed file tree, but programs should not depend on declaration order for semantics that the language does not guarantee.

Wildcard imports are useful for a directory whose direct children intentionally form one unit. They can also make changes less visible: adding a new `.psm` file changes the program without editing the importer. Prefer explicit imports where dependency review matters.

<!-- prismio-check: fail -->
```prismio
import missing.module

fn main() -> Int { return 0 }
```

Compilation fails if the resolved source file does not exist or cannot be read.

## Cycles and repeated imports

The loader memoizes resolved files. In a diamond graph, a shared file is merged once. A cycle does not repeatedly expand forever.

Memoization prevents duplicate loading; it does not create partially initialized runtime modules because imports are a compile-time source merge. Normal semantic rules still reject conflicting declarations across the resulting program.

## Name resolution consequences

- Imported types and functions are referenced by their declaration names.
- A call may additionally be qualified by the declaring module's import path.
- Local bindings use lexical scope and can shadow outer locals.
- Overloaded functions share a name only when signatures remain distinguishable.
- `private` and `internal` restrict which files may call a function; without a modifier it is callable everywhere.
- File names do not declare namespaces on their own; the import path is the qualifier.

See [name resolution](/specification/name-resolution) for the compiler-derived lookup rules.

## Project layout guidance

Place an executable entry file near the root of the source tree, group related files in subdirectories, and use dotted explicit imports for stable dependencies.

```text
src/
├── main.psm
├── model/
│   ├── request.psm
│   └── response.psm
└── protocol/
    ├── decode.psm
    └── encode.psm
```

From `src/main.psm`:

```prismio
import model.request
import model.response
import protocol.decode
import protocol.encode
```

## Not implemented

Prismio 0.1 has no module aliases and no re-exports. A plain `import m` brings in every public declaration of the module it names; to bring in one name and leave the rest, see [selective imports](#selective-imports).

Visibility does not extend to types, enums, or globals — a modifier on one is rejected. Qualifiers do not extend to them either.

A same-kind duplicate named declaration is an error, except that functions may form valid overload sets.

The [package manager](/package-manager) has a manifest and a lockfile but no registry, and a resolved path dependency is not yet on the import search — so vendor source below the entry root. External C-compatible libraries are linked through compiler options and declared with `extern fn`; that mechanism is independent of source imports.
