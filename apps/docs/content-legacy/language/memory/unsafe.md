# Unsafe Code

> 🚧 **Coming Soon** – Unsafe code blocks are planned for a future version of Prismio. This page describes the intended design, motivation, and API. Details may change before the feature is released.

---

## Overview

Prismio's type system and borrow checker make strong safety guarantees for all code written in the safe subset of the language. However, there are legitimate situations where you need to step outside those guarantees — to call system APIs, interact with foreign code, or implement low-level primitives that the language itself uses internally.

For these cases, Prismio will provide **`unsafe` blocks**: explicitly marked regions where certain additional capabilities are available, and where the programmer takes on the responsibility of upholding safety invariants that the compiler cannot verify.

> **The key insight:** `unsafe` does not turn off the compiler. Type checking, borrow checking, and ownership rules still apply inside an `unsafe` block. What `unsafe` *does* is unlock a small set of extra operations that the compiler cannot guarantee are safe.

---

## Why `unsafe` Exists

Safe Prismio can't express everything. Some operations are inherently low-level:

- Calling C functions via FFI (Foreign Function Interface) — the compiler has no visibility into what C code does
- Dereferencing raw pointers — the compiler can't track raw pointer validity
- Implementing data structures like `Vec`, `HashMap`, `Rc` — these use raw allocation internally
- Inline assembly — the compiler can't reason about hand-written machine code
- Accessing hardware-mapped memory — addresses must be taken literally

Rather than banning these operations entirely or making the whole language unsafe, Prismio localises the risk with `unsafe` blocks. A small, auditable unsafe surface area is far safer than spreading unchecked operations throughout a codebase.

---

## The `unsafe` Block

An `unsafe` block is a delimited region that opts in to additional capabilities:

```prismio
// Planned syntax
unsafe {
    // Extra capabilities available here
}
```

Everything outside `unsafe` blocks is still fully safe and checked. The goal is to keep unsafe regions **small and isolated**.

---

## What `unsafe` Enables

### 1. Raw Pointers

Raw pointers (`*T` and `*mut T`) can be created and dereferenced inside `unsafe` blocks. They have no lifetime, can be null, and are not tracked by the borrow checker.

```prismio
// Planned syntax
let x = 42
let raw: *Int = &x as *Int     // create a raw pointer

unsafe {
    println(*raw)   // dereference a raw pointer
}
```

> ⚠️ Raw pointers can point to freed memory, overlap in invalid ways, or be null. You are responsible for ensuring they are valid before dereferencing.

### 2. Calling Unsafe Functions

Some functions are marked `unsafe fn` to indicate they have preconditions the compiler cannot verify. Calling them requires an `unsafe` block:

```prismio
unsafe fn getUnchecked(slice: &[Int], index: Int) -> Int {
    // Skips bounds checking — caller must guarantee index is in range
    return *slice.rawPtr().offset(index)
}

fn main() {
    let data = [10, 20, 30]
    let val = unsafe { getUnchecked(&data, 1) }   // 20
    println(val)
}
```

### 3. FFI — Calling C Functions

Interfacing with C libraries requires `extern` declarations and `unsafe` calls, because the compiler cannot verify C's behaviour:

```prismio
// Declare a C function
extern "C" {
    fn c_strlen(s: *const Char) -> Int
    fn c_malloc(size: Int) -> *mut Byte
    fn c_free(ptr: *mut Byte)
}

fn safeStrlen(s: &String) -> Int {
    unsafe {
        return c_strlen(s.rawPtr())
    }
}
```

### 4. Accessing `static mut` Variables

Mutable global variables are inherently racy in multithreaded programs. Accessing them requires `unsafe`:

```prismio
static mut GLOBAL_COUNTER: Int = 0

fn incrementGlobal() {
    unsafe {
        GLOBAL_COUNTER += 1
    }
}
```

> ⚠️ Accessing `static mut` from multiple threads without synchronisation is undefined behaviour. Prefer `Arc<Mutex<T>>` for shared mutable state.

