# Lifetimes

> 🚧 **Coming Soon** – Lifetime annotations are planned for a future version of Prismio. The syntax and semantics described here reflect the current design and may change before release. The borrow checker already enforces lifetime correctness for most code — explicit annotations will be required only for advanced use cases.

---

## What Are Lifetimes?

In Prismio, every reference has a **lifetime** — the span of the program during which the reference is guaranteed to be valid. Most of the time, the compiler can figure out lifetimes on its own. But in some situations — particularly when functions return references, or structs hold references — the compiler needs a little help.

**Lifetime annotations** are a way of making these relationships explicit, so the compiler can verify that no reference ever outlives the value it points to.

---

## The Problem Lifetimes Solve

Consider a function that returns a reference to one of its arguments:

```prismio
// Which input does the result reference? The compiler can't know.
fn longest(a: &String, b: &String) -> &String {
    if a.length > b.length { a } else { b }
}
```

The return value is either `a` or `b`, but the compiler doesn't know which. Without lifetime annotations, it cannot verify whether the returned reference will still be valid at the call site.

A dangling reference would look like this:

```prismio
fn main() {
    let result: &String

    {
        let s1 = "short"
        let s2 = "much longer string"
        result = longest(&s1, &s2)
    }   // s1 and s2 dropped here

    println(result)   // ❌ DANGER: result points to freed memory!
}
```

Lifetime annotations give the compiler enough information to catch this at compile time.

---

## Lifetime Annotation Syntax

> 🚧 **Coming Soon** – The syntax below is the planned design.

Lifetime parameters are introduced with a leading `'` (tick) and declared in angle brackets alongside type parameters:

```prismio
// 'a is a lifetime parameter
fn longest<'a>(a: &'a String, b: &'a String) -> &'a String {
    if a.length > b.length { a } else { b }
}
```

The annotation `&'a String` means *"a reference to a String that lives at least as long as `'a`"*.

By annotating both inputs and the output with `'a`, we tell the compiler: *"the returned reference will live no longer than the shorter of the two inputs."*

---

## Reading Lifetime Annotations

Lifetime annotations describe **constraints**, not actual durations. `<'a>` doesn't pin the reference to a specific time — it says: *"whatever concrete lifetime `'a` turns out to be at the call site, these references must all satisfy it."*

```prismio
fn firstWord<'a>(s: &'a String) -> &'a str {
    let words = s.split(" ")
    return words[0]
}
```

Here: the returned slice (`&'a str`) cannot outlive the input string (`&'a String`). The compiler will enforce this at every call site.

---

## Lifetime Elision

For the vast majority of functions, lifetime annotations can be **elided** (omitted) because the compiler applies a set of inference rules automatically:

**Rule 1:** Each reference parameter gets its own lifetime.

```prismio
// Written:
fn greet(name: &String) -> &String

// Expanded:
fn greet<'a>(name: &'a String) -> &'a String
```

**Rule 2:** If there is exactly one input lifetime, it is assigned to all output lifetimes.

**Rule 3:** If one of the input lifetimes is `&self` (a method receiver), its lifetime is assigned to all output lifetimes.

These rules cover the overwhelming majority of real-world functions, so you rarely need to write explicit lifetimes.

---

## Lifetimes in Structs

When a struct holds a reference, its lifetime must be annotated to ensure the struct doesn't outlive the data it references:

> 🚧 **Coming Soon** – This syntax is planned.

```prismio
struct Excerpt<'a> {
    text: &'a String
}

fn main() {
    let novel = "Call me Ishmael. Some years ago..."
    let first_sentence = novel.split(".")[0]

    let excerpt = Excerpt { text: &first_sentence }
    println(excerpt.text)
}
```

The `'a` on `Excerpt` ties the struct's validity to the lifetime of the string it references.

---

## The `'static` Lifetime

The special lifetime `'static` means *"valid for the entire duration of the program."* String literals are the most common example:

```prismio
let s: &'static String = "I live forever"
```

String literals are baked into the program binary, so they are always valid. Use `'static` deliberately — don't use it to silence lifetime errors without understanding the implications.

---

## Why Lifetimes Matter

Without lifetime checking:
- References can **outlive** the data they point to (dangling pointers)
- A returned reference might refer to a local variable that was already dropped
- Shared mutable state can silently corrupt data

With lifetime annotations:
- The compiler proves, statically, that every reference is valid for its entire use
- No runtime checks, no null pointer dereferences from dangling references
- Zero-cost: lifetimes exist only in the type system and vanish in compiled code

---

## Current Status

The Prismio compiler already enforces lifetime correctness **implicitly** for the most common patterns:

| Pattern | Status |
|---|---|
| Local borrows within a function | ✅ Fully enforced today |
| Borrows passed to functions | ✅ Fully enforced today |
| Returning references from functions | ✅ Inferred in simple cases |
| Explicit lifetime annotations (`'a`) | 🚧 In design phase |
| Lifetime annotations in structs | 🚧 In design phase |
| Higher-ranked trait bounds (HRTBs) | 🚧 Future consideration |

For current code, the compiler will guide you with clear error messages when a borrow doesn't satisfy lifetime requirements, even without explicit annotations.

---

## See Also

- [Ownership](./ownership.md)
- [Borrowing](./borrowing.md)
- [References](./references.md)
