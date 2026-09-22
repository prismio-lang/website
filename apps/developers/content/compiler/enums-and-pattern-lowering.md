---
title: Enums and pattern lowering
description: How Prismio represents fieldless and payload enums, checks exhaustive matches on payload enums, and lowers payload ownership safely.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [enums, pattern-matching, lowering]
related: [compiler/semantic-analysis-and-types, compiler/ownership-and-drop-lowering, llvm/types-and-abi, compiler/generics-and-monomorphization]
---

An enum with payloads has a problem an integer doesn't: a `Node(Tree, Int,
Tree)` variant owns two subtrees and an `Int`, but an `Empty` variant owns
nothing, and both are the same declared type. The compiler has to pick one
memory layout that fits every variant, make `match` prove every reachable case
was handled, and make sure destroying a value only releases the fields the
*active* variant actually has — releasing an inactive variant's fields would
free memory that was never allocated. `src/sema/enums.psm` is where that
happens: it validates variants, payload construction, inference, matching, and
exhaustiveness, and the AST (abstract syntax tree) keeps variant identity and
payload bindings around for later ownership and lowering passes.

## See it work: a recursive enum with a null representation

<!-- prismio-check: pass -->
```prismio
import std.io

enum Tree { Empty, Node(Tree, Int, Tree) }

fn sum(t: Tree) -> Int {
    match (t) {
        Tree.Empty => { return 0 }
        Tree.Node(l, v, r) => { return sum(l) + v + sum(r) }
    }
    return -1
}

fn main() -> Int {
    let t = Tree.Node(Tree.Empty, 5, Tree.Node(Tree.Empty, 3, Tree.Empty))
    println(sum(t))
    return 0
}
```

```bash
prismio build tree.psm -o tree.ll
```

The generated struct is one tag plus one field per payload slot across every
variant, laid out once and shared:

```text
%Tree = type { i32, i32, ptr, ptr }
```

But `Tree.Empty`, when it appears as a `Tree`-typed field of another `Node`,
is not a heap-allocated struct with tag `1` at all — it is a plain null
pointer, stored directly:

```text
  %2 = alloca %Tree, align 8
  %3 = getelementptr inbounds nuw %Tree, ptr %2, i32 0, i32 0
  store i32 2, ptr %3, align 4, !tbaa !8
  %4 = getelementptr inbounds nuw %Tree, ptr %2, i32 0, i32 2
  store ptr null, ptr %4, align 8, !tbaa !9
```

The tag `2` (`Node`) is stored at field 0, and the left-child field (field 2)
gets a literal `null` — that store is the entire representation of the
`Tree.Empty` passed as this `Node`'s left child. Nothing was allocated for it.

And reading the tag back out of a `Tree` parameter, inside `sum`, doesn't load
a discriminant field — it tests the pointer against null and *derives* the tag
from that:

```text
  %1 = load ptr, ptr %t.0, align 8
  %2 = icmp eq ptr %1, null
  %3 = select i1 %2, i32 1, i32 2
```

Null maps to tag `1` (`Empty`), a non-null pointer to tag `2` (`Node`) — the
same tags the construction site above used, recovered from the pointer
instead of read from a field. This is the **null representation**: an eligible empty variant costs nothing
to construct and nothing to store, because the enum's own pointer slot already
has a spare bit pattern — null — that no real value uses. It only applies
today to a two-variant recursive enum with one empty leaf, which is exactly
the `Tree` shape above; other enums always materialize a tagged struct with a
real discriminant field.

## What failure looks like

A `match` over a **payload** enum must handle every variant or carry a `_`
wildcard arm — omitting one is an error that names exactly what's missing:

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

fn main() -> Int { return area(Shape.Circle(2)) }
```

```bash
prismio check shape_incomplete.psm
```

```text
error[P4001]: this match does not cover Dot, Rect of `Shape`; add the missing arms or a `_` arm
 --> shape_incomplete.psm:8:11
  |
8 |     match (s) {
  |           ^
error: aborting due to 1 previous error
```

**Exhaustiveness checking applies to payload enums only.** A *fieldless* enum
(`enum Color { Red, Green, Blue }`) still matches as a plain integer — the
scrutinee isn't confined to the declared variants at the type level — so a
`match` covering only some of its variants compiles and simply performs no
arm action for the values it doesn't list. That gap is deliberate, not a bug,
but it means a fieldless enum gaining a new variant will not tell you where
you forgot to handle it; a payload enum will.

A second arm that repeats a variant an earlier arm already matched is
unreachable and is also rejected:

