---
title: AIF oracle and differential testing
description: How the independent AIF oracle, AST dump, manifests, corpus, and runtime verifier constrain allocation-inference changes.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [testing, aif, oracle]
related: [aif/reuse-reports-and-verification, compiler/frontend, performance/investigation-method]
---

AIF has two implementations that deliberately share no analysis code. The production pass lives in
`src/aif`; `aif/prototype/aif.py` is the independent Python oracle. The comparison is driven by
`tools/aif_differential.py`. Its purpose is narrower and stronger than checking that both commands
finish: it detects a silently different transfer function by comparing every maintained result and
exclusion counter over the same post-sema program.

## What the harness executes

`main()` resolves `--compiler` against the repository root, expands an explicit source list or the
maintained corpus, and runs every source twice. The first arm uses the current owned-collection
model. The second adds `--copyable-collections` to exercise the pre-Level-4 policy that the oracle
still models as a compatibility arm.

For each `(source, ownership-mode)` pair, `compare()` performs this sequence:

1. Run `prismio aif <source> --summary --theta-fields` plus the ownership flag.
2. Run `prismio dump-ast <source>` once and cache the JSON path in `dumps`.
3. Run `aif/prototype/aif.py <dump>` with the same ownership mode.
4. Parse both reports into normalized dictionaries.
5. Compare every key in `TIERS + COUNTERS + BRACKET` and report all mismatches together.

`--theta-fields` is intentional. The compiler normally has target byte layout; the JSON AST does
not. Field-count mode removes that deliberate information difference so this test measures the
inference rules rather than a threshold only one side can calculate.

## Parsers and compared facts

`parse_compiler()` and `parse_oracle()` use separate regular expressions because the human columns
differ, but both return the same keys. `parse_threads()` reads `Isolated`, `Transferred`, and
`CrossThread`. `parse_bracketing()` reads the bracketing total, sole-regime count, and each failed
obligation. Missing fields become `-1`; a producer cannot silently stop reporting a field and still
pass.

The compared sets are:

| Set | Values | What a mismatch usually means |
| --- | --- | --- |
| `TIERS` | `T0`, `T1`, `T2`, `T3`, `T4b`, `T4a` | Storage classification changed |
| `COUNTERS` | sites, exclusions, rounds, thread distribution | Collection or solver coverage changed |
| `BRACKET` | bracketability and failed obligations | Region call-bracketing logic changed |

The harness does not compare `region-calls`: arena placement is a code-generation decision the
oracle does not model. That exclusion is explicit so a contributor does not mistake incomplete
coverage for agreement.

## Why the default corpus is curated

The glob over `aif/corpus/*.psm` is supplemented by focused regression programs. Region numbering,
owned collections, container edges, view provenance, joined and shared concurrency, runtime
builtin contracts, bracketing obligations, and channel transfer each have a fixture because a
domain can otherwise appear correct simply by never being reached. When adding a fact domain, add
a source that would fail if the oracle implementation were removed or deliberately inverted.

## Why manifests matter

The differential consumes `--summary`, not prose reports or manifests. Human reports optimize for
understanding and may change wording; manifests optimize for revision-to-revision artifact diffs.
The oracle check instead fixes a compact semantic vector. Keep these roles separate: do not parse a
decorative report column when a normalized counter can represent the rule.

## Adding a rule

Update the specification or rationale, implement both sides when the oracle owns the same rule,
add its key to the appropriate comparison tuple, teach both parsers to require it, and add the
smallest discriminating corpus case. Prove the fixture is discriminating by temporarily breaking
one implementation and observing the expected mismatch. Record whether the change is a correctness
fix, a precision improvement, or a policy decision.

Runtime verification complements the differential. Two analyzers can agree and still drive an
incorrect release path, while the runtime can balance allocations without proving a returned view
remained valid. Keep value, manifest, and ledger assertions together.

Run the focused harness with:

```bash
python3 tools/aif_differential.py --compiler build/gen2
```

Pass source paths after the compiler option while iterating. Before merging, run the default corpus
and `tools/release_gate.py`, which invokes the differential through `check_differential()`.
