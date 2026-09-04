# Concurrency

> 🚧 **Coming Soon** – Prismio's concurrency model is under active design. This page describes the planned concurrency features.

## Overview

Concurrency is a first-class concern in Prismio. The language's ownership model provides a strong foundation for writing correct concurrent code — the borrow checker catches data races at compile time, the same way it catches memory errors.

Prismio's concurrency model is inspired by a combination of:
- **Rust's fearless concurrency** — ownership prevents data races
- **Go's channels** — message-passing for communication
- **Kotlin's coroutines** — structured, lightweight concurrency

---

## Threads

> 🚧 **Coming Soon**

Prismio will support OS threads via the `std.thread` module.

```prismio
// Planned syntax
import std.thread.Thread

fn main() {
    let handle = Thread.spawn({
        println("Hello from a new thread!")
    })

    handle.join()   // Wait for the thread to finish
}
```

### Thread Safety

The ownership system prevents data races. You cannot share mutable data across threads without explicit synchronization:

```prismio
// Compile error: cannot send non-Send type across threads
let mut data = [1, 2, 3]
Thread.spawn({
    data.push(4)   // ERROR: data is owned by main thread
})
```

To share data across threads, you must use thread-safe primitives.

---

## Async / Await

> 🚧 **Coming Soon** – Async support is in design phase.

Prismio plans to support async/await for non-blocking I/O:

```prismio
// Planned syntax
import std.net.HttpClient

async fn fetchPage(url: String) -> String {
    let client = HttpClient.new()
    let response = await client.get(url)
    return await response.text()
}

fn main() {
    let html = run(fetchPage("https://example.com"))
    println(html)
}
```

### The `async` Runtime

Prismio will use a pluggable async runtime. The default runtime is a multi-threaded work-stealing executor.

---

## Channels

> 🚧 **Coming Soon**

Channels provide a safe way to communicate between threads:

```prismio
// Planned syntax
import std.sync.channel

fn main() {
    let (sender, receiver) = channel.create<Int>()

    let producer = Thread.spawn({
        for i in 0..10 {
            sender.send(i)
        }
        sender.close()
    })

    for value in receiver {
        println("Received: ${value}")
    }

    producer.join()
}
```

### Channel Types

| Type | Description |
|------|-------------|
| `channel.create<T>()` | Unbuffered (synchronous) |
| `channel.buffered<T>(capacity)` | Buffered (up to N items) |
| `channel.broadcast<T>()` | Multiple receivers |

---

## Synchronization Primitives

> 🚧 **Coming Soon**

### Mutex

```prismio
// Planned syntax
import std.sync.Mutex

let counter = Mutex.new(0)

fn increment() {
    let mut guard = counter.lock()
    *guard += 1
}   // guard released here, mutex unlocked
```

### RwLock

```prismio
// Planned syntax
import std.sync.RwLock

let data = RwLock.new([1, 2, 3])

// Multiple readers at once
let reader = data.read()
println(reader[0])

// Exclusive writer
let mut writer = data.write()
writer.push(4)
```

### Atomic Types

```prismio
// Planned syntax
import std.sync.atomic.AtomicInt

let counter = AtomicInt.new(0)
counter.fetchAdd(1, .SeqCst)
println(counter.load(.Relaxed))
```

---

## Arc — Shared Ownership Across Threads

> 🚧 **Coming Soon**

`Arc<T>` (Atomic Reference Counted) allows shared ownership of a value across multiple threads:

```prismio
// Planned syntax
import std.sync.Arc
import std.sync.Mutex

let shared = Arc.new(Mutex.new(0))

let threads = (0..5).map({ _ ->
    let clone = shared.clone()
    Thread.spawn({
        let mut guard = clone.lock()
        *guard += 1
    })
}).collect()

for t in threads {
    t.join()
}

println(*shared.lock())   // 5
```

---

## Structured Concurrency

> 🚧 **Coming Soon**

Prismio plans to support structured concurrency patterns where child tasks cannot outlive their parent scope:

```prismio
// Planned syntax
async fn processAll(items: [Item]) {
    scope { s ->
        for item in items {
            s.spawn(processItem(item))
        }
    }
    // All spawned tasks are guaranteed complete here
}
```

---

## Actor Model

> 🚧 **Future Consideration**

An actor-based concurrency model is being evaluated for future inclusion. Actors would provide isolated state with message-passing communication, similar to Erlang's model.

---

## Safety Guarantees

Prismio's type system enforces these concurrency safety properties at compile time:

| Property | How enforced |
|----------|-------------|
| No data races | Ownership + `Send`/`Sync` traits |
| No use-after-free in threads | Lifetime system |
| Deadlock avoidance | (Runtime detection planned) |
| Memory safety in async | Borrow checker in async contexts |

See also: [Ownership](../language/memory/ownership), [Borrowing](../language/memory/borrowing)
