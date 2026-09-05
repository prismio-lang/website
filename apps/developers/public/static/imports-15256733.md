# Imports

Prismio uses an explicit, path-based import system. Every module you use must be imported by name — there are no wildcard imports. This design keeps code readable, traceable, and tooling-friendly.

---

## Basic Import Syntax

Use the `import` keyword followed by a dot-separated module path:

```prismio
import std.io
import std.math
import std.collections.List
```

After importing a module, you access its contents using the module name or the final segment of the path:

```prismio
import std.math

fn main() {
    let result = math.sqrt(144.0)
    println(result) // 12.0
}
```

---

## Importing Specific Items

To import only selected items from a module, use curly-brace destructuring:

```prismio
import std.math.{ sqrt, pow, PI }
import std.string.{ trim, split }
```

Imported items are then available directly in scope without a prefix:

```prismio
import std.math.{ sqrt, PI }

fn circleArea(r: Float) -> Float = PI * r * r

fn main() {
    println(circleArea(5.0))  // 78.53981...
    println(sqrt(81.0))       // 9.0
}
```

This is the preferred approach when you only need a handful of symbols from a large module — it makes dependencies obvious at a glance.

---

## Aliased Imports

When two modules export symbols with the same name, or when a module path is long and unwieldy, use `as` to create a local alias:

```prismio
import some.deeply.nested.UtilityModule as Utils
import graphics.color.Color as GColor
import physics.color.Color as PColor
```

Aliasing works for both module-level imports and specific-item imports:

```prismio
import std.math.{ sqrt as squareRoot, pow as power }

fn main() {
    println(squareRoot(64.0))   // 8.0
    println(power(2.0, 10.0))   // 1024.0
}
```

Combining destructured imports with aliases:

```prismio
import app.networking.{ HttpClient as Http, Response as Res }

fn fetchData(url: String) -> Res {
    let client = Http.new()
    return client.get(url)
}
```

---

## No Wildcard Imports

Prismio intentionally does not support wildcard imports (e.g., `import std.math.*`). This is a deliberate design decision for the following reasons:

- **Readability**: Every name in scope has a clear, traceable origin.
- **Tooling**: IDEs and static analyzers can always resolve symbols without ambiguity.
- **Refactoring safety**: Removing or renaming an export never silently breaks a wildcard consumer.
- **Avoiding namespace pollution**: Importing everything from a large module can shadow local definitions in subtle ways.

If you find yourself importing many items from a single module, consider importing the module itself and using dot-access:

```prismio
// Instead of: import std.collections.{ List, Map, Set, Queue, Stack }
import std.collections

fn main() {
    let items: collections.List<Int> = collections.List.new()
    let lookup: collections.Map<String, Int> = collections.Map.new()
}
```

---

## Standard Library Imports

The Prismio standard library lives under the `std` namespace. Common imports include:

```prismio
import std.io          // print, println, input
import std.math        // sqrt, pow, abs, PI, E, floor, ceil, round
import std.string      // trim, split, join, parse
import std.collections // List, Map, Set, Queue
import std.fs          // File, Path, read_file, write_file
import std.time        // Instant, Duration, sleep
import std.net         // TcpStream, HttpClient
import std.thread      // spawn, join, Mutex
```

> **Note:** `std.io` is the only module whose top-level functions (`print`, `println`, `input`) are available **without** an explicit import, as they are part of the Prismio prelude. All other stdlib modules must be imported explicitly.

### Prelude

A small set of universally useful items is automatically in scope in every Prismio file without any import statement:

| Item | Description |
|---|---|
| `print()` | Write to standard output |
| `println()` | Write to standard output with newline |
| `input()` | Read a line from standard input |
| `Int`, `Float`, `Bool`, `String`, `Char` | Primitive types |
| `Array<T>` | Built-in array type |
| `Optional<T>` | Built-in optional type |

---

## Third-Party Package Imports

Third-party packages managed by UMS (Prismio's build and package system) are imported using the package name declared in your `prismio.toml`:

```toml
# prismio.toml
[dependencies]
json = "1.2.0"
httpx = "0.5.1"
```

```prismio
import json.{ parse, stringify }
import httpx.{ Client, Request }

fn main() {
    let client = Client.new()
    let response = client.get("https://api.example.com/data")
    let data = parse(response.body())
    println(data["name"])
}
```

UMS resolves package versions, downloads dependencies, and makes them available to the compiler automatically. See the [UMS documentation](/tools/ums) for details on adding and managing packages.

---

## Module Resolution Order

When the compiler resolves an import path, it searches in this order:

1. **Prelude** — built-in items always in scope.
2. **Current project** — modules within your own project (relative to the source root).
3. **Standard library** — modules under the `std` namespace.
4. **UMS packages** — third-party packages declared in `prismio.toml`.

If an import path is ambiguous, the compiler emits an error and asks you to qualify the path explicitly.

---

## Circular Import Prevention

Prismio's module system detects and rejects circular imports at compile time. If module `A` imports `B` and `B` imports `A` (directly or transitively), the compiler will report an error:

```
error[E0201]: circular import detected
  --> src/a.prm:1:1
   |
 1 | import app.b
   | ^^^^^^^^^^^^ module 'app.b' imports 'app.a', creating a cycle
   |
   = note: import chain: app.a -> app.b -> app.a
```

### Resolving Circular Imports

The typical fix is to extract shared types or utilities into a third module that both `A` and `B` can import without forming a cycle:

```
Before:               After:
  A <--> B              shared
                        /    \
                       A      B
```

```prismio
// shared/types.prm
pub struct Config {
    pub host: String
    pub port: Int
}

// server.prm
import app.shared.types.{ Config }

// client.prm
import app.shared.types.{ Config }
```

See [Namespacing](/language/modules/namespaces) for conventions on structuring modules to avoid cycles.

---

## Import Best Practices

- **Prefer specific imports** (`import mod.{ Item }`) over whole-module imports when you only need a few symbols.
- **Use aliases** to resolve name collisions clearly — avoid cryptic single-letter aliases unless the convention is universal (e.g., `io`).
- **Group imports** by origin: standard library first, then third-party, then local modules, separated by blank lines.
- **Keep imports at the top of the file**, before any declarations.

```prismio
// ✅ Recommended import grouping

import std.math.{ sqrt, PI }
import std.collections.{ List }

import httpx.{ Client }
import json.{ parse }

import app.models.{ User, Post }
import app.utils.{ formatDate }
```

---

## See Also

- [Visibility](/language/modules/visibility) — controlling which items are exported from a module
- [Namespacing](/language/modules/namespaces) — module hierarchy and file organization
- [UMS Package Manager](/tools/ums) — adding third-party dependencies
