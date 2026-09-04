# Evaluation Order

Understanding how Prismio evaluates expressions is fundamental to writing predictable, correct code. This page covers the order of evaluation, short-circuit behaviour in logical operators, the distinction between statements and expressions, and how blocks evaluate to values.

---

## Left-to-Right Evaluation

Within an expression, sub-expressions at the same precedence level are evaluated **left to right**. This applies to:

- Function arguments
- Operands of binary operators
- Elements of array and tuple literals

```prismio
fn sideEffect(label: String, value: Int) -> Int {
    println("Evaluating: ${label}")
    return value
}

let result = sideEffect("a", 1) + sideEffect("b", 2) + sideEffect("c", 3)
// Output:
// Evaluating: a
// Evaluating: b
// Evaluating: c
// result = 6
```

### Function Arguments

Function arguments are evaluated left to right before the function is called:

```prismio
fn add(x: Int, y: Int) -> Int = x + y

let mut counter = 0

fn next() -> Int {
    counter += 1
    return counter
}

let sum = add(next(), next())
// next() called first → counter = 1
// next() called second → counter = 2
// add(1, 2) = 3
println(sum)      // 3
println(counter)  // 2
```

---

## Short-Circuit Evaluation

The logical operators `&&` and `||` use **short-circuit evaluation**: the right operand is only evaluated if necessary to determine the result.

### `&&` (Logical AND)

If the left operand is `false`, the result is already `false` — the right operand is **not evaluated**:

```prismio
fn checkA() -> Bool {
    println("Checking A")
    return false
}

fn checkB() -> Bool {
    println("Checking B")
    return true
}

let result = checkA() && checkB()
// Output: "Checking A"
// "Checking B" is NEVER printed — short-circuited
```

### `||` (Logical OR)

If the left operand is `true`, the result is already `true` — the right operand is **not evaluated**:

```prismio
fn checkA() -> Bool {
    println("Checking A")
    return true
}

fn checkB() -> Bool {
    println("Checking B")
    return false
}

let result = checkA() || checkB()
// Output: "Checking A"
// "Checking B" is NEVER printed — short-circuited
```

### Practical Use of Short-Circuiting

Short-circuit evaluation is commonly used for **null safety guards**:

```prismio
let user: User? = findUser(id: 42)

// Safe: if user is none, the second condition is never evaluated
if user != none && user!.isActive {
    println("Active user found")
}

// Even better with optional chaining
if let u = user, u.isActive {
    println("Active user: ${u.name}")
}
```

And for **performance** — avoiding expensive calls when unnecessary:

```prismio
fn isExpensiveCheck() -> Bool {
    // ... complex computation ...
    return true
}

let quickFail = false

// isExpensiveCheck() is never called — quickFail short-circuits it
if quickFail && isExpensiveCheck() {
    println("Both passed")
}
```

### `??` (Null Coalescing)

The `??` operator also short-circuits: if the left operand is not `none`, the right operand is not evaluated:

```prismio
fn computeDefault() -> Int {
    println("Computing default...")
    return 42
}

let value: Int? = 10
let result = value ?? computeDefault()
// "Computing default..." is NOT printed — value is present
println(result)  // 10
```

---

## Statements vs Expressions

In Prismio, **expressions produce values**; **statements do not**.

### Expressions

An expression is any piece of code that evaluates to a value:

```prismio
42                   // integer literal — value: 42
3.14 + 1.0           // arithmetic — value: 4.14
"hello".toUpperCase()// method call — value: "HELLO"
if x > 0 { x } else { -x }   // if expression — value: |x|
{ let t = a; a = b; b = t; t } // block expression
```

### Statements

A statement performs an action but does not produce a value:

```prismio
let x = 42          // variable declaration — statement
x = 100             // assignment — statement
println("hi")       // expression-statement (expression used for side effect)
return value        // control flow — statement
```

> **Key distinction:** Assignment (`=`) is a **statement** in Prismio. Unlike C or Java, you cannot use an assignment as an expression or in a condition:

```prismio
// ❌ Not allowed in Prismio:
// if (x = getValue()) { ... }

// ✅ Correct Prismio:
let x = getValue()
if x != none { ... }
```

---

## Expressions as Statements

Any expression can be used as a statement (evaluated for its side effects, discarding the value). This is called an **expression statement**:

```prismio
println("Hello")         // expression used as statement
counter.increment()      // method call — return value discarded
[1, 2, 3].map { it * 2 } // pure computation — result discarded (unusual)
```

The compiler may warn if you discard a meaningful return value.

---

## Block Expressions

A **block** (`{ ... }`) is an expression that evaluates to the value of its last expression. Blocks are used for:
- Function bodies
- `if`/`else` branches
- `match` arms
- Loop bodies
- Any place an expression is expected

```prismio
// Block evaluates to the last expression
let x = {
    let a = 10
    let b = 20
    a + b        // last expression — no semicolon needed
}

println(x)   // 30
```

### Blocks in `if` Expressions

```prismio
let score = 85

let grade = if score >= 90 {
    "A"
} else if score >= 80 {
    "B"
} else if score >= 70 {
    "C"
} else {
    "F"
}

println("Grade: ${grade}")   // Grade: B
```

### Blocks in `match` Expressions

```prismio
let day = "Monday"

let isWeekend = match day {
    "Saturday", "Sunday" -> true
    _ -> false
}

println(isWeekend)   // false
```

### Multi-Statement Blocks as Expressions

```prismio
let message = {
    let hour = getCurrentHour()
    if hour < 12 {
        "Good morning"
    } else if hour < 18 {
        "Good afternoon"
    } else {
        "Good evening"
    }
}

println(message)
```

---

## The Unit Value from Blocks

A block that ends with a statement (rather than an expression) evaluates to `Unit`:

```prismio
let result = {
    println("side effect")   // statement — ends with Unit
}

// result: Unit
```

This is typically what happens in `if` branches without `else`:

```prismio
fn greetIf(condition: Bool) {
    if condition {
        println("Hello!")
    }
    // The if expression evaluates to Unit when condition is false
}
```

---

## `if` as an Expression (vs Statement)

When `if` is used as an expression, all branches must produce the same type:

```prismio
// ✅ Both branches are String
let message = if condition { "yes" } else { "no" }

// ❌ Type mismatch — one branch is Int, other is String
// let bad = if condition { 42 } else { "hello" }
```

---

## Eager vs Lazy Evaluation

Prismio uses **eager (strict) evaluation** by default: all arguments and sub-expressions are evaluated before they are used.

```prismio
fn greet(name: String) -> String = "Hello, ${name}!"

let result = greet("World")   // "World" is evaluated first, then passed
```

The exceptions are short-circuit operators (`&&`, `||`, `??`) and closures — closures capture code to run later, not the values immediately:

```prismio
let expensive = fn() -> Int { performHeavyComputation() }

// The computation is NOT done yet — the closure is just stored
let lazyValue: () -> Int = expensive

// Computation happens here, when the closure is invoked
println(lazyValue())
```

---

## Evaluation of Complex Expressions

Understanding evaluation order matters when sub-expressions have side effects. Let's trace through a complex example:

```prismio
let mut n = 1

fn inc() -> Int {
    n += 1
    return n
}

// Evaluated left-to-right:
let result = inc() * inc() + inc()
//            ↑ n=2    ↑ n=3   ↑ n=4
//            2   *   3   + 4
//            = 6 + 4 = 10

println(result)   // 10
println(n)        // 4
```

When in doubt, use intermediate variables to make evaluation order explicit:

```prismio
let a = inc()   // 2 (or whatever current n is)
let b = inc()   // 3
let c = inc()   // 4
let result = a * b + c   // clear and unambiguous
```

---

## Summary

| Concept                  | Behaviour                                                        |
|--------------------------|------------------------------------------------------------------|
| Binary operator order    | Left operand evaluated before right                             |
| Function argument order  | Arguments evaluated left-to-right                               |
| `&&` short-circuit       | Right side skipped if left is `false`                           |
| `\|\|` short-circuit     | Right side skipped if left is `true`                            |
| `??` short-circuit       | Right side skipped if left is not `none`                        |
| Block value              | Value of the last expression in the block                       |
| Statement value          | Statements produce `Unit` (no value)                            |
| Assignment               | A statement, not an expression — cannot be used in conditions   |
| Closures                 | Lazily executed — body evaluated when invoked, not when defined |

---

## See Also

- [Operators](./operators.md)
- [Literals](./literals.md)
- [Control Flow](../statements/control_flow.md)
- [Functions](../functions/signatures.md)
