---
title: The freestanding benchmark suite
description: How benchmarks/run.py loads the bare-metal suite, the instruction-counting method and its calibration, the harness contract, the results.json schema, how to add a workload, and the target requirements the three arms share.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-08"
tags: [benchmarks, freestanding, qemu, harness, methodology]
related: [performance/benchmark-contract, performance/running-adding-and-reading-results, performance/telling-a-difference-from-noise, runtime/platform-and-packaging]
---

A kernel author's question is what a compiler produces when there is nothing to lean on, and a timing on an operating system cannot answer it. This suite compares Prismio with C and Rust on bare-metal AArch64 under QEMU: no C library, no allocator, no startup files. It lives in `benchmarks/freestanding/`, beside `benchmarks/hosted/`, which is the older suite, moved without change. The two share one runner (`benchmarks/run.py`), one results file (`benchmarks/results/results.json`) and one report with a tab each. The hosted suite's contract, noise rule and workflow are in [Cross-language benchmark contract](/performance/benchmark-contract) and [Telling a real difference from noise](/performance/telling-a-difference-from-noise). This page is what differs.

## Why the unit is instructions

A time on bare metal under an emulator is not a measurement of anything a user has. So the suite counts **guest instructions**. QEMU runs with `-icount shift=0,sleep=off`, which makes the guest's virtual clock advance one nanosecond per instruction executed. On the `virt` board the generic timer counts that clock at 62.5 MHz, so one `CNTVCT_EL0` tick is exactly 16 instructions (`TICK_INSTRUCTIONS` in `suite.py`). The harness reads the counter before and after each workload and the difference, times 16, is the workload's instruction count, accurate to the nearest tick.

The factor is calibrated, not derived: a loop of exactly 10,000,000 instructions reads 625,000 ticks on every run. The count is the same for the same image on every run on every machine, so there is no median, no spread and no noise model. `run()` boots every arm `min(--runs, 3)` times anyway and records `deterministic: false` with a warning if two boots of one image disagree, which would mean the premise had failed.

A verdict is therefore a fixed rule. `verdict()` calls a ratio within `PARITY = 0.02` of 1 parity, because code placement alone moves a count by a fraction of a percent, and anything else a win or a loss. It records `outcome`, `ratio` and `tolerance`, in the same shape as the hosted verdict minus the noise fields.

What the number is not: a time. It models no cache, pipeline or branch predictor. A workload dominated by memory stalls (`pointer_chase`, `mem_copy`) costs more on silicon than its count says, and a count cannot show what a vectorised loop would gain. It also counts every instruction equally, including a division that takes many cycles.

## How `run.py` reaches it

`--suite hosted|freestanding|all` (default `all`) selects. For the freestanding suite `run_freestanding()` calls `load_freestanding_suite()`, which loads `benchmarks/freestanding/suite.py` by path with `importlib.util.spec_from_file_location`: the directory is a suite and not a package, and its name should not shadow anything importable. The module is cached in `sys.modules` so there is exactly one `Unavailable` class for `main()` to catch.

`run.py` hands the suite what it already has instead of having it import `run.py`: a `FreestandingUI` carrying the progress bar, colours and formatters, the environment description, `run_timed` for building with CPU time beside wall time, and `portable_command` for repository-relative commands. The suite's entry point is

```python
run(args, compiler, llvm_bin, environment, ui, run_timed, portable_command, only=None)
```

and `step_count(args)` tells the progress bar how long the run is.

**Prerequisites.** `Tools` looks for `clang` with the AArch64 target, a linker that runs, `qemu-system-aarch64` and `rustc` with the `rust-src` component, and `check_prerequisites()` raises `Unavailable` naming each one that is missing. With `--suite all` `main()` prints `skipping the freestanding suite: <reason>` and writes the hosted report alone; with `--suite freestanding` it exits with the reason. Passing `--only` with a name found in neither catalog is refused before anything builds. The linker is `ld.lld` found on `PATH`, under `--llvm-bin`, in Homebrew's `lld*` or in `third_party/llvm`, and **it has to start**: the one in LLVM's Linux release tarball is built against another distribution's ICU and fails on Ubuntu 26.04, so on an AArch64 Linux host `Tools` falls back to `-fuse-ld=bfd`.

## The arms

