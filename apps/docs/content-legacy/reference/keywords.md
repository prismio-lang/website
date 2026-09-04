# Keywords Reference

Prismio has a small, carefully chosen set of keywords. Every keyword serves a clear purpose, and the language avoids overloading keywords with multiple unrelated meanings. This page documents every keyword alphabetically, with syntax and examples.

---

## Keyword Index

| Keyword | Category | Description |
|---|---|---|
| `break` | Control flow | Exit a loop |
| `continue` | Control flow | Skip to next loop iteration |
| `else` | Control flow | Fallback branch of `if` |
| `false` | Literal | Boolean false value |
| `fn` | Declaration | Declare a function |
| `for` | Loop | Iterate over a range or collection |
| `if` | Control flow | Conditional branch |
| `import` | Module | Import a module item |
| `in` | Iteration | Specify the iterable in a `for` loop |
| `let` | Declaration | Declare a variable binding |
| `loop` | Loop | Infinite loop |
| `match` | Control flow | Pattern matching |
| `mut` | Modifier | Mark a binding as mutable |
| `pub` | Visibility | Mark an item as publicly accessible |
| `return` | Control flow | Return a value from a function |
| `true` | Literal | Boolean true value |
| `while` | Loop | Loop while a condition holds |

---

## `break`

Exits the nearest enclosing loop (`for`, `while`, or `loop`) immediately.

```prismio
fn findFirst(items: [Int], target: Int) -> Int {
    let mut index = -1
    for i in 0..items.length {
        if items[i] == target {
            index = i
            break  // stop searching
        }
    }
    return index
}
```

`break` can also carry a value out of a `loop` expression:

```prismio
let result = loop {
    let n = getNextValue()
    if n > 100 {
        break n  // exit with this value
    }
}
println(result)
```

---

## `continue`

Skips the rest of the current loop body and jumps to the next iteration.

```prismio
fn printOdds(limit: Int) {
    for i in 0..=limit {
        if i % 2 == 0 {
            continue  // skip even numbers
        }
        println(i)
    }
}

fn main() {
    printOdds(10)
    // Output: 1, 3, 5, 7, 9
}
```

---

## `else`

Provides the fallback branch of an `if` expression. Can be chained with another `if` for multi-way branching.

```prismio
fn classify(score: Int) -> String {
    if score >= 90 {
        return "A"
    } else if score >= 80 {
        return "B"
    } else if score >= 70 {
        return "C"
    } else {
        return "F"
    }
}
```

`if-else` is an expression in Prismio — it produces a value:

```prismio
let label = if isAdmin { "Administrator" } else { "User" }
```

---

## `false`

The boolean literal representing the false value of type `Bool`.

```prismio
let isActive: Bool = false

fn isEven(n: Int) -> Bool {
    if n % 2 == 0 {
        return true
    }
    return false
}
```

---

## `fn`

Declares a function. The full syntax is:

```prismio
fn functionName(param1: Type1, param2: Type2) -> ReturnType {
    // body
}
```

For single-expression functions, use the short form:

```prismio
fn square(n: Int) -> Int = n * n
fn add(a: Int, b: Int) -> Int = a + b
```

Functions with no return value omit the `-> ReturnType` annotation:

```prismio
fn greet(name: String) {
    println("Hello, " + name + "!")
}
```

Generic functions use type parameters in angle brackets:

```prismio
fn identity<T>(value: T) -> T {
    return value
}
```

The entry point of a Prismio program is always `main`:

```prismio
fn main() {
    println("Hello, Prismio!")
}
```

---

## `for`

Iterates over a range or any iterable collection. The syntax is:

```prismio
for variable in iterable {
    // body
}
```

### Iterating a Range

```prismio
// 0 to 4 (exclusive upper bound)
for i in 0..5 {
    println(i)
}

// 0 to 5 (inclusive upper bound)
for i in 0..=5 {
    println(i)
}
```

### Iterating a Collection

```prismio
let fruits = ["apple", "banana", "cherry"]

for fruit in fruits {
    println(fruit)
}
```

### Iterating with Index

```prismio
for (index, fruit) in fruits.enumerate() {
    println(index.toString() + ": " + fruit)
}
```

---

## `if`

Evaluates a boolean condition and executes the appropriate branch.

```prismio
if condition {
    // executed when condition is true
}

if condition {
    // true branch
} else {
    // false branch
}
```

`if` is an expression — it can be used inline:

```prismio
let max = if a > b { a } else { b }
```

---

## `import`

Imports a specific item from a module. Prismio does not support wildcard imports — every import must name exactly what it brings into scope.

```prismio
import std.io.println
import std.collections.HashMap
import models.user.UserProfile
import utils.math.clamp
```

Multiple imports from the same module:

```prismio
import std.io.println
import std.io.input
import std.io.readFile
```

> **Note:** There are no wildcard imports like `import std.io.*`. All imports must be explicit.

---

## `in`

Used within `for` loops to separate the loop variable from the iterable. Also used in range expressions.

```prismio
for item in collection { }
for i in 0..100 { }
for (k, v) in map.entries() { }
```

---

## `let`

Declares an immutable variable binding. Variables bound with `let` cannot be reassigned after initialization.

