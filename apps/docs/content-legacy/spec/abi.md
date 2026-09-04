# ABI Specification

> 🚧 **Coming Soon** – The Prismio ABI is being finalized. This page describes the planned specification.

## Overview

The Prismio **Application Binary Interface (ABI)** defines:
- How data is laid out in memory
- How functions are called (calling convention)
- How the runtime interacts with the OS
- How Prismio code interfaces with C and other languages

A stable ABI is critical for interoperability and plugin/library systems. Prismio will provide a **stable C-compatible ABI** for public APIs.

---

## Data Layout

### Primitive Types

| Type | Size | Alignment |
|------|------|-----------|
| `Bool` | 1 byte | 1 |
| `Int8` / `UInt8` | 1 byte | 1 |
| `Int16` / `UInt16` | 2 bytes | 2 |
| `Int32` / `UInt32` | 4 bytes | 4 |
| `Int64` / `UInt64` | 8 bytes | 8 |
| `Int` / `UInt` | 8 bytes (64-bit) | 8 |
| `Float32` | 4 bytes | 4 |
| `Float` / `Float64` | 8 bytes | 8 |
| `Char` | 4 bytes (Unicode scalar) | 4 |
| Pointer | 8 bytes (64-bit) | 8 |

### Structs

Struct fields are laid out in declaration order. Padding is inserted to satisfy alignment requirements:

```prismio
// Planned
struct Example {
    a: Bool,     // offset 0, size 1
    // 3 bytes padding
    b: Int32,    // offset 4, size 4
    c: Float64,  // offset 8, size 8
}
// Total: 16 bytes, alignment: 8
```

### Packed Structs

> 🚧 **Coming Soon** – `#[repr(packed)]` will allow removing padding.

### C-Compatible Layout

> 🚧 **Coming Soon** – `#[repr(C)]` will guarantee C-compatible layout for FFI.

---

## Calling Convention

### Default (Prismio) Convention

The Prismio compiler uses an efficient calling convention optimized for Prismio code. This convention may change between compiler versions.

### C-Compatible Convention

For interoperability, Prismio follows the platform's C ABI when calling `extern` functions or being called from C:

| Platform | Convention |
|----------|-----------|
| Linux x86_64 | System V AMD64 ABI |
| macOS x86_64 | System V AMD64 ABI |
| macOS ARM64 | Apple ARM64 ABI |
| Windows x64 | Microsoft x64 ABI |

### System V AMD64 ABI (Linux/macOS x86_64)

**Integer/pointer arguments:** `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`, then stack

**Float arguments:** `xmm0`–`xmm7`, then stack

**Return values:** `rax` (integer), `xmm0` (float), or struct return pointer in `rdi`

**Caller-saved:** `rax`, `rcx`, `rdx`, `rsi`, `rdi`, `r8`–`r11`, `xmm0`–`xmm15`

**Callee-saved:** `rbx`, `rbp`, `r12`–`r15`

---

## Name Mangling

Prismio mangles function names to encode type information and enable overloading.

### Prismio Mangling Scheme

> 🚧 **Subject to change** – The exact mangling scheme is not yet stabilized.

Example: `fn add(a: Int, b: Int) -> Int` might mangle to:
```
_Pm3add_ii_i
```

Where: `_Pm` = Prismio prefix, `3add` = 3-char name "add", `_ii` = two Int params, `_i` = Int return.

### C-Compatible Names (No Mangling)

```prismio
// Planned: export with C name for FFI
#[no_mangle]
pub extern fn prismio_add(a: Int32, b: Int32) -> Int32 {
    a + b
}
```

---

## Symbol Visibility

| Visibility | Exported in binary? | Description |
|------------|--------------------|-|
| `pub` | ✅ | Accessible from other modules |
| (private) | ❌ | Internal only |
| `#[no_mangle] pub extern` | ✅ (C name) | C-compatible export |

---

## Panic/Exception ABI

When a Prismio program panics:

1. The panic message is formatted
2. The stack is unwound (if unwinding is enabled)
3. Destructors (`drop`) are called for all stack-allocated values
4. The process exits with a non-zero status code

```
Panic mechanism:
  panic(message) → unwind stack → call destructors → exit(1)
```

> 🚧 **Coming Soon** – Stack unwinding and panic hooks are being implemented.

### Panic vs Abort

Prismio can be configured to either:
- **Unwind** (default): unwind the stack on panic, running destructors
- **Abort** (smaller binary): immediately terminate on panic

```toml
# prismio.toml (planned)
[profile.release]
panic = "abort"   # or "unwind"
```

---

## Versioning

The Prismio ABI is **not yet stable** (pre-1.0). Breaking ABI changes may occur.

After v1.0:
- The **stable C ABI** (`extern fn` with `#[no_mangle]`) will be guaranteed stable
- The internal Prismio ABI may still change between major versions
- Libraries should use the stable C ABI for cross-version compatibility

---

## Platform-Specific Notes

### Windows

On Windows, Prismio uses MSVC-compatible calling conventions for interoperability with the Windows ecosystem. The Structured Exception Handling (SEH) ABI is used for panic handling.

### WebAssembly

WASM has its own ABI defined by the [Component Model](https://github.com/WebAssembly/component-model) proposal. Prismio will support WASM interface types for interoperability with JavaScript.

### iOS / macOS ARM64

Apple's ARM64 ABI extensions (Pointer Authentication, Arm64e) will be supported on Apple Silicon.

See also: [Interoperability](../interop/ffi.md), [Platform Targets](../platform/linux.md)
