# Common Pitfalls & Gotchas

Every language has its sharp edges. This guide documents the most common mistakes new (and experienced) Prismio developers make, explains exactly what goes wrong, and shows you how to fix it.

---

## 1. Forgetting `mut` on Mutable Variables

Prismio variables are **immutable by default**. If you try to modify a variable declared with `let`, you'll get a compile-time error.

### Wrong

```prismio
fn main() {
    let count = 0
    count = count + 1  // Error!
    println(count)
}
```

### Error

```
error[E0001]: cannot assign to immutable variable `count`
 --> main.prismio:3:5
  |
2 |     let count = 0
  |         ----- help: make this binding mutable: `let mut count`
3 |     count = count + 1
  |     ^^^^^^^^^^^^^^^^^ assignment to immutable variable
```

### Fix

```prismio
fn main() {
    let mut count = 0
    count = count + 1
    println(count)  // 1
}
```

**Rule of thumb:** Only add `mut` when the variable genuinely needs to change. If you're adding `mut` reflexively, reconsider whether a reassignment is even needed.

---

## 2. Ownership Errors When Passing Variables to Functions

Prismio has an ownership model: when you pass a value to a function, ownership transfers to that function. The original binding becomes invalid.

### Wrong

```prismio
fn printName(name: String) {
    println(name)
}

fn main() {
    let name = "Alice"
    printName(name)
    println(name)  // Error! `name` was moved into printName
}
```

### Error

```
error[E0002]: use of moved value `name`
 --> main.prismio:8:13
  |
6 |     printName(name)
  |               ---- value moved here
7 |     println(name)
  |             ^^^^ value used after move
```

### Fix — Option A: Borrow with `&`

Pass a reference instead of the value. The function borrows the data without taking ownership.

```prismio
fn printName(name: &String) {
    println(name)
}

fn main() {
    let name = "Alice"
    printName(&name)  // lend a reference
    println(name)     // still valid — we only lent it
}
```

### Fix — Option B: Clone the Value

If the function genuinely needs its own copy:

```prismio
fn main() {
    let name = "Alice"
    printName(name.clone())  // give a copy
    println(name)            // original is still valid
}
```

**Prefer borrowing over cloning** — cloning allocates and copies, which has a runtime cost.

---

## 3. Integer Overflow in Debug vs. Release

