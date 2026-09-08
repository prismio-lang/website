---
title: Traits, impl blocks, and dispatch
description: Prismio trait declarations, implementation applicability, coherence, associated items, impl Trait, and trait objects.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [traits, impl, dispatch]
related: [compiler/generics-and-monomorphization, compiler/closures-and-captures, llvm/functions-and-calls]
---

Traits participate in both compile-time conformance and bounded dynamic dispatch. The implementation
lives primarily in `src/sema/checker.psm`, `generics.psm`, `symbols.psm`, and the IR call
and type lowering paths.

## Applicability and coherence

An `impl` can be concrete or generic. Its bounds are part of applicability. Coherence rejects
overlapping concrete, generic, blanket, and trait-argument implementations, and the orphan rule
limits implementations that belong to neither the current trait nor an owned type.

Traits may have type parameters, multiple bounds, where clauses, supertraits, default methods,
associated constants, and associated types. Projections must resolve before code generation, and
missing or ambiguous associated items are semantic errors.

## Calls

For a known concrete receiver, a trait method resolves through normal specialization and overload
selection. `impl Trait` return positions preserve a statically chosen concrete implementor while
checking the declared bound.

`dyn Trait` introduces a bounded runtime dispatch representation. Object-safety checks reject
uses that require unavailable concrete information, including unsupported associated-type cases or
positions the current implementation cannot represent. AIF must join facts across the possible
implementors of a dynamic call.

The positive suite covers trait objects and `impl Trait`; the negative suite defines the current
object-safety and placement boundaries. Update both when changing dispatch representation.

## Parsing and declaration shape

`parseTraitDecl` records the trait name, generic parameters, supertraits, signatures, default
method bodies, associated constants, and associated types. `parseImplDecl` distinguishes inherent
`impl Type` from `impl Trait for Type`, captures the implementation's own generic parameters
and where-clause bounds, and attaches method/member declarations.
`parseTraitSignature`, `parseAssocConst`, and `parseAssocType` preserve whether a body or
value is required at the declaration site.

`parseImplMethodGenericInfo` combines implementation-level and method-level parameters without
letting one silently shadow the other. `parseImplCheckTarget` and
`parseImplCheckReceiver` reject targets/receivers outside the implemented method model before
semantic conformance tries to interpret them.

## Static applicability and coherence

`semaCheckImplBlocks` drives implementation validation. For each block:

- `semaCheckOrphan` requires an implementation to be owned by an eligible local trait or target;
- `semaImplsOverlap` and `semaFirstOverlappingTraitImpl` detect concrete/generic overlap;
- `semaCheckConformance` finds the declared trait and validates required members;
- `semaCheckTraitMembers` checks methods, associated constants, and associated types;
- `semaCheckSupertraits` proves every required parent trait for the same target; and
- `semaCheckSupertraitCycles` uses `semaTraitReaches` to reject cyclic inheritance.

`semaSignaturesAgree` compares receiver convention, generic substitution, parameters, return
type, optional/applied annotations, and trait arguments. `semaCheckMethodConventions` reports
borrow/`inout`/`sink` mismatches explicitly rather than collapsing them into a generic
signature error.

`monoImplApplies` is the specialization-time counterpart. It matches the target pattern, solves
implementation parameters, and checks bounds. Applicability includes trait arguments:
`impl From<Int> for String` does not satisfy `From<Bool>`.

## Method resolution and static dispatch

`semaFindFunctionOverload` searches visible ordinary functions and method candidates.
`semaBuildTraitMethodIndex` pre-indexes trait methods, while `semaOwningTrait` records which
trait introduced a candidate. Calls are rewritten to an ordinary symbol with an explicit receiver,
then `semaFunctionSymbol` gives the selected concrete linkage name.

For a statically known receiver, LLVM emits a direct `ir_call_end`. Generic bounds are checked at
instantiation, where the concrete type is known; there is no runtime bound lookup on that path.
Default methods are copied into the impl by `monoExpandDefaultMethods`, so their later lowering is
identical to a written method.

## Trait objects and vtables

`semaTraitIsObjectSafe` rejects methods that require an unavailable concrete `Self`, unsupported
generic method behavior, or another representation the dynamic path cannot honor.
`semaBuildDynIfNeeded` coerces an eligible concrete value into a synthesized dynamic record.
`semaEnsureDynStruct` creates that record's data and vtable fields.

`semaDynDispatch` finds the method's stable index through `semaTraitMethodIndex` and rewrites the
call for indirect lowering. In `module.psm`, `generateVtableDeclarations` reserves each table;
`generateOneVtable` finds the applicable implementation with `irFindImplForVtable`, resolves
each function through `irImplMethodSymbol`, and emits `ir_vtable_entry` values.
`generateDynCall` loads the function pointer with `ir_ptr_slot` and finishes the call with
`ir_call_end_indirect`.

Changing trait behavior requires tests for inherent and trait calls, default overrides, applied
trait arguments, multiple bounds, where clauses, blanket/concrete coherence, orphan rejection,
associated values/types, supertraits and cycles, object-safety rejection, vtable order, indirect
calls, ownership of the erased data pointer, and fixed-point symbol stability.
