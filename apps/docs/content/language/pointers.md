---
title: Pointers
description: "Ptr<T>, the typed pointer: never null, read through by default, written only through Ptr<mut T>, with volatile and atomic access and explicit stepping."
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-22"
tags: [pointers, ptr, volatile, atomics, low-level, ffi, std.raw]
related: [language/low-level, language/ffi, language/types, language/structs, language/generics, stdlib/raw, stdlib/mem, guides/freestanding]
---

Most Prismio programs never hold a pointer: a `Vec`, a `String` or a struct is a value the language manages. A pointer is for the places where you are handed an address, or have to make one: a device register, a header inside a buffer, a block a C function returned, a lock word shared between threads.

It is **experimental**: the spellings may change before 1.0. A typed pointer removes null, accidental writes and accidental stepping. It does not remove a dangling address or an index past the end of a block; those are as undefined as they are in C.

## Two kinds of pointer

| Type | Meaning |
|---|---|
| `Ptr` | An opaque handle for foreign code. No pointee, no arithmetic, no reads. |
| `Ptr<T>` | A pointer to a `T` that is **never null**, one machine word wide, that Prismio code can read through. |

An absent typed pointer is `Ptr<T>?`, which costs nothing extra. A `Ptr<T>?` has no flow narrowing: unwrap it with `expect(p)` or `p ?? fallback`.

What a pointer may do is written in front of what it points at:

| Type | Meaning |
|---|---|
| `Ptr<T>` | Read only. |
| `Ptr<mut T>` | May write: `p.field = v`, and `p.store(v)` for a scalar. |
| `Ptr<volatile T>` | Every access is volatile: a read, a write, a field, an operand. |
| `Ptr<mut volatile T>` | Both, in either order. |

`T` is plain data: a number, `Bool`, `Char`, an enum, another pointer, an inline `Array<U8, N>`, or a struct made of those. `Ptr<String>` and a pointer to a struct that holds a `Vec` are refused, because a pointer moves bytes in and out of memory that nothing releases. A struct may hold a pointer to itself: `next: Ptr<Node>?`.

## Reading and writing

A pointer is **read through** where a value is wanted, and is a pointer everywhere else. There is no `*p` and no `p->field`:

<!-- prismio-check: pass -->
```prismio
repr(C) struct Header {
    magic: U32,
    length: U32,
    flags: U16,
}

fn verify(p: Ptr<Header>) -> Bool {
    if p.magic != 0x5052534D { return false }
    return p.length > 0
}

fn next(counter: Ptr<Int>) -> Int {
    let copy = counter          // still a pointer
    return copy + 1             // the value, plus one
}

fn third(items: Ptr<Int>, end: Ptr<Int>) -> Int {
    // Three elements on, if that stays inside `end`: `none` otherwise, never a stray pointer.
    let found = items.advance(2, end)
    if found == none { return -1 }
    return expect(found).load()
}

fn reset(p: Ptr<mut Header>, counter: Ptr<mut Int>) {
    p.magic = 0x5052534D        // a store at the field's own width
    p.length = p.length + 1     // `+=` needs a plain variable, as for any field
    counter.store(0)            // a scalar is written with `store`
}

fn main() -> Int {
    return 0
}
```

`p.magic` is one load at the field's own alignment. `p + 1` is the value plus one, never the next address, so a pointer cannot be stepped by accident. `p.load()` reads a scalar outright, `let n: Int = p` and passing `p` to an `Int` parameter read it too, and a field that is itself a struct is a pointer to it, so `packet.header.magic` reads through two.

Two pointers under one operator are an error, because `p == q` could mean where they point or what they hold: use `p.sameAs(q)` for the first and `p.load() == q.load()` for the second.

Only a `Ptr<mut T>` writes. `ro.value = 1` through a read-only `Ptr<T>` is an error that names the `Ptr<mut T>` to take, `p = 5` is an error that points at `p.store(5)` (it would replace the pointer, not the value), and a field that is itself a struct is written a field at a time, not assigned whole.

