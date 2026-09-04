# Operators

Prismio provides a comprehensive set of operators for arithmetic, comparison, logical operations, bitwise manipulation, assignment, and more. This page covers every operator, its semantics, and its precedence.

---

## Arithmetic Operators

Arithmetic operators perform mathematical computations on numeric types.

| Operator | Name           | Example       | Result |
|----------|----------------|---------------|--------|
| `+`      | Addition        | `10 + 3`      | `13`   |
| `-`      | Subtraction     | `10 - 3`      | `7`    |
| `*`      | Multiplication  | `10 * 3`      | `30`   |
| `/`      | Division        | `10 / 3`      | `3`    |
| `%`      | Remainder       | `10 % 3`      | `1`    |
| `-`      | Unary negation  | `-x`          | negated|

```prismio
let a = 10
let b = 3

println(a + b)    // 13
println(a - b)    // 7
println(a * b)    // 30
println(a / b)    // 3  (integer division — truncates toward zero)
println(a % b)    // 1
println(-a)       // -10
```

> **Note on integer division:** `/` between two integers truncates toward zero. Use `Float` division for fractional results:

```prismio
let result = 10 / 3          // 3 (Int division)
let precise = 10.0 / 3.0    // 3.3333... (Float division)
let mixed = Float(10) / 3.0 // 3.3333... (explicit conversion)
```

> **Note on overflow:** Integer arithmetic in safe Prismio panics on overflow by default. Use checked arithmetic for overflow-safe operations:

```prismio
let big: Int8 = 127
// let overflow = big + 1    // ⚠️ runtime panic in debug mode

let checked = big.checkedAdd(1)   // Int8? — returns none on overflow
println(checked ?? -1)            // -1 (overflow → none)
```

---

## Comparison Operators

Comparison operators compare two values and return `Bool`. Both operands must be the same type.

| Operator | Meaning                  | Example       | Result  |
|----------|--------------------------|---------------|---------|
| `==`     | Equal to                 | `5 == 5`      | `true`  |
| `!=`     | Not equal to             | `5 != 3`      | `true`  |
| `<`      | Less than                | `3 < 5`       | `true`  |
| `>`      | Greater than             | `5 > 3`       | `true`  |
| `<=`     | Less than or equal to    | `3 <= 3`      | `true`  |
| `>=`     | Greater than or equal to | `5 >= 6`      | `false` |

```prismio
let x = 10
let y = 20

println(x == y)   // false
println(x != y)   // true
println(x < y)    // true
println(x > y)    // false
println(x <= 10)  // true
println(y >= 20)  // true

// Comparing strings (lexicographic)
println("apple" < "banana")   // true
println("zebra" > "ant")      // true
println("hello" == "hello")   // true
```

---

## Logical Operators

Logical operators work on `Bool` values and support **short-circuit evaluation** (see [Evaluation Order](./evaluation.md)).

| Operator | Name        | Example            | Result |
|----------|-------------|--------------------|--------|
| `&&`     | Logical AND | `true && false`    | `false`|
| `\|\|`   | Logical OR  | `false \|\| true`  | `true` |
| `!`      | Logical NOT | `!true`            | `false`|

```prismio
let a = true
let b = false

println(a && b)    // false — both must be true
println(a || b)    // true  — at least one must be true
println(!a)        // false
println(!b)        // true

// Short-circuit: right side not evaluated if result is determined
let x = none as Int?
let safe = x != none && x! > 0    // x! is never reached — && short-circuits
```

### Combining Conditions

```prismio
let age = 25
let hasLicense = true
let isSober = true

if age >= 18 && hasLicense && isSober {
    println("Allowed to drive")
}

let isWeekend = false
let isHoliday = true

if isWeekend || isHoliday {
    println("Day off!")
}
```

---

## Bitwise Operators

Bitwise operators work on the individual bits of integer values.

