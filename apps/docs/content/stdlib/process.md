---
title: Process and arguments
description: The std.process module — command-line arguments and subprocesses, and why cli_arg must never be declared produce.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-12"
tags: [standard-library, process, arguments, ffi]
related: [stdlib, stdlib/platform, stdlib/filesystem, cookbook/cli-arguments, language/ffi]
---

`import std.process`. Command-line arguments and subprocesses.

## Arguments

| Function | Returns |
|---|---|
| `argCount()` | how many arguments, including the program name at index 0 |
| `arg(index)` | the argument as a string the caller owns |
| `argAt(index)` | `Option<String>` — `None` when the index is out of range |
| `argBorrowed(index)` | the argument without copying |
| `args()` | `List<String>` of everything after the program name |

`argAt` exists because the raw runtime call returns `""` both for a missing argument and for an argument that is the empty string. `argAt` can tell them apart; `arg` cannot.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.process

fn main() -> Int {
    let name = arg(0)
    println(name)

    match (argAt(1)) {
        Option<String>.Some(first) => { println(first) }
        Option<String>.None => { println("no arguments given") }
    }
    return 0
}
```

## Why `arg` copies

The underlying `cli_arg` returns a pointer **into** `argv`, or the static empty string. It allocates nothing. Its FFI contract is `alias`, meaning the return is an existing value rather than a fresh allocation.

Declaring it `produce(free)` would not leak — it would hand `argv` to the deallocator, which is a different and much worse category of wrong. That is the mistake the six `produce(free)` declarations in [`std.fs`](/stdlib/filesystem) invite by habit, and it is why `arg` returns a copy: the obvious call is the safe one, and one small allocation on a path that runs once per program is not worth the hazard.

`argBorrowed` is the uncopied form. It is safe to read for as long as the process runs, and unsafe to `drop` or store in an owning container. Reach for it only if the copy is measurably in the way.

## Subprocesses

| Function | Returns |
|---|---|
| `runCommand(command)` | `Bool` — true when the command ran and exited successfully |
| `quoteArg(argument)` | the argument quoted for the platform's shell |

Note the inversion the wrapper hides: the runtime call returns 0 for success.

Use `quoteArg` on anything built from a path or from user input before it reaches `runCommand`. There is no argument-vector form of `runCommand` yet — it goes through the shell, so quoting is the caller's responsibility.

To write a command line that works on more than one platform, ask [`std.platform`](/stdlib/platform). `platform.isWindows()` is true for a program compiled for Windows, and a native program runs on the platform it was compiled for, so that answer names the shell `runCommand` will find.

## Still missing

Capturing a subprocess's stdout or stderr, its exit code as a number rather than a `Bool`, environment variable access, the current process id, and an argv-array spawn that does not involve a shell.
