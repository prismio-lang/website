# Loops

Prismio offers several looping constructs, each suited to different use cases. Whether you're iterating over a collection, repeating until a condition is false, or running an infinite loop controlled by `break`, Prismio has you covered.

---

## `for` — For-Each Loop

The most common loop in Prismio iterates over any **iterable** value (arrays, ranges, strings, etc.).

```prismio
let fruits = ["apple", "banana", "cherry"]

for fruit in fruits {
    println(fruit)
}
// apple
// banana
// cherry
```

### Iterating with Index

Use `.withIndex()` to get both the element and its index:

```prismio
let languages = ["Prismio", "Kotlin", "Rust", "Swift"]

for (index, lang) in languages.withIndex() {
    println("${index}: ${lang}")
}
// 0: Prismio
// 1: Kotlin
// 2: Rust
// 3: Swift
```

### Iterating Over Strings

Strings are iterable — you can loop character by character:

```prismio
let word = "Hello"

for ch in word {
    print("${ch} ")
}
// H e l l o
```

---

## Range-Based `for` Loop

Ranges are first-class values in Prismio. Use them directly in `for` loops.

### Exclusive Range (`..`)

The upper bound is **not** included:

```prismio
for i in 0..5 {
    print("${i} ")
}
// 0 1 2 3 4
```

### Inclusive Range (`..=`)

The upper bound **is** included:

```prismio
for i in 1..=5 {
    print("${i} ")
}
// 1 2 3 4 5
```

### Counting Down

Use `.reversed()` on a range to iterate in reverse:

```prismio
for i in (1..=10).reversed() {
    print("${i} ")
}
// 10 9 8 7 6 5 4 3 2 1
```

### Stepping Through a Range

> 🚧 **Coming Soon** – The `.step(n)` modifier for ranges is planned but not yet implemented.

```prismio
// Future syntax (planned):
for i in (0..20).step(2) {
    print("${i} ")
}
// 0 2 4 6 8 10 12 14 16 18
```

### Practical Range Example — Multiplication Table

```prismio
fn main() {
    for i in 1..=10 {
        for j in 1..=10 {
            print("${i * j}\t")
        }
        println()
    }
}
```

---

## `while` Loop

The `while` loop repeats a block as long as its condition is `true`.

```prismio
let mut count = 0

while count < 5 {
    println("count = ${count}")
    count += 1
}
// count = 0
// count = 1
// count = 2
// count = 3
// count = 4
```

### `while` for User Input

```prismio
let mut input = ""

while input != "quit" {
    input = readLine()
    println("You entered: ${input}")
}
println("Exiting.")
```

### `while` with Complex Conditions

```prismio
let mut x = 256

while x > 1 {
    x /= 2
    println(x)
}
// 128, 64, 32, 16, 8, 4, 2, 1
```

### `do-while` Style

Prismio doesn't have a built-in `do-while`, but you can achieve the same pattern with `loop` + `break`:

```prismio
loop {
    let input = readLine()
    println("Got: ${input}")

    if input == "stop" {
        break
    }
}
```

---

## `loop` — Infinite Loop

`loop` runs forever until a `break` statement is encountered. It's the right tool when the termination condition is complex, or when you always want to execute the body at least once.

```prismio
loop {
    println("This runs forever")
}
```

A real-world game loop:

```prismio
loop {
    processInput()
    updateState()
    render()

    if shouldQuit() {
        break
    }
}
```

### REPL-style Loop

```prismio
loop {
    print("> ")
    let line = readLine().trim()

    if line == "exit" || line == "quit" {
        println("Goodbye!")
        break
    }

    if line.isNotEmpty() {
        eval(line)
    }
}
```

---

## `break` — Exiting a Loop

`break` immediately exits the nearest enclosing loop.

```prismio
for i in 0..100 {
    if i == 5 {
        break
    }
    println(i)
}
// 0 1 2 3 4
```

```prismio
let mut found = false
let haystack = [4, 7, 2, 9, 1, 5]
let needle = 9

for item in haystack {
    if item == needle {
        found = true
        break
    }
}

println(if found { "Found!" } else { "Not found." })
```

---

## `continue` — Skipping Iterations

`continue` skips the remainder of the current iteration and moves to the next.

```prismio
for i in 0..10 {
    if i % 2 == 0 {
        continue   // skip even numbers
    }
    print("${i} ")
}
// 1 3 5 7 9
```

