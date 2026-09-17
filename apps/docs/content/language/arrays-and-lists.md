---
title: Arrays, vectors, and slices
description: Fixed stack arrays, the growable Vec<T>, and bounds-checked slices in Prismio 0.1 — which to choose, how each is owned, and how to view part of one.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [arrays, vec, slices, collections, indexing]
related: [language/types, language/ownership-and-borrowing, stdlib/vec]
---

Arrays and vectors both store repeated values, with different storage, size and ownership rules. Choose an array when the element count is fixed at construction and stack storage is appropriate. Choose `Vec<T>` when the sequence must grow or outlive the function that builds it.

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

The full method list — `push`, `insert`, `pop`, `removeAt`, `contains`, `sort` and the rest — is on the [Vec page](/stdlib/vec).

**Storage follows the element type.** Scalars, `String`s and structs with no pointer-bearing fields live directly in the Vec's block; everything else is stored as one pointer per element. The choice is made per concrete type when the program is compiled, including inside generic code, and it changes nothing about how the Vec is used. Neither layout is a stable C ABI.

## Vec ownership

A Vec is move-only, and it owns its elements. `push` moves a value in, so the name it came from cannot be used again:

<!-- prismio-check: fail -->
```prismio
import std.vec

struct Item { value: Int }

fn main() -> Int {
    let items: Vec<Item> = []
    let item = Item { value: 7 }
    items.push(item)
    return item.value
}
```

`items[0]` is a view of the element, not a copy. Methods that hand an element out — `pop`, `removeAt`, `get` — return a copy instead, so they need `T: Copy`.

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

`slice_len(view)` returns the view's length, `view[index]` reads through it, and `slice_set(view, index, value)` writes to the underlying Vec. Overlapping slices are permitted in one task; a write through either is visible through the other.

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

| | `[T]` array | `Vec<T>` |
| --- | --- | --- |
| Storage | stack value | heap block |
| Size | fixed by the initializer | grows with `push` and `insert` |
| Literal | `[1, 2, 3]` | `[1, 2, 3]` where a `Vec` is expected |
| Assignment | copy | move |
| Returned from a function | rejected | yes |
| `for x in …` | no | yes |
| Index type | `Int` | `Int` |

## DataView

Programmer-directed SoA data views are experimental. For an eligible flat struct `T`, `soa(rows)` consumes a `Vec<T>` into a move-only `DataView<T>`, `data_len(view)` borrows its length, and `view[index].field` reads or mutates the corresponding column through a checked handle-and-index descriptor. Nested flat fields can be mutated as well. `aos(view)` consumes the view and rebuilds a `Vec<T>` containing those changes. An `extern fn` taking or returning a DataView is rejected until explicit marshalling exists.

Array slicing, an array's length in its type, comprehensions and sets are not in the 0.1 surface. Sized arrays and chunked vectors are planned.
