# Design Goals

Every programming language is shaped by the values its designers hold. Prismio was not created by accident — it was crafted around a clear set of **design pillars** that guide every decision: from syntax choices to memory semantics to tooling philosophy.

This page describes those pillars, explains the *why* behind each one, and shows how they manifest in real Prismio code.

---

## Overview

| Pillar | Summary |
|---|---|
| [1. Performance](#1-performance) | Native-speed execution via LLVM; zero-overhead abstractions. |
| [2. Safety](#2-safety) | Ownership & borrowing eliminates memory bugs at compile time. |
| [3. Clarity](#3-clarity) | Syntax that is readable, consistent, and self-documenting. |
| [4. Productivity](#4-productivity) | Great tooling, helpful errors, and a built-in build system. |
| [5. Portability](#5-portability) | One language, every platform LLVM can target. |
| [6. Expressiveness](#6-expressiveness) | Power-user features that don't compromise on simplicity. |

---

## 1. Performance

> *"Write it once. The compiler makes it fast."*

Prismio is **compiled to native machine code** via the LLVM compiler infrastructure. There is no virtual machine, no bytecode interpreter, and no garbage collector. This means:

- **No GC pauses** — latency is deterministic.
- **No warm-up** — full performance from the first instruction.
- **Full LLVM optimisation passes** — your code benefits from decades of compiler research.

### Zero-Overhead Abstractions

Prismio follows the principle that you should not pay for what you do not use. High-level abstractions like closures, iterators, and pattern matching compile down to the same machine code you would write by hand.

```prismio
// This readable abstraction...
fn sum(numbers: [Int]) -> Int {
    let mut total = 0
    for n in numbers {
        total = total + n
    }
    return total
}

// ...compiles to a tight loop with no runtime overhead.
fn main() {
    let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    println(sum(data))  // 55
}
```

### Inline Functions

> 🚧 **Coming Soon** – The `inline` modifier for functions is planned to allow callers to request inlining at the call site, eliminating function-call overhead for hot paths.

### No Hidden Allocations

Prismio makes heap allocations **explicit**. If a value is on the stack, you know it. If it is on the heap, you said so. There are no hidden boxing operations silently inflating your memory footprint.

```prismio
// Stack-allocated integer — zero allocation cost
let x: Int = 42

// Heap allocation is explicit (via smart pointer types)
// 🚧 Coming Soon: Box<T>, Rc<T>, Arc<T> smart pointer types
```

---

## 2. Safety

> *"If it compiles, it's safe."*

Memory safety bugs — use-after-free, null pointer dereferences, buffer overflows, data races — are responsible for a significant proportion of real-world software vulnerabilities. Prismio eliminates them **at compile time** through an ownership and borrowing model.

### Ownership

Every value in Prismio has exactly **one owner**. When the owner goes out of scope, the value is freed — automatically, deterministically, and without a GC.

```prismio
fn main() {
    let message = "Hello from Prismio"
    deliver(message)
    // `message` has been moved; using it here is a compile error
}

fn deliver(text: String) {
    println(text)
}  // `text` is freed here — no manual delete needed
```

### Borrowing

You can **borrow** a value without taking ownership of it, giving you the ability to read or even mutate data without giving it up:

```prismio
fn print_length(text: &String) {
    println("Length: ${text.length()}")
    // `text` is borrowed — the caller still owns it
}

fn main() {
    let greeting = "Good morning!"
    print_length(&greeting)  // borrow
    println(greeting)        // still valid — ownership was never moved
}
```

> 🚧 **Coming Soon** – The full borrow checker, lifetime annotations, and mutable borrow rules are under active development.

### No Null by Default

Prismio does not have a null value for regular types. The absence of a value is modelled explicitly using an `Option` type:

```prismio
fn find_user(id: Int) -> Option<String> {
    if id == 1 {
        return Some("Alice")
    }
    return None
}

fn main() {
    match find_user(1) {
        Some(name) -> println("Found: $name")
        None       -> println("User not found")
    }
}
```

> 🚧 **Coming Soon** – `Option<T>`, `Result<T, E>`, and the `?` error propagation operator are planned for an upcoming release.

### Immutability by Default

Variables are immutable unless explicitly opted into mutability. This prevents accidental mutation and makes code easier to reason about:

```prismio
let config = "production"
// config = "debug"  // ❌ compile error

let mut retries = 0
retries = retries + 1  // ✓ explicit mutability
```

---

## 3. Clarity

> *"Code is read far more often than it is written."*

Prismio's syntax is designed to be **scannable**, **consistent**, and **self-documenting**. You should be able to understand what a piece of code does without memorising arcane rules.

### Consistent, Predictable Syntax

Function declarations always look the same. Type annotations always follow the `name: Type` pattern. There are no invisible rules or context-sensitive parsing surprises.

```prismio
// Function with a full body
fn add(a: Int, b: Int) -> Int {
    return a + b
}

// Function with expression body (equivalent)
fn multiply(a: Int, b: Int) -> Int = a * b

// Variables: name first, type second (when explicit)
let radius: Float = 5.0
let area: Float = 3.14159 * radius * radius
```

### Meaningful Error Messages

The Prismio compiler is designed to produce **actionable, human-readable error messages** that point to the root cause rather than a symptom. Errors tell you *what* went wrong, *where*, and *how to fix it*.

### No Operator Overloading Surprises

> 🚧 **Coming Soon** – Operator overloading will be supported but with explicit trait-based definitions — you will always know what `+` means for a given type.

### Self-Documenting Code

Prismio encourages code that documents itself through expressive naming and pattern matching rather than comments:

```prismio
fn classify_temperature(celsius: Float) -> String {
    match celsius {
        _ if celsius < 0.0  -> "freezing"
        0.0..=15.0          -> "cold"
        15.0..=25.0         -> "comfortable"
        25.0..=35.0         -> "warm"
        _                   -> "hot"
    }
}
```

---

## 4. Productivity

> *"The language should get out of your way."*

A language is only as good as its tooling. Prismio ships with everything you need to be immediately productive:

### Built-In Build System: UMS

Prismio comes with **UMS** (Unified Module System), a first-class build system that manages compilation, dependencies, and project structure without external configuration files or plugins.

```
# Create a new project
ums new my-app

# Build the project
ums build

# Run the project
ums run

# Run tests
ums test
```

> 🚧 **Coming Soon** – Full UMS documentation is being written as the tooling stabilises.

### Package Manager

UMS doubles as a package manager. Dependencies are declared in a project manifest and fetched automatically:

```prismio
// project.ums (example — format subject to change)
// dependencies:
//   prismio-json: "1.0"
//   prismio-http: "0.5"
```

> 🚧 **Coming Soon** – The package registry and dependency resolution are planned for a future milestone.

### Type Inference Reduces Boilerplate

Prismio infers types wherever it can, so you write less repetitive annotation without losing type safety:

```prismio
// Without inference (verbose)
let values: [Int] = [1, 2, 3]
let count: Int = 3
let message: String = "Items: $count"

// With inference (clean, equally safe)
let values = [1, 2, 3]
let count = 3
let message = "Items: $count"
```

### Imports Are Explicit

There are no wildcard imports. Every import names exactly what it brings into scope, making dependency tracking and tooling support straightforward:

```prismio
import std.io.File
import std.collections.HashMap
import app.models.User
```

---

## 5. Portability

> *"Write once, compile anywhere."*

Prismio's LLVM backend means it inherits LLVM's extensive list of supported targets — including:

- **Desktop**: Windows (x86-64, ARM64), macOS (x86-64, Apple Silicon), Linux (x86-64, ARM, RISC-V)
- **Mobile**: iOS, Android (via cross-compilation)
- **Embedded**: bare-metal ARM Cortex-M and similar targets
- **WebAssembly**: compile to Wasm for browser or server-side WASM runtimes

> 🚧 **Coming Soon** – Cross-compilation support and official target tiers are being defined as part of the v0.2 milestone.

### Platform Abstractions

The standard library provides clean platform abstractions so that most Prismio code does not need to be aware of the underlying OS:

```prismio
import std.fs

fn main() {
    // Works the same on Windows, macOS, and Linux
    let content = std.fs.read_text("config.txt")
    println(content)
}
```

> 🚧 **Coming Soon** – The `std.fs` module is planned for the standard library.

---

## 6. Expressiveness

> *"Powerful features; simple surface area."*

Prismio gives you the tools to express complex ideas concisely, without requiring you to twist the language into unusual shapes.

### Pattern Matching

Pattern matching is one of the most powerful tools in Prismio's arsenal. It works on values, types, structures, and ranges:

```prismio
fn describe_point(x: Int, y: Int) -> String {
    match (x, y) {
        (0, 0) -> "origin"
        (0, _) -> "on the y-axis"
        (_, 0) -> "on the x-axis"
        _      -> "somewhere in the plane"
    }
}
```

### Closures and Higher-Order Functions

Functions are values. Pass them around, store them, compose them:

```prismio
fn apply(value: Int, transform: { Int -> Int }) -> Int {
    return transform(value)
}

fn main() {
    let triple = { x: Int -> x * 3 }
    println(apply(7, triple))  // 21

    // Inline lambda
    println(apply(10, { x -> x + 5 }))  // 15
}
```

### Concise Expression Forms

Many constructs in Prismio are expressions — they produce values. This allows concise, functional-style code:

```prismio
fn abs(n: Int) -> Int = if n < 0 { -n } else { n }

fn main() {
    println(abs(-42))  // 42
    println(abs(7))    // 7
}
```

> 🚧 **Coming Soon** – Algebraic data types (enums with associated values), traits/interfaces, generics, and async/await are all planned features that will dramatically expand expressiveness.

---

## Balancing the Pillars

These six pillars do not always pull in the same direction. Safety can restrict what you write. Expressiveness can introduce complexity. Performance sometimes demands low-level control that hurts clarity.

Prismio's approach is to resolve these tensions in a principled way:

- **Safety wins over convenience** — if a safe version is available, it is the default.
- **Performance wins over runtime abstractions** — no GC, no VM.
- **Clarity wins over terseness** — short but cryptic syntax is rejected in favour of readable but slightly longer forms.
- **Productivity wins over purity** — pragmatic escape hatches exist (e.g., `unsafe` blocks for raw memory operations) when necessary.

> 🚧 **Coming Soon** – `unsafe` blocks for controlled low-level operations are planned but not yet specified.

---

## See Also

- [Language Philosophy](./philosophy.md) — Deeper dive into the values behind these goals.
- [Why Prismio?](./why_prismio.md) — How these goals differentiate Prismio from other languages.
- [Introduction](./introduction.md) — Getting started with Prismio.
