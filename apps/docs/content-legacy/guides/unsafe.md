# Unsafe Patterns

> 🚧 **Coming Soon** – Unsafe code support is planned for a future release of Prismio. The design and syntax described here reflects the intended direction, but no unsafe features are currently implemented in the compiler.

---

## Overview

Prismio's ownership and borrowing system provides strong memory safety guarantees by default. However, certain low-level programming tasks — interfacing with hardware, calling C libraries, or implementing high-performance data structures — require stepping outside these safety boundaries.

The `unsafe` keyword will allow you to perform operations that the compiler cannot statically verify as safe. It is an explicit acknowledgment that *you*, the programmer, are taking responsibility for upholding safety invariants that the compiler cannot check.

---

## What `unsafe` Will Allow

Inside an `unsafe` block, you'll be permitted to:

- Dereference raw pointers (`*T` and `*mut T`)
- Call `unsafe` functions (including C FFI functions)
- Access or modify mutable static variables
- Implement `unsafe` traits
- Read from uninitialized memory

```prismio
// Intended future syntax

unsafe fn readRawMemory(ptr: *const Int) -> Int {
    return *ptr  // dereference a raw pointer
}

fn main() {
    let value = 42
    let ptr = &value as *const Int  // create a raw pointer

    let result = unsafe {
        readRawMemory(ptr)  // call the unsafe function
    }
    println(result)  // 42
}
```

---

## Minimizing Unsafe Surface Area

The primary discipline of safe `unsafe` code is to **minimize the blast radius**. Keep `unsafe` blocks as small as possible — ideally a single line or expression.

```prismio
// Avoid: entire function is unsafe when only one operation needs it
unsafe fn processData(data: &[u8]) -> Int {
    let ptr = data.as_ptr()
    let len = data.len()
    let val = *ptr.add(len - 1)  // only this line is unsafe
    return val.toInt() * 2
}

// Prefer: isolate the unsafe operation
fn processData(data: &[u8]) -> Int {
    let last_byte = unsafe { *data.as_ptr().add(data.len() - 1) }
    return last_byte.toInt() * 2
}
```

**Rule:** Safe code should call `unsafe` code, not the other way around. The `unsafe` blocks should be deep in the implementation, hidden behind a safe API.

---

## Documenting Safety Invariants

Every `unsafe` function must document the **preconditions** that the caller must uphold. These are the invariants that the compiler cannot verify but that must hold for the operation to be sound.

Use a `# Safety` doc section in documentation comments:

```prismio
/// Reads a value from a raw pointer.
///
/// # Safety
///
/// The caller must ensure that:
/// - `ptr` is non-null
/// - `ptr` is properly aligned for type `T`
/// - `ptr` points to a valid, initialized value of type `T`
/// - The memory `ptr` points to is not concurrently mutated
unsafe fn readPtr<T>(ptr: *const T) -> T {
    return *ptr
}
```

**Rule:** If an `unsafe` function has no `# Safety` section, it is incomplete documentation and should be treated as a bug.

---

## Validating Unsafe Preconditions

Where possible, validate preconditions at the boundary between safe and unsafe code, before entering the `unsafe` block.

```prismio
fn getElement(ptr: *const Int, length: Int, index: Int) -> Int? {
    // Validate in safe code first
    if ptr == null {
        return null
    }
    if index < 0 || index >= length {
        return null
    }

    // Only enter unsafe after preconditions are verified
    let value = unsafe { *ptr.add(index) }
    return Some(value)
}
```

This pattern is called **"safe wrapping"** — you expose a safe API that does precondition checks, and only then enters the minimal unsafe block.

---

## Common Unsafe Patterns

### Raw Pointers

Raw pointers (`*const T` for read-only, `*mut T` for mutable) exist outside the ownership system. They can be null, dangling, or misaligned.

```prismio
// Intended future syntax

fn swapRaw(a: *mut Int, b: *mut Int) {
    unsafe {
        let temp = *a
        *a = *b
        *b = temp
    }
}

fn main() {
    let mut x = 10
    let mut y = 20
    swapRaw(&mut x, &mut y)
    println(x)  // 20
    println(y)  // 10
}
```

### Foreign Function Interface (FFI)

Calling C functions requires declaring them with their C signature and calling them inside an `unsafe` block.

```prismio
// Declare an external C function
extern "C" {
    fn strlen(s: *const Char) -> Int
    fn malloc(size: Int) -> *mut Void
    fn free(ptr: *mut Void)
}

fn cStringLength(s: *const Char) -> Int {
    unsafe { strlen(s) }
}
```

### Wrapping `unsafe` in a Safe API

The goal is always to **expose safe interfaces**, even when the implementation uses `unsafe`. The unsafe code is an implementation detail.

```prismio
/// A safe wrapper around a fixed-size memory block.
struct RawBuffer {
    ptr: *mut u8
    size: Int
}

impl RawBuffer {
    /// Allocates a new buffer of `size` bytes.
    pub fn new(size: Int) -> RawBuffer {
        let ptr = unsafe { malloc(size) as *mut u8 }
        assert(ptr != null, "Allocation failed")
        return RawBuffer { ptr, size }
    }

    /// Reads a byte at the given index. Returns null if out of bounds.
    pub fn read(self, index: Int) -> u8? {
        if index < 0 || index >= self.size {
            return null
        }
        return Some(unsafe { *self.ptr.add(index) })
    }

    /// Writes a byte at the given index. Returns false if out of bounds.
    pub fn write(self, index: Int, value: u8) -> Bool {
        if index < 0 || index >= self.size {
            return false
        }
        unsafe { *self.ptr.add(index) = value }
        return true
    }
}
```

Consumers of `RawBuffer` interact only with the safe `read` and `write` methods and never touch raw pointers directly.

---

## Unsafe Traits

Some traits may require `unsafe` implementations because the compiler cannot verify their contracts. A classic example is `Send` (safe to transfer across threads) and `Sync` (safe to share across threads).

```prismio
// Intended future syntax

// Marking a type as safe to send across threads (you're asserting this is true)
unsafe impl Send for MyRawHandle {}
unsafe impl Sync for MyRawHandle {}
```

---

## Guidelines Summary

| Practice | Why |
|---|---|
| Minimize `unsafe` block size | Limits the scope of potential bugs |
| Document `# Safety` on every `unsafe fn` | Makes invariants explicit and reviewable |
| Validate preconditions before `unsafe` | Catches bugs at the safe/unsafe boundary |
| Wrap `unsafe` in safe APIs | Protects callers from implementation details |
| Prefer safe abstractions from stdlib | Battle-tested, peer-reviewed implementations |
| Review `unsafe` code more carefully | It opts out of compiler guarantees |

---

## What `unsafe` Does NOT Disable

Even inside an `unsafe` block, Prismio still enforces:

- Type checking
- Borrow checker rules for safe references (only raw pointers escape the borrow checker)
- Integer overflow detection (in debug builds)
- All other compiler errors

`unsafe` is a targeted escape hatch, not a way to turn off the type system.

---

*See also: [Error Handling Patterns](/guides/error_handling) · [Performance Guide](/guides/performance) · [Idioms & Best Practices](/guides/idioms)*
