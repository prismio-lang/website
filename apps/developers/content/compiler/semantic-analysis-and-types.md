---
title: Semantic analysis and types
description: The semantic passes that resolve Prismio names, types, overloads, calls, fields, flow, and program validity.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [semantics, types, overloads]
related: [compiler/imports-and-symbols, compiler/ownership-and-drop-lowering, compiler/generics-and-monomorphization]
---

`src/sema/checker.psm` coordinates semantic analysis. Supporting modules divide builtins, types,
symbols, generics, enums, ownership, and flow so that each rule has one primary owner.

## Responsibilities

Semantic analysis resolves declarations and lexical scopes, assigns expression types, selects exact
overloads, validates fields and enum variants, checks calls, and establishes whether control flow
returns or becomes unreachable. It also invokes ownership checks before code generation.

Prismio does not rely on broad implicit numeric promotion. Width and signedness are part of a
numeric type, and casts must be explicit where the source and destination differ. Overload
selection therefore uses concrete argument types rather than a general conversion ranking.

## Builtins and rewrites

`src/sema/builtins.psm` owns operations that look call-shaped in source but lower as compiler
operations. Methods, operators, iteration, and selected standard-library behavior can be rewritten
to ordinary calls before overload resolution. The diagnostic should name the source-level action
the developer attempted, including a missing import when the rewrite depends on a standard module.

## Flow facts

`src/sema/flow.psm` tracks returns, unreachable statements, loop behavior, and facts used by
safe lowering. A successful semantic pass is the contract presented to AIF and LLVM generation.
Backend code should not silently reinterpret an unresolved or invalid AST node.

New rules need a positive example, a focused rejection, and a multiple-error test when recovery or
continued checking is expected.

## Analysis order

`analyzeModule` is the semantic entry point. Its ordering is part of the contract:

1. reset semantic type/symbol state and index top-level declarations;
2. collect generic templates and predeclare concrete functions and globals;
3. expand trait default methods and required generic specializations;
4. validate implementation coherence, orphan rules, members, and supertrait cycles;
5. synthesize dynamic trait-object structs and resolve opaque `impl Trait` returns;
6. analyze function bodies, globals, workloads, and expressions;
7. run ownership/extern-contract checks; and
8. leave a resolved `TypeInfo` on every expression that may reach AIF or IR generation.

Moving body analysis before predeclaration breaks forward calls and mutual recursion. Running
trait-object synthesis before conformance is known can create a vtable layout for an invalid
implementation. Backend code assumes this order already succeeded.

## Expression and statement functions

`semaExpr(module, expr)` is the central dispatcher. It handles literal types, identifier lookup,
unary/binary operators, calls, members, indexing, casts, optionals, arrays, lists, structs,
closures, dynamic values, and builtins. It returns a `TypeInfo` and stores that same resolved type
on the node.

`semaStatement` checks one statement against the enclosing function's expected return type.
`semaBlock` manages scope and analyzes its chain. `semaFunction` creates the parameter scope,
validates the body, checks return behavior, and then closes the scope.
`semaPredeclareFunction` and `semaPredeclareGlobal` establish names before bodies execute.

`semaTypeErrorAt` compares the expected and actual `TypeInfo` and formats a source-level
diagnostic. `typeEquals` is structural for applied built-ins/generics and nominal where the
language requires identity. `typeDisplay` is for humans; `typeSemKey` is for semantic caches;
`typeIrKey` is for lowering. These strings have different stability requirements and must not be
used interchangeably.

## Builtins and source rewrites

`semaBuiltinCallType` returns the result type for compiler-known operations.
`semaCheckBuiltinCall` validates arity, receiver/element types, mutation, ownership, and special
constraints. The set includes list, slice, DataView, string, task, channel, optional, and selected
numeric operations.

Source sugar is rewritten before final overload resolution:

- `semaStringComparison` and `semaStringConcatChain` route string operators to supported
  operations while preserving one evaluation of each operand;
- `semaForEachDesugar` and `semaForEachIterator` turn iteration syntax into explicit iterator
  operations;
- `semaPropertyRewrite` converts supported property-style access to a call; and
- `semaBecomeCall` replaces an expression node with the resolved call shape without discarding
  its source span.

When a rewrite depends on a standard module, `semaStringSugarAvailable` diagnoses the missing
import at the source operator rather than exposing an internal helper symbol.

## Flow and program validity

`semaBlock` also invokes flow checks. `semaStmtDiverges` identifies returns, breaks, continues,
fully diverging `if` chains, and unbroken infinite `loop` statements. `semaBlockDiverges` walks a
block until one statement prevents fall-through. The private `semaBlockHasBreak` and
`semaIfHasBreak` helpers keep a `loop` with any reachable structured break from being classified
as divergent. These answers drive definite-return and unreachable-code diagnostics.

`semaTaskResultAllowed` and `semaSpawnArgAllowed` keep task ABI values within implemented
representations. `semaCheckUniqueArgs` prevents one uniquely consumed value from being passed
twice in a call. `semaCheckExternContracts` validates FFI ownership annotations only after types
and parameter positions are known.

A semantic change is complete only when it defines accepted and rejected types, coercions, source
span ownership, overload interaction, flow behavior, ownership mode, generic specialization,
dynamic dispatch behavior, AIF visibility, and the exact resolved form presented to codegen.
