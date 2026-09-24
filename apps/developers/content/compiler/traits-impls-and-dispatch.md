---
title: Traits, impl blocks, and dispatch
description: How a trait method resolves at compile time when the receiver's type is known, and through a runtime table when it isn't — plus coherence, impl Trait and trait objects.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [traits, impl, dispatch]
related: [compiler/generics-and-monomorphization, compiler/closures-and-captures, llvm/functions-and-calls, compiler/semantic-analysis-and-types, aif/overview]
---

A function that takes "anything implementing `Shape`" has two different ways to compile, and they cost different things. If the compiler knows the concrete type at every call site, it can resolve straight to that type's method — a direct call, free at run time, the same as calling any other function. If it doesn't — a list of mixed shapes, a plugin registered by name — there is no single function to call to. That case needs a runtime table: one row per implementing type, looked up through a shared calling convention. Prismio calls the first case an ordinary trait method call and the second a **trait object** (`dyn Trait`), and this page is about how the compiler builds both, decides which one a given call needs, and where it draws the line on what a table-based call can represent at all.

The implementation lives primarily in `src/sema/checker.psm`, `generics.psm`, `symbols.psm`, and the **IR** (intermediate representation) call and type lowering paths.

## See one function compiled once, dispatching to two types

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

trait Shape {
    fn area(self) -> Int
}

struct Square { side: Int }
struct Rect { w: Int, h: Int }

impl Shape for Square {
    fn area(self) -> Int { return self.side * self.side }
}

impl Shape for Rect {
    fn area(self) -> Int { return self.w * self.h }
}

// Compiled once; works for every implementation, including ones written later.
fn measure(s: dyn Shape) -> Int {
    return area(s)
}

fn main() -> Int {
    let sq = Square { side: 3 }
    let re = Rect { w: 2, h: 5 }
    println(measure(sq))
    println(measure(re))
    return 0
}
```

```bash
prismio run shapes.psm
```

```text
Built shapes
9
10
```

Stopping at IR shows what actually makes this work: one table per (trait, implementing type) pair —

```text
@"vtable$Shape$Square" = private constant [1 x ptr] [ptr @Shape_area__Struct_Square]
@"vtable$Shape$Rect" = private constant [1 x ptr] [ptr @Shape_area__Struct_Rect]
```

— and `measure`'s body loading a function pointer out of whichever table its argument carries, then calling through it rather than calling `Shape_area__Struct_Square` or `Shape_area__Struct_Rect` by name:

```text
define i32 @"measure__Struct_dyn$Shape"(ptr %0) {
entry:
  %s.2 = alloca ptr, align 8
  store ptr %0, ptr %s.2, align 8
  %1 = load ptr, ptr %s.2, align 8
  %2 = getelementptr ptr, ptr %1, i32 0
  %3 = load ptr, ptr %2, align 8
  %4 = getelementptr ptr, ptr %1, i32 1
  %5 = load ptr, ptr %4, align 8
  %6 = getelementptr ptr, ptr %5, i32 0
  %7 = load ptr, ptr %6, align 8
  %8 = call i32 %7(ptr %3)
  ret i32 %8
}
```

`measure(sq)` and `measure(re)` are the same call in the source and the same compiled function; only the vtable pointer riding along inside the `dyn Shape` value differs.

## What a rejected trait object looks like

Not every trait can be turned into an object, and not every position can hold one. Returning a `dyn Trait` is one of the boundaries: the object is a borrow built at the call site, and returning it would hand the caller a pointer into a frame that is about to end.

<!-- prismio-check: fail -->
```prismio
trait Show { fn show(self) -> Int }

struct Dog { n: Int }

impl Show for Dog {
    fn show(self) -> Int { return self.n }
}

fn make() -> dyn Show { return Dog { n: 1 } }

