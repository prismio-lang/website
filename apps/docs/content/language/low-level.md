---
title: Low-level programming
description: Memory through an integer address, volatile and atomic access, inline assembly, x86 port I/O, export, naked and section on functions, and repr(C) and packed on structs, for code that talks to hardware.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-14"
tags: [low-level, volatile, atomics, assembly, repr-c, packed, export, naked, freestanding]
related: [guides/freestanding, stdlib/raw, stdlib/port, stdlib/asm, stdlib/mem, language/ffi, language/types, language/structs, language/functions, language/annotations]
---

Most programs never need anything on this page. It is for code that reads and writes a device register, takes a lock, runs an instruction the language has no syntax for, or lays a structure out the way hardware expects. The usual place to need all of it at once is a kernel: see [freestanding programs](/guides/freestanding).

It is **experimental**: the spellings may change before 1.0. There is no `unsafe` block yet, and a mistake in any of this is the same mistake it is in C.

None of it is a language keyword. It lives in three standard-library modules that call nothing in the C runtime, so a [freestanding](/guides/freestanding) kernel can import all of them: [`std.raw`](/stdlib/raw) for memory, volatile and atomic access and addresses, [`std.port`](/stdlib/port) for x86 port I/O, and [`std.asm`](/stdlib/asm) for inline assembly. (The `__builtin_*` names these wrap are the standard library's own and are refused in a program.)

To **allocate** memory to point at, rather than reach memory that is already there, use [`std.mem`](/stdlib/mem): `alloc` and `free` for blocks you manage yourself, a bounds-checked `Buffer` for binary data, and an `Arena`. Its `a.loadU32()` and `a.storeU32(v)` methods are the plain loads and stores below under a shorter name.

## Memory through an address

An address is a `Usize`: a number as wide as a pointer on the target. `Ptr` stays an opaque handle for foreign code, with no arithmetic. The two convert in exactly two places:

| Function | Meaning |
|---|---|
| `addressOf(p: Ptr) -> Usize` | The address a `Ptr` holds. |
| `pointerAt(a: Usize) -> Ptr` | A `Ptr` at an address. |

The width is in the name, because a device register is read at exactly its width and a wider read of the neighbouring byte is a bus error. Each family comes in `U8`, `U16`, `U32` and `U64`, and the value is the unsigned type of that width:

| Function | Meaning |
|---|---|
| `loadU32(address)` | A plain load, from `std.mem`. The compiler may drop, merge or reorder it. |
| `storeU32(address, value)` | A plain store, from `std.mem`. |
| `volatileLoadU32(address)` | A **volatile** load: never dropped, merged or reordered against another volatile access. |
| `volatileStoreU32(address, value)` | A volatile store. Two to one address are two stores. |
| `unalignedLoadU32(address)` | A load at **any** alignment, of memory used only as bytes (`U16`, `U32`, `U64`). |
| `unalignedStoreU32(address, value)` | A store at any alignment, of memory used only as bytes. |

```prismio
import std.raw

// QEMU `virt`'s UART: each store has to reach the device.
fn put(c: U8) {
    volatileStoreU32(0x09000000, c as U32)
}
```

Every access but the unaligned ones is naturally aligned; an address that is not is undefined behaviour, as it is in C. The unaligned ones take any address, and in return the compiler assumes the memory is byte storage, such as a [`Buffer`](/stdlib/mem)'s bytes or a block from `alloc`, and never also a struct field or a `Vec` element it reads as another type. That assumption is what lets a loop of byte writes keep everything else in registers. A literal argument adopts the width, so `volatileStoreU8(0x1000, 65)` is a `U8`, and a `U32` variable passed for a `U8` is refused rather than truncated.

## Typed pointers: `Ptr<T>`

A `Ptr<T>` is a pointer to a `T` that is **never null**, one machine word wide. An absent one is `Ptr<T>?`, which costs nothing extra. What a pointer may do is written in front of what it points at:

| Type | Meaning |
|---|---|
| `Ptr<T>` | Read only. |
| `Ptr<mut T>` | May write: `p.field = v`, and `p.store(v)` for a scalar. |
| `Ptr<volatile T>` | Every access is volatile: a read, a write, a field, an operand. |
| `Ptr<mut volatile T>` | Both, in either order. |

`T` is plain data: a number, `Bool`, `Char`, an enum, another pointer, or a struct made of those. `Ptr<String>` and a pointer to a struct that holds a `Vec` are refused, because a pointer moves bytes in and out of memory that nothing releases. A struct may hold a pointer to itself: `next: Ptr<Node>?`.

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

`p.magic` is one load at the field's own alignment. `p + 1` is the value plus one, never the next address, so a pointer cannot be stepped by accident. `p.load()` reads a scalar outright, `let n: Int = p` and passing `p` to an `Int` parameter read it too, and a field that is itself a struct is a pointer to it, so `packet.header.magic` reads through two. Two pointers under one operator are an error, because `p == q` could mean where they point or what they hold.

Only a `Ptr<mut T>` writes. `ro.value = 1` through a read-only `Ptr<T>` is an error that names the `Ptr<mut T>` to take, `p = 5` is an error that points at `p.store(5)` (it would replace the pointer, not the value), and a field that is itself a struct is written a field at a time, not assigned whole.

The compiler uses the type: a `Ptr<T>` parameter is known to be non-null, aligned for `T`, readable for `sizeof T` bytes, and not written through unless it is `mut`, which lets it keep values in registers and move loads earlier. A `Ptr<mut T>` becomes a `Ptr<T>`, and becomes the opaque `Ptr` that foreign code takes; a read-only `Ptr<T>` does not, because foreign code may write through an opaque one.

A pointer's address and its motion are methods, never operators, so `p + 1` cannot be mistaken for stepping:

| Method | Meaning |
|---|---|
| `p.addr` | Where it points, as a `Usize`. A property. |
| `p.offset(n)` | `n` elements on (`inbounds`). A 12-byte struct steps 12 bytes. |
| `p.byteOffset(n)` | `n` bytes on. |
| `p.wrappingOffset(n)` | `n` elements on without the `inbounds` promise, for a ring buffer. |
| `p.offsetFrom(q)` | Elements from `q` to `p`, as an `Int`. |
| `p.isAligned(a)` | Whether the address is a multiple of `a`, a power of two. |
| `p.sameAs(q)` | Whether both point at the same place. `p == q` is refused, because it could mean this or the values. |
| `p.advance(n, limit)` | `n` elements on, or `none` rather than pass `limit` going that way. One past `limit` is allowed. |

A pointer is made from something that is not one with four functions of `std.raw`, and a file that has not written `import std.raw` cannot call them. That import is the `unsafe` marker:

| Function | Meaning |
|---|---|
| `Ptr<T>.at(address)` | A `Ptr<T>?`: `none` for 0 or an address a `T` cannot sit at. |
| `Ptr<T>.atUnchecked(address)` | A `Ptr<T>`, trusting the address. |
| `Ptr<U>.cast(p)` | The same address as another type. A read-only pointer cannot become a `Ptr<mut U>`. |
| `Ptr<U>.castAligned(p)` | A `Ptr<U>?`, `none` when `p`'s address cannot hold a `U`. |

A `Ptr<T>?` has no flow narrowing: unwrap it with `expect(p)` or `p ?? fallback`.

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

`p.readVolatile()` and `p.writeVolatile(v)` are the one-off forms. `p.atomicLoad(order)`, `atomicStore`, `atomicSwap`, `atomicAdd`, `atomicSub`, `atomicAnd`, `atomicOr`, `atomicXor` and `atomicCompareExchange` are the atomic ones, with the ordering written at the call as a variant of `AtomicOrder` ([`std.raw`](/stdlib/raw)). A pointer is not promised readable for its whole size when it is `volatile`, since a device register is not memory a load may be moved past; a plain `Ptr<T>` is, and the compiler uses that.

**Not available yet:** a checked `Slice` view. A pointer also comes from foreign code (`extern fn calloc(count: Usize, size: Usize) -> Ptr<mut Header>`). A typed pointer is still unchecked for use after free and for bounds: it removes null, accidental writes and accidental stepping, not a dangling address.

## Byte order and Float bits

| Function | Meaning |
|---|---|
| `swapBytes(x)` | `x` with its bytes in reverse order, for a `U16`, `U32` or `U64`; one instruction (`rev`, `bswap`) |
| `x.bits` | the 64 bits of a `Float`, as a `U64` |
| `Float.fromBits(b: U64)` | the `Float` with those bits |

```prismio
import std.raw

let wire = swapBytes(0x12345678 as U32)    // 0x78563412
let bits = 1.0.bits                        // 0x3FF0000000000000
```

## Atomics

Atomic operations are sequentially consistent, and come in `U8`, `U16`, `U32` and `U64`:

| Function | Answers |
|---|---|
| `atomicLoadU32(address)` | the value |
| `atomicStoreU32(address, value)` | nothing |
| `atomicSwapU32(address, value)` | the old value |
| `atomicAddU32`, `atomicSubU32`, `atomicAndU32`, `atomicOrU32`, `atomicXorU32` `(address, value)` | the old value |
| `atomicCompareExchangeU32(address, expected, desired)` | the value that was there; the swap happened if it equals `expected` |
| `fence()` | nothing; a full barrier |

```prismio
import std.raw

// A spinlock taken and released.
fn lock(word: Usize) {
    while (atomicCompareExchangeU32(word, 0, 1) != 0) {}
}

fn unlock(word: Usize) {
    atomicStoreU32(word, 0)
}
```

## Inline assembly

```prismio
import std.asm

asm("nop")
asmWrite("msr tpidr_el0, $0", 12345)
let el: U64 = asmRead("mrs $0, CurrentEL")
```

| Function | Meaning |
|---|---|
| `asm(text)` | Run the instructions. Memory is treated as clobbered, so a load or store is never moved across it. |
| `asmRead(text) -> U64` | Run them; `$0` is the result. |
| `asmWrite(text, value: U64)` | Run them; `$0` is the operand. |

The text must be a **string literal**, because it is part of the instruction stream; this is why the three are the one place `std` declares a function the compiler lowers where it is written instead of calling. It is in LLVM's inline-assembly syntax (AT&T on x86): `$$` writes a literal `$`, and `\n` separates instructions. Registers other than `$0` are yours to preserve; these functions do not declare clobbers.

On x86, `in` and `out` name their registers, so they are functions of their own in `std.port` and are refused on any other target:

| Function | Meaning |
|---|---|
| `portOutU8(port: U16, value: U8)` | `outb`. Also `portOutU16` (`outw`) and `portOutU32` (`outl`). |
| `portInU8(port: U16) -> U8` | `inb`. Also `portInU16` and `portInU32`. |

## Function modifiers

These stand before `fn`, in any order, after a visibility marker:

| Modifier | Effect |
|---|---|
| `export` | The function is also reachable under its source name, the symbol an assembler stub, a C file or a linker script writes. Give it parameters of numbers and `Ptr`; a `String` is not a C string. |
| `naked` | No prologue or epilogue, and never inlined. The body is `asm`; locals and calls in it are your problem. |
| `section("name")` | The object-file section the function's code goes in, which a linker script names. |
| `align(n)` | The function's alignment in bytes, a power of two. |

```prismio
export naked section(".text.boot") fn _start() {
    asm("ldr x0, =__stack_top\nmov sp, x0\nbl main\n1: wfi\nb 1b")
}
```

`export` is an alias beside the function, not a rename, so every call inside the program still works and the function is kept alive when nothing in Prismio calls it. The words are contextual, so a variable called `export` still compiles.

A function body is the only place assembly can emit data, such as a table or a note: the function is never called and the data is the asm text.

## Struct layout

The compiler chooses the order of an ordinary struct's fields. That is right for a program's own data and wrong for a descriptor table, a page-table entry or a wire format. Two markers before `struct` take the choice away:

| Marker | Layout |
|---|---|
| `repr(C)` | Fields in the order written, with C's alignment and padding. |
| `packed` | Fields in the order written and no padding at all. |
| `repr(C) packed` | Both; the same layout as `packed`. |

```prismio
repr(C) struct Gate {
    flags: U8,
    offset: U32,
    selector: U16,
}

packed struct Wire {
    tag: U8,
    word: U32,
}
```

`Gate` is `{ i8, i32, i16 }` with padding after `flags` and `selector`; `Wire` is five bytes. `repr` takes only `C`. `Bool` is not a byte in memory the way C's `bool` is (see [foreign globals](/language/ffi)), so declare a flag that hardware reads as `U8`.

You cannot yet take the address of a field or ask for a type's size, so a `repr(C)` struct is for layout you can reason about and for passing to C, not for pointing a register at.

## Diagnostics

| Code | Message |
|---|---|
| `P4001` | `no overload of `volatileStoreU8` accepts these argument types` (a value of the wrong width) |
| `P4001` | `the assembly text of `__builtin_asm` must be a string literal` |
| `P4001` | `no overload of `atomicCompareExchangeU32` accepts these argument types` (the wrong number of arguments) |
| `P4001` | `` `portOutU8` is an x86 instruction, and the target is `aarch64-unknown-none-elf` `` |
| `P4001` | `` `__builtin_string_len` is internal to the standard library `` (any `__builtin_*` in a program) |
| `P3201` | `section takes the section's name as a string literal`; `repr takes C`; `align takes a power of two` |
