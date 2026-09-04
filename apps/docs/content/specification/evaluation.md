---
title: Evaluation and control-flow semantics
description: Expression ordering, short circuiting, assignments, loops, matches, returns, and unreachable behavior in Prismio 0.1.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [specification, evaluation, control-flow, precedence]
related: [language/operators, language/control-flow, language/pattern-matching]
---

Evaluation begins only after a program passes lexical, parse, type, ownership, and required allocation-analysis checks. The reference compiler lowers accepted behavior to LLVM IR.

## Expression evaluation

Expressions evaluate according to the precedence table in the [operator reference](/language/operators). Chained casts apply left to right. Function arguments and aggregate initializers are evaluated in source order by the current compiler; programs should avoid depending on foreign-function side effects where an ABI may impose a different order.

Unary operations evaluate their operand before applying the operator. Binary operations evaluate operands according to current source ordering and then apply the operation in their statically selected type. No implicit numeric promotion is inserted.

Calls evaluate their arguments and apply each parameter's copy, borrow, `inout`, or `sink` behavior. A returned expression is evaluated before control transfers to the caller.

## Short-circuit logic

`and` evaluates its right operand only when the left is true. `or` evaluates its right operand only when the left is false.

Both operands must be Boolean when evaluated. The unevaluated side performs no calls, moves, assignments, or runtime checks.

## Assignment

Assignment evaluates the destination location and right-hand expression, then stores the compatible result. Compound assignment reads the destination once, applies its operator in the destination type, and writes it back.

Assigning a move-only value into an owned destination transfers ownership. Direct assignment to a binding requires `mut`. Current field assignment rules permit mutation through a struct binding independently of direct binding mutability; this behavior is version-specific and may be tightened.

Compound assignment is not a general member/index place operation in 0.1.

## Branches and loops

`if` selects at most one branch. `while` tests before each iteration. `loop` has no condition. A `for name in start..end` loop evaluates bounds and visits increasing integer values from start inclusive to end exclusive.

An `if` condition and a `while` condition must be `Bool`. Branch and loop bodies establish lexical scopes. An ascending range with a start not less than its end executes zero iterations.

Moving one outer move-only binding inside a repeating loop is rejected when another iteration could observe the moved state. This is a static ownership restriction, not a runtime retry.

## Match

`match` tests arms in source order and executes the first matching expression or wildcard. It is a statement and does not yield a value.

Over an enum with payload variants, the arms are variant patterns, exhaustiveness **is** enforced, and a second arm for a variant an earlier arm already matches is rejected as unreachable. Over an integer or a fieldless enum neither check applies: the scrutinee is not confined to the declared variants there, so matching a subset is legal, duplicate patterns are not rejected, and the earliest matching arm wins.

If no arm matches, the statement performs no arm body. A wildcard matches every value that reaches it and conventionally appears last.

## Control transfer

`return` exits the current function. `break` exits the nearest loop and `continue` advances it. Statements proven to follow unconditional termination are rejected as unreachable.

`break` and `continue` do not carry values and are invalid outside a loop. `return` without a value is valid only for a no-result function. A value-returning function must return its declared type along every reachable path.

## Runtime checks

`expect` checks an optional value for `none` before producing the underlying reference-shaped value. Failure is a runtime termination path, not a catchable exception in 0.1.

Bounds checks, integer overflow, division edge cases, and invalid shifts are not uniformly standardized as recoverable checks. Consult [undefined and implementation-defined behavior](/specification/behavior).

## Observable behavior

Output produced through runtime print functions, process exit status, changes through `inout`, foreign effects consistent with declared contracts, and specified control-flow results are observable. Exact allocation tier, temporary storage, LLVM instruction selection, symbol layout, and optimization transformations are not observable source guarantees unless a page explicitly states otherwise.
