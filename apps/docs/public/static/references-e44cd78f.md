# References

References in Prismio are a safe, explicit way to alias or share access to a value without transferring ownership. They are the foundation of [Borrowing](./borrowing.md) and enable efficient code that avoids unnecessary copies.

---

## What Is a Reference?

A reference is a **pointer to a value** that the compiler guarantees is always valid (non-null and non-dangling). Unlike raw pointers in C/C++, Prismio references are:

- **Always valid** — they can never be null or point to freed memory
- **Checked at compile time** — the borrow checker validates their use
- **Zero-cost** — they compile down to machine pointers with no overhead

There are two kinds of references:

| Reference   | Syntax    | Access     |
|-------------|-----------|------------|
| Immutable   | `&T`      | Read-only  |
| Mutable     | `&mut T`  | Read/write |

---

## Creating References

Use `&` to create an immutable reference, and `&mut` to create a mutable one:

```prismio
let x = 42
let r = &x           // r: &Int — immutable reference to x

let mut y = 100
let m = &mut y       // m: &mut Int — mutable reference to y
```

---

## Dereferencing

To access or modify the value through a reference, **dereference** it with `*`:

```prismio
let x = 10
let r = &x
println(*r)    // 10 — dereference to get the value

let mut y = 20
let m = &mut y
*m = 99        // modify through the reference
println(y)     // 99
```

### Auto-Deref

In practice, Prismio automatically dereferences references when calling methods or accessing fields — you rarely need to write `*` manually:

```prismio
let s = "hello"
let r = &s

// Both are equivalent:
println((*r).length)   // explicit deref
println(r.length)      // auto-deref — idiomatic Prismio
```

---

## References as Function Parameters

The most common use of references is passing values to functions without moving them:

```prismio
fn area(width: &Float, height: &Float) -> Float {
    return (*width) * (*height)
    // or simply:
    // return width * height  (auto-deref)
}

fn main() {
    let w = 5.0
    let h = 3.0
    println("Area: ${area(&w, &h)}")   // 15.0
    println("Width: ${w}")             // still valid
}
```

### Mutable Parameters

```prismio
fn increment(n: &mut Int) {
    *n += 1
}

fn main() {
    let mut count = 0
    increment(&mut count)
    increment(&mut count)
    increment(&mut count)
    println(count)   // 3
}
```

---

## Reference Semantics vs Value Semantics

**Value semantics** means each variable holds its own independent copy of the data. Assignment copies the value:

```prismio
// Value semantics (copy types like Int)
let a = 10
let b = a     // b is an independent copy
// Changing b doesn't affect a
```

**Reference semantics** means variables point to the same underlying data:

```prismio
// Reference semantics
let mut x = 42
let r = &mut x    // r points to x

*r = 99
println(x)    // 99 — x was modified through r
```

In Prismio, primitive types (`Int`, `Float`, `Bool`, `Char`) use **value semantics** (they are `Copy`). Heap-allocated types like `String` and arrays use **move/borrow semantics** by default. You opt into sharing via explicit references.

---

## Slices: References to Contiguous Data

A **slice** (`&[T]` or `&mut [T]`) is a reference to a contiguous portion of an array. It consists of a pointer and a length — no ownership, no copy.

```prismio
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Slice of the whole array
let all: &[Int] = &numbers

// Slice of a range
let mid: &[Int] = &numbers[3..7]    // [4, 5, 6, 7]

println(mid.length)   // 4
println(mid[0])       // 4
```

### String Slices

```prismio
let sentence = "The quick brown fox"
let word: &str = &sentence[4..9]    // "quick"
println(word)
```

Slices are lightweight — passing `&[T]` to a function is always O(1) regardless of the array's size.

---

## Smart References

For more advanced use cases — heap allocation, reference counting, shared ownership — Prismio provides **smart reference types** in the standard library.

### `Box<T>` — Heap Allocation

`Box<T>` allocates a value on the heap and gives you sole ownership. It automatically frees the heap memory when dropped.

> 🚧 **Coming Soon** – `Box<T>` is planned as part of the standard library.

```prismio
import std.mem.Box

fn main() {
    let boxed = Box(42)          // allocate 42 on the heap
    println(*boxed)              // 42

    let boxed_str = Box("hello") // String on the heap
    println(boxed_str.length)    // auto-deref: 5
}   // boxed is dropped here — heap memory freed
```

**When to use `Box`:**
- When you have a large value and want to avoid stack overflow
- For recursive data structures (e.g., linked lists, trees)
- When you want to erase a type behind a trait object (`Box<dyn Trait>`)

```prismio
// Recursive type — must be boxed to have a known size
struct Node {
    value: Int
    next: Box<Node>?   // Box breaks the infinite-size recursion
}
```

