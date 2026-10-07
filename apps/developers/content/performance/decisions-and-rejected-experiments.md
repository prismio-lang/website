---
title: Performance decisions and rejected experiments
description: What was tried to make Prismio faster or smaller, what each attempt measured, and why the obvious alternative lost, so a contributor does not re-derive a negative result.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-07"
tags: [performance, decisions, benchmarks, llvm, runtime]
related: [performance/investigation-method, performance/telling-a-difference-from-noise, runtime/collection-representations, llvm/runtime-ir-and-optimization]
---

This page is the project's memory of *outcomes*: the decisions that were measured rather than
argued, and the changes that were built, measured and reverted. [Performance investigation
method](/performance/investigation-method) says how to run an experiment; this says what the
experiments already found. Read the entry for an area before proposing a change in it, and add an
entry when you reject one. The machine is an Apple M-series Mac unless an entry says otherwise, every
comparison is interleaved with matching checksums, and a ratio below 1 means Prismio got faster.

The original write-ups, with the raw samples, were dated session records in `aif/evidence/`. They
were removed from the tree on 2026-10-07 and remain in Git history at the commit named in
[Where the raw data went](#where-the-raw-data-went).

## Representation and types

### `Int` is signed 32-bit, and the arguments for widening it measured zero

Decided 2026-08-26. The case for a 64-bit default is *indexing* (Go and Swift: a default integer that
can address any array) or, against it, *density* (Rust's `i32` fallback). Three measurements settled it
here:

| question | result |
|---|---|
| Does a 32-bit index cost a sign-extend per access? | No. The same loop with an `i32` index, an `i32` index with `nsw`, and an `i64` index ran 0.226, 0.225 and 0.225 ms (stride) and 0.529, 0.526 and 0.526 ms (saxpy). AArch64 emits no `sxtw` in the loop and x86-64 one `movslq`, in setup. |
| Would making overflow undefined (`nsw`) help? | No. Adding `nsw` to every `add`/`sub`/`mul i32` in three real programs made all three *slower*: 1.014×, 1.006×, 1.005×. |
| What does a wider `Int` cost? | 1.33× on a struct-field step over 20,000 eight-field records (27.15 ms with `Int`, 36.11 ms with `I64`), and 1.76×–2.15× in a C control. Twice the bytes per cache line is half the SIMD lanes. |

So `Int` stays 32-bit and wraps; `I8`, `I16`, `I64` and the unsigned widths exist for data that needs
them. The cost is real and was seen three times during the work: silent wraparound. A benchmark's own
`Int` arm printed 1,856,082,944 where the `I64` arm printed 800,720,000,000. A checked mode is priced at
4.1× (stride) to 4.4× (saxpy) using clang's signed-overflow sanitizer as a stand-in, so overflow checking
can only be a debug mode, which is what `--overflow-checks` is.

### Scalar-element lists are stored inline

`Vec<Bool>` and `Vec<Int>` used to spend a pointer slot per element because the inline-element decision
answered "not a struct". They are stored at their own width now: `Vec<Bool>` at 4,000,000 elements went
from 64.0 MB to 9.2 MB, `Vec<Int>` to 32.7 MB, and a sieve to 2,000,000 ran 1.25× faster.

The first version made a pure read loop **2.31× slower** (2.14 ms to 4.94 ms over 20M reads), because an
inline scalar list left the lowering that inlined and vectorised the access for a curated call that did
not vectorise. The fix is a backend intrinsic that resolves the representation inside the access (the flat
arm is constant-stride address arithmetic and a typed load): 1.94 ms, 0.346× of the regressed build, with a
16-lane NEON reduction. Scalar `set` was curated the same way, 18.929 ms to 7.721 ms. Lesson: a change to
what a list *is* has to be priced on a read loop and a write loop separately.

### Null for the empty variant of a recursive enum

`enum Tree { Empty, Node(Tree, Int, Tree) }` with exactly one empty variant emits null for `Empty`, and
a `match` reads the variant from pointer nullness instead of a tag load. `tree_traversal` went from
0.641 ms to 0.340 ms (1.88×), and `recursive_tree_rebuild` from 0.557 ms to 0.345 ms (1.61×). It is null
pointer optimisation applied to a user enum; the generated releases already stopped at null.

### `list_new` allocates nothing until the first push

`list_new()` allocated a four-pointer block that the first inline push immediately freed and replaced, a
malloc/free pair of pure waste. It is capacity 0 now, as Rust's `RawVec::NEW` is. **Performance-neutral**:
the corpus median was 1.000× against an A/A floor spanning 0.816–1.029×. It is kept because it is
correct and removes waste, not because it is faster, which is the honest way to describe it.

## Allocation and build flags

### The system allocator stays

Evaluated 2026-08-26 after arenas and inline elements, when four programs still made 10.7–21.3× as
many allocations as idiomatic Rust. Both candidates were wired in as the *only* allocator, including the
runtime's own strings, lists, reference counts and the curated inline module:

| allocator | corpus loop ratio | peak RSS |
|---|---:|---:|
| mimalloc v3.4.5 (direct) | 1.021× | +24.2% median |
| rpmalloc v1.4.5 (direct) | 1.003× | +62.7% median |

Neither paid for its memory. snmalloc was not tested: its distinguishing features are cross-thread
frees and batching, and the corpus had neither. A concurrent allocation-heavy workload is the
prerequisite for asking that question.

### Programs build at `-O3`

`-O2` had been chosen over a note saying `-O3` landed within 0.98×–1.03× of it, "which is noise". That was
true when it was measured, with a compiler that could not vectorise a container loop. Re-measured over 31
alternating samples: `tokenization` 0.641× (36% faster), `knapsack` 0.973×, `convolution` 0.966×,
`mergesort` 0.957×, `prime_sieve` 1.037× (the one loss), for +16 bytes of suite binary and 0.56 s to 0.59 s
of compile time. The C++ arm builds at `-O3` and the Rust arm at `opt-level=3`, so an `-O2` Prismio had also
been compared against rivals at their highest setting. Lesson: a measurement recorded in a comment has a
lifetime, and the comment should name the compiler it was measured with.

### Code layout moves single workloads by 20% and cannot be tuned away

`bytecode_interpreter` read 19.2 ms and then 22.9 ms, reproducibly, when an unrelated function in the same
binary changed size and its own function was byte-identical and 64 bytes lower. Aligning wholesale only
moves the loss: `-align-all-functions=5` reads 1.065× over the suite and `=6` 1.024×; at 64 bytes
`bytecode_interpreter` improves to 0.85× while `edit_distance` regresses to 1.24×. Loop and branch-target
alignment trade the same way. Codegen stays at LLVM's defaults; compare function mnemonics with
`tools/fn_mnemonic_diff.py` and compare against a second run of the *same* compiler before believing a
single-workload move. `PRISMIO_LLVM_ARGS` is the measurement switch.

### Binary size and compile time

A closed executable makes everything but `main` internal and runs `globaldce` first, then optimises as one
module and lowers up to eight partitions in parallel, then links with `-dead_strip`. The benchmark suite
binary had carried 136 `str*` functions it never called and a 79 KB Unicode table because every function
was external. Two things follow. A new fast/slow split needs `cold` or `PRISMIO_NOINLINE`, or LLVM folds the slow half
back into the fast one (the map update path lost 1.28× and `quicksort` 1.13× until theirs were marked).
And an earlier attempt to internalise everything but `main` (2026-09-05) was reverted because it made the
map update phase *worse*, 7.25 ms to 8.84 ms: half the probe inlined and nothing could combine the two
halves. That is why linkage changes are measured across the whole suite.

A cold build used to compile `lang_runtime.c` twice. Its `-O2` bitcode is kept for the rest of the build
now: cold builds fell to 0.804×–0.818× and the cold penalty of the inline runtime from 1.359× to 1.103×
(g1), with byte-identical executables.

## Loops and list access

### One range precondition per loop beats hoisting the header

A design study priced seven ways to compile a `Vec<Int>` loop against a raw C array, on the real list
layout (`knapsack`, min ns):

| design | ns | vs C |
|---|---:|---:|
| element-size test on every access | 505,000 | 2.89× |
| the state after the flat-set change | 309,000 | 1.77× |
| **hoist `(base, len)` into the preheader** (the plan on record) | 310,000 | 1.77× |
| per-iteration check that exits instead of yielding 0 | 252,000 | 1.44× |
| **one range precondition per loop, then unchecked access** | 176,000 | 1.01× |
| no checks at all (unsound; the ceiling) | 173,000 | 0.99× |

Hoisting the header was **worth nothing**. `data` is loaded only on the in-range path, a conditional load
LICM will not hoist; *remove the condition and LLVM hoists the pointer itself*. The shipped design proves
the index range once in the loop preheader (`src/ir/ranges.psm`) and emits unchecked accesses.

### The range guard must prove monotonicity

The first range guard reasoned in unbounded integers on a wrapping 32-bit `Int`, and was unsound twice:
`at = at + 2147483647` under `while (at < 3)` wraps negative with the condition still true and read memory
unchecked (SIGSEGV), and `at = at - 1` under `while (at < 3)` accepted a step in the wrong direction and
read adjacent heap. The guard now checks the step's operator against the condition and adds a conjunct
that the update cannot wrap. It also made `large_buffer_copy` 0.486× (16.41 ms to 7.97 ms), because the
tighter bound admitted a loop the loose one had to decline.

### A per-push inline fast path lost; the check moved to the preheader

Inlining the flat push at every call site (`elem_size == S && len < cap`, a store and a length bump)
measured 0.971× on g2 and **1.275× on g6**: `plan_orders` builds a fresh short-lived list per frame, so
nearly every push grows and the check is paid and almost never won. Gating it on loop depth did not
recover g6 (1.16×). The version that shipped proves `elem_size == S && cap - len >= trip_count *
pushes_per_iteration` **once in the preheader**: when it holds every push is a store with no test, and
when it does not, the ordinary loop runs unchanged for one comparison per loop *entry*. g6 measured
0.985×, and `prime_sieve` and `knapsack` 0.943× and 0.945×. A list from `list_new()` has capacity 0 and
fails the conjunct, so *the runtime guard is the profile* that had been asked for.

### A wider affine index matcher was correct and slower

A matcher that accepted `row * n + k` and `k * n + col` (the induction variable on the right of `+`, or
scaled) served three more index sites in `matrix_multiply` and measured slower on six benchmarks and
faster on none (`large_buffer_copy` 1.088×). Two hypotheses were refuted: making the guard cheaper changed
nothing (1.0003×), and removing the guard from `matrix_multiply` made it *slower* (1.0073×), so the guard
there is a net benefit of about 0.7%. The mechanism behind the 1.088× was **not isolated**; what is
established is the shape of the result. A guard is paid per loop entry and repaid per iteration, so a
trip-count estimate or a profile is what a wider matcher would need.

### Scoped alias metadata worked and did not move its benchmark

Tagging every list-header access `!alias.scope` and every element access `!noalias` of the same pair, and
marking the list constructors' return `noalias`, vectorised the two-list fill loop (4 to 31 vector
instructions, `len` out of memory). The fill phase measured 2.235 ms before and 2.198 ms after: the loop
was never instruction-bound. The change is kept for what it did buy, `prime_sieve` 0.906×. Each fact alone
moved nothing; both together were required.

### A call in a loop declines the guard, so a two-line helper cost 1.79×

`maxInt(a, b)` as a helper made `knapsack` take 9.44 ms against 5.59 ms for the branch it replaced (20 reps), with no
call surviving in the disassembly. The loss was decided in Prismio's own codegen, before LLVM ran:
`irFlatGuardCount` declined any loop containing a call it did not recognise, so the loop lost both guards
and the later inlining could not return them. `__builtin_max`, `__builtin_min` and `__builtin_abs` lower to
`llvm.smax`/`smin`/`abs` (5.04 ms), and a module pass now marks functions that call and index nothing so
that a loop calling one keeps its guards.

### Tagging struct-literal initialisers with struct-path TBAA cost 1.68×

Slice 2 of the TBAA work tagged field reads and assignments and the initialisers of struct literals.
Initialisers made g2 1.680× slower (27.522 ms to 46.235 ms). The shipped version tags reads and
assignments and **declines initialisers**, which costs nothing anywhere else. A named struct that shares an
extern signature with a raw `Ptr` keeps scalar tags, because a distinct base would turn Prismio's explicit
type-punning escape hatch into C strict aliasing.

### `vector_growth` is 93% one modulo chain

The loop is a push plus `checksum = (checksum + value) % 1000000007`, four million times. Written in C and
ablated, the modulo alone is 9.128 ms in Prismio and 9.174 ms in C of a 10.8 ms benchmark: a loop-carried
`smull; asr; add; msub` chain of about eleven cycles per iteration, identical in all three languages. The
whole addressable gap is the push, about 1.0 ms. Two levers priced at zero: forcing the representation test
true and dropping every bounds check (10.760 to 10.785 ms), and an unsigned accumulator, which is *slower*
(14.630 ms against 10.053) because a divisor near 2³⁰ needs a 33-bit magic constant. Do not spend a session
on this benchmark's container.

## Layout

### What each representation is worth, on g1's shape

Measured 2026-08-13 (200,000 records of 12 doubles, 200 frames, one step touching 6 of the 12 fields and
another touching 2), median of 7, in C against the runtime's real representation. It predates inline flat
list elements, so row A is what the compiler emitted *then*, and the ratios between rows are the durable
part:

| variant | median | vs A | what it needs |
|---|---:|---:|---|
| A. boxed AoS (a list of pointers to separate records) | 77.3 ms | 1.00× | nothing |
| B. boxed hot/cold | 71.1 ms | 0.92× | nothing |
| C. inline AoS | 66.8 ms | 0.86× | inline `Vec<T>` and views |
| D. inline hot/cold | 51.2 ms | 0.66× | inline `Vec<T>` and views |
| E. SoA | 27.4 ms | 0.35× | handles (a reference to one element is `(base, index)`) |
| F. chunked inline AoS | 73.5 ms | 0.95× | a growth policy |
| G. chunked inline hot/cold | 55.6 ms | 0.72× | a growth policy |

Four things to take from it. A hot/cold split pays on the *boxed* representation too (B/A 0.87× in a
repeated run), because shrinking the hot record from 96 to 72 bytes packs the allocator's blocks closer
together; the cost model had predicted neutral from its contiguity assumption, and was wrong. SoA is worth
2.5× over inline AoS with contiguity held constant (E/C 0.41×), so SoA is the larger half of the tuned
cross-language arms' lead. Chunked storage avoids the invalidation that makes inline lists need views, but
the index (`chunks[i >> 10][i & 1023]`) costs about 10% against flat storage, which eats two thirds of the
benefit on plain AoS and so makes chunking not worth doing alone; combined with a split it survives (0.72×
chunked against 0.66× flat), and that six-point gap is the real trade against building views. Finally, the
split is built and verified (`--verify` shows `released` rising by exactly the number of split objects, 0
violations), but a *linked* split reproduced the prize only weakly in the corpus: that run was on a contended
machine, four interleaved repeats of one pair spanned 0.958× to 1.061×, and the C benchmark's 0.87–0.89×
held at every size, so the remaining difference is the per-element `list_get` call the C code does not pay.

### The layout cost model needs a veto wherever an input is fabricated

Wired to codegen, the cost model chose two layouts that measurement rejected, and each had a nameable
missing input rather than a bad weight:

- `g3_scene_graph`'s `Node`, split 4/7 at a modelled cost of 12, ran **1.110×** (the worst regression in the
  corpus). `Node` has two inline `Transform` fields of 48 bytes, but the analysis sizes a struct-typed field
  from a registry that is empty at that point and answers 8. The model believed `Node` was 40 bytes; it is
  112.