| Operator | Name           | Example        | Result (binary)  |
|----------|----------------|----------------|------------------|
| `&`      | Bitwise AND    | `0b1100 & 0b1010` | `0b1000` (8)  |
| `\|`     | Bitwise OR     | `0b1100 \| 0b1010` | `0b1110` (14)|
| `^`      | Bitwise XOR    | `0b1100 ^ 0b1010` | `0b0110` (6)  |
| `~`      | Bitwise NOT    | `~0b0000_1111`    | all bits flip  |
| `<<`     | Left shift     | `1 << 3`          | `8`            |
| `>>`     | Right shift    | `16 >> 2`         | `4`            |

```prismio
let a = 0b1100   // 12
let b = 0b1010   // 10

println(a & b)   // 8  = 0b1000
println(a | b)   // 14 = 0b1110
println(a ^ b)   // 6  = 0b0110
println(~a)      // bitwise complement of 12

println(1 << 0)  // 1
println(1 << 1)  // 2
println(1 << 2)  // 4
println(1 << 3)  // 8

println(64 >> 1) // 32
println(64 >> 2) // 16
println(64 >> 3) // 8
```

### Practical Bitwise Usage

```prismio
// Flag manipulation
let READ    = 0b001   // 1
let WRITE   = 0b010   // 2
let EXECUTE = 0b100   // 4

let mut perms = READ | WRITE    // 0b011 = 3

// Check if flag is set
let canRead  = (perms & READ)    != 0   // true
let canExec  = (perms & EXECUTE) != 0   // false

// Set a flag
perms = perms | EXECUTE   // add execute permission

// Clear a flag
perms = perms & ~WRITE    // remove write permission

// Toggle a flag
perms = perms ^ READ      // flip read permission
```

---

## Assignment Operators

The basic assignment operator `=` stores a value. **Compound assignment** operators combine an operation with assignment.

| Operator | Meaning             | Equivalent    |
|----------|---------------------|---------------|
| `=`      | Assign              | —             |
| `+=`     | Add and assign      | `x = x + n`  |
| `-=`     | Subtract and assign | `x = x - n`  |
| `*=`     | Multiply and assign | `x = x * n`  |
| `/=`     | Divide and assign   | `x = x / n`  |
| `%=`     | Remainder and assign| `x = x % n`  |
| `&=`     | Bitwise AND assign  | `x = x & n`  |
| `\|=`    | Bitwise OR assign   | `x = x \| n` |
| `^=`     | Bitwise XOR assign  | `x = x ^ n`  |
| `<<=`    | Left shift assign   | `x = x << n` |
| `>>=`    | Right shift assign  | `x = x >> n` |

```prismio
let mut x = 10

x += 5    // x = 15
x -= 3    // x = 12
x *= 2    // x = 24
x /= 4    // x = 6
x %= 4    // x = 2

let mut flags = 0b0000
flags |= 0b0001   // set bit 0
flags |= 0b0100   // set bit 2
flags &= ~0b0001  // clear bit 0
println(flags)    // 0b0100 = 4
```

> **Note:** Assignment is a **statement** in Prismio, not an expression. It does not return a value, so you cannot chain assignments like `a = b = 0` or use assignment in conditions.

---

## Range Operators

Range operators create a range of values, commonly used in `for` loops and slice expressions.

| Operator | Name               | Includes end? | Example    | Range       |
|----------|--------------------|---------------|------------|-------------|
| `..`     | Exclusive range    | ❌ No         | `1..5`     | 1, 2, 3, 4 |
| `..=`    | Inclusive range    | ✅ Yes        | `1..=5`    | 1, 2, 3, 4, 5|

```prismio
// Exclusive range (common for indexing)
for i in 0..5 {
    print("${i} ")   // 0 1 2 3 4
}

// Inclusive range
for i in 1..=5 {
    print("${i} ")   // 1 2 3 4 5
}

// Using ranges for slicing
let nums = [10, 20, 30, 40, 50]
let slice = nums[1..4]    // [20, 30, 40]
let last3 = nums[2..=4]   // [30, 40, 50]

// Ranges as values
let r = 1..=100
println(r.contains(50))   // true
println(r.contains(0))    // false
```

---

## Optional Chaining (`?.`)

The optional chaining operator safely accesses a member through an optional. If the optional is `none`, the entire expression evaluates to `none` without crashing.

