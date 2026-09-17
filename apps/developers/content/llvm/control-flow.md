---
title: Control-flow lowering
description: How Prismio branches, loops, matches, short-circuit operators, returns, drops, and region exits become valid LLVM basic blocks.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [llvm, control-flow, lowering]
related: [compiler/enums-and-pattern-lowering, compiler/loop-guards, llvm/functions-and-calls]
---

## What this lowering does

Every `if`, loop, `match`, `break`, `continue`, and `return` a Prismio program writes has to
become a graph of **basic blocks** — straight-line instruction sequences that end in exactly one
**terminator** (a branch or a return) and never fall off the end. LLVM rejects a module that gets
this wrong, and semantic analysis has already rejected source that can't be lowered at all, so
what is left is bookkeeping: which block comes next, which owned values are still alive at each
exit, and which dynamically entered arenas still need closing. `src/ir/stmt.psm` owns statement-level
control flow; expression-level branching (short-circuit `and`/`or`, some loop bulk paths) lives in
`src/ir/expr.psm`. The C bridge in `runtime/llvm-api-backend.c` creates the actual LLVM blocks and
terminators.

## See it work

A `while` loop with an early `break`, run through the backend at its default (unoptimized) level so
every binding keeps its stack slot:

<!-- prismio-check: pass -->
```prismio
fn firstOver(limit: Int) -> Int {
    let mut i: Int = 0
    while (i < 100) {
        if (i > limit) {
            break
        }
        i = i + 1
    }
    return i
}

fn main() -> Int {
    return firstOver(3) - 4
}
```

```bash
prismio build loops.psm -o loops.ll
```

```text
Wrote LLVM IR: loops.ll
```

The loop becomes five blocks:

```text
label_0:                                          ; preds = %label_5, %entry
  %4 = load i32, ptr %i.1, align 4
  %5 = icmp slt i32 %4, 100
  br i1 %5, label %label_1, label %label_2

label_1:                                          ; preds = %label_0
  %6 = load i32, ptr %i.1, align 4
  %7 = load i32, ptr %limit.0, align 4
  %8 = icmp sgt i32 %6, %7
  br i1 %8, label %label_3, label %label_5

label_2:                                          ; preds = %label_3, %label_0
  %9 = load i32, ptr %i.1, align 4
  ret i32 %9

label_3:                                          ; preds = %label_1
  br label %label_2

label_5:                                          ; preds = %label_1
  %10 = load i32, ptr %i.1, align 4
  %11 = add i32 %10, 1
  store i32 %11, ptr %i.1, align 4
  br label %label_0
```

`label_0` is the condition, `label_5` the increment-and-loop-back body, and `label_2` the exit.
`break` (`label_3`) doesn't jump into the increment at all — it branches straight to `label_2`,
the block `ir_loop_break_label` recorded when the loop was entered. That's the whole mechanism:
`break` and `continue` are just branches to labels stashed on a loop stack, not a special
instruction.

## What failure looks like

Where a reader is most likely to hit a rejection is `match`: every enum value the scrutinee's type
can hold must be covered.

<!-- prismio-check: fail -->
```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}

fn area(s: Shape) -> Int {
    match (s) {
        Shape.Circle(r) => { return 3 * r * r }
    }
    return -1
}

fn main() -> Int {
    return area(Shape.Dot)
}
```

```bash
prismio build shape.psm -o shape.ll
```

```text
error[P4001]: this match does not cover Dot, Rect of `Shape`; add the missing arms or a `_` arm
 --> shape.psm:8:11
  |
8 |     match (s) {
  |           ^
error: aborting due to 1 previous error
```

Add the missing arms, or a `_` wildcard arm, and the build proceeds. This check exists because an
unhandled variant used to fall straight through the chain of tag comparisons and silently do
nothing for the input the author forgot — for a `Result`-shaped enum that input is usually the
error case.

A related check catches the mirror mistake — an arm that can never run:

<!-- prismio-check: fail -->
```prismio
enum Shape {
    Dot,
    Circle(Int)
}

fn f(s: Shape) -> Int {
    match (s) {
        Shape.Circle(r) => { return r }
        Shape.Dot => { return 0 }
        Shape.Circle(x) => { return 99 }
    }
    return -1
}

fn main() -> Int {
    return f(Shape.Dot)
}
```

```bash
prismio build unreachable.psm -o unreachable.ll
```

```text
error[P4001]: this arm is unreachable: an earlier arm already matches `Circle`
  --> unreachable.psm:10:9
   |
10 |         Shape.Circle(x) => { return 99 }
   |         ^^^^^
error: aborting due to 1 previous error
```

(the compiler repository's own fixture for this, `tests/neg_30_unreachable_arm.psm`, is the same
program with an explanatory comment block on top, which shifts every line number down by six —
the mechanism is the same either way).

## A worked example: why a duplicate arm is unreachable, not just dead

`match` arms are **not** compiled to a jump table keyed by tag. `generateMatch` in `src/ir/stmt.psm`
walks the arm list in source order and, for each non-wildcard arm, emits one `ir_icmp_eq` against
that arm's tag or literal, followed by `ir_cond_br_numbered` to either the arm's own block or the
next comparison. A payload arm additionally reads the tag once (`ir_enum_tag`) into a temporary
shared by every arm, then calls `generatePayloadBinders` inside its own block once the comparison
has already selected it.

That's why the reachability check above is exact rather than a heuristic: because arms are
literally tested in the order they're written, a second arm for a tag an earlier arm already
matched is provably dead code, not just suspicious code — the earlier `icmp`/`br` pair always wins
first. The compiler rejects it instead of warning, because there is no reading of a duplicate arm
that is correct.

## Returns and cleanup on every exit

A `return` first computes the value, then releases whatever is still owned and open before handing
control to LLVM — every exit path pays this cost independently, because LLVM has no `finally`.
Here a local `String` built with `.concat()` is released on both the early-return branch and the
fall-through branch of an `if`:

<!-- prismio-check: pass -->
```prismio
import std.string

fn greetLen(name: String) -> Int {
    let greeting: String = "hi ".concat(name)
    if (greeting.length() > 100) {
        return -1
    }
    return greeting.length()
}

fn main() -> Int {
    return greetLen("sam") - 6
}
```

```bash
prismio build drop.psm -o drop.ll
```

```text
label_6:                                          ; preds = %label_3
  %34 = extractvalue %prismio.str %30, 1
  %35 = and i64 %34, 6442450944
  %36 = icmp ne i64 %35, 0
  %37 = extractvalue %prismio.str %30, 0
  %38 = select i1 %36, ptr null, ptr %37
  call void @rt_free(ptr %38)
  br label %label_7

label_7:                                          ; preds = %label_6
  ret i32 -1

label_8:                                          ; preds = %label_5
...
  call void @rt_free(ptr %43)
  br label %label_9

label_9:                                          ; preds = %label_8
  ret i32 %32
```

