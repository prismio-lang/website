# Core Types

Prismio's core types are part of the language prelude — they are available in every file without any import statement. This page provides a complete reference for each type: its variants, constructors, methods, and common usage patterns.

---

## Integers

Prismio provides both signed and unsigned integer types in multiple widths.

### Signed Integers

| Type | Width | Range |
|---|---|---|
| `Int8` | 8-bit | −128 to 127 |
| `Int16` | 16-bit | −32,768 to 32,767 |
| `Int32` | 32-bit | −2,147,483,648 to 2,147,483,647 |
| `Int64` | 64-bit | −9.2 × 10¹⁸ to 9.2 × 10¹⁸ |
| `Int` | Platform-native (64-bit on modern systems) | Same as `Int64` on 64-bit |

### Unsigned Integers

| Type | Width | Range |
|---|---|---|
| `UInt8` | 8-bit | 0 to 255 |
| `UInt16` | 16-bit | 0 to 65,535 |
| `UInt32` | 32-bit | 0 to 4,294,967,295 |
| `UInt64` | 64-bit | 0 to 1.8 × 10¹⁹ |
| `UInt` | Platform-native | Same as `UInt64` on 64-bit |

### Integer Literals

```prismio
let a: Int    = 42
let b: Int64  = 9_000_000_000    // underscores for readability
let c: Int8   = -100
let d: UInt   = 255
let e: UInt8  = 0xFF             // hexadecimal
let f: Int    = 0b1010_1010      // binary
let g: Int    = 0o755            // octal
```

### Integer Methods

```prismio
let n: Int = -42

n.abs()              // 42 — absolute value
n.toString()         // "-42"
n.toFloat()          // -42.0
n.clamp(0, 100)      // 0 — clamp to range [0, 100]
n.min(10)            // -42 — min of self and argument
n.max(-100)          // -42 — max of self and argument

Int.parse("123")     // Optional<Int> — parse from string
Int.parse("abc")     // Optional.none()
```

### Overflow Behavior

By default, integer overflow is a **compile-time error** when detectable, and a **runtime panic** otherwise. Use wrapping/saturating operations explicitly when overflow is intentional:

```prismio
let x: Int8 = 127
// let overflow = x + 1  // ❌ panic at runtime

let wrapped = x.wrappingAdd(1)    // -128 (wraps around)
let saturated = x.saturatingAdd(1) // 127 (stays at max)
let checked = x.checkedAdd(1)     // Optional<Int8>.none() — returns none on overflow
```

---

## Floating-Point Numbers

| Type | Width | Precision |
|---|---|---|
| `Float` | 32-bit | ~7 decimal digits (IEEE 754 single) |
| `Float64` | 64-bit | ~15 decimal digits (IEEE 754 double) |

`Float` is the default floating-point type for most use cases. Use `Float64` when you need higher precision (scientific computing, financial calculations, etc.).

### Float Literals

```prismio
let a: Float   = 3.14
let b: Float64 = 3.141592653589793
let c: Float   = 1.5e10    // scientific notation: 15,000,000,000.0
let d: Float   = 0.001
```

### Float Methods

```prismio
let f: Float = -3.7

f.abs()       // 3.7
f.floor()     // -4.0
f.ceil()      // -3.0
f.round()     // -4.0
f.sqrt()      // NaN (negative)
f.toString()  // "-3.7"
f.toInt()     // -3 (truncates toward zero)

Float.parse("3.14")    // Optional<Float>.some(3.14)
Float.parse("hello")   // Optional<Float>.none()

Float.nan()       // NaN
Float.infinity()  // +∞
Float.isNaN(f)    // false
Float.isFinite(f) // true
```

### Math Functions

Import `std.math` for mathematical operations:

```prismio
import std.math.{ sqrt, pow, abs, sin, cos, tan, log, log2, log10, PI, E }

fn main() {
    println(sqrt(2.0))          // 1.4142135...
    println(pow(2.0, 10.0))     // 1024.0
    println(sin(PI / 6.0))      // 0.5
    println(cos(0.0))           // 1.0
    println(log(E))             // 1.0
    println(log2(1024.0))       // 10.0
    println(log10(1000.0))      // 3.0
}
```

---

## Bool

The `Bool` type has exactly two values: `true` and `false`.

```prismio
let isReady: Bool = true
let isDone: Bool = false
```

### Boolean Operators

```prismio
let a = true
let b = false

a && b     // false — logical AND
a || b     // true  — logical OR
!a         // false — logical NOT
a == b     // false — equality
a != b     // true  — inequality
```

### Bool Methods

```prismio
let flag: Bool = true
flag.toString()   // "true"
flag.toInt()      // 1 (true = 1, false = 0)
```

---

## Char

`Char` represents a single Unicode scalar value (a 32-bit codepoint, not a byte).

```prismio
let c: Char = 'A'
let emoji: Char = '🔥'
let newline: Char = '\n'
let tab: Char = '\t'
let backslash: Char = '\\'
let quote: Char = '\''
let unicode: Char = '\u{1F600}'  // 😀
```

