---
title: Arrays, lists, and slices
description: Use fixed stack arrays, owned runtime lists, and bounds-checked list views in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-25"
tags: [arrays, lists, slices, collections, indexing]
related: [language/types, language/ownership-and-borrowing, stdlib/lists]
---

Arrays and lists both store repeated values, but they are different types with different storage, size, and ownership rules. Choose an array when the element count is fixed at construction and stack storage is appropriate. Choose `List<T>` when the sequence must grow or cross runtime ownership boundaries.

## Arrays

An array literal creates a fixed-length stack value. Its type is written `[T]`; length is inferred from the initializer rather than encoded in the type spelling.

```prismio
let values: [Int] = [10, 20, 30]
let matrix: [[Int]] = [[1, 2], [3, 4]]
let first = values[0]
```

Every element in an array literal must have a compatible type. Empty-array inference is not a general substitute for a type annotation, because there is no element from which to infer `T`.

Arrays may be nested. Indexing proceeds one dimension at a time:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let matrix: [[Int]] = [[1, 2], [3, 4]]
    return matrix[1][0] - 3
}
```

The index expression must be `Int`. Prismio does not silently convert `Usize` or another integer width for indexing.

Arrays are copied as values. Copying an array creates a separate value rather than moving its binding, even though some element types may have more restrictive ownership elsewhere. Treat complex combinations conservatively until the memory specification is expanded.

Arrays are copied as values. A function may not return an array created in its own stack frame. Indexing uses an `Int`; out-of-bounds behavior is not yet specified as a stable safety guarantee.

<!-- prismio-check: fail -->
```prismio
fn build() -> [Int] {
    let values = [1, 2, 3]
    return values
}

fn main() -> Int { return 0 }
```

The compiler rejects returning a local stack array because it would escape the frame that owns its storage. Pass a caller-owned destination through an appropriate interface, use a runtime list, or keep array use inside the defining call tree.

The language does not yet promise a portable bounds-check trap for every index. Keep indices in range and do not rely on backend behavior for memory safety.

## Lists

`List<T>` is an owned, heap-backed sequence managed through compiler-known runtime functions.

```prismio
let items: List<Int> = list_new()
list_push(items, 10)
list_push(items, 20)
let count = list_len(items)
let first = list_get(items, 0)
list_set(items, 1, 30)
```

`list_new()` obtains its element type from context, normally the annotated destination. `list_len` returns the current number of elements. `list_push` appends, `list_get` or `items[index]` reads an element, and `list_set` replaces an existing position.

The compiler stores eligible flat struct elements directly in the list's growable backing block.
Pointer-bearing, reference-counted, split, and otherwise ineligible layouts stay boxed. This is an
implementation choice derived from the static `List<T>` type; both modes have the same language
operations and ownership behavior, and neither is a stable C ABI.

For generic code, the choice is made separately for every concrete monomorphized instantiation.
The compiler substitutes `T` before it selects storage, so the same generic function can use inline
operations for a flat struct and boxed operations for a pointer-bearing struct without a runtime
representation branch.

<!-- prismio-check: pass -->
```prismio
fn sum_first_two(values: List<Int>) -> Int {
    return list_get(values, 0) + list_get(values, 1)
}

fn main() -> Int {
    let values: List<Int> = list_new()
    list_push(values, 20)
    list_push(values, 22)
    return sum_first_two(values) - 42
}
```

The ordinary parameter in `sum_first_two` borrows the list, so `main` remains its owner after the call. The runtime list operations are compiler-known built-ins in 0.1; they do not need an importable collection module.

## List ownership

Lists are move-only. Pushing a move-only element transfers ownership into the list; using the original element afterward is an error. `list_get` borrows an owned element in current semantics. There is no literal list syntax, iterator protocol, or importable collections module in 0.1.

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }

fn main() -> Int {
    let items: List<Item> = list_new()
    let item = Item { value: 7 }
    list_push(items, item)
    return item.value
}
```

