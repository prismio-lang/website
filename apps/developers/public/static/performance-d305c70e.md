# Performance Guide

Prismio is built on LLVM, which means it has access to decades of compiler optimization research. But to extract the best performance, you need to understand how the language and compiler work together. This guide covers practical strategies for writing fast Prismio code.

---

## Debug Builds vs. Release Builds

By default, `prismio build` produces a **debug build** — fast to compile, with no optimizations and full debug information. For production or benchmarking, always use a **release build**.

```bash
# Debug build (default) — fast compilation, slow execution
prismio build main.prismio

# Release build — slow compilation, maximum runtime performance
prismio build --release main.prismio

# Equivalent to -O2 via flag
prismio build -O2 main.prismio
```

### What Changes in Release Mode?

| Feature | Debug | Release |
|---|---|---|
| LLVM optimizations | None (`-O0`) | Full (`-O2` or `-O3`) |
| Inlining | Disabled | Enabled |
| Dead code elimination | Disabled | Enabled |
| Integer overflow | Panics with message | Wraps silently |
| Debug symbols | Included | Stripped (unless `--debug`) |
| Execution speed | Slow | Fast |
| Compile time | Fast | Slow |

> **Always benchmark release builds.** Debug build performance numbers are meaningless for production planning.

---

## LLVM Optimization Levels

Prismio exposes LLVM's optimization levels directly:

| Flag | Level | Description |
|---|---|---|
| `-O0` | None | No optimization. Fast to compile. |
| `-O1` | Basic | Simple local optimizations (constant folding, dead code removal). |
| `-O2` | Standard | Full optimization suite without aggressive transformations. Default for `--release`. |
| `-O3` | Aggressive | All of `-O2` plus vectorization, loop unrolling, and aggressive inlining. May increase binary size. |
| `-Os` | Size | Optimize for binary size over speed. |

```bash
# Balanced performance (recommended)
prismio build -O2 main.prismio

# Maximum performance (may increase binary size)
prismio build -O3 main.prismio

# Binary size priority (embedded, WASM)
prismio build -Os main.prismio
```

### When to Use `-O3`

Use `-O3` when:
- You are running numerical or scientific code that benefits from vectorization
- Binary size is not a concern
- You have benchmarked and confirmed a real improvement over `-O2`

In many applications, `-O2` and `-O3` produce identical results because the hot path doesn't benefit from the extra passes.

---

## Avoiding Unnecessary Allocations

Every heap allocation (`new`, boxing, or growing a dynamic array) has a cost: a `malloc` call, potential cache miss, and eventual deallocation. Minimizing allocations is one of the most reliable ways to speed up Prismio programs.

### Pass by Reference, Not by Value

```prismio
// Avoid: copies the entire string
fn printGreeting(name: String) {
    println("Hello, " + name)
}

// Prefer: borrows the string — no copy
fn printGreeting(name: &String) {
    println("Hello, " + name)
}
```

### Pre-allocate Collections

If you know how many elements you'll insert, pre-allocate the collection to avoid repeated re-allocations and copies.

```prismio
// Avoid: grows dynamically, may reallocate many times
let mut results: [Int] = []
for i in 0..1000 {
    results.push(i * i)
}

// Prefer: allocate once
let mut results = [Int].withCapacity(1000)
for i in 0..1000 {
    results.push(i * i)
}
```

### Avoid Intermediate Allocations in Hot Loops

```prismio
// Avoid: creates a new string every iteration
for item in items {
    let label = "item_" + item.toString()
    process(label)
}

// Prefer: reuse a buffer
let mut label = String.withCapacity(32)
for item in items {
    label.clear()
    label.append("item_")
    label.append(item.toString())
    process(label)
}
```

---

## Understanding Zero-Cost Abstractions

Prismio's closures, iterators, and generic functions are **zero-cost abstractions** — they compile to the same machine code as equivalent hand-written loops. You don't pay a runtime penalty for using them.

### Iterators Compile to Tight Loops

```prismio
// High-level iterator chain
let sum = numbers
    .filter(fn(n) => n % 2 == 0)
    .map(fn(n) => n * n)
    .reduce(0, fn(acc, n) => acc + n)
```

After LLVM optimization, this compiles to the same assembly as:

```prismio
// Hand-written loop
let mut sum = 0
for n in numbers {
    if n % 2 == 0 {
        sum = sum + n * n
    }
}
```

**Use iterators freely** — the abstraction cost is zero in release builds.

### Generics Are Monomorphized

When you write a generic function, the compiler generates a specialized version for each concrete type used. There is no runtime dispatch overhead.

```prismio
fn max<T: Comparable>(a: T, b: T) -> T {
    if a > b { return a }
    return b
}

// The compiler generates separate optimized versions:
// max for Int, max for Float, max for String, etc.
let m1 = max(3, 7)       // -> Int version
let m2 = max(1.5, 2.3)   // -> Float version
```

