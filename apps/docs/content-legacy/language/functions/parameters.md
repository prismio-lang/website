# Parameters

Parameters define what data a function accepts. Prismio provides a flexible parameter system including required parameters, named arguments, default values, and variadic parameters — giving you clear, self-documenting function call sites.

---

## Required Parameters

Every parameter has a name and a type, separated by `:`. Parameters are separated by commas.

```prismio
fn greet(name: String) {
    println("Hello, ${name}!")
}

fn add(a: Int, b: Int) -> Int = a + b

fn createUser(username: String, age: Int, active: Bool) {
    println("User: ${username}, Age: ${age}, Active: ${active}")
}
```

All required parameters **must** be provided when calling the function:

```prismio
greet("Alice")
add(3, 5)
createUser("alice", 28, true)
```

Omitting a required parameter is a compile-time error:

```prismio
add(3)  // ❌ Error: missing required parameter `b`
```

---

## Named Parameters

Prismio supports calling functions with **named arguments**, where you specify the parameter name at the call site. Named arguments improve readability and allow you to pass arguments in any order.

```prismio
fn createRect(width: Int, height: Int, filled: Bool) {
    println("${width}x${height}, filled=${filled}")
}

// Positional call (order matters):
createRect(100, 200, true)

// Named call (order doesn't matter):
createRect(width: 100, height: 200, filled: true)
createRect(filled: false, height: 50, width: 80)
```

Named arguments greatly help with functions that have many parameters of similar types:

```prismio
fn sendEmail(to: String, subject: String, body: String, cc: String, bcc: String) {
    // ...
}

// ✅ Clear and readable with named arguments:
sendEmail(
    to: "alice@example.com",
    subject: "Meeting Tomorrow",
    body: "Hi Alice, let's meet at 10am.",
    cc: "bob@example.com",
    bcc: ""
)
```

### Mixing Positional and Named

You can mix positional and named arguments. Positional arguments must come first:

```prismio
fn connect(host: String, port: Int, secure: Bool) {
    println("Connecting to ${host}:${port} (secure=${secure})")
}

connect("localhost", port: 8080, secure: true)
```

---

## Default Parameter Values

Parameters can have **default values**. If the caller omits a parameter, the default is used.

```prismio
fn greet(name: String, greeting: String = "Hello") {
    println("${greeting}, ${name}!")
}

greet("Alice")               // Hello, Alice!
greet("Bob", "Hi")           // Hi, Bob!
greet("Carol", greeting: "Hey")  // Hey, Carol!
```

### Multiple Default Parameters

```prismio
fn createServer(
    host: String = "localhost",
    port: Int = 8080,
    maxConnections: Int = 100,
    secure: Bool = false
) {
    println("Server at ${host}:${port} (max=${maxConnections}, secure=${secure})")
}

createServer()                            // localhost:8080 (max=100, secure=false)
createServer(port: 443, secure: true)     // localhost:443 (max=100, secure=true)
createServer(host: "0.0.0.0")            // 0.0.0.0:8080 (max=100, secure=false)
```

### Default Values with Expressions

Default values can be arbitrary expressions evaluated at call time:

```prismio
fn timestamp(prefix: String = "LOG", time: String = getCurrentTime()) -> String {
    return "[${prefix} ${time}]"
}
```

### Rules for Default Parameters

- Parameters with defaults must come **after** required parameters
- Named arguments can skip over defaults in any order

```prismio
// ✅ Defaults after required params
fn log(message: String, level: String = "INFO", timestamp: Bool = true) { ... }

// ❌ Default before required — invalid
fn log(level: String = "INFO", message: String) { ... }
```

---

## Variadic Parameters

A **variadic parameter** accepts zero or more values of a type, collected into an array. Declare it with `vararg` before the parameter name.

```prismio
fn sum(vararg nums: Int) -> Int {
    let mut total = 0
    for n in nums {
        total += n
    }
    return total
}

println(sum())           // 0
println(sum(1))          // 1
println(sum(1, 2, 3))    // 6
println(sum(1, 2, 3, 4, 5))  // 15
```

Inside the function, the variadic parameter is treated as an array `[Int]`:

```prismio
fn joinStrings(separator: String, vararg parts: String) -> String {
    return parts.join(separator)
}

println(joinStrings(", ", "Prismio", "Kotlin", "Rust"))
// Prismio, Kotlin, Rust
```

### Spreading an Array into Vararg

Use the spread operator `*` to pass an existing array as variadic arguments:

> 🚧 **Coming Soon** – The spread operator (`*arr`) for variadic arguments is planned but not yet implemented.

```prismio
// Future syntax (planned):
let nums = [1, 2, 3, 4, 5]
println(sum(*nums))  // 15
```

### Variadic with Other Parameters

A variadic parameter must be the **last** parameter in the list:

```prismio
fn formatList(title: String, vararg items: String) {
    println("=== ${title} ===")
    for item in items {
        println("  - ${item}")
    }
}

formatList("Languages", "Prismio", "Kotlin", "Rust", "Swift")
// === Languages ===
//   - Prismio
//   - Kotlin
//   - Rust
//   - Swift
```

---

## Passing by Value vs. by Reference

### Passing by Value

By default, Prismio passes **primitive types** (Int, Float, Bool, Char) by **value** — a copy is made. The function receives its own copy and cannot affect the caller's variable.

```prismio
fn doubleIt(n: Int) -> Int {
    return n * 2
}

let x = 5
let result = doubleIt(x)
println(x)       // 5  — unchanged
println(result)  // 10
```

### Parameter Conventions (Borrowing & Ownership)