- `g4_ecs_world`'s `World`, split 2/6, ran **1.042×**. `World` is a singleton, but the model prices every type
  as if there were 2²⁰ instances, so shaving it from 48 to 24 bytes crossed a cache-tier boundary and divided
  its modelled cost by six.

Both are now vetoes in `aif_layout_split_select`, and a third, *no type in `src/` is walked in container
order*, removed every split of the compiler's own types. Before it did, six of the compiler's sixteen types
split (`ASTNode` 3/15 among them) and the compiler still reached a warm and a cold fixpoint, byte-identical
across 88 programs: evidence that the transform is sound on the hardest program in the tree. The rule is
general: a model whose inputs are constants it made up ranks confidently and is wrong, and `argmin` over its
output inherits the error.

## Maps

### `key_value_update` was the hash, and four other things were not

The workload was the worst ratio in the suite (1.88× of C++, 1.21× of Rust). In C on the same keys, the
map's own design (an index table with dense insertion-order arrays) ties the best of four designs, and a
Swiss table loses because it gives up the sequential `keys[entry]` and `values[entry]` reads that
insertion-order iteration enjoys. Not responsible, each measured: the table design, bounds checks and the
representation test (7.220 to 7.386 ms with both removed), and the probe count (1.21 per lookup is what
random placement costs). Real but not fixable in the library: inlining is worth 2.6× in C and Prismio's
whole-program linkage cannot collect it (see the build-flags entry), and half of C's advantage is that its
map is a *stack value* (heap-allocating the same struct costs C 3.256 to 5.660 ms on the update phase),
which is a language-level question about value structs or escape analysis placing a non-escaping struct in a
frame.

