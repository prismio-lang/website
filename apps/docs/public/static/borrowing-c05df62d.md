# Borrowing

In Prismio, **borrowing** lets you use a value without taking ownership of it. Instead of moving a value into a function (and losing access to it), you can lend the value temporarily — the borrower gets access, and when the borrow ends, the owner gets it back.

Borrowing is the everyday solution to the common need: *read this value without consuming it.*

---

## References

A borrow is expressed through a **reference**. You create a reference with `&` and receive it as a parameter typed `&T`. The value is not moved — the callee merely borrows it.

```prismio
fn printMessage(msg: &String) {
    println(msg)
}   // borrow ends here — msg is released back to its owner

fn main() {
    let text = "Hello, Prismio!"
    printMessage(&text)    // lend text to the function
    println(text)          // ✅ text is still valid here
}
```

---

## Immutable Borrows (`&T`)

An **immutable borrow** (`&T`) grants read-only access. You can have **as many immutable borrows active at the same time as you like**, because reads never conflict.

```prismio
fn wordCount(s: &String) -> Int {
    return s.split(" ").length
}

fn charCount(s: &String) -> Int {
    return s.length
}

fn main() {
    let doc = "The quick brown fox jumps over the lazy dog"

    let words = wordCount(&doc)
    let chars = charCount(&doc)

    // Both borrows have already ended at this point
    println("Words: ${words}, Chars: ${chars}")
    println(doc)   // ✅ owner is unchanged
}
```

### Multiple Simultaneous Immutable Borrows

```prismio
fn main() {
    let data = [1, 2, 3, 4, 5]

    let r1 = &data
    let r2 = &data
    let r3 = &data

    // All three borrows coexist — ✅ perfectly legal
    println(r1[0])
    println(r2[2])
    println(r3[4])
}
```

---

## Mutable Borrows (`&mut T`)

A **mutable borrow** (`&mut T`) grants both read and write access. The rules are stricter:

- **Only one mutable borrow may exist at a time.**
- **No immutable borrows may exist while a mutable borrow is active.**

This prevents data races and aliased mutation — two of the most common sources of bugs in systems software.

```prismio
fn appendExclamation(s: &mut String) {
    s.append("!")
}

fn main() {
    let mut greeting = "Hello"
    appendExclamation(&mut greeting)
    println(greeting)   // "Hello!"
}
```

### Mutating Through a Borrow

```prismio
fn doubleAll(nums: &mut [Int]) {
    for i in 0..nums.length {
        nums[i] = nums[i] * 2
    }
}

fn main() {
    let mut scores = [10, 20, 30, 40, 50]
    doubleAll(&mut scores)
    println(scores)   // [20, 40, 60, 80, 100]
}
```

---

## The Borrow Rules

Prismio enforces two core borrow rules at compile time:

> **Rule 1:** You may have any number of immutable borrows (`&T`) OR exactly one mutable borrow (`&mut T`) — but **not both at the same time**.

> **Rule 2:** A borrow must not outlive its owner.

These rules are not just restrictions — they are the compiler's proof that your program is free of data races and dangling references.

### Violating Rule 1 (Immutable + Mutable)

```prismio
let mut value = 42

let r1 = &value         // immutable borrow
// let r2 = &mut value  // ❌ Compile error: cannot borrow mutably
                        //    while an immutable borrow is active
println(r1)
```

### Violating Rule 1 (Two Mutable Borrows)

```prismio
let mut data = [1, 2, 3]

let a = &mut data
// let b = &mut data    // ❌ Compile error: cannot have two mutable borrows
a[0] = 99
```

### Borrow Scope Ends at Last Use

The borrow checker is smart: a borrow's scope ends at its **last use**, not at the end of the enclosing block. This makes many patterns that look risky actually safe:

```prismio
let mut s = "hello"

let r1 = &s
let r2 = &s
println(r1)      // last use of r1
println(r2)      // last use of r2
// r1 and r2 borrows are OVER here

let r3 = &mut s  // ✅ safe — immutable borrows are gone
r3.append("!")
println(s)       // "hello!"
```

