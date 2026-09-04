# Rust Interoperability

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The approach described below reflects the current design direction.

Prismio and Rust share many design philosophies — both are memory-safe, compiled languages with ownership models. Because both languages can expose a **C-compatible ABI**, they can interoperate via the same mechanism: `extern "C"` declarations and C-compatible types.

---

## Overview

Rust interoperability in Prismio follows the same pattern as C interoperability:

```
┌──────────────┐      C ABI boundary      ┌──────────────┐
│  Prismio     │  ───────────────────────► │  Rust        │
│  (.prism)    │  ◄─────────────────────── │  (.rs)       │
└──────────────┘                           └──────────────┘
       Both sides use extern "C" — the C ABI is the bridge
```

Neither Prismio nor Rust has a shared stable ABI with the other, but both can speak C ABI fluently. This is the recommended integration approach.

---

## Rust FFI Basics Review

For context, here is how Rust exposes functions with C ABI:

```rust
// In Rust: lib.rs
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn rust_fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a: u64 = 0;
            let mut b: u64 = 1;
            for _ in 2..=n {
                let tmp = a + b;
                a = b;
                b = tmp;
            }
            b
        }
    }
}

#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut std::os::raw::c_char) {
    if !s.is_null() {
        unsafe { drop(std::ffi::CString::from_raw(s)) }
    }
}
```

```toml
# Cargo.toml
[lib]
name = "rustlib"
crate-type = ["cdylib"]  # Produce a C-compatible .so / .dll
```

```bash
cargo build --release
# Produces: target/release/librustlib.so (Linux)
#           target/release/rustlib.dll   (Windows)
```

---

## Calling Rust from Prismio

Once your Rust library is compiled with `cdylib`, call it from Prismio exactly like a C library:

```prismio
// Link against the Rust-built library
#[link(name = "rustlib")]
extern "C" {
    fn rust_add(a: Int32, b: Int32) -> Int32
    fn rust_fibonacci(n: UInt32) -> UInt64
    fn rust_free_string(s: *Char)
}

fn main() {
    let sum = unsafe { rust_add(15, 27) }
    println("15 + 27 = {sum}")
    
    let fib = unsafe { rust_fibonacci(20) }
    println("fibonacci(20) = {fib}")
}
```

### Passing Strings from Rust to Prismio

Rust's `CString` can be passed over the FFI boundary:

```rust
// Rust side — returning a C-compatible string
use std::ffi::CString;
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn rust_greet(name: *const c_char) -> *mut c_char {
    let name = unsafe {
        std::ffi::CStr::from_ptr(name).to_str().unwrap_or("World")
    };
    let greeting = format!("Hello from Rust, {}!", name);
    CString::new(greeting).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe { drop(CString::from_raw(s)) }
    }
}
```

```prismio
// Prismio side — calling Rust and receiving a string
#[link(name = "rustlib")]
extern "C" {
    fn rust_greet(name: *Char) -> *Char
    fn rust_free_string(s: *Char)
}

fn greet(name: String) -> String {
    unsafe {
        let raw = rust_greet(name.toCString())
        let result = String.fromCString(raw)
        rust_free_string(raw)
        return result
    }
}

fn main() {
    let message = greet("Prismio")
    println(message)  // "Hello from Rust, Prismio!"
}
```

### Passing Structs

Use `#[repr(C)]` on **both sides** to ensure compatible memory layout:

```rust
// Rust side
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[no_mangle]
pub extern "C" fn rust_distance(a: Point, b: Point) -> f64 {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    (dx * dx + dy * dy).sqrt()
}
```

```prismio
// Prismio side
#[repr(C)]
struct Point {
    x: Float64
    y: Float64
}

#[link(name = "rustlib")]
extern "C" {
    fn rust_distance(a: Point, b: Point) -> Float64
}

fn main() {
    let a = Point { x: 0.0, y: 0.0 }
    let b = Point { x: 3.0, y: 4.0 }
    let dist = unsafe { rust_distance(a, b) }
    println("Distance: {dist}")  // 5.0
}
```

---

## Exposing Prismio as a C-Compatible Library for Rust

To call Prismio code from Rust, expose Prismio functions with `extern "C"` and `#[export]`, then declare them in Rust:

### Prismio Side

```prismio
// prismio_lib.prism

#[export]
extern "C" fn prismio_process(data: *UInt8, len: UInt, out: *UInt8, outLen: *UInt) -> Int32 {
    // ... process data ...
    return 0  // 0 = success
}

#[export]
extern "C" fn prismio_version() -> *Char {
    return "1.0.0".toCString()
}
```

```bash
# Build as C-compatible shared library
ums build --lib --output libprismio.so
```

### Rust Side

```rust
// Rust FFI declarations for Prismio library
use std::os::raw::{c_char, c_int, c_uchar};

extern "C" {
    fn prismio_process(
        data: *const c_uchar,
        len: usize,
        out: *mut c_uchar,
        out_len: *mut usize,
    ) -> c_int;
    
    fn prismio_version() -> *const c_char;
}

fn main() {
    let version = unsafe {
        std::ffi::CStr::from_ptr(prismio_version())
            .to_str()
            .unwrap()
    };
    println!("Prismio library version: {}", version);
    
    let input = b"hello world";
    let mut output = vec![0u8; 256];
    let mut out_len: usize = 256;
    
    let result = unsafe {
        prismio_process(
            input.as_ptr(),
            input.len(),
            output.as_mut_ptr(),
            &mut out_len,
        )
    };
    
    if result == 0 {
        output.truncate(out_len);
        println!("Processed: {:?}", output);
    }
}
```

### `build.rs` in Rust to Link Prismio

