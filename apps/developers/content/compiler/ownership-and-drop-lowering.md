---
title: Ownership and drop lowering
description: How Prismio tracks moves, default borrows, consuming parameters, mutable borrows, reassignment, and destruction.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [ownership, borrowing, drops]
related: [aif/overview, aif/regions-views-and-provenance, llvm/control-flow]
---

Ownership is a source-semantic contract; AIF decides how to implement storage for values that
already obey that contract.

Strings, lists, and structs are move-only. Ordinary parameters borrow them for the call.
`sink` consumes an argument, and `inout` creates caller-visible mutable access. Scalars, raw
pointer values, fieldless enums, and arrays follow their documented copy behavior.

## Analysis

`src/sema/ownership.psm` records initialization, moves, borrows, last use, reassignment, explicit
`drop`, container transfer, and scope exit. It rejects use after move, dropping borrowed storage,
moving the same value through incompatible paths, and ownership operations that would escape a
local stack-only aggregate.

Loops require special care because a syntactic last use is not necessarily the last dynamic use.
Branch joins must combine ownership state conservatively, and a reinitialized binding starts a new
ownership interval.

## Lowering

The IR generator emits destruction on relevant exit edges and queries AIF for the management action
appropriate to the selected tier. Unique heap storage, region storage, and shared storage do not
use the same release operation.

Value correctness must accompany ledger checks. A ledger can balance even if storage was released
too early and later read through a stale view. Tests for returned fields, payloads, and container
elements should assert the observed value as well as leak and violation counts.

## Semantic ownership functions

| Function | Meaning |
| --- | --- |
| `semaBindingIsBorrow` | Classifies parameters and local bindings that observe rather than own a move-only value |
| `semaMoveOperand` | Marks the source of an ownership transfer and rejects reuse through the source binding |
| `semaConsumeOperand` | Applies consuming-call or assignment semantics to an expression |
| `semaCheckValue` | Checks an expression against the expected type and ownership context in one operation |
| `semaCheckExternContracts` | Validates `borrow`, `consume`, `alias`, `produce`, and related FFI annotations against the signature |
| `semaCheckUniqueArgs` | Rejects passing the same unique value into multiple consuming/unique positions in one call |

The semantic checker records legality. It does not decide whether the eventual storage is stack,
arena, RC, or cycle-managed. AIF makes that choice later without weakening moves or borrows.

## Backend ownership state

`runtime/ir_symbols.c` maintains scoped binding records used while IR is emitted.
`ir_mark_moved`, `ir_unmark_moved`, and `ir_is_moved` mirror the checked move state needed to
avoid generating a second use or release. `ir_mark_borrowed` prevents a non-owner binding from
entering the drop list. `ir_mark_droppable(name, kind)` records the release kind for an owning
slot; `ir_mark_owns_slot` distinguishes the binding that owns a slot from a temporary view of it.

`ir_scope_push` stores the current binding/drop floor. `ir_scope_drop_floor` and
`ir_drop_count` expose the entries created in that scope; `ir_drop_slot`, `ir_drop_type`, and
`ir_drop_kind` let `generateScopeDrops` emit releases in reverse ownership order.
`ir_drop_barrier_push` and `ir_loop_drop_floor` provide the correct boundary for return,
break, and continue.

## Selecting the release operation

`dropKindOf` in `types.psm` and AIF queries choose the mechanism:

- plain owned storage calls `ir_free_object`;
- a list calls `ir_free_list`, which also handles its element policy;
- a DataView calls `ir_free_data_view`;
- an owning struct calls `ir_free_typed(value, releaseFnName(type))`;
- shared/counted storage calls `ir_free_rc` or `ir_free_rc_atomic`;
- cycle-managed storage follows its generated typed release/cycle path; and
- stack, static, borrowed, transferred, or arena-owned values emit no individual free.

`generateReleaseFn` creates one helper per struct whose fields require teardown.
`generatedFieldRelease` asks AIF whether each field is owned, counted, cyclic, or inert and emits
the matching action. `generateCyclicChildrenFn` creates the visitor used by the cycle collector.

Assignment needs a separate path. `generateDisplacedRelease` releases the old value only after
the replacement has been evaluated safely. `aif_releases_on_overwrite_node` determines when the
write displaces an owned value. `ir_set_reinit_target` marks a self-reinitializing accumulator so
string/list operations can reuse storage without releasing the buffer they are about to mutate.

## Calls, temporaries, and returns

`irArgumentIsOwnedTemporary` identifies a call argument whose storage has no binding owner.
`generateOwnedTemporaryRelease` schedules its release after `ir_call_end`, except where a
consuming parameter takes ownership. Borrowed C-string conversion also records a call-frame
temporary and releases it in `release_call_temps`.

`nodeProducesOwnedValue`, `irCallReturnsAlias`, and `aif_owns_call_result_at_node` distinguish
owned results from aliases and views. Return lowering transfers an owned result out of the local
drop set; returning an alias extends the underlying owner's required lifetime through AIF
provenance rather than pretending the alias owns storage.

Ownership regressions need at least: a legal move, use-after-move rejection, borrow followed by use,
consuming call, overwrite, every early exit, nested scope, loop break/continue, returned owned
value, returned view, container element replacement, task transfer, FFI contract, and verifier plus
observable-value assertions.