### Skipping Blank Lines

```prismio
let lines = ["Hello", "", "World", "  ", "!"]

for line in lines {
    if line.trim().isEmpty() {
        continue
    }
    println(line)
}
// Hello
// World
// !
```

---

## Loop Labels

When working with **nested loops**, `break` and `continue` affect only the innermost loop by default. **Loop labels** let you target an outer loop.

Labels are written as `@labelName` before the loop keyword:

```prismio
@outer for i in 0..5 {
    for j in 0..5 {
        if i + j == 6 {
            break @outer   // exits the outer loop entirely
        }
        print("(${i},${j}) ")
    }
}
println()
// Stops as soon as i+j == 6
```

### `continue` with Labels

```prismio
@outer for i in 0..4 {
    for j in 0..4 {
        if j == 2 {
            continue @outer  // skip rest of outer iteration
        }
        print("(${i},${j}) ")
    }
}
// (0,0) (0,1) (1,0) (1,1) (2,0) (2,1) (3,0) (3,1)
```

### Matrix Search with Labels

```prismio
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

let target = 5
let mut row = -1
let mut col = -1

@search for i in 0..matrix.size {
    for j in 0..matrix[i].size {
        if matrix[i][j] == target {
            row = i
            col = j
            break @search
        }
    }
}

if row != -1 {
    println("Found ${target} at row=${row}, col=${col}")
}
// Found 5 at row=1, col=1
```

---

## Returning Values from `loop`

A `loop` expression can **return a value** by passing it to `break`. This is particularly useful for retry patterns.

```prismio
let mut attempts = 0

let result = loop {
    attempts += 1
    let response = tryFetchData()

    if response.isSuccess {
        break response.data   // the loop expression evaluates to this
    }

    if attempts >= 3 {
        break null
    }
}

if result != null {
    println("Got data: ${result}")
} else {
    println("Failed after ${attempts} attempts")
}
```

### Parsing Until Valid

```prismio
let number = loop {
    print("Enter a positive number: ")
    let input = readLine()
    let n = input.toIntOrNull()

    if n != null && n > 0 {
        break n   // return the valid number
    }

    println("Invalid input, try again.")
}

println("You entered: ${number}")
```

### Using Loop Value in Binding

```prismio
let first_even = loop {
    let n = nextRandom()
    if n % 2 == 0 {
        break n
    }
}

println("First even: ${first_even}")
```

---

## Loop Patterns and Best Practices

### Accumulating with a `for` Loop

```prismio
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
let mut sum = 0

for n in numbers {
    sum += n
}

println("Sum: ${sum}")  // 55
```

### Building a Collection

```prismio
let mut squares = [Int]()

for i in 1..=10 {
    squares.add(i * i)
}

println(squares)  // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

### Collatz Sequence

```prismio
fn collatz(n: Int) {
    let mut x = n
    let mut steps = 0

    while x != 1 {
        print("${x} -> ")
        x = if x % 2 == 0 { x / 2 } else { x * 3 + 1 }
        steps += 1
    }

    println("1 (${steps} steps)")
}

collatz(27)
```

### Prime Sieve (Nested Loops with `continue`)

```prismio
fn primesUpTo(limit: Int) -> [Int] {
    let mut primes = [Int]()

    @outer for n in 2..=limit {
        for p in primes {
            if p * p > n {
                break
            }
            if n % p == 0 {
                continue @outer
            }
        }
        primes.add(n)
    }

    return primes
}

println(primesUpTo(50))
// [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
```

---

## Summary

| Construct | Use Case |
|---|---|
| `for item in collection` | Iterating a collection or sequence |
| `for i in 0..n` | Index-based or range iteration |
| `while condition` | Repeat while condition holds |
| `loop` | Infinite loop; exit with `break` |
| `break` | Exit the current (or labeled) loop |
| `continue` | Skip to next iteration |
| `break value` | Exit `loop` and return a value |
| `@label` | Target a specific outer loop with `break`/`continue` |

---

## See Also

- [Control Flow](control_flow.md) — `if`, `when`, and branching expressions
- [Closures](../functions/closures.md) — `map`, `filter`, `forEach` as alternatives to loops
- [Ranges](../types/ranges.md) — range types and operations
- [Collections](../types/collections.md) — arrays, lists, and other iterables
