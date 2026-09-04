---
title: Traits and bounds
description: Prismio traits -- generic trait declarations, structural trait arguments, impl Trait for Type, and bounds checked statically at instantiation.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-02"
tags: [traits, bounds, generics, impl, Self]
related: [language/methods, language/generics, language/functions]
---

A trait names a set of method signatures. A type implements it with an `impl` block,
and a generic declaration can require it with a bound.

<!-- prismio-check: pass -->
```prismio
import std.io

trait Ord {
    fn cmp(self, other: Self) -> Int
}

impl Ord for Int {
    fn cmp(self, other: Int) -> Int {
        if (self < other) { return 0 - 1 }
        if (self > other) { return 1 }
        return 0
    }
}

fn maxOf<T: Ord>(a: T, b: T) -> T {
    if (cmp(a, b) >= 0) { return a }
    return b
}

fn main() -> Int {
    println(maxOf(3, 9))
    return 0
}
```

## A trait is a check, not a dispatch mechanism

This is the fact that explains every other rule on this page. Prismio specializes a
generic **before** type checking reaches its body, so by the time a bound matters the
concrete type is already known. `maxOf<T: Ord>` instantiated at `Int` is a function
whose body calls `cmp(Int, Int)`, and that call is resolved by
[ordinary overload resolution](/language/functions) against what `impl Ord for Int`
wrote.

So a trait does exactly two jobs:

1. **The bound.** At each instantiation, the compiler asks whether the type argument
   has an `impl` of the named trait. If not, the call is an error.
2. **Conformance.** At each `impl Trait for Type`, the compiler asks whether every
   signature the trait declares has a matching method.

Nothing is looked up at run time and a trait emits no code — **for a bound**.
That is the default and it is what the rest of this page describes.

