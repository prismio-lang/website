# ABI & Calling Conventions

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The ABI specification described here reflects the current design and is subject to change before the 1.0 release.

The **Application Binary Interface (ABI)** defines the low-level contract between compiled code units: how functions receive arguments, how they return values, how data is laid out in memory, and how symbols are named in the binary. Understanding Prismio's ABI is essential for interoperating with other languages and for writing performance-critical or systems-level code.

---

## Prismio's Default Calling Convention

By default, Prismio uses its own internal calling convention, which is unspecified and may be optimized across compiler versions. This convention is used for all pure Prismio-to-Prismio calls and should not be assumed to be stable between compiler versions.

```prismio
// This uses Prismio's internal calling convention
fn add(a: Int, b: Int) -> Int {
    return a + b
}
```

For stable, cross-language interoperability, you must opt into a well-defined calling convention using an ABI specifier.

---

## C ABI Compatibility

The C ABI is the **lingua franca** of native code interoperability. Prismio supports the C ABI via the `extern "C"` annotation.

```prismio
// Imports a function using the C calling convention
extern "C" fn c_function(x: Int32, y: Int32) -> Int32

// Exports a Prismio function with C calling convention
#[export]
extern "C" fn prismio_function(x: Int32, y: Int32) -> Int32 {
    return x + y
}
```

### What the C ABI Guarantees

When `extern "C"` is used, Prismio guarantees:

- Arguments are passed according to the platform's C calling convention (e.g., System V AMD64 ABI on Linux x86_64)
- Return values follow C conventions (integers in registers, large structs via pointer)
- No name mangling is applied — the symbol name in the binary matches the function name exactly
- Stack alignment is respected per platform requirements

### Platform-Specific C ABI Implementations

| Platform | C ABI Standard |
|----------|---------------|
| Linux x86_64 | System V AMD64 ABI |
| Linux ARM64 | AAPCS64 |
| Windows x86_64 | Microsoft x64 calling convention |
| macOS x86_64 | System V AMD64 ABI |
| macOS ARM64 | Apple ARM64 ABI (AAPCS64 with Apple extensions) |
| WASM | WebAssembly ABI |

---

## Supported ABI Specifiers

Prismio supports multiple ABI specifiers beyond `"C"`:

| ABI String | Description |
|-----------|-------------|
| `"C"` | Standard C calling convention (platform default) |
| `"C-unwind"` | C ABI that allows unwinding through the call frame |
| `"system"` | Platform's preferred system ABI (Win32 on Windows, C on others) |
| `"win64"` | Windows x64 calling convention (even on non-Windows) |
| `"sysv64"` | System V AMD64 ABI (even on Windows) |
| `"fastcall"` | x86 fastcall convention |
| `"stdcall"` | x86 stdcall convention (used by Win32 API) |

```prismio
// Calling a Win32 API function
#[link(name = "kernel32")]
extern "stdcall" {
    fn GetLastError() -> UInt32
    fn Sleep(dwMilliseconds: UInt32)
}
```

---

## Struct Layout

Struct layout determines how fields are arranged in memory, including padding and alignment.

### `#[repr(C)]` — C-Compatible Layout

Use `#[repr(C)]` to guarantee that a struct has the same memory layout as its C equivalent:

```prismio
#[repr(C)]
struct Vec3 {
    x: Float32   // offset: 0, size: 4
    y: Float32   // offset: 4, size: 4
    z: Float32   // offset: 8, size: 4
}
// Total size: 12 bytes, alignment: 4 bytes
```

This matches the C struct:

```c
struct Vec3 {
    float x;   // offset: 0
    float y;   // offset: 4
    float z;   // offset: 8
};
```

### Alignment Rules Under `#[repr(C)]`

- Each field is aligned to its natural alignment (e.g., `Float64` aligns to 8 bytes)
- Padding bytes are inserted between fields as needed
- The total struct size is a multiple of its largest field's alignment

```prismio
#[repr(C)]
struct Mixed {
    a: UInt8     // offset: 0, size: 1
    // padding:  // offset: 1-3, size: 3 (to align b to 4 bytes)
    b: UInt32   // offset: 4, size: 4
    c: UInt8     // offset: 8, size: 1
    // padding:  // offset: 9-11, size: 3 (to make total size multiple of 4)
}
// Total size: 12 bytes, alignment: 4 bytes
```

