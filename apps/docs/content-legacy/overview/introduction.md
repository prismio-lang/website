# Introduction

Welcome to **Prismio** — a modern, statically typed, native-performance programming language designed to be expressive without being dangerous, fast without being arcane, and safe without slowing you down.

Prismio is built on the [LLVM](https://llvm.org/) compiler infrastructure, giving it access to decades of optimisation research and a wide array of target platforms — from desktop OSes to embedded systems. Its syntax draws inspiration from Kotlin, Rust, and Swift, blending the clarity of high-level languages with the control of systems-level ones.

---

## What Is Prismio?

Prismio is an **open-source, cross-platform, compiled programming language** with:

- **Static typing** with powerful **type inference** — you get safety without boilerplate.
- **Memory safety** through an **ownership and borrowing model** — no garbage collector, no dangling pointers, no use-after-free bugs.
- **Native performance** via LLVM — your code compiles to optimised machine code.
- **Readable, expressive syntax** — code that is easy to write *and* easy to read.
- A **built-in build system (UMS)** and **package manager** — zero-friction tooling from day one.

> **Note:** Prismio is currently in early development. Some features described in this documentation are planned but not yet fully implemented. These are clearly marked with a 🚧 **Coming Soon** notice.

---

## Your First Prismio Program

Every Prismio program begins at the `main` function. Here is the classic Hello, World:

```prismio
fn main() {
    println("Hello, World!")
}
```

That's it — no imports, no boilerplate classes, no semicolons. The `println` function writes a line of text to standard output.

Let's make it a little more interesting:

```prismio
fn main() {
    let name = "Prismio"
    let version = 1
    println("Welcome to $name v$version!")
}
```

Prismio infers the types of `name` (`String`) and `version` (`Int`) automatically. The `$variable` syntax inside strings is string interpolation.

---

## Core Goals

Prismio was designed around a small set of non-negotiable goals:

| Goal | What It Means |
|---|---|
| **Performance** | Compiles to native code via LLVM. No VM, no JIT warm-up, no GC pauses. |
| **Safety** | Ownership model eliminates whole classes of memory bugs at compile time. |
| **Clarity** | Syntax is consistent, minimal, and easy to scan. |
| **Productivity** | First-class tooling: build system, package manager, and helpful error messages. |
| **Portability** | Cross-platform from the ground up; one codebase runs everywhere LLVM targets. |

---

## Key Features at a Glance

### Static Typing with Type Inference

You write less, the compiler knows more:

```prismio
let x = 42          // Int — inferred
let pi = 3.14159    // Float — inferred
let active = true   // Bool — inferred
let greeting: String = "Hello"  // explicit annotation also works
```

### Immutability by Default

Variables are immutable unless explicitly declared mutable. This prevents entire categories of bugs:

```prismio
let answer = 42
// answer = 43  // ❌ compile error — answer is immutable

let mut counter = 0
counter = counter + 1  // ✓ fine — counter is mutable
```

### Functions

Functions are first-class citizens. They can be concise one-liners or full multi-line bodies:

```prismio
// Expression-body form
fn square(x: Int) -> Int = x * x

// Block-body form
fn greet(name: String) -> String {
    let message = "Hello, $name!"
    return message
}

fn main() {
    println(square(7))      // 49
    println(greet("Anya"))  // Hello, Anya!
}
```

### Ownership and Memory Safety

Prismio uses an ownership model inspired by Rust. Every value has a single owner, and the compiler enforces this at compile time:

```prismio
fn main() {
    let data = [1, 2, 3, 4, 5]
    process(data)
    // `data` has been moved — you cannot use it here
}

fn process(items: [Int]) {
    for item in items {
        println(item)
    }
}
```

> 🚧 **Coming Soon** – The full ownership, borrowing, and lifetime system is under active development. The semantics described here represent the target design.

### Pattern Matching

Prismio has expressive `match` expressions that work on values, types, and structures:

```prismio
fn describe(n: Int) -> String {
    match n {
        0       -> "zero"
        1..=9   -> "single digit"
        10..=99 -> "double digit"
        _       -> "large number"
    }
}

fn main() {
    println(describe(0))   // zero
    println(describe(7))   // single digit
    println(describe(42))  // double digit
    println(describe(100)) // large number
}
```

> 🚧 **Coming Soon** – Pattern matching syntax and range patterns are planned for an upcoming release.

### Standard I/O

Reading and writing to the terminal is straightforward:

```prismio
fn main() {
    print("What is your name? ")
    let name = input()
    println("Nice to meet you, $name!")
}
```

- `print()` — writes without a trailing newline.
- `println()` — writes with a trailing newline.
- `input()` — reads a line from standard input and returns it as a `String`.

### Arrays

```prismio
fn main() {
    let numbers: [Int] = [10, 20, 30, 40, 50]

    for n in numbers {
        print("$n ")
    }
    println("")  // newline
}
```

### Closures

Prismio supports closures (anonymous functions) with a concise lambda syntax:

```prismio
fn main() {
    let double = { x: Int -> x * 2 }
    let numbers = [1, 2, 3, 4, 5]

    for n in numbers {
        println(double(n))
    }
}
```

> 🚧 **Coming Soon** – Higher-order collection functions (`map`, `filter`, `reduce`) are planned for the standard library.

---

## Who Is Prismio For?

Prismio targets developers who need **all three** of the following at once:

- **High performance** — close-to-the-metal speed, no garbage collector pauses, predictable latency.
- **Memory safety** — compile-time guarantees that eliminate use-after-free, null derefs, and data races.
- **Readable code** — syntax that doesn't require a PhD to understand or maintain.

That makes Prismio a compelling choice for:

- **Systems programmers** building OSes, drivers, and embedded software.
- **Game developers** needing deterministic frame budgets with no GC hiccups.
- **CLI tool authors** who want fast start-up times and single-binary distribution.
- **Performance-critical application developers** — networking, databases, compilers.
- **Developers coming from Kotlin or Swift** who want similar ergonomics at native speed.

---

## Current Status

Prismio is in **early / alpha development**. The language specification is being finalised and the compiler is under active construction. This means:

- Core language features are being implemented iteratively.
- The standard library is minimal and growing.
- APIs and syntax **may change** before v1.0 stabilises.
- Community contributions and feedback are warmly welcomed.

See the [Roadmap](./roadmap.md) for a detailed breakdown of planned milestones, and the [Versioning & Stability](./versioning.md) page for stability guarantees.

---

## Next Steps

Now that you have a feel for what Prismio is, dive deeper:

- [Design Goals](./design_goals.md) — The philosophy and pillars behind the language.
- [Why Prismio?](./why_prismio.md) — How Prismio compares to Rust, Go, C++, and others.
- [Language Syntax](../language/syntax.md) — A complete tour of the language's syntax.
- [Roadmap](./roadmap.md) — What's coming next.

---

*Prismio is created and maintained by [Saksham Jaiswal](mailto:vibrant.official275@gmail.com). Contributions are welcome.*
