# Why Prismio?

The programming language landscape is crowded. Rust exists. Go exists. C++ has decades of momentum. Kotlin runs on the JVM and compiles to native. Swift powers Apple platforms. So why does Prismio exist, and why should you care?

The honest answer: **no existing language hits the exact intersection of safety, performance, and readability that Prismio aims for** — and the few that come close carry significant historical baggage or ecosystem constraints that make them painful to use for certain workloads.

This page explains what gap Prismio fills, who it is designed for, and how it compares to the languages you already know.

---

## The Problem Space

Most programming language choices force a trade-off:

- Want **safety and native performance**? Use Rust — but be prepared for a steep learning curve, complex lifetime annotations, and long compile times.
- Want **simplicity and fast compilation**? Use Go — but accept garbage collection, limited generics, and a type system that can feel restrictive.
- Want **maximum control**? Use C++ — but shoulder the full burden of memory management, undefined behaviour, and thirty years of accumulated complexity.
- Want **great ergonomics**? Use Kotlin or Swift — but accept a runtime (JVM/ART) or platform lock-in (Apple ecosystem).
- Want **scripting convenience**? Use Python — but give up native speed and static type safety.

**Prismio's thesis**: these trade-offs are not fundamental. With the right design, you can have a language that is:

- As safe as Rust — but with friendlier syntax.
- As fast as C++ — but without undefined behaviour.
- As readable as Kotlin — but without a garbage collector.
- As expressive as Swift — but cross-platform.

---

## Motivation: What Sparked Prismio?

Prismio was born from a recurring frustration: the most performant, safe systems languages demanded an enormous cognitive tax just to *use*, while the ergonomic languages that were pleasant to write in introduced runtime costs (GC pauses, JVM warm-up, interpreter overhead) that disqualified them for performance-critical work.

The goal became clear: build a language where **clarity is not sacrificed on the altar of performance**, and **performance is not sacrificed on the altar of clarity**.

The result is Prismio — a language designed so that the obvious way to write something is also the correct, efficient, and safe way.

---

## Prismio vs. Other Languages

### Prismio vs. Rust

Rust is the closest spiritual ancestor to Prismio. Both use an ownership model for memory safety. Both compile to native code via LLVM. Both have no garbage collector.

**Where Prismio differs from Rust:**

| Aspect | Rust | Prismio |
|---|---|---|
| Syntax | Terse, symbol-heavy | Keyword-rich, more readable |
| Lifetime annotations | Explicit and pervasive | Inferred where possible |
| Learning curve | Very steep | Gentle-to-moderate |
| Compile times | Known to be slow | Designed to be fast |
| Error messages | Very good | Designed to be excellent |
| Unsafe blocks | Supported | Planned (🚧 Coming Soon) |

**In code — the same concept in Rust vs. Prismio:**