What was: **a scrambling hash throws away locality.** The benchmark's keys are consecutive, as interned ids
and counters are; an avalanche mix scattered them across a 1 MB index table and made every probe a dependent
L2 access. With an identity hash the same C map ran 4.7× faster (6.877 to 1.469 ms). The identity is not
shippable (`i * 65536` takes 14,076 probes per lookup), so the shipped hash is `h ^ (h >>> 16)`, Java's
`HashMap` spread: the identity for every key below 2¹⁶, and robust on every family that is not built against
it. The one built against it, `i * 65537`, cancels the fold and lands every key in bucket 0 (7,078 probes
per lookup, 13 seconds against 25 ms), and that is what a struct hash that xors two equal 16-bit fields
produces. So **the table checks its own hash**: `mapRehash` measures the average displacement of the
entries it re-places and switches that map to the full MurmurHash3 finalizer (`keyStrengthen`) when the
average exceeds three; a good hash costs about 0.2 at that point, and the pathological family reaches three
by its ninth entry. A user's weak `impl Key` is defended the same way (`hash() -> 0` is legal), and the
trait's contract stays "equal keys hash equal". Result: `key_value_update` 10.495 to 4.948 ms (0.880× of
C++, 0.576× of Rust) and `hashmap_insert_lookup` 6.959 to 4.484 ms. A short String key's hash is mixed
inline by `__builtin_string_hash`; the inline and runtime halves must answer identically because a five-byte
view and a five-byte inline string are the same key, and `test_147` pins every length across the boundary.