(excerpt — the full module also shows the string's inline-vs-heap tag test before each `rt_free`.)
Both return sites free `greeting`'s backing bytes; neither leaks and neither frees twice, because
each is a separate lowering of the same drop, not a shared cleanup block reached by both paths.

## If you are changing control-flow lowering

### Basic-block API

| Bridge function | LLVM operation | Use |
| --- | --- | --- |
| `ir_get_label` | reserves a backend block identifier | Allocate targets before emitting incoming branches |
| `ir_label_numbered` | `LLVMPositionBuilderAtEnd` | Switch insertion to the block associated with an identifier |
| `ir_br_numbered` | `LLVMBuildBr` | Emit an unconditional edge unless the block is already complete |
| `ir_cond_br_numbered` | `LLVMBuildCondBr` | Branch on an `i1` condition |
| `ir_switch_begin` | `LLVMBuildSwitch` | Create a dense integer dispatch with a default block (string matching only — see below) |
| `ir_switch_case` | `LLVMAddCase` | Attach a constant case value to the switch |
| `ir_ret` | `LLVMBuildRet` | Return a resolved value with the declared type |
| `ir_ret_void` | `LLVMBuildRetVoid` | Terminate a void function |

`block_for` lazily creates blocks with `LLVMAppendBasicBlockInContext`. A label may therefore be
reserved before its block exists. `block_done` checks `LLVMGetBasicBlockTerminator`; branch and
return helpers avoid appending a second terminator after a return, break, continue, or unreachable
path.

The named `ir_label`, `ir_br`, and `ir_cond_br` compatibility calls are intentionally not the
real path. Numbered identifiers avoid collisions and let the backend retain typed block handles.

### If and conditional expressions

`generateIf` allocates then, else, and merge identifiers. It emits the condition as an
`i1`, calls `ir_cond_br_numbered`, lowers each arm, and adds a merge edge only when that arm did
not already return or branch away. A missing `else` targets the merge block directly.

`generateShortCircuit` implements `and` and `or` without eagerly evaluating the right side.
It allocates a right-hand block and a merge block, emits a conditional edge based on the left
operand, then creates a **PHI node** — an SSA value that takes a different input depending on which
predecessor block control arrived from — with `LLVMBuildPhi` and `LLVMAddIncoming`. The constant
incoming edge is `false` for `and` and `true` for `or`.

Short-circuit behavior must stay in control-flow lowering. Replacing it with `LLVMBuildAnd` or
`LLVMBuildOr` would evaluate calls, mutations, and traps on the right side even when the source
language says not to.

### Loops

The three source loop forms (`generateWhile`, `generateLoop`, `generateFor`) share a block
discipline:

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

### Match lowering

**Enum arms — fieldless or with a payload — are not a jump table.** `generateMatch` walks the arm
list once and, per non-wildcard arm, emits `ir_icmp_eq` against that arm's tag (via `ir_enum_tag`
for a payload match, `matchBindsPayload` decides which) followed by `ir_cond_br_numbered` to the
arm's block or the next comparison — a linear chain, tested in source order, exactly as the
[worked example](#a-worked-example-why-a-duplicate-arm-is-unreachable-not-just-dead) above shows.
Payload binders are created by `generatePayloadBinders` only after the tag comparison has already
selected the arm, so code does not read the wrong union payload.

`ir_switch_begin`/`ir_switch_case` (a real LLVM `switch`) are used for exactly one thing: **string**
matching. `stringDispatchSubject` evaluates the subject once. `stringDispatchCount` and
`stringDispatchBestByte` group literal cases by length and choose a discriminating byte.
`generateStringDispatchCandidates` emits a length switch, then a byte switch, before a final
equality check. The helpers use `ir_str_byte_at_long` and `ir_str_eq_literal`; no branch may read a
byte beyond the already matched length.

`beginArmReuse` may let an enum arm reuse the scrutinee allocation when AIF (the **Adaptive
Inference Framework**, which decides at compile time where each value your program allocates
should live) and ownership analysis prove the constructor compatible. `reusableArmConstructor`
recognizes the exact construction; the fallback emits an ordinary allocation.

### Returns and cleanup, mechanically

`ir_set_returned` records that the current block ended; `generateBlock` uses this to stop producing
statements after a terminator. The marker is reset at function entry and around independently
emitted arms (`ir_has_returned`/`ir_clear_returned` gate this per arm in `generateMatch`, as seen
above).

`ir_set_reinit_target` protects assignment lowering when construction of a replacement reads the
old value. `generateDisplacedRelease` releases the old allocation only after the new value is
ready, preventing premature teardown and self-assignment errors.

### Loop guards and bulk paths

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
outcomes, empty and exhaustive matches, an unreachable-arm rejection, payload binders, string
literals with equal lengths, region cleanup on every exit, and LLVM verifier coverage.