Held equal for the three arms, because a difference in any of them would change what the instruction count means:

| | Setting | Why |
| --- | --- | --- |
| Target | `aarch64-unknown-none-elf`; Rust `aarch64-unknown-none-softfloat`; CPU `generic` | one machine |
| FP and SIMD | off: C `-mgeneral-regs-only`, Prismio `--target-features -neon,-fp-armv8` | the entry code leaves the unit disabled and no vector table is installed, so the first FP or SIMD instruction hangs QEMU with no output |
| Alignment | strict: C `-mstrict-align`, Prismio `+strict-align` | with the MMU off every access is to device memory, and an unaligned access takes an alignment fault. Without it LLVM merges adjacent loads into a wider one and the guest dies at the exception vector (0x200) |
| Optimisation | C `-O3 -ffunction-sections`, Rust `opt-level=3` with `lto=fat` and one codegen unit, Prismio's default | Prismio always builds whole-program |
| Linking | `harness/link.ld`, `--gc-sections`, `-nostdlib -static` | one image layout |

Prismio builds with `prismio build suite.psm --target aarch64-unknown-none-elf --freestanding --target-features ... --link-arg <harness.o> --link-arg -T --link-arg link.ld`, under `PRISMIO_INTERNAL_HOSTED=1` and with `PRISMIO_CC` naming the clang to use, so the compiler under test is invoked as a compiler and not forwarded by the launcher. It is run with the build directory as its working directory, not the repository root: a working directory that contains `runtime/` makes the compiler resolve its runtime from that source tree, the program stops being closed, and the compiler internalises nothing. The same `suite.psm` built from the repository root was 512 bytes larger and `heapsort` ran 200,000 instructions longer. `run_timed()` takes a `cwd` for this; the other two arms build from the root, where it makes no difference. The C arm is one translation unit including its category files, as the hosted C++ arm is one dispatcher, so the compiler sees every workload at once the way it sees the Prismio program and the Rust crate.

### Rust's `core`, built from source

The Rust distribution does not ship a standard library for `aarch64-unknown-none-softfloat` unless `rustup target add` has fetched one, and `-Zbuild-std` fetches crates from the registry. `ensure_rust_sysroot()` instead compiles `core` and `compiler_builtins` for the bare-metal target directly from the `rust-src` component into `benchmarks/build/freestanding/rust-sysroot`, once per `rustc` version (a `stamp` file holds the version). It needs no download and no network, takes a few seconds, and uses the library source the release was built from. `RUSTC_BOOTSTRAP=1` is what lets a stable `rustc` build unstable-feature library code; it is set for those two compiles and not for the benchmark crate. If it fails, the rest of the error is attached to the `Unavailable` it raises.

## The harness contract

`harness/harness.c` is compiled once, with `-O2 -fno-builtin` (it defines `memset` and a loop in `memset` recognised as `memset` is a recursion), into `harness.o`, and that object is linked into all three images. It owns:

- the entry `_start` (naked, `.text.boot`), which sets `sp` to `__stack_top` from the linker script (a 1 MiB stack) and calls `harness_main`; QEMU `virt` gives cleared RAM, so there is no `.bss` to zero;
- the PL011 serial output at `0x09000000`;
- the timer read (`isb; mrs cntvct_el0`);
- exit through ARM semihosting `SYS_EXIT`, which QEMU turns into its own exit status;
- `memset`, `memcpy`, `memmove` and `memcmp`, which every freestanding program must provide and every compiler emits calls to.

An arm provides exactly one thing: **`u32 bench_<name>(u32 scale)`** with the C ABI, for every workload in `benchmarks.json`. The list arrives as `workloads.h`, which `write_workloads_header()` generates in `benchmarks/build/freestanding` from the catalog (`X(name, scale)` rows), so the catalog is the single source of truth for what is linked and run. The harness prints `harness ready`, then one line per workload, then `done`:

```text
bench <name> <ticks> <result>
```

`run_guest()` parses these with `BENCH_LINE`, and raises if the exit status is nonzero or `done` never arrived, printing the tail of the output. In Prismio a workload is `export fn bench_<name>(scale: U32) -> U32`; in Rust, `#[no_mangle] pub extern "C" fn`; in C, a plain function.

