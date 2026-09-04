# Roadmap

> 🚧 **Early Development Notice** – Prismio is currently in its **alpha / early development phase**. The compiler, standard library, and tooling are under active construction. This roadmap outlines the planned trajectory, but timelines are approximate and subject to change based on development progress and community feedback.

This page describes where Prismio is today, what is being built right now, and what is planned for future milestones on the path to a stable v1.0 release.

---

## Current Status

**Phase: Pre-Alpha / Core Development**

The Prismio compiler is being built from the ground up. The LLVM backend infrastructure is in place, and basic language features are being implemented iteratively. The language specification is being finalised in parallel with the compiler.

### What Works Today

The following features are in various stages of early implementation:

- ✅ Basic `fn` function declarations
- ✅ `let` and `let mut` variable declarations
- ✅ Type inference for basic types (`Int`, `Float`, `Bool`, `String`)
- ✅ `println()` and `print()` standard output
- ✅ `input()` for reading standard input
- ✅ `if` / `else` control flow
- ✅ `for` loops
- ✅ Basic array literals `[Type]`
- ✅ String interpolation (`$variable`)
- ✅ LLVM-based code generation

### What Is In Progress

- 🔄 Ownership and move semantics
- 🔄 Borrow checker implementation
- 🔄 Pattern matching (`match` expressions)
- 🔄 Closures and lambda syntax
- 🔄 Module and import system
- 🔄 Expression-body functions (`fn f(x: Int) -> Int = x * 2`)
- 🔄 UMS build system (basic scaffolding)

---

## Milestone Overview

```
Pre-Alpha (Now)
    │
    ▼
v0.1 Alpha ──── Core language, basic compiler
    │
    ▼
v0.2 Beta  ──── Standard library, UMS tooling
    │
    ▼
v0.3        ──── Advanced features (generics, traits)
    │
    ▼
v0.4        ──── Concurrency, async/await
    │
    ▼
v1.0 Stable ──── Production-ready, stable API
```

---

## v0.1 Alpha — Core Language

> 🚧 **In Progress**

The v0.1 milestone focuses on getting a **complete, self-consistent core language** that can compile and run meaningful programs. The compiler is expected to be feature-complete for this milestone, though not necessarily production-quality.

### Language Features

- [ ] Complete ownership and move semantics
- [ ] Full borrow checker with lifetime inference
- [ ] Pattern matching (`match`) with:
  - [ ] Literal patterns
  - [ ] Range patterns (`1..=10`)
  - [ ] Tuple patterns
  - [ ] Wildcard patterns (`_`)
  - [ ] Guard clauses (`_ if condition`)
- [ ] Closures and anonymous functions
- [ ] Complete module and import system
- [ ] `Option<T>` type for nullable values
- [ ] `Result<T, E>` type for error handling
- [ ] `?` error propagation operator
- [ ] Basic generics (type parameters)
- [ ] Struct definitions
- [ ] Enum definitions (with associated values)

### Compiler

- [ ] Complete LLVM IR code generation
- [ ] Basic optimisation pipeline
- [ ] Comprehensive, actionable error messages
- [ ] Source location tracking in errors
- [ ] Incremental compilation (basic)

### Tooling

- [ ] `prismc` command-line compiler
- [ ] UMS project creation (`ums new`)
- [ ] UMS build command (`ums build`)
- [ ] UMS run command (`ums run`)

### Example — What v0.1 Code Looks Like

```prismio
import std.collections.Vec

struct Point {
    x: Float,
    y: Float
}

fn distance(a: &Point, b: &Point) -> Float {
    let dx = a.x - b.x
    let dy = a.y - b.y
    return sqrt(dx * dx + dy * dy)
}

fn main() {
    let origin = Point { x: 0.0, y: 0.0 }
    let point  = Point { x: 3.0, y: 4.0 }
    println(distance(&origin, &point))  // 5.0
}
```

---

## v0.2 Beta — Standard Library & Tooling

> 🚧 **Planned**

