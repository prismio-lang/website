---
title: Enums and pattern lowering
description: How Prismio represents fieldless and payload enums, checks exhaustive matches, and lowers payload ownership safely.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [enums, pattern-matching, lowering]
related: [compiler/semantic-analysis-and-types, compiler/ownership-and-drop-lowering, llvm/types-and-abi]
---

`src/sema/enums.psm` validates variants, payload construction, inference, matching, and
exhaustiveness. The AST retains variant identity and payload bindings for ownership and lowering.

## Fieldless and payload enums

Fieldless enums use an integer-like representation selected by the compiler. Payload enums carry a
tag and storage sufficient for their largest variant. Representation details are implementation
artifacts and are not a stable persistence or foreign ABI.

The compiler can use a null representation for eligible variants when that preserves the enum's
semantic states and ownership. Reserved null encodings and invalid payload combinations are covered
by focused tests.

## Pattern checking

A match must cover every reachable variant unless a wildcard handles the remainder. Duplicate or
unreachable arms are diagnosed. Payload bindings receive the type and ownership relationship of
the selected variant.

## Lowering and destruction

IR lowering tests the discriminant, enters the selected block, exposes payload fields, and joins
result or continuation control flow. Destruction must act only on the active payload. Reading a
move-only payload can create a view of the enum container; moving it changes which later
destruction actions remain legal.

Tests should combine exhaustiveness, payload ownership, null variants, nested matches, and returns
from arms rather than validating only the tag switch.

## Enum semantic representation

`enumHasPayload` separates fieldless enums from variants carrying values.
`enumPayloadField(variant, index)` generates a collision-free internal field name.
`enumVariantNode` and `enumVariantTag` retrieve the declaration and stable numeric tag.

Payload enums are lowered to struct-shaped declarations before ordinary semantic analysis.
`enumShadowPush` retains the source enum for variant lookup, while `enumShadowFind` retrieves it.
`enumDesugarToStruct` builds a tagged product: the first field is `$tag`, followed by one
collision-free field for every payload slot of every variant. `enumTypeAnnotation`,
`enumFieldNamed`, and `enumPayloadSlot` construct those nodes. `enumDesugarModule` replaces
each non-generic payload enum while keeping its original declaration on the shadow chain.

Tags are one-based. Zero is reserved by other compiler node/type conventions, so
`enumVariantTag` returns the declaration index plus one. The current tagged-product layout uses
separate storage for every variant's payload because overlapping them requires a different
size/layout proof. A future tagged-union optimization belongs in this transform rather than in
every consumer.

## Construction and generic inference

`enumResolveConstruction` validates a constructor, finds its source variant, checks payload
arity, and rewrites it to a generated struct literal containing `enumTagLiteral` plus fields built
by `enumLiteralField`. `enumExplicitArgs` retrieves explicit type arguments when present.

For generic enums, `enumSolveArgs` and `enumSolveOneArg` infer template arguments from payload
arguments. `enumConcreteName` requests the matching concrete specialization before the struct
literal is emitted. Inference must agree across every occurrence of a type parameter; one payload
cannot infer `T = Int` while another infers `T = String`.

## Match checking

`semaMatchPayloadArms` validates the scrutinee and analyzes every arm.
`semaCheckPayloadArm` checks the variant name, payload arity, binder types, and arm body.
`enumArmVariantName` and `enumArmBinders` decode the pattern node.

`semaCheckExhaustive` requires all variants unless `semaMatchHasWildcard` finds a wildcard.
`semaMatchCoversTag` tests coverage, while `semaTagCoveredBefore` and
`semaCheckDuplicateArms` reject repeated/unreachable variant arms.

## LLVM lowering and teardown

`generateStatement` emits a switch on the hidden tag. `beginArmReuse` may reuse the scrutinee's
storage when AIF and ownership prove the arm reconstructs the same enum safely.
`generatePayloadBinders` exposes only the selected variant's fields after control enters that arm.

`enumNullVariantTag` currently selects a null tag only for a two-variant recursive enum with one
empty leaf. `ir_enum_reserve_null`, `ir_enum_set_null_tag`, and `ir_enum_tag` implement that
encoding. Generated release helpers use field-disposition information so inactive payload fields
are not treated as live owners.

Tests must inspect constructor rewriting, concrete generic names, tag values, payload field
layout, wildcard and duplicate-arm behavior, null encoding, moves from payload binders, arm reuse,
early returns, generated release behavior, and observable values.
