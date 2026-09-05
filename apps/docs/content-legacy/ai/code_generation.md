# Code Generation

Prismio uses **LLVM** as its code generation backend, inheriting decades of compiler research and achieving native-level performance across all supported platforms. The compiler transforms the **Typed AST (TAST)** through a series of lowering passes into LLVM Intermediate Representation (IR), which is then optimized and compiled to machine code.

> 🚧 **Coming Soon** – Full documentation of the code generation pipeline, target-specific tuning, and the public compiler intrinsic API will be published in a future release. This page describes the high-level design and planned architecture.

---

## Pipeline Overview

```
Typed AST (TAST)
     │
     ▼  MIR Lowering (planned)
 Mid-level IR (MIR)
     │
     ▼  LLVM IR Generation
 LLVM IR (.ll)
     │
     ▼  LLVM Optimization Passes
 Optimized LLVM IR
     │
     ▼  LLVM Backend (target-specific)
 Object File (.o)
     │
     ▼  Linker
 Native Binary / Library
```

---

## 1. IR Generation Strategy

The Prismio compiler translates each language construct to LLVM IR according to the following strategy:

### 1.1 Functions

Each Prismio function maps to a single LLVM function. The function's parameters and return type are translated using the **ABI calling convention** for the target platform.

```prismio
// Prismio source
fn add(a: Int, b: Int) -> Int = a + b
```

```llvm
; Generated LLVM IR (illustrative)
define i64 @prismio_add(i64 %a, i64 %b) {
entry:
  %result = add nsw i64 %a, %b
  ret i64 %result
}
```

### 1.2 Variables and Stack Allocation

Mutable local variables are heap-promoted if they escape, or kept on the stack using `alloca` otherwise. The LLVM `mem2reg` pass promotes stack allocations to SSA registers where possible.

```prismio
fn example() {
    let mut x = 0
    x = x + 1
    println(x)
}
```

```llvm
define void @prismio_example() {
entry:
  %x = alloca i64, align 8
  store i64 0, ptr %x
  %x_val = load i64, ptr %x
  %inc = add nsw i64 %x_val, 1
  store i64 %inc, ptr %x
  ; ... call to println
  ret void
}
```

### 1.3 Control Flow

| Prismio construct | LLVM IR construct |
|---|---|
| `if / else` | `br` + basic blocks |
| `while` | Loop header + `br` + `phi` nodes |
| `for ... in` | Iterator protocol lowering (planned) |
| `loop` | Unconditional `br` back edge |
| `break` | `br` to loop exit block |
| `return` | `ret` instruction |
| `match` | Decision tree or jump table |

### 1.4 Structs

Prismio structs map to LLVM `struct` types. Field offsets are computed using `getelementptr` (GEP) instructions.

```prismio
struct Point { x: Int, y: Int }
let p = Point { x: 3, y: 4 }
```

```llvm
%Point = type { i64, i64 }

; Allocation on stack
%p = alloca %Point, align 8
; Initialize fields using GEP
%x_ptr = getelementptr inbounds %Point, ptr %p, i32 0, i32 0
store i64 3, ptr %x_ptr
%y_ptr = getelementptr inbounds %Point, ptr %p, i32 0, i32 1
store i64 4, ptr %y_ptr
```

### 1.5 Enums

Tagged union representation:

- A **tag field** (integer discriminant) identifies the active variant.
- A **payload** union holds the data for all variants (sized to the largest variant).

```prismio
enum Shape {
    Circle(Float),
    Rectangle(Float, Float),
}
```

```llvm
; Illustrative: Shape = { tag: i8, payload: [largest_variant_bytes x i8] }
%Shape = type { i8, [16 x i8] }   ; tag + 16 bytes for largest variant
```

### 1.6 Match Expressions

Pattern matching compiles to an optimized **decision tree**. For exhaustive integer or discriminant matches, the compiler may emit an LLVM `switch` instruction:

```llvm
switch i8 %tag, label %unreachable [
  i8 0, label %match_circle
  i8 1, label %match_rectangle
]
```

### 1.7 Closures

> 🚧 **Coming Soon** – Closure lowering strategy is under design. Planned approach:
> - Non-capturing closures → plain function pointers
> - Capturing closures → heap-allocated environment struct + function pointer pair (fat pointer)

### 1.8 Monomorphization

Generic functions are **monomorphized** — the compiler generates a separate LLVM function for each unique type instantiation. This produces zero-cost abstractions with no runtime dispatch overhead.

```prismio
fn identity<T>(value: T) -> T = value

// These calls produce two separate LLVM functions:
identity(42)       // → @prismio_identity_Int
identity("hello")  // → @prismio_identity_String
```

