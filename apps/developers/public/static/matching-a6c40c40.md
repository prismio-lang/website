# Pattern Matching

Pattern matching is one of Prismio's most powerful features. The `match` expression lets you compare a value against a series of **patterns** and execute the branch whose pattern matches. It is exhaustive — the compiler ensures every possible value is handled.

---

## Basic `match` Syntax

```prismio
match value {
    pattern1 -> expression1
    pattern2 -> expression2
    ...
    _ -> defaultExpression
}
```

The `_` wildcard pattern matches anything and is used as the catch-all (default) branch.

---

## Matching Literals

### Integer Literals

```prismio
let code = 404

match code {
    200 -> println("OK")
    201 -> println("Created")
    400 -> println("Bad Request")
    404 -> println("Not Found")
    500 -> println("Internal Server Error")
    _   -> println("Unknown status: ${code}")
}
```

### String Literals

```prismio
let command = "quit"

match command {
    "help"  -> printHelp()
    "quit"  -> exitApp()
    "start" -> startApp()
    _       -> println("Unknown command: ${command}")
}
```

### Boolean Literals

```prismio
let isLoggedIn = true

match isLoggedIn {
    true  -> showDashboard()
    false -> showLoginPage()
}
```

### Character Literals

```prismio
let ch = 'y'

match ch {
    'y', 'Y' -> println("Yes")
    'n', 'N' -> println("No")
    _        -> println("Please enter y or n")
}
```

---

## Multiple Patterns per Arm

Separate multiple patterns with `,` to have them share a branch:

```prismio
let day = 6

let type = match day {
    1, 2, 3, 4, 5 -> "Weekday"
    6, 7           -> "Weekend"
    _              -> "Invalid day"
}

println(type)  // Weekend
```

```prismio
let vowelCheck = match letter {
    'a', 'e', 'i', 'o', 'u',
    'A', 'E', 'I', 'O', 'U' -> "vowel"
    _                        -> "consonant"
}
```

---

## Matching Ranges

Prismio supports range patterns to match a value within an inclusive or exclusive range.

### Inclusive Ranges (`..=` or `..`)

```prismio
let score = 85

let grade = match score {
    90..=100 -> "A"
    80..=89  -> "B"
    70..=79  -> "C"
    60..=69  -> "D"
    0..=59   -> "F"
    _        -> "Invalid score"
}

println(grade)  // B
```

### Character Ranges

```prismio
let ch = 'm'

let kind = match ch {
    'a'..='z' -> "lowercase letter"
    'A'..='Z' -> "uppercase letter"
    '0'..='9' -> "digit"
    _         -> "other character"
}

println(kind)  // lowercase letter
```

### Integer Classification

```prismio
fn classify(n: Int) -> String = match n {
    Int.MIN..=-1 -> "negative"
    0            -> "zero"
    1..=9        -> "single digit"
    10..=99      -> "double digit"
    _            -> "large number"
}

println(classify(-5))   // negative
println(classify(0))    // zero
println(classify(7))    // single digit
println(classify(42))   // double digit
println(classify(1000)) // large number
```

---

## Match Guards

A match guard adds an extra condition to a pattern arm using `if`. The arm only matches if both the pattern and the guard condition are true.

```prismio
let n = 15

match n {
    x if x % 15 == 0 -> println("FizzBuzz")
    x if x % 3 == 0  -> println("Fizz")
    x if x % 5 == 0  -> println("Buzz")
    x                 -> println(x)
}
// FizzBuzz
```

### Guards with Captured Variables

```prismio
let pair = (4, 0)

match pair {
    (x, y) if x == y     -> println("Equal: ${x}")
    (x, y) if y == 0     -> println("Division by zero! x=${x}")
    (x, y) if x > y      -> println("${x} > ${y}")
    (x, y)               -> println("${x} <= ${y}")
}
// Division by zero! x=4
```

### Multiple Guards

```prismio
let age = 17
let hasParentalConsent = true

match age {
    x if x >= 18             -> println("Allowed (adult)")
    x if hasParentalConsent  -> println("Allowed (with consent)")
    _                        -> println("Not allowed")
}
// Allowed (with consent)
```

---

## Destructuring in Match

One of `match`'s most powerful features is that patterns can **destructure** compound values.

### Tuple Destructuring

```prismio
let point = (3, -1)

match point {
    (0, 0)       -> println("Origin")
    (x, 0)       -> println("On x-axis at ${x}")
    (0, y)       -> println("On y-axis at ${y}")
    (x, y) if x == y -> println("On diagonal at ${x}")
    (x, y)       -> println("Point at (${x}, ${y})")
}
// Point at (3, -1)
```

### Nested Tuple Destructuring

```prismio
let segment = ((0, 0), (3, 4))

match segment {
    ((x1, y1), (x2, y2)) -> {
        let dx = x2 - x1
        let dy = y2 - y1
        println("Segment from (${x1},${y1}) to (${x2},${y2})")
        println("Delta: (${dx}, ${dy})")
    }
}
```

### Struct/Record Destructuring

> 🚧 **Coming Soon** – Struct pattern destructuring is planned but not yet implemented.

