# FFI Basics

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The syntax and API described below reflect the current design and may change before release.

The **Foreign Function Interface (FFI)** allows Prismio code to call functions written in other languages — primarily C — and vice versa. Because Prismio compiles to native machine code via LLVM, FFI integration is low-overhead and does not require a virtual machine or runtime bridge.

---

## Overview

Prismio's FFI is modeled after the C ABI, making it compatible with virtually any language that exposes a C-compatible interface. This includes C, C++, Rust, Python (via extension modules), and many others.

```
┌──────────────┐       FFI call       ┌──────────────┐
│  Prismio     │  ─────────────────►  │  C Library   │
│  (.prism)    │  ◄─────────────────  │  (.so / .dll)│
└──────────────┘     return value     └──────────────┘
```

---

## Declaring External Functions

Use the `extern` keyword to declare a function that is defined in an external library. The declaration tells the Prismio compiler about the function's signature without providing a body.

```prismio
extern fn puts(s: *Char) -> Int
extern fn malloc(size: UInt) -> *Void
extern fn free(ptr: *Void)
```

By default, Prismio assumes external functions follow the **C calling convention**. You can be explicit with the `"C"` ABI specifier:

```prismio
extern "C" fn strlen(s: *Char) -> UInt
extern "C" fn printf(fmt: *Char, ...) -> Int   // variadic (🚧 Coming Soon)
```

---

## Calling C Functions from Prismio

Once declared, external functions are called like any regular Prismio function:

```prismio
extern "C" fn puts(s: *Char) -> Int

fn main() {
    let message = "Hello from Prismio via FFI!"
    puts(message.toCString())
}
```

### Linking to a Library

To link against a system or third-party C library, annotate the `extern` block with `#[link]`:

```prismio
#[link(name = "m")]   // links against libm (math library)
extern "C" {
    fn sin(x: Float64) -> Float64
    fn cos(x: Float64) -> Float64
    fn sqrt(x: Float64) -> Float64
    fn pow(base: Float64, exp: Float64) -> Float64
}

fn main() {
    let angle = 3.14159265 / 6.0   // 30 degrees in radians
    let s = sin(angle)
    let c = cos(angle)
    println("sin(30°) = {s}")
    println("cos(30°) = {c}")
}
```

You can also specify the full library path for non-standard locations:

```prismio
#[link(name = "mylib", kind = "static", path = "/usr/local/lib")]
extern "C" {
    fn mylib_init() -> Int
    fn mylib_cleanup()
}
```

The `kind` attribute supports:
| Value | Description |
|-------|-------------|
| `"dylib"` | Dynamic/shared library (default) |
| `"static"` | Static library (`.a` / `.lib`) |
| `"framework"` | macOS framework |

---

## The `extern` Keyword

The `extern` keyword serves two purposes in Prismio:

### 1. Importing External Symbols

```prismio
extern "C" fn c_function(x: Int) -> Int
```

### 2. Exporting Prismio Functions to C

Use `#[export]` together with `extern "C"` to make a Prismio function callable from C:

```prismio
#[export]
extern "C" fn prismio_add(a: Int32, b: Int32) -> Int32 {
    return a + b
}
```

This function will be compiled with C ABI and can be called from C code using:

```c
// In C
extern int32_t prismio_add(int32_t a, int32_t b);

int main() {
    int result = prismio_add(10, 20);
    printf("Result: %d\n", result);
    return 0;
}
```

---

## Type Mapping Between Prismio and C Types

Prismio provides a set of C-compatible types in the `interop.c` module. These types have guaranteed size and alignment matching their C counterparts.

### Primitive Types

| C Type | Prismio Type | Size |
|--------|-------------|------|
| `int8_t` | `Int8` | 1 byte |
| `int16_t` | `Int16` | 2 bytes |
| `int32_t` | `Int32` | 4 bytes |
| `int64_t` | `Int64` | 8 bytes |
| `uint8_t` | `UInt8` | 1 byte |
| `uint16_t` | `UInt16` | 2 bytes |
| `uint32_t` | `UInt32` | 4 bytes |
| `uint64_t` | `UInt64` | 8 bytes |
| `float` | `Float32` | 4 bytes |
| `double` | `Float64` | 8 bytes |
| `char` | `Char` | 1 byte |
| `void` | `Void` | — |
| `void*` | `*Void` | ptr size |
| `char*` | `*Char` | ptr size |
| `size_t` | `UInt` | platform |
| `intptr_t` | `Int` | platform |

### Pointer Types

C pointers map directly to Prismio raw pointer types:

| C | Prismio |
|---|---------|
| `int*` | `*Int32` |
| `const char*` | `*const Char` |
| `void**` | `**Void` |
| `int (*fn)(int)` | `*fn(Int32) -> Int32` |

### Structs

C structs can be represented in Prismio with `#[repr(C)]`:

```prismio
#[repr(C)]
struct Point {
    x: Float64
    y: Float64
}

#[repr(C)]
struct Rect {
    origin: Point
    width: Float64
    height: Float64
}

extern "C" fn draw_rect(r: *Rect) -> Void
```

The `#[repr(C)]` attribute guarantees the struct has the same memory layout as its C equivalent, with no reordering or padding differences.

### Strings

Prismio's native `String` type is a managed, UTF-8 string and is **not** directly compatible with C's null-terminated `char*`. Use the `.toCString()` method to get a null-terminated pointer:

```prismio
extern "C" fn strlen(s: *Char) -> UInt

fn main() {
    let s = "Hello, World!"
    let len = strlen(s.toCString())
    println("Length: {len}")
}
```

> ⚠️ **Warning**: The pointer returned by `.toCString()` is only valid for the lifetime of the original `String` value. Do not store or use it after the `String` is dropped.

---

## Safety Considerations

FFI calls bypass Prismio's safety guarantees. Any `extern` call is inherently **unsafe** because:

- The external function's behavior cannot be verified by the Prismio compiler
- Memory passed across the FFI boundary may be used in unexpected ways
- C functions can trigger undefined behavior (buffer overflows, null dereferences, etc.)

### Marking Unsafe FFI Calls

Calls to `extern` functions must be wrapped in an `unsafe` block:

```prismio
extern "C" fn dangerous_c_function(ptr: *Void, len: UInt) -> Int

fn main() {
    let buffer: [UInt8] = [1, 2, 3, 4, 5]
    
    let result = unsafe {
        dangerous_c_function(buffer.rawPtr(), buffer.len() as UInt)
    }
    
    println("Result: {result}")
}
```

### Safe Wrapper Pattern

The recommended approach is to write a safe Prismio wrapper around your `extern` declarations:

```prismio
// Low-level extern declarations (not exported)
#[link(name = "z")]
extern "C" {
    fn compress(dest: *UInt8, destLen: *UInt, src: *UInt8, srcLen: UInt) -> Int32
    fn uncompress(dest: *UInt8, destLen: *UInt, src: *UInt8, srcLen: UInt) -> Int32
}

// Safe high-level API
fn zlibCompress(data: [UInt8]) -> Result<[UInt8], String> {
    // ... bounds checking, allocation, safe wrapping ...
    let result = unsafe {
        compress(outBuf.rawPtr(), &outLen, data.rawPtr(), data.len() as UInt)
    }
    if result != 0 {
        return .err("Compression failed with code {result}")
    }
    return .ok(outBuf)
}
```

### Common Pitfalls

| Pitfall | Mitigation |
|---------|-----------|
| Null pointer dereference | Always check pointers before use |
| Buffer overflow | Pass lengths explicitly; use bounds-checked wrappers |
| Use-after-free | Respect ownership; don't pass pointers to dropped values |
| Data races | External code doesn't know Prismio's ownership rules; use mutexes |
| Calling convention mismatch | Always specify `"C"` ABI explicitly |

---

## Complete Example: Wrapping a C Library

Here's a complete example wrapping a portion of the C standard library's `<math.h>`:

```prismio
import interop.c

#[link(name = "m")]
extern "C" {
    fn sin(x: Float64) -> Float64
    fn cos(x: Float64) -> Float64
    fn tan(x: Float64) -> Float64
    fn atan2(y: Float64, x: Float64) -> Float64
    fn sqrt(x: Float64) -> Float64
    fn fabs(x: Float64) -> Float64
}

// Safe wrappers with Prismio idioms
fn safeSqrt(x: Float64) -> Result<Float64, String> {
    if x < 0.0 {
        return .err("Cannot take square root of negative number")
    }
    let result = unsafe { sqrt(x) }
    return .ok(result)
}

fn toDegrees(radians: Float64) -> Float64 {
    return radians * (180.0 / 3.14159265358979323846)
}

fn toRadians(degrees: Float64) -> Float64 {
    return degrees * (3.14159265358979323846 / 180.0)
}

fn main() {
    let angle = toRadians(45.0)
    
    let s = unsafe { sin(angle) }
    let c = unsafe { cos(angle) }
    let t = unsafe { tan(angle) }
    
    println("sin(45°) = {s}")
    println("cos(45°) = {c}")
    println("tan(45°) = {t}")
    
    match safeSqrt(2.0) {
        .ok(val) => println("sqrt(2) = {val}")
        .err(msg) => println("Error: {msg}")
    }
}
```

---

## See Also

- [ABI & Calling Conventions](/interop/abi) — Details on calling conventions and struct layout
- [C/C++ Interoperability](/interop/c_cpp) — Practical guide to linking C and C++ libraries
- [Memory Safety](/language/memory) — Understanding Prismio's ownership model
- [Unsafe Code](/language/unsafe) — Writing unsafe blocks safely