Prismio does **not** use first-class references (`&`/`&mut`) or lifetime annotations. Instead,
how a parameter relates to the caller's value is expressed with a **parameter convention** —
a keyword written before the parameter name. This is the borrow surface of Prismio's
[ownership model](../memory/ownership.md), and because references are *second-class* (they
exist only as parameters and never escape), the compiler needs **no lifetime annotations** to
prove safety.

| Convention | Meaning | Caller keeps the value? |
|------------|---------|--------------------------|
| *(none)* — `let` | Shared, read-only borrow (the default) | ✅ yes |
| `inout` | Exclusive mutable borrow — changes are visible to the caller | ✅ yes |
| `sink` | Ownership is moved into the function | ❌ no (consumed) |

#### Default: shared borrow

With no convention, a parameter is a read-only borrow. The caller keeps ownership and can
keep using the value afterward — no move, no copy, no annotation:

```prismio
fn peek(c: Counter) -> Int {
    return c.value
}

let a = Counter { value: 10 }
peek(a)            // borrow
peek(a)            // ✅ still usable — borrowing never consumes
```

#### `inout`: mutable borrow

An `inout` parameter is an exclusive, mutable borrow. Mutations inside the function are
visible to the caller — no pointers, no dereferencing:

```prismio
fn bump(inout c: Counter) {
    c.value = c.value + 1
}

let a = Counter { value: 10 }
bump(a)
bump(a)
println(a.value)   // 12 — the caller's value was mutated in place
```

#### `sink`: take ownership

A `sink` parameter consumes its argument — ownership moves into the function, and the
caller can no longer use it. Use this when the function stores, returns, or destroys the value:

```prismio
fn consume(sink c: Counter) -> Int {
    let v = c.value
    drop(c)        // the function owns c, so it may free it
    return v
}

let a = Counter { value: 12 }
let result = consume(a)   // a's ownership moves in
// peek(a)                // ❌ Compile error: use of moved value: a
```

Because borrowed (`let`/`inout`) parameters do **not** own their value, the compiler also
rejects attempts to move or `drop` them — that would free the caller's value out from under it:

```prismio
fn leak(r: Counter) {
    drop(r)        // ❌ Compile error: cannot move out of borrowed value: r
}
```

---

## Parameter Shadowing

Inside a function, you can shadow a parameter by declaring a new binding with the same name. This is useful for transforming input without mutation.

```prismio
fn processName(name: String) -> String {
    let name = name.trim()          // shadows parameter
    let name = name.toLowerCase()   // shadows again
    let name = name.capitalize()    // shadows again
    return name
}

println(processName("  alice BOB  "))  // Alice bob
```

This is preferred over using `let mut` for the parameter, keeping the original parameter immutable.

---

## Higher-Order Function Parameters

Functions can accept other functions as parameters. The type of a function parameter uses the `(Params) -> ReturnType` syntax:

```prismio
fn applyTwice(value: Int, transform: (Int) -> Int) -> Int {
    return transform(transform(value))
}

println(applyTwice(3, { x -> x * 2 }))   // 12
println(applyTwice(1, { x -> x + 10 }))  // 21
```

```prismio
fn filterNumbers(nums: [Int], predicate: (Int) -> Bool) -> [Int] {
    let mut result = [Int]()
    for n in nums {
        if predicate(n) {
            result.add(n)
        }
    }
    return result
}

let evens = filterNumbers([1, 2, 3, 4, 5, 6], { n -> n % 2 == 0 })
println(evens)  // [2, 4, 6]
```

See [Closures](closures.md) for more on passing and returning functions.

---

## Practical Examples

### Configuration Builder

```prismio
fn buildQuery(
    table: String,
    limit: Int = 10,
    offset: Int = 0,
    orderBy: String = "id",
    ascending: Bool = true
) -> String {
    let dir = if ascending { "ASC" } else { "DESC" }
    return "SELECT * FROM ${table} ORDER BY ${orderBy} ${dir} LIMIT ${limit} OFFSET ${offset}"
}

println(buildQuery("users"))
// SELECT * FROM users ORDER BY id ASC LIMIT 10 OFFSET 0

println(buildQuery("orders", limit: 50, orderBy: "created_at", ascending: false))
// SELECT * FROM orders ORDER BY created_at DESC LIMIT 50 OFFSET 0
```

### Logging with Varargs

```prismio
fn log(level: String, vararg messages: String) {
    let combined = messages.join(" ")
    println("[${level}] ${combined}")
}

log("INFO", "Server started")
log("ERROR", "Connection", "failed:", "timeout after 30s")
log("DEBUG", "User", "alice", "logged", "in", "from", "192.168.1.1")
```

---

## Summary

| Parameter Kind | Syntax | Notes |
|---|---|---|
| Required | `fn f(a: Int)` | Must be provided by caller |
| Named call | `f(a: 5)` | Can reorder arguments |
| Default value | `fn f(a: Int = 0)` | Optional, defaults after required |
| Variadic | `fn f(vararg xs: Int)` | Zero or more, last parameter only |
| Higher-order | `fn f(g: (Int) -> Int)` | Function as parameter |
| Shared borrow | `fn f(x: T)` | Default — read-only, caller keeps ownership |
| Mutable borrow | `fn f(inout x: T)` | Mutations visible to caller |
| Move-in | `fn f(sink x: T)` | Takes ownership; argument is consumed |

---

## See Also

- [Function Signatures](signatures.md) — function declaration forms
- [Return Values](returns.md) — what functions send back
- [Closures](closures.md) — lambdas and higher-order functions
- [Ownership & Borrowing](../memory/ownership.md) — how references work