```prismio
// Future syntax (planned):
match user {
    User { name, age } if age >= 18 -> println("Adult user: ${name}")
    User { name, age }              -> println("Minor user: ${name}")
}
```

### Enum Variant Destructuring

> 🚧 **Coming Soon** – Enum variants with associated data are planned but not yet implemented.

```prismio
// Future syntax (planned):
match result {
    Ok(value)  -> println("Success: ${value}")
    Err(msg)   -> println("Error: ${msg}")
}
```

---

## `match` as an Expression

`match` is an expression — it produces a value. Assign it, return it, or use it anywhere a value is expected.

```prismio
let x = 7

let description = match x {
    0    -> "zero"
    1    -> "one"
    2    -> "two"
    3..=9 -> "single digit (3-9)"
    _    -> "large"
}

println(description)  // single digit (3-9)
```

Using match in a function:

```prismio
fn httpMessage(code: Int) -> String = match code {
    200 -> "OK"
    201 -> "Created"
    204 -> "No Content"
    301 -> "Moved Permanently"
    302 -> "Found"
    400 -> "Bad Request"
    401 -> "Unauthorized"
    403 -> "Forbidden"
    404 -> "Not Found"
    500 -> "Internal Server Error"
    503 -> "Service Unavailable"
    _   -> "Unknown Status"
}
```

Returning match from a function:

```prismio
fn classify(n: Int) -> String {
    return match n {
        x if x < 0  -> "negative"
        0            -> "zero"
        x if x % 2 == 0 -> "positive even"
        _            -> "positive odd"
    }
}
```

---

## Exhaustiveness Checking

The Prismio compiler performs **exhaustiveness analysis** on every `match` expression. If there's any value the match doesn't handle, it's a compile error — not a runtime crash.

```prismio
let b: Bool = true

match b {
    true -> println("yes")
    // ❌ Error: non-exhaustive match — `false` not covered
}
```

```prismio
match b {
    true  -> println("yes")
    false -> println("no")
    // ✅ All cases covered — no wildcard needed
}
```

For open-ended types like `Int` or `String`, you must include a wildcard `_` to cover all remaining cases:

```prismio
let n = 42

match n {
    1 -> println("one")
    2 -> println("two")
    _ -> println("something else")  // ✅ required
}
```

---

## Binding Variables in Patterns

Capture the matched value with a name in the pattern:

```prismio
let n = 42

match n {
    0         -> println("zero")
    x if x < 0 -> println("negative: ${x}")
    x          -> println("positive: ${x}")
}
// positive: 42
```

Using `@` to bind while also matching a range:

> 🚧 **Coming Soon** – `@` binding patterns are planned but not yet implemented.

```prismio
// Future syntax (planned):
match score {
    x @ 90..=100 -> println("A grade with score ${x}")
    x @ 80..=89  -> println("B grade with score ${x}")
    _            -> println("Below B")
}
```

---

## Block Bodies in Match Arms

When a match arm requires multiple statements, use a block:

```prismio
let operation = "transfer"
let amount = 500.0

match operation {
    "deposit" -> {
        println("Processing deposit...")
        balance += amount
        println("New balance: ${balance}")
    }
    "withdraw" -> {
        if amount > balance {
            println("Insufficient funds")
        } else {
            balance -= amount
            println("Withdrew ${amount}. Balance: ${balance}")
        }
    }
    "transfer" -> {
        println("Initiating transfer of ${amount}")
        processTransfer(amount)
    }
    _ -> println("Unknown operation: ${operation}")
}
```

---

## Practical Examples

### Parsing User Input

```prismio
fn parseCommand(input: String) -> String = match input.trim().toLower() {
    "help", "h", "?"  -> showHelp()
    "quit", "q", "exit" -> exitApp()
    "clear", "cls"    -> clearScreen()
    ""                -> ""   // ignore empty input
    cmd               -> "Unknown command: '${cmd}'. Type 'help' for options."
}
```

### Days in a Month

```prismio
fn daysInMonth(month: Int, year: Int) -> Int = match month {
    1, 3, 5, 7, 8, 10, 12 -> 31
    4, 6, 9, 11             -> 30
    2 -> if (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 { 29 } else { 28 }
    _  -> -1  // invalid month
}

println(daysInMonth(2, 2024))   // 29 (leap year)
println(daysInMonth(2, 2023))   // 28
println(daysInMonth(7, 2024))   // 31
```

### Traffic Light State Machine

```prismio
let mut light = "red"

loop {
    match light {
        "red"    -> {
            println("Stop!")
            sleep(3000)
            light = "green"
        }
        "green"  -> {
            println("Go!")
            sleep(2500)
            light = "yellow"
        }
        "yellow" -> {
            println("Caution!")
            sleep(500)
            light = "red"
        }
        _        -> break
    }
}
```

---

## See Also

- [Control Flow](control_flow.md) — `if`, `when`, and branching
- [Bindings](bindings.md) — destructuring in `let` statements
- [Types](../types/primitives.md) — types that can be matched
- [Enums](../types/enums.md) — algebraic data types for match
