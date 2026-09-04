# Closures

A **closure** is an anonymous function that can capture variables from its enclosing scope. Closures are first-class values in Prismio — you can store them in variables, pass them as arguments, and return them from functions.

---

## Lambda Syntax

The basic lambda (closure) syntax uses curly braces `{ }` with parameters before `->`:

```prismio
{ parameter -> expression }
```

### Simple Lambda

```prismio
val double = { x: Int -> x * 2 }
println(double(5))   // 10
println(double(21))  // 42
```

### Inferred Parameter Types

When the type can be inferred from context, you can omit the type annotation:

```prismio
val square = { x -> x * x }        // type inferred from usage
val negate = { b: Bool -> !b }
val greet  = { name -> "Hello, ${name}!" }
```

### Multi-Parameter Lambdas

```prismio
val add = { a: Int, b: Int -> a + b }
val multiply = { a: Int, b: Int -> a * b }

println(add(3, 4))       // 7
println(multiply(3, 4))  // 12
```

### Multi-Line Lambdas

Use multiple statements in a lambda body; the last expression is the return value:

```prismio
val processText = { input: String ->
    let trimmed = input.trim()
    let lower = trimmed.toLowerCase()
    lower.replace(" ", "_")
}

println(processText("  Hello World  "))  // hello_world
```

### Lambda with No Parameters

```prismio
val sayHello = { -> println("Hello!") }
sayHello()  // Hello!

// Parentheses can be omitted for zero-parameter lambdas:
val greet = { println("Greetings!") }
greet()
```

---

## Storing Closures in Variables

Closures can be stored in bindings. The type annotation uses the `(Params) -> ReturnType` syntax:

```prismio
let isEven: (Int) -> Bool = { n -> n % 2 == 0 }
let toString: (Int) -> String = { n -> n.toString() }
let combine: (String, String) -> String = { a, b -> a + " " + b }

println(isEven(4))           // true
println(isEven(7))           // false
println(combine("Hello", "World"))  // Hello World
```

---

## Capturing Variables from Scope

Closures can **capture** variables from their enclosing scope. The closure "closes over" those variables.

```prismio
let multiplier = 3
val triple = { x: Int -> x * multiplier }  // captures `multiplier`

println(triple(5))   // 15
println(triple(10))  // 30
```

### Capturing Mutable Variables

A closure that captures a mutable variable can observe its changes:

```prismio
let mut count = 0

val increment = { count += 1 }
val getCount = { count }

increment()
increment()
increment()
println(getCount())  // 3
```

### Closure Over Function Parameters

```prismio
fn makeAdder(n: Int) -> (Int) -> Int {
    return { x -> x + n }   // captures `n` from makeAdder's scope
}

val add5 = makeAdder(5)
val add10 = makeAdder(10)

println(add5(3))    // 8
println(add10(3))   // 13
println(add5(7))    // 12
```

### Counter Factory

```prismio
fn makeCounter(start: Int = 0, step: Int = 1) -> () -> Int {
    let mut current = start
    return {
        let value = current
        current += step
        value
    }
}

val counter = makeCounter(0, 2)
println(counter())  // 0
println(counter())  // 2
println(counter())  // 4
println(counter())  // 6
```

---

## Move Closures

By default, closures capture variables by **reference** (borrowing them). A **move closure** takes **ownership** of the captured variables, which is essential when the closure outlives the scope where the variable was defined (e.g., when returned from a function or passed to a thread).

> 🚧 **Coming Soon** – The `move` keyword for move closures is planned as part of the full ownership system and is not yet implemented.

```prismio
// Future syntax (planned):
fn createLogger(prefix: String) -> () -> Unit {
    let message = "Logger: ${prefix}"
    return move { println(message) }   // `message` is moved into the closure
}

let log = createLogger("DEBUG")
log()  // Logger: DEBUG
```

Until move closures are available, returning closures from functions works for value types (they are copied):

```prismio
fn makeGreeter(name: String) -> () -> String {
    return { "Hello, ${name}!" }   // `name` captured (copy for String)
}

val greeter = makeGreeter("Alice")
println(greeter())  // Hello, Alice!
```

---

## Higher-Order Functions

A **higher-order function** either accepts a function as a parameter or returns a function (or both). Closures are the primary way to use them.

### Passing Closures as Arguments

