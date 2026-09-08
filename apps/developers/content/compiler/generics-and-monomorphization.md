---
title: Generics and monomorphization
description: How Prismio discovers generic instantiations, substitutes concrete types, validates bounds, and emits specialized code.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [generics, monomorphization, compiler]
related: [compiler/traits-impls-and-dispatch, compiler/semantic-analysis-and-types, aif/layout-selection]
---

Prismio specializes generic functions, structs, enums, traits, and implementations for concrete
type arguments. There is no single erased generic body that discovers element layout at runtime.

`src/sema/generics.psm` validates arity, substitutes types, tracks requested instantiations, and
prevents an unbounded specialization chain. Specialized bodies then pass through ordinary semantic
analysis, ownership checking, AIF, and code generation.

## Why ordering matters

Bounds are checked where the concrete arguments are known. Method and operator rewrites must resolve
against the specialized receiver and applicable implementations. An eligible `List<Flat>`
specialization can therefore use inline element storage while another instantiation remains boxed.

Instantiation identity must include every type argument that affects semantics or representation.
Deduplication prevents duplicate emission; recursion detection distinguishes a valid recursive call
to an existing specialization from generation of an ever-growing type sequence.

## Tests

The suite covers generic functions and aggregates, inherent generic implementations, generic trait
implementations, trait arguments, where clauses, blanket implementations, coherence, associated
items, and nonterminating instantiation rejection. A change to substitution or identity should add
both a success case and a case that would collide under an incomplete specialization key.

## Template collection and identity

`monoCollectTemplates` walks the merged module and separates generic functions, structs, enums,
traits, and implementation blocks from declarations ready for analysis. `monoIsTemplate`
classifies declarations; `monoFindTemplate` and `monoFindTypeTemplate` retrieve them.
`monoAppendDeclaration` adds a generated specialization to the same module so later sema, AIF,
and IR passes see an ordinary concrete declaration.

Names use `monoSeparator()`, currently `$`, plus a complete encoding of applied arguments.
`monoMangledName` produces that identity, while `semaMangleType` produces linkage fragments for
resolved types. `monoSeparatorCount` and `monoArgsTooDeep` guard runaway recursive expansion;
`monoElide` shortens diagnostic presentation without shortening the actual identity.

## Substitution

`monoCopyOne` and `monoCopyChain` deep-copy the AST portions a specialization will mutate.
`monoParamCount`, `monoParamAt`, `monoParamName`, and `monoParamIndex` interpret the encoded
parameter list. `monoSubstituteChain` walks annotations and expressions, and
`monoSubstituteInto` replaces each matching type parameter with a copied concrete annotation.
The template AST must remain unchanged so a second specialization starts from original syntax.

`monoAnnotationFromType` converts an already resolved semantic type back into an annotation used
by a generated declaration. This is necessary when inference, rather than explicit syntax,
discovers a type argument.

## Instantiation functions

`monoInstantiateStruct` validates arity, builds the specialization key, returns an existing
declaration when cached, or copies/substitutes/appends a new concrete struct.
`monoResolveGenericCall` considers function templates at a call site.
`monoTemplateAcceptsCall` and `monoSolveTypeParam` infer arguments by matching formal
annotations against actual argument `TypeInfo` values. `monoMatchParam` recursively matches
nested applied types rather than only top-level names.

After solving, `monoCheckBounds` evaluates every required trait reference.
`monoCheckOneBound` reports one stable diagnostic per failed parameter/bound combination.
`monoImplApplies`, `monoImplBoundsHold`, and `monoImplements` determine whether a concrete or
generic implementation satisfies the applied trait, including trait type arguments.

## Traits, defaults, and associated types

`monoExpandDefaultMethods` copies a trait default into implementation blocks that do not provide
the member. `monoExpandOneImpl`, `monoImplDeclaresMethod`, and `monoAddDefaultMethod` preserve
the target's generic context and create the same method record shape as a written implementation.

`monoResolveProjections` resolves associated type expressions after implementation applicability
is known. `monoFindAssocType`, `monoImplAssocTypeAnnotation`, and `monoConstraintsHold`
select the concrete associated annotation. Resolution cannot happen during parsing because the
applicable implementation depends on substituted type arguments and bounds.

## What reaches later passes

There is no erased generic body. A concrete specialization has concrete field types, parameter
types, symbol name, method records, and ownership behavior. Sema checks it as an ordinary
declaration; AIF can select layout per specialization; LLVM emits a distinct function or named
struct. An eligible `List<Flat>` may therefore use inline storage while `List<Owned>` uses an
owning representation.

Tests must cover explicit and inferred arguments, nested types, repeated cache hits, overloads,
recursive templates, generic impl applicability, blanket/concrete overlap, multiple bounds,
trait arguments, default methods, associated projections, distinct symbols, and a specialization
whose layout differs from another instantiation.
