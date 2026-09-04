# Bindings

A **binding** in Prismio associates a name with a value. Every piece of data you work with is accessed through a binding. Prismio's binding system is designed to be safe by default: bindings are **immutable** unless you explicitly declare them mutable.

---

## Basic Bindings

Use the `let` keyword to introduce a new binding.

```prismio
let x = 42
let name = "Prismio"
let pi = 3.14159
```

These bindings are **immutable** — once a value is assigned, it cannot be changed.

```prismio
let x = 10
x = 20  // ❌ Error: cannot assign to immutable binding `x`
```

---

## Mutable Bindings

To allow reassignment, use `let mut`.

```prismio
let mut counter = 0
counter = counter + 1
counter += 5
println(counter)  // 6
```

Only the binding's value can change — not its type. Prismio is statically typed, so a mutable binding always holds the same type throughout its lifetime.

```prismio
let mut score = 100
score = "high"  // ❌ Error: expected Int, found String
```

---

## Type Annotations

Prismio has powerful **type inference** — the compiler usually deduces the type from the initializer. When you want to be explicit (for documentation, clarity, or to resolve ambiguity), you can provide a type annotation.

```prismio
let age: Int = 25
let name: String = "Alice"
let temperature: Float = 36.6
let active: Bool = true
```

Type annotations come after the binding name, separated by `:`.

```prismio
let greeting: String = "Hello, world!"
println(greeting)
```

You can annotate mutable bindings the same way:

```prismio
let mut score: Int = 0
score = 100
```

---

## Late Initialization

Sometimes you know a binding exists before you know its value. Prismio supports **late initialization**: declare the binding with a type annotation, then assign it before use.

```prismio
let result: Int

if someCondition {
    result = 42
} else {
    result = 0
}

println(result)
```

The compiler enforces that a late-initialized binding is **definitely assigned** before it is read. If there's any path where it might be uninitialized, the compiler reports an error.

```prismio
let value: String

// Forgot to assign it!
println(value)  // ❌ Error: `value` used before initialization
```

Late initialization is also useful in pattern matching:

```prismio
let status: String

match code {
    200 -> status = "OK"
    404 -> status = "Not Found"
    500 -> status = "Internal Server Error"
    _   -> status = "Unknown"
}

println("HTTP Status: ${status}")
```

---

## Destructuring Bindings

Prismio lets you **destructure** tuples and other structured values directly in a binding.

### Tuple Destructuring

```prismio
let (x, y) = (10, 20)
println(x)  // 10
println(y)  // 20
```

```prismio
let point = (3.0, 4.0)
let (px, py) = point
println("x=${px}, y=${py}")
```

### Ignoring Values

Use `_` to ignore parts you don't need:

```prismio
let (first, _, third) = (1, 2, 3)
println(first)  // 1
println(third)  // 3
```

### Mutable Destructuring

```prismio
let mut (a, b) = (5, 10)
a += 1
b -= 1
println("a=${a}, b=${b}")  // a=6, b=9
```

### Nested Destructuring

```prismio
let ((x1, y1), (x2, y2)) = ((0, 0), (100, 200))
println("From (${x1},${y1}) to (${x2},${y2})")
```

---

## Shadowing

Prismio allows you to **shadow** a binding by declaring a new binding with the same name in the same or inner scope. The new binding *shadows* (hides) the old one.

```prismio
let x = 5
println(x)  // 5

let x = x * 2   // shadows the previous `x`
println(x)  // 10

let x = "now a string"  // can even change the type!
println(x)  // now a string
```

Shadowing is different from mutation. Each `let x` creates a **new** binding; the original is still immutable.

```prismio
let count = 0
let count = count + 1   // new binding, not mutation
let count = count + 1   // yet another new binding
println(count)  // 2
```

This is particularly useful for transforming values without needing `mut`:

```prismio
let input = "  hello world  "
let input = input.trim()
let input = input.toUpperCase()
println(input)  // HELLO WORLD
```

---

## Scope and Lifetime

Bindings are scoped to the **block** they are declared in — the region between `{` and `}`. A binding ceases to exist when control leaves its block.

```prismio
fn main() {
    let outer = "I'm outside"

    {
        let inner = "I'm inside"
        println(outer)  // ✅ outer is visible here
        println(inner)  // ✅ inner is visible here
    }

    println(outer)  // ✅ outer still alive
    println(inner)  // ❌ Error: `inner` not found in this scope
}
```

### Block Expressions and Bindings

Blocks are expressions in Prismio — they produce a value. You can use this to initialize a binding with complex logic:

```prismio
let config = {
    let host = "localhost"
    let port = 8080
    "${host}:${port}"   // last expression is the block's value
}

println(config)  // localhost:8080
```

### Shadowing Across Scopes

When an inner scope shadows a binding, the outer binding is restored when the inner scope ends:

```prismio
let x = 1

{
    let x = 99   // shadows outer x
    println(x)   // 99
}

println(x)  // 1 — outer x is back
```

---

## Constants

For truly fixed compile-time values, use `const`. Constants must have explicit types and their initializers must be evaluable at compile time.

```prismio
const MAX_SIZE: Int = 1024
const APP_NAME: String = "Prismio App"
const PI: Float = 3.14159265358979
```

Constants are available for the entire duration of the program and can be used in any scope.

```prismio
const GRAVITY: Float = 9.81

fn fallDistance(time: Float) -> Float = 0.5 * GRAVITY * time * time

fn main() {
    println(fallDistance(2.0))  // 19.62
}
```

Key differences between `const` and `let`:
| Feature | `let` | `const` |
|---|---|---|
| Mutability | Immutable by default | Always immutable |
| Type annotation | Optional (inferred) | Required |
| Evaluated at | Runtime | Compile time |
| Shadowing | Allowed | Not allowed |
| Scope | Block | Any |

---

## Summary

| Declaration | Mutable | Type Required | Notes |
|---|---|---|---|
| `let x = 5` | No | No | Immutable, type inferred |
| `let mut x = 5` | Yes | No | Mutable, type inferred |
| `let x: Int = 5` | No | Yes | Explicit annotation |
| `let mut x: Int = 5` | Yes | Yes | Mutable + explicit |
| `let x: Int` | No | Yes | Late init, must assign before use |
| `let (a, b) = (1, 2)` | No | No | Destructuring |
| `const X: Int = 5` | No | Yes | Compile-time constant |

---

## See Also

- [Types](../types/primitives.md) — all built-in types
- [Pattern Matching](matching.md) — destructuring in match arms
- [Ownership & Borrowing](../../memory/ownership.md) — how bindings interact with memory safety
