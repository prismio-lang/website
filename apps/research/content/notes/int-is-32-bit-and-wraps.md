---
title: Why Prismio's Int is 32 bits and wraps
description: Three measurements settled that a 32-bit Int costs no sign extension in counted loops, that undefined overflow did not help, and that a wider Int costs 1.33 times.
abstract: A default integer can be 64 bits so that it can index any array, or 32 bits for density. For Prismio we measured three things before choosing. A 32-bit index loop compiled to the same code and the same time as a 64-bit one in a counted loop. Making signed overflow undefined slowed three real programs slightly and moved the geometric mean over 62 workloads by 0.9986 times, inside noise. A 64-bit Int cost 1.33 times on a struct-field step over 20,000 records. The cost that remains is silent wraparound, which a checked mode can price at about four times and so only as a debug mode.
authors:
  - name: Saksham Jaiswal
    url: https://saksham1319.vercel.app
status: published
published: 2026-08-26
updated: 2026-10-22
version: "0.1.0"
tags: [integers, overflow, performance, language-design]
related: [papers/wrapping-integers-and-tight-loops]
findings:
  - "A counted loop with an i32 index, an i32 index with nsw, and an i64 index ran in 0.226, 0.225 and 0.225 ms."
  - "Marking every signed add, subtract and multiply nsw made three real programs slower by 1.014x, 1.006x and 1.005x."
  - "A 64-bit Int cost 1.33x on a struct-field step: 27.15 ms against 36.11 ms."
---

The case for a 64-bit default integer is indexing, as in Go and Swift: an integer that can address any array. The case against is density, as in Rust's `i32` fallback. Three measurements settled it for Prismio, on an Apple M-series machine, decided on 2026-08-26.

## What was measured

| question | result |
|---|---|
| Does a 32-bit index cost a sign-extend per access? | No. The same loop with an `i32` index, an `i32` index with `nsw`, and an `i64` index ran 0.226, 0.225 and 0.225 ms (stride) and 0.529, 0.526 and 0.526 ms (saxpy). AArch64 emits no `sxtw` in the loop and x86-64 one `movslq`, in setup. |
| Would making overflow undefined help? | Not in time. Adding `nsw` to every `add`, `sub` and `mul i32` in three real programs made all three slower: 1.014×, 1.006×, 1.005×. Over the 62 hosted workloads it moved the geometric mean by 0.9986×, inside noise. |
| What does a wider `Int` cost? | 1.33× on a struct-field step over 20,000 eight-field records (27.15 ms with `Int`, 36.11 ms with `I64`), and 1.76× to 2.15× in a C control. Twice the bytes per cache line is half the SIMD lanes. |

The first row holds for a counted loop. A loop that stops on the data, such as the scans in a quicksort partition, pays one extension per access until something proves its counter cannot wrap. That is the subject of [Closing the gap to C on wrapping integer loops](/papers/wrapping-integers-and-tight-loops).

## The decision and its cost

`Int` stays 32-bit and wraps. `I8`, `I16`, `I64` and the unsigned widths exist for data that needs them.

The cost is real and was seen three times during the work: silent wraparound. A benchmark's own `Int` arm printed 1,856,082,944 where its `I64` arm printed 800,720,000,000. A checked mode is priced at 4.1× (stride) to 4.4× (saxpy), using clang's signed-overflow sanitizer as a stand-in, so overflow checking can only be a debug mode, which is what the `--overflow-checks` flag provides.

```bash
prismio build --overflow-checks program.psm
```