**The shared `memcpy` is not neutral, so it is not slow.** The comment on the harness's memory functions says the arms differ in how often they call them and not in what they cost. That holds only while the functions are not the bottleneck. A loop LLVM turns into `memcpy` in one arm (Prismio's `edit_distance` row copy) and leaves inline in another (C under `-ffreestanding`, which implies `-fno-builtin`) makes the row a measurement of this function. It was: with a byte loop, `edit_distance` read 2.0× C. `memset`, `memcpy` and `memmove` now move a word at a time, with two constraints that come from the target. A word is moved only when source and destination are at the same offset within it, after copying single bytes up to the first aligned address, because the MMU is off and an unaligned access faults (the `Int` arrays in `edit_distance` are 4-byte aligned, which the 8-byte path handles through that head). And the word types are `may_alias`, since the bytes have some other type. The harness is built with `-fno-builtin` so these loops are not themselves recognised as `memcpy`. The fast path is a 64-byte body with one end-pointer compare (about five instructions per 16 bytes, against C's inline six). After the change the row reads 1.05×, and what is left is the extra instruction per cell, which is not the harness.

## `results.json`, schema 4

The combined file holds one report per suite:

```json
{
  "schema_version": 4,
  "generated_at": "...",
  "suites": { "hosted": { }, "freestanding": { } },
  "artifacts": { "html_report": "...", "raw_data": "..." }
}
```

Each suite's report keeps the schema it was written with (`hosted` is 3). `existing_suites()` reads the previous file first, so running one suite leaves the other as it was, and an older file from before the split is taken as the hosted report. Consumers that read the hosted data must go through `suites.hosted`; `tools/release_gate.py`'s `recorded_results()` does, with a fallback for an old file, and the website reads it through `getFreestandingDataset()` in `apps/web/lib/benchmarks.ts`.

A freestanding report (`schema_version` 1) holds:

| Field | Meaning |
| --- | --- |
| `metric`, `metric_note`, `tick_instructions` | `instructions`, a sentence for the report, and 16 |
| `runs`, `deterministic` | boots per arm and whether they all agreed |
| `parity` | 0.02 |
| `target`, `machine`, `scale` | the triple, `QEMU virt, cortex-a57, -icount shift=0`, and the `--scale` |
| `languages`, `language_labels` | `["prismio", "c", "rust"]` and display names |
| `environment` | the host and toolchains, with `qemu` and `lld` versions added |
| `build_commands`, `compile_ns`, `compile_cpu_ns` | per arm, as in the hosted report |
| `images` | per arm, bytes of `text`, `rodata`, `data`, `bss`, the `file`, and `code_net` (`text` minus the harness's) |
| `harness_text_bytes` | the shared object's `.text` |
| `summary` | per other arm: `geomean` of Prismio's ratios, and `win`, `parity`, `loss` counts |
| `benchmarks` | one record per workload: catalog fields, `result` (the agreed checksum), `languages.<arm>.{ticks, instructions, instructions_samples}`, and `verdict.<other>.{outcome, ratio, tolerance}` |

`elf_sections()` reads the section headers itself, so no `size` tool is needed. A workload whose arms return different `result` values is a hard error: `run()` raises `checksum mismatch for freestanding <name>` before any verdict is formed.

## Adding a workload

1. Write the **C** arm first, in the category file under `c/`, as `u32 bench_<name>(u32 scale)`. Use wrapping integer arithmetic and the `LCG` step from `common.h` for pseudo-random input, written out where it is used. Size it to 5 to 12 million instructions at scale 1: smaller and the 16-instruction resolution matters, larger and a run is slower for nothing. Keep arrays in the frame; there is no allocator.
2. Translate it **statement by statement** into `rust/<category>.rs` and `prismio/<category>.psm`. Do not tidy. A different control flow is a different program, and the checksum cannot tell you.
3. Add the record to `benchmarks.json` (`name`, `category`, `status`, `profile`, `description`, `scale`).
4. Run `python3 benchmarks/run.py --suite freestanding --only <name> --compiler ...`. The three checksums must agree.
5. Read the disassembly of the arm that is furthest from the others (`llvm-objdump -d --no-show-raw-insn benchmarks/build/freestanding/<arm>-suite.elf`) before believing a ratio. The `edit_distance` finding came from exactly that read.
6. Run the C arm natively under `clang -fsanitize=address,undefined`, excluding the raw-address workloads: undefined behaviour in the C arm makes the arms agree on a wrong answer.

`tests/test_runner.py` has a `freestanding_bench` test that runs the whole suite with `--runs 2` and checks that every catalog workload has an instruction count and a checksum for all three arms (the runner itself refuses disagreeing checksums) and that the repeated boots gave the same counts. It asserts no ratio: performance is recorded, not gated. It skips, as `freestanding` does, when a tool is missing. Run it, and the suite's `freestanding` test, after any change to codegen for the hardware builtins.

## Integer overflow

C's signed overflow is undefined and Prismio's `Int` wraps. LLVM may therefore turn C's `min(a + 1, b + 1)` into `min(a, b) + 1` and widen and strength-reduce C's `i32` loop indices, and cannot do either for Prismio unless something proves the arithmetic cannot wrap and marks it `nsw`. In the first results this was the whole of the difference: building the C arm with `-fwrapv` (one flag in `C_FLAGS` in `suite.py`) moved C to Prismio's counts on `quicksort`, `heapsort` and `edit_distance`, and made the comparison 4 fewer, 16 level and none more.

The compiler now supplies most of what undefined overflow gave C, without making overflow undefined:

| instructions | before | now | C | now / C |
| --- | ---: | ---: | ---: | ---: |
| `quicksort` | 11,304,368 | 9,991,296 | 10,096,384 | 0.99× |
| `knapsack` | 5,690,512 | 3,139,600 | 5,122,624 | 0.61× |
| `edit_distance` | 5,900,624 | 5,540,624 | 5,596,832 | 0.99× |
| `heapsort` | 10,907,456 | 10,907,440 | 10,702,272 | 1.02× |

`quicksort` gains from the facts an unchecked access implies, `knapsack` from a range guard on its sized array, and `edit_distance` from a bound on what its two rows can hold; [Loop guards](/compiler/loop-guards#loops-over-sized-arrays) describes all three. Knapsack ends up well ahead of C because the guard holds a fact, `w >= 0`, that C's undefined overflow never supplied: C reaches the same count only when that fact is written into its source. Against C the suite then read 4 fewer, 16 level and none more, geomean 0.95×; with `ring_buffer` (below) it reads 5, 15 and none. `heapsort` is the one row still behind, inside the parity band: `root * 2 + 1` in its loop condition is a recurrence no counter describes. [Wrapping integers and tight loops](/performance/wrapping-integers-and-tight-loops) has the investigation, every alternative measured, and what `heapsort` would need.

The suite keeps C's default, because C's default is what C is, and the README says so. When a row is behind C, run it with `-fwrapv` before treating it as code generation, and use `PRISMIO_NOWRAP=0` and `PRISMIO_RANGE_PROOFS=0` ([method](/performance/wrapping-integers-and-tight-loops#method)) to separate what the proofs buy from what the versioning around them costs.

## Reading a disagreement

A count can differ between arms for reasons that are not the compiler's code generation: a `memcpy` or `memset` call that one arm makes and another inlines, a bounds check Rust keeps and the others do not, a fixed-array initialisation that zeroes memory in one language and not another. Before filing a ratio as a code-generation loss, find where the extra instructions are. In 2026-10-08's first results, `edit_distance` was 2.0× C. Almost all of the gap was 600 rows of the harness's byte-loop `memcpy` (about 5.2M of 5.6M); the rest was one extra instruction per cell in Prismio's inner loop (15 against C's 14), 0.36M. The harness now moves words, and the row reads 1.05×. Count the inner loops yourself: this page's first version said they were identical, and they were not.

`ring_buffer` was the opposite lesson: level with C and 1.18× Rust, with three arms that are the same program. Rust's own optimised IR, compiled by our LLVM 23's `llc`, gave our count, so the difference was the LLVM version, not any frontend. LLVM 23's AArch64 backend merges a branch on two conditions into one even when one condition is a single bit test. The compiler now raises `-aarch64-br-merging-cbz-tbnz-bias` from 6 to 8 and gets Rust's 3,753,472; [Performance decisions](/performance/decisions-and-rejected-experiments#a-bit-test-is-split-from-its-partner-branch-again-on-aarch64) has the hosted timing that cleared it. When a row disagrees with an arm built by another LLVM, cross the IR and the backend before blaming either frontend.
