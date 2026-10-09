---
title: Freestanding benchmarks
description: How Prismio is measured against C and Rust on a machine with no operating system, why the unit is guest instructions and not time, and how to read the table.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-08"
tags: [guide, freestanding, benchmarks, qemu, performance]
related: [guides/freestanding, compiler/cli, language/low-level, compiler/targets]
---

The hosted benchmark suite asks how fast a Prismio program runs on an operating system. The **freestanding suite** asks a different question: what does the compiler produce when there is nothing to lean on? It builds the same 20 workloads in Prismio, C and Rust for bare-metal AArch64, with no C library, no allocator and no startup files, boots each image under QEMU, and counts the instructions the guest executed. It is the measurement a kernel, boot stage or firmware author cares about, and it is the evidence behind the claim in [freestanding programs](/guides/freestanding) that the language reaches the hardware without a runtime.

## Run it

From a Prismio checkout:

```bash
prismio bench --suite freestanding
```

`prismio bench` runs both suites by default. Add `--only fibonacci` to run one workload, or `--scale 4` to make every workload four times larger. The suite needs `clang` with the AArch64 target, a linker that runs (`ld.lld`), `qemu-system-aarch64`, and `rustc` with the `rust-src` component. When one is missing the freestanding suite is skipped with a note that names it, and the hosted suite still runs. A full run takes about ten seconds.

## Reading a count

A row looks like this:

```text
workload              Prismio           C        Rust    vs C  vs Rust
  fibonacci           4.96 M      5.28 M      4.96 M   0.94×    1.00×
```

Each cell is the number of guest instructions the workload executed. `0.94×` means Prismio executed 94% as many instructions as C: fewer is better, and a ratio below 1 is a win.

The number is exact. QEMU runs with `-icount shift=0`, which makes its virtual clock advance one nanosecond per executed instruction, and the harness reads the generic timer around each workload. The timer ticks every 16 instructions, so counts are accurate to the nearest 16. The same image gives the same count on every run on every machine, which is why this suite has no medians, no spread and no noise to subtract. The factor was calibrated against a loop of known length: 10,000,000 instructions read 625,000 ticks every time.

Because the count is exact, a verdict is a fixed rule and not a statistical one: a ratio within ±2% of 1 is **parity**, because code placement alone moves a count by a fraction of a percent. Beyond that it is a win or a loss.

### What a count does not tell you

- **It is not a time.** It models no cache, no pipeline and no branch predictor. A workload that waits on memory (`pointer_chase`, `mem_copy`) costs more on real silicon than its count says, and a count cannot show what a vectorised loop would gain.
- **It is not a power or latency figure.**
- **It is not a hosted result.** The hosted suite measures what a program does on an operating system with an allocator and a C library. Neither suite predicts the other.

What it does show, without noise, is how much code each compiler asked the machine to run for the same program. The report also gives code size beside it: the `.text` of the linked image, shared harness included.

## The three programs are the same program

For every workload the three arms express the same algorithm statement by statement. The runner refuses to report a workload whose arms return different checksums, but agreement is not enough to prove the arms are the same, so the sources are reviewed against each other. The boot code, the stack, the timer, the serial output and the `memset`/`memcpy` the compilers emit calls to are one C file compiled once and linked into all three, so the only code that differs between arms is the benchmark itself.

Settings held equal across the arms:

| | |
| --- | --- |
| Target | `aarch64-unknown-none-elf` (Rust: `aarch64-unknown-none-softfloat`), CPU `generic` |
| Floating point and SIMD | off |
| Alignment | strict |
| Optimisation | C `-O3`, Rust `opt-level=3` with fat LTO and one codegen unit, Prismio's default pipeline |
| Allocation | none; every workload keeps its arrays in the frame |

Floating point and SIMD are off because the entry code leaves the unit disabled, and the first such instruction would take an exception with no vector table to catch it. Alignment is strict because with the MMU off every access is to device memory, and an unaligned access faults. Without `-mstrict-align` (C) or `+strict-align` (Prismio) the compiler merges two adjacent loads into one wider load and the guest dies at the exception vector.

