# Language Comparison

Choosing a programming language is a significant decision. This page provides a **structured, honest comparison** between Prismio and the languages it is most often compared to: Rust, Go, C++, Swift, Kotlin, and Python.

The goal is not to declare winners and losers, but to help you understand the trade-offs and determine whether Prismio is the right fit for your project and team.

> **Note:** Prismio is in early development. Some features shown in the Prismio column are planned but not yet fully implemented. These are marked with 🚧.

---

## At-a-Glance Comparison Table

| Feature | Prismio | Rust | Go | C++ | Swift | Kotlin | Python |
|---|---|---|---|---|---|---|---|
| **Memory Model** | Ownership/Borrowing | Ownership/Borrowing | Garbage Collector | Manual / RAII | ARC | GC (JVM) / ARC (Native) | GC |
| **Null Safety** | `Option<T>` 🚧 | `Option<T>` | Pointer types (nil) | Raw pointers (null) | `Optional<T>` | Nullable types | None |
| **Performance** | Native (LLVM) | Native (LLVM) | Native (GC pauses) | Native | Native (ARC overhead) | JVM / Native | Interpreted |
| **GC Pauses** | None | None | Yes | None | None (ARC) | Yes (JVM) / None (Native) | Yes |
| **Compile Target** | Native Binary | Native Binary | Native Binary | Native Binary | Native Binary | JVM / JS / Native | Bytecode |
| **Type System** | Static, inferred | Static, inferred | Static, limited infer. | Static, verbose | Static, inferred | Static, inferred | Dynamic |
| **Generics** | Planned 🚧 | Yes | Yes (since 1.18) | Yes (templates) | Yes | Yes | Duck typing |
| **Concurrency** | Planned 🚧 | Async/await, threads | Goroutines, channels | Threads, async | Async/await, actors | Coroutines | asyncio, GIL |
| **Error Handling** | `Result<T,E>` 🚧 | `Result<T,E>` + `?` | Multiple returns | Exceptions | `Result`, throws | Exceptions + Result | Exceptions |
| **Build System** | UMS (built-in) | Cargo (built-in) | go build (built-in) | CMake / Make | Swift Package Mgr | Gradle / Maven | pip |
| **Package Manager** | UMS 🚧 | crates.io | pkg.go.dev | vcpkg / Conan | SPM | Maven Central | PyPI |
| **Syntax Friendliness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Learning Curve** | Low–Medium | High | Low | Very High | Medium | Low–Medium | Very Low |
| **Compile Speed** | Fast (target) | Slow | Very Fast | Slow | Moderate | Moderate | N/A |
| **Ecosystem Maturity** | Very Early | Mature | Mature | Very Mature | Mature (Apple) | Mature (JVM) | Very Mature |
| **Cross-Platform** | ✅ | ✅ | ✅ | ✅ | ⚠️ (Apple-first) | ✅ | ✅ |
| **Open Source** | ✅ | ✅ | ✅ | Partially | ✅ | ✅ | ✅ |

---

## Detailed Comparisons

### Memory Model

The memory model is one of the most consequential differences between these languages.

#### Prismio & Rust — Ownership and Borrowing

Both Prismio and Rust enforce memory safety through an ownership system at compile time. Every value has one owner; ownership can be moved or borrowed. When an owner goes out of scope, the value is freed — no runtime overhead, no GC.

```prismio
// Prismio ownership — clean, explicit, deterministic
fn process(data: [Int]) {
    for item in data {
        println(item)
    }
}  // data is freed here

fn main() {
    let numbers = [1, 2, 3]
    process(numbers)  // ownership moved to process()
    // numbers can no longer be used here
}
```

#### Go — Garbage Collector

Go uses a concurrent garbage collector. Memory safety is guaranteed, but at the cost of:
- Unpredictable GC pause times (typically <1ms in modern Go, but not zero).
- Higher memory usage (GC needs headroom to operate efficiently).
- Non-deterministic cleanup order.

#### C++ — Manual / RAII

