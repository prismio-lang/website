---
title: Local compiler development loop
description: Build and test Prismio through the UMS project host without losing a working compiler generation.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [workflow, self-hosting, ums]
related: [tooling/compiler-host-and-promotion, testing/fixed-point-verification, compiler/bootstrap]
---

The repository is a UMS project whose `build.ums` names `.prismio/build/debug/prismio` as its
project-local compiler host. The installed parent reads the bootstrap-safe host block through
`umsProjectHost()`; when the host is absent it performs the build itself, and when it exists
`dispatchToUmsHost()` forwards the original argument vector to that binary.

## Ordinary loop

```bash
prismio check src/main.psm
prismio build
PRISMIO=$PWD/.prismio/build/debug/prismio python3 tests/test_runner.py
```

`buildUmsProject()` loads the workspace, selects the profile, creates the build plan, and notices
when the output target is the running host. The new executable is linked at a staged path. Only
after a successful build does the parent replace the project host. The running compiler never
opens its own executable for output, and a parse, sema, LLVM, or link failure leaves the previous
host usable.

After the first promotion, repeat `prismio build` to exercise forwarding through the new host. Use
`prismio --version` and the printed `compiler` path to verify which generation received a direct
single-file command; shell `PATH` alone is not sufficient evidence.

## Focused tests while editing

The Python runner accepts names without compiling the entire suite:

```bash
PRISMIO=$PWD/.prismio/build/debug/prismio \
  python3 tests/test_runner.py test_92_field_view_provenance
```

Set `PRISMIO_TEST_JOBS=1` for a deterministic log when failures interleave. Use
`python3 tests/test_runner.py --list` to discover registered names. The runner resolves `PRISMIO`
before `PATH` and prints the chosen executable.

## Use named generations for reproducibility

Bootstrap, seed refresh, and fixed-point work should use `build/genN` outputs rather than the
moving debug host. `tools/bootstrap.sh --compiler build/gen1 --out build/gen2` gives each generation
an immutable path; `tools/release_gate.py --rc build/gen2` independently rebuilds successors and
compares their IR. Record the exact compiler path in bug reports and benchmark results.

## Trace or bypass caches

`PRISMIO_BUILD_TRACE=1` prints build phases. `PRISMIO_OBJ_CACHE_TRACE=1` exposes cache hits and
misses; `PRISMIO_OBJ_CACHE=0` bypasses the object cache. `PRISMIO_INLINE_RUNTIME=0` disables curated
runtime-IR merging for isolation. These are diagnostic switches, not alternative supported build
semantics. Reproduce once with defaults before attributing a bug to the bypassed component.

## Before committing

Run the relevant focused test while iterating, then the full test suite. Changes to code generation,
the runtime, bootstrapping, or embedded sources also require generation agreement and packaging
checks. Changes to diagnostics should validate both human and JSON forms. Changes to AIF should
exercise reports, manifests, the independent oracle, and runtime verification where applicable.
