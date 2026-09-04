# Idioms & Best Practices

Writing idiomatic Prismio means leveraging the language's strengths: immutability by default, expressive pattern matching, clear ownership semantics, and a consistent naming style. This guide walks through the most important conventions and patterns used in production Prismio code.

---

## Prefer Immutable Variables

In Prismio, `let` bindings are immutable by default. This is intentional — immutability prevents accidental mutation, makes code easier to reason about, and enables better compiler optimizations.

**Avoid:**
```prismio
let mut name = "Alice"
// name is never actually mutated — `mut` is unnecessary noise
println(name)
```

**Prefer:**
```prismio
let name = "Alice"
println(name)
```

Only use `let mut` when the variable genuinely needs to change:

```prismio
fn countDown(from: Int) {
    let mut n = from
    while n > 0 {
        println(n)
        n = n - 1
    }
}
```

### Why It Matters

- Immutable variables are thread-safe by default
- The compiler can apply more aggressive optimizations
- Code intent is clearer — a `mut` annotation signals "this changes"

---

## Use Pattern Matching Over `if-else` Chains

Pattern matching with `match` is more expressive, exhaustive, and idiomatic than long `if-else` chains. The compiler enforces that all cases are handled, preventing bugs from missing branches.

**Avoid:**
```prismio
fn describe(n: Int) -> String {
    if n < 0 {
        return "negative"
    } else if n == 0 {
        return "zero"
    } else if n < 10 {
        return "small"
    } else {
        return "large"
    }
}
```

**Prefer:**
```prismio
fn describe(n: Int) -> String {
    match n {
        _ if n < 0  => "negative"
        0           => "zero"
        1..9        => "small"
        _           => "large"
    }
}
```

Pattern matching shines even more with enums and structured data:

```prismio
enum Shape {
    Circle(radius: Float)
    Rectangle(width: Float, height: Float)
    Triangle(base: Float, height: Float)
}

fn area(shape: Shape) -> Float {
    match shape {
        Shape.Circle(r)         => 3.14159 * r * r
        Shape.Rectangle(w, h)  => w * h
        Shape.Triangle(b, h)   => 0.5 * b * h
    }
}
```

---

## Prefer Early Returns for Guard Clauses

Guard clauses reduce nesting and make the "happy path" of your function easy to follow. Return early when preconditions fail, rather than wrapping the entire function body in an `if` block.

**Avoid:**
```prismio
fn processUser(name: String, age: Int) {
    if name.length > 0 {
        if age >= 18 {
            // actual logic buried deep
            println("Welcome, " + name)
        } else {
            println("Must be 18 or older")
        }
    } else {
        println("Name cannot be empty")
    }
}
```

**Prefer:**
```prismio
fn processUser(name: String, age: Int) {
    if name.length == 0 {
        println("Name cannot be empty")
        return
    }
    if age < 18 {
        println("Must be 18 or older")
        return
    }

    // Happy path is clear and unindented
    println("Welcome, " + name)
}
```

---

## Naming Conventions

Consistent naming makes code readable and searchable. Prismio follows these conventions:

### Variables and Functions — `camelCase`

```prismio
let userName = "Alice"
let mut itemCount = 0

fn calculateTotal(price: Float, quantity: Int) -> Float {
    return price * quantity
}
```

### Types, Enums, and Structs — `PascalCase`

```prismio
struct UserProfile {
    firstName: String
    lastName: String
    emailAddress: String
}

enum ConnectionState {
    Connected
    Disconnected
    Reconnecting(attempt: Int)
}
```

### Constants — `SCREAMING_SNAKE_CASE`

```prismio
let MAX_RETRY_COUNT = 3
let DEFAULT_TIMEOUT_MS = 5000
let API_BASE_URL = "https://api.example.com"
```

### Modules and Files — `snake_case`

```
user_profile.prismio
http_client.prismio
auth_middleware.prismio
```

### Boolean Variables — Use Positive, Descriptive Names

```prismio
// Avoid ambiguous negations
let isNotReady = true   // hard to reason about

// Prefer positive framing
let isReady = false
let hasPermission = true
let canRetry = false
```

---

## Module Organization Best Practices

Keep modules focused on a single responsibility. Group related functionality, and expose only what consumers need.

### File Layout

