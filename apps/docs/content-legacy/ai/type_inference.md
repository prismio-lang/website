# Type Inference Model

Prismio features a **powerful, ergonomic type inference engine** that eliminates the need to write redundant type annotations in most situations. You get the safety of a statically typed language with the brevity of a dynamically typed one.

> 🚧 **Coming Soon** – Full documentation of the inference algorithm, including edge cases, algorithm complexity guarantees, and advanced generic inference, will be published alongside the Prismio 1.0 specification. This page covers the core concepts with working examples.

---

## How Type Inference Works

Prismio's type inference is based on **Hindley-Milner (HM) type inference**, extended with **bidirectional type checking** to handle more complex patterns such as generic return types, closure parameters, and pattern matching.

The inference runs in two phases:

1. **Constraint Generation** — Walk the AST and emit type equality/subtype constraints.
2. **Constraint Solving (Unification)** — Solve the constraints using Robinson's unification algorithm, producing a substitution from type variables to concrete types.

---

## 1. Hindley-Milner Based Inference

The classic HM algorithm assigns a fresh **type variable** (written `?T`) to every expression whose type is not immediately known. These variables are then constrained and unified.

### Basic Examples

```prismio
// The compiler infers x: Int from the literal 42
let x = 42

// The compiler infers y: Float from the literal 3.14
let y = 3.14

// The compiler infers z: Bool from the literal
let z = true

// The compiler infers the array type from its elements
let names = ["Alice", "Bob", "Carol"]   // inferred: [String]
```

### Function Return Type Inference

If a return type annotation is omitted, the compiler infers it from the function body:

```prismio
// Inferred return type: Int
fn double(x: Int) = x * 2

// Inferred return type: String
fn greet(name: String) = "Hello, " + name + "!"

// Inferred return type: Bool
fn is_even(n: Int) = n % 2 == 0
```

### Propagation Through Expressions

Inference propagates through all expression forms:

```prismio
// All of a, b, c are inferred as Int via constraint propagation
fn sum_three(a: Int, b: Int) {
    let c = a + b    // c: Int (+ on Int yields Int)
    println(c)
}
```

---

## 2. Bidirectional Type Checking

Pure HM inference is **bottom-up**: types flow upward from leaves to the root. Bidirectional type checking adds a **top-down** mode where an expected type is pushed down into sub-expressions.

This is essential for:
- Closure parameters
- Enum variant literals
- Function arguments with overloaded types

### Bidirectional Inference Modes

| Mode | Direction | When Used |
|---|---|---|
| **Infer** | Bottom-up | No expected type available |
| **Check** | Top-down | Expected type is known from context |

### Closure Parameters

Without bidirectional checking, the closure `\|x\| x + 1` has an unknown parameter type. With it, the expected type of the closure is pushed down from the call site:

```prismio
let numbers = [1, 2, 3, 4, 5]

// The compiler sees map expects a closure Fn(Int) -> ?R
// It pushes Int down into |x|, resolving x: Int
// It then infers the return type ?R = Int
let doubled = numbers.map(|x| x * 2)   // inferred: [Int]
```

### Enum Variants

```prismio
enum Direction { North, South, East, West }

fn go(d: Direction) { ... }

// The compiler knows go expects Direction,
// so it resolves North as Direction::North
go(North)
```

---

## 3. When Inference Fails and Explicit Types Are Needed

Inference cannot always determine a unique type. You will need to add type annotations in these situations:

### 3.1 Ambiguous Numeric Literals

```prismio
// Error: cannot infer type of `x` — could be Int or Float
let x = 0

// Fix: add an annotation
let x: Int = 0
let y: Float = 0.0
```

### 3.2 Empty Collections

```prismio
// Error: element type of the array is unknown
let items = []

// Fix: annotate the variable or use a type hint
let items: [String] = []
```

### 3.3 Generic Functions with Unused Type Parameters

```prismio
fn default_value<T>() -> T { ... }

// Error: T is ambiguous at the call site
let val = default_value()

// Fix: annotate or turbofish (planned syntax)
let val: Int = default_value()
// let val = default_value::<Int>()   // turbofish — planned
```

### 3.4 Recursive Functions

