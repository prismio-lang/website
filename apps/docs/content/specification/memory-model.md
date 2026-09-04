---
title: Memory and ownership model
description: Formal draft rules for Prismio 0.1 moves, borrows, drops, list slices, collections, arrays, and AIF allocation tiers.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-25"
tags: [specification, memory-model, ownership, aif]
related: [language/ownership-and-borrowing, compiler/aif, specification/behavior]
---

This page specifies the compiler-enforced ownership model and the experimental allocation strategy layered beneath it. It does not define a general source-level reference calculus.

## Value categories

Strings, lists, and nominal struct values are move-only. Each owned value must have one active owner at a program point. Optional wrappers around these owned reference-shaped values preserve the ownership category. Scalars, raw pointer values, fieldless enums, arrays, and Slice descriptors use copy semantics in 0.1.

Copying a copy value leaves both source and destination usable. Moving a move-only value transfers responsibility to the destination and changes the source binding to the moved state.

## Ownership transfer and borrowing

An ordinary function parameter borrows a move-only argument for the call. `inout` creates a mutable borrow for the call. `sink` transfers ownership to the callee. Assignment into an owned aggregate or `list_push` may also transfer ownership. A moved binding may not be read, moved, or dropped again.

An ordinary borrow is read-only with respect to ownership: the callee cannot destroy or retain the owner as if it had been transferred. `inout` permits caller-visible mutation during an exclusive call-scoped borrow. Prismio source has no `&` or first-class reference value.

Moving into a struct field or owning list makes that aggregate responsible for the value. Reading an owned list element through `list_get` follows the current borrow behavior; a general move-out iterator is not specified.

## Destruction and scope exit

`drop(x)` consumes an owned move-only value and triggers the management action selected for its allocation. A borrowed value and a copy-only value are not valid operands of `drop`.

At normal scope exit, supported owned values not already moved or dropped receive the cleanup required by current lowering and runtime strategy. A conforming implementation must not destroy one ownership instance twice.

Exceptional unwinding is absent because the language has no implemented exception model. Foreign non-local control transfer lies outside compiler guarantees unless separately specified.

## Control-flow restrictions

Moving an outer binding inside a loop is rejected when a later iteration could use an already moved value. Returning a locally allocated array is rejected because its storage belongs to the function frame.

The analysis is intentionally conservative where a repeating or escaping path cannot preserve one-owner state. This version does not claim a complete flow-sensitive alias calculus or user-visible lifetime inference theorem.

## Optional values

Optional `T?` uses a null representation for absence. `expect` checks for null before producing the underlying reference-shaped value. Optionality changes nullability, not ownership.

Comparison with `none` does not refine the static type along a branch. The program must still call `expect`. Calling `expect(none)` enters a defined runtime failure path.

## Arrays and stack storage

Arrays are fixed stack values whose source type is `[T]`. Their assignment behavior is copy-based in 0.1. A local array cannot be returned because its storage would escape the function frame. Bounds behavior is not yet standardized as a guaranteed checked-access abstraction.

## List views and Slice lifetime

A `Slice<T>` is represented by the identity of a `List<T>`, an offset, and a length. It never
stores an interior pointer into the list's growable element block. Reallocation therefore cannot
strand a Slice; each access resolves the current block through the list identity.

Slice construction, nesting, reads, and explicit `slice_set` writes are range checked. Overlapping
mutable slices are allowed within one task. This model promises memory safety, not a Rust-style
no-aliasing guarantee.

The analysis applies the view escape rule: if a Slice escapes a scope, the underlying list's escape
is raised to at least the same extent. Returning a Slice can therefore change the list's allocation
tier instead of producing a lifetime error. A pin may still turn that tier change into a diagnostic.

## Foreign boundaries

Extern contracts describe borrowing, retention, consumption, output storage, aliased return, or produced ownership. The compiler relies on those declarations. If foreign code violates them, language-level analysis cannot preserve its guarantees.

`Slice<T>` is not currently a foreign ABI type. Extern parameters and returns using it are rejected
because the compiler does not yet materialize a contiguous C-compatible copy.

Raw `Ptr` values copy as pointer-shaped scalars, but copying an address does not create or transfer ownership of the pointed-to storage. Pointer validity, provenance, and dereference occur behind foreign/runtime contracts in 0.1.

## Allocation inference

After semantic ownership checks, experimental AIF classifies allocation sites as stack (`T0`), arena/region (`T1`), unique escaping (`T2`), reference counted (`T3`), or cycle aware (`T4b`). An annotation may constrain but may not unsafely override the analysis. The detailed AIF policy is version 1.2 Draft and is not a stable cross-compiler contract.

`unique`, `pin(Tn)`, named regions, and region byte budgets add assertions or constraints. A refuted constraint is a compile-time error. A budget is not a process-wide memory limit and does not automatically include opaque foreign allocation.

Runtime `--verify` instrumentation can detect supported allocation/free lifecycle violations in tests. It neither changes a statically illegal program into a valid one nor proves arbitrary foreign code safe.

## Non-goals in 0.1

The language has no arbitrary user-defined references, borrow blocks, user lifetime parameters,
user destructors, weak references, user allocator protocol, concurrency memory ordering, atomics,
or formal data-race model. `Slice<T>` is the one first-class bounded collection view. The ownership
model is useful and enforced within its implemented scope, but should not be described as a
finalized proof of universal leak freedom.
