---
title: List runtime
description: Built-in List<T> operations, indexing, mutation, and element ownership in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-30"
tags: [standard-library, list, collections, ownership]
related: [language/arrays-and-lists, language/ownership-and-borrowing, errors/container-ownership, stdlib/map]
---

`List<T>` is the built-in growable sequence type. The list owns its runtime storage and is itself move-only. Use compiler-known functions without importing a module:

```prismio
let values: List<Int> = list_new()
list_push(values, 10)
list_push(values, 20)
let count = list_len(values)
let first = list_get(values, 0)
list_set(values, 1, 30)
```

## Construct a typed list

`list_new()` normally obtains its element type from the destination context:

```prismio
let names: List<String> = list_new()
let points: List<Point> = list_new()
```

`List<T>` is built into the compiler: it has its own type kind, its own runtime, and its own handling in the memory model. That is separate from [generics](/language/generics), which do now exist — `List<T>` predates them and is not an instance of them.

`List<T>` is also the language's growable vector. Its backing block doubles on push, and `list_new_with_capacity(n)` reserves ahead of that growth. Eligible struct elements — flat layouts with no pointer-bearing fields, reference-count header, or hot/cold split — are stored directly in that block. Other element types retain the boxed representation. This choice is made from the list's static element type and does not change source-level ownership rules. There is no separate `Vec<T>` because `List<T>` already supplies the growable-vector role.

## Add and count elements

`list_push(list, element)` appends one compatible element. `list_len(list)` returns the current count as the compiler-known list length type used by 0.1 examples (normally consumed as `Int`).

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let values: List<Int> = list_new()
    list_push(values, 10)
    list_push(values, 20)
    list_push(values, 30)
    return list_len(values) - 3
}
```

The ordinary runtime calls borrow the list owner while mutating its internal sequence as defined by the built-in operation. The list binding remains usable afterward.

## Read and replace

`list_get(list, index)` accesses the element at an `Int` index. `list_set(list, index, value)` replaces an existing position.

```prismio
let first = list_get(values, 0)
list_set(values, 0, 99)
```

Keep indices in `0..list_len(values)`. Invalid-index behavior is not specified as a recoverable exception or one stable checked-access guarantee.

## Ownership of elements

The list itself is move-only. Pushing or setting a move-only element transfers ownership into the container. Borrowed elements cannot be inserted as though the list owned them. Element access participates in AIF and ownership analysis.

<!-- prismio-check: fail -->
```prismio
struct Item { id: Int }

fn main() -> Int {
    let items: List<Item> = list_new()
    let item = Item { id: 7 }
    list_push(items, item)
    return item.id
}
```

The list becomes owner of `item`; the source binding is moved. Current `list_get` behavior borrows an owned element rather than exposing a general move-out operation. Whether the runtime stores an eligible element body inline or keeps a boxed element is not observable as a stable foreign layout.

Replacing an owned element can require destruction of the old value and transfer of the new one. This lifecycle behavior is still evolving enough that ownership-sensitive `list_set` code should be exercised with `--verify`.

## Iterate manually

There is no list iterator protocol. Use an index loop:

```prismio
let mut index = 0
while (index < list_len(values)) {
    println(list_get(values, index))
    index += 1
}
```

`for value in values` iterates the list directly, binding each element in turn. The list is borrowed, so it is still usable afterwards. The collection has to be a **name** — bind the result of a call before iterating it. Where the index itself is wanted, `for i in 0..list_len(values)` is still the form to use. See [control flow](/language/control-flow).

## Passing lists to functions

An ordinary `List<T>` parameter borrows the list. `inout` expresses caller-visible mutable borrowing at a user function boundary. `sink` transfers the entire list owner to the callee.

```prismio
fn count(values: List<Int>) -> Int {
    return list_len(values)
}
```

After `count(values)`, the caller still owns `values`. After a `sink values: List<Int>` call, it does not.

List literals, capacity controls, and an importable collections namespace are not implemented. There is no extensible iterator protocol either: `for x in xs` is a desugaring over `List<T>` and `String`, not a trait a user type can implement. Sorting and slicing do exist — see `std.list` and [slices](/language/arrays-and-lists). A `List<String>` has `parts.join(sep)`, from `std.string`. Overwriting owned elements through `list_set` has evolving destruction behavior; validate lifecycle-sensitive code with `--verify`.

There is also no documented reserve/shrink API, remove/pop operation, list comprehension, immutable persistent list, or stable foreign layout for `List<T>`.

## Sorting

`std.list` adds the algorithms that need an order, which is to say the ones that were unwritable
before [bounded generics](/language/traits): a generic body may only use operations that typecheck
for every type it is instantiated at, and before `T: Ord` that set did not include comparison.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.list

fn main() -> Int {
    let mut xs: List<Int> = list_new()
    list_push(xs, 5)
    list_push(xs, 1)
    list_push(xs, 4)

    xs.sort()

    println(list_get(xs, 0))
    println(binarySearch(xs, 4))
    return 0
}
```

