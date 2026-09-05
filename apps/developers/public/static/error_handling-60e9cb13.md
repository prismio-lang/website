# Error Handling Patterns

Error handling is a first-class concern in Prismio. Rather than relying on exceptions that can be thrown from anywhere, Prismio makes errors explicit in function signatures using the `Result<T, E>` type. This forces callers to acknowledge that a function can fail and decide what to do about it.

---

## The `Result<T, E>` Type

`Result<T, E>` is a built-in enum with two variants:

- `Result.Ok(value: T)` — the operation succeeded, carrying a value of type `T`
- `Result.Err(error: E)` — the operation failed, carrying an error of type `E`

```prismio
// Conceptually, Result is defined as:
enum Result<T, E> {
    Ok(T)
    Err(E)
}
```

### A Simple Example

```prismio
fn divide(a: Float, b: Float) -> Result<Float, String> {
    if b == 0.0 {
        return Result.Err("Cannot divide by zero")
    }
    return Result.Ok(a / b)
}

fn main() {
    let result = divide(10.0, 2.0)

    match result {
        Result.Ok(value)  => println("Result: " + value.toString())
        Result.Err(msg)   => println("Error: " + msg)
    }
}
```

**Output:**
```
Result: 5.0
```

---

## Pattern Matching on Results

The primary way to handle a `Result` is with `match`, which forces you to handle both the success and failure case:

```prismio
fn parseAge(input: String) -> Result<Int, String> {
    let n = input.parseInt()
    match n {
        null    => return Result.Err("'" + input + "' is not a valid number")
        Some(v) if v < 0   => return Result.Err("Age cannot be negative")
        Some(v) if v > 150 => return Result.Err("Age is unrealistically large")
        Some(v) => return Result.Ok(v)
    }
}

fn main() {
    let inputs = ["25", "abc", "-3", "200"]

    for input in inputs {
        match parseAge(input) {
            Result.Ok(age)  => println("Valid age: " + age.toString())
            Result.Err(msg) => println("Invalid: " + msg)
        }
    }
}
```

**Output:**
```
Valid age: 25
Invalid: 'abc' is not a valid number
Invalid: Age cannot be negative
Invalid: Age is unrealistically large
```

---

## The `?` Operator for Error Propagation

Writing `match` every time you call a fallible function is verbose. The `?` operator automatically propagates errors upward — if the result is `Err`, it returns immediately with that error; if it's `Ok`, it unwraps the value.

### Without `?`

```prismio
fn readConfig() -> Result<Config, AppError> {
    let file = openFile("config.json")
    match file {
        Result.Err(e) => return Result.Err(e)
        Result.Ok(f) => {
            let content = readContents(f)
            match content {
                Result.Err(e) => return Result.Err(e)
                Result.Ok(text) => {
                    let config = parseJson(text)
                    match config {
                        Result.Err(e) => return Result.Err(e)
                        Result.Ok(cfg) => return Result.Ok(cfg)
                    }
                }
            }
        }
    }
}
```

### With `?`

```prismio
fn readConfig() -> Result<Config, AppError> {
    let f = openFile("config.json")?
    let text = readContents(f)?
    let config = parseJson(text)?
    return Result.Ok(config)
}
```

The `?` operator works inside any function whose return type is `Result<T, E>`. It:
1. Evaluates the expression
2. If `Ok(v)`, unwraps to `v` and continues
3. If `Err(e)`, returns `Result.Err(e)` immediately from the enclosing function

---

## Creating Custom Error Types

For non-trivial applications, use a dedicated error enum instead of plain strings. This makes errors machine-readable, allows callers to handle specific cases differently, and provides richer context.

```prismio
enum DatabaseError {
    ConnectionFailed(host: String, port: Int)
    QueryFailed(query: String, reason: String)
    RecordNotFound(id: Int)
    Timeout(durationMs: Int)
}

fn findUser(id: Int) -> Result<User, DatabaseError> {
    if id <= 0 {
        return Result.Err(DatabaseError.RecordNotFound(id))
    }
    // ... database lookup
}

fn main() {
    match findUser(0) {
        Result.Ok(user) => println("Found: " + user.name)
        Result.Err(DatabaseError.RecordNotFound(id)) =>
            println("No user with ID " + id.toString())
        Result.Err(DatabaseError.ConnectionFailed(host, port)) =>
            println("Cannot connect to " + host + ":" + port.toString())
        Result.Err(DatabaseError.Timeout(ms)) =>
            println("Query timed out after " + ms.toString() + "ms")
        Result.Err(e) =>
            println("Database error: " + e.toString())
    }
}
```

### Adding Context with Error Wrapping

> 🚧 **Coming Soon** – Automatic error conversion via `From` trait is planned but not yet implemented. The following shows the intended design.

When an error passes through multiple layers, you often want to wrap a low-level error in a higher-level one to preserve context:

```prismio
enum AppError {
    Database(DatabaseError)
    Network(NetworkError)
    InvalidInput(String)
}

// Intended future syntax — wraps automatically with ?
fn loadUserProfile(userId: Int) -> Result<UserProfile, AppError> {
    let user = findUser(userId)?       // DatabaseError auto-converts to AppError
    let avatar = fetchAvatar(user.avatarUrl)?  // NetworkError auto-converts to AppError
    return Result.Ok(buildProfile(user, avatar))
}
```

---

## Providing Default Values

Sometimes you want to fall back to a default value on error rather than propagating it:

```prismio
fn getConfigValue(key: String) -> Result<String, ConfigError> { ... }

fn main() {
    // Provide a default if the key is missing
    let timeout = getConfigValue("timeout")
        .unwrapOr("30")
        .parseInt()
        .unwrapOr(30)

    println("Timeout: " + timeout.toString() + "s")
}
```

### Common Result Methods

| Method | Description |
|---|---|
| `.unwrapOr(default)` | Returns the value or `default` on error |
| `.unwrapOrElse(fn)` | Returns the value or calls `fn` on error |
| `.isOk()` | Returns `true` if `Ok` |
| `.isErr()` | Returns `true` if `Err` |
| `.map(fn)` | Transforms the `Ok` value, passes `Err` through |
| `.mapErr(fn)` | Transforms the `Err` value, passes `Ok` through |

```prismio
// .map — transform success value
let doubled = divide(10.0, 2.0).map(fn(v) => v * 2.0)
// Result.Ok(10.0)

// .mapErr — enrich error with context
let result = findUser(id).mapErr(fn(e) =>
    AppError.Database(e)
)
```

---

## Panicking vs. Returning Errors

Prismio provides `panic()` for unrecoverable situations. Understanding when to use it — vs. returning `Result` — is critical for writing robust software.

### Use `Result` When

- The failure is a **normal, expected outcome** the caller should handle
- The error is **recoverable** (retry, fallback, user feedback)
- You are writing **library code** where callers decide how to handle failures

```prismio
// File might not exist — callers should handle this
fn readFile(path: String) -> Result<String, IOError> { ... }

// Network calls fail regularly — return Result
fn httpGet(url: String) -> Result<Response, NetworkError> { ... }

// Parsing can fail with bad input — return Result
fn parseJson(text: String) -> Result<JsonValue, ParseError> { ... }
```

### Use `panic` When

- The failure indicates a **programming bug** (violated invariant, wrong argument)
- Recovery is **impossible or meaningless** at runtime
- You are in **test code** where a panic fails the test clearly

```prismio
fn getElement(array: [Int], index: Int) -> Int {
    if index < 0 || index >= array.length {
        panic("Index " + index.toString() + " out of bounds for array of length " + array.length.toString())
    }
    return array[index]
}
```

### Use `assert` for Invariants

```prismio
fn sqrt(x: Float) -> Float {
    assert(x >= 0.0, "sqrt requires a non-negative number, got: " + x.toString())
    // ...
}
```

### Decision Flowchart

```
Is this failure expected in normal operation?
├── Yes → Return Result<T, E>
└── No → Is it a programming bug?
         ├── Yes → panic() or assert()
         └── No → Is recovery meaningful?
                  ├── Yes → Return Result<T, E>
                  └── No → panic()
```

---

## Error Handling in `main`

The `main` function can return a `Result` to propagate top-level errors cleanly:

```prismio
fn main() -> Result<Void, AppError> {
    let config = loadConfig()?
    let db = connectDatabase(config.dbUrl)?
    let server = startServer(db, config.port)?

    println("Server listening on port " + config.port.toString())
    server.run()?
    return Result.Ok(())
}
```

When `main` returns `Result.Err(e)`, the runtime prints the error and exits with a non-zero status code.

---

## Anti-Patterns to Avoid

### Don't `.unwrap()` in Production Code

> 🚧 **Coming Soon** – `.unwrap()` (force-unwrap, panics on `Err`) is planned.

```prismio
// Dangerous — panics if this ever returns Err
let user = findUser(id).unwrap()

// Safe — handle the error
let user = match findUser(id) {
    Result.Ok(u)  => u
    Result.Err(e) => { logError(e); return }
}
```

### Don't Swallow Errors Silently

```prismio
// Bad: error is completely ignored
let _ = sendEmail(address, message)

// Better: log or handle
match sendEmail(address, message) {
    Result.Err(e) => log.warn("Failed to send email: " + e.toString())
    Result.Ok(_)  => {}
}
```

---

## Coming Soon

> 🚧 **Coming Soon** – The following error handling features are planned but not yet implemented:
> - `From` trait for automatic error conversion with `?`
> - `.unwrap()`, `.expect(msg)` methods
> - `try { }` blocks for inline error handling
> - Error chaining and context APIs (`withContext`, `caused_by`)
> - Stack traces attached to error values

---

*See also: [Common Pitfalls](/guides/gotchas) · [Idioms & Best Practices](/guides/idioms) · [Unsafe Patterns](/guides/unsafe)*
