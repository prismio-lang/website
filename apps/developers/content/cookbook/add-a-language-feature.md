---
title: Add a language feature
description: A complete contributor path for changing Prismio syntax or semantics across tokens, parsing, types, ownership, AIF, LLVM, tests, and docs.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [cookbook, compiler, language]
related: [compiler/frontend, compiler/semantic-analysis-and-types, testing/regression-suite]
---

Begin with the source-level rule and its rejected boundary. Decide whether the change is syntax,
semantics, library behavior, or only an optimization; each has a different earliest owner.

Write three examples before editing: the smallest accepted program, the closest rejected program,
and one interaction with an existing feature. These become the positive test, negative diagnostic,
and regression boundary. If the proposed behavior can be expressed entirely in `std/*.psm`, it is a
library change and should not add a token or AST node.

## Implementation path

1. Add tokens in `src/lexer/token.psm` and scanner behavior only when new vocabulary is required.
2. Add the smallest parser production and recovery boundary under `src/parse`.
3. Extend AST nodes or semantic types without storing backend-only LLVM details.
4. Resolve names, types, overloads, and flow in `src/sema`.
5. Define moves, borrows, drops, capture, container, and call behavior.
6. Teach AIF about new allocation sites, aliases, escapes, fields, or thread edges.
7. Lower the semantically resolved form under `src/ir`.
8. Extend the runtime or LLVM bridge only when ordinary Prismio or existing IR operations cannot
   express the capability.

## Concrete entry points

New punctuation or keywords begin in `src/lexer/token.psm`; `scan()` in `scanner.psm` must produce
the token with file, line, column, and length. Route the grammar through `parseDeclaration()`,
`parseStatement()`, or Pratt-style `parseExpression()`. Use `parserNodeFrom()` to preserve the
opening token's span and parser helpers for expected-token diagnostics and synchronization.

AST representation belongs in `src/ast/nodes.psm` and `types.psm`. Add serialization to
`src/ast/dump.psm` when the node survives parsing: the AIF oracle consumes `dump-ast`, so an omitted
field can make the independent model analyze a different program.

Semantic order matters. Named types are registered before function predeclaration; function bodies
are checked by `semaFunction()`, expressions by `semaExpr()`, and statements by
`semaStatement()`. Reuse `semaTypesMatch()`, `semaExpectAssignable()`, overload resolution, and flow
helpers. Do not encode a source validity rule only in `src/ir`: `prismio check` deliberately stops
before code generation.

Memory semantics need an explicit answer for every operand and result: copy, borrow, mutable borrow,
consume, alias, or produce. Update the ownership visitor and AIF walk for allocations, points-to
edges, returns, container retention, and thread transfer. Check the resulting site with
`prismio aif --manifest` and `--why`, not merely the tier total.

Lower the resolved node with `generateExpression()` or `generateStatement()` and existing `ir_*`
builder operations. Module-wide constructs also need declaration staging in `generateModule()` or
`generateFunction()`. A new LLVM bridge function requires matching Prismio extern declaration,
handle validation, C wrapper implementation, and bridge test.

## Proof

Add focused positive and negative tests, multiple-error recovery where applicable, ownership and
AIF cases, native execution, and artifact assertions for representation claims. Generic features
need multiple specializations and a recursion/coherence boundary. Platform-facing features need
the supported target matrix.

Run the test once with the last known-good generation and once with the candidate. If the compiler
compiles itself differently, use the fixed-point gate to determine whether the difference stabilizes
or keeps moving. A feature is not complete while `dump-ast`, `check`, native build, and the relevant
analysis command disagree about it.

Update the language documentation and if user-visible and this developer portal for implementation
behavior. Reserved syntax alone must never be labeled implemented.