In **debug builds**, integer overflow causes a runtime panic with a helpful message. In **release builds**, it silently wraps around (two's complement). This means code that crashes in debug might silently produce wrong answers in production.

### Wrong

```prismio
fn main() {
    let max: Int = 2147483647  // i32::MAX
    let result = max + 1
    println(result)
}
```

### Debug Output

```
thread panicked at 'integer overflow: 2147483647 + 1'
 --> main.prismio:3:18
```

### Release Output (Silent Bug)

```
-2147483648
```

### Fix — Use Checked Arithmetic

```prismio
fn safeAdd(a: Int, b: Int) -> Int? {
    return a.checkedAdd(b)  // returns null on overflow
}

fn main() {
    let result = safeAdd(2147483647, 1)
    match result {
        null      => println("Overflow!")
        Some(n)   => println(n)
    }
}
```

**Rule of thumb:** If you do arithmetic on values from external input or that could be large, use checked operations or a wider integer type (`Int64`).

---

## 4. Off-by-One in Ranges: `..` vs `..=`

Prismio has two range operators:
- `a..b` — exclusive end (does **not** include `b`)
- `a..=b` — inclusive end (includes `b`)

This is a very common source of off-by-one bugs.

### Wrong

```prismio
fn main() {
    // Intended to print 1 through 5
    for i in 1..5 {
        println(i)
    }
}
```

### Output (not what you expected)

```
1
2
3
4
```

`5` is never printed because `..` is exclusive.

### Fix

```prismio
fn main() {
    // Inclusive range — prints 1, 2, 3, 4, 5
    for i in 1..=5 {
        println(i)
    }
}
```

### Quick Reference

| Range | Meaning | Iterates |
|---|---|---|
| `0..5` | exclusive | 0, 1, 2, 3, 4 |
| `0..=5` | inclusive | 0, 1, 2, 3, 4, 5 |

**Tip:** Use `0..array.length` (exclusive) to iterate array indices safely.

---

## 5. Variable Shadowing Hiding Bugs

Prismio allows **shadowing** — declaring a new variable with the same name as an existing one. This is sometimes useful (e.g., converting a type), but it can silently hide bugs when you intended to mutate a variable instead.

### Wrong (Silent Bug)

```prismio
fn main() {
    let mut total = 0
    let items = [10, 20, 30]

    for item in items {
        let total = total + item  // Shadows the outer `total`!
        // This `total` is local to the loop body and discarded
    }

    println(total)  // Prints 0 — nothing was accumulated!
}
```

### Why It Compiles

Shadowing is legal. The inner `let total` creates a new, separate variable. The outer `total` is never modified.

### Fix

```prismio
fn main() {
    let mut total = 0
    let items = [10, 20, 30]

    for item in items {
        total = total + item  // Assignment to outer `total` (no `let`)
    }

    println(total)  // 60
}
```

### When Shadowing Is Intentional

Shadowing is useful for type conversion or intermediate transformations:

```prismio
let input = readLine()         // String
let input = input.trim()       // Still String, trimmed
let input = input.parseInt()   // Now an Int
```

This is idiomatic when the value flows through transformations and the old form is no longer needed.

---

## 6. Import Order and Circular Imports

### Circular Imports

If module A imports module B, and module B imports module A, you have a circular dependency. The Prismio compiler will reject this.

### Wrong

```prismio
// a.prismio
import b.functionFromB

pub fn functionFromA() -> Int {
    return functionFromB() + 1
}
```

```prismio
// b.prismio
import a.functionFromA  // Circular!

pub fn functionFromB() -> Int {
    return functionFromA() + 1
}
```

### Error

```
error[E0010]: circular import detected
  --> a.prismio:1:1
   |
   a.prismio -> b.prismio -> a.prismio
```

### Fix — Extract Shared Code into a Third Module

```prismio
// shared.prismio — contains the shared logic
pub fn baseValue() -> Int { return 42 }

// a.prismio
import shared.baseValue
pub fn functionFromA() -> Int { return baseValue() + 1 }

// b.prismio
import shared.baseValue
pub fn functionFromB() -> Int { return baseValue() + 2 }
```

---

## 7. Unused Variable Warnings

The Prismio compiler warns about variables that are declared but never used. These are often signs of bugs (you forgot to use the value) or dead code.

### Wrong

```prismio
fn main() {
    let result = expensiveComputation()
    println("Done")
    // `result` is never used — compiler warns
}
```

### Warning

```
warning[W0001]: unused variable `result`
 --> main.prismio:2:9
  |
2 |     let result = expensiveComputation()
  |         ^^^^^^ variable declared but never used
  |
  = help: if intentional, prefix with `_`: `let _result = ...`
```

### Fix — Actually Use the Variable

```prismio
fn main() {
    let result = expensiveComputation()
    println("Result: " + result.toString())
}
```

### Fix — Suppress with Underscore (When Intentional)

If you must call a function for its side effect and genuinely don't need the result:

```prismio
fn main() {
    let _ = expensiveComputation()  // explicitly discarded
    println("Done")
}
```

Or prefix the name with `_`:

```prismio
let _tempBuffer = allocateBuffer(size)
```

---

## 8. Type Inference Surprises

Prismio's type inference is powerful, but it can produce unexpected types when you're not explicit.

### Wrong — Unexpected Float vs. Int

```prismio
fn main() {
    let ratio = 7 / 2       // Both literals are Int → result is Int
    println(ratio)          // Prints 3, not 3.5!
}
```

### Why It Happens

When both operands are integer literals, the division is integer division — the fractional part is truncated.

### Fix

```prismio
fn main() {
    let ratio = 7.0 / 2.0   // Float literals → Float division
    println(ratio)           // 3.5

    // Or cast explicitly
    let a = 7
    let b = 2
    let ratio2 = a.toFloat() / b.toFloat()
    println(ratio2)          // 3.5
}
```

### Wrong — Inferred Array Type

```prismio
let values = []  // Error: cannot infer type of empty array
```

### Error

```
error[E0020]: cannot infer type of empty array literal
 --> main.prismio:1:14
  |
1 |     let values = []
  |                  ^^ type annotation required
  |
  = help: try: `let values: [Int] = []`
```

### Fix

```prismio
let values: [Int] = []       // explicit type annotation
let values = [Int]()         // or constructor syntax
```

---

## Summary Table

| Pitfall | Symptom | Fix |
|---|---|---|
| Missing `mut` | Compile error on assignment | Add `let mut` |
| Moved value used after move | Compile error on use | Borrow with `&` or `.clone()` |
| Integer overflow | Wrong results silently in release | Use checked arithmetic |
| `..` vs `..=` | Off-by-one in loops | Use `..=` for inclusive end |
| Accidental shadowing | Logic bug, 0 accumulated | Use `=` not `let` inside loops |
| Circular imports | Compile error | Extract shared module |
| Unused variables | Compiler warning | Use it or prefix with `_` |
| Integer vs Float division | Truncated result | Use float literals or `.toFloat()` |

---

*See also: [Idioms & Best Practices](/guides/idioms) · [Error Handling Patterns](/guides/error_handling) · [Keywords Reference](/reference/keywords)*