---

## 2. Optimization Levels

Prismio exposes LLVM's optimization pipeline through the UMS build system:

| Flag | LLVM Level | Description |
|---|---|---|
| `--opt=0` | `-O0` | No optimization. Fastest compilation, largest binary. |
| `--opt=1` | `-O1` | Basic optimizations (constant folding, dead code elimination). |
| `--opt=2` | `-O2` | Standard optimizations. Recommended for release builds. |
| `--opt=3` | `-O3` | Aggressive optimization including auto-vectorization. |
| `--opt=s` | `-Os` | Optimize for binary size. |
| `--opt=z` | `-Oz` | Aggressive size optimization. |

```bash
# Debug build (no optimization, debug info)
ums build --debug

# Release build (O2 optimization)
ums build --release

# Custom optimization level
ums build --opt=3
```

> 🚧 **Coming Soon** – Profile-guided optimization (PGO) and link-time optimization (LTO) support are planned.

### Passes Enabled at `-O2`

- Inlining (with size threshold heuristics)
- Loop unrolling
- Dead code elimination (DCE)
- Global value numbering (GVN)
- Sparse conditional constant propagation (SCCP)
- Alias analysis (TBAA, BasicAA)
- `mem2reg` (stack-to-register promotion)
- `instcombine` (instruction combining)
- `reassociate` (expression reassociation)

---

## 3. Target-Specific Code Generation

Prismio's LLVM backend supports all targets that LLVM supports. The primary tier-1 targets are:

| Target | Architecture | OS |
|---|---|---|
| `x86_64-unknown-windows-msvc` | x86-64 | Windows |
| `x86_64-unknown-linux-gnu` | x86-64 | Linux |
| `aarch64-unknown-linux-gnu` | ARM64 | Linux |
| `aarch64-apple-darwin` | ARM64 | macOS |
| `x86_64-apple-darwin` | x86-64 | macOS |
| `wasm32-unknown-unknown` | WebAssembly | Browser/WASI |

```bash
# Cross-compile for Linux ARM64
ums build --target aarch64-unknown-linux-gnu --release

# Compile to WebAssembly
ums build --target wasm32-unknown-unknown
```

> 🚧 **Coming Soon** – Full cross-compilation toolchain support and target-specific tuning flags will be documented once stabilized.

### Target Feature Flags

LLVM allows enabling specific CPU features for performance:

```bash
# Enable AVX2 and FMA for x86-64
ums build --release --cpu-features avx2,fma

# Target native CPU features
ums build --release --cpu native
```

---

## 4. Debugging Info Emission (DWARF)

Prismio emits **DWARF** debugging information in debug builds, enabling source-level debugging with tools like `gdb`, `lldb`, and Visual Studio's debugger.

```bash
# Debug build automatically includes DWARF info
ums build --debug

# Inspect generated DWARF with llvm-dwarfdump (illustrative)
llvm-dwarfdump ./build/myapp
```

### What DWARF Info Includes

| Information | Description |
|---|---|
| **Source locations** | Maps each machine instruction to a file/line/column |
| **Variable locations** | Where each variable lives (register, stack slot, or memory) |
| **Type information** | Struct layouts, enum tags, and primitive types |
| **Function frames** | Unwind tables for stack traces and exception handling |
| **Inline information** | Which inlined calls contributed to each instruction |

> 🚧 **Coming Soon** – DWARF 5 support, split DWARF (`-gsplit-dwarf`) for faster incremental builds, and CodeView support (Windows PDB format) are planned.

### Debugging with LLDB

```bash
# Build with debug info
ums build --debug

# Start LLDB session
lldb ./build/myapp

# Set a breakpoint on a Prismio function
(lldb) b main
(lldb) run
(lldb) p x     # print variable x
```

---

## 5. Inspecting Generated IR

During development, you can inspect the generated LLVM IR:

```bash
# Emit unoptimized LLVM IR
ums build --emit-ir components/main.prism

# Emit optimized LLVM IR (after O2 passes)
ums build --release --emit-ir components/main.prism

# Emit human-readable assembly
ums build --release --emit-asm components/main.prism
```

> 🚧 **Coming Soon** – The `--emit-ir` and `--emit-asm` flags will be available in a future compiler release.

---

## See Also

- [ABI Specification](/spec/abi) — Calling conventions and data layout
- [AST Specification](/ai/ast) — The AST that feeds into code generation
- [Type Inference Model](/ai/type_inference) — Typed AST produced before IR lowering
- [Memory Model Specification](/spec/memory) — Ownership rules enforced before codegen