```prismio
fn applyToAll(nums: [Int], transform: (Int) -> Int) -> [Int] {
    let mut result = [Int]()
    for n in nums {
        result.add(transform(n))
    }
    return result
}

let doubled = applyToAll([1, 2, 3, 4, 5], { n -> n * 2 })
println(doubled)  // [2, 4, 6, 8, 10]

let squared = applyToAll([1, 2, 3, 4, 5], { n -> n * n })
println(squared)  // [1, 4, 9, 16, 25]
```

### Trailing Lambda Syntax

When the last argument is a closure, you can move it outside the parentheses:

> 🚧 **Coming Soon** – Trailing lambda syntax is planned but not yet implemented.

```prismio
// Future syntax (planned):
val doubled = applyToAll([1, 2, 3]) { n -> n * 2 }
```

### Returning Closures

```prismio
fn multiplierOf(factor: Int) -> (Int) -> Int {
    return { x -> x * factor }
}

val double = multiplierOf(2)
val triple = multiplierOf(3)
val tenX   = multiplierOf(10)

println(double(5))   // 10
println(triple(5))   // 15
println(tenX(5))     // 50
```

### Function Composition

```prismio
fn compose<A, B, C>(f: (A) -> B, g: (B) -> C) -> (A) -> C {
    return { x -> g(f(x)) }
}

val addOne = { x: Int -> x + 1 }
val double = { x: Int -> x * 2 }

val doubleAfterAdd = compose(addOne, double)
println(doubleAfterAdd(3))   // (3+1)*2 = 8
println(doubleAfterAdd(10))  // (10+1)*2 = 22
```

---

## `map` — Transform Each Element

`map` applies a closure to every element of a collection and returns a new collection of the results.

```prismio
let numbers = [1, 2, 3, 4, 5]

let doubled = numbers.map { n -> n * 2 }
println(doubled)   // [2, 4, 6, 8, 10]

let strings = numbers.map { n -> n.toString() }
println(strings)   // ["1", "2", "3", "4", "5"]

let squares = numbers.map { n -> n * n }
println(squares)   // [1, 4, 9, 16, 25]
```

Chaining maps:

```prismio
let result = [1, 2, 3, 4, 5]
    .map { n -> n * 2 }       // [2, 4, 6, 8, 10]
    .map { n -> n + 1 }       // [3, 5, 7, 9, 11]
    .map { n -> "item${n}" }  // ["item3", "item5", "item7", "item9", "item11"]

println(result)
```

---

## `filter` — Select Elements

`filter` returns a new collection containing only the elements for which the predicate closure returns `true`.

```prismio
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

let evens = numbers.filter { n -> n % 2 == 0 }
println(evens)   // [2, 4, 6, 8, 10]

let odds = numbers.filter { n -> n % 2 != 0 }
println(odds)    // [1, 3, 5, 7, 9]

let large = numbers.filter { n -> n > 5 }
println(large)   // [6, 7, 8, 9, 10]
```

Filtering strings:

```prismio
let words = ["apple", "banana", "avocado", "cherry", "apricot", "date"]

let aWords = words.filter { w -> w.startsWith("a") }
println(aWords)  // [apple, avocado, apricot]

let longWords = words.filter { w -> w.length > 5 }
println(longWords)  // [banana, avocado, cherry, apricot]
```

---

## `reduce` — Fold into a Single Value

`reduce` (also called `fold`) combines elements of a collection into a single accumulated value using a closure.

```prismio
let numbers = [1, 2, 3, 4, 5]

let sum = numbers.reduce(0, { acc, n -> acc + n })
println(sum)   // 15

let product = numbers.reduce(1, { acc, n -> acc * n })
println(product)  // 120

let max = numbers.reduce(numbers[0], { acc, n -> if n > acc { n } else { acc } })
println(max)   // 5
```

Building a string:

```prismio
let words = ["The", "quick", "brown", "fox"]
let sentence = words.reduce("", { acc, word ->
    if acc.isEmpty() { word } else { "${acc} ${word}" }
})
println(sentence)  // The quick brown fox
```

---

## Combining `map`, `filter`, and `reduce`

```prismio
let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Sum of squares of even numbers
let result = data
    .filter { n -> n % 2 == 0 }      // [2, 4, 6, 8, 10]
    .map    { n -> n * n }            // [4, 16, 36, 64, 100]
    .reduce(0, { acc, n -> acc + n }) // 220

println(result)  // 220
```