Self-recursive functions require a return type annotation because the return type is not known until the body is analyzed, which depends on the return type — a circularity:

```prismio
// Error: return type of recursive function cannot be inferred
fn factorial(n: Int) {
    if n <= 1 { return 1 }
    n * factorial(n - 1)
}

// Fix: annotate the return type
fn factorial(n: Int) -> Int {
    if n <= 1 { return 1 }
    n * factorial(n - 1)
}
```

### 3.5 Multiple Implementations (Trait Objects)

> 🚧 **Coming Soon** – Trait objects and dynamic dispatch are planned.

---

## 4. Generic Type Inference

Prismio infers **generic type arguments** from function call sites.

### Type Argument Inference from Parameters

```prismio
fn identity<T>(value: T) -> T = value

let x = identity(42)       // T inferred as Int;   x: Int
let s = identity("hello")  // T inferred as String; s: String
```

### Inference from Multiple Parameters

When a generic type appears in multiple parameter positions, all uses must agree:

```prismio
fn first_of<T>(a: T, b: T) -> T = a

let result = first_of(10, 20)      // T = Int,    OK
// let bad = first_of(10, "hello") // Error: T cannot be both Int and String
```

### Inference Through Higher-Order Functions

```prismio
fn apply<A, B>(f: fn(A) -> B, value: A) -> B = f(value)

// A = Int, B = String inferred from the closure and argument
let result = apply(|n: Int| n.to_string(), 42)
// result: String
```

### Trait Bound Constraints on Inference

> 🚧 **Coming Soon** – Full trait-bounded inference documentation will be available once traits are stabilized.

When a generic type parameter has a trait bound, the inferred type must satisfy that bound:

```prismio
// Planned syntax
fn print_all<T: Display>(items: [T]) {
    for item in items {
        println(item)
    }
}

print_all([1, 2, 3])        // T = Int, Int must implement Display
print_all(["a", "b", "c"]) // T = String, String must implement Display
```

---

## 5. Examples of Inferred Types

Here is a gallery of examples showing what the compiler infers:

### Variables

```prismio
let a = 42                   // Int
let b = 3.14                 // Float
let c = 'z'                  // Char
let d = "Prismio"            // String
let e = true                 // Bool
let f = [1, 2, 3]            // [Int]
let g = (10, "hello", false) // (Int, String, Bool)
```

### Functions

```prismio
fn negate(x: Int) = -x           // fn(Int) -> Int
fn stringify(x: Int) = x.to_string() // fn(Int) -> String  (planned)
fn identity<T>(x: T) = x         // fn<T>(T) -> T
```

### Closures

```prismio
let add = |a: Int, b: Int| a + b    // fn(Int, Int) -> Int
let square = |x: Int| x * x        // fn(Int) -> Int
let always_true = || true           // fn() -> Bool
```

### Complex Expressions

```prismio
let values = [1, 2, 3, 4, 5]
let evens = values.filter(|x| x % 2 == 0)  // [Int]
let doubled = evens.map(|x| x * 2)          // [Int]
let sum = doubled.fold(0, |acc, x| acc + x) // Int
```

---

## 6. Type Inference and the Borrow Checker

Type inference interacts with the **borrow checker**. Inferred reference types carry **lifetime** information that the borrow checker uses:

```prismio
fn first(items: &[Int]) -> &Int {
    &items[0]    // Return type &Int inferred; lifetime tied to `items`
}
```

> 🚧 **Coming Soon** – Lifetime inference and explicit lifetime annotations are planned for a future release.

---

## 7. Diagnostic Quality

When inference fails, Prismio produces **actionable error messages** that explain:
- Which type variable was not resolved
- What constraints were collected
- What annotation would fix the issue

```
error[E0020]: type annotation required
  --> src/main.prism:3:9
   |
 3 |     let items = [];
   |         ^^^^^ cannot infer element type of array
   |
   = help: add a type annotation: `let items: [MyType] = []`
```

---

## See Also

- [Semantic Model](/ai/semantic_model) — Symbol resolution that precedes type inference
- [Typing Rules](/spec/types) — Formal type system specification
- [Memory Model Specification](/spec/memory) — How ownership interacts with types
- [Grammar (BNF)](/ai/grammar) — Expression syntax that inference operates on