```kotlin
// Rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

```prismio
// Prismio
fn greet(name: &String) -> String = "Hello, $name!"
```

Prismio takes the core safety innovations of Rust and wraps them in a syntax that is closer to Kotlin — more expressive, more approachable, and less punctuation-heavy.

> **When to choose Rust instead**: Rust has a mature ecosystem, a large community, and battle-tested tooling. If you need those today, Rust is the right call. Prismio is the right call when you are building for the long term and want a more ergonomic path to the same safety guarantees.

---

### Prismio vs. Go

Go prioritises simplicity and fast compilation above almost everything else. It is deliberately constrained and opinionated.

**Where Prismio differs from Go:**

| Aspect | Go | Prismio |
|---|---|---|
| Memory management | Garbage collector | Ownership model (no GC) |
| Performance | Good, with GC pauses | Native, deterministic |
| Type system | Structural typing, limited generics | Static typing, full generics (🚧 planned) |
| Error handling | Explicit `err` return values | `Result<T, E>` with `?` operator (🚧 planned) |
| Closures | Limited | Full closure support |
| Syntax | Minimal | Expressive but clear |

```prismio
// Prismio — no GC, deterministic cleanup
fn process_file(path: String) {
    let file = File.open(path)  // ownership taken
    // ... do work ...
}  // file is freed here — no GC needed
```

> **When to choose Go instead**: Go's simplicity, fast compile times, and outstanding concurrency primitives (`goroutines`, `channels`) make it excellent for networked services and infrastructure tooling. If GC pauses are acceptable for your workload, Go is very productive. Prismio targets workloads where GC pauses are *not* acceptable.

---

### Prismio vs. C++

C++ is the incumbent for systems and game programming. It is extraordinarily powerful and has unparalleled ecosystem breadth.

**Where Prismio differs from C++:**

| Aspect | C++ | Prismio |
|---|---|---|
| Memory safety | Manual, error-prone | Guaranteed by ownership model |
| Undefined behaviour | Pervasive | Eliminated by design |
| Syntax | Complex, multi-paradigm | Clean and consistent |
| Build system | Fragmented (CMake, Make, Bazel…) | Built-in UMS |
| Compile times | Often very slow | Designed to be faster |
| Backward compatibility | Enormous burden | None — breaking changes possible pre-1.0 |

C++ allows you to write incredibly unsafe code in incredibly many ways. Prismio takes the same performance target but makes the memory model the *compiler's* problem, not yours.

```prismio
// Prismio — no manual memory management required
fn main() {
    let data = [1, 2, 3, 4, 5]
    for item in data {
        println(item)
    }
}  // data freed automatically — no delete[], no RAII ceremony
```

> **When to choose C++ instead**: C++ has an irreplaceable ecosystem — game engines, graphics libraries, finance frameworks, scientific computing. If you need to integrate with that ecosystem deeply, C++ is the pragmatic choice. Prismio's interoperability story with C/C++ is on the roadmap but not yet mature.

---

### Prismio vs. Kotlin

Kotlin is a joy to write. Its syntax heavily inspired Prismio. But Kotlin runs on the JVM (or compiles to native via Kotlin/Native), bringing a runtime with it.

**Where Prismio differs from Kotlin:**

| Aspect | Kotlin | Prismio |
|---|---|---|
| Runtime | JVM / LLVM (Kotlin/Native) | LLVM only — no runtime |
| Memory management | GC (JVM or Kotlin/Native GC) | Ownership model (no GC) |
| Startup time | JVM: slow; Native: fast | Instant |
| Ecosystem | Massive (JVM) | Early stage |
| Null safety | Nullable types (`String?`) | `Option<T>` |
| Syntax inspiration | Direct ancestor | Very similar to Kotlin |

If you love Kotlin's syntax and want to write systems code without a GC, Prismio will feel immediately familiar:

```kotlin
// Kotlin
fun greet(name: String): String {
    return "Hello, $name!"
}
```

```prismio
// Prismio — nearly identical
fn greet(name: String) -> String {
    return "Hello, $name!"
}
```

> **When to choose Kotlin instead**: Kotlin's JVM ecosystem is unmatched for enterprise software, Android development, and Spring-based backends. If you are in those spaces, Kotlin is the clear winner. Prismio targets the native, GC-free space.

---

### Prismio vs. Swift

Swift is Apple's systems language — safe, fast, and ergonomic. It shares many goals with Prismio.

**Where Prismio differs from Swift:**

| Aspect | Swift | Prismio |
|---|---|---|
| Platform | Apple-first (Linux support is secondary) | Cross-platform from day one |
| Memory management | ARC (automatic reference counting) | Ownership model |
| Ecosystem | Apple ecosystem (excellent) | Early stage (general purpose) |
| Syntax | Modern, clean | Similar, Kotlin-influenced |
| Open source | Yes | Yes |

Prismio and Swift are philosophically similar, but Swift's identity is closely tied to Apple's platforms and ARC. Prismio opts for ownership/borrowing (no reference counting overhead) and is cross-platform by design.

> **When to choose Swift instead**: If you are targeting Apple platforms (iOS, macOS, tvOS, watchOS), Swift is the natural, best-supported choice. Prismio is for when you need to ship the same native code everywhere.

---

## Prismio's Unique Selling Points

To summarise, here is what Prismio brings to the table that no other single language does in exactly the same combination:

### 1. Kotlin-Like Syntax with Rust-Like Safety

You get the readability and expressiveness of a high-level language *and* compile-time memory safety — without choosing between them.

```prismio
// Readable like Kotlin, safe like Rust
fn find_maximum(numbers: [Int]) -> Option<Int> {
    if numbers.is_empty() {
        return None
    }

    let mut max = numbers[0]
    for n in numbers {
        if n > max {
            max = n
        }
    }
    return Some(max)
}
```

### 2. No Garbage Collector, No Manual `free()`

The ownership model means memory is managed *automatically at compile time*. You get the performance of manual memory management without its dangers.

### 3. First-Class Tooling from Day One

UMS (the build system and package manager) ships with the language. No Makefile archaeology, no CMake incantations, no dependency manager installed separately.

### 4. LLVM Backend — Real Native Performance

Not interpreted, not JIT-compiled, not bytecode-in-a-VM. Prismio programs are native binaries optimised by LLVM's world-class optimisation passes.

### 5. Designed for the Future

Prismio has no legacy to maintain pre-1.0. Every design decision can be reconsidered based on community feedback and real-world experience. The language can evolve cleanly without decades of backward-compatibility constraints.

---

## Target Audience

Prismio is built for:

### Systems Programmers
Building kernels, drivers, embedded firmware, or real-time systems where GC pauses are unacceptable and every byte of memory matters.

```prismio
// Deterministic, zero-allocation loop suitable for embedded/real-time
fn control_loop(sensor_value: Int) -> Int {
    let threshold = 100
    if sensor_value > threshold {
        return sensor_value - threshold
    }
    return 0
}
```

### Game Developers
Building games where frame times are sacred and a 50ms GC pause means a dropped frame, a broken experience, or a missed deadline.

### CLI and Developer Tool Authors
Building fast, single-binary command-line tools with instant start-up times and no runtime dependency on a JVM or interpreter.

### Performance-Critical Application Developers
Writing databases, networking stacks, compilers, game engines, scientific simulations — anything where performance is a first-class requirement.

### Developers Migrating from Kotlin/Swift
If you love Kotlin or Swift's syntax and want to bring that ergonomic experience to native, GC-free development, Prismio is designed for you.

---

## What Prismio Is NOT

It is equally important to be honest about what Prismio is not, at least at this stage:

- **Not a scripting language** — Prismio is compiled; it is not a replacement for Python or Bash for quick scripts.
- **Not a JVM language** — If you need the JVM ecosystem, use Kotlin or Java.
- **Not a research language** — Prismio is pragmatic. It draws on research but prioritises practical usability.
- **Not production-ready (yet)** — Prismio is in early development. Do not ship critical production software with it today. See the [Roadmap](./roadmap.md) for timelines.

---

## Summary

Prismio is for developers who want **the performance of C++, the safety of Rust, and the readability of Kotlin** — all in a single language with great built-in tooling.

If that combination excites you, you are exactly who Prismio was made for.

---

## See Also

- [Introduction](./introduction.md) — Get started with your first Prismio program.
- [Design Goals](./design_goals.md) — The core pillars that drive language decisions.
- [Language Comparison](./comparison.md) — A detailed feature-by-feature comparison table.
- [Roadmap](./roadmap.md) — What's coming and when.