`dyn Trait` is the deliberate exception: it defers the choice to run time and is
the one construct here that does emit a vtable. It is opt-in, spelled at the use
site, and covered under [Trait objects](#trait-objects) below. `impl Trait`, by
contrast, looks like it might defer and does not — it names one concrete type the
compiler knows, and stays statically dispatched.

## Declaring a trait

A trait body holds `fn` signatures with no bodies. A default method body is not
accepted -- it is a real feature a later release may want, and silently dropping one
would be worse than rejecting it.

```text
trait Name {
    fn method(self, argument: Type) -> Type
    fn other(self) -> Type
}
```

`Self` in a signature stands for the implementing type. It is substituted once per
`impl`, which is the only thing a trait signature is ever read for.

A trait may declare type parameters. Its applications are structural: `From<Int>`
and `From<Bool>` are distinct traits for bounds, conformance, and coherence, even
though both come from the declaration named `From`.

<!-- prismio-check: pass -->
```prismio
import std.string

trait From<T> {
    fn from(value: T) -> Self
}

impl From<Int> for String {
    fn from(value: Int) -> String {
        return strFromInt(value)
    }
}

fn make<U: From<Int>>(value: Int) -> U {
    return from(value)
}

fn main() -> Int {
    let text = make<String>(7)
    return strLength(text) - 1
}
```

Trait arguments may themselves be applied types, as in `Convert<List<Int>>`.
Every application must supply exactly the parameters declared by the trait.

## Implementing a trait

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

trait Label {
    fn describe(self) -> String
}

struct Version {
    major: Int,
    minor: Int
}

impl Label for Version {
    fn describe(self) -> String {
        return strFromInt(self.major).concat(".", strFromInt(self.minor))
    }
}

impl Label for Int {
    fn describe(self) -> String {
        return strFromInt(self)
    }
}

fn announce<T: Label>(value: T) {
    println(describe(value))
}

fn main() -> Int {
    announce(Version { major: 1, minor: 4 })
    announce(7)
    return 0
}
```

The methods in an `impl Trait for Type` block are lowered exactly like the methods in
a plain [`impl` block](/language/methods): each becomes a top-level function whose
first parameter is the receiver. `impl Trait for Type` adds only the *claim* that the
type satisfies the trait, and the check that it does.

Conformance is local to that exact impl block. A same-named inherent method or
free function elsewhere remains callable through ordinary overload resolution,
but it does not satisfy a missing trait requirement.

A concrete `(trait, type)` pair may be implemented once. A duplicate is rejected
at the later impl with a note pointing to the first; different traits for one
type and one trait for different types remain independent.

An impl may bind parameters before the trait name. Its structural target and
trait arguments decide whether it applies, and its bounds must hold for the
concrete arguments. An impl parameter may be constrained by either side, so
`impl<T> From<T> for String` is valid even though `T` is absent from the target:

<!-- prismio-check: pass -->
```prismio
trait Positive {
    fn positive(self) -> Bool
}

impl Positive for Int {
    fn positive(self) -> Bool { return self > 0 }
}

trait Readable {
    fn read(self) -> Int
}

struct Box<T> {
    value: T
}

impl<T: Positive> Readable for Box<T> {
    fn read(self) -> Int {
        if (positive(self.value)) { return 1 }
        return 0
    }
}

fn readAny<T: Readable>(value: T) -> Int {
    return read(value)
}

fn main() -> Int {
    return readAny(Box<Int> { value: 7 }) - 1
}
```

Coherence compares applicability, not just spelling. A generic
`impl<T> Trait for Box<T>` overlaps `impl Trait for Box<Int>`, and
`impl<T> From<T> for String` overlaps `impl From<Int> for String`; both are
rejected with a note at the first impl. Two concrete target specializations such
as `Box<Int>` and `Box<Bool>` are disjoint. So are two applications such as
`ScaleBy<Int>` and `ScaleBy<Bool>` for the same target. Bounds do not prove two
impls disjoint: a type may implement both bounds, so two otherwise-overlapping
implementations remain an error.

`Self` works in an `impl` block too, and means the same thing:

```text
impl Ord for String {
    fn cmp(self, other: Self) -> Int { ... }   // `other: String`
}
```

A missing method is reported at the `impl`, not at the call site that needed it:

<!-- prismio-check: fail -->
```prismio
trait Ord {
    fn cmp(self, other: Self) -> Int
}

impl Ord for Int {
    fn unrelated(self) -> Int {
        return 1
    }
}

fn main() -> Int {
    return 0
}
```

## Default methods

A trait method may carry a body. An `impl` that omits the method inherits that
body; an `impl` that writes the method overrides it.

<!-- prismio-check: pass -->
```prismio
import std.string

trait Greet {
    fn name(self) -> String
    fn greet(self) -> String { return "hello ".concat(name(self)) }
}

impl Greet for Int {
    fn name(self) -> String { return "int" }
}

fn main() -> Int {
    return strLength(greet(1)) - 9
}
```

Inside a default, `Self` is the implementing type and the trait's own arguments
are substituted, so one body serves every implementation. A default may call the
trait's other methods on `Self`.

A default does not make a method optional in the other direction: a signature
written without a body must still be implemented, and a trait that mixes the two
reports only the ones that are genuinely missing.

## Bounds

Write one bound after a colon or combine several with `+`:

```text
fn sort<T: Ord>(items: List<T>)
fn keep<T: Ord + Copy>(value: T) -> T
fn pair<K: Key + Copy, V>(key: K, value: V)
```

A bound list applies to generic structs and enums as well as functions. Every
bound is checked at the instantiation, which is the point where the type argument
is known. An unbounded parameter beside a bounded one is fine -- the bounds belong
to the parameter, not to the declaration.

<!-- prismio-check: pass -->
```prismio
trait Scored {
    fn score(self) -> Int
}

trait Enabled {
    fn enabled(self) -> Bool
}

impl Scored for Int {
    fn score(self) -> Int { return self * 2 }
}

impl Enabled for Int {
    fn enabled(self) -> Bool { return self > 0 }
}

fn activeScore<T: Scored + Enabled>(value: T) -> Int {
    if (enabled(value)) { return score(value) }
    return 0
}

fn main() -> Int {
    return activeScore(7) - 14
}
```

A type argument that does not implement the bound is an error at the use site, because
the template is not the thing that is wrong:

<!-- prismio-check: fail -->
```prismio
trait Ord {
    fn cmp(self, other: Self) -> Int
}

impl Ord for Int {
    fn cmp(self, other: Int) -> Int {
        return 0
    }
}

struct Point {
    x: Int
}

fn maxOf<T: Ord>(a: T, b: T) -> T {
    if (cmp(a, b) >= 0) { return a }
    return b
}

fn main() -> Int {
    let p = Point { x: 1 }
    let q = Point { x: 2 }
    return maxOf(p, q).x
}
```

## `impl Trait`

`impl Trait` is a type in two positions, and it means something different in each.

### In a parameter: the type parameter you did not write

`fn describe(v: impl Show)` means `fn describe<T: Show>(v: T)`. It lowers to
exactly that, so the **caller** chooses the type and each call is compiled against
the type it passed. Use it when the parameter's type is named once and never
referred to again -- if you need to name it, in a second parameter or a return
type, write the type parameter instead.

Several bounds work with `+`, and a written type parameter may sit beside an
`impl Trait` one.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

trait Show {
    fn show(self) -> String
}

struct Point { x: Int, y: Int }

impl Show for Point {
    fn show(self) -> String { return "P".concat(strFromInt(self.x)) }
}

fn describe(v: impl Show) -> String {
    return v.show()
}

fn main() -> Int {
    println(describe(Point { x: 3, y: 4 }))
    return 0
}
```

### In a return type: one concrete type you cannot name

`fn make() -> impl Show` promises a type that implements `Show` without saying
which. Here the **body** chooses, and it chooses once: every `return` in the
function must produce the same type.

This is not a trait object. The compiler knows the concrete type and the call is
dispatched statically, so an `impl Trait` return costs nothing at run time.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

trait Show {
    fn show(self) -> String
}

struct Point { x: Int, y: Int }

impl Show for Point {
    fn show(self) -> String { return "P".concat(strFromInt(self.x)) }
}

fn origin() -> impl Show {
    return Point { x: 0, y: 0 }
}

fn main() -> Int {
    println(origin().show())
    return 0
}
```

Two `return`s that name different types is an error, because the construct
describes one type. That is what `dyn Trait` is for -- see below.

<!-- prismio-check: fail -->
```prismio
import std.io

trait Show {
    fn show(self) -> String
}

struct A { x: Int }
struct B { y: Int }

impl Show for A { fn show(self) -> String { return "a" } }
impl Show for B { fn show(self) -> String { return "b" } }

fn pick(flag: Bool) -> impl Show {
    if (flag) { return A { x: 1 } }
    return B { y: 2 }
}

fn main() -> Int {
    println(pick(true).show())
    return 0
}
```

### Choosing between them

| you want | write |
|---|---|
| the caller picks the type | `impl Trait` in a parameter, or `<T: Trait>` |
| the body picks one type, statically dispatched | `impl Trait` in the return type |
| one function to return several types | `dyn Trait` |

### Limits in 0.1

- The concrete type behind a return-position `impl Trait` has to be apparent in
  the `return` itself: a struct literal, or a call to a function whose return
  type is written out.
- The opacity is not yet enforced against the caller. The dispatch is static and
  correct, but naming the concrete type at a call site is not currently rejected.
- `impl Trait` is a type only in those two positions. A struct field or a local
  binding is an error.

## Trait objects

A bound is resolved when the concrete type is known. A **trait object** defers
that: `dyn Shape` is any type implementing `Shape`, and which implementation runs
is decided when the call happens.

A `dyn Shape` is **two words** — the value's address and a pointer to the vtable
for its type — rather than a header word stored inside the value. Nothing has to
be allocated or modified to be used as one, so a plain struct on the stack can be
passed as `dyn Shape` without changing its layout. Vtable entries are 4-byte
offsets relative to the table, which halves it against 8-byte pointers and keeps
it read-only.

A `dyn Shape` is **borrowed**: its two words point at storage the caller owns for
the duration of the call. That is why it may be a parameter and not a struct
field, a binding, a return type, or a type argument — each of those outlives the
call, and would leave a pointer into a dead frame.

<!-- prismio-check: pass -->
```prismio
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

// Compiled once, and works for implementations written after it.
fn measure(s: dyn Shape) -> Int {
    return area(s)
}

fn main() -> Int {
    return measure(Square { side: 3 }) + measure(Rect { w: 2, h: 5 }) - 19
}
```

A concrete value is accepted wherever an object is expected; there is nothing to
write at the call site.

### An object is a borrow

`dyn Shape` may appear **as a parameter and nowhere else** — not a struct field,
not a return type, not a binding, not a type argument. An object is a pair of the
value and its method table, built where it is passed, and anything outliving that
call would hold a pointer into a frame that has returned.

```text
error: `dyn Shape` cannot be a struct field: a trait object is a borrow
       and cannot outlive the call it is passed to
  note: take it as a parameter, or use a bound -- `fn f<T: Trait>(v: T)` --
        for a value you need to keep
```

For a value you need to keep, use a bound. Owned objects, which would let one be
stored or returned, are not in this release.

### Which traits can be objects

A trait is usable as `dyn` when each of its methods can be one row of one table.
Two shapes cannot:

- **A method mentioning `Self` away from the receiver.** Through an object the
  concrete type is unknown, so `fn dup(self) -> Self` has nothing to return.
- **A trait with an associated type.** An object would have to fix it at the use
  site, and there is no spelling for that yet.

The receiver itself is exempt: `self` is what the object *is*.

Traits are otherwise unaffected. A trait nobody makes an object of emits no
table, and a type never used dynamically costs nothing — the method table lives
with the object, not inside every value of the type.

## The standard vocabulary

`std` declares the traits that the language itself reaches for. Each is an
ordinary trait — nothing about them is built in — and each lives in its own
module, because there is no prelude.

| module | trait | what it gives you |
|---|---|---|
| `std.eq` | `Eq` | `eq`, and `==` / `!=` on your type |
| `std.ord` | `Ord` | `cmp`, and the relational operators |
| `std.display` | `Display` | `show`, a value's text |
| `std.iter` | `Iterator` | `for ... in` over your own type |
| `std.copy` | `Copy` | a value that may be duplicated |
| `std.key` | `Key` | what `Map` requires of a key |

### Equality and ordering

`==` prefers `Eq` and falls back to `Ord`. A type that can be ordered can always
be compared for equality — `cmp(a, b) == 0` is what equality means for an ordered
type — so implementing `Ord` alone still gives you all six operators. Implement
`Eq` when a type is equatable but has no meaningful order, which is the case the
two traits exist to tell apart.

### Iterating your own type

`for x in it` works over anything implementing `Iterator`:

<!-- prismio-check: pass -->
```prismio
import std.iter

struct Countdown { remaining: Int }

impl Iterator for Countdown {
    type Item = Int
    fn hasNext(self) -> Bool { return self.remaining > 0 }
    fn next(inout self) -> Self.Item {
        self.remaining = self.remaining - 1
        return self.remaining
    }
}

fn main() -> Int {
    let mut c = Countdown { remaining: 3 }
    let mut total = 0
    for x in c {
        total = total + x
    }
    return total - 3
}
```

The loop desugars to exactly the protocol: `while (hasNext(it)) { let x = next(it) … }`.

**`next` takes `inout self`**, so an iterator must be a `mut` binding — advancing
is a mutation and the trait says so. The protocol is `hasNext`/`next` rather than
`next() -> Option<Item>` because a payload enum is not yet a tagged union, and the
conventional spelling would put a value per element in the innermost part of every
loop.

`Countdown` has no backing collection, which is the point: this protocol covers
streams and generators, not just things that could be indexed.

## Operators

Comparing two structs routes through `Ord`. Implement it, and all six comparison
operators work on that type:

<!-- prismio-check: pass -->
```prismio
import std.ord

struct Version { major: Int, minor: Int }

impl Ord for Version {
    fn cmp(self, other: Self) -> Int {
        if (self.major < other.major) { return 0 - 1 }
        if (self.major > other.major) { return 1 }
        if (self.minor < other.minor) { return 0 - 1 }
        if (self.minor > other.minor) { return 1 }
        return 0
    }
}

fn main() -> Int {
    let a = Version { major: 1, minor: 2 }
    let b = Version { major: 1, minor: 9 }
    if (a < b) { return 0 }
    return 1
}
```

`a < b` becomes `cmp(a, b) < 0`. Equality routes through `Eq` where it is
implemented and falls back to `Ord` where it is not, so an ordered type gets all
six operators from one `impl`.

Comparison on primitives is unchanged and remains a machine instruction. A struct
with no `Ord` implementation still cannot be compared, and the diagnostic says
what would change that.

## Blanket implementations

An implementation may be written over a type parameter, covering every type that
satisfies its bounds. This is how one trait is given to everything that already
implements another, written once.

<!-- prismio-check: pass -->
```prismio
trait Show { fn show(self) -> Int }
trait Pretty { fn pretty(self) -> Int }

impl<T: Show> Pretty for T {
    fn pretty(self) -> Int { return show(self) * 2 }
}

struct Dog { n: Int }

impl Show for Dog {
    fn show(self) -> Int { return self.n }
}

fn main() -> Int {
    return pretty(Dog { n: 0 })
}
```

A type outside the bounds is simply not covered — using it where the trait is
required is the ordinary unsatisfied-bound error.

A blanket implementation overlaps every concrete implementation of the same
trait, and the pair is refused. Choosing between them would require deciding that
the more specific one wins, which this release does not do.

## Where an implementation may be written

This is the **orphan rule**. A module may implement a trait for a type when it
declares one of the two: the trait, or the type. Implementing someone else's trait for your own type is the
ordinary case, and so is implementing your own trait for a built-in type.

An implementation whose trait *and* type are both foreign is refused. Two
modules could each write it, neither could see the other, and the conflict would
only appear in some third program that imported both — at which point neither
author can fix it without breaking the other.

```text
error: this module declares neither `ScaleBy<Int>` nor `String`,
       so it may not implement one for the other
```

A built-in type is owned by nobody, so implementing a trait for `Int` or
`String` requires that the trait be yours. Inherent `impl` blocks name only a
type and are not covered by this rule.

## Ownership in a trait

A parameter's ownership convention is part of the trait's contract, not a
detail each implementation chooses. A trait that declares `sink self` obliges
every implementation to consume the receiver, and generic code behind the bound
is entitled to rely on it.

<!-- prismio-check: pass -->
```prismio
struct Buffer { n: Int }

trait Consume {
    fn consume(sink self) -> Int
}

impl Consume for Buffer {
    fn consume(sink self) -> Int { return self.n }
}

fn main() -> Int {
    return Consume.consume(Buffer { n: 0 })
}
```

An implementation that takes the parameter differently is rejected, and the
diagnostic names the convention rather than claiming the method is missing:

```text
error: parameter `self` is `sink` in the trait, and a borrow
  note: the trait declares the convention here
```

This applies to `sink` and `inout` alike. Return-position contracts
(`produce`, `alias`) are not yet compared.

## Naming a trait's method

A method belongs to the trait that declared it. Two traits may each declare the
same method for one type, and a call names the trait to say which is meant:

<!-- prismio-check: pass -->
```prismio
struct Dog { n: Int }

trait Loud { fn speak(self) -> Int }
trait Soft { fn speak(self) -> Int }

impl Loud for Dog { fn speak(self) -> Int { return 1 } }
impl Soft for Dog { fn speak(self) -> Int { return 2 } }

fn main() -> Int {
    let d = Dog { n: 0 }
    return Loud.speak(d) + Soft.speak(d) - 3
}
```

The qualifier is only needed when the call would otherwise be ambiguous. Where a
single trait declares the method for that receiver, `speak(d)` and `d.speak()`
both resolve without one.

An ambiguous call is an error rather than a silent choice, and the diagnostic
names the spellings that would resolve it:

```text
error: ambiguous call to `speak`: more than one overload matches these arguments
  note: name the trait: write `Loud.speak(...)` or `Soft.speak(...)`
```

A qualifier restricts the call to that trait's methods rather than preferring
them, so naming a trait that does not declare the method is an error instead of
falling back to one that does.

## Associated types

A trait may own a type as well as constants. The trait names it, each
implementation chooses it, and a signature refers to the choice by projecting
through the parameter: `T.Item`.

<!-- prismio-check: pass -->
```prismio
import std.string

trait Container {
    type Item
    fn size(self) -> Int
}

struct Bag { n: Int }

impl Container for Bag {
    type Item = Int
    fn size(self) -> Int { return self.n }
}

fn itemOf(c: Bag) -> Int { return c.n }

fn pick<T: Container>(c: T) -> T.Item {
    return itemOf(c)
}

fn main() -> Int {
    return pick(Bag { n: 0 })
}
```

The projection is resolved at the instantiation, where the concrete type is
known, so one generic signature serves every implementation and each one gets
its own choice. Projections work in parameter position as well as return
position; a type parameter cannot be *solved* from a projection, so something
else in the signature has to determine it.

`type` is contextual, not reserved. It is an ordinary identifier everywhere
else, and is only a declaration inside a trait or `impl` body.

### Equality constraints

A bound may fix the associated type, narrowing it to implementations that made
one particular choice:

```text
fn intOnly<T: Container<Item = Int>>(c: T) -> Int
```

A type whose implementation chose something else does not satisfy the bound, and
the diagnostic names the constraint that failed rather than claiming the trait is
unimplemented.

## Associated constants

A trait may own constants. The trait states the name and type; each
implementation supplies the value; a use names the type.

<!-- prismio-check: pass -->
```prismio
import std.string

trait Bounded {
    let MAX: Int
    fn current(self) -> Int
}

struct Gauge { n: Int }

impl Bounded for Gauge {
    let MAX: Int = 100
    fn current(self) -> Int { return self.n }
}

fn main() -> Int {
    return Gauge.MAX - 100
}
```

`let` is the same word the language uses for an immutable binding and for a
module-level constant; an associated constant is that idea owned by a trait
rather than by a module, so it needs no keyword of its own.

The value is checked against the declared type at the `impl` that wrote it, and
an implementation that omits a constant is incomplete in the same way as one
that omits a method.

An associated constant does not enter the global value namespace. It is reached
only through its type, so two types may declare the same constant name without
colliding, and the bare name is not in scope.

## Supertraits

A trait may require others. `trait Described: Named` means every type
implementing `Described` must also implement `Named`, and the requirement is
checked transitively along the whole chain.

<!-- prismio-check: pass -->
```prismio
import std.string

trait Named {
    fn label(self) -> String
}

trait Described: Named {
    fn detail(self) -> String
}

impl Named for Int {
    fn label(self) -> String { return "int" }
}

impl Described for Int {
    fn detail(self) -> String { return label(self).concat("!") }
}

// A bound on the child gives the parent's methods too: the obligation
// guarantees the implementation exists.
fn describe<T: Described>(value: T) -> String {
    return label(value).concat(detail(value))
}

fn main() -> Int {
    return strLength(describe(1)) - 8
}
```

Join several with `+`, as in `trait Reported: Named + Sized`. The supertrait is
an obligation on the *implementing type*, not an inheritance of methods: each
type writes its own `impl` of the parent, and implementing the child without the
parent is an error at the child's `impl`.

A trait that reaches itself through its supertraits is refused at the
declaration, because the obligation it states would never terminate.

## `where` clauses

The same constraints may be written after the signature instead of inside the
parameter list. `where` is a notation, not a second mechanism: the bounds it
states are the bounds that would have been written with a colon, and a parameter
may use both spellings and get the union.

<!-- prismio-check: pass -->
```prismio
import std.string

trait Show {
    fn show(self) -> String
}

trait Weigh {
    fn weigh(self) -> Int
}

impl Show for Int {
    fn show(self) -> String { return strFromInt(self) }
}

impl Weigh for Int {
    fn weigh(self) -> Int { return self * 2 }
}

fn describe<T>(value: T) -> Int where T: Show + Weigh {
    return strLength(show(value)) + weigh(value)
}

fn main() -> Int {
    return describe(5) - 11
}
```

Clauses are comma-separated, one per parameter, and work on functions, structs,
and `impl` blocks:

```text
fn renderBoth<A, B>(a: A, b: B) -> String where A: Show, B: Show
struct Wrapper<T> where T: Show { inner: T }
impl<T> Boxed for Box<T> where T: Show { ... }
```

Naming a parameter the declaration does not have is an error rather than a
clause that is quietly ignored.

## Sorting a list

Together with [method call syntax](/language/methods), a bounded generic free function
is what `list.sort()` is made of. There is no `impl List<T>`; the receiver reaches the
function through the rewrite, not through the type.

<!-- prismio-check: pass -->
```prismio
import std.io

trait Ord {
    fn cmp(self, other: Self) -> Int
}

impl Ord for Int {
    fn cmp(self, other: Int) -> Int {
        if (self < other) { return 0 - 1 }
        if (self > other) { return 1 }
        return 0
    }
}

fn sortInPlace<T: Ord>(items: List<T>) {
    let n = list_len(items)
    let mut i = 1
    while (i < n) {
        let mut j = i
        while (j > 0 and cmp(list_get(items, j - 1), list_get(items, j)) > 0) {
            let left = list_get(items, j - 1)
            let right = list_get(items, j)
            list_set(items, j - 1, right)
            list_set(items, j, left)
            j = j - 1
        }
        i = i + 1
    }
}

fn main() -> Int {
    let mut xs: List<Int> = list_new()
    list_push(xs, 5)
    list_push(xs, 1)
    list_push(xs, 4)
    xs.sortInPlace()
    println(list_get(xs, 0))
    return 0
}
```

## Not in 0.1

- Generic methods declared by a trait.

Each of these is absent rather than partially present, and the syntax for each is
still free to mean the obvious thing.
