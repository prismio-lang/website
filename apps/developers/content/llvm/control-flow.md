---
title: Control-flow lowering
description: How Prismio branches, loops, matches, short-circuit operators, returns, drops, and region exits become valid LLVM basic blocks.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, control-flow, lowering]
related: [compiler/enums-and-pattern-lowering, compiler/loop-guards, llvm/functions-and-calls]
---

Control-flow emission is owned by `src/ir/stmt.psm`, with expression-level branching in
`src/ir/expr.psm`. The C backend creates LLVM blocks and terminators. Semantic flow analysis has
already rejected invalid source constructs, but code generation must still ensure every emitted
block has exactly one terminator and every branch target belongs to the active function.

## Basic-block API

| Bridge function | LLVM operation | Use |
| --- | --- | --- |
| `ir_get_label` | reserves a backend block identifier | Allocate targets before emitting incoming branches |
| `ir_label_numbered` | `LLVMPositionBuilderAtEnd` | Switch insertion to the block associated with an identifier |
| `ir_br_numbered` | `LLVMBuildBr` | Emit an unconditional edge unless the block is already complete |
| `ir_cond_br_numbered` | `LLVMBuildCondBr` | Branch on an `i1` condition |
| `ir_switch_begin` | `LLVMBuildSwitch` | Create a dense integer/tag dispatch with a default block |
| `ir_switch_case` | `LLVMAddCase` | Attach a constant case value to the switch |
| `ir_ret` | `LLVMBuildRet` | Return a resolved value with the declared type |
| `ir_ret_void` | `LLVMBuildRetVoid` | Terminate a void function |

`block_for` lazily creates blocks with `LLVMAppendBasicBlockInContext`. A label may therefore be
reserved before its block exists. `block_done` checks `LLVMGetBasicBlockTerminator`; branch and
return helpers avoid appending a second terminator after a return, break, continue, or unreachable
path.

The named `ir_label`, `ir_br`, and `ir_cond_br` compatibility calls are intentionally not the
real path. Numbered identifiers avoid collisions and let the backend retain typed block handles.

## If and conditional expressions

`generateStatement` allocates then, else, and merge identifiers. It emits the condition as an
`i1`, calls `ir_cond_br_numbered`, lowers each arm, and adds a merge edge only when that arm did
not already return or branch away. A missing `else` targets the merge block directly.

`generateShortCircuit` implements `and` and `or` without eagerly evaluating the right side.
It allocates a right-hand block and a merge block, emits a conditional edge based on the left
operand, then creates a PHI value with `LLVMBuildPhi` and `LLVMAddIncoming`. The constant
incoming edge is `false` for `and` and `true` for `or`.

Short-circuit behavior must stay in control-flow lowering. Replacing it with `LLVMBuildAnd` or
`LLVMBuildOr` would evaluate calls, mutations, and traps on the right side even when the source
language says not to.

## Loops

The three source loop forms share a block discipline:

- `while` has condition, body, and exit blocks;
- `loop` has body and exit blocks and branches back unconditionally;
- `for` additionally initializes and updates the induction binding.

`ir_loop_push(continueLabel, breakLabel)` records targets in the native symbol state;
`ir_loop_continue_label` and `ir_loop_break_label` are used by `continue` and `break`.
`ir_loop_pop` restores the enclosing loop. Nested loops therefore never search labels by name.

`ir_loop_barrier_push`, `ir_drop_barrier_push`, and the matching pop calls record lexical
boundaries for ownership cleanup. `ir_loop_drop_floor` identifies which bindings were created
inside the loop. Before emitting a break, continue, or return, `generateScopeDrops` releases
owned bindings above the appropriate floor and `generateRegionExits` closes dynamically entered
arenas.

## Match lowering

Fieldless enums and payload-enum tags use `ir_switch_begin` and `ir_switch_case`. Each arm gets
its own block; the default block handles an unmatched wildcard or defensive fallback. Payload
binders are created by `generatePayloadBinders` only after the tag selects the arm, so code does
not read the wrong union payload.

String matching uses a different tree. `stringDispatchSubject` evaluates the subject once.
`stringDispatchCount` and `stringDispatchBestByte` group literal cases by length and choose a
discriminating byte. `generateStringDispatchCandidates` emits length and byte tests before a
final equality check. The helpers use `ir_str_byte_at_long` and `ir_str_eq_literal`; no branch
may read a byte beyond the already matched length.

`beginArmReuse` may let an enum arm reuse the scrutinee allocation when AIF and ownership prove
the constructor compatible. `reusableArmConstructor` recognizes the exact construction; the
fallback emits an ordinary allocation.

## Returns and cleanup

A source return first computes the value, respecting alias/ownership rules, then emits outstanding
drops and region exits before `ir_ret`. `ir_set_returned` records that the current block ended;
`generateBlock` uses this to stop producing statements after a terminator. The marker is reset at
function entry and around independently emitted arms.

`ir_set_reinit_target` protects assignment lowering when construction of a replacement reads the
old value. `generateDisplacedRelease` releases the old allocation only after the new value is
ready, preventing premature teardown and self-assignment errors.

## Loop guards and bulk paths

Before ordinary loop emission, code generation may prove a specialized path:

- `generateLoopFlatGuard` checks that a list representation and element stride are compatible;
- `generateLoopRangeGuards` proves affine indices stay inside a stable bound;
- `generateWholeBufferCopy` replaces an exact copy loop with a guarded `memcpy`;
- `generateWholeBufferZeroFill` recognizes full zero initialization; and
- `generateLoopPushGuard` reserves capacity once for a bounded run of pushes.

Every transformation keeps a correct fallback edge. It must not change source semantics when the
runtime guard is false. See the dedicated loop-guards article for the proof conditions and
performance evidence.

Tests should include nested break/continue, early returns with owned locals, both short-circuit
outcomes, empty and exhaustive matches, payload binders, string literals with equal lengths,
region cleanup on every exit, and LLVM verifier coverage.