```rust
// build.rs
fn main() {
    println!("cargo:rustc-link-search=native=../prismio/target/release");
    println!("cargo:rustc-link-lib=dylib=prismio");
}
```

---

## Safety Boundary Management

Both Prismio and Rust have ownership models, but they are **completely separate** across the FFI boundary. Each language's safety guarantees stop at the boundary.

### Key Rules

| Rule | Why |
|------|-----|
| Never pass Prismio-managed pointers to Rust (or vice versa) without explicit ownership transfer | Each runtime has its own allocator |
| Define clear ownership: who allocates, who frees | Crossing allocators causes undefined behavior |
| Use `unsafe` on both sides | Both languages require explicit acknowledgment |
| Prefer passing by value for small types | Avoids pointer/lifetime complexity |
| Use opaque handles for complex types | Don't expose internal structure |

### Ownership Transfer Pattern

When transferring ownership of heap-allocated data across the boundary, document it explicitly:

```prismio
// Prismio allocates, Rust must call prismio_free_buffer to release
#[export]
extern "C" fn prismio_create_buffer(size: UInt) -> *UInt8 {
    let buf = Array.allocate(size)
    return buf.rawPtr()
    // Ownership transferred to caller — Rust must free this
}

#[export]
extern "C" fn prismio_free_buffer(ptr: *UInt8) {
    unsafe { Array.deallocate(ptr) }
}
```

```rust
// Rust calls Prismio and manages lifetime
extern "C" {
    fn prismio_create_buffer(size: usize) -> *mut u8;
    fn prismio_free_buffer(ptr: *mut u8);
}

struct PrismioBuffer {
    ptr: *mut u8,
    len: usize,
}

impl Drop for PrismioBuffer {
    fn drop(&mut self) {
        unsafe { prismio_free_buffer(self.ptr) }
    }
}

impl PrismioBuffer {
    fn new(size: usize) -> Self {
        let ptr = unsafe { prismio_create_buffer(size) };
        PrismioBuffer { ptr, len: size }
    }
}
```

### Error Handling Across the Boundary

Rust panics and Prismio panics must not cross the FFI boundary. Catch them on each side:

```rust
// Rust side — catch panics before returning to Prismio
use std::panic;

#[no_mangle]
pub extern "C" fn rust_safe_operation(x: i32) -> i32 {
    let result = panic::catch_unwind(|| {
        // Rust code that might panic
        risky_operation(x)
    });
    match result {
        Ok(val) => val,
        Err(_) => -1,  // Return error sentinel instead of propagating panic
    }
}
```

```prismio
// Prismio side — handle error return values from Rust
extern "C" fn rust_safe_operation(x: Int32) -> Int32

fn safeCall(x: Int) -> Result<Int, String> {
    let result = unsafe { rust_safe_operation(x as Int32) }
    if result < 0 {
        return .err("Rust function encountered an error")
    }
    return .ok(result as Int)
}
```

---

## Complete Integration Example

Here is a complete example of a Rust image processing library called from Prismio:

### Rust Library (`image_proc/src/lib.rs`)

```rust
use std::os::raw::{c_uchar, c_uint};

#[repr(C)]
pub struct ImageResult {
    pub data: *mut c_uchar,
    pub width: c_uint,
    pub height: c_uint,
    pub error_code: c_uint,
}

#[no_mangle]
pub extern "C" fn image_grayscale(
    data: *const c_uchar,
    width: c_uint,
    height: c_uint,
) -> ImageResult {
    if data.is_null() {
        return ImageResult { data: std::ptr::null_mut(), width: 0, height: 0, error_code: 1 };
    }
    
    let pixel_count = (width * height) as usize;
    let input = unsafe { std::slice::from_raw_parts(data, pixel_count * 3) };
    
    let mut output = vec![0u8; pixel_count];
    for i in 0..pixel_count {
        let r = input[i * 3] as f32;
        let g = input[i * 3 + 1] as f32;
        let b = input[i * 3 + 2] as f32;
        output[i] = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
    }
    
    let ptr = output.as_mut_ptr();
    std::mem::forget(output);  // Transfer ownership
    
    ImageResult { data: ptr, width, height, error_code: 0 }
}

#[no_mangle]
pub extern "C" fn image_free(result: ImageResult) {
    if !result.data.is_null() {
        let len = (result.width * result.height) as usize;
        unsafe { drop(Vec::from_raw_parts(result.data, len, len)) }
    }
}
```

### Prismio Caller

```prismio
#[repr(C)]
struct ImageResult {
    data: *UInt8
    width: UInt32
    height: UInt32
    errorCode: UInt32
}

#[link(name = "image_proc")]
extern "C" {
    fn image_grayscale(data: *UInt8, width: UInt32, height: UInt32) -> ImageResult
    fn image_free(result: ImageResult)
}

fn grayscale(pixels: [UInt8], width: Int, height: Int) -> Result<[UInt8], String> {
    let result = unsafe {
        image_grayscale(pixels.rawPtr(), width as UInt32, height as UInt32)
    }
    
    if result.errorCode != 0 {
        return .err("Image processing failed: error code {result.errorCode}")
    }
    
    let size = width * height
    let output = unsafe { Array.fromRawPtr(result.data, size) }
    unsafe { image_free(result) }
    
    return .ok(output)
}
```

---

## See Also

- [FFI Basics](/interop/ffi) — Core FFI concepts
- [ABI & Calling Conventions](/interop/abi) — Memory layout and calling conventions
- [C/C++ Interoperability](/interop/c_cpp) — C/C++ interop patterns
- [Memory Safety](/language/memory) — Prismio's ownership model
