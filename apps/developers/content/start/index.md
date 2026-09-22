---
title: Contributing to the Prismio compiler
description: The entry point for developers building, testing, debugging, and extending the self-hosted Prismio toolchain.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-16"
tags: [contributing, compiler, onboarding]
related: [start/repository-tour, start/development-setup, start/local-compiler-loop]
---

## What this portal is for

The [language guide](https://docs.prismio.org) tells you how to write Prismio programs. This portal is for the people changing the thing that runs them: the compiler, the runtime it links, the standard library, the UMS build system, and the tooling around them.

It answers three questions the language guide never has to: **why** the compiler accepts a program, **what** it generates for it, and **how** to change that behaviour without breaking something three stages later.

The compiler is **self-hosted** — written in Prismio, and built by an earlier build of itself. That one fact explains most of what is unusual about working on it, and most of the vocabulary below comes straight out of it.

## See the toolchain work

Four commands, in the order you would first run them. Each was run in a compiler checkout and pasted as printed; only the home directory in the paths is shortened to `~`.

Which compiler is answering:

```bash
prismio --version
```

```text
Using local toolchain: ~/prismio/.prismio/build/debug/prismio
prismio 0.1.0
llvm 23.1.1
compiler ~/prismio/.prismio/build/debug
stdlib ~/prismio/.prismio/build/stdlib
```

The first line appears only inside a checkout: the `prismio` on your `PATH` found a locally built compiler and handed the command to it. Read that line before trusting any result — [the local compiler loop](/start/local-compiler-loop) explains why it can point somewhere you did not expect.

A one-file program, built and run:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("hello from prismio")
    return 0
}
```

```bash
prismio run hello.psm
```

```text
Built hello
hello from prismio
```

The same program stopped before the native link, so you can read what the backend produced. An output path ending in `.ll` is what asks for that:

```bash
prismio build hello.psm -o hello.ll
```

```text
Wrote LLVM IR: hello.ll
```

The `main` function in `hello.ll`:

```llvm
define i32 @main(i32 %0, ptr %1) {
entry:
  store i32 %0, ptr @prismio_argc, align 4
  store ptr %1, ptr @prismio_argv, align 8
  call void @println__String(%prismio.str { ptr @.str.s0, i64 18 })
  ret i32 0
}
```

And one regression test, through the runner that tests a *copy* of the compiler rather than the one currently running:

```bash
python3 tools/run_suite.py --no-interactive -k neg_01_type_mismatch
```

```text
Running file fixtures on 8 worker(s)

  [  1/1] (100%) ok     0.54s  neg_01_type_mismatch

  file fixtures: 0.5s (1 passed, 0 failed)

============================================================
Filtered Test Results
============================================================
Passed: 1
Failed: 0
Total:  1

All selected tests passed!
suite: testing a copy of .prismio/build/debug/prismio
```

## What a failure looks like

Most of what you read while working on the compiler is its own diagnostics. `prismio check` runs every stage up to code generation, and prints nothing at all when the program is valid:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count: Int = "three"
    return count
}
```

```bash
prismio check broken.psm
```

```text
error[P4001]: initializer for `count`: expected Int, found String
 --> broken.psm:2:22
  |
2 |     let count: Int = "three"
  |                      ^^^^^^^
error: aborting due to 1 previous error
```

The exit status is 1. `P4001` is a stable code: search `src/` for it to find the rule that fired, and `tests/neg_*.psm` to find the fixture that pins the behaviour. [Add a diagnostic](/cookbook/add-a-diagnostic) covers the other direction.

## Words this portal assumes

Every section uses these. Deeper pages expand their own acronyms again, because readers arrive from search rather than from here.

| Term | Meaning |
| --- | --- |
| **Generation** | One build of the compiler. `build/gen1` is built by the seed, `gen2` by `gen1`, and so on. |
| **Seed** | Committed, target-neutral LLVM IR under `bootstrap/`. It builds the first generation without needing an existing Prismio compiler, which is what breaks the self-hosting cycle. |
| **Project host** | The compiler at `.prismio/build/debug/prismio`, which `prismio build` in the checkout replaces. It moves every time you build, so evidence names a generation instead. |
| **Fixed point** | Two successive generations built from the same source produce the same output. It is how a self-hosted compiler checks that it still compiles itself correctly. |
| **Sema** | Semantic analysis: name resolution, types, overloads, generics, traits, and ownership. It runs after parsing and before anything is generated. |
| **AIF** | The Adaptive Inference Framework — the pass that decides where each allocation lives: stack, arena, heap, or reference counted. See [the AIF overview](/aif/overview). |
| **IR** | LLVM intermediate representation, what the backend emits before native code. An implementation artifact, not Prismio syntax. |
| **UMS** | The Unified Manifest System — Prismio's build system, driven by a `build.ums` file. See [the UMS overview](/tooling/ums-overview). |
| **PLIB** | The precompiled form of a standard module, such as `io.plib`: its interface plus LLVM bitcode, so a program never re-parses `std/`. See [library artifacts](/runtime/library-artifacts). |
| **Runtime** | The C code every Prismio program links, under `runtime/`. See [the runtime overview](/runtime/overview). |

## Read in this order

1. [Tour the repository](/start/repository-tour) to learn which directory owns each decision.
2. [Prepare a development environment](/start/development-setup) with the pinned LLVM line.
3. [Learn the local compiler loop](/start/local-compiler-loop), including host promotion.
4. [Trace a first compiler change](/start/first-compiler-change) across the pipeline.
5. Use the compiler, AIF, LLVM, runtime, UMS, testing, and performance sections as reference, starting from [the compiler overview](/compiler/overview).

## What counts as evidence

The current self-hosted source and regression suite are the executable authority. Architecture documents explain intent; AIF evidence records explain measured decisions; generated LLVM IR and native assembly explain what the backend actually emitted. When those layers disagree, document the disagreement and add the smallest test that preserves the corrected behaviour.

Every implementation claim in this portal should name its owning source or test. Performance claims must additionally identify the result artifact, host, compiler flags, sample count, and statistic being reported.

## How to read an implementation page

Pages open with the problem and a command, and keep the source map for last, under a heading that says it is for people changing the code. If you already know the subsystem, skip straight there.

Paths are relative to the compiler checkout. Backticked function names are current source symbols, not public API promises. The internals section should tell you four things: where a behaviour enters the compiler, which representation carries it, where the next stage consumes it, and which test fails if the contract breaks. Use the source link as the starting point and follow the actual call graph; these pages intentionally do not duplicate entire modules.

The status in front matter has a precise meaning. `implemented` means an audited end-to-end path exists. `experimental` means that path exists but its policy or representation is expected to move. `draft` describes a working document or proposal and must not be read as accepted compiler surface.

## Before opening a change

Confirm the selected compiler with `prismio --version`, reduce the behaviour to one source file, and find the nearest positive and negative tests. Record generated artifacts before editing when the change affects AIF, LLVM, runtime layout, diagnostics, or build commands. That baseline is what separates an intended change from collateral movement.

Use a named compiler generation for evidence. The project host is designed to move during development; it is convenient, but an unqualified "current compiler" is not reproducible.

## Boundaries

Prismio is pre-1.0. Source syntax, internal representations, report schemas, and runtime ABI may change. "Implemented" means present in the audited compiler, not permanently stable. Experimental work must be labelled, and an unsupported capability must not be documented as a scheduled feature unless the project has made that commitment elsewhere.
