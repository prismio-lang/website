# Language Philosophy

Philosophy is the DNA of a programming language. Every syntax choice, every type system rule, every standard library decision flows from a set of core beliefs about what software development should look like and what programmers deserve from their tools.

This page is Prismio's philosophical manifesto. Understanding these principles will help you understand *why* Prismio works the way it does — and why certain things that exist in other languages are deliberately absent here.

---

## Principle 1: No Hidden Costs

> *"If you didn't ask for it, you don't pay for it."*

Prismio is designed so that every operation has a **transparent, predictable cost**. There are no hidden allocations, no silent reference counting bumps, no unexpected virtual dispatch, no GC pauses appearing out of nowhere.

If a line of code does work, you should be able to understand what work it does by reading it. If a value is on the stack, you know it. If a function is called through a vtable, it will be visible in the code.

This principle drives several concrete decisions:

- **No garbage collector** — GC is a hidden cost. You don't control when it runs or how long it takes. Prismio's ownership model gives you deterministic cleanup with zero runtime overhead.
- **No implicit boxing** — In some languages, passing a value type into a function that expects an interface silently boxes it on the heap. Prismio does not do this.
- **No implicit conversions** — Numeric types do not silently widen or narrow. If you want an `Int` to become a `Float`, you say so explicitly.

```prismio
// Explicit conversion — the cost is visible
let x: Int = 42
let y: Float = Float(x)  // explicit cast

// NOT implicit — this would be a compile error in Prismio:
// let y: Float = x
```

---

## Principle 2: Fail at Compile Time, Not Runtime

> *"A bug caught by the compiler is a bug that never ships."*

Prismio's type system and ownership model are designed to push as many error categories as possible from runtime to compile time. A program that compiles should have a meaningful set of guarantees:

- **No use-after-free** — the borrow checker prevents this.
- **No null pointer dereferences** — there is no null for regular types; absence is `Option<T>`.
- **No data races** — the ownership model ensures only one writer at a time.
- **No type mismatches** — static typing catches these before a single byte of machine code is generated.

```prismio
fn main() {
    let name: Int = "hello"  // ❌ type error — caught at compile time, not runtime
}
```

```prismio
fn find(id: Int) -> Option<String> {
    if id == 0 { return Some("root") }
    return None
}

fn main() {
    let result = find(5)
    // You MUST handle both cases — the compiler enforces this
    match result {
        Some(name) -> println("Found: $name")
        None       -> println("Not found")
    }
    // No way to silently ignore the None case — panic-prone code is illegal by design
}
```

> 🚧 **Coming Soon** – `Option<T>`, `Result<T, E>`, and exhaustive `match` enforcement are planned features.

This philosophy is especially important for **long-lived software**. Bugs that only surface at runtime — maybe only in production, maybe only under specific conditions — are the most expensive kind. Prismio's bet is that the upfront investment in strong static analysis pays off many times over.

---

## Principle 3: One Obvious Way

> *"There should be one way to do something, and it should be the right way."*

Python has this as an explicit goal ("There should be one obvious way to do it"). Prismio adopts a version of it: for any common task, Prismio should offer a clear, idiomatic solution that the language actively guides you toward.

This does not mean Prismio is restrictive. It means Prismio tries not to offer five ways to do something when one good way suffices.

**For example:**
- There is one way to declare a variable: `let`.
- There is one way to declare a mutable variable: `let mut`.
- There is one way to import a module: `import full.path.to.Module`.
- There is one way to define a function: `fn name(params) -> ReturnType`.

```prismio
// The one way to import — explicit, full path
import std.collections.HashMap

// The one way to declare variables
let count = 0          // immutable
let mut total = 0.0    // mutable

// The one way to define a function (two forms, both valid)
fn square(x: Int) -> Int = x * x
fn cube(x: Int) -> Int {
    return x * x * x
}
```

There is no `var`/`val` duality (Kotlin), no `let`/`const`/`var` trichotomy (JavaScript), no `auto`/explicit declaration split (C++). One keyword, one concept.

---

## Principle 4: No Garbage Collector

> *"Memory management is a language concern, not a runtime concern."*

Prismio firmly believes that garbage collection is not the right solution for systems programming. GC is a powerful tool for many domains — but it comes with trade-offs that Prismio is not willing to make:

| GC Trade-off | Prismio's Answer |
|---|---|
| Unpredictable pause times | Deterministic cleanup via ownership |
| Memory overhead (GC metadata, generations) | Values freed exactly when they go out of scope |
| Throughput vs. latency tension | No tension — no GC |
| Non-deterministic finalizers | Deterministic drop at scope exit |

The ownership model is not just about safety — it is Prismio's mechanism for making memory management **part of the language's static semantics**, not a runtime afterthought.

```prismio
fn read_data() -> [Int] {
    let buffer = [1, 2, 3, 4, 5]
    return buffer  // ownership of buffer moves to the caller
}

fn main() {
    let data = read_data()  // owns the buffer now
    println(data[0])
}  // data freed here — deterministically, immediately
```

This means you get real-time, latency-sensitive code without a GC — and you do not have to write a single `free()` call.

---

## Principle 5: Explicit Is Better Than Implicit

> *"Say what you mean. Mean what you say."*

Prismio prefers explicit code over magical implicit behaviour. This is the difference between code that **teaches** the reader what is happening and code that requires the reader to memorise hidden rules.

This principle manifests in several ways:

