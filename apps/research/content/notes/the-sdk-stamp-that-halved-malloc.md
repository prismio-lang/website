---
title: A 2x slowdown with identical machine code
description: A repeatable 1.5x to 2.1x slowdown on macOS had identical IR and disassembly. The cause was the SDK version recorded in the executable.
abstract: Three Prismio benchmarks ran 1.5 to 2.1 times slower when built by a compiler from a source checkout than by a packaged compiler, although the saved IR for their hot functions and the disassembly were identical. The difference was a single field in the Mach-O executable, the SDK version recorded in its build-version load command. macOS selects behaviour from that field, and a binary claiming an old SDK gets the older, slower malloc. Patching only that field restored full speed, which proved the cause. The link now passes the real SDK path, and the check is a one-line command worth running whenever a macOS timing moves without the IR moving.
authors:
  - name: Saksham Jaiswal
    url: https://saksham1319.vercel.app
status: published
published: 2026-10-01
updated: 2026-10-22
version: "0.1.0"
tags: [benchmarks, macos, malloc, linker, methodology]
related: [papers/telling-a-difference-from-noise]
findings:
  - "tree_traversal read 1.8x, manual_alloc_churn 2.1x and s_expression_parse 1.5x slower with identical machine code."
  - "The only difference was the SDK version recorded in the executable: sdk 11.0 against the installed 27.0."
  - "Changing only that field in the slow binary restored full speed."
evidence:
  - label: "runtime/build_driver.c: link_driver_command"
    url: https://github.com/prismio-lang/prismio/blob/main/runtime/build_driver.c
  - label: "tools/package.py, the packaged compiler to compare against"
    url: https://github.com/prismio-lang/prismio/blob/main/tools/package.py
---

A large, repeatable difference with identical machine code is not a timing mode and not a code change. The usual instruments say nothing is wrong: the saved IR is the same, and so is the disassembly of the hot functions.

## What differed

Every Mach-O executable records the SDK it was linked against, in `LC_BUILD_VERSION`; it is the `sdk` line of `otool -l`. macOS keys behaviour on it, and a binary that claims an old SDK gets the older, slower `malloc`.

A compiler built from a checkout linked with the pinned LLVM `clang`, which was given no sysroot, found no SDK to read, and stamped the minimum deployment version instead (`sdk 11.0`). Apple's `cc` stamps the real one (`sdk 27.0` on the measuring host). The three workloads that moved were `tree_traversal`, `manual_alloc_churn` and `s_expression_parse`.

## How it was proved

Patching only that field in the slow binary restored full speed:

```bash
vtool -set-build-version macos 11.0 27.0 -replace -output patched slow-binary
```

The fix passes `-isysroot` from `xcrun --show-sdk-path` at link time, with `SDKROOT` taking precedence, for host builds only.

## Checking for it

Before believing a macOS timing that moved without the IR moving, read the field:

```bash
otool -l path/to/binary | grep -A4 LC_BUILD_VERSION
```

The `sdk` value must be the installed SDK's version.

## Why an earlier check missed it

An earlier A/B had shown only noise because it compared two compilers built from the same checkout, so the shared defect cancelled. When a result looks too good or too bad, compare against a packaged compiler. The wider rule for deciding whether a difference is real is in [Telling a real benchmark difference from noise](/papers/telling-a-difference-from-noise).