---

## Borrowing and Loops

When iterating over a collection, you often want to borrow elements rather than consume them:

```prismio
let words = ["one", "two", "three"]

// Immutable iteration — borrows each element
for word in &words {
    println(word)
}

// words is still owned and usable
println("Count: ${words.length}")
```

### Mutable Iteration

```prismio
let mut prices = [100, 200, 300]

// Apply 10% discount in-place
for price in &mut prices {
    *price = (*price * 9) / 10
}

println(prices)   // [90, 180, 270]
```

---

## Borrowing Struct Fields

You can borrow individual fields of a struct:

```prismio
struct User {
    name: String
    age: Int
}

fn printName(name: &String) {
    println("Name: ${name}")
}

fn main() {
    let user = User(name: "Alice", age: 30)
    printName(&user.name)    // borrow just the name field
    println(user.age)        // ✅ rest of user is fine
}
```

Prismio's borrow checker tracks field-level borrows, so you can borrow different fields of the same struct simultaneously:

```prismio
struct Rectangle {
    width: Float
    height: Float
}

fn main() {
    let mut rect = Rectangle(width: 10.0, height: 5.0)

    let w = &rect.width
    let h = &rect.height    // ✅ different fields — both borrows are fine
    println("${w} x ${h}")
}
```

---

## Borrow vs Move vs Clone: When to Use Each

| Situation                          | Use          |
|------------------------------------|--------------|
| Read-only access, keep original    | `&T` borrow  |
| Read/write access, keep original   | `&mut T` borrow |
| Transfer value to another owner    | Move (default) |
| Need two independent copies        | `.clone()`   |
| Cheap stack value (Int, Bool, etc.)| Copy (auto)  |

```prismio
fn analyse(data: &[Float]) -> Float {
    // Read-only — borrow is perfect
    let sum = data.reduce(0.0) { acc, x -> acc + x }
    return sum / Float(data.length)
}

fn normalise(data: &mut [Float]) {
    // Mutating in-place — mutable borrow
    let max = data.max()
    for v in &mut data {
        *v = *v / max
    }
}

fn main() {
    let mut readings = [4.0, 8.0, 2.0, 10.0, 6.0]

    let avg = analyse(&readings)
    println("Average: ${avg}")   // ✅ readings still usable

    normalise(&mut readings)
    println(readings)             // [0.4, 0.8, 0.2, 1.0, 0.6]
}
```

---

## Interior Mutability

Sometimes you need to mutate data through an immutable reference — for example, in shared state scenarios. Prismio provides `Cell<T>` and `RefCell<T>` for **interior mutability**, moving borrow checks to runtime in a controlled way.

> 🚧 **Coming Soon** – `Cell` and `RefCell` are planned as part of the standard library. The API shown below reflects the intended design.

```prismio
import std.cell.RefCell

fn main() {
    let shared = RefCell(42)

    let r1 = shared.borrow()       // immutable runtime borrow
    println(*r1)                   // 42
    // r1 dropped here

    let mut r2 = shared.borrowMut()  // mutable runtime borrow
    *r2 = 100
    // r2 dropped here

    println(*shared.borrow())      // 100
}
```

---

## Summary

| Borrow Type       | Syntax      | Readable? | Writable? | Simultaneous? |
|-------------------|-------------|-----------|-----------|---------------|
| Immutable borrow  | `&T`        | ✅ Yes    | ❌ No    | ✅ Many       |
| Mutable borrow    | `&mut T`    | ✅ Yes    | ✅ Yes   | ❌ Only one   |

The borrow system is Prismio's compile-time proof that your data is always accessed safely. Once you learn to think in borrows, you'll find it guides you naturally toward correct, efficient code.

---

## See Also

- [Ownership](./ownership.md)
- [References](./references.md)
- [Lifetimes](./lifetimes.md)
- [Types](../types.md)