## What the compiler assumes

What the compiler tells the optimiser about a `Ptr<T>` parameter is only what is always true of it:

- it is **not null**;
- it is **aligned** for a `T`;
- unless it is `mut`, the function **does not write** through it, which lets it keep values in registers and move loads earlier.

It does **not** assume the pointer may be read early. A pointer may point one past the end of its block (`p.offset(count)`, or the `limit` you give `advance`), and passing one is fine. And it does not assume that two pointers of different types are apart: `cast` can make a `Ptr<Float>` and a `Ptr<U64>` the same bytes, so a write through one is always seen by a read through the other.

A `Ptr<mut T>` becomes a `Ptr<T>`, and becomes the opaque `Ptr` that foreign code takes. A read-only `Ptr<T>` does not become `Ptr`, because foreign code may write through an opaque one; and a volatile pointer never does, so a C function that writes a register is declared with a `Ptr<mut volatile T>` parameter.

## Where a pointer comes from

From foreign code, as a return type or a parameter:

```prismio
extern fn calloc(count: Usize, size: Usize) -> Ptr<mut Header>
```

From a [`Buffer`](/stdlib/mem) (`buffer.pointer`) or a block from `alloc`, which hand out typed pointers into memory they own.

Or from an address, with the functions below. A file that has not written `import std.raw` cannot call them, and that import is the `unsafe` marker:

| Function | Meaning |
|---|---|
| `Ptr<T>.at(address)` | A `Ptr<T>?`: `none` for 0 or an address a `T` cannot sit at. |
| `Ptr<T>.atUnchecked(address)` | A `Ptr<T>`, trusting the address. |
| `Ptr<U>.cast(p)` | The same address as another type. Refused when `U` needs stricter alignment than the pointee promises (a `Ptr<U8>` is not a `Ptr<U64>`), when it would add `mut` to a read-only pointer, or when it would drop `volatile`. |
| `Ptr<U>.castAligned(p)` | A `Ptr<U>?`, `none` when `p`'s address cannot hold a `U`. The way from bytes to a wider type. |
| `Ptr<U>.castUnchecked(p)` | A `Ptr<U>`, on your word that the address is aligned for a `U`. |

<!-- prismio-check: pass -->
```prismio
import std.raw

fn word(p: Ptr<U8>) -> U32? {
    // A byte pointer is only a `Ptr<U32>` if its address says so.
    let wide = Ptr<U32>.castAligned(p)
    if wide == none { return none }
    return expect(wide).load()
}

fn main() -> Int {
    return 0
}
```

## Moving a pointer

A pointer's address and its motion are methods, never operators, so `p + 1` cannot be mistaken for stepping. The ones that cannot leave the block you hand them need no import:

| Method | Meaning |
|---|---|
| `p.addr` | Where it points, as a `Usize`. A property. |
| `p.advance(n, limit)` | `n` elements on, or `none` rather than pass `limit` going that way. One past `limit` is allowed. |
| `p.offsetFrom(q)` | Elements from `q` to `p`, as an `Int`. Defined only between pointers into one array, as C's subtraction is. |
| `p.isAligned(a)` | Whether the address is a multiple of `a`, a power of two. |
| `p.sameAs(q)` | Whether both point at the same place. |

The ones that step somewhere the compiler cannot vouch for need `import std.raw`, like the constructors above:

| Method | Meaning |
|---|---|
| `p.offset(n)` | `n` elements on (`inbounds`). A 12-byte struct steps 12 bytes. |
| `p.byteOffset(n)` | `n` bytes on. The result may not be aligned for what it points at. |
| `p.wrappingOffset(n)` | `n` elements on without the `inbounds` promise, for a ring buffer. |

Without the import, `p.offset(1)` is an error whose note names `advance(n, limit)`.

