---
title: Ownership and borrowing
description: Move-only values, default borrows, sink transfers, inout mutation, drop, and loop restrictions in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [ownership, borrowing, move, sink, inout]
related: [language/functions, language/annotations, specification/memory-model, errors/use-after-move]
---

Ownership determines which binding is responsible for move-only data and when an operation may read, mutate, transfer, or destroy it. Prismio 0.1 applies these checks without source-level reference syntax.

Strings, lists, and structs are move-only. Optional wrappers around owned reference-shaped values preserve that ownership. Scalars, raw pointer values, fieldless enums, and arrays are copied as values in the current model.

| Operation | Copy value | Move-only value |
| --- | --- | --- |
| Assign to a new owned binding | copy | move |
| Pass to an ordinary parameter | copy | borrow |
| Pass to `sink` | copy-like call value | move |
| Pass to `inout` | mutable access | exclusive mutable borrow |
| `drop(value)` | rejected | consumes owned value |

The compiler tracks a move-only binding and rejects later reads after ownership transfers.

## Moves

Assignment to a new owned location moves a string, list, or struct:

<!-- prismio-check: fail -->
```prismio
import std.io

struct Record { id: Int }

fn main() -> Int {
    let first = Record { id: 3 }
    let second = first
    println(second.id)
    return first.id
}
```

The initializer for `second` transfers the record. The original `first` binding remains in lexical scope, but its state is moved and it cannot be read.

Moves also occur when a value is stored into an owning struct field, inserted into an owning list, passed to a `sink` parameter, or explicitly dropped. `mut` controls reassignment; it does not make a moved value readable again.

## Borrow by default

Passing a move-only value to an ordinary parameter borrows it. The caller can use the value after the call.

<!-- prismio-check: pass -->
```prismio
struct Box { value: Int }
fn read(box: Box) -> Int { return box.value }

fn main() -> Int {
    let box = Box { value: 7 }
    let first = read(box)
    let second = read(box)
    return second - first
}
```

The signature contains no `borrow` keyword for ordinary Prismio functions. Borrowing is the default parameter behavior for move-only values, and the caller writes no `&` operator.

A borrowed parameter may inspect its value and pass another borrow to an ordinary parameter. It cannot transfer ownership into a new owning location, send the value to `sink`, or call `drop` on the borrowed owner.

This call-scoped rule is narrower than a general reference/lifetime system. Prismio 0.1 does not let a function return a reference to its parameter or store a first-class borrow for later use.

## Transfer with sink

A `sink` parameter takes ownership. Assignment into another owned location and insertion into an owned list can also move a value.

<!-- prismio-check: fail -->
```prismio
struct Box { value: Int }
fn take(sink box: Box) -> Int { return box.value }

fn main() -> Int {
    let box = Box { value: 7 }
    take(box)
    return box.value
}
```

The final read is rejected as a use of a moved value.

A consuming function should use `sink` even if its current body only reads the value. The signature is the caller-visible ownership contract and leaves the callee free to store or destroy the value later without silently changing call-site semantics.

<!-- prismio-check: pass -->
```prismio
struct Packet { code: Int }

fn release(sink packet: Packet) -> Int {
    return packet.code
}

fn main() -> Int {
    let packet = Packet { code: 5 }
    return release(packet) - 5
}
```

## Mutate with inout

An `inout` parameter is an exclusive mutable borrow. Mutations are visible to the caller, which retains ownership.

<!-- prismio-check: pass -->
```prismio
struct Box { value: Int }
fn bump(inout box: Box) { box.value = box.value + 1 }

fn main() -> Int {
    let box = Box { value: 9 }
    bump(box)
    return box.value - 10
}
```

An `inout` call is synchronous and call-scoped in the current language. There is no first-class mutable-reference value that can escape the function. The compiler uses the parameter mode to reject operations inconsistent with the borrow.

## Owned fields and collections

Building an aggregate transfers its move-only components into the aggregate:

```prismio
struct Envelope { body: String }

let text = "payload"
let envelope = Envelope { body: text }
```

After construction, `envelope` owns the string and `text` is moved. Similarly, `list_push(items, value)` transfers a move-only element into the list. `list_get` follows borrowing behavior for owned elements in the current compiler; there is no general move-out iterator.

Be explicit about ownership at API boundaries. A read-only helper should accept an ordinary parameter. A state-changing helper should use `inout`. An operation that takes responsibility for storage or destruction should use `sink`.

## Drop

`drop(value)` explicitly consumes a currently owned move-only value. Dropping a borrowed value, a copied scalar/array, or an already moved value is rejected.

<!-- prismio-check: pass -->
```prismio
struct Resource { handle: Int }

fn main() -> Int {
    let resource = Resource { handle: 3 }
    drop(resource)
    return 0
}
```

`drop` communicates early end of ownership to the compiler/runtime. It is not a destructor method dispatch, and user-defined destructor declarations are not available in 0.1.

## Scope exit and cleanup

The compiler and runtime manage supported move-only values at scope exit according to current lowering and allocation-inference decisions. A value already moved or dropped must not be destroyed again.

A value produced by a call and consumed directly as an argument -- `simulate(band(x))` -- has no name to hang a scope-exit release on, so it is released immediately after the enclosing call returns. That is the same point a borrow ends: the callee borrowed it for the duration of the call and the caller remained its owner throughout. Binding the result to a `let` first is equivalent and releases at scope exit instead.

The release is withheld where it cannot be proven safe -- when the callee may hand the argument back through its own return value, when the call crosses a foreign boundary whose contract governs the result, and for a `spawn`ed call, whose task may still be running. In those cases the value is kept rather than freed.

The experimental Allocation Inference Framework may choose stack, region, reference-counted, or traced strategies based on analysis and annotations. These strategies are implementation mechanisms; they do not remove source-level ownership rules.

Prismio 0.1 should not yet be described as having a complete formally proven borrow checker or universal leak-freedom guarantee. Foreign code, raw pointers, experimental allocation tiers, and incomplete semantics remain boundaries where contracts matter.

## Loops and conditional moves

Moving an outer binding from within a loop is rejected because later iterations could observe it as moved. Prismio 0.1 has no explicit reference syntax, borrow blocks, user-written lifetimes, or general flow-sensitive alias model.

<!-- prismio-check: fail -->
```prismio
import std.io

struct Work { id: Int }
fn consume(sink work: Work) -> Int { return work.id }

fn main() -> Int {
    let work = Work { id: 1 }
    for index in 0..2 {
        consume(work)
        println(index)
    }
    return 0
}
```

Even though application logic might intend only one consuming path, the loop can execute more than once. Transfer ownership outside the loop or restructure the data so each iteration owns a distinct value.

Branch-sensitive move checking exists where supported by semantic analysis, but do not assume a fully general alias or path theorem. Prefer simple, visible ownership flows.

## Foreign ownership

`extern fn` declarations can attach contracts such as `borrow`, `retain`, `consume`, `out`, `alias`, and `produce(free_fn)`. Those contracts tell the compiler how ownership crosses an ABI boundary, but Prismio cannot verify the foreign implementation. A wrong declaration can cause leaks, use-after-free, or double destruction despite valid Prismio source.

## Rules summary

- Strings, lists, and structs are move-only; scalars, enums, raw pointer values, and arrays copy.
- Ordinary parameters borrow move-only values.
- `sink` transfers ownership to the callee.
- `inout` grants temporary mutable access while the caller retains ownership.
- Assignment into another owned location and list insertion can move a value.
- `drop` consumes a currently owned move-only value.
- A moved or dropped binding cannot be read.
- An outer move-only binding cannot be consumed inside a repeating loop when later iterations could reuse it.
- There is no source-level `&`, general reference type, or user-written lifetime syntax.

See the [memory model](/specification/memory-model) for specification language and the [ownership error index](/errors) for repair-oriented examples.