### `Rc<T>` — Reference Counting (Single-threaded)

`Rc<T>` provides **shared ownership** of a heap-allocated value. The value is dropped when the last `Rc` pointing to it is dropped.

> 🚧 **Coming Soon** – `Rc<T>` is planned as part of the standard library.

```prismio
import std.mem.Rc

fn main() {
    let shared = Rc("shared data")

    let clone1 = shared.clone()   // reference count: 2
    let clone2 = shared.clone()   // reference count: 3

    println(*clone1)   // "shared data"
    println(*clone2)   // "shared data"

    // clone1 and clone2 dropped — count goes to 1
    // shared dropped — count goes to 0 — data freed
}
```

> ⚠️ `Rc<T>` is **not thread-safe**. For multithreaded shared ownership, use `Arc<T>`.

### `Arc<T>` — Atomic Reference Counting (Thread-safe)

`Arc<T>` is like `Rc<T>` but uses atomic operations, making it safe to share across threads.

> 🚧 **Coming Soon** – `Arc<T>` is planned as part of the standard library.

```prismio
import std.mem.Arc
import std.thread

fn main() {
    let data = Arc([1, 2, 3, 4, 5])

    let d1 = data.clone()
    let d2 = data.clone()

    let t1 = thread.spawn { println(d1.length) }
    let t2 = thread.spawn { println(d2[0]) }

    t1.join()
    t2.join()
}
```

### Smart Reference Comparison

| Type       | Ownership     | Thread-safe | Mutation         | Use case                        |
|------------|---------------|-------------|------------------|---------------------------------|
| `&T`       | Borrowed      | ✅ Yes      | ❌ Read-only     | Temporary read access           |
| `&mut T`   | Borrowed      | ❌ No       | ✅ Exclusive     | Temporary write access          |
| `Box<T>`   | Single owner  | ✅ Yes      | ✅ Via `&mut`    | Heap allocation, recursive types|
| `Rc<T>`    | Shared        | ❌ No       | Via `RefCell`    | Single-threaded shared ownership|
| `Arc<T>`   | Shared        | ✅ Yes      | Via `Mutex`      | Multi-threaded shared ownership |

---

## Reference Patterns in Practice

### Pattern: Read without consuming

```prismio
fn describe(items: &[String]) -> String {
    let count = items.length
    return "${count} item(s): ${items.join(", ")}"
}

fn main() {
    let fruits = ["apple", "banana", "cherry"]
    println(describe(&fruits))   // 3 item(s): apple, banana, cherry
    println(fruits[0])           // ✅ fruits still owned here
}
```

### Pattern: In-place mutation

```prismio
fn sanitize(s: &mut String) {
    s.trimInPlace()
    s.toLowerCaseInPlace()
}

fn main() {
    let mut input = "  Hello World  "
    sanitize(&mut input)
    println(input)   // "hello world"
}
```

### Pattern: Returning a reference to a field

```prismio
struct Config {
    host: String
    port: Int
}

fn getHost(config: &Config) -> &String {
    return &config.host    // return reference to a field
}

fn main() {
    let cfg = Config(host: "localhost", port: 8080)
    let h = getHost(&cfg)
    println(h)             // "localhost"
}
```

---

## Null Safety

Prismio references are **never null**. If you need to represent "a reference or nothing," use `Option<&T>`:

```prismio
fn findFirst(items: &[Int], target: Int) -> Option<&Int> {
    for item in items {
        if *item == target {
            return some(item)
        }
    }
    return none
}

fn main() {
    let nums = [3, 7, 1, 9, 4]
    match findFirst(&nums, 9) {
        some(ref n) -> println("Found: ${n}")
        none        -> println("Not found")
    }
}
```

---

## Summary

| Concept              | Description                                                  |
|----------------------|--------------------------------------------------------------|
| `&T`                 | Immutable reference — read-only access, no ownership         |
| `&mut T`             | Mutable reference — read/write access, exclusive             |
| `*ref`               | Dereference — access the value behind a reference            |
| Auto-deref           | Compiler inserts `*` automatically for method calls/fields   |
| `&[T]` / `&mut [T]` | Slice — fat pointer (ptr + length) to contiguous data        |
| `Box<T>`             | Heap-allocated single-owner smart reference 🚧               |
| `Rc<T>`              | Reference-counted shared ownership (single-thread) 🚧        |
| `Arc<T>`             | Atomic ref-counted shared ownership (multi-thread) 🚧        |

---

## See Also

- [Ownership](./ownership.md)
- [Borrowing](./borrowing.md)
- [Lifetimes](./lifetimes.md)
- [Unsafe Code](./unsafe.md)
