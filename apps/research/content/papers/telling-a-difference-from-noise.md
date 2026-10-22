---
title: Telling a real benchmark difference from noise
description: A verdict rule for short benchmarks that compares both medians and best runs, and why a flat percentage threshold calls ties wins and losses.
abstract: A fixed percentage ("within 4% is a tie") cannot decide whether one binary is faster than another on a workload that runs for under a millisecond. Process start, core placement and clock ramp-up produce two timing modes about a quarter apart, and the share of runs in each mode differs between binaries, so the same code can read as 19% faster or slower. We describe the rule the Prismio benchmark harness uses instead. A comparison is a win or a loss only when the ratio of medians and the ratio of best runs both leave a tolerance, and the tolerance for the medians grows with each workload's measured spread, using the interquartile range rather than the median absolute deviation. On a pair of real rows the rule calls a 1.22 times slowdown parity, because both languages show the same two clusters, and calls a smooth 1.18 times slowdown a loss.
authors:
  - name: Saksham Jaiswal
    url: https://saksham1319.vercel.app
status: published
published: 2026-10-01
updated: 2026-10-22
version: "0.1.0"
tags: [benchmarks, statistics, noise, methodology, performance]
related: [papers/wrapping-integers-and-tight-loops, notes/the-sdk-stamp-that-halved-malloc]
findings:
  - "Short workloads show two timing modes about a quarter apart, and the fraction of runs in each mode differs between two binaries of identical code."
  - "A flat 4% threshold reported one workload as 19% faster when the best runs of the two languages were within 4% of each other."
  - "Requiring both the ratio of medians and the ratio of best runs to leave their tolerances separates a smooth, real difference from a difference in which mode the runs landed in."
  - "The interquartile range sees both timing modes; the median absolute deviation reported a bimodal workload's noise as nearly 0%."
  - "The rule is not a significance test: five interleaved samples a side cannot support a p-value."
evidence:
  - label: "benchmarks/run.py: spread(), verdict(), verdicts()"
    url: https://github.com/prismio-lang/prismio/blob/main/benchmarks/run.py
  - label: "Benchmark suite and reproduction steps"
    url: https://github.com/prismio-lang/prismio/tree/main/benchmarks
  - label: "The same rule in the developer reference"
    url: https://developers.prismio.org/performance/telling-a-difference-from-noise
faq:
  - q: "Why not just treat anything within a few percent as a tie?"
    a: "On a workload that runs for 0.6 ms, noise is not a few percent. Two timing modes about 25% apart appear in both languages, so a flat threshold turns which mode a process happened to land in into a verdict that no code change can fix."
  - q: "Is this a statistical significance test?"
    a: "No. The samples are interleaved rather than randomised, and five a side cannot support a p-value. The rule decides how much of a difference to believe, not how likely it is by chance."
---

A benchmark table has one question per row: is Prismio faster, slower, or level? Answering it with a fixed percentage fails in both directions on short workloads. A workload that runs for 0.6 ms is dominated by things no code change moves: process start, which core the scheduler picks, the clock ramping up.

## The problem: two timing modes

Those effects show up as **two timing modes**, a fast one and one roughly a quarter slower, and the share of runs landing in each differs from one binary to the next. Consider five recorded runs of two workloads, in microseconds:

| workload | Prismio | C++ |
|---|---|---|
| `edit_distance` | 566 577 588 **702 736** | 587 **709 726 734 743** |
| `large_buffer_copy` | 6686 6704 6760 6793 7055 | 5678 5700 5735 5747 5769 |

`large_buffer_copy` is a smooth cloud. Every Prismio run is slower than every C++ run, so the difference is real. `edit_distance` is two clusters, near 570 µs and near 720 µs, in **both** languages. The medians differ because three of Prismio's five runs fell in the fast cluster and four of C++'s five in the slow one, while the fastest runs, 566 and 587, are within 4% of each other. The code takes the same time in each mode.

