---
title: Async and await
description: "async fn, Future<T>, await, scope and spawn blocks -- lazy futures, and tasks that cannot outlive the block that started them."
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [concurrency, async, await, future, scope, spawn, structured-concurrency]
related: [language/concurrency, language/functions, language/closures, language/ownership-and-borrowing, stdlib/concurrency]
---

`async fn` declares a function that can be awaited. Calling it does not run it: the call is a
`Future<T>`, a task that has not started, and the body runs when something awaits it or spawns it.
A `scope` is a block that cannot be left until every task started inside it has finished, which is
what makes it safe to start a task from a block of code.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

struct User {
    id: Int,
    name: String
}

async fn fetchUser(id: Int) -> User {
    return User { id: id, name: "user-".concat(id.toString()) }
}

async fn run() -> Int {
    scope {
        let a = spawn { await fetchUser(1) }
        let b = spawn { await fetchUser(2) }

        let first = await a
        let second = await b
        println(first.name)
        println(second.name)
    }
    return 0
}

async fn main() -> Int {
    return await run()
}
```

## `async fn` and `Future<T>`

```prismio
async fn double(x: Int) -> Int {
    return x * 2
}
```

The declaration reads exactly like a function; `async` is the only difference, and the body still
answers through `return` with the type it declares. What changes is the call. `double(21)` has type
`Future<Int>`, not `Int`.

`async` is a marker only directly before `fn`, so a variable called `async` still compiles. It works
the same on a method in an `impl` block, on a generic function, and after a visibility marker
(`public async fn`).

### Futures are lazy

A future holds the arguments it was built with and does nothing else. Building one and never
awaiting it runs nothing, and costs one small allocation.

<!-- prismio-check: pass -->
```prismio
import std.io

let mut ticks = 0

async fn tick() -> Int {
    ticks = ticks + 1
    return ticks
}

async fn main() -> Int {
    let f = tick()
    println(ticks)          // 0 -- the call ran nothing
    let v = await f
    println(ticks)          // 1 -- the body ran here
    let again = await f     // the same answer, not a second run
    return v - again
}
```

`await` runs the body **where the `await` is**, on the awaiting thread, as a call would: with this
thread's stack, no thread created and no waiting. A second `await` of the same future is its
answer again.

Written type: `Future<Int>`. A `Future<Int>` is not a `Future<Bool>`, and neither is an `Int`; the
compiler says which it found. `Task<Int>` is the older spelling of the same type and is still
accepted.

## `await`

`await` is a prefix, like `join`, and may be written in an `async fn` or in a `spawn { }` block:

```prismio
let u = await fetchUser(7)
```

`await f(x)` where `f` is an `async fn` is **the call** `f(x)`, made right there. No future exists,
nothing is allocated, and the result is owned like any other call's. It is the form to prefer.

Anywhere else `await` is an error that says what to write instead:

```text
error[P4001]: `await` is only allowed inside an `async fn` or a `spawn` block
  note: a function that is not `async` can run a future to completion with `join`
```

`join` is that bridge: a function that is not `async` runs a future with `join fut`, and it is the
same future, because a `Future<T>` and the `Task<T>` that `spawn f(x)` returns are one type. `async
fn main()` is allowed, and is how a program whose top level awaits is written.

## `scope`

```prismio
scope {
    // every task started in here is finished before this block is left
}
```

A scope waits for its tasks on **every** way out: reaching the closing brace, `return`, and
`break` or `continue` out of a loop that contains it. Scopes nest, and the inner one ends first.
It does not stop a task; it waits for it.

<!-- prismio-check: pass -->
```prismio
import std.io

let mut done = 0

async fn work(n: Int) -> Int {
    done = n
    return n
}

fn early(flag: Bool) -> Int {
    scope {
        spawn { await work(7) }
        if (flag) { return 1 }    // the task is waited for before this returns
    }
    return 2
}

