# Standard Library Overview

The Prismio standard library (`std`) provides a curated set of modules for the most common programming tasks — from basic I/O to collections, networking, and concurrency. The stdlib is designed to be small, focused, and high-quality: every module ships with clear semantics, predictable performance characteristics, and first-class integration with the language's ownership model.

> **Note:** The standard library is actively being developed alongside the language. Modules marked 🚧 are planned and partially specified, but not yet available in stable builds.

---

## Module Index

| Module | Status | Description |
|---|---|---|
| [`std.io`](/stdlib/io) | ✅ Available | Console I/O — `print`, `println`, `input`, formatted output |
| [`std.core`](#core-prelude) | ✅ Available | Core types and prelude (auto-imported) |
| [`std.string`](/stdlib/core-types#string) | ✅ Available | String manipulation utilities |
| [`std.math`](/stdlib/core-types#math) | ✅ Available | Mathematical functions and constants |
| [`std.collections`](/stdlib/collections) | 🚧 In Progress | List, Map, Set, Queue, Stack |
| [`std.fs`](/stdlib/fs) | 🚧 Coming Soon | File system access and Path type |
| [`std.time`](/stdlib/time) | 🚧 Coming Soon | Time, Duration, date formatting |
| [`std.thread`](/stdlib/concurrency) | 🚧 Coming Soon | Threads, Mutex, synchronization |
| [`std.async`](/stdlib/concurrency) | 🚧 Coming Soon | Async/await, futures |
| [`std.net`](/stdlib/networking) | 🚧 Coming Soon | TCP/UDP sockets, HTTP client |
| [`std.env`](#stdenv) | 🚧 Coming Soon | Environment variables, command-line args |
| [`std.process`](#stdprocess) | 🚧 Coming Soon | Spawning child processes |

---

## Core / Prelude

The **prelude** is a minimal set of types and functions that are available in every Prismio file without any import statement. It covers the essential vocabulary of the language:

### Always-Available Types

```prismio
// These types need no import:
let n: Int = 42
let f: Float = 3.14
let b: Bool = true
let s: String = "hello"
let c: Char = 'A'
let arr: Array<Int> = [1, 2, 3]
let opt: Optional<String> = Optional.some("value")
```

### Always-Available Functions

```prismio
// Console output — no import needed
print("Hello")
println("World")

// Console input — no import needed
let line = input()               // reads a line from stdin
let name = input("Enter name: ") // with prompt
```

### Result and Optional

The `Optional<T>` and `Result<T, E>` types are part of the prelude and are used pervasively across the stdlib:

```prismio
fn divide(a: Float, b: Float) -> Optional<Float> {
    if b == 0.0 { return Optional.none() }
    return Optional.some(a / b)
}

fn readConfig(path: String) -> Result<String, String> {
    // ...
}
```

---

## `std.io` — Input & Output

The IO module handles all standard input/output operations. Basic functions are in the prelude; additional formatting and buffering utilities require an explicit import.

```prismio
import std.io.{ readLine, format, eprintln }
```

Key features:
- `print()` / `println()` — standard output
- `input()` — read from standard input
- `eprintln()` — write to standard error
- `format()` — string interpolation and formatting
- File I/O (buffered) — 🚧 Coming Soon

[Read the full IO reference →](/stdlib/io)

---

## `std.math` — Mathematics

The math module provides common mathematical functions and constants.

```prismio
import std.math.{ sqrt, pow, abs, floor, ceil, round, log, sin, cos, tan, PI, E }

fn main() {
    println(sqrt(144.0))       // 12.0
    println(pow(2.0, 8.0))     // 256.0
    println(abs(-17.5))        // 17.5
    println(floor(3.7))        // 3.0
    println(ceil(3.2))         // 4.0
    println(round(3.5))        // 4.0
    println(log(E))            // 1.0
    println(sin(PI / 2.0))     // 1.0
    println(PI)                // 3.14159265358979...
}
```

[Read the full Math reference →](/stdlib/core-types#math)

---

## `std.string` — String Utilities

String manipulation functions beyond the built-in `String` methods.

```prismio
import std.string.{ trim, split, join, repeat, padStart, padEnd }

fn main() {
    let s = "  hello world  "
    println(trim(s))                     // "hello world"
    println(split("a,b,c", ","))         // ["a", "b", "c"]
    println(join(["x", "y", "z"], "-"))  // "x-y-z"
    println(repeat("ab", 3))             // "ababab"
    println(padStart("42", 5, '0'))      // "00042"
}
```

[Read the full String reference →](/stdlib/core-types#string)

---

## `std.collections` — Collections

> 🚧 **In Progress** — Core collection types are being implemented.

Provides generic data structures beyond the built-in `Array<T>`:

- `List<T>` — growable, heap-allocated sequence
- `Map<K, V>` — hash map
- `Set<T>` — hash set
- `Queue<T>` / `Deque<T>` — queue and double-ended queue
- `Stack<T>` — LIFO stack

```prismio
import std.collections.{ List }

fn main() {
    let mut items: List<String> = List.new()
    items.push("apple")
    items.push("banana")
    println(items.length())  // 2
}
```

[Read the full Collections reference →](/stdlib/collections)

---

## `std.fs` — File System

> 🚧 **Coming Soon** — Planned for an upcoming release.

Provides cross-platform file system access:

- `Path` type for representing file system paths
- `readFile` / `writeFile` for simple file I/O
- `readDir` for directory listing
- `exists`, `isFile`, `isDir` predicates
- File metadata (size, modified time)

[Read the full FS reference →](/stdlib/fs)

---

## `std.time` — Time & Dates

> 🚧 **Coming Soon** — Planned for an upcoming release.

- `Instant` — a point in time (monotonic or wall-clock)
- `Duration` — a span of time
- `DateTime` — calendar date and time with timezone support
- `sleep(duration)` — pause execution

[Read the full Time reference →](/stdlib/time)

---

## `std.thread` and `std.async` — Concurrency

> 🚧 **Coming Soon** — Planned for an upcoming release.

- Native threads via `std.thread`
- `async`/`await` syntax via `std.async`
- Channels for message passing
- `Mutex<T>` and `RwLock<T>` for shared state

[Read the full Concurrency reference →](/stdlib/concurrency)

---

## `std.net` — Networking

> 🚧 **Coming Soon** — Planned for an upcoming release.

- TCP and UDP socket APIs
- HTTP/HTTPS client
- DNS resolution
- TLS support

[Read the full Networking reference →](/stdlib/networking)

---

## `std.env` — Environment

> 🚧 **Coming Soon**

```prismio
import std.env.{ getVar, args }

fn main() {
    let path = getVar("PATH")
    let arguments = args()
    println("Running with " + arguments.length().toString() + " arguments")
}
```

---

## `std.process` — Child Processes

> 🚧 **Coming Soon**

```prismio
import std.process.{ Command }

fn main() {
    let output = Command.new("echo")
        .arg("Hello from subprocess")
        .output()
    println(output.stdout)
}
```

---

## Design Philosophy

The Prismio standard library follows these principles:

1. **Explicit is better than implicit.** Functions have predictable names and clear signatures. Nothing happens by magic.
2. **Errors are values.** Functions that can fail return `Result<T, E>` or `Optional<T>` — no hidden exceptions.
3. **Ownership-aware.** All stdlib types work seamlessly with Prismio's ownership and borrowing system.
4. **Zero-cost abstractions.** High-level APIs compile down to efficient machine code — using `List<T>` is not slower than a raw array when the compiler can see through the abstraction.
5. **Batteries included, not batteries mandatory.** The prelude is minimal; functionality lives in explicit imports so you only pay for what you use.

---

## See Also

- [Core Types](/stdlib/core-types) — detailed reference for built-in types
- [I/O](/stdlib/io) — console and file I/O
- [Collections](/stdlib/collections) — List, Map, Set and more
- [Imports](/language/modules/imports) — how to import stdlib modules
