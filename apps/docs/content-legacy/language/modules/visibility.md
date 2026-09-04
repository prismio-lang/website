# Visibility

Prismio has a straightforward visibility system: items are **private to their module by default**, and you opt-in to making them public with the `pub` modifier. This default-private philosophy encourages good encapsulation and makes it easy to refactor internals without worrying about breaking external consumers.

---

## Default Visibility (Private)

Any declaration without a `pub` modifier is visible only within the module (file) where it is defined. External modules that import your module cannot see or access private items.

```prismio
// math/internal.prm

fn computeIntermediate(x: Float) -> Float {
    return x * x + 2.0 * x + 1.0
}

pub fn solve(x: Float) -> Float {
    return computeIntermediate(x)  // ✅ can call private fn from within same module
}
```

```prismio
// main.prm
import app.math.{ solve }

fn main() {
    println(solve(3.0))            // ✅ works — solve is pub
    // println(computeIntermediate(3.0))  ❌ error — not visible
}
```

Private items are still accessible from other items within the **same module file**. Privacy is module-scoped, not function-scoped.

---

## The `pub` Modifier

Prefix any top-level declaration with `pub` to make it part of the module's public API:

```prismio
pub fn greet(name: String) {
    println("Hello, " + name + "!")
}

pub struct Point {
    pub x: Float
    pub y: Float
}

pub let MAX_RETRIES: Int = 5

pub type UserId = Int
```

`pub` works on:

| Declaration | Example |
|---|---|
| Functions | `pub fn myFunc() { ... }` |
| Structs | `pub struct MyStruct { ... }` |
| Enums | `pub enum Color { Red, Green, Blue }` |
| Type aliases | `pub type Meter = Float` |
| Constants | `pub let PI: Float = 3.14159` |
| Modules | `pub mod utils` |

---

## Module-Level Visibility

Every `.prm` source file defines a module. The module's public interface is the set of all `pub` declarations in that file. Everything else is an implementation detail.

```prismio
// geometry/circle.prm

// Private helper — not exported
fn radiusSquared(r: Float) -> Float = r * r

// Public API
pub let PI: Float = 3.14159265358979

pub fn area(radius: Float) -> Float = PI * radiusSquared(radius)

pub fn circumference(radius: Float) -> Float = 2.0 * PI * radius
```

From outside the module:

```prismio
import app.geometry.circle.{ area, circumference, PI }

fn main() {
    println(area(5.0))           // ✅ 78.539...
    println(circumference(5.0))  // ✅ 31.415...
    println(PI)                  // ✅ 3.14159...
    // radiusSquared(5.0)        ❌ error: not in public API
}
```

---

## Struct Field Visibility

Struct fields follow the same rule: **private by default**, opt-in with `pub`.

```prismio
pub struct User {
    pub name: String     // readable and writable from outside
    pub email: String    // readable and writable from outside
    passwordHash: String // private — only accessible within this module
    loginCount: Int      // private
}
```

When a field is private, external code cannot read or write it directly. You expose controlled access through public methods:

```prismio
pub struct BankAccount {
    pub owner: String
    balance: Float        // private — cannot be set arbitrarily from outside

    pub fn getBalance(self) -> Float {
        return self.balance
    }

    pub fn deposit(mut self, amount: Float) {
        if amount > 0.0 {
            self.balance = self.balance + amount
        }
    }

    pub fn withdraw(mut self, amount: Float) -> Bool {
        if amount > 0.0 && self.balance >= amount {
            self.balance = self.balance - amount
            return true
        }
        return false
    }
}
```

```prismio
import app.finance.{ BankAccount }

fn main() {
    let mut account = BankAccount { owner: "Alice", balance: 1000.0 }
    // account.balance = 9999.0  ❌ error: field 'balance' is private

    account.deposit(500.0)
    println(account.getBalance())   // ✅ 1500.0
    println(account.withdraw(200.0)) // ✅ true
}
```

This pattern — private data, public methods — is the standard way to enforce invariants in Prismio.

---

## Enum Variant Visibility

An enum's variants inherit the visibility of the enum itself. If the enum is `pub`, all its variants are automatically public:

```prismio
pub enum Direction {
    North,
    South,
    East,
    West,
}
```

```prismio
import app.nav.{ Direction }

fn move(dir: Direction) {
    match dir {
        Direction.North => println("Moving north")
        Direction.South => println("Moving south")
        Direction.East  => println("Moving east")
        Direction.West  => println("Moving west")
    }
}
```

---

## Re-Exporting with `pub use`

Sometimes a module acts as a façade, collecting and re-exporting items from submodules so that consumers have a single convenient import path. Use `pub use` for this:

```prismio
// collections/mod.prm

pub use collections.list.List
pub use collections.map.Map
pub use collections.set.Set
```

Now consumers can import everything from the single `collections` module:

```prismio
// Without re-exports, consumers would need:
import app.collections.list.{ List }
import app.collections.map.{ Map }

// With pub use re-exports, they can write:
import app.collections.{ List, Map, Set }
```

This is especially useful for library crates that want to present a clean, stable public API while keeping the internal module structure flexible.

> **Best practice:** Only re-export items that are genuinely part of your public API. Re-exporting internal implementation details defeats the purpose of the visibility system.

---

## Visibility Summary

| Context | Visible to |
|---|---|
| No modifier (private) | Same module file only |
| `pub` | Any module that imports this module |
| Private struct field | Methods in the same module file |
| `pub` struct field | Any code with access to the struct |
| `pub use` re-export | Consumers of the re-exporting module |

---

## Practical Example: A Complete Module

Here is a realistic module demonstrating all visibility concepts together:

```prismio
// auth/token.prm

import std.time.{ Instant, Duration }
import std.crypto.{ hmacSha256 }

// Private constant — implementation detail
let SECRET_KEY: String = "super-secret-key"

// Private helper
fn signPayload(payload: String) -> String {
    return hmacSha256(payload, SECRET_KEY)
}

// Public type — consumers can hold and pass Token values
pub struct Token {
    pub userId: Int
    pub expiresAt: Instant
    signature: String   // private — consumers cannot forge or tamper with tokens
}

// Public constructor
pub fn createToken(userId: Int, ttl: Duration) -> Token {
    let expiry = Instant.now().plus(ttl)
    let payload = userId.toString() + ":" + expiry.toString()
    return Token {
        userId: userId,
        expiresAt: expiry,
        signature: signPayload(payload),
    }
}

// Public validation — consumers verify tokens without seeing internals
pub fn validateToken(token: Token) -> Bool {
    let payload = token.userId.toString() + ":" + token.expiresAt.toString()
    return signPayload(payload) == token.signature && token.expiresAt > Instant.now()
}
```

---

## See Also

- [Imports](/language/modules/imports) — how to bring module items into scope
- [Namespacing](/language/modules/namespaces) — module hierarchy and organization
- [Structs](/language/types/structs) — struct definitions and methods
