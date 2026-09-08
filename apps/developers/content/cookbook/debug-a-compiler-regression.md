---
title: Debug a compiler or AIF regression
description: Isolate Prismio frontend failures, semantic changes, miscompiles, ownership bugs, allocation decisions, and native build regressions.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [cookbook, debugging, aif]
related: [tooling/debugging-targets-and-build-tracing, performance/investigation-method, testing/regression-suite]
---

Reduce the failure to the smallest source that preserves it, then identify the first pipeline stage
whose output differs.

Record the exact compiler path and run `--version` before touching source. Reproduce with object
caching disabled only after a default run; keep both results. A project failure should also be
reduced to a direct single-file command when possible, which separates UMS planning from compiler
behavior.

## Classification

- If `check` fails unexpectedly, inspect tokens, AST, imports, symbols, and sema.
- If `check` succeeds but IR emission fails, inspect resolved types and the LLVM bridge request.
- If LLVM verifies but execution is wrong, compare unoptimized IR, optimized IR, and final assembly.
- If values corrupt around moves or views, inspect ownership state, return provenance, and drop edges.
- If storage differs, run `prismio aif`, `--why`, and `--manifest`.
- If native linking fails, inspect target, runtime discovery, UMS inputs, and the generated command.

Disable curated runtime merging to distinguish program lowering from cross-module optimization.
Use build tracing for cold-build regressions. Run the verifier, but pair its ledger with value
assertions and sanitizers.

## Stage probes

Use these probes in order:

| Probe | What it excludes |
| --- | --- |
| `prismio check <file>` | Native codegen, object emission, runtime link |
| `prismio dump-ast <file>` | Shows post-sema nodes consumed by AIF/oracle |
| `prismio aif <file> --manifest` | Shows stable site decisions and exclusions |
| `prismio aif <file> --why=<site>` | Shows the witness forcing one decision |
| `prismio build <file> -o out.ll` | Exposes generated LLVM IR |
| `PRISMIO_INLINE_RUNTIME=0 ...` | Separates program IR from curated runtime merging |
| `prismio run <file> --jit` | Compares ORC execution with native object/link path |

`PRISMIO_OBJ_CACHE_TRACE=1` reports cache behavior; `PRISMIO_OBJ_CACHE=0` bypasses it.
`PRISMIO_BUILD_TRACE=1` reports build phases. `--verify` compiles verifier hooks into the runtime;
sanitizer scripts cover native mistakes the allocation ledger does not see.

If JIT and native disagree, inspect `ir_jit_run_main()` versus `compiler_build_executable()` and the
target/runtime link inputs. If `check` and `dump-ast` disagree, the dump serializer or analysis-only
driver path is suspect. If compiler and oracle summaries disagree, run
`tools/aif_differential.py` on only the reduced source and compare the named counter.

Once isolated, add the failing program before changing implementation. Preserve an artifact
assertion when the bug depends on IR shape, symbol presence, layout, or generated metadata. Run the
full suite and fixed-point checks after the focused case passes.

For self-hosting regressions, build `gen1` and `gen2` from the same candidate and compare normalized
IR through the release gate. A generation difference that stabilizes can be an intentional compiler
change; a difference that keeps moving is a bootstrap defect. Do not refresh the committed seed to
hide either case.
