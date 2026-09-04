# Operators Reference

A complete reference of all operators in the Prismio programming language.

## Arithmetic Operators

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `+` | Addition | `3 + 2` | `5` |
| `-` | Subtraction | `5 - 2` | `3` |
| `*` | Multiplication | `3 * 4` | `12` |
| `/` | Division | `10 / 3` | `3` (integer division) |
| `%` | Remainder | `10 % 3` | `1` |
| `-` | Unary negation | `-x` | negated value |

```prismio
let a = 10
let b = 3

println(a + b)   // 13
println(a - b)   // 7
println(a * b)   // 30
println(a / b)   // 3  (integer division truncates)
println(a % b)   // 1
```

> **Note:** Integer division truncates toward zero. Use float division for decimal results:
> ```prismio
> let result = 10.0 / 3.0   // 3.333...
> ```

---

## Comparison Operators

All comparison operators return a `Bool`.

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `==` | Equal | `5 == 5` | `true` |
| `!=` | Not equal | `5 != 3` | `true` |
| `<` | Less than | `3 < 5` | `true` |
| `>` | Greater than | `5 > 3` | `true` |
| `<=` | Less than or equal | `3 <= 3` | `true` |
| `>=` | Greater than or equal | `5 >= 4` | `true` |

```prismio
let x = 42

println(x == 42)   // true
println(x != 0)    // true
println(x < 100)   // true
println(x > 100)   // false
println(x <= 42)   // true
println(x >= 50)   // false
```

---

## Logical Operators

| Operator | Name | Description |
|----------|------|-------------|
| `&&` | Logical AND | `true` if both operands are `true` |
| `\|\|` | Logical OR | `true` if at least one operand is `true` |
| `!` | Logical NOT | Inverts a boolean value |

```prismio
let a = true
let b = false

println(a && b)    // false
println(a || b)    // true
println(!a)        // false
println(!b)        // true

// Short-circuit evaluation
// Right side not evaluated if result is already determined
let x = isValid() && computeExpensive()   // computeExpensive() skipped if isValid() is false
let y = hasCache() || fetchFromServer()   // fetchFromServer() skipped if hasCache() is true
```

---

## Bitwise Operators

| Operator | Name | Example | Notes |
|----------|------|---------|-------|
| `&` | Bitwise AND | `0b1010 & 0b1100` → `0b1000` | |
| `\|` | Bitwise OR | `0b1010 \| 0b1100` → `0b1110` | |
| `^` | Bitwise XOR | `0b1010 ^ 0b1100` → `0b0110` | |
| `~` | Bitwise NOT | `~0b1010` → `0b...10101` | |
| `<<` | Left shift | `1 << 3` → `8` | |
| `>>` | Right shift | `16 >> 2` → `4` | |

```prismio
let flags = 0b1010
let mask  = 0b1100

println(flags & mask)    // 0b1000 = 8
println(flags | mask)    // 0b1110 = 14
println(flags ^ mask)    // 0b0110 = 6
println(~flags)          // bitwise complement
println(1 << 4)          // 16
println(32 >> 2)         // 8
```

---

## Assignment Operators

| Operator | Equivalent | Description |
|----------|-----------|-------------|
| `=` | — | Basic assignment |
| `+=` | `x = x + y` | Add and assign |
| `-=` | `x = x - y` | Subtract and assign |
| `*=` | `x = x * y` | Multiply and assign |
| `/=` | `x = x / y` | Divide and assign |
| `%=` | `x = x % y` | Remainder and assign |
| `&=` | `x = x & y` | Bitwise AND and assign |
| `\|=` | `x = x \| y` | Bitwise OR and assign |
| `^=` | `x = x ^ y` | Bitwise XOR and assign |
| `<<=` | `x = x << y` | Left shift and assign |
| `>>=` | `x = x >> y` | Right shift and assign |

```prismio
let mut x = 10

x += 5    // x = 15
x -= 3    // x = 12
x *= 2    // x = 24
x /= 4    // x = 6
x %= 4    // x = 2
```

> **Note:** Only `mut` variables can use assignment operators. Using them on an immutable `let` binding is a compile error.

---

## Range Operators

| Operator | Name | Example | Includes end? |
|----------|------|---------|---------------|
| `..` | Exclusive range | `0..10` | No (0–9) |
| `..=` | Inclusive range | `0..=10` | Yes (0–10) |

```prismio
// Exclusive range: 0, 1, 2, ..., 9
for i in 0..10 {
    print("${i} ")
}
// Output: 0 1 2 3 4 5 6 7 8 9

// Inclusive range: 0, 1, 2, ..., 10
for i in 0..=10 {
    print("${i} ")
}
// Output: 0 1 2 3 4 5 6 7 8 9 10

// Ranges in match
let score = 85
match score {
    90..=100 -> println("A"),
    80..=89  -> println("B"),
    70..=79  -> println("C"),
    _        -> println("Below C"),
}
// Output: B
```

---

## Optional Operators

> 🚧 **Coming Soon** – Optional/nullable operators are planned for a future release.

| Operator | Name | Description |
|----------|------|-------------|
| `?.` | Safe call | Access member only if not null |
| `??` | Null coalescing | Provide a default if null |
| `!!` | Force unwrap | Assert non-null (panics if null) |

```prismio
// Planned syntax
let name: String? = getName()
let length = name?.length      // null if name is null
let display = name ?? "Anonymous"   // "Anonymous" if name is null
let forced = name!!             // panics if name is null
```

---

## Operator Precedence

From highest to lowest precedence:

| Precedence | Operators | Associativity |
|------------|-----------|---------------|
| 1 (highest) | `!`, `-` (unary), `~` | Right |
| 2 | `*`, `/`, `%` | Left |
| 3 | `+`, `-` | Left |
| 4 | `<<`, `>>` | Left |
| 5 | `&` | Left |
| 6 | `^` | Left |
| 7 | `\|` | Left |
| 8 | `..`, `..=` | Left |
| 9 | `<`, `>`, `<=`, `>=` | Left |
| 10 | `==`, `!=` | Left |
| 11 | `&&` | Left |
| 12 | `\|\|` | Left |
| 13 (lowest) | `=`, `+=`, `-=`, etc. | Right |

```prismio
// Precedence examples
let a = 2 + 3 * 4      // = 14 (not 20), * has higher precedence
let b = (2 + 3) * 4    // = 20, parentheses override precedence
let c = !true || false  // = false, ! applied first, then ||
let d = 1 + 2 == 3     // = true, + before ==
```

> **Tip:** When in doubt, use parentheses to make intent explicit.

---

## Operator Overloading

> 🚧 **Coming Soon** – Operator overloading via trait implementation is planned.

Prismio plans to allow custom types to implement standard operators by implementing specific traits:

```prismio
// Planned syntax
impl Add for Vector2D {
    fn add(self, other: Vector2D) -> Vector2D {
        Vector2D { x: self.x + other.x, y: self.y + other.y }
    }
}
```