### Explicit Mutability

```prismio
let x = 10        // immutable — explicit default
let mut y = 10    // mutable — explicit opt-in
```

### Explicit Borrowing

```prismio
fn print_info(data: &[Int]) {
    println("Count: ${data.length()}")
}

fn main() {
    let numbers = [1, 2, 3]
    print_info(&numbers)  // explicit borrow — you see the & at the call site
}
```

### Explicit Imports

```prismio
// Every imported name is visible — no wildcards, no ambiguity
import std.io.File
import std.io.BufferedReader
import std.collections.HashMap
```

No wildcard imports (`import std.*`) are allowed. This keeps the origin of every name in your code traceable and makes IDE tooling and code search reliable.

### Explicit Returns

In full-body functions, `return` is explicit:

```prismio
fn compute(x: Int, y: Int) -> Int {
    let intermediate = x * y + x
    return intermediate  // explicit return
}
```

Expression-body functions are a syntactic shorthand for single-expression returns:

```prismio
fn compute(x: Int, y: Int) -> Int = x * y + x  // implicit return of the expression
```

---

## Principle 6: Safety Without a Tax

> *"Safety should not cost you ergonomics."*

There is a common misconception that memory safety requires either a garbage collector or a steep learning curve (like Rust's lifetimes). Prismio challenges this by making the ownership model's **common cases simple** and the **uncommon cases explicit**.

The 80% of code that follows straightforward ownership patterns should *just work* with no lifetime annotations at all. Only when you need to express complex sharing or aliasing relationships should you have to reach for explicit annotations.

```prismio
// Simple case — no annotations needed, fully safe
fn sum(values: [Int]) -> Int {
    let mut total = 0
    for v in values {
        total = total + v
    }
    return total
}

// The compiler figures out ownership without you spelling it out
fn main() {
    let data = [10, 20, 30]
    let result = sum(data)
    println(result)  // 60
}
```

> 🚧 **Coming Soon** – The borrow checker's inference engine is under development. Lifetime annotations for complex cases will be available as an explicit opt-in.

---

## Principle 7: Errors Are Values

> *"Failure is not exceptional — handle it where it happens."*

Prismio rejects exceptions as a primary error-handling mechanism. Exceptions create invisible control flow — any function call might throw, and catching the right exception at the right level is a discipline problem, not a language guarantee.

Instead, Prismio models errors as **values** using `Result<T, E>`:

```prismio
fn divide(a: Float, b: Float) -> Result<Float, String> {
    if b == 0.0 {
        return Err("Division by zero")
    }
    return Ok(a / b)
}

fn main() {
    match divide(10.0, 2.0) {
        Ok(result) -> println("Result: $result")    // 5.0
        Err(msg)   -> println("Error: $msg")
    }

    match divide(5.0, 0.0) {
        Ok(result) -> println("Result: $result")
        Err(msg)   -> println("Error: $msg")         // Error: Division by zero
    }
}
```

This makes error paths visible, impossible to accidentally ignore (the compiler enforces exhaustive handling), and composable via the `?` propagation operator.

> 🚧 **Coming Soon** – `Result<T, E>`, `Option<T>`, and the `?` operator are planned for an upcoming release.

---

## Principle 8: The Language Grows With You

> *"Simple things should be simple. Complex things should be possible."*

Prismio is designed to have a low floor and a high ceiling. A beginner should be able to write:

```prismio
fn main() {
    println("Hello, World!")
}
```

…without understanding ownership, generics, or closures.

An expert should be able to write:

```prismio
fn transform<T, U>(items: [T], f: { &T -> U }) -> [U] {
    let mut result: [U] = []
    for item in items {
        result.push(f(&item))
    }
    return result
}
```

…with full generic type parameters, borrowed references, and higher-order functions — and the compiler will help them get it right.

> 🚧 **Coming Soon** – Generics with type parameters, trait bounds, and lifetime parameters are planned features.

---

## Principle 9: The Compiler Is Your Ally

> *"A compiler that tells you what went wrong is as important as one that makes fast code."*

Prismio's compiler is designed to produce **the best error messages in the business**. Not just "type mismatch at line 42" — but explanations of *why* the error occurred, *what the compiler expected*, and *what you likely meant*.

Helpful errors are not a "nice to have". For a language with a strict type system and ownership model, good error messages are a **safety feature** — they prevent developers from cargo-culting their way around the compiler rather than understanding it.

---

## Summary of Principles

| Principle | Core Belief |
|---|---|
| No Hidden Costs | Every operation's cost is visible and predictable. |
| Fail at Compile Time | Catch bugs before they ship. |
| One Obvious Way | Reduce decision fatigue; guide toward idiomatic code. |
| No Garbage Collector | Memory is a language concern, not a runtime concern. |
| Explicit over Implicit | Code should teach the reader, not surprise them. |
| Safety Without a Tax | Safety and ergonomics are not mutually exclusive. |
| Errors Are Values | Error handling is visible, composable, and mandatory. |
| Language Grows With You | Low floor, high ceiling. |
| The Compiler Is Your Ally | Great error messages are a feature, not a luxury. |

---

## See Also

- [Design Goals](./design_goals.md) — The practical pillars derived from this philosophy.
- [Why Prismio?](./why_prismio.md) — How these principles distinguish Prismio from other languages.
- [Language Comparison](./comparison.md) — Feature-by-feature comparison with other languages.
