---
title: Arrays, vectors, and slices
description: Fixed stack arrays, the growable Vec<T>, and bounds-checked slices in Prismio 0.1 — which to choose, how each is owned, and how to view part of one.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [arrays, vec, slices, collections, indexing]
related: [language/types, language/ownership-and-borrowing, stdlib/vec]
---

Arrays and vectors both store repeated values, with different storage, size and ownership rules. Choose an array when the element count is fixed at construction and stack storage is appropriate. Choose `Vec<T>` when the sequence must grow or outlive the function that builds it.

## Arrays

An array is a fixed number of elements stored in the function's own frame. Its full type is `Array<T, N>`: the element type and the length.

```prismio
let buffer: Array<U8, 64>             // 64 slots, every one 0
let exact: Array<Int, 3> = [1, 2, 3]  // the length is checked against the values
let values: [Int] = [10, 20, 30]      // shorthand: the length comes from the values
```

- **`Array<T, N>` without an initializer** reserves `N` slots, each starting at the element type's zero: `0`, `0.0`, `false`, the first variant of an enum. The element type has to have a zero, so `Array<String, 4>` is refused; use a `Vec` for elements that own memory.
- **`[T]` and `Array<T>` are shorthand** for an array whose length comes from its initializer, so they need one. `let a: [Int]` on its own is an error that suggests `Array<Int, N>`.
- **A written length has to match** the initializer, and be a positive whole number. It can be written in hex: `Array<U8, 0x100>`.

Inside a loop body, a zero-filled array starts at zero again on every iteration.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let counts: Array<Int, 4>
    counts[2] = 7
    let sized: Array<Int, 3> = [1, 2, 3]
    let inferred: [Int] = [4, 5]
    return counts[0] + counts[2] + sized[2] + inferred[1] - 15
}
```

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let values: [Int]
    return 0
}
```

Arrays may be nested. Indexing proceeds one dimension at a time, and the index expression must be `Int` — Prismio does not silently convert `Usize` or another width for indexing.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let matrix: [[Int]] = [[1, 2], [3, 4]]
    return matrix[1][0] - 3
}
```

### Replacing an element

An element is replaced by assigning through its index when the element owns nothing: a number, `Bool`, `Char`, `Ptr` or an enum without payloads. The store writes into the array's own storage. An integer literal takes the element's type, as it does in a `let`.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let grid: [[Int]] = [[1, 2], [3, 4]]
    grid[1][0] = 30
    let wide: Array<I64, 2>
    wide[0] = 4294967296
    return grid[1][0] - 30
}
```

An array whose elements own memory refuses the store, because nothing would release the value it replaces. Use a `Vec` for those.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let names: [String] = ["a", "b"]
    names[0] = "c"
    return 0
}
```

### Copies and views

An array whose length is known is a value. `let b = a` gives `b` storage of its own and copies the elements; `d = c` copies `c`'s elements into `d`, and the two lengths have to be equal.

A parameter written `[T]` takes an array of any length, and it is a **view** of the caller's array, not a copy: a store through it is the caller's, and so is a store through a name bound from it. Because its length is not known, it cannot be copied into an `Array<T, N>`.

<!-- prismio-check: pass -->
```prismio
fn clear(xs: [Int]) {
    xs[0] = 0
}

fn main() -> Int {
    let a: [Int] = [1, 2, 3]
    let b = a
    b[0] = 9
    clear(a)
    return a[0] + b[0] - 9
}
```

Two kinds of array are **shared** by a second binding rather than copied, until copying them is supported:

- **An array of arrays.** `let g = grid` names the same rows, so `g[0][0] = 5` changes `grid` too.
- **An array whose elements own memory**, such as `[String]`. Its elements cannot be replaced through an index, so the sharing is never visible.

### Returning and storing arrays

A function may not return an array created in its own frame, and a written length is accepted only where a local array is declared — not on a parameter, a return type or a struct field. Both need arrays to be passed and stored by value, which is planned.

<!-- prismio-check: fail -->
```prismio
fn build() -> [Int] {
    let values = [1, 2, 3]
    return values
}

fn main() -> Int { return 0 }
```

Pass a caller-owned array to a `[T]` parameter and fill it there, or use a `Vec` when the data must outlive the function.

The language does not yet promise a portable bounds-check trap for every array index. Keep indices in range and do not rely on backend behavior for memory safety.

## Vec

`Vec<T>` is the growable vector: one contiguous, owned block that doubles as it fills. Build one with a literal, change it with its methods, and read it by index or with `for`.

<!-- prismio-check: pass -->
```prismio
import std.vec

fn sumFirstTwo(values: Vec<Int>) -> Int {
    return values[0] + values[1]
}

fn main() -> Int {
    let values: Vec<Int> = [20]
    values.push(22)
    return sumFirstTwo(values) - 42
}
```

The literal takes its element type from where it is written, so `[]` is an empty `Vec<Int>` above and an empty `Vec<String>` somewhere else. The parameter in `sumFirstTwo` borrows the Vec, so `main` still owns it after the call.

A `Vec` binding with no initializer starts empty: `let items: Vec<Item>` is `let items: Vec<Item> = []`, as `Array<T, N>` on its own is zeroed slots.

The full method list — `push`, `insert`, `pop`, `removeAt`, `contains`, `sort` and the rest — is on the [Vec page](/stdlib/vec).

**Storage follows the element type.** Scalars, `String`s and structs with no pointer-bearing fields live directly in the Vec's block; everything else is stored as one pointer per element. The choice is made per concrete type when the program is compiled, including inside generic code, and it changes nothing about how the Vec is used. Neither layout is a stable C ABI.

## Vec ownership

A Vec is move-only, and it owns its elements. `push` moves a value in, so the name it came from cannot be used again:

<!-- prismio-check: fail -->
```prismio
import std.vec