### Char Methods

```prismio
let c: Char = 'a'

c.isAlpha()           // true — is alphabetic
c.isDigit()           // false — is numeric digit
c.isAlphaNumeric()    // true
c.isWhitespace()      // false
c.isUpperCase()       // false
c.isLowerCase()       // true
c.toUpperCase()       // 'A'
c.toLowerCase()       // 'a' (no-op here)
c.toInt()             // 97 — Unicode codepoint
c.toString()          // "a"

Char.fromInt(65)      // Optional<Char>.some('A')
Char.fromInt(999999)  // Optional<Char>.none() — invalid codepoint
```

---

## String

`String` is an owned, heap-allocated, UTF-8 encoded string. String literals use double quotes.

```prismio
let greeting: String = "Hello, World!"
let multiline: String = "Line 1\nLine 2\nLine 3"
let withTab: String = "Name:\tAlice"
let empty: String = ""
```

### String Interpolation

Use `${...}` inside a string literal to embed expressions:

```prismio
let name = "Alice"
let age = 30
println("My name is ${name} and I am ${age} years old.")
// My name is Alice and I am 30 years old.

let result = 2 + 2
println("2 + 2 = ${result}")  // 2 + 2 = 4
```

### String Methods

```prismio
let s: String = "  Hello, World!  "

// Length
s.length()              // 17 — number of Unicode characters
s.byteLength()          // byte count (may differ for non-ASCII)
s.isEmpty()             // false
s.isNotEmpty()          // true

// Case
s.toUpperCase()         // "  HELLO, WORLD!  "
s.toLowerCase()         // "  hello, world!  "

// Trimming
s.trim()                // "Hello, World!"
s.trimStart()           // "Hello, World!  "
s.trimEnd()             // "  Hello, World!"

// Searching
s.contains("World")     // true
s.startsWith("  Hello") // true
s.endsWith("!  ")       // true
s.indexOf("World")      // Optional<Int>.some(9)
s.indexOf("xyz")        // Optional<Int>.none()
s.count("l")            // 3

// Slicing and Substrings
s.substring(2, 7)       // "Hello"
s.charAt(2)             // Optional<Char>.some('H')
s.first()               // Optional<Char>.some(' ')
s.last()                // Optional<Char>.some(' ')

// Splitting and Joining
"a,b,c".split(",")      // ["a", "b", "c"]
"hello".chars()         // ['h', 'e', 'l', 'l', 'o']
```

```prismio
// Modification (returns new String — String is immutable)
let s = "Hello, World!"
s.replace("World", "Prismio")     // "Hello, Prismio!"
s.replaceFirst("l", "L")          // "HeLlo, World!"
s.replaceAll("l", "L")            // "HeLLo, WorLd!"
s.insert(5, " there")             // "Hello there, World!"
s.remove(0, 7)                    // "World!"
s.reverse()                       // "!dlroW ,olleH"
s.repeat(2)                       // "Hello, World!Hello, World!"
```

```prismio
// Conversion
"42".toInt()        // Optional<Int>.some(42)
"3.14".toFloat()    // Optional<Float>.some(3.14)
"true".toBool()     // Optional<Bool>.some(true)
42.toString()       // "42"
3.14.toString()     // "3.14"
true.toString()     // "true"
```

### String Concatenation

```prismio
let a = "Hello"
let b = " World"
let c = a + b         // "Hello World"
let d = a + "!" + " " + b  // "Hello! World"
```

> **Performance note:** For concatenating many strings in a loop, prefer `std.string.StringBuilder` (🚧 Coming Soon) over repeated `+` to avoid O(n²) allocations.

---

## Array\<T\>

`Array<T>` is Prismio's built-in fixed-capacity, contiguous sequence. Array literals use square brackets.

```prismio
let numbers: Array<Int> = [1, 2, 3, 4, 5]
let names: Array<String> = ["Alice", "Bob", "Carol"]
let empty: Array<Float> = []
```

Type inference works with array literals:

```prismio
let scores = [95, 87, 73, 100, 61]  // inferred as Array<Int>
```

### Array Access

```prismio
let arr = [10, 20, 30, 40, 50]

arr[0]        // 10 — zero-indexed
arr[4]        // 50
arr[-1]       // 50 — negative indexing (from end)
arr[-2]       // 40

// Bounds-checked access
arr.get(2)    // Optional<Int>.some(30)
arr.get(99)   // Optional<Int>.none() — no panic

// Slicing
arr[1..3]     // [20, 30] — exclusive end
arr[1..=3]    // [20, 30, 40] — inclusive end
arr[2..]      // [30, 40, 50] — from index to end
arr[..3]      // [10, 20, 30] — from start to index
```

### Array Methods

```prismio
let arr = [3, 1, 4, 1, 5, 9, 2, 6]

// Query
arr.length()         // 8
arr.isEmpty()        // false
arr.contains(5)      // true
arr.indexOf(4)       // Optional<Int>.some(2)
arr.first()          // Optional<Int>.some(3)
arr.last()           // Optional<Int>.some(6)
arr.count(1)         // 2 — occurrences of value
```

