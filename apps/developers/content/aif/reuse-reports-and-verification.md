---
title: AIF reuse, reports, and verification
description: Unique-update reuse, destination passing, human storage plans, decision explanations, manifests, and runtime verification.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [aif, reuse, verification]
related: [aif/overview, testing/aif-differential, compiler/diagnostics]
---

When a consumed value is uniquely owned and its old contents are dead, the compiler can sometimes
construct the replacement into the existing destination. This removes an allocation and transfer
without changing source semantics.

The current reuse token handles focused constructor and update patterns. General return-slot
construction, branch-merged destinations, and reuse across calls require ownership facts that are
not yet first-class in a memory-aware IR.

## Inspecting a decision

```bash
prismio aif path/to/program.psm
prismio aif path/to/program.psm --why=SITE
prismio aif path/to/program.psm --manifest
prismio build path/to/program.psm --verify
```

The ordinary report is for a person reading source. `--why` presents the derivation of one
numbered site. The manifest is the versioned machine form used by CI and differential tools.
Verification instruments selected runtime actions and reports allocations, releases, leaks, and
violations.

## What verification proves

A clean ledger supports the chosen allocation behavior; it does not prove all value semantics,
thread safety, foreign-code behavior, or absence of a premature-but-balanced release. Pair verifier
assertions with output checks, negative tests, and sanitizers appropriate to the affected boundary.

Report changes must preserve stderr/stdout separation so human status cannot corrupt a manifest or
JSON stream.

## Report entry points

`aifRun` selects ordinary unprofiled analysis. `aifRunProfiled` accepts the profile path and all
output controls. Both delegate to the same analysis so human, summary, manifest, and explanation
modes cannot accidentally solve different graphs.

`aifPrepareOrder` builds a deterministic site order from
`aif_order_add` and `aif_order_sort`. `aifSitePosition`, `aifFriendlyPosition`, and
`aifSymbolOf` produce selectors. `aifHumanSiteAtId` maps a displayed ID back to the internal
site; `aifHumanIdOf` performs the reverse mapping.

`aifEmitHumanReport` groups entry-file and imported sites and delegates each row to
`aifEmitHumanRow`. `aifEmitSummary` aggregates tier and kind counts with `aifCountTier`,
`aifCountKind`, and `aifCountKindTier`. `aifEmitManifest` writes the machine record,
including identity, source, type, facts, tier, placement, thread behavior, layout, origin, and
convergence state.

## Explanations and policy reports

`aifExplain(selector, sourcePath, converged)` resolves an ID or symbol and calls
`aifEmitCause`. The native solver exposes a witness through `aif_cause_build` and the
`aif_cause_site`, `aif_cause_rule`, `aif_cause_value`, file, line, and column accessors.
`aif_rule_name`, `aif_escape_name`, and `aif_alias_name` translate lattice values.
`aifRepairFor` may suggest a source change associated with the proven rule.

`aifEmitPlacement` expands `aif_arena_blockers`; `aifEmitBracketing` expands function
bracketing blockers. `aifReportPins` reports tier pins. `aifReportPlacementPin` checks named
regions. `aifReportBudgets` compares served/high-water estimates with declared budgets, and
`aifReportInertRegions` identifies regions serving no allocation.

## Reuse and runtime verification

`aif_param_reusable(symbol, index)` marks a consumed parameter whose storage can be reused by the
callee without another live owner. IR lowering still checks the concrete operation and
representation before mutating it.

`--verify` swaps the allocator path to `aif_verify_alloc`, `aif_verify_realloc`, and
`aif_verify_release`. `aif_verify_arm` enables the ledger and `aif_verify_report` prints live,
released, duplicate-release, and invalid-release counters. Arena chunks are accounted at their
bulk owner rather than pretending bump allocations have individual frees.

Verification cannot see a premature balanced release, a false FFI contract, an OS handle, or a
data race. Pair ledger assertions with result checks, manifest assertions, fixed-point generation,
ASan/TSan, and the independent AIF differential.
