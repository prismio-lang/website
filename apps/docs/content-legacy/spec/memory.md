# Memory Model Specification

This page describes Prismio's memory model — the rules that govern how memory is allocated, used, and freed.

> 🚧 **Formal Specification Coming Soon** – This page provides a conceptual description. A rigorous formal specification is planned.

## Overview

Prismio's memory model is based on **ownership** — a set of compile-time rules that ensure:

1. **Every value has exactly one owner** at any point in time
2. **When the owner goes out of scope, the value is dropped** (memory freed)
3. **Values can be borrowed** (temporarily referenced) without transferring ownership

This provides memory safety **without a garbage collector** — memory is freed at predictable points, deterministically.

---

## Memory Regions

Prismio programs use three memory regions:

| Region | Contents | Lifetime | Managed by |
|--------|---------|----------|------------|
| **Stack** | Local variables, function frames | Function call duration | Automatically |
| **Heap** | Dynamically allocated values | Explicit or owned | Ownership system |
| **Static** | Constants, string literals, global data | Program lifetime | Compiler |

---

## Ownership Rules

### Rule 1: Single Ownership

Every value in Prismio has exactly **one owner** (a variable that owns it).

```prismio
let s = "hello"    // s owns the string
```

### Rule 2: Move Semantics

When a value is assigned to another variable or passed to a function, **ownership is moved**. The original variable is no longer valid.

```prismio
let s1 = "hello"
let s2 = s1       // s1 is MOVED into s2

println(s1)       // ERROR: s1 no longer valid after move
println(s2)       // OK
```

```
Ownership transfer rule:
  If v₁ owns value V, and we write let v₂ = v₁,
  then v₂ now owns V, and v₁ is invalidated.
```

### Rule 3: Drop at End of Scope

When a variable goes out of scope (end of `{}`), its owned value is dropped:

```prismio
{
    let buffer = allocateLargeBuffer()
    // use buffer...
}
// buffer is dropped here — memory freed automatically
```

---

## Copy Types

Some types are **Copy** — they are duplicated on assignment rather than moved. These are typically small, stack-allocated values:

| Type | Copy? |
|------|-------|
| `Int`, `Int8`, ..., `UInt` | ✅ Yes |
| `Float`, `Float32` | ✅ Yes |
| `Bool` | ✅ Yes |
| `Char` | ✅ Yes |
| `String` | ❌ No (heap-allocated) |
| `[T]` (array) | ❌ No |
| Tuples of Copy types | ✅ Yes |

```prismio
let x = 42
let y = x     // x is COPIED (not moved) since Int is Copy
println(x)    // OK — x still valid
println(y)    // OK
```

---

## Borrow Rules

### Immutable Borrows

Multiple immutable borrows of the same value are allowed simultaneously:

```prismio
let s = "hello"
let r1 = &s    // borrow 1
let r2 = &s    // borrow 2 — allowed!

println(r1)    // OK
println(r2)    // OK
```

```
Borrow rule (immutable):
  A value can have any number of concurrent immutable borrows (&T)
  as long as there are no active mutable borrows.
```

### Mutable Borrows

Only **one** mutable borrow is allowed at a time, and no immutable borrows may coexist:

```prismio
let mut s = "hello"
let r = &mut s    // one mutable borrow

// let r2 = &s    // ERROR: cannot borrow while mutable borrow exists
// let r3 = &mut s  // ERROR: second mutable borrow not allowed

println(r)    // OK
// After this point, r is no longer used, so the borrow ends
```

```
Borrow rule (mutable):
  A value can have at most one active mutable borrow (&mut T),
  and only if there are no active immutable borrows.
```

### Non-Lexical Lifetimes (NLL)

Borrows end at their **last use**, not at the end of the block:

```prismio
let mut s = String.from("hello")
let r = &s            // immutable borrow begins

println(r)            // last use of r — borrow ENDS here

s.push(" world")      // OK: borrow has ended
```

---

## Lifetime Model

A **lifetime** is the region of code during which a borrow is valid. The borrow checker verifies that:

1. Borrows never outlive the value they reference
2. Mutable and immutable borrows don't overlap

```prismio
fn longest(a: &String, b: &String) -> &String {
    if a.length() > b.length() { a } else { b }
}
```

> 🚧 **Coming Soon** – Explicit lifetime annotation syntax (`'a`) is planned. Currently the compiler performs lifetime inference automatically for common patterns.

---

## Aliasing Rules

| Situation | Allowed? |
|-----------|----------|
| Multiple `&T` (reads) | ✅ |
| One `&mut T` (write) | ✅ |
| `&T` and `&mut T` simultaneously | ❌ |
| Two `&mut T` simultaneously | ❌ |

This is the **aliasing XOR mutability** invariant: you can have aliases OR mutation, but not both at the same time.

---

## Undefined Behavior

Prismio's safe code has **no undefined behavior**. The following would be UB in C/C++ but are caught at compile time in Prismio:

| UB Category | Prismio's handling |
|-------------|-------------------|
| Use after free | Ownership prevents this |
| Double free | Ownership prevents this |
| Null pointer dereference | `Optional<T>` type, no null pointers |
| Data race | Borrow checker + Send/Sync |
| Buffer overflow | Bounds-checked indexing |
| Uninitialized memory | All variables must be initialized |

---

## Memory Layout

### Stack Frames

Each function call pushes a stack frame containing:
- Parameters
- Local variables
- Return address
- Saved registers

Stack frames are automatically reclaimed on function return.

### Heap Allocation

Heap allocation happens when:
- Creating a `String` from a literal
- Creating a `List<T>` or other collection
- Boxing a value with `Box<T>`

The ownership system ensures heap memory is freed exactly once when the owning variable is dropped.

### Struct Layout

```prismio
// Planned syntax
struct Point {
    x: Float,    // offset 0
    y: Float,    // offset 8
}
// Total size: 16 bytes, alignment: 8
```

> 🚧 **Coming Soon** – Precise struct layout rules, padding, and `repr(C)` for FFI are being finalized.

---

## Unsafe Memory Operations

> 🚧 **Coming Soon** – `unsafe` blocks will allow:

- Raw pointer operations (`*const T`, `*mut T`)
- Manual memory allocation/deallocation
- Disabling the borrow checker for a region
- FFI calls to C functions

See [Unsafe Code](../language/memory/unsafe.md) for guidelines on using unsafe correctly.