The v0.2 milestone focuses on the **standard library** and maturing the **UMS tooling**. The goal is that Prismio programs can do useful real-world work without reaching for C interop.

### Standard Library (`std`)

- [ ] `std.io` — file I/O, buffered readers/writers
- [ ] `std.fs` — filesystem operations (read, write, list dirs, etc.)
- [ ] `std.collections` — `Vec<T>`, `HashMap<K, V>`, `HashSet<T>`, `LinkedList<T>`
- [ ] `std.string` — string manipulation utilities
- [ ] `std.math` — common mathematical functions
- [ ] `std.env` — environment variables, command-line arguments
- [ ] `std.time` — date/time, duration, timing
- [ ] `std.process` — spawning and managing child processes
- [ ] `std.net` (basic) — TCP/UDP sockets

### UMS Package Manager

- [ ] `ums.toml` project manifest format
- [ ] Dependency declaration and resolution
- [ ] Package registry (prismio.dev/packages)
- [ ] `ums add <package>` command
- [ ] `ums remove <package>` command
- [ ] Lock file for reproducible builds
- [ ] `ums publish` for publishing packages

### Testing

- [ ] Built-in test runner (`ums test`)
- [ ] `#[test]` attribute for test functions
- [ ] `assert!`, `assert_eq!`, `assert_ne!` macros

```prismio
// 🚧 Coming Soon — test syntax example
#[test]
fn test_addition() {
    assert_eq(add(2, 3), 5)
    assert_eq(add(-1, 1), 0)
}
```

### Documentation

- [ ] `ums doc` — generates HTML documentation from doc comments
- [ ] Doc comment syntax (`///`)

```prismio
/// Computes the factorial of a non-negative integer.
///
/// # Panics
/// Panics if `n` is negative.
///
/// # Examples
/// ```
/// let result = factorial(5)
/// assert_eq(result, 120)
/// ```
fn factorial(n: Int) -> Int {
    if n <= 1 { return 1 }
    return n * factorial(n - 1)
}
```

---

## v0.3 — Advanced Type System

> 🚧 **Planned**

The v0.3 milestone brings **full generics**, **traits** (interfaces with default implementations), and **type classes**.

### Generics

- [ ] Generic functions: `fn identity<T>(x: T) -> T = x`
- [ ] Generic structs: `struct Pair<A, B> { first: A, second: B }`
- [ ] Generic enums: `enum Option<T> { Some(T), None }`
- [ ] Bounded generics: `fn max<T: Comparable>(a: T, b: T) -> T`
- [ ] Multiple bounds: `fn serialize<T: Display + Serialize>(value: T)`

```prismio
// 🚧 Coming Soon — generics example
fn first<T>(items: &[T]) -> Option<&T> {
    if items.is_empty() { return None }
    return Some(&items[0])
}

fn main() {
    let numbers = [10, 20, 30]
    let strings = ["hello", "world"]

    match first(&numbers) {
        Some(n) -> println("First number: $n")
        None    -> println("Empty")
    }

    match first(&strings) {
        Some(s) -> println("First string: $s")
        None    -> println("Empty")
    }
}
```

### Traits

- [ ] `trait` declarations with method signatures
- [ ] Default method implementations in traits
- [ ] `impl Trait for Type` implementations
- [ ] Trait objects (`dyn Trait`)
- [ ] Derived implementations (`#[derive(Debug, Clone, Eq)]`)

```prismio
// 🚧 Coming Soon — traits example
trait Describable {
    fn describe(self: &Self) -> String

    fn print_description(self: &Self) {
        println(self.describe())
    }
}

struct Circle { radius: Float }

impl Describable for Circle {
    fn describe(self: &Circle) -> String = "Circle with radius ${self.radius}"
}
```

### Type Aliases

- [ ] `type Alias = ExistingType`
- [ ] Generic type aliases

---

## v0.4 — Concurrency & Async

> 🚧 **Planned**

Prismio's concurrency model will build on the ownership system to provide **data-race-free concurrent programming** without a global lock.

