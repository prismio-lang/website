---
title: AIF tiers and analysis domains
description: The escape, alias, thread, and cycle facts that place Prismio allocations into T0 through T4 storage tiers.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [aif, allocation, analysis]
related: [aif/overview, aif/regions-views-and-provenance, runtime/allocation-arenas-rc-and-cycles]
---

AIF solves four related questions: whether a value escapes, how many identities may refer to it,
whether it crosses a thread boundary, and whether its type or graph may participate in a cycle.
The solver propagates facts until no rule changes the graph.

| Tier | Intended storage |
| --- | --- |
| T0 | Stack storage for a small, nonescaping site |
| T1 | Region storage when a bounded lifetime can be served by an arena |
| T2 | Unique heap storage with deterministic ownership |
| T3 | Reference-counted storage for shared acyclic values |
| T4 | Cross-thread or potentially cyclic shared storage with stronger management |

Tier names describe compiler strategies, not source types. Two expressions of the same source type
can receive different tiers because their escape, alias, region, and transfer evidence differs.

## Conservative joins

Unknown calls, foreign boundaries without a precise contract, merged control-flow paths, and
dynamic dispatch can raise a site to a more conservative state. AIF is field-sensitive but does
not provide full flow, object, or context sensitivity. Contributors should distinguish a genuine
semantic requirement from precision lost by the analysis.

## Thread and cycle facts

Passing ownership into a task and joining within the enclosing lifetime differs from allowing a
value to remain shared after the scope exits. Likewise, a recursive type is not automatically a
runtime cycle, but it can require cycle-capable policy when the compiler cannot rule one out.
Runtime tests for T3 and T4 must validate both edge instrumentation and concurrent behavior.

## Native fact representation

Each `Site` in `runtime/aif_support.c` stores the current escape, alias, thread, and cyclicity
values plus identity, type, source, scope, size, pin, widening, arena, and ownership metadata.
`Constraint` records are grouped by the domain they can change. Dense `Bits` sets from
`aif_containers.c` represent points-to/value relations; `bits_set` reports whether a set grew,
which is the fixed-point work signal.

`aif_con_unique`, `aif_con_borrow`, `aif_con_live_in`, `aif_con_escape_caller`,
`aif_con_escape_global`, `aif_con_no_stack`, `aif_con_transferred`,
`aif_con_spawn`, and `aif_con_opaque` add constraints rather than changing a site immediately.
`aif_solve` first closes points-to edges, then repeatedly applies domain transfers until no fact
grows or the round budget is exhausted. `aif_pt_rounds` and `aif_rounds` expose both counts.

## Tier selection function

`aif_tier_of(site)` derives a storage tier from the converged facts, site kind, exact size,
stack threshold, explicit region constraints, container ownership, and supported runtime
mechanisms. It is queried after solving; callers must not infer a tier from one domain in isolation.

`aif_set_theta_mode` selects the stack threshold policy and `aif_theta_stack` reports the
effective byte limit. `aif_site_is_rc`, `aif_site_is_cyclic`, and
`aif_type_is_counted` expose the runtime mechanism implied by the final plan. `aif_site_thread`
distinguishes isolated, transferred, and cross-thread values so codegen can select atomic RC only
when required.

## Pins and widening

`aif_con_pin` records a requested tier and `aif_check_pins(converged)` compares it with the
derived safe tier. `aif_site_pin_verdict`, `aif_site_pin_tier`, and
`aif_site_derived_tier` feed diagnostics. A pin is an assertion to verify, not an instruction to
override analysis.

When solving does not converge within the configured budget, `aif_widen` raises unresolved facts
to safe conservative values. `aif_site_widened` marks affected sites for reports.
`aif_cause_domain_for`, `aif_cause_build`, and the `aif_cause_*` accessors reconstruct a
witness chain explaining which rule and source location raised a domain.

A domain-rule change needs a minimal graph fixture, expected fact values, expected tier, a
`--why` witness, widening behavior, emitted allocation/release symbols, runtime verification, and
the independent Python differential.
