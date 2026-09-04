# Migration Guide

Prismio draws inspiration from Kotlin, Rust, and Swift. If you're coming from any of these languages — or from C++, Go, or Python — this guide highlights the key differences, syntax mappings, and mental model shifts to get you productive quickly.

---

## Table of Contents

- [Coming from Rust](#coming-from-rust)
- [Coming from Kotlin](#coming-from-kotlin)
- [Coming from C++](#coming-from-c)
- [Coming from Go](#coming-from-go)
- [Coming from Python](#coming-from-python)
- [Common Gotchas](#common-gotchas)

---

## Coming from Rust

Prismio shares Rust's ownership model, static typing, and performance-first philosophy, but trades some of Rust's verbosity for ergonomics closer to Kotlin.

### Syntax Cheat Sheet: Rust → Prismio

| Concept | Rust | Prismio |
|---------|------|---------|
| Immutable variable | `let x = 5;` | `let x = 5` |
| Mutable variable | `let mut x = 5;` | `let mut x = 5` |
| Type annotation | `let x: i32 = 5;` | `let x: Int = 5` |
| Function | `fn add(a: i32, b: i32) -> i32 { a + b }` | `fn add(a: Int, b: Int) -> Int = a + b` |
| Print line | `println!("{}", x);` | `println(x)` |
| String format | `format!("Hello {}", name)` | `"Hello $name"` |
| Struct | `struct Point { x: i32, y: i32 }` | `struct Point { x: Int; y: Int }` |
| Enum | `enum Shape { Circle(f64), Rect(f64, f64) }` | `enum Shape { Circle(Float), Rect(Float, Float) }` |
| Pattern match | `match x { 1 => ..., _ => ... }` | `match x { 1 -> ...; _ -> ... }` |
| Borrow | `&value` | `&value` |
| Mutable borrow | `&mut value` | `&mut value` |
| Option | `Option<T>` | `Option[T]` |
| Result | `Result<T, E>` | `Result[T, E]` |
| Closure | `|x| x + 1` | `{ x -> x + 1 }` or `(x) -> x + 1` |
| Import | `use std::collections::HashMap;` | `import std.collections.HashMap` |
| Public | `pub` | `pub` |
| Trait | `trait Drawable { fn draw(&self); }` | `trait Drawable { fn draw(self) }` |
| Impl | `impl Drawable for Circle { ... }` | `impl Drawable for Circle { ... }` |
| Lifetime | `fn foo<'a>(x: &'a str) -> &'a str` | (lifetimes inferred — explicit lifetimes planned) |

### Key Differences

#### 1. No Semicolons

Rust requires semicolons to suppress expression values. Prismio does not use semicolons at all:

```rust
// Rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)   // no semicolon = return value
}
```

```prismio
// Prismio
fn greet(name: String) -> String = "Hello, $name!"
```

#### 2. String Interpolation Instead of `format!`

```rust
// Rust
let msg = format!("Hello, {}! You are {} years old.", name, age);
```

```prismio
// Prismio
let msg = "Hello, $name! You are $age years old."
```

#### 3. No `!` for Macros

Rust macros use `!`. In Prismio, `println`, `print`, `assert`, etc., are regular built-in functions:

```rust
// Rust
println!("x = {}", x);
assert!(x > 0, "x must be positive");
vec![1, 2, 3]
```

```prismio
// Prismio
println("x = $x")
assert(x > 0, "x must be positive")
[1, 2, 3]
```

#### 4. Simpler Lifetime Syntax

Prismio infers lifetimes in most cases. Explicit lifetime annotations are planned but not required in the current version:

```rust
// Rust — explicit lifetime required
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

```prismio
// Prismio — lifetimes inferred
fn longest(x: &String, y: &String) -> &String {
    if x.len() > y.len() { x } else { y }
}
```

#### 5. `match` Arrow Syntax

```rust
// Rust — match arms use =>
match x {
    1 => println!("one"),
    2 => println!("two"),
    _ => println!("other"),
}
```

```prismio
// Prismio — match arms use ->
match x {
    1 -> println("one")
    2 -> println("two")
    _ -> println("other")
}
```

#### 6. Closures

```rust
// Rust
let double = |x| x * 2;
let add = |a, b| a + b;
```

```prismio
// Prismio
let double = { x -> x * 2 }
let add = { a, b -> a + b }
```

---

## Coming from Kotlin

Prismio and Kotlin share a great deal of syntax — Prismio is heavily inspired by Kotlin. The main differences are Prismio's native compilation, explicit ownership model, and the absence of null safety via `?`.

### Syntax Cheat Sheet: Kotlin → Prismio

| Concept | Kotlin | Prismio |
|---------|--------|---------|
| Immutable val | `val x = 5` | `let x = 5` |
| Mutable var | `var x = 5` | `let mut x = 5` |
| Function | `fun add(a: Int, b: Int): Int = a + b` | `fn add(a: Int, b: Int) -> Int = a + b` |
| Print | `println("Hello")` | `println("Hello")` |
| String template | `"Hello $name"` | `"Hello $name"` |
| Expression template | `"${a + b}"` | `"${a + b}"` |
| Nullable type | `String?` | `Option[String]` |
| Safe call | `str?.length` | `str.map { s -> s.length }` |
| Elvis operator | `str ?: "default"` | `str.unwrapOr("default")` |
| Lambda | `{ x -> x * 2 }` | `{ x -> x * 2 }` |
| Data class | `data class Point(val x: Int, val y: Int)` | `struct Point { x: Int; y: Int }` |
| Sealed class | `sealed class Shape` | `enum Shape { ... }` |
| When | `when (x) { 1 -> ... else -> ... }` | `match x { 1 -> ... _ -> ... }` |
| Interface | `interface Drawable { fun draw() }` | `trait Drawable { fn draw(self) }` |
| Extension function | `fun String.shout() = this.uppercase()` | (planned) |
| List of | `listOf(1, 2, 3)` | `[1, 2, 3]` |
| Map of | `mapOf("a" to 1)` | `Map.of("a", 1)` |
| Import | `import kotlin.math.*` | `import std.math` (no wildcards) |

### Key Differences

#### 1. `val`/`var` → `let`/`let mut`

```kotlin
// Kotlin
val name = "Alice"   // immutable
var age = 30         // mutable
age = 31
```

```prismio
// Prismio
let name = "Alice"   // immutable
let mut age = 30     // mutable
age = 31
```

#### 2. `fun` → `fn`

```kotlin
// Kotlin
fun greet(name: String): String = "Hello, $name!"
```

```prismio
// Prismio
fn greet(name: String) -> String = "Hello, $name!"
```

#### 3. Nullability via `Option` Instead of `?`

Prismio does not have nullable types. Instead, optionality is expressed with `Option[T]`:

```kotlin
// Kotlin
fun findUser(id: Int): User? = ...

val user = findUser(42)
val name = user?.name ?: "Unknown"
```

```prismio
// Prismio
fn findUser(id: Int) -> Option[User] = ...

let name = match findUser(42) {
    Some(user) -> user.name
    None -> "Unknown"
}
```

#### 4. No Wildcards in Imports

```kotlin
// Kotlin — wildcards allowed
import kotlin.math.*
```

```prismio
// Prismio — explicit only
import std.math.sqrt
import std.math.pow
```

#### 5. `when` → `match`

```kotlin
// Kotlin
when (shape) {
    is Circle -> println("Circle with r=${shape.radius}")
    is Rect   -> println("Rect ${shape.w}x${shape.h}")
    else      -> println("Unknown shape")
}
```

```prismio
// Prismio
match shape {
    Circle(r) -> println("Circle with r=$r")
    Rect(w, h) -> println("Rect ${w}x${h}")
    _ -> println("Unknown shape")
}
```

#### 6. No `data class` — Use `struct`

```kotlin
// Kotlin
data class Point(val x: Int, val y: Int)
```

```prismio
// Prismio — struct with derived equality and toString
#[derive(Eq, ToString)]
struct Point {
    x: Int
    y: Int
}
```

#### 7. Ownership — The Biggest Mental Shift

Kotlin runs on the JVM and manages memory with a garbage collector. Prismio uses ownership:

```kotlin
// Kotlin — pass by reference, GC handles memory
fun process(list: List<Int>) {
    println(list)
}
fun main() {
    val items = listOf(1, 2, 3)
    process(items)
    println(items)  // Fine — GC keeps items alive
}
```

```prismio
// Prismio — pass by borrow to avoid moving
fn process(list: &[Int]) {
    println(list)
}
fn main() {
    let items = [1, 2, 3]
    process(&items)    // Borrow, don't move
    println(items)     // Still valid
}
```

---

## Coming from C++

Prismio offers the performance of C++ with a modern, safe syntax. The biggest wins are: no manual memory management, no undefined behaviour by default, and no header/source split.

### Syntax Cheat Sheet: C++ → Prismio

| Concept | C++ | Prismio |
|---------|-----|---------|
| Variable | `int x = 5;` | `let x: Int = 5` |
| Const variable | `const int x = 5;` | `let x = 5` (immutable by default) |
| Function | `int add(int a, int b) { return a + b; }` | `fn add(a: Int, b: Int) -> Int = a + b` |
| Print | `std::cout << "Hello\n";` | `println("Hello")` |
| String | `std::string s = "hello";` | `let s = "hello"` |
| String concat | `s1 + s2` | `s1 + s2` |
| Array | `std::vector<int> v = {1, 2, 3};` | `let v = [1, 2, 3]` |
| Null pointer | `nullptr` | `None` (via `Option[T]`) |
| Struct | `struct Point { int x; int y; };` | `struct Point { x: Int; y: Int }` |
| Enum | `enum class Color { Red, Green, Blue };` | `enum Color { Red; Green; Blue }` |
| Template | `template<typename T>` | `fn foo[T](...)` |
| Reference | `int& ref = x;` | `&x` (borrow) |
| Pointer | `int* ptr = &x;` | (use borrows instead) |
| Lambda | `[](int x) { return x * 2; }` | `{ x -> x * 2 }` |
| Destructor | `~MyClass() { ... }` | Automatic via ownership (Drop trait) |
| Header include | `#include <vector>` | `import std.collections.List` |

### Key Differences

#### 1. No Headers, No `.h`/`.cpp` Split

```cpp
// C++ — need to split declaration and definition across files
// math.h
int add(int a, int b);

// math.cpp
#include "math.h"
int add(int a, int b) { return a + b; }
```

```prismio
// Prismio — one file, no declaration needed
// src/math.pr
pub fn add(a: Int, b: Int) -> Int = a + b
```

#### 2. No Manual Memory Management

```cpp
// C++ — manual new/delete (error-prone)
int* arr = new int[100];
// ... use arr ...
delete[] arr;  // Must remember to free!
```

```prismio
// Prismio — automatic memory management via ownership
let arr = [Int](size: 100, default: 0)
// arr is automatically freed when it goes out of scope
```

#### 3. No Undefined Behaviour by Default

C++ has many sources of undefined behaviour (out-of-bounds access, use-after-free, null dereferences). Prismio eliminates these:

```cpp
// C++ — undefined behaviour (silent corruption)
int arr[3] = {1, 2, 3};
int x = arr[10];  // UB — could crash, silently corrupt, or "work"
```

```prismio
// Prismio — safe bounds check, panics with a useful message
let arr = [1, 2, 3]
let x = arr[10]  // 💥 Panics: index 10 out of bounds (len: 3)
```

#### 4. Type Inference

```cpp
// C++ — must often repeat the type
std::vector<std::pair<std::string, int>> items;
```

```prismio
// Prismio — inference handles most cases
let items = [("hello", 1), ("world", 2)]
```

#### 5. No Preprocessor

Prismio has no `#define`, `#ifdef`, or macros. Use constants and `if` instead:

```cpp
// C++ preprocessor
#define MAX_SIZE 100
#ifdef DEBUG
  printf("debug mode\n");
#endif
```

```prismio
// Prismio
let MAX_SIZE = 100

// Compile-time flags via prismio.toml features
// Runtime flags via environment
```

---

## Coming from Go

Go and Prismio share a love of simplicity and performance. The main shifts are: explicit types vs. interfaces, pattern matching instead of type switches, and the ownership model instead of GC.

### Syntax Cheat Sheet: Go → Prismio

| Concept | Go | Prismio |
|---------|-----|---------|
| Variable | `x := 5` | `let x = 5` |
| Typed variable | `var x int = 5` | `let x: Int = 5` |
| Constant | `const x = 5` | `let x = 5` (immutable by default) |
| Function | `func add(a, b int) int { return a + b }` | `fn add(a: Int, b: Int) -> Int = a + b` |
| Print | `fmt.Println("Hello")` | `println("Hello")` |
| String format | `fmt.Sprintf("Hello %s", name)` | `"Hello $name"` |
| Struct | `type Point struct { X, Y int }` | `struct Point { x: Int; y: Int }` |
| Interface | `type Stringer interface { String() string }` | `trait Stringer { fn toString(self) -> String }` |
| Error | `error` interface | `Result[T, E]` |
| Goroutine | `go func() { ... }()` | 🚧 Planned |
| Channel | `ch := make(chan int)` | 🚧 Planned |
| Slice | `[]int{1, 2, 3}` | `[1, 2, 3]` |
| Map | `map[string]int{"a": 1}` | `Map.of("a", 1)` |
| Import | `import "fmt"` | `import std.io` |
| Package | `package main` | (no package declaration needed) |
| Defer | `defer file.Close()` | 🚧 Planned |

### Key Differences

#### 1. Error Handling: `Result` Instead of Multiple Returns

```go
// Go — errors returned as second value
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    fmt.Println("Error:", err)
}
```

```prismio
// Prismio — errors via Result
fn divide(a: Int, b: Int) -> Result[Int, String] {
    if b == 0 {
        return Err("division by zero")
    }
    return Ok(a / b)
}

match divide(10, 0) {
    Ok(result) -> println("Result: $result")
    Err(msg)   -> println("Error: $msg")
}
```

#### 2. No `nil` — Use `Option`

```go
// Go — nil pointer dereference is a common runtime panic
var user *User = nil
fmt.Println(user.Name)  // 💥 nil dereference panic
```

```prismio
// Prismio — None is explicit and safe
let user: Option[User] = None
match user {
    Some(u) -> println(u.name)
    None    -> println("No user found")
}
```

#### 3. Pattern Matching Instead of Type Switch

```go
// Go — type switch
switch v := value.(type) {
case int:
    fmt.Println("int:", v)
case string:
    fmt.Println("string:", v)
}
```

```prismio
// Prismio — pattern matching on enum variants
match value {
    Int(n)    -> println("int: $n")
    Str(s)    -> println("string: $s")
    _         -> println("other")
}
```

#### 4. Concurrency

> 🚧 **Coming Soon** – Prismio's concurrency model (inspired by structured concurrency) is planned for a future release. Goroutines and channels are not yet available.

```go
// Go — goroutines and channels
go func() { ch <- compute() }()
result := <-ch
```

```prismio
// Prismio — planned concurrency (not yet available)
// let result = await spawn { compute() }
```

---

## Coming from Python

Python developers will find Prismio's syntax clean and readable, but will need to adjust to static types, explicit mutability, and the ownership model.

### Key Differences

#### 1. Static Typing

```python
# Python — dynamic types
def greet(name):
    return f"Hello, {name}!"

greet(42)  # Works at runtime (type error only discovered later)
```

```prismio
// Prismio — static types, errors caught at compile time
fn greet(name: String) -> String = "Hello, $name!"

greet(42)  // ❌ Compile error: expected String, got Int
```

#### 2. Explicit Mutability

```python
# Python — all variables are mutable
x = 5
x = 10  # Fine
```

```prismio
// Prismio — immutable by default
let x = 5
x = 10    // ❌ Error: cannot assign to immutable binding `x`

let mut y = 5
y = 10    // ✅ Fine
```

#### 3. No Garbage Collector — Ownership Instead

```python
# Python — GC handles memory automatically
items = [1, 2, 3]
process(items)
print(items)  # Still valid — GC keeps it alive
```

```prismio
// Prismio — use borrows to share without moving
fn process(items: &[Int]) { ... }

let items = [1, 2, 3]
process(&items)   // Borrow
println(items)    // ✅ Still valid
```

#### 4. Indentation vs. Braces

```python
# Python — indentation is significant
def compute(x):
    if x > 0:
        return x * 2
    else:
        return 0
```

```prismio
// Prismio — braces delimit blocks
fn compute(x: Int) -> Int {
    if x > 0 {
        return x * 2
    } else {
        return 0
    }
}
```

---

## Common Gotchas

### ❗ Immutability by Default

Coming from Python, JavaScript, or Go, you might forget that variables are immutable in Prismio unless declared with `let mut`. If a value won't change, `let` is correct and preferred.

```prismio
let x = 5       // ✅ Immutable — cannot be reassigned
let mut y = 5   // ✅ Mutable — can be reassigned
```

---

### ❗ No Implicit Type Coercion

Prismio **never** implicitly converts between types. You must convert explicitly:

```prismio
let n: Int = 42
let f: Float = n          // ❌ Error: cannot coerce Int to Float
let f: Float = n.toFloat() // ✅ Explicit conversion
```

```prismio
let s: String = 100          // ❌ Error
let s: String = 100.toString() // ✅
```

---

### ❗ No Wildcard Imports

Unlike Python (`from math import *`) or Kotlin (`import kotlin.math.*`), Prismio requires explicit imports:

```prismio
// ❌ Not supported
import std.math.*

// ✅ Import only what you need
import std.math.sqrt
import std.math.pow
import std.math.PI
```

---

### ❗ Match Arms are Exhaustive

The `match` expression must cover all possible cases. Forgetting a variant causes a compile error:

```prismio
enum Color { Red; Green; Blue }

let c = Color.Red

// ❌ Error: non-exhaustive pattern match — `Blue` not covered
match c {
    Red   -> println("red")
    Green -> println("green")
    // Missing Blue!
}

// ✅ Use _ to catch remaining cases
match c {
    Red   -> println("red")
    Green -> println("green")
    _     -> println("other")
}
```

---

### ❗ Ownership: Values Are Moved by Default

When you pass a value to a function, it is **moved** (ownership transferred). You can no longer use the original:

```prismio
fn consume(s: String) { println(s) }

let msg = "hello"
consume(msg)
println(msg)  // ❌ Error: use of moved value `msg`
```

**Solutions:**

1. **Borrow** — pass a reference: `consume(&msg)` and change the parameter to `s: &String`
2. **Clone** — copy the value: `consume(msg.clone())`
3. **Use a `Copy` type** — primitives like `Int`, `Float`, `Bool`, and `Char` are copied, not moved

---

### ❗ No Null — Use `Option[T]`

There is no `null`, `nil`, `None` (as a raw value), or `undefined` in Prismio. Absent values are represented by `Option[T]`:

```prismio
// ❌ Error: null does not exist in Prismio
let name: String = null

// ✅ Use Option
let name: Option[String] = None
let name: Option[String] = Some("Alice")
```

---

### ❗ Function Keyword is `fn`, Not `fun`, `func`, or `def`

| Language | Keyword |
|----------|---------|
| Kotlin | `fun` |
| Go | `func` |
| Python | `def` |
| Rust | `fn` |
| **Prismio** | **`fn`** |

---

### ❗ Return Type Uses `->`, Not `:`

```kotlin
// Kotlin
fun add(a: Int, b: Int): Int = a + b
```

```prismio
// Prismio
fn add(a: Int, b: Int) -> Int = a + b
```

---

## Quick Syntax Reference Card

```prismio
// Variables
let x = 42                        // immutable, type inferred
let y: Float = 3.14               // immutable, explicit type
let mut count = 0                 // mutable

// Functions
fn greet(name: String) -> String = "Hello, $name!"
fn add(a: Int, b: Int) -> Int {
    return a + b
}

// Control flow
if x > 0 {
    println("positive")
} else if x < 0 {
    println("negative")
} else {
    println("zero")
}

// Pattern matching
match x {
    0    -> println("zero")
    1..9 -> println("single digit")
    _    -> println("large")
}

// Loops
for i in 0..10 {
    println(i)
}

let mut n = 0
while n < 10 {
    n = n + 1
}

// Closures
let double = { x -> x * 2 }
let add = { a, b -> a + b }

// Structs
struct Point {
    x: Int
    y: Int
}
let p = Point(x: 3, y: 7)
println(p.x)

// Enums
enum Shape {
    Circle(Float)
    Rect(Float, Float)
}
let s = Shape.Circle(5.0)

// Option and Result
let maybe: Option[Int] = Some(42)
match maybe {
    Some(n) -> println("Got $n")
    None    -> println("Nothing")
}

// Imports
import std.collections.List
import std.math.sqrt
```

---

## Next Steps

- [Language Basics](/language/basics.md) – Full overview of Prismio syntax
- [Ownership & Borrowing](/language/ownership.md) – Deep dive into the memory model
- [Pattern Matching](/language/pattern_matching.md) – Master `match` expressions
- [Error Handling](/language/error_handling.md) – Working with `Result` and `Option`
