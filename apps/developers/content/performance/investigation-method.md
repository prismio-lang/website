---
title: Performance investigation method
description: A repeatable path from benchmark regression through profiling, allocation evidence, LLVM IR, assembly, controlled candidates, and acceptance.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [performance, profiling, llvm]
related: [performance/benchmark-contract, llvm/runtime-ir-and-optimization, aif/layout-selection]
---

Start with a reproducible workload and a correctness checksum. Capture the compiler executable,
revision, `prismio --version`, target triple, LLVM bin directory, host hardware and power state,
OS, exact commands, sample count, and statistic. Run the unchanged binary against itself with the
same sequencing to establish an A/A noise floor.

Use `benchmarks/run.py --only <name>` for maintained comparisons. For a compiler-internal case,
reduce the source without removing the hot mechanism and preserve an output checksum. Do not begin
from a wall-clock anecdote produced by a debug compiler or a moving `.prismio/build/debug/prismio`
host.

## Decompose before changing architecture

Separate input construction from the hot operation where the workload permits. Count allocations
and bytes, identify runtime calls, and determine whether the cost belongs to representation,
allocation volume, algorithm, bounds checks, call opacity, linking, or cold compilation.

Inspect successive layers, stopping at the first one that differs from the intended mechanism:

1. Run `prismio aif <source> --manifest`, `--layout`, and `--why=<site>` for storage, affinity,
   layout, exclusions, and the minimal forcing witness.
2. Inspect unoptimized LLVM IR for allocations, releases, representation, call shape, and loop form.
3. Inspect optimized IR after `LLVMPassManagerBuilderPopulateModulePassManager` and the runtime-IR
   link step to see what LLVM actually removed or combined.
4. Disassemble the native object or executable and check remaining calls, branches, vector loops,
   spills, and memory traffic.
5. Use a sampling profiler and allocator tracing to learn dynamic frequency. Static call counts in
   IR do not establish runtime cost.

For compile-time regressions, enable the project build trace and separate manifest load, import
resolution, semantic analysis, AIF rounds, LLVM generation, optimization, object emission, and
linking. `benchmarks/run.py` records only whole-suite `compile_ns`; it is not a phase profiler.

## Compare one controlled candidate

Form a falsifiable hypothesis: for example, “this site is T3 because an opaque return contract adds
an escape edge,” not “AIF is slow.” Change one mechanism, preserve the algorithm and checksum, and
rerun interleaved samples. If testing a forced layout, use matching `--force-layout=<Type>:<hot>` on
the report and build so the inspected candidate is the emitted candidate.

Keep rejected results in `aif/evidence` or the relevant investigation record. Include the patch or
flag, raw artifact paths, confidence limits or noise comparison, and the layer that disproved the
hypothesis. A negative experiment prevents the same attractive idea from returning without new
evidence.

## Accepting a change

Accept only after the improvement survives multiple interleaved runs and the observed layer agrees
with the proposed mechanism. Add a correctness regression, a representation or artifact assertion,
the raw measured result, and a fallback when portability requires one. Run the complete suite and
fixed-point verification because an optimizer change can affect compiler self-reproduction even
when the benchmark passes.

Do not publish a projected ceiling as an expected gain.
The ordinary suite currently lacks unified per-site byte, lifetime, arena, copy, RC, cycle, cache,
and bandwidth telemetry; label those quantities unmeasured until instrumentation exists.
