# Attributes & Annotations

> 🚧 **Coming Soon** – The attribute system is planned for a future release of Prismio. The syntax and semantics described here reflect the intended design but are not yet implemented in the compiler.

---

## Overview

Attributes are metadata annotations that modify the behavior of the compiler, the generated code, or tooling. They are written with a `#[...]` syntax and placed immediately before the item they annotate.

```prismio
// Intended future syntax

#[test]
fn myTest() {
    assert(1 + 1 == 2, "math is broken")
}

#[deprecated("Use newFunction() instead")]
pub fn oldFunction() { ... }
```

---

## Test Attributes

### `#[test]`

Marks a function as a unit test. Test functions must take no parameters and return `Void` or `Result<Void, E>`. They are only compiled and run when the test runner is invoked.

```prismio
#[test]
fn testAddition() {
    let result = add(2, 3)
    assert(result == 5, "Expected 5, got " + result.toString())
}

#[test]
fn testDivisionByZero() {
    let result = divide(10.0, 0.0)
    assert(result.isErr(), "Expected an error for division by zero")
}
```

Run tests with:

```bash
prismio test
prismio test --filter testAddition
```

### `#[test_only]`

Marks a module or function as only compiled during test runs. Useful for test helpers and fixtures.

```prismio
#[test_only]
fn generateMockUser() -> User {
    return User { name: "Test User", email: "test@example.com" }
}
```

---

## Benchmark Attributes

### `#[bench]`

Marks a function as a benchmark. Benchmark functions receive a `Bencher` argument that controls timing.

```prismio
#[bench]
fn benchmarkSorting(b: &Bencher) {
    let data = generateRandomData(10_000)
    b.run(fn() {
        let _ = data.clone().sort()
    })
}
```

Run benchmarks with:

```bash
prismio bench
prismio bench --filter benchmarkSorting
```

---

## Deprecation

### `#[deprecated]`

Marks an item as deprecated. Any use of the item will produce a compiler warning with the specified message.

```prismio
#[deprecated]
pub fn oldApi() { ... }

#[deprecated("Use newApi() from std.network instead")]
pub fn fetchData(url: String) -> Result<String, Error> { ... }
```

Compiler warning when a deprecated item is used:

```
warning[W0020]: `fetchData` is deprecated
 --> main.prismio:5:14
  |
5 |     let body = fetchData(url)?
  |                ^^^^^^^^^ use `newApi()` from std.network instead
```

---

## Inlining Hints

### `#[inline]`

Suggests to the compiler that the function should be inlined at call sites. This is a hint — the compiler may choose to ignore it.

```prismio
#[inline]
fn isEven(n: Int) -> Bool {
    return n % 2 == 0
}
```

### `#[inline(always)]`

Strongly requests that the function always be inlined. Use sparingly — aggressive inlining can increase binary size.

```prismio
#[inline(always)]
fn fastAbs(n: Int) -> Int {
    if n < 0 { return -n }
    return n
}
```

### `#[inline(never)]`

Prevents inlining. Useful for functions that should appear in profiler output or for reducing binary size on cold paths.

```prismio
#[inline(never)]
fn coldErrorPath(msg: String) {
    logError(msg)
    panic(msg)
}
```

---

## Lint Control

### `#[allow(lint)]`

Suppresses a specific compiler warning for the annotated item.

```prismio
#[allow(unused_variable)]
fn processData(data: [Int], debugFlag: Bool) {
    // debugFlag intentionally unused in release mode
    for item in data { process(item) }
}
```

### `#[deny(lint)]`

Promotes a specific warning to an error for the annotated item or module.

```prismio
#[deny(unused_variable)]
fn strictFunction(a: Int, b: Int) -> Int {
    return a + b
    // If any variable were unused, this would be a compile error
}
```

### `#[warn(lint)]`

Explicitly enables a warning that might be suppressed elsewhere.

```prismio
#[warn(dead_code)]
fn maybeUnused() { ... }
```

### Available Lint Names

| Lint | Description |
|---|---|
| `unused_variable` | Variable declared but never used |
| `unused_import` | Import that is never referenced |
| `dead_code` | Function or type that is never called/used |
| `unreachable_code` | Code after an unconditional `return` or `break` |
| `deprecated` | Use of deprecated items |

---

## Derive Macros

### `#[derive(...)]`

Automatically generates implementations of common traits for a type. Multiple traits can be derived in a single annotation.

```prismio
#[derive(Debug, Clone, Eq, Hash)]
struct Point {
    x: Int
    y: Int
}

fn main() {
    let p = Point { x: 3, y: 4 }
    let q = p.clone()            // Clone derived
    println(p)                   // Debug derived — prints "Point { x: 3, y: 4 }"
    assert(p == q, "should be equal")  // Eq derived
}
```

### Derivable Traits

| Trait | What It Provides |
|---|---|
| `Debug` | `toString()` / debug printing |
| `Clone` | `.clone()` method |
| `Copy` | Implicit copy (for small, stack types) |
| `Eq` | `==` and `!=` operators |
| `Ord` | `<`, `>`, `<=`, `>=` comparison |
| `Hash` | Makes the type usable as a HashMap key |
| `Default` | `.default()` constructor |

---

## Custom Attributes

Applications can define their own attributes for use with macro systems or code generators.

```prismio
// Intended future syntax — custom attributes for a web framework

#[route(GET, "/users/{id}")]
fn getUser(id: Int) -> Response { ... }

#[middleware(AuthRequired)]
#[route(POST, "/users")]
fn createUser(body: CreateUserRequest) -> Response { ... }
```

Custom attributes are processed by macros or build tools and have no built-in meaning to the compiler.

---

## Attribute Placement

| Item Type | Attributes Applied Before |
|---|---|
| Functions | `fn functionName(...)` |
| Structs | `struct TypeName { ... }` |
| Enums | `enum TypeName { ... }` |
| Modules | `mod moduleName { ... }` |
| Individual fields | `fieldName: Type` inside a struct |

---

*See also: [Keywords Reference](/reference/keywords) · [Compiler Flags](/reference/compiler_flags) · [Contributing: Style Guide](/contribute/style)*
