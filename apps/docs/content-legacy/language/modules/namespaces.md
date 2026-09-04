# Namespacing

Prismio's module system is built directly on the file system. The path of a source file determines its module path — no manual module registration or configuration is needed. This makes large codebases easy to navigate and reason about.

---

## Module Hierarchy Mirrors the File System

Each `.prm` file is a module. Its fully qualified module path is derived from its location relative to your project's `src/` directory, with `/` separators replaced by `.`:

```
src/
├── main.prm               -> module: main (entry point)
├── auth/
│   ├── token.prm          -> module: auth.token
│   ├── session.prm        -> module: auth.session
│   └── middleware.prm     -> module: auth.middleware
├── models/
│   ├── user.prm           -> module: models.user
│   └── post.prm           -> module: models.post
└── utils/
    ├── string.prm         -> module: utils.string
    └── math.prm           -> module: utils.math
```

Importing follows this path directly:

```prismio
import auth.token.{ createToken, validateToken }
import models.user.{ User }
import utils.string.{ trim, capitalize }
```

---

## Fully Qualified Names

A fully qualified name includes the complete module path to an item. You can always use a fully qualified name to disambiguate between two items with the same name from different modules:

```prismio
import graphics.color.{ Color }
import physics.spectrum.{ Color as SpectrumColor }

fn main() {
    let bg: Color = Color { r: 255, g: 128, b: 0 }
    let light: SpectrumColor = SpectrumColor.fromWavelength(580.0)
}
```

When no alias is given, you can also call items directly via their full path without importing:

```prismio
fn main() {
    let user = app.models.user.User { name: "Alice" }
    app.utils.string.println(user.name)
}
```

This is verbose and generally discouraged in application code, but can be useful in macro-generated code or to make an implicit dependency explicit.

---

## Directory Modules (`mod.prm`)

When a directory contains a `mod.prm` file, that file acts as the **public façade** for the entire directory module. This is how you define what is exported from a subdirectory:

```
src/
└── collections/
    ├── mod.prm       -> public face of the 'collections' module
    ├── list.prm      -> private implementation detail
    ├── map.prm       -> private implementation detail
    └── set.prm       -> private implementation detail
```

```prismio
// collections/mod.prm
pub use collections.list.List
pub use collections.map.Map
pub use collections.set.Set
```

Consumers import from `collections` cleanly:

```prismio
import app.collections.{ List, Map, Set }
```

Without `mod.prm`, consumers would have to know the internal layout:

```prismio
// Without mod.prm — messy and fragile
import app.collections.list.{ List }
import app.collections.map.{ Map }
import app.collections.set.{ Set }
```

---

## `self` in Module Paths

Within a module, `self` refers to the current module itself. This is primarily useful in `mod.prm` files when re-exporting:

```prismio
// auth/mod.prm
pub use self.token.{ createToken, validateToken }
pub use self.session.{ Session }
```

`self` can also be used to make intra-module references explicit, although it is not required:

```prismio
// geometry/circle.prm

pub fn area(r: Float) -> Float = self.PI * r * r

pub let PI: Float = 3.14159265358979
```

---

## `super` in Module Paths

`super` refers to the **parent module** — one level up in the directory hierarchy. It is useful when sibling modules need to share something defined in a common parent:

```
src/
└── server/
    ├── mod.prm
    ├── router.prm
    └── handler.prm
```

```prismio
// server/mod.prm
pub struct Config {
    pub host: String
    pub port: Int
}
```

```prismio
// server/router.prm
import super.{ Config }   // imports from server/mod.prm

pub fn buildRoutes(config: Config) { ... }
```

```prismio
// server/handler.prm
import super.{ Config }   // same — imports from server/mod.prm

pub fn handleRequest(config: Config) { ... }
```

`super` chains: `super.super` refers to two levels up, and so on. Deep chaining is a code smell — it usually means the module structure needs rethinking.

---

## Module Organization Conventions

Prismio projects conventionally follow these layout patterns:

### Small Projects (Flat Layout)

```
src/
├── main.prm
├── models.prm
├── handlers.prm
└── utils.prm
```

Fine for scripts and small tools. No subdirectories needed.

