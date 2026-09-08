---
title: Regions, views, and provenance
description: How AIF relates lexical regions, nonlexical lifetime evidence, slices, field views, and returned aliases to an owner.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [aif, regions, views]
related: [aif/tiers-and-analysis-domains, compiler/ownership-and-drop-lowering, aif/reuse-reports-and-verification]
---

A region is a lifetime domain whose allocations can be reclaimed together. AIF can bracket eligible
work and route T1 sites to the active arena when every use is contained by that extent.

Lexical scope is only the starting point. Nonlexical analysis can end an extent after the last
relevant use, but calls, aliases, loops, and returned values can prevent safe bracketing. Ambient
region state is currently part of the runtime implementation, which is why concurrent region use
requires special scrutiny.

## Views preserve an owner relationship

A slice, struct field, enum payload, or reference-shaped container element can refer into storage
owned by another value. The compiler records that provenance so an escaping view raises the
required lifetime of its owner.

This rule is central to safe returned values. A function can return a view of a parameter without
allocating, but the caller must not release the argument-position temporary before the returned
view is consumed. When the compiler cannot prove the required relationship, it chooses the
conservative lifetime.

## Layout consequence

Under structure-of-arrays storage, an element may have no standalone address. A view is then a
logical pair such as container identity plus index, not necessarily a raw interior pointer.
Representation freedom depends on preserving this abstraction across sema, AIF, and lowering.

Tests must assert returned values in addition to allocation counts; balanced allocation bookkeeping
cannot detect every dangling view.

## Scope and region functions

`aif_scope_new(parent, owner)` creates the lexical tree used for least-common-ancestor escape
joins. `aif_scope_set_region` and `aif_scope_set_region_span` mark an explicit region and its
diagnostic location. `aif_scope_note_node` maps the source block back to the scope, while
`aif_scope_set_loop_depth` records whether repeated execution changes placement cost.

`aif_con_live_in(values, scope, fn)` raises each reachable site's required lifetime to the named
scope. `aif_var_note_scope` and `aif_var_note_use` record where bindings are declared and used.
`aif_scope_set_budget` adds a region high-water assertion; `aif_scope_budget`,
`aif_scope_served`, and the source accessors support reporting.

`aif_place_arenas` runs after tier solving. It rejects sites with blockers reported by
`aif_arena_blockers`, groups eligible lifetimes, computes statement ranges, and chooses the
scope/arena serving each site. `aif_arena_range_first` and `aif_arena_range_last` allow codegen
to open and close a non-lexical arena around only the required statements.

## Views are provenance edges

`aif_vs_view_of(viewValues, collectionValues)` records that a slice, string view, DataView, or
element reference uses storage owned by another value. It does not create a new allocation site.
When a view escapes, the solver raises the owner to the required lifetime.

Container stores are different: `aif_con_store(key, values, owners)` records both the field/element
points-to edge and the set of owning containers. `aif_con_retain_in` records another holder.
`aif_elem_key` is based on the full container type to avoid immediately merging
`List<Int>` and `List<Node>`.

## Interprocedural provenance

`aif_note_call_result` associates a call node with its abstract result.
`aif_fn_may_return_param` computes whether a result may alias an input; `aif_fn_may_return_view_of_param`
is the narrower view-provenance summary. `aif_owns_call_result_at_node` tells codegen whether the
caller owns the result.

For region call bracketing, `aif_call_edge` records visible calls and `aif_call_opaque` records
unknown ones. `aif_bracket_count`, `aif_bracket_callee`, `aif_bracket_scope`, and
`aif_bracket_served` expose selected brackets; `aif_fn_bracket_blockers` explains why a
function cannot safely run under a caller-owned arena.

Region tests must cover nested scopes, early return, break/continue, repeated loop execution,
returned views, views stored in containers or fields, visible and opaque calls, recursive call
graphs, budget overflow, and both lexical and non-lexical arena exit placement.