### 5. Inline Assembly

> 🚧 In design phase — inline assembly syntax has not been finalised.

```prismio
// Proposed syntax
fn nop() {
    unsafe {
        asm! {
            "nop"
        }
    }
}
```

---

## Unsafe Functions

Mark a function as `unsafe fn` when it has preconditions that callers must satisfy. This communicates the contract clearly and ensures callers must explicitly acknowledge the risk:

```prismio
/// # Safety
/// `ptr` must be non-null and point to a valid, aligned `Int`.
unsafe fn readInt(ptr: *Int) -> Int {
    return *ptr
}
```

Always document the **Safety** contract in the doc comment.

---

## Wrapping Unsafe in a Safe API

The best practice is to use `unsafe` internally while exposing a **safe public API** that upholds all invariants:

```prismio
struct SafeBuffer {
    ptr: *mut Byte
    length: Int
    capacity: Int
}

impl SafeBuffer {
    fn new(capacity: Int) -> SafeBuffer {
        let ptr = unsafe { c_malloc(capacity) }
        return SafeBuffer(ptr: ptr, length: 0, capacity: capacity)
    }

    // Safe public API — bounds are checked
    fn get(self: &SafeBuffer, index: Int) -> Byte? {
        if index < 0 || index >= self.length {
            return none
        }
        unsafe {
            return some(*self.ptr.offset(index))
        }
    }

    fn drop(self: SafeBuffer) {
        unsafe { c_free(self.ptr) }
    }
}
```

The caller never needs to write `unsafe` — all the unsafe work is encapsulated and proven safe by the implementation's invariants.

---

## Minimising Unsafe Surface Area

When you must write unsafe code, follow these principles:

| Principle | Description |
|---|---|
| **Keep it small** | Unsafe blocks should be as short as possible — a few lines at most |
| **Encapsulate it** | Hide unsafe behind safe public APIs; callers shouldn't need `unsafe` |
| **Document invariants** | Comment exactly what assumptions must hold for the code to be safe |
| **Audit regularly** | Review unsafe code carefully in code review — it can't be machine-verified |
| **Prefer safe abstractions** | Use `Box`, `Vec`, `Arc`, etc. before reaching for raw pointers |
| **Test thoroughly** | Run unsafe code under tools like sanitisers and fuzzers |

---

## When to Use `unsafe`

Use `unsafe` only when:

1. **FFI is required** — calling into C, system calls, OS APIs
2. **Performance is critical and provably safe** — e.g., skipping bounds checks in hot inner loops after validating indices once
3. **Implementing core data structures** — the building blocks of safe abstractions (slices, smart pointers, etc.)
4. **Hardware/memory-mapped I/O** — embedded systems, kernel code, driver development
5. **Inline assembly** — CPU-specific optimisations or special instructions

Do **not** use `unsafe` to work around borrow checker errors. If the borrow checker rejects your code, that is a signal to redesign the logic — not to suppress the check.

---

## The Safety Covenant

When you write `unsafe`, you make a promise to the compiler and to future readers:

> *"I have manually verified that this code upholds all of Prismio's safety invariants. The memory it accesses is valid and properly aligned. The borrows here respect exclusive-access rules. There are no data races."*

This promise is what makes it reasonable for the rest of the program to trust the safe abstraction built on top of the unsafe code.

---

## Current Status

| Feature | Status |
|---|---|
| `unsafe` block syntax | 🚧 Designed, not yet implemented |
| Raw pointer types (`*T`, `*mut T`) | 🚧 Designed, not yet implemented |
| `unsafe fn` declarations | 🚧 Designed, not yet implemented |
| FFI (`extern "C"`) | 🚧 Designed, not yet implemented |
| Inline assembly | 🚧 In early design phase |
| `static mut` | 🚧 Designed, not yet implemented |

---

## See Also

- [Ownership](./ownership.md)
- [Borrowing](./borrowing.md)
- [References](./references.md)
- [Lifetimes](./lifetimes.md)
