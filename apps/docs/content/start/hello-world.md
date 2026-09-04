---
title: Hello, Prismio
description: Compile and run a minimal Prismio 0.1 program.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-12"
tags: [getting-started, hello-world, run]
related: [start/build-and-run, language/functions, stdlib/io]
---

A Prismio executable starts in a top-level function named `main`. Function bodies are blocks, calls use parentheses, and statements do not use semicolons.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("Hello, Prismio!")
    return 0
}
```

Save the exact program as `hello.psm`. The `.psm` extension identifies Prismio source.

The four lines inside the example establish several core rules:

- `fn main() -> Int` declares the process entry point and an integer exit status.
- `{` and `}` delimit the function body.
- `println` selects the `String` overload from the auto-loaded source standard library.
- `return 0` reports successful completion to the operating system.

Save the file as `hello.psm`, then run it directly:

```bash
prismio run hello.psm
```

Expected output:

```text
Hello, Prismio!
```

`run` compiles a temporary native program and executes it. A compiler diagnostic stops the process before execution.

Or build a native executable:

```bash
prismio build hello.psm -o hello
./hello
```

On Windows, choose an `.exe` output name and run it from PowerShell:

```powershell
prismio build hello.psm -o hello.exe
./hello.exe
```

The input file is also the import root. When this program later imports `model.user`, Prismio resolves it beneath the directory containing `hello.psm`.

`println` is declared in the shipped `std/io.psm` source module. The compiler loads it automatically before checking the program.

## Make a small change

Print an integer on a second line:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let version: Int = 1
    println("Prismio language version")
    println(version)
    return 0
}
```

`let` creates an immutable binding and the annotation fixes its type as `Int`. Exact overload resolution selects `println(value: Int)`.

## Common first errors

- Adding semicolons produces unsupported punctuation in statement positions.
- Writing top-level calls is invalid; executable statements belong inside a function.
- Omitting `return` from an `Int`-returning path fails definite-return analysis.
- Integer output has exact overloads for every built-in signed and unsigned width; arithmetic and assignment still do not widen integers implicitly.
- Copying a command-line signature from another language may fail because 0.1 documents `main()` without argument parameters.

Continue with the [first complete program](/tutorials/first-program) to add a helper function, mutable state, and a half-open range loop.
