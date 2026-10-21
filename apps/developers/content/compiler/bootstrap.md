---
title: Bootstrapping and fixed points
description: Build Prismio compiler generations from the target-neutral seed or a trusted previous compiler.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, bootstrap, self-hosting, reproducibility]
related: [start/development-setup, start/local-compiler-loop, testing/fixed-point-verification]
---

Self-hosting creates a cycle: Prismio source needs a Prismio compiler. The project breaks it with target-neutral LLVM IR for a seed compiler. The seed is `bootstrap/seed.ll`, a tracked file: there is no release asset, no SHA-256 pin and no downloader, and `--seed` reads the file. A refreshed seed is about 20 MB, so one is never staged or committed until the maintainer says so (`.githooks/pre-commit` refuses it; `PRISMIO_ALLOW_SEED_COMMIT=1` overrides, `git config core.hooksPath .githooks` enables the hook).

The seed is a trust anchor, not the preferred everyday implementation. Its job is to reconstruct a current compiler whose later generations can be checked against one another.

## Generation workflow

```bash
python3 tools/bootstrap.py --seed --out build/gen0
python3 tools/bootstrap.py --compiler build/gen0 --out build/gen1
python3 tools/bootstrap.py --compiler build/gen1 --out build/gen2 --promote
```

On a machine that already has `prismio`, `prismio bootstrap` runs the three steps (`prismio bootstrap --promote` adds the last flag), and `prismio seed` cuts a new `bootstrap/seed.ll` from `build/gen2` and checks that a compiler built from only that file works. A fresh clone has no `prismio`, so it starts with the first command.

Conceptually:

- the committed seed produces `gen0` for the host;
- `gen0` compiles the current Prismio compiler source into `gen1`;
- `gen1` compiles the same source into `gen2`; and
- fixed-point checks compare the relevant `gen1` and `gen2` outputs.

Use explicit paths for every compiler generation so an unrelated `prismio` on `PATH` cannot enter the chain.

`tools/bootstrap.py` is one script for every platform (it replaces the `.sh`/`.ps1` pair). Each generation compiles `src/main.psm`, lowers the resulting IR with Clang, rebuilds runtime/backend C sources from the current tree, and links LLVM C API support; the Windows differences (the `.exe` suffix, the export table `run --jit` needs, the 16 MiB stack, `LLVM-C.dll` beside the compiler) live in the same file. Use it instead of manually reproducing its link command when validating self-hosting.

In seed mode it lowers `bootstrap/seed.ll` (or the path after `--seed`); in compiler mode it asks the named compiler to `build src/main.psm` to LLVM IR and links that itself. Either way it compiles the current C sources with real LLVM headers, in parallel, through content-derived cache keys, and installs a cache entry by rename. `PRISMIO_LLVM_DIR` overrides the toolchain recorded by `tools/setup_llvm.py`; `PRISMIO_OBJ_CACHE=0` provides a cache-bypass diagnostic path; `--keep` keeps the work directory; `--print-cache-key <source.c>` prints a source's key and does nothing else (a test uses it).

### Promoting a generation

`--promote` makes the last generation this checkout's local toolchain. It runs that generation's own `build --release` (which installs `.prismio/build/release/prismio`, the project host, with the `lib/` and `stdlib/` built beside it and the `prismio.trusted` stamp) and then `build` (the debug compiler that `prismio build`, `suite` and `verify` run). It does not copy the binary: a copied host has no trust stamp and is refused. Promote after a change the old host cannot build, such as a `src/` that uses new syntax.

### Cutting a seed

`tools/refresh_seed.py --compiler build/gen2` (or `prismio seed`) builds `src/main.psm` twice with `PRISMIO_SEED_IR=1`, refuses a compiler whose two outputs differ, strips the target triple and data layout so clang targets whatever host it runs on, and writes `bootstrap/seed.ll`. It is left uncommitted. Verify with `python3 tools/bootstrap.py --seed --out build/seedcheck`: the compiler that comes out must emit the same IR as `gen2`.

## Why the runtime and backend C sources come from the working tree

The compiler is not only Prismio code. Its runtime and its LLVM backend bridge are C, and a change to either has to reach the next generation. This repository's `build.ums` lists those files as `native` sources of its `prismio` target, so `prismio build` compiles them from the working tree on every build (through a cache keyed by their content) and links them into the new compiler. Nothing about them is built into the compiler doing the building. An older generation, the installed compiler and the project's own host all produce a compiler with the current C, and `tools/bootstrap.py` does the same when no compiler exists yet.

Two things are still true. The frontend source must be parseable by the compiler doing the build, which is what the committed seed has to stay able to do. (When `src/` first uses syntax the committed seed predates, as visibility markers on structs did in 0.2.0, a new host is built with a compiler that reads it, `--promote` installs it, and a new seed is cut and committed before the gate can pass.) And the programs a compiler builds link the runtime library installed beside it, so a runtime edit needs that library re-emitted: a compiler with a source tree beside it refuses to build with a library made from different runtime sources (`P1004`) rather than link a stale one.

## Fixed-point meaning

A fixed-point check compares successive compiler outputs. It detects a compiler whose behavior depends on the generation used to build it. CI also rejects duplicate symbols in generated IR and verifies that the seed contains no host-specific target triple.

`tools/release_gate.py` makes the comparison concrete. `check_generations()` bootstraps two
successors from the release candidate, `check_fixpoint()` emits their compiler IR and compares the
canonical result, `check_rc_reproduces()` checks that the release candidate reproduces generation
one, and `check_seed()` confirms the compiler command can still reconstruct a usable seed-derived
compiler. The same gate then runs the regression suite, AIF differential, corpus, verifier sweep,
JIT, cross-target, and packaging checks.

A fixed point does not prove the compiler implements the intended language; two generations can agree on the same bug. Positive/negative regression tests and specification conformance remain necessary. The fixed point specifically establishes generation stability for the checked artifacts.

Native executable bytes can contain platform linker metadata, so the repository workflow compares the appropriate canonical outputs rather than assuming every final binary is bit-identical across hosts.

## Diagnose divergence

When generations disagree:

1. rerun from a clean set of explicitly named build outputs;
2. confirm Prismio and LLVM versions;
3. emit compiler LLVM IR from both relevant generations;
4. find the earliest differing declaration/function;
5. reduce it to a small source program;
6. add a regression test; and
7. determine whether the older or newer behavior matches the intended specification.

Do not update the trusted seed merely to make a divergence disappear. Seed updates should be reviewable consequences of intentional compiler/toolchain changes.

## Platform neutrality

Seed IR must not embed a host target triple or other machine-specific assumptions. Host LLVM/Clang supplies native lowering when the seed is instantiated. CI checks Windows, macOS, and Linux workflows so portability failures surface before a seed is trusted.

## Reproducibility record

For a release, record source revision, seed identity, Prismio version, LLVM version, host/target, bootstrap commands, regression result, AIF oracle result, and fixed-point comparison. This information lets another maintainer reproduce the trust chain instead of relying on an unlabeled compiler binary.

Record how each generation was built, with `prismio build` or with the bootstrap scripts. Both compile the runtime and backend C from the working tree, so the record is what lets a reader tell them apart.