| Function | Meaning |
|---|---|
| `sort(items)` | In place, ascending by `Ord`. Not stable. |
| `isSorted(items)` | Whether the list is already in order. |
| `binarySearch(items, needle)` | The index of `needle` in a sorted list, or `-1`. |

`sort` is a three-way quicksort — median-of-three, insertion sort under a cutoff of 12, and
recursion on the smaller partition with iteration on the larger, which bounds stack depth at
O(log n) whatever the input does.

**Three-way rather than two-way is a correctness property, not a tuning.** A two-way partition on a
list of equal elements advances its store index never and recurses on n-1, so sorting 10 000 equal
values is 50 million comparisons. The Dutch-flag partition puts every equal element in the middle
band and both recursive ranges come back empty — the same input is one linear pass.

`Ord` comes from `std.ord`, which implements it for every integer type, `Char`, `Float` and
`String`. A user type sorts once it has an `impl Ord`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.list
import std.ord

struct Version {
    major: Int,
    minor: Int
}

impl Ord for Version {
    fn cmp(self, other: Self) -> Int {
        if (self.major != other.major) { return cmp(self.major, other.major) }
        return cmp(self.minor, other.minor)
    }
}

fn main() -> Int {
    let older = Version { major: 1, minor: 9 }
    let newer = Version { major: 2, minor: 0 }
    println(cmp(older, newer))
    return 0
}
```

**`Float`'s order is not total and `std.ord` does not pretend otherwise.** NaN compares as neither
less nor greater, so `cmp` answers 0 for it — the answer "equivalent" gets. A sort over data
containing NaN therefore has an unspecified order rather than a corrupted one; it will not read out
of bounds and it will not loop.

## Higher-order

With [closures](/language/closures), the list algorithms that take a function:

| Function | Meaning |
|---|---|
| `sortBy(items, order)` | In place, under a caller's comparator. No `Ord` needed on the element type. |
| `filter(items, keep)` | A new list of the elements the predicate keeps. Requires `T: Copy`. |
| `mapInto(items, out, f)` | `f` applied to every element, appended to `out`. |
| `countWhere(items, keep)` / `anyOf` / `allOf` | Predicate queries. |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.list
import std.ord
import std.copy

fn main() -> Int {
    let mut xs: List<Int> = list_new()
    list_push(xs, 3)
    list_push(xs, 9)
    list_push(xs, 1)

    sortBy(xs, |a: Int, b: Int| b - a)
    println(list_get(xs, 0))

    let big = filter(xs, |v: Int| v > 2)
    println(list_len(big))
    println(countWhere(xs, |v: Int| v % 2 == 1))
    return 0
}
```

`sort` is one line on top of `sortBy`:

```text
fn sort<T: Ord>(items: List<T>) {
    sortBy(items, |a: T, b: T| cmp(a, b))
}
```

That closure is written inside a generic body with `T` for its parameter types — substitution
rewrites them to the concrete types before the closure is lowered, and each instantiation gets its
own closure type.

**`mapInto` takes its destination rather than returning one**, and that is forced rather than
stylistic: a `map` returning `List<U>` would have to solve `U` from the closure's *return* type, and
Prismio solves a type parameter from argument types only. Writing it explicitly is no escape either
— a closure's type has no spelling. Putting the destination in argument position puts `U` where it
can be solved.