---

## Cache-Friendly Data Structures

Modern CPUs are orders of magnitude faster when data is stored contiguously in memory (arrays) vs. scattered across the heap (linked lists, trees with pointer chasing).

### Prefer Arrays Over Linked Structures

```prismio
// Cache-unfriendly: pointer chasing on every access
struct Node {
    value: Int
    next: &Node?
}

// Cache-friendly: contiguous memory, predictable access
let values: [Int] = [1, 2, 3, 4, 5]
```

### Struct of Arrays vs. Array of Structs

For tight loops over large datasets, consider **struct of arrays (SoA)** layout over **array of structs (AoS)** when you only access one field at a time:

```prismio
// AoS — common but cache-inefficient if you only read `x`
struct Point {
    x: Float
    y: Float
    z: Float
}
let points: [Point] = ...

// SoA — faster when processing one field across all elements
struct Points {
    xs: [Float]
    ys: [Float]
    zs: [Float]
}
```

---

## Hot Path Optimization

The **hot path** is the code your program spends most of its time in. Optimize there first — premature optimization elsewhere wastes effort.

### Avoid Work Inside Tight Loops

```prismio
// Avoid: redundant computation every iteration
for i in 0..items.length {
    let threshold = config.getThreshold()  // called every iteration
    if items[i] > threshold {
        process(items[i])
    }
}

// Prefer: hoist invariants out of the loop
let threshold = config.getThreshold()
for i in 0..items.length {
    if items[i] > threshold {
        process(items[i])
    }
}
```

### Minimize Branch Mispredictions

Predictable branches are fast. Branches that alternate unpredictably cause pipeline stalls.

```prismio
// Sort data before filtering to improve branch prediction
items.sort()
let filtered = items.filter(fn(x) => x > threshold)
```

### Inline Small Functions

For tiny helper functions called in hot loops, you can hint the compiler to inline them:

> 🚧 **Coming Soon** – The `#[inline]` attribute for inlining hints is planned but not yet implemented. LLVM will inline small functions automatically at `-O2`+.

---

## Benchmarking Code

Measure before you optimize. Use wall-clock timing to establish baselines.

```prismio
import std.time.Instant

fn benchmark(label: String, iterations: Int, body: fn() -> Void) {
    let start = Instant.now()
    for _ in 0..iterations {
        body()
    }
    let elapsed = Instant.now().durationSince(start)
    let perIter = elapsed.nanoseconds / iterations
    println(label + ": " + perIter.toString() + " ns/iter")
}

fn main() {
    let data = generateData(100_000)

    benchmark("naive sum", 1000, fn() {
        let _ = naiveSum(data)
    })

    benchmark("optimized sum", 1000, fn() {
        let _ = optimizedSum(data)
    })
}
```

### Benchmarking Rules

1. **Always benchmark release builds** (`-O2` or `-O3`)
2. **Warm up** before measuring — first runs may be slower due to CPU caching effects
3. **Run many iterations** and report the median, not a single measurement
4. **Isolate** the code under test — avoid I/O in your benchmark loop
5. **Prevent dead-code elimination** — the compiler may optimize away code whose result is unused; use the result somehow

---

## Profiling Tools

> 🚧 **Coming Soon** – Built-in Prismio profiling tools are planned but not yet implemented.

In the meantime, you can use platform profilers on the compiled binary:

### Windows

```bash
# Visual Studio Performance Profiler works on Prismio binaries
# Build with debug symbols for better flame graphs
prismio build --release --debug main.prismio
```

### Linux / macOS

```bash
# Build with debug symbols
prismio build --release --debug main.prismio

# Profile with perf (Linux)
perf record ./main
perf report

# Profile with Instruments (macOS)
instruments -t "Time Profiler" ./main
```

### Interpreting Profiles

Look for:
- Functions that appear frequently in the flame graph (CPU-bound hot paths)
- Functions with long "self time" (where CPU is actually spent, not just calling other functions)
- Cache miss hotspots (visible in hardware counter profiles)

---

## Quick Reference: Performance Checklist

- [ ] Benchmarking release builds (`-O2` or `-O3`)
- [ ] Profiled to find actual bottlenecks before optimizing
- [ ] Pre-allocated collections with known sizes
- [ ] Passing large data by reference (`&Type`)
- [ ] Hoisted invariants out of hot loops
- [ ] Using iterator chains (zero-cost, LLVM-friendly)
- [ ] Data structures are cache-friendly (arrays over linked lists)
- [ ] Verified with before/after benchmarks

---

*See also: [Idioms & Best Practices](/guides/idioms) · [Compiler Flags](/reference/compiler_flags) · [Common Pitfalls](/guides/gotchas)*