<!-- prismio-check: fail -->
```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}

fn area(s: Shape) -> Int {
    match (s) {
        Shape.Dot => { return 0 }
        Shape.Circle(r) => { return 3 * r * r }
        Shape.Circle(q) => { return q }
        Shape.Rect(w, h) => { return w * h }
    }
    return -1
}

fn main() -> Int { return area(Shape.Circle(2)) }
```

```text
error[P4001]: this arm is unreachable: an earlier arm already matches `Circle`
  --> shape_dup.psm:11:9
   |
11 |         Shape.Circle(q) => { return q }
   |         ^^^^^
error: aborting due to 1 previous error
```

Arms are tested in source order, so the first match always wins; a repeated
variant can never run.

## Fieldless and payload representation

Fieldless enums use an integer-like representation selected by the compiler.
Payload enums carry a tag and storage sized for their largest variant — the
current layout gives every variant's payload its own separate fields rather
than overlapping them, as the `Tree` struct above shows (`i32, i32, ptr, ptr`,
one pair of fields per variant, not one shared pair). Overlapping them would
need a different size/layout proof; a future tagged-*union* optimization
belongs in this desugaring transform, not in every consumer of it.
Representation details are implementation artifacts, not a stable persistence
or foreign ABI (application binary interface).

Tags are one-based: `enumVariantTag` returns the declaration index plus one,
because zero is reserved by other compiler node/type conventions. In the
`Tree` example, `Empty` (declared first) is tag `1` and `Node` (declared
second) is tag `2` — matching the `select i1 %2, i32 1, i32 2` above.

## If you are changing this

### Desugaring to a tagged struct

Payload enums are lowered to struct-shaped declarations before ordinary
semantic analysis runs, so every later pass only has to understand structs.
`enumHasPayload` separates fieldless enums from variants carrying values.
`enumPayloadField(variant, index)` generates a collision-free internal field
name. `enumVariantNode` and `enumVariantTag` retrieve the declaration and the
stable numeric tag described above.

`enumShadowPush` retains the source enum for variant lookup after desugaring;
`enumShadowFind` retrieves it. `enumDesugarToStruct` builds the tagged
product: the first field is `$tag`, followed by one collision-free field for
every payload slot of every variant. `enumTypeAnnotation`, `enumFieldNamed`,
and `enumPayloadSlot` construct those nodes. `enumDesugarModule` replaces each
non-generic payload enum while keeping its original declaration reachable on
the shadow chain.

### Construction and generic inference

`enumResolveConstruction` validates a constructor, finds its source variant,
checks payload arity, and rewrites it to a generated struct literal
containing `enumTagLiteral` plus fields built by `enumLiteralField`.
`enumExplicitArgs` retrieves explicit type arguments when present.

For generic enums, `enumSolveArgs` and `enumSolveOneArg` infer template
arguments from payload arguments, and `enumConcreteName` requests the
matching concrete specialization before the struct literal is emitted.
Inference must agree across every occurrence of a type parameter — one
payload cannot infer `T = Int` while another infers `T = String` for the same
construction.

### Match checking

`semaMatchPayloadArms` validates the scrutinee and analyzes every arm.
`semaCheckPayloadArm` checks the variant name, payload arity, binder types,
and arm body. `enumArmVariantName` and `enumArmBinders` decode the pattern
node. Payload bindings receive the type and ownership relationship of the
selected variant.

`semaCheckExhaustive` requires all variants unless `semaMatchHasWildcard`
finds a wildcard. `semaMatchCoversTag` tests coverage, while
`semaTagCoveredBefore` and `semaCheckDuplicateArms` reject repeated or
unreachable variant arms — the two failures demonstrated above.

### LLVM lowering and teardown

`generateStatement` emits a switch on the hidden tag (or, for an eligible null
representation, the derived tag shown above). `beginArmReuse` may reuse the
scrutinee's storage when AIF (Adaptive Inference Framework) and ownership
analysis prove the arm reconstructs the same enum safely. `generatePayloadBinders`
exposes only the selected variant's fields after control enters that arm — a
move-only payload read this way produces a view of the enum's storage, and
moving it changes which later destruction actions remain legal, since
destruction must act only on the fields the active variant actually owns.

`enumNullVariantTag` selects a null tag only for a two-variant recursive enum
with one empty leaf — the shape this page's worked example uses.
`ir_enum_reserve_null`, `ir_enum_set_null_tag`, and `ir_enum_tag` implement
that encoding. Generated release helpers use field-disposition information so
inactive payload fields are never treated as live owners that need releasing.

### What to test

A change here needs tests covering constructor rewriting, concrete generic
names, tag values, payload field layout, wildcard and duplicate-arm behavior,
null encoding, moves from payload binders, arm reuse, early returns from
arms, generated release behavior, and observable values — not just the tag
switch in isolation.
