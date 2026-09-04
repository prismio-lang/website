# Concurrency Model Specification

> 🚧 **Coming Soon** – Prismio's formal concurrency semantics are under design. This page describes the planned model.

## Overview

Prismio's concurrency model is built on three principles:

1. **Data-race freedom by construction** — The type system prevents data races at compile time
2. **Explicit sharing** — Data shared across threads must be explicitly marked as such
3. **Composable primitives** — Simple, well-understood building blocks for concurrent programs

---

## Memory Ordering

Prismio will adopt a memory ordering model consistent with the C++11 memory model, which defines how memory operations in different threads relate to each other.

### Ordering Levels

| Level | Name | Description |
|-------|------|-------------|
| `Relaxed` | Relaxed | No ordering guarantees; only atomicity |
| `Acquire` | Acquire | Subsequent reads see writes before the corresponding Release |
| `Release` | Release | All writes before this are visible after a corresponding Acquire |
| `AcqRel` | Acquire-Release | Both Acquire and Release semantics |
| `SeqCst` | Sequentially Consistent | Total global ordering of all operations |

```prismio
// Planned atomic operations with ordering
import std.sync.atomic.AtomicInt

let counter = AtomicInt.new(0)

// Relaxed: fastest, no ordering guarantees
counter.store(1, .Relaxed)

// SeqCst: slowest, but fully consistent global view
counter.fetchAdd(1, .SeqCst)

let value = counter.load(.Acquire)
```

---

## Happens-Before Relationship

The **happens-before** (HB) relation defines which memory writes are guaranteed to be visible to subsequent reads.

Key rules:

1. **Program order**: Within a single thread, A before B ⟹ A HB B
2. **Synchronization**: A `Release` store HB a subsequent `Acquire` load of the same location
3. **Thread creation**: All writes before `Thread.spawn()` HB all reads in the spawned thread
4. **Thread join**: All writes in a thread HB all reads after `thread.join()`
5. **Transitivity**: A HB B and B HB C ⟹ A HB C

```prismio
// Example: happens-before through join
let mut data = 42

let t = Thread.spawn({
    // Guaranteed to see data = 42 (set before spawn)
    println(data)
    // data = 99
})

t.join()
// Guaranteed to see data = 99 (set before join completed)
```

---

## Data Race Definition

A **data race** occurs when:
1. Two or more threads access the same memory location concurrently
2. At least one access is a write
3. The accesses are not ordered by happens-before

Data races are **undefined behavior** in Prismio (same as Rust/C++). The type system prevents them in safe code.

### How Prismio Prevents Data Races

```prismio
// The Send and Sync traits (planned)
// T: Send means T can be transferred to another thread
// T: Sync means &T can be shared between threads

// This won't compile — Vec is not Sync
let mut vec = [1, 2, 3]
Thread.spawn({
    vec.push(4)   // ERROR: Vec<Int> cannot be sent between threads
})
```

---

## Atomic Operations

Atomic operations are indivisible — no other thread can observe a partial update.

### Planned Atomic Types

| Type | Description |
|------|-------------|
| `AtomicBool` | Atomic boolean |
| `AtomicInt` | Atomic integer |
| `AtomicUInt` | Atomic unsigned integer |
| `AtomicPtr<T>` | Atomic pointer |

### Planned Operations

```prismio
// Load and store
counter.load(.SeqCst)
counter.store(42, .SeqCst)

// Read-modify-write
counter.fetchAdd(1, .SeqCst)     // returns old value
counter.fetchSub(1, .SeqCst)
counter.fetchAnd(mask, .SeqCst)
counter.fetchOr(mask, .SeqCst)
counter.fetchXor(mask, .SeqCst)

// Compare-and-swap
let success = counter.compareExchange(
    expected: 0,
    new: 1,
    success: .SeqCst,
    failure: .Relaxed,
)
```

---

## Channel Semantics

Channels provide synchronization through message passing:

- **Send** on a channel HB **receive** of that message
- Channels can be unbuffered (synchronous) or buffered
- A closed channel's remaining messages can still be received

```
Send(m) HB Receive(m)    for any message m on a channel
```

---

## Mutex Semantics

Mutex acquisition establishes happens-before:

```
Unlock(mutex) HB Lock(mutex)    (for any subsequent lock of the same mutex)
```

This means all writes inside a critical section are visible to subsequent holders of the lock.

---

## Thread Spawning and Joining

```
All operations before Thread.spawn()  HB  All operations in the new thread

All operations in a thread  HB  All operations after thread.join()
```

---

## Lock Ordering and Deadlock

Prismio does not provide static deadlock prevention, but offers:

- **Lock ordering convention**: Document a global lock hierarchy
- **Timeout-based acquisition** (planned): `mutex.tryLockFor(duration)`
- **Deadlock detection** (planned, debug builds): Runtime cycle detection

---

## Send and Sync Traits

> 🚧 **Coming Soon** – These traits form the foundation of Prismio's thread safety guarantees.

```prismio
// Types that implement Send can be moved to another thread
// Types that implement Sync can be shared (&T) across threads

// Most primitive types: Send + Sync
// String: Send + Sync
// Vec<T>: Send + Sync (if T: Send)
// Rc<T>: neither Send nor Sync (use Arc<T> for sharing)
// Mutex<T>: Send + Sync (if T: Send)
// Arc<T>: Send + Sync (if T: Send + Sync)
```

See also: [Concurrency Guide](../stdlib/concurrency.md), [Ownership](../language/memory/ownership.md)