```
src/
├── main.prismio          // Entry point
├── models/
│   ├── user.prismio
│   └── product.prismio
├── services/
│   ├── auth.prismio
│   └── payment.prismio
└── utils/
    ├── string_utils.prismio
    └── math_utils.prismio
```

### Prefer Explicit Imports

Always import specifically what you need. This makes dependencies visible and avoids name collisions.

```prismio
// Clear and explicit
import models.user.UserProfile
import services.auth.AuthService
import utils.string_utils.capitalize
```

### Keep Public API Surface Small

Only mark items `pub` if they are intended to be used outside the module. Internal helpers should remain private.

```prismio
// Public — part of the module's API
pub fn createUser(name: String, email: String) -> UserProfile { ... }

// Private — implementation detail
fn validateEmail(email: String) -> Bool { ... }
fn hashPassword(raw: String) -> String { ... }
```

---

## Error Handling Patterns

Prefer returning errors over panicking. Use descriptive error types and propagate errors upward cleanly.

```prismio
enum AppError {
    NotFound(item: String)
    PermissionDenied
    ParseError(message: String)
}

fn findUser(id: Int) -> Result<UserProfile, AppError> {
    if id <= 0 {
        return Result.Err(AppError.ParseError("ID must be positive"))
    }
    // ... lookup logic
}

fn loadDashboard(userId: Int) -> Result<Dashboard, AppError> {
    let user = findUser(userId)?  // propagate error with ?
    let dashboard = buildDashboard(user)?
    return Result.Ok(dashboard)
}
```

> See [Error Handling Patterns](/guides/error_handling) for a deeper guide.

---

## Performance Idioms

### Avoid Redundant Copies

Pass large data structures by reference rather than cloning unnecessarily.

```prismio
// Avoid: clones the entire list
fn sumList(items: [Int]) -> Int {
    let mut total = 0
    for item in items {
        total = total + item
    }
    return total
}

// Prefer: borrow the list
fn sumList(items: &[Int]) -> Int {
    let mut total = 0
    for item in items {
        total = total + item
    }
    return total
}
```

### Use Iterators and Functional Chains

Prefer iterator chains over manual loops when processing collections — they often compile to the same machine code but are more readable.

```prismio
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Sum of squares of even numbers
let result = numbers
    .filter(fn(n) => n % 2 == 0)
    .map(fn(n) => n * n)
    .reduce(0, fn(acc, n) => acc + n)

println(result)  // 220
```

### Prefer Stack Allocation

Small, fixed-size structures are best kept on the stack. Avoid heap-allocating unless the size is unknown or the data needs to outlive its scope.

---

## Documentation Comments

Use `///` for documentation comments on public items. These are picked up by the Prismio doc generator. Regular `//` comments are for internal notes.

```prismio
/// Calculates the compound interest for a given principal.
///
/// # Parameters
/// - `principal`: The initial amount
/// - `rate`: Annual interest rate as a decimal (e.g., 0.05 for 5%)
/// - `years`: Number of years to compound
///
/// # Returns
/// The total value after compounding.
///
/// # Example
/// ```prismio
/// let total = compoundInterest(1000.0, 0.05, 10)
/// println(total)  // 1628.89
/// ```
pub fn compoundInterest(principal: Float, rate: Float, years: Int) -> Float {
    return principal * (1.0 + rate) ^ years
}
```

### Documentation Comment Rules

- Use `///` for public functions, types, and modules
- Include a one-line summary first
- Add a `# Parameters` section for non-trivial inputs
- Add a `# Returns` section explaining the output
- Add a `# Example` section with runnable code
- Use `//` for inline implementation notes

```prismio
// This uses a fast path for small strings (< 64 bytes)
fn intern(s: String) -> StringId { ... }
```

---

## Summary: Idiomatic Prismio at a Glance

| Practice | Avoid | Prefer |
|---|---|---|
| Variables | `let mut x` when not needed | `let x` by default |
| Conditions | Long `if-else` chains | `match` expressions |
| Control flow | Deep nesting | Early returns |
| Naming | `myfunction`, `My_Var` | `myFunction`, `MyType` |
| Imports | Vague module imports | Explicit named imports |
| Errors | `panic()` everywhere | `Result<T, E>` + `?` |
| Docs | `//` on public items | `///` with sections |

---

*See also: [Error Handling Patterns](/guides/error_handling) · [Performance Guide](/guides/performance) · [Common Pitfalls](/guides/gotchas)*
