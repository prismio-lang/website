# Types

Prismio is a **statically typed** language with powerful **type inference** — you get the safety of explicit types without the verbosity. Every value has a type known at compile time, and the compiler will catch type mismatches before your program ever runs.

---

## Primitive Types

Prismio provides a rich set of primitive types covering integers, floating-point numbers, booleans, and characters.

### Integer Types

| Type    | Size    | Range                                                   |
|---------|---------|--------------------------------------------------------|
| `Int8`  | 8-bit   | −128 to 127                                            |
| `Int16` | 16-bit  | −32,768 to 32,767                                      |
| `Int32` | 32-bit  | −2,147,483,648 to 2,147,483,647                        |
| `Int64` | 64-bit  | −9,223,372,036,854,775,808 to 9,223,372,036,854,775,807|
| `Int`   | 64-bit† | Platform default (alias for `Int64`)                   |
| `UInt`  | 64-bit  | 0 to 18,446,744,073,709,551,615                        |

> †`Int` is always 64-bit on 64-bit platforms.

```prismio
let a: Int = 42
let b: Int8 = 127
let c: Int16 = 1000
let d: Int32 = 2_000_000   // underscores for readability
let e: Int64 = 9_000_000_000
let f: UInt  = 18_446_744_073_709_551_615
```

### Floating-Point Types

| Type      | Size   | Precision         |
|-----------|--------|-------------------|
| `Float32` | 32-bit | ~7 decimal digits |
| `Float64` | 64-bit | ~15 decimal digits|
| `Float`   | 64-bit | Alias for `Float64`|

```prismio
let x: Float   = 3.14
let y: Float32 = 3.14f    // 'f' suffix for Float32 literals
let z: Float64 = 2.718281828459045
```

### Boolean Type

The `Bool` type has exactly two values: `true` and `false`.

```prismio
let isReady: Bool = true
let hasError: Bool = false

if isReady && !hasError {
    println("System is operational.")
}
```

### Character Type

`Char` represents a single Unicode scalar value (UTF-32 code point), written with single quotes.

```prismio
let letter: Char = 'A'
let emoji: Char  = '🔥'
let newline: Char = '\n'
let tab: Char     = '\t'
let unicode: Char = '\u{1F600}'  // 😀
```

Common escape sequences:

| Sequence | Meaning          |
|----------|------------------|
| `\\`     | Backslash        |
| `\'`     | Single quote     |
| `\"`     | Double quote     |
| `\n`     | Newline          |
| `\t`     | Tab              |
| `\r`     | Carriage return  |
| `\0`     | Null             |
| `\u{N}`  | Unicode code point (hex) |

---

## String Type

`String` is a UTF-8 encoded, heap-allocated sequence of characters. It is a value type in Prismio (ownership semantics apply).

```prismio
let greeting: String = "Hello, Prismio!"
let name = "World"                        // type inferred as String

println(greeting)
println("Length: ${greeting.length}")
```

### String Interpolation

Embed any expression inside a string using `${}`:

```prismio
let firstName = "Saksham"
let age = 21

println("Name: ${firstName}, Age: ${age}")
println("Next year: ${age + 1}")
println("Upper: ${firstName.toUpperCase()}")
```

### Multiline Strings

Use triple-quoted strings for multiline content. Leading whitespace is trimmed based on the closing `"""` indentation.

```prismio
let message = """
    Hello,
    This is a
    multiline string.
    """

println(message)
```

### Raw Strings

Prefix with `r` to disable all escape processing:

```prismio
let path = r"C:\Users\vibrant\Documents"
let regex = r"\d+\.\d+"
println(path)   // C:\Users\vibrant\Documents
```

### Common String Operations

```prismio
let s = "Hello, Prismio!"

println(s.length)            // 15
println(s.toUpperCase())     // HELLO, PRISMIO!
println(s.toLowerCase())     // hello, prismio!
println(s.contains("Prism")) // true
println(s.startsWith("Hello"))// true
println(s.endsWith("!"))     // true
println(s.replace("Hello", "Hi")) // Hi, Prismio!
println(s.trim())            // (trims surrounding whitespace)

let parts = s.split(", ")
// parts: ["Hello", "Prismio!"]
```

