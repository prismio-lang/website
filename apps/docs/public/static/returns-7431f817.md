# Return Values

A function communicates results back to its caller through **return values**. Prismio supports multiple return styles — explicit, implicit, early, and via tuples — and has special types for functions that return nothing (`Unit`) or never return at all (`Never`).

---

## Explicit Return

Use the `return` keyword to immediately exit a function and send a value back to the caller.

```prismio
fn add(a: Int, b: Int) -> Int {
    return a + b
}

fn max(a: Int, b: Int) -> Int {
    if a > b {
        return a
    }
    return b
}
```

`return` can appear anywhere inside a function body. Once hit, execution of the function stops immediately.

---

## Implicit Return (Last Expression)

In Prismio, the **last expression** in a block is automatically used as the return value. The `return` keyword is optional for the final value.

```prismio
fn multiply(a: Int, b: Int) -> Int {
    a * b   // no `return` needed — implicitly returned
}

fn greet(name: String) -> String {
    let msg = "Hello, ${name}!"
    msg   // the last expression is returned
}
```

With expression body (`=`):

```prismio
fn square(n: Int) -> Int = n * n
fn isPositive(n: Int) -> Bool = n > 0
fn abs(n: Int) -> Int = if n >= 0 { n } else { -n }
```

### Implicit Return in Blocks

The last expression of any block, including nested blocks, is its value:

```prismio
fn classify(n: Int) -> String {
    if n > 0 {
        "positive"       // ← implicit return value when n > 0
    } else if n < 0 {
        "negative"       // ← implicit return value when n < 0
    } else {
        "zero"           // ← implicit return value when n == 0
    }
}

println(classify(10))   // positive
println(classify(-3))   // negative
println(classify(0))    // zero
```

---

## Early Returns

Early returns exit a function before reaching the end of its body. They are most commonly used for **guard clauses** — handling invalid input or edge cases upfront.

```prismio
fn divide(a: Float, b: Float) -> Float {
    if b == 0.0 {
        println("Cannot divide by zero")
        return 0.0   // early return
    }
    a / b
}
```

```prismio
fn findUser(id: Int) -> String {
    if id < 0 {
        return "Invalid ID"
    }
    if id == 0 {
        return "Admin"
    }
    return lookupDatabase(id)
}
```

Early returns make code easier to read by avoiding deep nesting:

```prismio
// ✅ Flat and readable with early returns:
fn processPayment(amount: Float, balance: Float, accountActive: Bool) -> String {
    if !accountActive {
        return "Account is inactive"
    }
    if amount <= 0.0 {
        return "Invalid amount"
    }
    if amount > balance {
        return "Insufficient funds"
    }

    let newBalance = balance - amount
    return "Payment successful. New balance: ${newBalance}"
}
```

---

## Multiple Return Values via Tuples

Prismio functions can return multiple values by returning a **tuple**. The caller can destructure the result directly.

```prismio
fn minMax(nums: [Int]) -> (Int, Int) {
    let mut min = nums[0]
    let mut max = nums[0]

    for n in nums {
        if n < min { min = n }
        if n > max { max = n }
    }

    return (min, max)
}

let (lo, hi) = minMax([3, 1, 4, 1, 5, 9, 2, 6])
println("Min: ${lo}, Max: ${hi}")  // Min: 1, Max: 9
```

### Returning Success + Error Info

```prismio
fn parseAge(input: String) -> (Bool, Int, String) {
    let n = input.toIntOrNull()

    if n == null {
        return (false, -1, "Not a number")
    }
    if n < 0 {
        return (false, -1, "Age cannot be negative")
    }
    if n > 150 {
        return (false, -1, "Age too large")
    }

    return (true, n, "")
}

let (ok, age, error) = parseAge("25")
if ok {
    println("Age is ${age}")
} else {
    println("Error: ${error}")
}
```

### Returning Statistics

```prismio
fn statistics(data: [Float]) -> (Float, Float, Float) {
    let sum = data.reduce(0.0, { acc, x -> acc + x })
    let mean = sum / data.size.toFloat()

    let variance = data.map { x -> (x - mean) * (x - mean) }
                       .reduce(0.0, { acc, x -> acc + x }) / data.size.toFloat()
    let stdDev = variance.sqrt()

    return (mean, variance, stdDev)
}

let (mean, variance, stdDev) = statistics([2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0])
println("Mean: ${mean}, Variance: ${variance}, StdDev: ${stdDev}")
```

### Swapping Values

```prismio
fn swap<T>(a: T, b: T) -> (T, T) = (b, a)

let (x, y) = swap(10, 20)
println("x=${x}, y=${y}")  // x=20, y=10
```