fn main() -> Int {
    let r = early(true)
    println(done)                 // 7
    return r - 1
}
```

## `spawn { }`

`spawn { ... }` starts a task whose body is the block, and gives back a `Future<T>` where `T` is
the block's value: its last expression, as a closure's block does. It is only allowed inside a
`scope`, because the scope is what waits for the task.

```prismio
let a = spawn { await fetchUser(1) }     // Future<User>
spawn { println("logged in the background") }
let first = await a
```

A spawn whose result is not kept is still waited for by the scope.

### What a block captures

A block takes what it uses from the enclosing function, **by value**, up to three of them, exactly
as `spawn f(x)` takes its argument:

- a number, a `Bool` or a `Float` is copied, so a loop variable can be captured and each task sees
  its own;
- a `String`, a struct or a `Vec` is **moved** into the task, and the enclosing function may not
  use it afterwards.

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    let s = "ab".concat("cd")
    scope {
        spawn { println(s) }
    }
    println(s)              // use of moved value `s`
    return 0
}
```

Inside the block a capture is read like a parameter: it can be read, passed on and returned from,
and cannot be assigned to. Take a copy with `let mut` for something to change.

A `spawn { }` outside a `scope` is refused, and so is one inside another `spawn { }` block with no
scope of its own:

```text
error[P4001]: `spawn { }` needs an enclosing `scope`
```

## `spawn` without a block

The older forms mean what they meant, and now take an `async fn` too.

| | |
| --- | --- |
| `spawn f(x)` | runs `f(x)` on a task, started now; `Future<R>` |
| `spawn fut` | starts a future that was built earlier, and is that future |
| `join fut` / `await fut` | waits for it and yields its value |

<!-- prismio-check: pass -->
```prismio
import std.io

async fn square(n: Int) -> Int {
    return n * n
}

async fn main() -> Int {
    let f = square(9)
    let g = square(2)
    scope {
        spawn f             // both run at once...
        spawn g
    }
    println((await f) + (await g))     // ...and 85 is the sum of their answers
    return 0
}
```

A future that is awaited without being spawned runs on the awaiting thread; one that is spawned
runs on a thread of its own and `await` joins it. The body is the same either way, so the choice
is *where* it runs, not *what*.

## Futures are values

A `Future<T>` can be stored, passed and collected:

<!-- prismio-check: pass -->
```prismio
import std.io

async fn fact(n: Int) -> Int {
    if (n <= 1) { return 1 }
    return n * (await fact(n - 1))
}

async fn total() -> Int {
    let mut futures = Vec<Future<Int>>()
    for i in 1..<5 {
        futures.push(fact(i))
    }
    let mut sum = 0
    for f in futures {
        sum = sum + (await f)
    }
    return sum                  // 1 + 2 + 6 + 24
}

async fn main() -> Int {
    println(await total())
    return 0
}
```

## What it costs, and what it does not do yet

- **`await` of a call is a call.** There is no allocation and no thread. A *held* future is one
  small allocation, and awaiting it is a call plus a flag.
- **`spawn` is an operating-system thread.** A task is not yet multiplexed onto a pool, and an
  `await` that waits for a task running elsewhere blocks its thread until that task is done. The
  language does not promise more than that, and a later release can change what is behind it
  without changing a program: a future's body already runs wherever it is awaited or spawned.
- **At most three arguments for a held future or a task.** `await f(a, b, c, d)` is only a call
  and takes any number; for a future, pack the rest in a struct.
- **A result that is a struct or a `String`, reached through a handle** (`let a = spawn { ... }`,
  then `await a`) is not freed by the awaiting function; `await f(x)` of a call is. That is what
  `join` has always done, and it is on the compiler's known-issues list.
- **No cancellation beyond not starting.** A future never awaited never runs. A task that has
  started runs to its end; a `scope` waits for it rather than stopping it.

See [Concurrency](/language/concurrency) for tasks, channels and how the ownership analysis treats
a task's arguments; everything there applies to a `spawn { }` block's captures and an `async fn`'s
arguments, which are the same thing.