### Medium Projects (Feature-Based Layout)

```
src/
├── main.prm
├── auth/
│   ├── mod.prm
│   ├── token.prm
│   └── session.prm
├── api/
│   ├── mod.prm
│   ├── routes.prm
│   └── middleware.prm
└── db/
    ├── mod.prm
    ├── connection.prm
    └── queries.prm
```

Group by feature or domain. Each directory has a `mod.prm` that controls the public API.

### Large Projects / Libraries (Layered Layout)

```
src/
├── lib.prm           // library entry point (exports the public API)
├── core/
│   ├── mod.prm
│   ├── types.prm
│   └── traits.prm
├── parsing/
│   ├── mod.prm
│   ├── lexer.prm
│   └── parser.prm
├── analysis/
│   ├── mod.prm
│   ├── typecheck.prm
│   └── resolve.prm
└── codegen/
    ├── mod.prm
    └── llvm.prm
```

Libraries use `lib.prm` instead of `main.prm` as the entry point.

---

## Separating Interface from Implementation

Prismio encourages separating what a module exposes (its interface) from how it works (its implementation).

### Pattern 1: `mod.prm` as Façade

Put only re-exports in `mod.prm`. Keep logic in implementation files:

```prismio
// payments/mod.prm — interface only, no logic
pub use self.stripe.{ charge, refund }
pub use self.paypal.{ createOrder, captureOrder }
pub use self.types.{ PaymentResult, PaymentError }
```

```prismio
// payments/types.prm — shared types, minimal logic
pub struct PaymentResult { pub transactionId: String, pub amount: Float }
pub enum PaymentError { Declined, InsufficientFunds, NetworkError }
```

```prismio
// payments/stripe.prm — implementation details, private helpers
import self.types.{ PaymentResult, PaymentError }

fn buildStripePayload(amount: Float) -> String { ... }  // private

pub fn charge(amount: Float) -> PaymentResult { ... }
pub fn refund(transactionId: String) -> Bool { ... }
```

### Pattern 2: Trait + Implementation Split

Define traits (interfaces) in one module, implementations in another:

```prismio
// storage/traits.prm
pub trait Storage {
    fn read(key: String) -> Optional<String>
    fn write(key: String, value: String) -> Bool
    fn delete(key: String) -> Bool
}
```

```prismio
// storage/redis.prm
import super.traits.{ Storage }

pub struct RedisStorage { ... }

impl Storage for RedisStorage {
    fn read(key: String) -> Optional<String> { ... }
    fn write(key: String, value: String) -> Bool { ... }
    fn delete(key: String) -> Bool { ... }
}
```

```prismio
// storage/sqlite.prm
import super.traits.{ Storage }

pub struct SqliteStorage { ... }

impl Storage for SqliteStorage {
    fn read(key: String) -> Optional<String> { ... }
    fn write(key: String, value: String) -> Bool { ... }
    fn delete(key: String) -> Bool { ... }
}
```

This makes it trivial to swap implementations without touching the interface.

---

## Avoiding Common Namespace Pitfalls

### 1. Name Collisions at Import Site

If two imported modules expose items with the same name, use aliases:

```prismio
import app.v1.User as UserV1
import app.v2.User as UserV2
```

### 2. Deep Nesting

Avoid module hierarchies deeper than 4–5 levels. If you find yourself writing `import a.b.c.d.e.f`, reorganize the modules.

### 3. Cyclic Imports

Keep dependencies flowing in one direction. If `A` needs `B` and `B` needs `A`, extract the shared dependency into a `common` or `types` module that both import. See [Circular Import Prevention](/language/modules/imports#circular-import-prevention) for details.

---

## Quick Reference

| Path Element | Meaning |
|---|---|
| `import a.b.c` | Import module `c` from directory `a/b/` |
| `self` | Current module |
| `super` | Parent module (one directory up) |
| `mod.prm` | Directory module façade file |
| `lib.prm` | Library crate entry point |
| `main.prm` | Binary crate entry point |

---

## See Also

- [Imports](/language/modules/imports) — import syntax and rules
- [Visibility](/language/modules/visibility) — controlling what gets exported
- [Project Structure](/tools/ums) — UMS project layout conventions
