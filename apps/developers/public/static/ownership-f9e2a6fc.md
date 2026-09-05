# Ownership

Memory management is one of the most critical aspects of a systems programming language. Prismio takes a bold approach: **no garbage collector, no manual `free()` calls, and no memory leaks** — all enforced at compile time through a system called **ownership**.

---

## What Is Ownership?

Every value in Prismio has a single **owner** — the variable that holds it. The ownership rules are simple but powerful:

1. **Each value has exactly one owner at any time.**
2. **When the owner goes out of scope, the value is dropped (freed).**
3. **Ownership can be transferred (moved) to a new owner.**

These three rules, checked entirely at compile time, guarantee memory safety without needing a garbage collector.

---

## Scope and Drop

A value lives exactly as long as its owner. When the owning variable goes out of scope, Prismio automatically runs any cleanup and frees the associated memory — this is called a **drop**.

```prismio
fn main() {
    let greeting = "Hello, Prismio!"   // `greeting` is created here
    println(greeting)
}   // `greeting` goes out of scope here — automatically dropped
```

For heap-allocated data, this means the memory is freed the instant the owner's scope ends, with no delay, no GC pause, and no leak.

```prismio
fn processData() {
    let buffer = allocateLargeBuffer()   // heap allocation
    doWork(buffer)
    // ... more work ...
}   // `buffer` is dropped here — memory freed immediately
```

---

## Move Semantics

When you assign a value to a new variable or pass it to a function, **ownership is transferred** — this is called a **move**. After a move, the original variable is no longer valid.

```prismio
let s1 = "Hello"
let s2 = s1        // ownership of the String moves to s2

// println(s1)     // ❌ Compile error: s1 was moved
println(s2)        // ✅ Works fine
```

The compiler catches this at compile time — there is no runtime cost to a move, it's purely a compile-time ownership transfer.

### Moving Into Functions

Passing a value to a function transfers ownership to that function's parameter:

```prismio
fn greet(name: String) {
    println("Hello, ${name}!")
}   // name is dropped here

fn main() {
    let myName = "Prismio"
    greet(myName)           // ownership moves into greet()

    // println(myName)      // ❌ Compile error: myName was moved
}
```

### Returning Ownership

A function can give ownership back to the caller by returning the value:

```prismio
fn makeGreeting(name: String) -> String {
    return "Hello, ${name}!"   // ownership of the new String is returned
}

fn main() {
    let name = "World"
    let msg  = makeGreeting(name)   // name moves in, msg gets return value
    println(msg)                    // ✅
}
```

---

## Copy Types

Not all types are moved — **copy types** are cheap to duplicate, so they are **copied** instead of moved. Primitive types like `Int`, `Float`, `Bool`, and `Char` are all copy types.

```prismio
let x = 10
let y = x       // x is copied into y — both are valid

println(x)      // ✅ 10
println(y)      // ✅ 10
```

A type is a copy type if it implements the `Copy` trait. You can mark your own simple types as copyable:

```prismio
// A simple 2D point — cheap to copy
struct Point: Copy {
    x: Float
    y: Float
}

let p1 = Point(x: 1.0, y: 2.0)
let p2 = p1    // copied, not moved

println(p1.x)  // ✅ still valid
println(p2.x)  // ✅ also valid
```

> **Rule of thumb:** if a type is purely stack-allocated (no heap pointers), it's likely a `Copy` type.

---

## Clone

For heap-allocated types that are not `Copy`, you can **explicitly clone** a value to get an independent deep copy:

```prismio
let s1 = "Hello"
let s2 = s1.clone()   // explicit deep copy

println(s1)           // ✅ still valid
println(s2)           // ✅ independent copy
```

Cloning is opt-in and explicit, so you always know when an expensive copy is happening.

---

## Ownership and Collections

When you put a value into a collection, the collection becomes the owner:

```prismio
let name = "Prismio"
let mut names: [String] = []
names.append(name)     // name moves into the array

// println(name)       // ❌ Compile error: name was moved
```

When you remove an element from a collection, you get ownership back:

```prismio
let mut items = ["a", "b", "c"]
let first = items.remove(0)   // ownership of "a" transferred to `first`
println(first)                // ✅ "a"
```

---

## Why Ownership? Memory Safety Without GC

Traditional languages take one of two approaches to memory management:

| Approach         | Examples        | Drawbacks                              |
|------------------|-----------------|----------------------------------------|
| Manual           | C, C++          | Use-after-free, double-free, leaks     |
| Garbage Collector| Java, Go, Python| Pause times, unpredictable latency, memory overhead |

Prismio's ownership model provides **a third way**: the compiler statically proves that:

- No memory is ever accessed after it's freed (**no use-after-free**)
- No memory is freed more than once (**no double-free**)
- Every allocation is eventually freed (**no leaks**)
- No two pointers can simultaneously mutate the same data (**no data races**)

All of this happens at compile time with **zero runtime overhead**. Your compiled binary runs with the performance of C/C++ and the safety of a memory-managed language.

---

## Common Ownership Patterns

### Pattern 1: Returning computed values

```prismio
fn buildMessage(user: String, count: Int) -> String {
    return "User ${user} has ${count} messages."
}

fn main() {
    let msg = buildMessage("Alice", 5)
    println(msg)
}
```

### Pattern 2: Builder pattern (chained moves)

```prismio
let result = StringBuilder()
    .append("Hello")
    .append(", ")
    .append("World")
    .toString()

println(result)
```

### Pattern 3: Using borrowing to avoid moves

When you just need to *read* a value without taking ownership, use a **reference** instead. See [Borrowing](./borrowing.md).

```prismio
fn printLength(s: &String) {
    println("Length: ${s.length}")
}

fn main() {
    let text = "Prismio"
    printLength(&text)    // borrow — text is NOT moved
    println(text)         // ✅ still valid
}
```

---

## Ownership Errors and Their Solutions

### Error: Use after move

```prismio
let data = getData()
process(data)       // moves data
// log(data)        // ❌ use after move

// Solution 1: borrow instead
process(&data)
log(&data)

// Solution 2: clone
process(data.clone())
log(data)
```

### Error: Multiple moves

```prismio
let s = "hello"
let a = s           // moves s
// let b = s        // ❌ s already moved

// Solution: clone for independent copies
let s = "hello"
let a = s.clone()
let b = s           // ✅ s is moved into b, a has its own copy
```

---

## Summary

| Concept     | Description                                                   |
|-------------|---------------------------------------------------------------|
| Owner       | The single variable responsible for a value                   |
| Drop        | Automatic cleanup when owner goes out of scope                |
| Move        | Transfer of ownership to a new variable or function argument  |
| Copy        | Implicit duplication for cheap, stack-only types              |
| Clone       | Explicit deep copy for heap-allocated types                   |
| Borrow      | Temporary access without taking ownership (see [Borrowing](./borrowing.md)) |

Ownership is the cornerstone of Prismio's memory safety guarantee. Once you internalize the three rules, the compiler's feedback will guide you toward safe and efficient code every time.

---

## See Also

- [Borrowing](./borrowing.md)
- [References](./references.md)
- [Lifetimes](./lifetimes.md)
- [Types](../types.md)