```prismio
// Word frequency analysis
let text = "the cat sat on the mat the cat"
let words = text.split(" ")

let wordCount = words.reduce([String: Int](), { acc, word ->
    acc[word] = (acc[word] ?: 0) + 1
    acc
})

println(wordCount)
// {the: 3, cat: 2, sat: 1, on: 1, mat: 1}
```

---

## `forEach` — Iterating with Side Effects

`forEach` applies a closure to each element but doesn't return a new collection. Use it for side effects.

```prismio
let names = ["Alice", "Bob", "Carol"]

names.forEach { name -> println("Hello, ${name}!") }
// Hello, Alice!
// Hello, Bob!
// Hello, Carol!
```

```prismio
let mut total = 0.0
let prices = [9.99, 4.49, 12.00, 7.50]

prices.forEach { price -> total += price }
println("Total: ${total}")  // Total: 33.98
```

---

## `flatMap` — Map and Flatten

> 🚧 **Coming Soon** – `flatMap` is planned but not yet implemented.

```prismio
// Future syntax (planned):
let sentences = ["Hello world", "Foo bar baz"]
let words = sentences.flatMap { s -> s.split(" ") }
println(words)  // [Hello, world, Foo, bar, baz]
```

## `any`, `all`, `none`

> 🚧 **Coming Soon** – `any`, `all`, and `none` higher-order predicates are planned but not yet implemented.

```prismio
// Future syntax (planned):
val nums = [2, 4, 6, 8]
println(nums.all  { n -> n % 2 == 0 })  // true
println(nums.any  { n -> n > 5 })        // true
println(nums.none { n -> n < 0 })        // true
```

---

## Closure as a Type

Closure types are written as `(ParamTypes) -> ReturnType`:

```prismio
let f: (Int) -> Int = { n -> n * 2 }
let g: (Int, Int) -> Int = { a, b -> a + b }
let h: () -> String = { "hello" }
let action: () -> Unit = { println("done") }
```

In a function signature:

```prismio
fn transform(data: [Int], fn: (Int) -> Int) -> [Int] {
    return data.map(fn)
}

fn repeat(times: Int, action: () -> Unit) {
    for _ in 0..times {
        action()
    }
}

repeat(3, { println("Hello!") })
// Hello!
// Hello!
// Hello!
```

---

## Practical Examples

### Sorting with a Custom Comparator

> 🚧 **Coming Soon** – Custom sort comparators via closures are planned but not yet implemented.

```prismio
// Future syntax (planned):
let words = ["banana", "apple", "cherry", "date"]
let sorted = words.sortedWith { a, b -> a.length - b.length }
println(sorted)  // [date, apple, banana, cherry]
```

### Memoization

```prismio
fn memoize(f: (Int) -> Int) -> (Int) -> Int {
    let mut cache = [Int: Int]()
    return { n ->
        if cache.containsKey(n) {
            cache[n]!
        } else {
            let result = f(n)
            cache[n] = result
            result
        }
    }
}

val slowSquare = { n: Int ->
    sleep(100)   // simulate slow computation
    n * n
}

val fastSquare = memoize(slowSquare)
println(fastSquare(5))   // computed: 25
println(fastSquare(5))   // cached: 25 (instant)
println(fastSquare(10))  // computed: 100
```

### Event Handlers / Callbacks

```prismio
fn onButtonClick(handler: () -> Unit) {
    // Register the handler with the UI system
    uiSystem.registerClick(handler)
}

onButtonClick({
    println("Button was clicked!")
    updateCounter()
    refreshView()
})
```

---

## Summary

| Concept | Syntax | Notes |
|---|---|---|
| Basic lambda | `{ x -> x * 2 }` | Type inferred |
| Typed lambda | `{ x: Int -> x * 2 }` | Explicit type |
| No-param lambda | `{ println("hi") }` | Omit `->` |
| Multi-line lambda | `{ x -> \n  val y = x + 1\n  y * 2 }` | Last expr is value |
| Capture variable | Automatic | Closes over enclosing scope |
| Move closure | `move { ... }` | 🚧 Coming Soon |
| Closure type | `(Int) -> Int` | For annotations |
| `map` | `list.map { x -> ... }` | Transform each |
| `filter` | `list.filter { x -> ... }` | Select matching |
| `reduce` | `list.reduce(init, { acc, x -> ... })` | Fold to value |

---

## See Also

- [Function Signatures](signatures.md) — named function declarations
- [Parameters](parameters.md) — higher-order function parameters
- [Return Values](returns.md) — returning closures from functions
- [Ownership & Borrowing](../../memory/ownership.md) — move semantics