```prismio
let name = "Alice"          // type inferred as String
let age: Int = 30           // explicit type annotation
let pi: Float = 3.14159
```

`let` can destructure tuples and structs:

```prismio
let (x, y) = (10, 20)
let Point { x, y } = point
```

To declare a mutable variable, add `mut`:

```prismio
let mut counter = 0
counter = counter + 1
```

---

## `loop`

Creates an infinite loop that runs until a `break` statement is executed. Use this when the termination condition is determined inside the loop body.

```prismio
fn readUntilValid() -> Int {
    loop {
        let input = input("Enter a number: ")
        let parsed = input.parseInt()
        match parsed {
            Some(n) => break n  // valid input — exit with value
            null    => println("Invalid. Try again.")
        }
    }
}
```

`loop` is an expression and can yield a value via `break value`:

```prismio
let answer = loop {
    if checkCondition() {
        break 42
    }
}
```

---

## `match`

Compares a value against a set of patterns and executes the first matching arm. `match` is exhaustive — the compiler ensures all possible values are covered.

```prismio
match expression {
    pattern1 => result1
    pattern2 => result2
    _        => defaultResult  // wildcard — matches anything
}
```

### Matching Literals

```prismio
fn dayName(day: Int) -> String {
    match day {
        1 => "Monday"
        2 => "Tuesday"
        3 => "Wednesday"
        4 => "Thursday"
        5 => "Friday"
        6 => "Saturday"
        7 => "Sunday"
        _ => "Unknown"
    }
}
```

### Matching Enums

```prismio
enum Direction { North, South, East, West }

fn opposite(d: Direction) -> Direction {
    match d {
        Direction.North => Direction.South
        Direction.South => Direction.North
        Direction.East  => Direction.West
        Direction.West  => Direction.East
    }
}
```

### Match with Guards

```prismio
match value {
    n if n < 0  => "negative"
    0           => "zero"
    n if n > 0  => "positive"
}
```

### Match is an Expression

```prismio
let description = match score {
    90..=100 => "Excellent"
    70..=89  => "Good"
    50..=69  => "Pass"
    _        => "Fail"
}
```

---

## `mut`

A modifier on `let` declarations that makes the variable binding mutable.

```prismio
let mut total = 0.0
for price in prices {
    total = total + price
}
```

`mut` can also appear on function parameters and references:

```prismio
fn increment(value: &mut Int) {
    *value = *value + 1
}
```

---

## `pub`

Marks an item (function, type, constant) as publicly accessible outside its module. Without `pub`, items are private to their module.

```prismio
// Private — only accessible within this module
fn internalHelper() -> Int { ... }

// Public — accessible from other modules
pub fn publicFunction() -> String { ... }
pub struct Point { pub x: Float, pub y: Float }
```

---

## `return`

Explicitly returns a value from a function. In Prismio, the last expression in a function body is its implicit return value, so `return` is often optional.

```prismio
// Explicit return
fn clamp(value: Int, min: Int, max: Int) -> Int {
    if value < min { return min }
    if value > max { return max }
    return value
}

// Implicit return (last expression)
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

Use `return` for early exits (guard clauses):

```prismio
fn process(input: String) {
    if input.isEmpty() {
        return  // early exit, no value
    }
    // ... rest of processing
}
```

---

## `true`

The boolean literal representing the true value of type `Bool`.

```prismio
let isEnabled: Bool = true
let DEBUG = true

if DEBUG {
    println("Debug mode is active")
}
```

---

## `while`

Repeats a block of code while a boolean condition is true.

```prismio
fn countdown(from: Int) {
    let mut n = from
    while n > 0 {
        println(n)
        n = n - 1
    }
    println("Liftoff!")
}
```

Use `loop` instead of `while true`:

```prismio
// Avoid
while true {
    // ...
    if done { break }
}

// Prefer
loop {
    // ...
    if done { break }
}
```

---

## Reserved Future Keywords

The following identifiers are reserved for future use and cannot be used as variable names, function names, or type names:

| Keyword | Intended Use |
|---|---|
| `async` | Asynchronous functions |
| `await` | Awaiting async operations |
| `trait` | Trait/interface declarations |
| `impl` | Trait implementations |
| `struct` | Struct type declarations |
| `enum` | Enum type declarations |
| `type` | Type aliases |
| `where` | Generic constraints |
| `self` | Self reference within types |
| `super` | Parent module reference |
| `mod` | Module declaration |
| `use` | Alternative import syntax |
| `const` | Compile-time constants |
| `static` | Static variables |
| `extern` | Foreign function declarations |
| `unsafe` | Unsafe code blocks |
| `yield` | Generator functions |
| `typeof` | Type-of operator |

Attempting to use a reserved keyword as an identifier will produce a compile error:

```
error[E0030]: `async` is a reserved keyword
 --> main.prismio:3:9
  |
3 |     let async = 5
  |         ^^^^^ reserved for future use
  |
  = help: rename the variable to avoid conflict: `let async_ = 5`
```

---

*See also: [Operators Reference](/reference/operators) · [Attributes](/reference/attributes) · [Language Syntax](/language/syntax)*
