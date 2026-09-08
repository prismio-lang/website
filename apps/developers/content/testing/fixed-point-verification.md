---
title: Self-hosted fixed-point verification
description: How Prismio compares compiler generations, seed output, deterministic IR, and packaged toolchains to protect bootstrap trust.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [testing, bootstrap, determinism]
related: [compiler/bootstrap, tooling/compiler-host-and-promotion, runtime/platform-and-packaging]
---

A self-hosted compiler can reproduce the same bug across generations. Fixed-point agreement is a
determinism and bootstrap check, not a proof of semantic correctness.

The committed target-neutral seed builds an initial native compiler. That generation compiles the
current source into the next, which compiles it again. Relevant emitted compiler IR is compared
between successive generations.

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
```

Generate compiler IR with both later generations and compare the normalized artifacts. A mismatch
can come from nondeterministic iteration, unstable symbol identity, uninitialized state, target
metadata, or a genuine compiler semantic difference.

Seed agreement asks a separate question: can the committed bootstrap material still reach the
current source and expected generation? Refreshing the seed requires a trusted deterministic
compiler and should never be used to hide unexplained divergence.

Packaging verification then ensures the result works without repository-relative sources or
libraries. All three layers are required for a credible release.

## Generation gate

`tools/release_gate.py` is the release-level implementation. `bootstrap(compiler, out)` invokes
the repository bootstrap path with an explicit host. `check_generations` builds generation one
and generation two into a private work directory. The two binaries are both executable tests; the
corresponding emitted IR carries the stronger reproducibility signal.

`check_fixpoint` compares normalized generation outputs. A byte-identical fixed point means the
compiler built by generation one emits the same compiler representation as the compiler built by
generation two. `check_rc_reproduces` additionally asks the release candidate to reproduce the
generation-one IR, preventing a separately built candidate from escaping the cycle.

`check_seed` verifies the committed bootstrap seed remains capable of producing the candidate.
Refreshing that seed is an explicit operation through `tools/refresh_seed.sh` or PowerShell; it
must follow reviewed source/runtime changes and a successful fixed point.

## Other release-gate functions

| Function | Gate |
| --- | --- |
| `check_source_lists` | Embedded/build source inventories match the repository |
| `check_suite` | Complete positive, negative, and specialized compiler suite |
| `check_differential` | Native AIF agrees with the independent model |
| `check_corpus` | Representative programs compile and run |
| `check_verify_sweep` | Runtime ledger reports no supported lifecycle violations |
| `check_jit` | ORC execution matches native expectations |
| `check_cross_target` | Target triple/layout and cross artifacts behave as recorded |
| `check_packaging` | Installed layout works without checkout-relative resources |
| `mnemonic_diff` | Reports function-level code-shape drift for review |

Differences can come from nondeterministic declaration order, temporary paths, timestamps,
uninitialized data, target defaults, hash iteration, or a real semantic change. Normalize only
fields proven irrelevant to executable meaning. Never copy generation-two output over generation
one to “fix” a mismatch; identify the producer of the differing bytes.
