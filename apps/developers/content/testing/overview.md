---
title: Testing the compiler
description: The Prismio validation layers from focused language regressions through AIF differentials, fixed points, packaging, and platforms.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [testing, compiler, contributing]
related: [testing/regression-suite, testing/fixed-point-verification, testing/aif-differential]
---

No single test proves a compiler change. Choose layers that match the risk.

- Positive programs prove accepted source produces the expected value.
- Negative programs prove invalid source is rejected with the intended diagnostic.
- IR and symbol checks prove a lowering or optimization shape.
- Runtime verification checks selected allocation and release behavior.
- The AIF differential compares compiler output with an independent oracle.
- Generation and fixed-point checks protect self-hosting determinism.
- Packaging tests protect installed layouts and embedded inputs.
- Platform CI protects native assumptions.
- Benchmarks measure performance after correctness checks pass.

Run focused tests during development, then the complete suite with an explicitly selected compiler:

```bash
PRISMIO=$PWD/.prismio/build/debug/prismio python3 tests/test_runner.py
```

Never lower an expected total to make a partial run appear green. Record skipped platform or
toolchain coverage as missing evidence.

Compiler documentation has its own checks. Frontmatter, slugs, and related links are audited, while
tagged Prismio snippets can be compiled during the documentation build.

## Test runner architecture

`tests/test_runner.py` selects the compiler through `--compiler`, then `PRISMIO`, then PATH.
`find_prismio_exe` resolves it to an absolute path because many fixtures execute from private
working directories. `parse_runner_args` supports exact/substring fixture filters,
`select_test_files` resolves them, and `test_jobs` caps parallelism at eight unless
`PRISMIO_TEST_JOBS` overrides it.

`run_parallel` executes isolated file fixtures concurrently and reports through
`LiveProgress`. Each positive fixture is handled by `run_test`:
`compile_prismio_file` builds a unique neighboring artifact, `run_program` captures the result,
and cleanup removes generated files. Negative fixtures use `expected_errors` to read declared
expectations and `run_negative_test` to require compilation failure plus matching diagnostics.

The same runner then executes subsystem gates including CLI, corpus, UMS, check mode, punned-slot
invariants, AIF reports/concurrency/regions/layout, object cache, bootstrap, target/debug metadata,
JIT, runtime-library separation, verification, optimization guards, and curated runtime IR.

## Choosing the right proof

| Change | Minimum focused evidence |
| --- | --- |
| Lexer/parser | AST shape, accepted fixture, malformed/recovery fixture, span check |
| Types/sema | positive fixture, exact negative rule, overload/generic interaction |
| Ownership/AIF | value assertion, manifest/tier assertion, verifier ledger, differential when model changes |
| LLVM lowering | IR shape or symbol assertion, verifier, native result |
| Runtime | direct C or source fixture, verifier/sanitizer, supported platforms |
| UMS/build | parser/lowering diagnostic, plan/command assertion, packaged execution |
| Optimization | correctness fixture, before/after IR or assembly, A/A timing floor and benchmark |

The full suite is an integration gate, not a substitute for a discriminating focused case. A new
test should fail on the previous implementation for the intended reason, pass on the change, and
avoid depending on unrelated output order or temporary paths.