fn main() -> Int { return 0 }
```

```bash
prismio check dyn_returned.psm
```

```text
error[P4001]: `dyn Show` cannot be a return type: a trait object is a borrow and cannot outlive the call it is passed to
 --> dyn_returned.psm:9:14
  |
9 | fn make() -> dyn Show { return Dog { n: 1 } }
  |              ^^^
  note: take it as a parameter, or use a bound -- `fn f<T: Trait>(v: T)` -- for a value you need to keep
error[P4001]: return: expected dyn Show, found Dog
 --> dyn_returned.psm:9:36
  |
9 | fn make() -> dyn Show { return Dog { n: 1 } }
  |                                    ^
error: aborting due to 2 previous errors
```

The note names the fix directly: take the value as a parameter instead of manufacturing one to return, or use a generic bound (`fn f<T: Trait>(v: T)`) when the caller needs to keep the value around rather than only pass it through one call.

**This is a deliberate, currently-permanent scope limit, not a missing feature**: object-safety checks reject a `Self`-returning method, an associated-type trait, a struct field, and a return position, all for the same underlying reason — none of them can be represented by "a data pointer plus one flat table of function pointers, valid for the duration of one call."

## Applicability and coherence

An `impl` can be concrete or generic; its bounds are part of what makes it applicable to a given type. Coherence rejects overlapping concrete, generic, blanket, and trait-argument implementations, and the orphan rule limits implementations to ones that belong to either the current trait or a type this package owns — otherwise two unrelated packages could both legally implement the same foreign trait for the same foreign type, and a program that imports both would have no way to pick.

Traits may declare type parameters, multiple bounds, `where` clauses, supertraits, default methods, associated constants, and associated types. Projections must resolve before code generation; a missing or ambiguous associated item is a semantic error, not a code-generation one.

## Calls

For a receiver whose concrete type is known, a trait method resolves through ordinary specialization and overload selection — the same machinery any other call goes through, just with the receiver rewritten in first. `impl Trait` in a return position preserves one statically-chosen concrete implementor while still checking it against the declared bound.

`dyn Trait` is the exception: it introduces a bounded runtime dispatch representation, and **AIF**, the Adaptive Inference Framework (see [AIF overview](/aif/overview)), has to join allocation facts across every implementor the dynamic call could reach at run time, since it cannot know which one a given call site will carry until then.

## If you are changing dispatch

### Parsing and declaration shape

`parseTraitDecl` records the trait name, generic parameters, supertraits, method signatures, default method bodies, associated constants, and associated types. `parseImplDecl` distinguishes an inherent `impl Type` from `impl Trait for Type`, captures the implementation's own generic parameters and `where`-clause bounds, and attaches its method/member declarations. `parseImplMethodGenericInfo` combines implementation-level and method-level generic parameters without letting one silently shadow the other; `parseImplCheckTarget` and `parseImplCheckReceiver` reject targets and receivers outside the implemented method model before semantic conformance ever tries to interpret them.

**A function with no `self` belongs to its type.** `parseImplDecl` renames one to `Type.name` (`Config.default`), in an inherent `impl` and in a trait's alike, so two types' `default`s never meet in one overload set and neither is callable bare. The IMPL_METHOD record keeps the short name the trait declares in `s1` and the real one in `s2`; `semaFindConformingMethod` matches on the first and looks the function up by the second, and `monoAddDefaultMethod` names an inherited default the same way. `default` is accepted as the name inside an `impl` or `trait` and after `.`. A call `Config.make()` or `Box<Int>.new(5)` reaches `semaTypeFunctionCall` before enum-variant construction: when the qualifier is not a binding and `Type.name` is a declaration or a generic template, the callee becomes that plain name and written type arguments become the call's own. In a generic body, `monoSubstituteChain` turns a type parameter used as a qualifier (`T.default()`) into the concrete type's annotation, which is how `std.default`'s `Default` serves generic code. `Self.name()` is resolved by the parser to the implementing type. A bare call to one reports "unknown function" with a note naming `Type.name` (`semaTypeFunctionOwner`).

### Static applicability and coherence

`semaCheckImplBlocks` drives implementation validation. For each block: `semaCheckOrphan` requires it to be owned by an eligible local trait or target; `semaImplsOverlap` and `semaFirstOverlappingTraitImpl` detect concrete/generic overlap; `semaCheckConformance` finds the declared trait and validates required members; `semaCheckTraitMembers` checks methods, associated constants, and associated types; `semaCheckSupertraits` proves every required parent trait is satisfied for the same target; and `semaCheckSupertraitCycles` uses `semaTraitReaches` to reject cyclic inheritance.

`semaSignaturesAgree` compares receiver convention, generic substitution, parameters, return type, optional/applied annotations, and trait arguments; `semaCheckMethodConventions` reports a borrow/`inout`/`sink` mismatch explicitly rather than folding it into a generic signature error. `monoImplApplies` is the specialization-time counterpart: it matches the target pattern, solves implementation parameters, and checks bounds, including trait arguments — `impl From<Int> for String` does not satisfy a bound asking for `From<Bool>`.

### Method resolution and static dispatch

`semaFindFunctionOverload` searches visible ordinary functions and method candidates; `semaBuildTraitMethodIndex` pre-indexes trait methods, and `semaOwningTrait` records which trait introduced a given candidate. A call is rewritten to an ordinary symbol with an explicit receiver, and `semaFunctionSymbol` then supplies the selected concrete linkage name.

For a statically known receiver, LLVM emits a direct call (`ir_call_end`) — generic bounds are checked at instantiation time, where the concrete type is already known, so there is no runtime bound lookup on this path at all. Default methods are copied into the implementing block by `monoExpandDefaultMethods`, so their later lowering is identical to a method the author wrote out by hand.

### Trait objects and vtables

`semaTraitIsObjectSafe` rejects methods that require an unavailable concrete `Self`, unsupported generic-method behavior, or another shape the dynamic path cannot represent — this is what produced the `dyn Show` rejection above, and also covers an associated-type trait, a `dyn` struct field, and a `dyn` return position. `semaBuildDynIfNeeded` coerces an eligible concrete value into a synthesized dynamic record, and `semaEnsureDynStruct` creates that record's data and vtable fields.

`semaDynDispatch` finds a method's stable index through `semaTraitMethodIndex` and rewrites the call for indirect lowering. In `module.psm`, `generateVtableDeclarations` reserves each table; `generateOneVtable` finds the applicable implementation with `irFindImplForVtable`, resolves each function through `irImplMethodSymbol`, and emits the entries shown above. `generateDynCall` loads the function pointer with `ir_ptr_slot` and finishes the call with `ir_call_end_indirect` — the `call i32 %7(ptr %3)` line in the IR excerpt.

### What is deliberately not implemented yet

Per `KNOWN_ISSUES.md`: trait objects are borrowed-only — storing or returning a `dyn Trait` would need a destructor slot in every vtable, an indirect call on release, and AIF learning a type whose release path it cannot see, none of which exist yet. `dyn Trait<Item = Int>` is refused outright; object safety currently rejects any trait carrying an associated type, `Iterator` included, even though the equality-constraint machinery to pin one at the use site already exists elsewhere. There is no `Drop`-shaped trait — left out on purpose, since it would interact with AIF's release placement and needs its own design pass rather than a line in a trait list.

Changing trait behavior needs tests for: inherent and trait calls, default overrides, applied trait arguments, multiple bounds, `where` clauses, blanket/concrete coherence, orphan rejection, associated values/types, supertraits and cycles, object-safety rejection, vtable order, indirect calls, ownership of the erased data pointer, and fixed-point symbol stability. The positive suite covers trait objects and `impl Trait`; the negative suite defines the current object-safety and placement boundaries — update both together when the dispatch representation changes.
