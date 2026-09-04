---
title: "Tutorial: model owned data"
description: Define a struct, pass it by borrow, and transfer it explicitly with a sink parameter.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [tutorial, structs, ownership, sink]
related: [language/structs, language/ownership-and-borrowing, language/functions]
---

This tutorial models a message as owned data, reads it through a default borrow, and then transfers it to a consuming function. It shows why parameter modes are part of an API contract rather than call-site punctuation.

Struct, string, and list values are move-only. Ordinary parameters borrow these values; a `sink` parameter consumes them.

## Define the model

```prismio
struct Message {
    text: String
}
```

`Message` is a nominal type with one owned string field. Constructing a `Message` transfers the initializer string into that field. Two structs with the same fields would still be different nominal types.

## Borrow for observation

```prismio
fn show(message: Message) -> Int {
    println(message.text)
    return 0
}
```

The ordinary `message: Message` parameter borrows because `Message` is move-only. `show` may inspect it, but the caller remains responsible for the value after the call.

## Consume deliberately

```prismio
fn consume(sink message: Message) -> Int {
    println(message.text)
    return 0
}
```

Adding `sink` changes the contract: ownership moves into `consume`. A real consuming function could store or drop the message without surprising its caller.

## Put the pieces together

<!-- prismio-check: pass -->
```prismio
import std.io

struct Message {
    text: String
}

fn show(message: Message) -> Int {
    println(message.text)
    return 0
}

fn consume(sink message: Message) -> Int {
    println(message.text)
    return 0
}

fn main() -> Int {
    let message = Message { text: "hello" }
    show(message)
    consume(message)
    return 0
}
```

Expected output:

```text
hello
hello
```

`show(message)` borrows, so the subsequent consuming call is legal. `consume(message)` moves; the caller must not access `message` afterward.

Using `message` after `consume(message)` is a compile-time error. There is no user-visible reference operator in 0.1; borrowing is expressed by the parameter mode.

## Observe the compiler check

Add one more call after `consume`:

<!-- prismio-check: fail -->
```prismio
import std.io

struct Message { text: String }
fn consume(sink message: Message) { println(message.text) }

fn main() -> Int {
    let message = Message { text: "hello" }
    consume(message)
    println(message.text)
    return 0
}
```

The compiler rejects the field read as use after move. Adding `mut` would not help: mutability controls reassignment, while ownership controls whether a value is still present.

## Add mutable borrowing

Struct fields can be changed through an `inout` parameter while the caller keeps ownership:

<!-- prismio-check: pass -->
```prismio
struct Counter { value: Int }

fn increment(inout counter: Counter) {
    counter.value = counter.value + 1
}

fn read(counter: Counter) -> Int {
    return counter.value
}

fn main() -> Int {
    let counter = Counter { value: 40 }
    increment(counter)
    increment(counter)
    return read(counter) - 42
}
```

`inout` is exclusive mutable borrowing for the call. It does not transfer the struct and requires no `&mut`-style operator at the call site.

## Ownership checklist

- Use an ordinary parameter for read-only access to a move-only value.
- Use `inout` when changes should be visible to the caller.
- Use `sink` when the callee becomes the owner.
- Use `drop(value)` to end ownership explicitly and early.
- Do not reuse a binding after assignment into another owner, list insertion, `sink`, or `drop`.

These rules also apply when `Message` is wrapped in `Message?` or stored inside a list. Read [ownership and borrowing](/language/ownership-and-borrowing) for the complete reference.
