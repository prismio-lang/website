# Control Flow

Prismio provides a rich set of control flow constructs. A key design principle is that most control flow constructs are **expressions** — they produce values and can appear on the right side of a binding, be passed as arguments, or be returned from functions.

---

## `if` / `else if` / `else`

The `if` expression evaluates a Boolean condition and executes the matching branch.

```prismio
let temperature = 35

if temperature > 30 {
    println("It's hot outside!")
}
```

Add `else` for the alternative branch:

```prismio
let score = 72

if score >= 60 {
    println("You passed!")
} else {
    println("You failed.")
}
```

Chain multiple conditions with `else if`:

```prismio
let grade = 85

if grade >= 90 {
    println("A")
} else if grade >= 80 {
    println("B")
} else if grade >= 70 {
    println("C")
} else if grade >= 60 {
    println("D")
} else {
    println("F")
}
```

---

## `if` as an Expression

In Prismio, `if` is an **expression** — it evaluates to the value of whichever branch is taken. This eliminates the need for ternary operators.

```prismio
let age = 20
let status = if age >= 18 { "adult" } else { "minor" }
println(status)  // adult
```

Using `if` as an expression in a function return:

```prismio
fn abs(n: Int) -> Int = if n >= 0 { n } else { -n }

println(abs(-5))   // 5
println(abs(10))   // 10
```

`if` expressions inside string interpolation:

```prismio
let count = 1
println("There ${if count == 1 { "is" } else { "are" }} ${count} item${if count == 1 { "" } else { "s" }}")
// There is 1 item
```

When used as an expression, **all branches must return the same type** and there must be an `else` branch:

```prismio
// ❌ Error: missing else branch — expression could be Unit or Int
let x = if condition { 42 }

// ✅ Correct
let x = if condition { 42 } else { 0 }
```

Multi-line `if` expressions use the last expression of each block as the branch value:

```prismio
let result = if score >= 90 {
    let bonus = score - 90
    "Excellent! Bonus points: ${bonus}"
} else {
    "Keep working hard!"
}
println(result)
```

---

## Truthiness Rules

Prismio requires conditions to be strictly of type `Bool`. There is **no implicit conversion** to boolean — only `true` and `false` are valid conditions.

```prismio
let x = 0

if x {          // ❌ Error: expected Bool, found Int
    println("truthy")
}

if x != 0 {    // ✅ Explicit comparison
    println("non-zero")
}
```

```prismio
let name = ""

if name {       // ❌ Error: expected Bool, found String
    println("has name")
}

if name.isNotEmpty() {  // ✅ Explicit check
    println("has name")
}
```

Common boolean idioms:

```prismio
let items = [1, 2, 3]

if items.isEmpty() { println("empty") }
if items.isNotEmpty() { println("not empty") }
if items.size > 0 { println("has items") }

let opt: Int? = null
if opt != null { println("has value") }
```

---

## Guard Clauses

Guard clauses (early returns) make functions cleaner by handling invalid or edge cases up front, avoiding deep nesting.

```prismio
fn processOrder(order: Order) {
    if !order.isValid() {
        println("Invalid order")
        return
    }

    if order.items.isEmpty() {
        println("Order has no items")
        return
    }

    if order.total <= 0.0 {
        println("Invalid total")
        return
    }

    // Happy path — no nesting needed
    println("Processing order #${order.id}")
    submitOrder(order)
}
```

Compare the same function **without** guard clauses:

```prismio
// ❌ Deeply nested — hard to read
fn processOrder(order: Order) {
    if order.isValid() {
        if !order.items.isEmpty() {
            if order.total > 0.0 {
                println("Processing order #${order.id}")
                submitOrder(order)
            } else {
                println("Invalid total")
            }
        } else {
            println("Order has no items")
        }
    } else {
        println("Invalid order")
    }
}
```

---

## `when` Expression

`when` is Prismio's multi-way branching construct. It is more powerful than a simple `if-else` chain and works like a structured switch expression.

