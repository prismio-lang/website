---
title: Development environment
description: Prepare a Prismio compiler checkout with LLVM 22, platform tools, Python, and a known compiler generation.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [setup, llvm, toolchain]
related: [compiler/bootstrap, start/local-compiler-loop, tooling/debugging-targets-and-build-tracing]
---

Compiler development requires LLVM 22, a C toolchain, Python for the test harness, and either an
installed Prismio compiler or the committed bootstrap seed. Run setup commands from the compiler
repository root: the bootstrap scripts resolve `src`, `runtime`, `bootstrap`, and
`third_party/llvm-paths.json` relative to that checkout.

## Required tools

- LLVM and Clang 22.x, including `llc` and the LLVM C development libraries.
- A platform linker and SDK appropriate for the host.
- Python 3.8 or newer for tests, packaging, and support scripts.
- Git and ordinary shell tooling.

`tools/setup_llvm.py` is the authoritative LLVM locator. `--check` reports without changing the
checkout; `--llvm-dir DIR` adopts an existing installation; `--force` downloads even if discovery
succeeds; and `--version` selects the exact supported 22.x package. A successful setup validates
the headers and link library and records their paths for `bootstrap.sh` and `bootstrap.ps1`.

```bash
python3 tools/setup_llvm.py --check
python3 tools/setup_llvm.py
```

Do not assume that a system `clang` and an arbitrary `llc` form a supported pair. The backend is
compiled with `PRISMIO_LLVM_REAL_HEADERS`; the loaded C API and the tools consuming emitted IR must
agree on the LLVM major.

## Choose the compiler explicitly

The test runner honors `PRISMIO` before `PATH`. Point it at the generation you intend to test:

```bash
PRISMIO=$PWD/.prismio/build/debug/prismio python3 tests/test_runner.py
```

If no installed compiler is available, build the first generation from the committed IR seed, then
build two self-hosted generations:

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
```

Windows uses `tools/bootstrap.ps1` with `-Seed` or `-Compiler` and `-Out`. The shell and PowerShell
scripts compile the LLVM bridge and runtime support, consume the same source inventory, use a
content-keyed object cache, link into a temporary path, and install the completed compiler
atomically. `PRISMIO_LLVM_DIR` overrides recorded LLVM discovery. `PRISMIO_OBJ_CACHE=0` disables
the cache when investigating it.

For fixed-point work, use a named generation such as `build/gen2`. For the normal repository loop,
use `prismio build`; `build.ums` routes project commands to `.prismio/build/debug/prismio` once the
local host exists.

## Validate the setup

```bash
build/gen2 --version
PRISMIO=$PWD/build/gen2 python3 tests/test_runner.py --list
PRISMIO=$PWD/build/gen2 python3 tests/test_runner.py test_92_field_view_provenance
```

`--version` prints Prismio, loaded LLVM, compiler executable, and the resolved standard-library
directory. Treat an unexpected compiler or `(none found)` stdlib as a setup error before debugging
the language change.

## Platform notes

On macOS, Apple Clang supplies the SDK-aware linker while Homebrew LLVM commonly supplies `llc`
and libraries. On Linux, install the matching LLVM development packages. On Windows, use the
repository PowerShell bootstrap and packaging paths rather than translating shell commands by hand.

On macOS, debug builds can produce a `.dSYM`; on Linux, use the matching Clang/LLD development
packages; on Windows, keep MSVC target and SDK selection consistent. Cross-target compilation also
needs the target SDK via `--sysroot` and a matching `runtime-<triple>` package. LLVM target support
alone does not provide a platform runtime.