C++ gives you full control but also full responsibility. Modern C++ uses RAII (Resource Acquisition Is Initialization) via destructors and smart pointers (`unique_ptr`, `shared_ptr`) to manage lifetimes, but this is a convention — not a compiler-enforced guarantee. Unsafe patterns are always possible and common in practice.

#### Swift — Automatic Reference Counting (ARC)

Swift uses ARC: the compiler injects `retain`/`release` calls that maintain a reference count for heap objects. When the count reaches zero, the object is freed. This is deterministic but has overhead on every object assignment, and reference cycles can cause memory leaks if not broken manually.

#### Kotlin/JVM — Garbage Collector

Kotlin on the JVM uses the JVM's GC (G1, ZGC, or Shenandoah). Mature and well-tuned, but inherits all GC trade-offs.

---

### Performance

| Language | Peak Throughput | Latency Predictability | Start-Up Time |
|---|---|---|---|
| Prismio | Excellent (LLVM) | Excellent (no GC) | Instant |
| Rust | Excellent (LLVM) | Excellent (no GC) | Instant |
| Go | Very Good | Good (GC pauses ≈ <1ms) | Fast |
| C++ | Excellent | Excellent | Instant |
| Swift | Very Good | Good (ARC overhead) | Fast |
| Kotlin (JVM) | Good | Fair (JVM GC, JIT warm-up) | Slow (JVM) |
| Python | Poor (interpreted) | Poor | Fast |

**Raw benchmark note**: Prismio and Rust are both LLVM-based. At the same optimisation level, they should produce comparably fast machine code. The language-level difference is ergonomics, not fundamental performance.

---

### Syntax and Ergonomics

A subjective but important dimension. Here is the same "find the maximum value" algorithm across languages:

```prismio
// Prismio
fn max_value(numbers: [Int]) -> Option<Int> {
    if numbers.is_empty() { return None }
    let mut max = numbers[0]
    for n in numbers {
        if n > max { max = n }
    }
    return Some(max)
}
```

```kotlin
// Kotlin
fun maxValue(numbers: List<Int>): Int? {
    if (numbers.isEmpty()) return null
    var max = numbers[0]
    for (n in numbers) {
        if (n > max) max = n
    }
    return max
}
```

```rust
// Rust
fn max_value(numbers: &[i32]) -> Option<i32> {
    if numbers.is_empty() { return None; }
    let mut max = numbers[0];
    for &n in numbers {
        if n > max { max = n; }
    }
    Some(max)
}
```

```go
// Go
func maxValue(numbers []int) (int, bool) {
    if len(numbers) == 0 {
        return 0, false
    }
    max := numbers[0]
    for _, n := range numbers {
        if n > max {
            max = n
        }
    }
    return max, true
}
```

```cpp
// C++
#include <optional>
#include <vector>
std::optional<int> maxValue(const std::vector<int>& numbers) {
    if (numbers.empty()) return std::nullopt;
    int max = numbers[0];
    for (int n : numbers) {
        if (n > max) max = n;
    }
    return max;
}
```

Prismio's version is closest to Kotlin's in readability while being semantically closer to Rust in its memory model.

---

### Error Handling

| Language | Primary Mechanism | Checked? | Composable? |
|---|---|---|---|
| Prismio | `Result<T, E>` 🚧 | Yes (by match) | Yes (via `?` 🚧) |
| Rust | `Result<T, E>` | Yes (by match) | Yes (via `?`) |
| Go | Multiple returns `(T, error)` | Convention only | Verbose |
| C++ | Exceptions | No | No |
| Swift | `throws` / `Result` | Partially | Partially |
| Kotlin | Exceptions / `Result<T>` | No | Partially |
| Python | Exceptions | No | No |

Prismio follows Rust's approach: errors are values of type `Result<T, E>`. The compiler enforces that you handle both the success and failure cases. The `?` operator allows clean error propagation without boilerplate.