---

## Array Type

Arrays in Prismio are written as `[ElementType]`. They are homogeneous, ordered, and heap-allocated. Arrays own their elements.

```prismio
// Explicit type annotation
let numbers: [Int] = [1, 2, 3, 4, 5]

// Inferred type
let fruits = ["apple", "banana", "cherry"]  // [String]

// Empty array (type must be specified)
let empty: [Float] = []
```

### Array Operations

```prismio
let mut scores: [Int] = [10, 20, 30]

// Indexing (0-based)
println(scores[0])   // 10
println(scores[2])   // 30

// Mutating
scores[1] = 99
scores.append(40)
scores.prepend(0)

// Properties
println(scores.length)     // 5
println(scores.isEmpty)    // false
println(scores.first)      // 0
println(scores.last)       // 40

// Slicing
let slice = scores[1..3]   // [99, 30]

// Iteration
for score in scores {
    println(score)
}

// Functional operations
let doubled = scores.map { it * 2 }
let big     = scores.filter { it > 20 }
let sum     = scores.reduce(0) { acc, x -> acc + x }
```

### 2D Arrays

```prismio
let matrix: [[Int]] = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

println(matrix[1][2])   // 6
```

---

## Tuple Types

Tuples group a fixed number of values of (potentially different) types. They are value types.

```prismio
// Creating a tuple
let point: (Int, Int) = (10, 20)
let person: (String, Int, Bool) = ("Alice", 30, true)

// Accessing by index
println(point.0)    // 10
println(point.1)    // 20

// Destructuring
let (x, y) = point
println("x=${x}, y=${y}")

let (personName, personAge, isActive) = person
println("${personName} is ${personAge} years old")
```

### Named Tuple Fields

```prismio
let coord: (x: Float, y: Float, z: Float) = (x: 1.0, y: 2.5, z: -0.5)

println(coord.x)   // 1.0
println(coord.z)   // -0.5
```

### Tuples as Return Values

```prismio
fn divmod(a: Int, b: Int) -> (Int, Int) {
    return (a / b, a % b)
}

let (quotient, remainder) = divmod(17, 5)
println("17 ÷ 5 = ${quotient} remainder ${remainder}")
// 17 ÷ 5 = 3 remainder 2
```

---

## Optional Types

Optional types represent a value that may or may not be present. An `Optional<T>` (or the shorthand `T?`) is either **some value** or **none**.

```prismio
let present: Int? = 42
let absent: Int?  = none

// Checking for a value
if present != none {
    println("Value is ${present!}")  // force-unwrap with !
}
```

### Safe Unwrapping with `if let`

The idiomatic way to unwrap optionals:

```prismio
let name: String? = "Prismio"

if let n = name {
    println("Got name: ${n}")
} else {
    println("No name provided")
}
```

### Optional Chaining with `?.`

Access members through an optional without explicit unwrapping:

```prismio
let user: User? = getUser()

// If user is none, the entire chain evaluates to none
let city = user?.address?.city

println(city ?? "Unknown city")
```

### Null Coalescing with `??`

Provide a default when an optional is `none`:

```prismio
let maybeAge: Int? = none
let age = maybeAge ?? 0    // age = 0

let maybeName: String? = "Alice"
let displayName = maybeName ?? "Anonymous"   // displayName = "Alice"
```

### Force Unwrapping with `!`

Use `!` when you are certain a value is present. Crashes at runtime if the optional is `none`.

```prismio
let value: Int? = 100
let definiteValue = value!   // 100 — safe here

let bad: Int? = none
// let crash = bad!   // ⚠️ Runtime panic!
```

---

## Type Inference

Prismio's compiler infers types from the right-hand side of a declaration whenever the type is unambiguous:

```prismio
let count = 10           // Int
let ratio = 3.14         // Float
let flag  = true         // Bool
let name  = "Prismio"    // String
let items = [1, 2, 3]    // [Int]
let pair  = (1, "hello") // (Int, String)
```

Inference works through expressions and function calls:

```prismio
fn double(x: Int) -> Int = x * 2

let result = double(21)   // result: Int — inferred from return type
let doubled = [1, 2, 3].map { it * 2 }  // [Int]
```

When inference is ambiguous, you must annotate:

```prismio
// Ambiguous — could be Int8, Int32, Int64...
let precise: Int32 = 42

// Ambiguous — could be Float32 or Float64
let pi: Float32 = 3.14159
```

---

## Type Casting and Conversion

Prismio does **not** perform implicit numeric conversions. All conversions between numeric types must be explicit.

### Explicit Numeric Conversion

```prismio
let i: Int = 42
let f: Float = Float(i)    // Int → Float

let big: Int64 = 1_000_000
let small: Int32 = Int32(big)   // truncates if out of range

let d: Float64 = 9.99
let truncated: Int = Int(d)   // 9 (truncates toward zero)
```

### Checked Conversion

Use checked variants to handle overflow safely:

```prismio
let big: Int64 = 300
let result: Int8? = Int8.checked(big)   // none — 300 doesn't fit in Int8

if let byte = result {
    println("Fits: ${byte}")
} else {
    println("Value out of range for Int8")
}
```

### String Conversion

```prismio
// To String
let n = 42
let s = String(n)         // "42"
let s2 = n.toString()     // "42"

// From String
let parsed: Int? = Int.parse("123")   // 123
let bad: Int?    = Int.parse("abc")   // none

if let value = Int.parse("456") {
    println("Parsed: ${value}")
}
```

### `as` Operator

The `as` operator is used for safe type casting when working with type hierarchies (e.g., classes and interfaces):

```prismio
// Safe cast — returns Optional
let animal: Animal = getDog()
let dog = animal as? Dog       // Dog?

if let d = dog {
    d.bark()
}

// Forced cast — panics if cast fails
let definitelyDog = animal as! Dog
definitelyDog.bark()
```

---

## Type Aliases

Use `typealias` to create named aliases for existing types, improving readability:

```prismio
typealias Meters    = Float64
typealias Seconds   = Float64
typealias Kilograms = Float64

fn calculateForce(mass: Kilograms, acceleration: Meters) -> Float64 {
    return mass * acceleration
}

let force = calculateForce(mass: 70.0, acceleration: 9.81)
```

Type aliases are especially useful for complex types:

```prismio
typealias Matrix    = [[Float]]
typealias Callback  = (String, Int) -> Bool
typealias UserMap   = [String: User]

fn applyMatrix(m: Matrix) -> Matrix {
    // ...
}

let handler: Callback = { name, score -> score > 100 }
```

---

## The Unit Type

Functions that return nothing implicitly return `Unit`. It is similar to `void` in other languages but is a real type.

```prismio
fn greet(name: String) -> Unit {
    println("Hello, ${name}!")
}

// The return type annotation is optional
fn sayBye(name: String) {
    println("Goodbye, ${name}!")
}
```

---

## The Never Type

`Never` is the return type of functions that **never return** — they either loop forever or always throw.

```prismio
fn crash(message: String) -> Never {
    panic(message)
}

fn infiniteLoop() -> Never {
    loop { }
}
```

The compiler uses `Never` in exhaustiveness checks and dead-code analysis.

---

## Summary

| Category       | Types                                              |
|----------------|----------------------------------------------------|
| Integers       | `Int8`, `Int16`, `Int32`, `Int64`, `Int`, `UInt`  |
| Floats         | `Float32`, `Float64`, `Float`                     |
| Boolean        | `Bool`                                            |
| Character      | `Char`                                            |
| Text           | `String`                                          |
| Collections    | `[T]` (Array)                                     |
| Compound       | `(T1, T2, ...)` (Tuple)                           |
| Optional       | `T?` / `Optional<T>`                              |
| Alias          | `typealias Name = ExistingType`                   |
| No value       | `Unit`                                            |
| No return      | `Never`                                           |

---

## See Also

- [Variables and Mutability](./statements/bindings.md)
- [Literals](../expressions/literals.md)
- [Operators](../expressions/operators.md)
- [Pattern Matching](./statements/matching.md)
- [Ownership](./memory/ownership.md)