```prismio
struct Address {
    city: String
    zip: String
}

struct User {
    name: String
    address: Address?
}

let user: User? = getUser()

// Without optional chaining — verbose
let city: String?
if let u = user {
    if let addr = u.address {
        city = addr.city
    }
}

// With optional chaining — concise
let city = user?.address?.city    // String? — none if any link is none
```

### Calling Methods with `?.`

```prismio
let name: String? = "  hello  "
let trimmed = name?.trim()       // String? — "hello" or none
let length  = name?.length       // Int? — 7 or none
```

### Chaining with `??`

Combine `?.` with `??` for clean fallback values:

```prismio
let displayCity = user?.address?.city ?? "Unknown City"
println(displayCity)   // "Unknown City" if any step is none
```

---

## Null Coalescing (`??`)

The null coalescing operator returns the left operand if it is not `none`, otherwise returns the right operand (the default):

```prismio
let value: Int? = none
let result = value ?? 42    // 42

let name: String? = "Alice"
let display = name ?? "Anonymous"   // "Alice"

// Chained
let a: Int? = none
let b: Int? = none
let c: Int? = 7
let first = a ?? b ?? c ?? 0   // 7
```

### `??=` Assignment

> 🚧 **Coming Soon** – `??=` will assign a default only when the variable is `none`.

```prismio
// Planned:
let mut cache: String? = none
cache ??= computeExpensiveValue()   // only computed if cache is none
```

---

## String Concatenation

Use `+` to concatenate strings. The result is a new `String`:

```prismio
let hello = "Hello"
let world = "World"
let msg   = hello + ", " + world + "!"
println(msg)   // Hello, World!

// Prefer interpolation for readability
let msg2 = "${hello}, ${world}!"
```

---

## Operator Precedence

The following table lists all operators from highest to lowest precedence. Operators on the same row have the same precedence and are left-associative unless noted.

| Level | Operators                                        | Associativity |
|-------|--------------------------------------------------|---------------|
| 1 (highest) | Function call `()`, subscript `[]`, member `.`, `?.` | Left |
| 2     | Unary `!`, unary `-`, `~`                        | Right         |
| 3     | `*`, `/`, `%`                                    | Left          |
| 4     | `+`, `-`                                         | Left          |
| 5     | `<<`, `>>`                                       | Left          |
| 6     | `&`                                              | Left          |
| 7     | `^`                                              | Left          |
| 8     | `\|`                                             | Left          |
| 9     | `..`, `..=`                                      | None          |
| 10    | `==`, `!=`, `<`, `>`, `<=`, `>=`                 | Left          |
| 11    | `&&`                                             | Left          |
| 12    | `\|\|`                                           | Left          |
| 13    | `??`                                             | Right         |
| 14    | `as`, `as?`, `as!`                               | Left          |
| 15 (lowest) | `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `\|=`, `^=`, `<<=`, `>>=` | Right |

### Precedence Examples

```prismio
// Arithmetic — * before +
let a = 2 + 3 * 4       // 2 + 12 = 14

// Comparison — arithmetic before comparison
let b = 5 + 3 > 2 * 4   // 8 > 8 = false

// Logical — && before ||
let c = true || false && false   // true || (false && false) = true || false = true

// Use parentheses to make intent explicit
let d = (2 + 3) * 4     // 20 (override default precedence)
let e = (true || false) && false  // false
```

---

## Operator Overloading

> 🚧 **Coming Soon** – Operator overloading for custom types is planned.

You will be able to implement standard operator traits to define operator behaviour for your own types:

```prismio
// Planned syntax
struct Vec2 {
    x: Float
    y: Float
}

impl Add for Vec2 {
    fn add(self, other: Vec2) -> Vec2 {
        return Vec2(x: self.x + other.x, y: self.y + other.y)
    }
}

let v1 = Vec2(x: 1.0, y: 2.0)
let v2 = Vec2(x: 3.0, y: 4.0)
let v3 = v1 + v2   // Vec2(x: 4.0, y: 6.0)
```

---

## See Also

- [Literals](./literals.md)
- [Evaluation Order](./evaluation.md)
- [Types](../types.md)
- [Control Flow](../statements/control_flow.md)