---

## Unit Return Type

A function that performs side effects and returns no meaningful value has return type `Unit`. `Unit` is similar to `void` in other languages, but it's a real type with exactly one value (also called `Unit`).

```prismio
fn printBanner(title: String) {
    println("╔══════════════════════════╗")
    println("║ ${title.padEnd(26)} ║")
    println("╚══════════════════════════╝")
}
```

The return type can be explicitly written as `-> Unit`, which is equivalent:

```prismio
fn logMessage(msg: String) -> Unit {
    println("[LOG] ${msg}")
}
```

### Unit as a Value

Since `Unit` is a real type, you can bind it or use it in generic contexts:

```prismio
let result: Unit = println("This returns Unit")
// result is the Unit value — not particularly useful, but valid
```

Functions returning `Unit` can also use `return` without a value to exit early:

```prismio
fn printPositive(n: Int) -> Unit {
    if n <= 0 {
        return   // ← early exit, no value needed
    }
    println("Positive: ${n}")
}
```

---

## Never Type

`Never` is the return type of functions that **never return** to the caller. A function returns `Never` if it always:

- panics / throws an unrecoverable error
- exits the program
- runs an infinite loop

```prismio
fn panic(message: String) -> Never {
    println("[PANIC] ${message}")
    exit(1)
}

fn exitWithCode(code: Int) -> Never {
    println("Exiting with code ${code}")
    exit(code)
}

fn infiniteLoop() -> Never {
    loop {
        processEvents()
    }
}
```

### Why `Never` is Useful

Because `Never` is the **bottom type** (a subtype of every type), a function returning `Never` can be used in any branch without type mismatch:

```prismio
fn getConfig(key: String) -> String {
    return configMap[key] ?: panic("Missing required config key: ${key}")
    //                        ↑ this returns Never, compatible with String branch
}
```

```prismio
fn safeDivide(a: Int, b: Int) -> Int {
    if b == 0 {
        panic("Division by zero")  // Never — compiler knows this branch doesn't continue
    }
    return a / b
}
```

### `Never` vs `Unit`

| | `Unit` | `Never` |
|---|---|---|
| The function returns? | Yes (with no meaningful value) | No — it never returns |
| Can use in expressions | Yes | Yes (as any type) |
| Example | `println("hi")` | `panic("...")`, `exit(0)` |

---

## Return Type Inference

For expression-body functions, Prismio can infer the return type:

> 🚧 **Coming Soon** – Full return type inference for block-body functions is planned but not yet implemented for all cases.

```prismio
// Return type inferred for expression bodies:
fn double(n: Int) = n * 2           // inferred: Int
fn hello() = "Hello, world!"        // inferred: String
fn check(n: Int) = n > 0            // inferred: Bool
```

For block-body functions, it is recommended (and sometimes required) to explicitly annotate the return type:

```prismio
// Always prefer explicit return type for block-body functions:
fn process(input: String) -> String {
    let trimmed = input.trim()
    trimmed.toUpperCase()
}
```

---

## Practical Examples

### Returning from match

```prismio
fn describeSeason(month: Int) -> String {
    return match month {
        12, 1, 2 -> "Winter"
        3, 4, 5  -> "Spring"
        6, 7, 8  -> "Summer"
        9, 10, 11 -> "Autumn"
        _         -> "Invalid month"
    }
}

println(describeSeason(7))   // Summer
println(describeSeason(11))  // Autumn
```

### Chain of Early Returns

```prismio
fn registerUser(username: String, email: String, password: String) -> String {
    if username.length < 3 {
        return "Username must be at least 3 characters"
    }
    if !email.contains("@") {
        return "Invalid email address"
    }
    if password.length < 8 {
        return "Password must be at least 8 characters"
    }
    if usernameExists(username) {
        return "Username already taken"
    }

    createUser(username, email, password)
    return "Registration successful"
}
```

### Fibonacci with Implicit Return

```prismio
fn fibonacci(n: Int) -> Int {
    if n <= 0 { 0 }
    else if n == 1 { 1 }
    else { fibonacci(n - 1) + fibonacci(n - 2) }
}

for i in 0..10 {
    print("${fibonacci(i)} ")
}
// 0 1 1 2 3 5 8 13 21 34
```

---

## See Also

- [Function Signatures](signatures.md) — how to declare function return types
- [Parameters](parameters.md) — what functions accept
- [Closures](closures.md) — anonymous functions and their return types
- [Error Handling](../../advanced/errors.md) — Result types and recoverable errors