### Basic `when`

```prismio
let day = 3

when day {
    1 -> println("Monday")
    2 -> println("Tuesday")
    3 -> println("Wednesday")
    4 -> println("Thursday")
    5 -> println("Friday")
    6 -> println("Saturday")
    7 -> println("Sunday")
    else -> println("Invalid day")
}
```

### `when` as an Expression

```prismio
let day = 6
let type = when day {
    1, 2, 3, 4, 5 -> "Weekday"
    6, 7           -> "Weekend"
    else           -> "Invalid"
}
println(type)  // Weekend
```

### Multiple Values in a Branch

Separate values with commas to match any of them:

```prismio
let char = 'a'
val kind = when char {
    'a', 'e', 'i', 'o', 'u' -> "vowel"
    else                      -> "consonant"
}
println(kind)  // vowel
```

### `when` with Conditions

`when` branches can use arbitrary Boolean conditions when no subject is provided:

```prismio
let score = 87

val grade = when {
    score >= 90 -> "A"
    score >= 80 -> "B"
    score >= 70 -> "C"
    score >= 60 -> "D"
    else        -> "F"
}

println("Grade: ${grade}")  // Grade: B
```

### `when` with Type Checking

```prismio
fn describe(value: Any) -> String = when value {
    is Int    -> "Integer: ${value}"
    is Float  -> "Float: ${value}"
    is String -> "String of length ${value.length}"
    is Bool   -> if value { "True" } else { "False" }
    else      -> "Unknown type"
}

println(describe(42))       // Integer: 42
println(describe("hello"))  // String of length 5
println(describe(true))     // True
```

### Block Bodies in `when`

When a branch needs multiple statements, use a block:

```prismio
let action = "login"

when action {
    "login" -> {
        println("Logging in...")
        authenticateUser()
        loadProfile()
    }
    "logout" -> {
        saveSession()
        println("Goodbye!")
    }
    else -> println("Unknown action: ${action}")
}
```

---

## Nested Control Flow

Control flow constructs can be freely nested.

```prismio
fn classifyTemperature(celsius: Float) -> String {
    return if celsius < 0.0 {
        if celsius < -20.0 { "Extreme cold" } else { "Freezing" }
    } else if celsius < 15.0 {
        "Cold"
    } else if celsius < 25.0 {
        "Comfortable"
    } else if celsius < 35.0 {
        "Warm"
    } else {
        if celsius > 45.0 { "Extreme heat" } else { "Hot" }
    }
}

println(classifyTemperature(-25.0))  // Extreme cold
println(classifyTemperature(20.0))   // Comfortable
println(classifyTemperature(50.0))   // Extreme heat
```

---

## Practical Examples

### FizzBuzz

```prismio
fn main() {
    for i in 1..101 {
        println(when {
            i % 15 == 0 -> "FizzBuzz"
            i % 3 == 0  -> "Fizz"
            i % 5 == 0  -> "Buzz"
            else         -> i.toString()
        })
    }
}
```

### Input Validation

```prismio
fn validateAge(age: Int) -> String = when {
    age < 0   -> "Age cannot be negative"
    age < 18  -> "Must be 18 or older"
    age > 120 -> "Please enter a realistic age"
    else      -> "Valid age"
}
```

### HTTP Status Handling

```prismio
fn handleStatus(code: Int) {
    when code {
        200       -> println("OK")
        201       -> println("Created")
        204       -> println("No Content")
        400       -> println("Bad Request")
        401, 403  -> println("Unauthorized / Forbidden")
        404       -> println("Not Found")
        500, 503  -> println("Server Error")
        else      -> println("Unrecognized status: ${code}")
    }
}
```

---

## See Also

- [Pattern Matching](matching.md) — the `match` expression for advanced structural patterns
- [Loops](loops.md) — for, while, and loop constructs
- [Bindings](bindings.md) — `if` as initializer
- [Functions](../functions/returns.md) — early returns and guard clauses