The insertion transfers `item` into the list, so the final field access is rejected. Reading an owned element with `list_get` follows the current borrow behavior; consuming or extracting owned elements is not exposed as a general iterator/move API.

Replacing an element with `list_set` must respect the element's ownership and runtime destruction
rules. Avoid using a moved source again, and treat any foreign list manipulation as an
ownership-sensitive ABI boundary. In 0.1, reclamation of an overwritten boxed object is
conservative because an earlier borrowed element may still name it; repeated boxed-object
replacement should be treated as an experimental path until element-borrow liveness is enforced.

## Slices

`Slice<T>` is a copyable, non-owning view of a range in a `List<T>`. Create one with an
end-exclusive range. Slicing another Slice composes the offsets rather than copying elements.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let values: List<Int> = list_new()
    list_push(values, 10)
    list_push(values, 20)
    list_push(values, 30)

    let middle: Slice<Int> = values[1..3]
    slice_set(middle, 0, 40)
    let tail = middle[1..2]
    return middle[0] + tail[0] - 70
}
```

`slice_len(view)` returns the view length, `view[index]` reads through it, and
`slice_set(view, index, value)` mutates the underlying list. Mutable Slice operations are explicit
in 0.1. Overlapping slices are permitted in one task; writes through either view are immediately
visible through the other.

A Slice stores the list identity, an offset, and a length—not a pointer into the current element
buffer. Growing the list may move that buffer, but an existing Slice remains valid because each
access resolves the list again. Construction and every access are bounds checked. An invalid range
or stale/out-of-range access terminates with a runtime bounds error rather than reading freed
memory.

The memory analysis keeps the viewed list alive for at least as long as any escaping Slice. A Slice
can therefore be returned from a native Prismio function without a written lifetime. It cannot be
stored directly in a `List` in 0.1 because its three-word descriptor does not fit the boxed list
slot; wrap it in a struct when a collection of views is needed.

Slice is not a C buffer ABI. An `extern fn` parameter or return of `Slice<T>` is rejected until
explicit marshalling exists; copy into a C-compatible buffer at the boundary.

## Bounds and iteration

List and Slice indices use `Int`. Slice ranges and accesses have a defined loud runtime bounds
failure. Direct List indexing uses the runtime's current checked accessor but is not a recoverable
language exception.

There is no `for item in list` protocol. Iterate by index:

```prismio
let mut index = 0
while (index < list_len(values)) {
    println(list_get(values, index))
    index += 1
}
```

For ranges are available for integers, but choose a loop form that matches the exact types returned by the collection operation.

## Feature comparison

| Capability | `[T]` array | `List<T>` |
| --- | --- | --- |
| Storage | stack value | runtime heap allocation |
| Size | fixed by initializer | grows with `list_push` |
| Source literal | yes | no |
| Assignment | copy | move |
| Return local value | rejected | supported under ownership rules |
| Iteration protocol | none | none |
| Index type | `Int` | `Int` |

Programmer-directed SoA data views are experimental. For an eligible flat struct `T`,
`soa(rows)` consumes a `List<T>` into a move-only `DataView<T>`, `data_len(view)` borrows its length,
and `view[index].field` reads or mutates the corresponding column through a checked handle/index
descriptor. Nested flat fields can be mutated as well. `aos(view)` consumes the view and
reconstructs a `List<T>` containing those changes. Extern DataView parameters or returns are
rejected until explicit marshalling exists.

Sorting is in [`std.list`](/stdlib) — `sort` for a `T: Ord`, `sortBy` with a closure comparator, plus
`binarySearch`, `filter` and `mapInto`. `Map<K, V>` is in [`std.map`](/stdlib), written in Prismio
over `List` with an open-addressed table. `Slice<T>` views a list without copying it.

Array slicing, array length in type syntax, list literals, iterators, comprehensions, and sets are
not implemented in the 0.1 language/runtime surface.
