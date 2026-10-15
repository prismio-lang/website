---
title: Private or internal declaration
description: Fix Prismio uses of a function, global, struct, enum or struct field from outside the file or package that declares it.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-15"
tags: [error, visibility, modules, private, internal]
related: [language/modules, language/methods, specification/name-resolution]
---

## Meaning

A declaration exists and matches the use, but is not visible where the use was written. The declaration may be a function, a global `let`, a struct, an enum, or a field of a struct (`` field `x` of `Point` is private to the file that declares it ``). A struct or an enum reports itself with its kind: `` struct `Point` is internal to the package that declares it ``, `` enum `Mode` is private to the file that declares it ``.

- `` `name` is private to the file that declares it `` — the declaration carries `private`, and the call is in a different file.
- `` `name` is internal to the package that declares it `` — the declaration carries `internal`, and the call is outside its package. A package is the module's import path minus the last segment, so `store.index` and `store.cache` share one.

This is a visibility decision, not a lookup failure. The name resolved; it was then declined. A misspelling reports [unknown identifier](/errors/unknown-name) instead.

## Why it happens

Usually the declaration is a helper that was marked deliberately, and the call is reaching past an interface rather than through it. Occasionally the marker is simply wrong — `private` where `internal` was meant, on a helper two files in one package share.

## Invalid code

The violation is inherently a *cross-file* one, so it cannot be shown in a single
snippet — a lone file may always call its own `private` functions. Given
`store/index.psm`:

```prismio
private fn scale(x: Int) -> Int { return x * 3 }

fn tripled(x: Int) -> Int { return scale(x) }
```

then from `main.psm`:

```prismio
import store.index

fn main() -> Int {
    return scale(2)
}
```

```text
error: `scale` is private to the file that declares it
  note: drop `private` from its declaration, or mark it `internal` to share it within its package
```

`tripled` calls `scale` perfectly legally, because it is in the same file. That is
the distinction `private` draws.

An enum is the same, and a variant takes its enum's level. With `store/mode.psm`:

```prismio
enum Mode {
    Fast,
    Slow
}

public fn defaultMode() -> Mode { return Mode.Fast }
```

`Mode` has no marker, so it is `internal`. From `main.psm`, in another package, `defaultMode()` is callable and its result can be held, but the enum cannot be named:

```prismio
import store.mode

fn main() -> Int {
    let mode = Mode.Slow
    return 0
}
```

```text
error: enum `Mode` is internal to the package that declares it
  note: write `public enum Mode` to make it part of its module's surface
```

The same message is raised for a type annotation that names the enum, for a variant built from it, and for a `match` arm that names one of its variants.

What *does* fail inside one file is a modifier somewhere it is not accepted:

<!-- prismio-check: fail -->
```prismio
private trait Hidden {
    fn size(self) -> Int
}

fn main() -> Int {
    return 0
}
```

```text
error: `private` is only accepted on a function, a struct, an enum, a global `let` or an `extern` declaration
  note: a trait and an impl block have no visibility of their own; mark the functions inside them
```

## How to fix it

Pick the level that describes the intent rather than the one that silences the error:

| Situation | Level |
|---|---|
| a function, global, struct or enum nothing else should use | `private` |
| one the rest of the package shares | `internal` |
| part of the module's interface | `public` |

With no marker a function is `private`, a global is open to every file, and a struct and an enum are `internal`; see [modules](/language/modules#visibility). A modifier is accepted on a function, a method inside an `impl` block, a global `let`, a struct, an enum, or a foreign declaration (`extern fn`, `extern let`). On a `trait` or an `impl` block it is rejected rather than accepted and ignored, because there is no declaration there for it to restrict.

The same two errors apply to reading an `extern let` from another file: a private one is private to its file, and an internal one to its package.

## Related module errors

- `` module `m` declares no `name` `` — the qualifier named a real module that has no such function. Check the module, not the spelling.
- `no module `m`` on a bare leaf — a qualifier is the **full import path**, so it is `std.string.trim(x)`, not `string.trim(x)`. The compiler names the module you likely meant.

See [modules and imports](/language/modules#visibility).
