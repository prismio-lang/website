---
title: Adaptive Inference Framework overview
description: A contributor-oriented map of AIF inputs, fixed-point analysis, storage tiers, layout decisions, reports, and verification.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [aif, memory, architecture]
related: [compiler/aif-internals, aif/tiers-and-analysis-domains, aif/reuse-reports-and-verification]
---

The Adaptive Inference Framework runs after semantic and ownership analysis. It decides where
managed values live and which runtime management operations code generation emits.

AIF does not replace source ownership. A program must already satisfy move, borrow, drop, and
control-flow rules. AIF may choose a conservative tier when evidence is incomplete, but it must not
weaken safety.

## Implementation map

- `src/aif/model.psm` defines allocation sites, facts, tiers, and the analysis model.
- `src/aif/walk.psm` collects evidence from the semantically checked program.
- `src/aif/contracts.psm` describes foreign allocation and ownership behavior.
- `src/aif/layout.psm` evaluates representation choices.
- `src/aif/report.psm` emits human, explanation, and manifest forms.
- `runtime/aif_support.c` supplies the support engine used by the self-hosted compiler.

## Outputs

Each relevant allocation site receives a stable-enough identity, inferred facts, a tier, and
possibly a layout or region decision. Code generation queries those side tables while lowering the
AST. `prismio aif` exposes the plan; `--why` explains one decision; `--manifest` emits the
machine-oriented form; and `build --verify` checks selected runtime consequences.

The declared compiler level is AIF-1. Policy and report details remain experimental.

## Exact execution order

`aifRunProfiled` is the orchestration entry point used by the driver. It resets native state,
optionally loads a measured profile, and then executes:

1. `aifDeclare(module)` to register functions, lexical scopes, nominal types, explicit regions,
   annotations, and foreign contracts;
2. `aifBuild(module)` to discover allocation sites, keys, value sets, call edges, ownership
   transfers, views, stores, returns, tasks, and constraints;
3. `aif_layout_select()` to rank field orders from static or measured access weights;
4. `aifComputeSizes(module)` to calculate target-aware exact sizes after field order is known;
5. layout veto passes and `aif_layout_split_select()` to choose an allowed hot/cold split;
6. `aif_solve(roundBudget)` to reach a points-to and fact-domain fixed point;
7. `aif_widen()` when the budget is exhausted, preserving safety with conservative facts;
8. `aif_check_pins`, `aif_place_arenas`, and `aif_check_placement_pins`; and
9. ordered human, summary, manifest, layout, pin, budget, inert-region, or explanation output.

The ordering is load-bearing. Field order changes exact size; size affects stack/arena eligibility;
tiering affects placement; and a placement pin cannot be checked before placement exists.

## Core objects

`aif_fn_new` assigns a function ID and `aif_scope_new` builds the lexical scope tree.
`aif_site_new` creates an allocation-site record with type, kind, function, scope, file, line,
column, and ordinal. `aif_key_var`, `aif_key_field`, `aif_key_param`, `aif_key_ret`, and
`aif_elem_key` identify storage locations. `aif_vs_new`, `aif_vs_site`, `aif_vs_key`, and
`aif_vs_union` build abstract value sets.

Constraints are monotone updates over those objects. `aif_con_bind` connects a value set to a
binding key; `aif_con_store` records field/container storage; `aif_con_arg` connects calls;
`aif_con_return` connects a function result; and escape, borrow, retain, foreign, task, and pin
constraints raise the relevant domains. The native solver never lowers a fact once learned.

## How code generation consumes AIF

The AST is not rewritten with allocation instructions. `aif_site_note_node` associates source
nodes with sites. Later, `aif_tier_at_node`, `aif_arena_at_node`,
`aif_releases_on_overwrite_node`, `aif_elem_owner_at_node`, `aif_rc_at_node`,
`aif_cycle_at_node`, and `aif_owns_call_result_at_node` answer focused lowering questions.

This side-table design keeps one semantic AST but creates a strict requirement: every new
allocation-producing syntax form must register the same node that IR generation later queries.
A missing association silently falls back to conservative behavior and must be covered by manifest
and emitted-IR assertions.