### `#[repr(packed)]` — No Padding

```prismio
#[repr(packed)]
struct PackedHeader {
    magic: UInt32
    version: UInt8
    flags: UInt16
    length: UInt32
}
// Total size: 11 bytes — no padding inserted
// ⚠️ Unaligned access may be slow or trap on some architectures
```

### `#[repr(align(N))]` — Custom Alignment

```prismio
#[repr(C, align(16))]
struct SIMDVector {
    values: [Float32; 4]
}
// Guaranteed 16-byte alignment for SSE/NEON instructions
```

### Default Prismio Layout (`#[repr(prismio)]`)

Without any `repr` annotation, Prismio may reorder and pack fields for optimal performance. **Do not assume any specific layout** for structs without `#[repr(C)]`.

```prismio
// Prismio may reorder these fields internally
struct Optimized {
    flag: Bool       // may be moved
    count: Int32     // may be reordered
    ratio: Float64   // may be reordered
}
```

---

## Name Mangling

Name mangling is how the compiler transforms function names into unique symbol names in the binary.

### Prismio Name Mangling

By default, Prismio mangles function names to encode type information, namespaces, and modules. This is an **implementation detail** and is not stable across compiler versions:

```
fn compute(x: Int, y: Float64) -> Bool
// Mangled: _P7compute_i_f64_b  (example, not final)
```

### Disabling Mangling with `extern "C"`

Using `extern "C"` disables name mangling entirely, producing an unmangled symbol:

```prismio
#[export]
extern "C" fn my_function(x: Int32) -> Int32 {
    return x * 2
}
// Symbol in binary: "my_function"  (exactly as written)
```

You can verify exported symbols with platform tools:

```bash
# On Linux/macOS:
nm -D libmylib.so | grep my_function

# On Windows:
dumpbin /exports mylib.dll
```

### Custom Symbol Names

Use `#[export_name]` to specify an exact symbol name:

```prismio
#[export_name = "my_custom_symbol_v2"]
extern "C" fn internalName(x: Int32) -> Int32 {
    return x + 1
}
// Symbol in binary: "my_custom_symbol_v2"
```

---

## Platform-Specific Differences

### Linux (x86_64 — System V AMD64)

- First 6 integer/pointer arguments: `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`
- First 8 float arguments: `xmm0`–`xmm7`
- Return value: `rax` (integer), `xmm0` (float)
- Stack grows downward; 16-byte aligned at call site

### Windows (x86_64 — Microsoft x64)

- First 4 integer/pointer arguments: `rcx`, `rdx`, `r8`, `r9`
- First 4 float arguments: `xmm0`–`xmm3`
- Shadow space: 32 bytes reserved on the stack by caller
- Return value: `rax` (integer), `xmm0` (float)
- Stack 16-byte aligned

### macOS / Linux ARM64 (AAPCS64)

- First 8 integer/pointer arguments: `x0`–`x7`
- First 8 float arguments: `v0`–`v7`
- Return value: `x0` (integer), `v0` (float)
- Stack 16-byte aligned

### Struct Return Values

Large structs that don't fit in registers are returned via a hidden pointer argument (the caller allocates space and passes a pointer as the first argument):

```prismio
#[repr(C)]
struct BigStruct {
    a: Int64
    b: Int64
    c: Int64
}

// Internally compiled as: fn get_struct(out: *BigStruct) -> Void
extern "C" fn get_struct() -> BigStruct
```

---

## Verifying ABI Compatibility

Use the `#[assert_size]` and `#[assert_align]` compile-time attributes to verify that your types match expected sizes:

```prismio
#[repr(C)]
#[assert_size(16)]
#[assert_align(8)]
struct NetworkHeader {
    version: UInt8
    // padding: 3 bytes
    length: UInt32
    checksum: UInt64
}
// Compilation fails if size or alignment doesn't match
```

---

## See Also

- [FFI Basics](/interop/ffi) — How to declare and call external functions
- [C/C++ Interoperability](/interop/c_cpp) — Practical guide to C/C++ integration
- [Platform: Linux](/platform/linux) — Linux-specific ABI details
- [Platform: Windows](/platform/windows) — Windows-specific ABI details
- [Platform: macOS](/platform/macos) — macOS-specific ABI details