### Threads

- [ ] `std.thread.spawn()` for creating OS threads
- [ ] Ownership-based thread safety — the compiler prevents sending non-`Send` types across threads
- [ ] `std.sync` — `Mutex<T>`, `RwLock<T>`, `Arc<T>` for shared state

### Async/Await

- [ ] `async fn` declarations
- [ ] `await` expression
- [ ] Async executor in the standard library
- [ ] `Future<T>` type

```prismio
// 🚧 Coming Soon — async example
async fn fetch_data(url: String) -> Result<String, Error> {
    let response = http.get(url).await?
    return Ok(response.body)
}

async fn main() {
    match fetch_data("https://api.example.com/data").await {
        Ok(data) -> println(data)
        Err(e)   -> println("Error: $e")
    }
}
```

### Channels

- [ ] `std.sync.channel()` for message passing
- [ ] Typed channels: `Sender<T>`, `Receiver<T>`
- [ ] Buffered and unbuffered channels

---

## v0.5 — C Interoperability

> 🚧 **Planned**

The ability to call C libraries (and be called from C) is critical for ecosystem integration — game engines, system libraries, graphics APIs.

- [ ] `extern "C"` function declarations
- [ ] `unsafe` blocks for raw pointer operations
- [ ] C header binding generator
- [ ] Linking against static and dynamic libraries
- [ ] `#[repr(C)]` for C-compatible struct layout

```prismio
// 🚧 Coming Soon — C interop example
extern "C" {
    fn printf(format: *const Char, ...) -> Int
}

fn main() {
    unsafe {
        printf("Hello from C: %d\n\0".as_ptr(), 42)
    }
}
```

---

## v1.0 — Stable Release

> 🚧 **Long-Term Goal**

The v1.0 release marks Prismio's transition to **production-ready stability**. It represents:

- The language specification is frozen (backward-compatible changes only).
- The standard library APIs are stable with a formal deprecation policy.
- The compiler produces production-quality error messages.
- The UMS package registry is publicly available.
- Comprehensive documentation covers the full language.
- A community-driven RFC process is in place for language evolution.

### v1.0 Requirements Checklist

- [ ] All v0.x milestone features completed
- [ ] Language specification document published
- [ ] Standard library coverage sufficient for common tasks
- [ ] Stable ABI for library consumers
- [ ] Cross-platform support verified: Linux, macOS, Windows
- [ ] Performance benchmarks published
- [ ] Security audit of the standard library
- [ ] Comprehensive test suite with high coverage
- [ ] At least one non-trivial real-world project built with Prismio

---

## Wishlist / Post-v1.0 Ideas

The following features are on the long-term wishlist but are not committed to any specific milestone:

- **Compile-time metaprogramming** — macros or compile-time functions for code generation.
- **WASM target** — first-class WebAssembly compilation.
- **Embedded / bare-metal target tier** — formally supported embedded targets (ARM Cortex-M, RISC-V).
- **Reflection API** — runtime introspection of types (opt-in, zero-cost when unused).
- **Language Server Protocol (LSP) server** — for IDE integration (autocomplete, go-to-definition, refactoring).
- **Prismio playground** — browser-based online compiler for quick experimentation.
- **Mobile targets** — Android NDK and iOS support.
- **GPU compute** — shader-like compute kernels (very long-term).
- **Formal verification** — integration with proof systems for safety-critical code.

---

## How to Follow Development

- ⭐ Star the repository on GitHub to get notified of releases.
- 📣 Watch the GitHub Discussions for design proposals and community conversations.
- 🐛 File issues for bugs, feature requests, and questions.
- 🤝 Contributions are welcome — check `CONTRIBUTING.md` in the repository.

---

## See Also

- [Versioning & Stability](./versioning.md) — Stability guarantees and what "stable" means in Prismio.
- [Introduction](./introduction.md) — Get started with Prismio today.
- [Design Goals](./design_goals.md) — The principles guiding development decisions.
