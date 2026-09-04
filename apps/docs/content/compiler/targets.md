---
title: Compiler targets and platforms
description: Supported host platforms, LLVM target behavior, and experimental WebAssembly status for Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [compiler, targets, windows, macos, linux, wasm]
related: [start/installation, compiler/cli, roadmap]
---

The Prismio compiler and bootstrap pipeline are continuously exercised on:

- Windows
- macOS
- Linux

These are native host/build workflows: the configured LLVM/Clang toolchain lowers Prismio-generated LLVM IR to the host object format and links the platform runtime.

## What native support means

For the audited 0.1 project, native support means CI can set up the pinned toolchain, bootstrap compiler generations, run the compiler/test suite, and link representative programs on these operating systems.

It does not imply:

- a stable binary distribution/update channel;
- one long-term Prismio ABI;
- source compatibility with every system C library;
- availability of every foreign dependency;
- cross-compilation from every host to every target; or
- identical linker flags and executable suffixes.

The host LLVM/Clang toolchain performs native object generation and linking. Platform support means the compiler suite runs in CI; it does not yet guarantee a long-term binary ABI, stable distribution channel, cross-compilation SDK, or identical availability of every foreign library.

`Isize`, `Usize`, and pointer-shaped layout follow the target pointer width. Struct padding/alignment and foreign ABI details also depend on target/backend rules. Use exact-width integers for portable persisted or network data.

## LLVM requirement

LLVM 22.1.8 is the pinned backend line. A platform's default Clang may use another LLVM IR dialect/version and is not automatically interchangeable. The repository setup scripts identify the correct toolchain.

## WebAssembly

`--target wasm32` changes the LLVM module target and pointer width, and the runtime contains a WebAssembly branch. End-to-end packaging, browser/WASI integration, and a dedicated CI matrix are incomplete, so WebAssembly remains **Experimental**.

The flag proves a compiler target path exists; it does not by itself provide JavaScript glue, WASI imports, a web deployment bundle, browser DOM APIs, or parity with native runtime functions. Test the emitted module in the intended host environment and document its imports explicitly.

## Cross-compilation

Naming an LLVM target is only one component of cross-compilation. A complete supported toolchain also needs the correct runtime build, linker, system libraries or SDK, target ABI settings, packaging, and CI coverage.

Android, iOS, and polished cross-compilation toolchains are **Coming Soon**. LLVM's ability to name a target is not by itself a Prismio platform-support promise.

## Portability checklist

- Avoid target-sized values in stable file/network formats.
- Keep FFI declarations target-specific where headers differ.
- Do not assume struct or enum ABI stability across versions.
- Run generation and regression tests on every claimed native platform.
- Treat WebAssembly behavior and packaging as experimental.
- Record host, target, compiler, LLVM version, and link command in bug reports.
