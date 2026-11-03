---
title: Platform blocks
description: linux { }, macos { } and windows { } — code that exists only when the target operating system is the one named.
status: experimental
version: "0.2.0"
lastUpdated: "2026-11-03"
tags: [language, platform, conditional, syscall]
related: [stdlib/platform, stdlib/syscall, guides/freestanding, language/low-level]
---

A platform block is code for one operating system:

```prismio
import std.syscall

linux {
    let pid = linux.syscall.getpid()
}
macos {
    let pid = macos.syscall.getpid()
}
windows {
    // Win32 through `extern fn`
}
```

The target is decided while the file is read, from the same target triple [`platform.current`](/stdlib/platform) answers. A block for another system is **parsed and dropped**: a syntax error in it is an error everywhere, but nothing in it is type-checked, so it may name functions that only exist on its own system.

## In a function, and around declarations

Inside a function a block is an ordinary scope, as if it were `if (true) { ... }` for the matching system and absent for the others: a `let` inside it ends with it.

At the top of a file a block puts its declarations in the module, and the braces are not a scope:

```prismio
import std.io

linux {
    fn separator() -> String { return "/" }
}
windows {
    fn separator() -> String { return "\\" }
}
```

Blocks nest. `linux { macos { ... } }` is never true, so what is inside is never compiled anywhere.

## Contextual words

`linux`, `macos` and `windows` are not reserved. A word begins a block only at the start of a statement or declaration and only when `{` follows, so a variable called `linux` keeps compiling.

## What a block is not

It decides by operating system only. For the architecture or the environment use [`platform.architecture`](/stdlib/platform), which is a compile-time constant and so costs nothing, but whose branches are all still checked. A platform block removes code before it is checked; `if (platform.isLinux)` does not.