struct Item { value: Int }

fn main() -> Int {
    let items: Vec<Item>
    let item = Item { value: 7 }
    items.push(item)
    return item.value
}
```

`items[0]` is a view of the element, not a copy. Methods that hand an element out — `pop`, `removeAt`, `get` — return a copy instead, so they need `T: Copy`.

`items[i] = x` replaces an element. Storing a view — `items[i] = items[j]`, or `others.push(items[0])` — puts one element in two slots. That is allowed, and it changes how the element's type is stored: the compiler counts references to it from then on, so each slot's release is safe. Store `copyOf(items[j])` instead when two independent values are what you want.

Removing an element that another name still views is safe: a removed element that owns memory is released with the Vec, not at the removal. See [removing an element another name still reads](/stdlib/vec#removing-an-element-another-name-still-reads).

## Slices

`Slice<T>` is a copyable, non-owning view of a range in a `Vec<T>`. Create one with an end-exclusive range. Slicing another Slice composes the offsets rather than copying elements.

<!-- prismio-check: pass -->
```prismio
import std.vec

fn main() -> Int {
    let values: Vec<Int> = [10, 20, 30]

    let middle: Slice<Int> = values[1..3]
    slice_set(middle, 0, 40)
    let tail = middle[1..2]
    return middle[0] + tail[0] - 70
}
```

`slice_len(view)` returns the view's length, `view[index]` reads through it, and `view[index] = value` — or `slice_set(view, index, value)` — writes to the underlying Vec. Overlapping slices are permitted in one task; a write through either is visible through the other.

A Slice stores the Vec's identity, an offset and a length — not a pointer into the element block. Growing the Vec may move that block, and an existing Slice stays valid because each access finds the block again. Construction and every access are bounds checked: an invalid range or an out-of-range access stops the program with a bounds error instead of reading freed memory.

The memory analysis keeps the viewed Vec alive at least as long as any Slice of it, so a Slice can be returned from a function without a written lifetime. A Slice cannot be stored directly in a Vec, because its three-word descriptor does not fit a boxed slot; wrap it in a struct to keep a collection of views.

A Slice is not a C buffer. An `extern fn` taking or returning `Slice<T>` is rejected until explicit marshalling exists; copy into a C-compatible buffer at the boundary.

## Bounds and iteration

Indices are `Int`.

- **A Slice checks every access** and stops the program on an out-of-range index.
- **A Vec does not.** `values[i]` outside `[0, length)` answers the element type's zero. Check `values.length` first, or use `values.get(i)`, which answers `Option.None` for a missing element.

`for x in values` visits each element in order and borrows the Vec, which stays usable afterwards. The Vec has to be a name: bind a call's result first. When the index matters, loop over the range:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let values: Vec<Int> = [3, 4, 5]
    for v in values {
        println(v)
    }
    for i in 0..values.length {
        println(i * values[i])
    }
    return 0
}
```

## Choosing

| | `Array<T, N>` / `[T]` | `Vec<T>` |
| --- | --- | --- |
| Storage | the function's frame | heap block |
| Size | fixed: written as `N`, or taken from the initializer | grows with `push` and `insert` |
| Literal | `[1, 2, 3]` | `[1, 2, 3]` where a `Vec` is expected |
| Without values | `Array<T, N>`, zero-filled | `[]` |
| Assignment | copy (a `[T]` parameter is a view) | move |
| Returned from a function | rejected | yes |
| `for x in …` | no | yes |
| Index type | `Int` | `Int` |

## DataView

Programmer-directed SoA data views are experimental. For an eligible flat struct `T`, `soa(rows)` consumes a `Vec<T>` into a move-only `DataView<T>`, `data_len(view)` borrows its length, and `view[index].field` reads or mutates the corresponding column through a checked handle-and-index descriptor. Nested flat fields can be mutated as well. `aos(view)` consumes the view and rebuilds a `Vec<T>` containing those changes. An `extern fn` taking or returning a DataView is rejected until explicit marshalling exists.

## Not available yet

These are not in Prismio 0.1. Each is planned, and this page will say so when one ships.

| Missing | Use today |
| --- | --- |
| **Arrays by value across functions** — returning an array, an array field in a struct, a parameter of one fixed length (`xs: Array<Int, 4>`) | fill a caller's array through a `[T]` parameter, or use a `Vec<T>` |
| **Copying an array of arrays** (today a second binding shares its rows) | copy row by row into an `Array<T, N>` |
| **Slices of arrays** — `Slice<T>` views a `Vec<T>` only | index the array directly, or build a `Vec<T>` |
| **Bounds checks on array indexing** | keep indices in range; a `Slice` checks every access |
| **Chunked vectors** — `Vec<T, N>` and `Vec<T, Chunk>`, whose elements never move as they grow | `Vec<T>` |
| **A moving `pop`/`removeAt`** — handing the element out rather than a copy, so a `T` without `Copy` can be popped | read the last element with `v[v.length - 1]`, then `truncate` |
| **`VecDeque<T>`**, a double-ended queue | a `Vec<T>` used as a stack, or with a moving head index |
| **Sets** — `Set<T>` / a hash set | `Map<T, Bool>` from [std.map](/stdlib/map) |
| **A sorted map** (B-tree) | `Map<K, V>`, sorting its keys when order matters |
| **A priority queue** (binary heap) | a `Vec<T>` kept sorted with `sort`, or scanned for the minimum |
| **A linked list** | `Vec<T>`, or an enum with a payload for a recursive structure |
| **Comprehensions** (`[x * 2 for x in xs]`) | a loop that pushes into a `Vec<T>` |

There is deliberately no `[T; N]` spelling: `Array<T, N>` is how a length is written.