Rust indexes with bounds checks, as safe Rust does. C's arrays and Prismio's fixed-length arrays are not checked. That is each language's price for what it promises, and it shows in `binary_search`, `heapsort`, `pointer_chase` and `knapsack`.

## The workloads

There are 20, in four categories:

| Category | Workloads |
| --- | --- |
| Algorithms | `fibonacci`, `prime_sieve`, `gcd_lcm`, `binary_search`, `quicksort`, `heapsort`, `knapsack`, `edit_distance`, `matrix_multiply` |
| Compute | `crc32`, `sha256`, `popcount`, `mandelbrot_fixed`, `bytecode_interpreter` |
| Memory | `pointer_chase`, `ring_buffer`, `mem_copy` |
| Hardware | `atomic_counter`, `spinlock`, `volatile_registers` |

The last category is what only freestanding code does: atomics and volatile access to raw addresses. Prismio writes them with the `__builtin_mem_*` functions from [low-level programming](/language/low-level); C uses `__atomic_*` and volatile pointers, and Rust uses `read_volatile` and its atomics. Everything is integer arithmetic.

## Results

From the current run (2026-10-08, QEMU 11.1, LLVM 23.1, rustc 1.97):

| | Fewer instructions | Parity | More instructions | Geometric mean |
| --- | --- | --- | --- | --- |
| Prismio against C | 5 | 15 | 0 | 0.95× |
| Prismio against Rust | 9 | 11 | 0 | 0.85× |

Prismio is level with C or ahead on all 20 workloads. The first complete run read 3 fewer, 14 level and 3 more, and the three behind (`quicksort` and `knapsack`, 11 to 12% more instructions, and `edit_distance`, 5% more) all came from one difference between the languages: signed integer overflow is undefined in C and wraps in Prismio, so LLVM can rewrite C's arithmetic and loop indices in ways it cannot for Prismio. Building the C version with `-fwrapv`, which gives it Prismio's overflow rules, closed all three.

Prismio's `Int` still wraps. What changed is that the compiler now proves, where it can, that a loop's arithmetic cannot wrap, and tells LLVM so. An index into a fixed array or a `[T]` view must be in range, so an access that ran bounds the variable it used. A loop over a fixed array can be compiled twice, with a test on entry that picks the copy whose arithmetic is proved. A counting loop bounds its counter. And a local array that only subscripts touch keeps a bound on what its elements can hold. `quicksort` and `edit_distance` are now level with C (0.99×), and `knapsack` runs in 0.61× of C's instructions, because its loop's test establishes a fact C's compiler never had. `heapsort` is 2% behind, inside the parity band. `ring_buffer` runs 15% fewer instructions than C, because the compiler tells LLVM's AArch64 code generator to keep a single bit test as its own branch rather than merge it with the next condition, as Rust's older LLVM does. [Wrapping integers and tight loops](https://developers.prismio.org/performance/wrapping-integers-and-tight-loops) has the whole investigation.

An earlier run read `edit_distance` at 2×, and almost all of that was not the compiler's code: Prismio's build turns a row copy into a call to the harness's `memcpy`, and C's `-ffreestanding` build does not, so the row was measuring a byte-loop `memcpy`. The harness's memory functions now move a word at a time. The lesson applies to any row: look at where the instructions went before reading a ratio as code generation. Treat any single row as one machine model's count of one program, not as a ranking of languages.

The linked image's `.text` is 15.8 KB for Prismio, 15.3 KB for C and 16.0 KB for Rust, of which 9.6 KB is the shared harness.

## Where to go next

- [Freestanding programs](/guides/freestanding) shows how to write and boot a kernel, which is what these workloads compile as.
- [The compiler command line](/compiler/cli#benchmarks) lists the `prismio bench` options.
