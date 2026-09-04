---
title: Private or internal function
description: Fix Prismio calls that reach a private or internal function from outside the file or package that declares it.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-30"
tags: [error, visibility, modules, private, internal]
related: [language/modules, language/methods, specification/name-resolution]
---

## Meaning

A declaration exists and matches the call, but is not visible where the call was written.

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

What *does* fail inside one file is a modifier somewhere it is not accepted:

<!-- prismio-check: fail -->
```prismio
private struct Hidden {
    x: Int
}

fn main() -> Int {
    return 0
}
```

```text
error: `private` is only accepted on a function in v0.1
```

## How to fix it

Pick the level that describes the intent rather than the one that silences the error:

| Situation | Level |
|---|---|
| a helper nothing else should call | `private` |
| a helper the rest of the package shares | `internal` |
| part of the module's interface | no modifier (public) |

A modifier is accepted only on a function — `fn`, `extern fn`, or a method inside an `impl` block. On a type, an enum, or a global it is rejected rather than accepted and ignored, because the check runs during overload resolution and accepting it elsewhere would promise a guarantee the compiler does not enforce.

## Related module errors

- `` module `m` declares no `name` `` — the qualifier named a real module that has no such function. Check the module, not the spelling.
- `no module `m`` on a bare leaf — a qualifier is the **full import path**, so it is `std.string.strTrim(x)`, not `string.strTrim(x)`. The compiler names the module you likely meant.

See [modules and imports](/language/modules#visibility).