Under a flat 4% rule the median ratio, 0.81, would be reported as Prismio being 19% faster. That is as wrong as the opposite reading of a different set of five runs.

## The rule

A comparison is a `win` or a `loss` only when **both** of these leave a tolerance, and is `parity` otherwise:

1. the ratio of **medians**, against the tolerance `max(parity, spread, floor / median)`;
2. the ratio of **best runs** (minimums), against `max(parity, floor / minimum)`.

| term | value | meaning |
|---|---|---|
| `parity` | 0.04 | the flat floor the suite's alternating identical binaries measured as their own run-to-run difference |
| `spread` | per workload | the larger of the two arms' interquartile range divided by their median |
| `floor` | 25 000 ns | what process start, scheduling and clock ramp cost a run however short, as a fraction of the run |

There are two ratios because noise only adds time. The best run is the steadiest estimate of what the code costs; the median says what a run usually costs. A real difference moves both. Equal best runs with different medians is the signature of timing modes, and is parity.

The spread is the interquartile range, not the median absolute deviation. When more than half the runs sit in one mode the deviation is close to zero, so the older estimate reported `edit_distance`'s noise as nearly 0% and a 700 µs against 560 µs split as a loss. The interquartile range sees both modes.

## Result

Applied to the rows above, and to a third much shorter workload:

| workload | median ratio | best-run ratio | tolerance | verdict |
|---|---|---|---|---|
| `edit_distance` | 0.81 | 0.96 | ±21% (its own spread) | parity |
| `large_buffer_copy` | 1.18 | 1.18 | ±4% | **loss** |
| `blake3_chunk` (0.15 ms) | 1.04 | 1.06 | ±16% (the 25 µs floor) | parity |

In a live run the same distinction appears in the summary. `edit_distance` at 1.22 times C++ is printed as parity, and `large_buffer_copy` at 1.16 times is printed as a loss, because the colour follows the verdict and not the ratio.

## Reproducing it

```bash
python3 benchmarks/run.py --only edit_distance --only large_buffer_copy --runs 7
```

Since results schema version 3 the verdict is written into the result file, so no reader has to recompute it:

```json
"verdict": {
  "cpp": {
    "outcome": "parity",
    "ratio": 0.809,
    "best_ratio": 0.9631,
    "tolerance": 0.2126,
    "noise": 0.2126
  }
}
```

`outcome` is `win`, `parity` or `loss`. `ratio` and `best_ratio` are Prismio's time over the other arm's, so below 1 means Prismio is ahead. `tolerance` is what the medians were judged against, and `noise` is the spread it contains.

## Reading a disagreement

When a row is called a loss and the verdict is in doubt, check the three numbers before the code.

- **Samples in two clusters with equal minimums** are timing modes, and parity is the right answer. Rerun with more runs if a number is needed.
- **A smooth cloud whose ratios agree, with a tolerance near 0.04,** is a real difference. Time the phases of the workload separately in both languages before changing the compiler.
- **A large tolerance because the spread is large** means the verdict cannot be trusted either way. Increase the number of runs, close other work, and check the power state recorded with the results.

## Limits

- The rule is **not a significance test**. Five samples a side cannot support a p-value, and the samples are interleaved rather than randomised, so they are not independent draws.
- It **assumes noise only adds time**. A workload whose fastest run is an outlier in the other direction would be judged on a minimum that is not representative, so the raw samples should be read.
- It does **not call timing modes a defect in either language**. If one binary lands in the slow mode more often for a systematic reason, that is a finding for a separate investigation.
- The **25 µs floor was chosen from one host**. On a machine with faster process start it is generous.
- An arm compiled with less information is slower for reasons unrelated to the language. The Prismio arm is built as one whole program; the C++ and Rust arms are built with link-time optimisation so that a constant passed across a file boundary reaches the code that uses it in all three. Without that, one graph workload divided by a run-time value in C++ and Rust and by a folded constant in Prismio, and read as an 8% loss that C++ at the same constant did not show.
