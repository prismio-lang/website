# Function Signatures

A **function signature** defines a function's name, parameters, return type, and visibility. Prismio's function declaration syntax is expressive and concise, supporting everything from simple one-liners to fully generic, visibly-controlled functions.

---

## Basic Function Declaration

The fundamental syntax for declaring a function:

```prismio
fn functionName(param1: Type1, param2: Type2) -> ReturnType {
    // body
}
```

A minimal example:

```prismio
fn greet() {
    println("Hello, Prismio!")
}
```

A function with parameters and a return value:

```prismio
fn add(a: Int, b: Int) -> Int {
    return a + b
}
```

---

## Block Body Functions

The standard function form uses a **block body** `{ }`. The return type is declared after `->`.

```prismio
fn square(n: Int) -> Int {
    return n * n
}

fn max(a: Int, b: Int) -> Int {
    if a > b {
        return a
    }
    return b
}

fn greetUser(name: String, age: Int) {
    println("Hello, ${name}!")
    println("You are ${age} years old.")
}
```

### Implicit Return

The last expression in a block is implicitly returned — no `return` keyword needed:

```prismio
fn multiply(a: Int, b: Int) -> Int {
    a * b   // implicitly returned
}

fn describe(n: Int) -> String {
    if n > 0 { "positive" }
    else if n < 0 { "negative" }
    else { "zero" }
}
```

---

## Expression Body Functions

When the function body is a single expression, use the `=` shorthand. No braces or `return` keyword needed.

```prismio
fn add(a: Int, b: Int) -> Int = a + b
fn square(n: Int) -> Int = n * n
fn isEven(n: Int) -> Bool = n % 2 == 0
fn negate(b: Bool) -> Bool = !b
```

Expression body with string interpolation:

```prismio
fn greet(name: String) -> String = "Hello, ${name}!"
fn formatScore(score: Int, total: Int) -> String = "${score}/${total} (${score * 100 / total}%)"
```

Expression body with a conditional:

```prismio
fn abs(n: Int) -> Int = if n >= 0 { n } else { -n }
fn clamp(value: Int, min: Int, max: Int) -> Int =
    if value < min { min }
    else if value > max { max }
    else { value }
```

### Block Expression Body

You can use `=` with a block expression `{ }`. The block evaluates to its last expression:

```prismio
fn factorial(n: Int) -> Int = {
    let mut result = 1
    for i in 2..=n {
        result *= i
    }
    result   // block's value
}
```

```prismio
fn padLeft(s: String, width: Int, char: Char) -> String = {
    let padding = width - s.length
    if padding <= 0 { s }
    else { char.toString().repeat(padding) + s }
}
```

---

## Functions with No Return Value

When a function doesn't return a meaningful value, omit the `->` return type. The function implicitly returns `Unit`.

```prismio
fn printHeader(title: String) {
    println("=".repeat(40))
    println(title)
    println("=".repeat(40))
}
```

Explicitly annotating the return type as `Unit` is equivalent and sometimes more readable:

```prismio
fn logError(message: String) -> Unit {
    println("[ERROR] ${message}")
}
```

---

## Generic Functions

Generic functions work with any type by introducing **type parameters** in angle brackets `<T>`.

```prismio
fn identity<T>(x: T) -> T = x

println(identity(42))         // 42
println(identity("hello"))    // hello
println(identity(true))       // true
```

### Multiple Type Parameters

```prismio
fn pair<A, B>(first: A, second: B) -> (A, B) = (first, second)

let p = pair("age", 30)
println(p)  // (age, 30)
```

### Generic Swap

```prismio
fn swap<T>(a: T, b: T) -> (T, T) = (b, a)

let (x, y) = swap(1, 2)
println("x=${x}, y=${y}")  // x=2, y=1

let (s1, s2) = swap("hello", "world")
println("${s1} ${s2}")  // world hello
```

### Constrained Type Parameters

> 🚧 **Coming Soon** – Type parameter constraints (bounds) are planned but not yet implemented.

```prismio
// Future syntax (planned):
fn max<T: Comparable>(a: T, b: T) -> T = if a > b { a } else { b }
fn sum<T: Numeric>(items: [T]) -> T { ... }
```

---

## Visibility Modifiers

By default, functions are **private** — only accessible within the same module. Use `pub` to make a function publicly accessible.

### Private (Default)

```prismio
fn helperFunction() {
    // only accessible within this module
}
```

Private is the default. No keyword is needed, but you can write `priv` explicitly for clarity:

```prismio
priv fn internalHelper() {
    println("internal use only")
}
```

### Public

```prismio
pub fn add(a: Int, b: Int) -> Int = a + b
pub fn greet(name: String) { println("Hello, ${name}!") }
```

Public functions form the API surface of a module. They can be called from other modules after importing.

```prismio
import math.utils

fn main() {
    println(utils.add(3, 4))  // 7
}
```

### Typical Module Layout

```prismio
// math/utils.prismio

pub fn add(a: Int, b: Int) -> Int = a + b
pub fn subtract(a: Int, b: Int) -> Int = a - b
pub fn multiply(a: Int, b: Int) -> Int = a * b

priv fn validate(n: Int) -> Bool = n >= 0    // internal only

pub fn safeDivide(a: Int, b: Int) -> Int? {
    if b == 0 { return null }
    return a / b
}
```

---

## The `main` Function

The program's entry point is a special `fn main()` function:

```prismio
fn main() {
    println("Hello, world!")
}
```

`main` takes no parameters and returns nothing (`Unit`). It's always private and cannot be marked `pub`.

---

## Function Overloading

> 🚧 **Coming Soon** – Function overloading (multiple functions with the same name and different parameter types) is planned but not yet implemented.

```prismio
// Future syntax (planned):
fn print(n: Int)    { println("Int: ${n}") }
fn print(s: String) { println("String: ${s}") }
fn print(b: Bool)   { println("Bool: ${b}") }
```

---

## Summary of Signatures

| Form | Example |
|---|---|
| Block body | `fn add(a: Int, b: Int) -> Int { return a + b }` |
| Implicit return | `fn add(a: Int, b: Int) -> Int { a + b }` |
| Expression body | `fn add(a: Int, b: Int) -> Int = a + b` |
| Block expression body | `fn add(a: Int, b: Int) -> Int = { a + b }` |
| No return type | `fn greet(name: String) { println(name) }` |
| Unit return explicit | `fn greet(name: String) -> Unit { println(name) }` |
| Generic | `fn id<T>(x: T) -> T = x` |
| Public | `pub fn add(a: Int, b: Int) -> Int = a + b` |
| Private (explicit) | `priv fn helper() { ... }` |

---

## See Also

- [Parameters](parameters.md) — required, named, default, and variadic parameters
- [Return Values](returns.md) — explicit return, implicit return, tuples, `Unit`, `Never`
- [Closures](closures.md) — anonymous functions and lambdas
- [Generics](../../advanced/generics.md) — generic types and constraints
- [Modules](../../modules/overview.md) — visibility and module system