```prismio
// 🚧 Coming Soon — Result<T, E> and ? operator
fn read_config(path: String) -> Result<String, String> {
    let file = File.open(path)?  // propagate error if open fails
    let content = file.read_all()?
    return Ok(content)
}
```

---

### Concurrency

> 🚧 **Coming Soon** – Prismio's concurrency model is planned but not yet implemented. The following describes the target design.

| Language | Model | Memory Safety |
|---|---|---|
| Prismio | Ownership-based (no data races) 🚧 | Compile-time guarantee 🚧 |
| Rust | Ownership-based (Send/Sync traits) | Compile-time guarantee |
| Go | Goroutines + channels | Runtime (race detector tool) |
| C++ | Threads + mutexes | Manual |
| Swift | Async/await + actors | Partially enforced |
| Kotlin | Coroutines | Convention |
| Python | asyncio / threads (GIL) | GIL prevents data races |

Prismio's ownership model naturally extends to concurrency: a value that is not `Send`-safe cannot be sent across thread boundaries, and the compiler will catch the violation.

---

### Compile Times

Compile time is often overlooked but matters enormously for developer productivity.

| Language | Compile Speed | Notes |
|---|---|---|
| Go | Extremely fast | Explicit design goal |
| C (simple) | Fast | No templates |
| Prismio | Fast (target) 🚧 | Incremental compilation planned |
| Swift | Moderate | Improving with each release |
| Kotlin | Moderate | JVM warm-up adds overhead |
| C++ | Slow | Templates are expensive |
| Rust | Slow | Borrow checker + LLVM are expensive |

Prismio targets fast compile times as a design goal. The borrow checking algorithm is designed to be incremental and efficient. Whether it achieves Go-level compile speed while providing Rust-level safety guarantees remains to be seen in practice.

---

### Ecosystem Maturity

| Language | Ecosystem | Community Size |
|---|---|---|
| C++ | Enormous (decades old) | Very Large |
| Python | Enormous | Very Large |
| Kotlin/JVM | Very Large (JVM) | Large |
| Go | Large | Large |
| Rust | Growing fast | Medium–Large |
| Swift | Large (Apple) | Medium |
| Prismio | Very Early | Small (growing) |

This is Prismio's biggest current weakness. The ecosystem is nascent. The standard library is minimal. Third-party packages are nearly non-existent. This will improve over time, but it is an honest reality to acknowledge.

---

### When to Choose Each Language

| If you need… | Consider… |
|---|---|
| Prismio-level safety + ergonomics, and can accept early-stage tooling | **Prismio** |
| Maximum ecosystem, proven safety, native performance | **Rust** |
| Fast development, great concurrency, simple deployment | **Go** |
| Maximum C++ ecosystem integration, raw control | **C++** |
| Apple platform development with great UX | **Swift** |
| JVM ecosystem, Android, enterprise backends | **Kotlin** |
| Scripting, data science, quick prototyping | **Python** |

---

## Summary

Prismio occupies a deliberate position in the language landscape: it targets the **intersection of native performance, compile-time memory safety, and developer ergonomics** that no existing language fully covers.

- Compared to **Rust**: more readable syntax, gentler learning curve, similar safety goals.
- Compared to **Go**: no garbage collector, stronger type system, more expressive.
- Compared to **C++**: memory safety by default, modern syntax, built-in tooling.
- Compared to **Kotlin/Swift**: no GC or ARC, truly cross-platform native compilation.
- Compared to **Python**: statically typed, compiled, native performance.

The trade-off Prismio asks you to accept today is ecosystem maturity. It is early. The libraries are not all there yet. But for projects where performance, safety, and clean code matter more than off-the-shelf library availability, Prismio is worth your attention.

---

## See Also

- [Why Prismio?](./why_prismio.md) — Motivation and detailed rationale.
- [Design Goals](./design_goals.md) — The principles behind the design decisions.
- [Language Philosophy](./philosophy.md) — The values that drive the language.
- [Roadmap](./roadmap.md) — What is coming and when.