```prismio
let mut arr = [3, 1, 4, 1, 5]

// Mutation
arr.set(0, 99)        // arr is now [99, 1, 4, 1, 5]
arr.push(7)           // arr is now [99, 1, 4, 1, 5, 7]
arr.pop()             // returns Optional<Int>.some(7); arr is [99, 1, 4, 1, 5]
arr.insert(2, 42)     // arr is [99, 1, 42, 4, 1, 5]
arr.remove(2)         // removes index 2; arr is [99, 1, 4, 1, 5]
arr.removeValue(1)    // removes first occurrence of 1; arr is [99, 4, 1, 5]
arr.clear()           // arr is []
arr.reverse()         // reverses in-place
arr.sort()            // sorts in-place (ascending)
arr.sortBy(fn(a, b) -> a > b)  // sort descending with comparator
```

```prismio
// Functional operations (return new arrays)
let nums = [1, 2, 3, 4, 5, 6]

nums.map(fn(x) -> x * x)              // [1, 4, 9, 16, 25, 36]
nums.filter(fn(x) -> x % 2 == 0)      // [2, 4, 6]
nums.reduce(0, fn(acc, x) -> acc + x) // 21
nums.forEach(fn(x) -> println(x))     // prints each element

nums.any(fn(x) -> x > 5)    // true
nums.all(fn(x) -> x > 0)    // true
nums.none(fn(x) -> x < 0)   // true
nums.find(fn(x) -> x > 3)   // Optional<Int>.some(4)

nums.take(3)                 // [1, 2, 3]
nums.drop(3)                 // [4, 5, 6]
nums.zip([10, 20, 30])       // [(1,10), (2,20), (3,30)] — truncates to shorter
nums.flatten()               // flattens Array<Array<T>> to Array<T>
nums.sorted()                // returns sorted copy (does not mutate)
nums.reversed()              // returns reversed copy
nums.unique()                // [1, 2, 3, 4, 5, 6] — deduplicated (preserves order)
```

### Multi-Dimensional Arrays

```prismio
let matrix: Array<Array<Int>> = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

println(matrix[1][2])  // 6
```

---

## Optional\<T\>

`Optional<T>` represents a value that may or may not be present. It replaces `null`/`nil` — there is no null in Prismio. A function that might not return a value returns `Optional<T>` instead.

```prismio
let present: Optional<Int> = Optional.some(42)
let absent: Optional<Int> = Optional.none()
```

### Creating Optionals

```prismio
Optional.some(99)   // wraps a value
Optional.none()     // empty optional

// Shorthand (sugar)
let x: Optional<String> = "hello"?   // same as Optional.some("hello")
```

### Unwrapping

```prismio
let opt: Optional<Int> = Optional.some(10)

// Safe unwrapping with match
match opt {
    Optional.some(v) => println("Got: " + v.toString())
    Optional.none()  => println("Nothing")
}

// Default value
opt.unwrapOr(0)       // 10 — returns value or default
opt.unwrapOrElse(fn() -> computeDefault())  // lazily computed default

// Force unwrap — panics if none
opt.unwrap()          // 10 (use only when you're certain it's some)

// Check
opt.isSome()          // true
opt.isNone()          // false

// Transform
opt.map(fn(v) -> v * 2)            // Optional.some(20)
opt.flatMap(fn(v) -> lookup(v))    // chains optional-returning functions
opt.filter(fn(v) -> v > 5)        // Optional.some(10)
```

### Optional Chaining

Use `?.` to chain method calls on optionals safely:

```prismio
let user: Optional<User> = findUser(id)

let name: Optional<String> = user?.name      // none if user is none
let upper: Optional<String> = user?.name?.toUpperCase()
```

### The `?` Operator in Functions

In a function returning `Optional<T>` or `Result<T, E>`, use `?` to propagate `none`/`err` early:

```prismio
fn getFirstCharUppercase(s: String) -> Optional<Char> {
    let first = s.first()?          // returns none if string is empty
    return Optional.some(first.toUpperCase())
}
```

---

## Type Conversions

Prismio does not perform implicit type coercions. All conversions are explicit:

```prismio
let i: Int = 42
let f: Float = i.toFloat()        // Int -> Float
let i2: Int = f.toInt()           // Float -> Int (truncates)
let s: String = i.toString()      // Int -> String
let parsed: Optional<Int> = "42".toInt()  // String -> Optional<Int>
let c: Char = 'A'
let code: Int = c.toInt()         // Char -> Int (codepoint)
```

---

## See Also

- [Standard Library Overview](/stdlib/overview) — all stdlib modules
- [Collections](/stdlib/collections) — List, Map, Set and more
- [Pattern Matching](/language/control-flow/match) — working with Optional via match
- [Operators](/language/syntax/operators) — arithmetic, comparison, and logical operators