## Concurrency

### Plain-data channels copy through the ring

A channel whose element is a struct of `Int`, `Float`, `Bool` and `Char` fields sends by `chan_send_copy` /
`chan_recv_copy` over a byte ring instead of boxing each message. `channel_pipeline` went from 1.63× to
0.92× of C++; the suite binary's stage time from 4.002 ms to 2.606 ms (0.651×); a standalone three-stage
pipeline of 5M messages from 1.025 s to 0.646 s against C++'s 0.688 s; and the verify ledger of 1M messages
from 2,000,001 allocations to 1. A generator that overflowed `Int` made the C++ arm's overflow undefined and
the checksums differ, which is why the benchmark bounds it.

### An SPSC ring would not have closed the g9 gap

The topology claim was correct (four job channels each created once, shared once and sent to from one thread)
but did not explain the 4.7 µs per frame gap (Prismio 40.7 µs, Rust 36.0 µs, of roughly 27 µs of serial
arithmetic). Spinning before blocking on the condvar was added to both ends and measured 0.995×. The
heap-object messages are nine allocations a frame, under 1 µs. An SPSC ring replaces an *uncontended*
mutex: tens of nanoseconds, a few hundred a frame, about a tenth of the gap. The 4.7 µs is **unattributed**;
the untested candidates are the genuinely contended `results` channel, thread placement on a machine with two
core types, and the per-frame clock reads.

## Where the raw data went

The dated session records and their raw samples were removed from the working tree on 2026-10-07. They are
in Git history at `c9f71ef`:

```bash
git show c9f71ef:aif/evidence/RESULTS-int-width.md
git ls-tree -r --name-only c9f71ef aif/evidence | head
```

Comments in the compiler and runtime that cite `aif/evidence/RESULTS-<name>.md` name a file in that tree.
