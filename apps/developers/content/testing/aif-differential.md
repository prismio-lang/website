---
title: AIF oracle and differential testing
description: Why the allocation analysis is written twice, how to run the comparison, and how to read it when the two disagree.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [testing, aif, oracle]
related: [aif/overview, aif/reuse-reports-and-verification, compiler/frontend, performance/investigation-method]
---

## What this test is for

Prismio decides at compile time where every value your program allocates should live: a stack slot, an arena reclaimed in bulk, the heap with a reference count, or the heap without one. Making that decision is the job of **AIF**, the Adaptive Inference Framework, and getting it wrong is expensive in both directions. Too cheap, and the program frees memory it is still using. Too expensive, and it is merely slower than it needed to be.

Nothing inside the compiler can check that decision against itself, because a wrong rule does not crash. It produces a plausible-looking number, the test suite stays green, and the bug surfaces much later as a use-after-free with nothing pointing at the cause.

So the analysis is written **twice**, deliberately:

- `src/aif/` is the real one. It is written in Prismio, and it is what your builds use.
- `aif/prototype/aif.py` is a second, independent implementation in Python, called **the oracle**. It shares no code with the first.

`tools/aif_differential.py` runs both over the same programs and compares what each concluded. Two implementations of the same rules make *different* mistakes, and this is what turns "different mistakes" into a failing test.

## Run it

```bash
python3 tools/aif_differential.py --compiler .prismio/build/debug/prismio
```

`--compiler` needs a working toolchain layout, not just a compiler binary — the project host that `prismio build` promotes works, and so does a packaged `dist/Prismio/bin/prismio`. A bare generation under `build/` does not; it has no `lib/` or `stdlib/` beside it.

When the two agree you get one line and an exit status of 0:

```text
In-compiler engine and oracle agree on all 19 source(s).
```

While chasing a specific failure, pass paths to check just those programs:

```bash
python3 tools/aif_differential.py --compiler .prismio/build/debug/prismio tests/test_45_aif_affine_collections.psm
```

## Reading a failure

A disagreement names the program, the ownership mode, and every counter that differs:

```text
  DIFFER  src/main.psm [as-is]

2 disagreement(s):

  src/main.psm (owned=False): T2: compiler=64 oracle=58, T3: compiler=346 oracle=352, rounds: compiler=17 oracle=16
```

Read `T2: compiler=64 oracle=58` as: *the compiler placed 64 allocation sites at tier T2, the oracle placed 58 there.* Nothing in the output says which one is right. That is the point — the test tells you the two have drifted, and working out which one drifted is the job.

Every program is checked twice, once per ownership model. `[owned]` is what `prismio build` actually analyses with; `[as-is]` adds `--copyable-collections` to exercise the pre-Level-4 policy the oracle still models. A failure in only one arm is a real clue: the disagreement is specific to how collections are owned.

## A worked example

In September 2026 the differential failed on *every* program in the corpus. It took four wrong guesses to find why, and the shape of that hunt is the reason this section exists.

The cause was one line. The compiler keys a container's element set on the **full** type, so `List<Actor>` is tracked separately from `List<Order>`. The oracle still keyed on the base type, so *every `List` in the program shared a single element set*. The compiler had changed on 2026-08-28; the oracle was never updated to follow.

The consequence was not subtle once it was visible. The points-to set for `Token.value` — a `String` field — held **113 sites of eight unrelated types**. An element read came back holding all of them, and the sharing rule then propagated "shared" from an unrelated pointer into 23 structs that had never been near one. Those 23 read T3 in the oracle and T2 in the compiler.

**A `String` field whose points-to set contains struct sites is the tell.** Nothing in the report says so directly; you have to go and look.

## How to debug a disagreement

In this order. Each step out of order costs a round trip.

1. **Reduce first.** Run the differential on the single failing source. If a program with no imports disagrees, the bug is in something every program touches.
2. **If `sites` differs**, one side is creating an allocation site the other is not. Copy the oracle to a scratch directory and put a `traceback.print_stack()` in `new_site` to see where.
3. **If a tier count differs**, instrument **every** write to the lattice involved — for the alias lattice that means every assignment to `self.A`, not only the ones that literally say `= SHARED`. Two of them inherit a value (`A[s] = A[o]` and `A[s] = A[h]`), and those are usually where it actually happens.
4. **Print the constraint's key *and* its resolved set** — the size and the member types, not just the key. A set far larger than it should be, or one mixing unrelated types, is the answer.
5. **Before writing any analysis at all**, diff the two name tables. Extract the names from the compiler's `aifCompilerBuiltinContract`, `aifRuntimeContract` and `aifFfiProduces`, and from the oracle's `FFI_CONTRACTS` and `FFI_RETURNS_PRODUCE`, then compare the sets. A missing name is the most common cause, and this finds it in one command.

**Never make the two agree without establishing which one was wrong.** A differential that agrees on a wrong answer is worse than one that fails, and this codebase has done exactly that: `list_set`'s stored-value index was off by one in *both* implementations, identically, and the agreement hid it.

## What is compared

Both reports are parsed into dictionaries with the same keys, by separate regular expressions, because the two print different human-facing columns. A field that goes missing parses as `-1`, so neither side can quietly stop reporting something and still pass.

| Set | Values | What a mismatch usually means |
| --- | --- | --- |
| `TIERS` | `T0`, `T1`, `T2`, `T3`, `T4b`, `T4a` | Storage classification changed |
| `COUNTERS` | sites, exclusions, rounds, thread distribution | Collection or solver coverage changed |
| `BRACKET` | bracketability and failed obligations | Region call-bracketing logic changed |

`region-calls` is deliberately **not** compared: arena placement is a code-generation decision the oracle does not model at all. The exclusion is written down so nobody mistakes missing coverage for agreement.

## Why it is built this way

**It reads `--summary`, not the human report or the manifest.** Human reports optimise for being understood, and their wording changes. Manifests optimise for diffing one revision against the next. The differential needs a compact, stable vector of numbers, which is what `--summary` is. Do not teach it to parse a decorative column when a counter can carry the same rule.

**`--theta-fields` is passed on purpose.** The compiler knows the target's byte layout; the JSON AST the oracle reads does not. Field-count mode removes an information difference only one side could ever resolve, so the test measures the inference rules rather than a threshold the oracle cannot compute.

**The corpus is curated, not just a glob.** `aif/corpus/*.psm` is supplemented with focused programs covering region numbering, owned collections, container edges, view provenance, joined and shared concurrency, runtime builtin contracts, bracketing obligations, and channel transfer. A fact domain no program reaches will agree perfectly while being completely broken.

## Adding a rule

Update the specification or rationale first. Implement both sides when the oracle owns the same rule, add the key to the right comparison tuple, teach both parsers to require it, and add the smallest program that discriminates.

Then **prove the fixture discriminates**, by temporarily breaking one implementation and checking that the mismatch you expect actually appears. Coverage here is not "the tests pass" — it is "a program exists that this rule can break". Record in the commit whether the change is a correctness fix, a precision improvement, or a policy decision.

Runtime verification (`--verify`) complements this and does not replace it. Two analysers can agree and still drive an incorrect release path, and the runtime ledger can balance while a returned view has already dangled. Keep value, manifest and ledger assertions together.

Before merging, run the default corpus rather than the single source you were iterating on. `tools/release_gate.py` invokes the differential through `check_differential()`.