<!-- prismio-check: pass -->
```prismio
import std.raw

fn sum(items: Ptr<Int>, count: Int) -> Int {
    let mut total = 0
    let mut cursor = items
    for i in 0..<count {
        total += cursor.load()
        cursor = cursor.offset(1)
    }
    return total
}

fn main() -> Int {
    return 0
}
```

## Volatile and atomic access

A **volatile pointer** is how a device is written. Every access through a `Ptr<volatile T>` is volatile, including a field read, a field write and a struct inside it, so a driver cannot write one register access the optimiser may drop or hoist out of a loop:

<!-- prismio-check: pass -->
```prismio
import std.raw

repr(C) struct Uart {
    data: U32,
    status: U32,
}

fn send(uart: Ptr<mut volatile Uart>, byte: U8) {
    uart.status = 0x20                  // a volatile store
    if (uart.status & 0x20) == 0 { return }   // a volatile load, read again every time
    uart.data = byte as U32
}

fn counter(c: Ptr<mut Int>) -> Int {
    c.writeVolatile(1)                  // the one-off form, on a pointer that is not volatile
    return c.atomicAdd(1, AtomicOrder.AcqRel)   // the old value; see std.raw for the orderings
}

fn main() -> Int {
    return 0
}
```

`p.readVolatile()` and `p.writeVolatile(v)` are the one-off forms. `p.atomicLoad(order)`, `atomicStore`, `atomicSwap`, `atomicAdd`, `atomicSub`, `atomicAnd`, `atomicOr`, `atomicXor` and `atomicCompareExchange` are the atomic ones, with the ordering written at the call as a variant of `AtomicOrder` ([`std.raw`](/stdlib/raw)).

A volatile pointer stays volatile: it does not become the opaque `Ptr`, and `cast` takes it only to another volatile pointer.

## In generics

A function generic over the pointee takes `Ptr<T>` and solves `T` from the argument, and a `Ptr<mut T>` is accepted where a read-only `Ptr<T>` is wanted:

<!-- prismio-check: pass -->
```prismio
fn first<T>(p: Ptr<T>) -> T {
    return p.load()
}

fn main() -> Int {
    return 0
}
```

[`std.mem`](/stdlib/mem) uses this for its typed blocks: `alloc` reads the element size off the type.

## Not available

**A `Slice` view of a pointer.** A `Slice<T>` is a handle to a Prismio list header with an offset and a length, and every element access goes through that list, so a bare pointer and a count have nothing to be a view of. It needs a second view representation over foreign memory and the borrow rules for one, which is a design of its own. Until then, a pointer you step by hand (`advance` with a limit) is the bounded loop, and a `Buffer` is the checked container.

**`*p`, `p->field`, `&x`.** You cannot take the address of a local, and a pointer never converts from an `Int`. Addresses come from foreign code, an allocator, or `std.raw`.

**Checks for a dangling pointer or an index past the end.** A typed pointer is unchecked for use after free and for bounds.

## Diagnostics

| Code | Message |
|---|---|
| `P4001` | ``cannot write through `Ptr<H>`, which is read-only`` (take a `Ptr<mut H>`) |
| `P4001` | ``cannot assign Int to `Ptr<mut Int>`: that would replace the pointer`` (write it with `p.store(value)`) |
| `P4001` | ``a pointer cannot point at String, which owns memory`` |
| `P4001` | ``both operands of `==` are pointers`` (`p.sameAs(q)` compares where they point, `p.load()` what they point at) |
| `P4001` | ``` `offset` steps a pointer somewhere the compiler cannot vouch for, which is `std.raw`'s: add `import std.raw` ``` |
| `P4001` | ``cannot cast `Ptr<mut U8>` to `Ptr<mut U64>`: `U64` needs 8-byte alignment, and `U8` promises 1`` (use `castAligned` or `castUnchecked`) |
| `P4001` | ``cannot cast `Ptr<mut volatile U32>` to `Ptr<mut U32>`: it is volatile`` |
| `P4001` | ``no overload of `takes` accepts these argument types`` (a read-only `Ptr<T>` passed where the opaque `Ptr` is wanted) |
