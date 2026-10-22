---
title: Low-level programming
description: Memory through an integer address, volatile and atomic access, inline assembly, x86 port I/O, export, naked and section on functions, and repr(C) and packed on structs, for code that talks to hardware.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-14"
tags: [low-level, volatile, atomics, assembly, repr-c, packed, export, naked, freestanding]
related: [guides/freestanding, language/pointers, stdlib/raw, stdlib/port, stdlib/asm, stdlib/mem, language/ffi, language/types, language/structs, language/functions, language/annotations]
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

## Typed pointers

`Ptr<T>`, `Ptr<mut T>`, `Ptr<volatile T>` and their methods have a page of their own: [Pointers](/language/pointers). The volatile and atomic forms there are the ones a driver uses: every access through a `Ptr<mut volatile Uart>` is a volatile access, fields included, and `p.atomicAdd(1, AtomicOrder.AcqRel)` is an atomic read-modify-write.

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

`Gate` is `{ i8, i32, i16 }` with padding after `flags` and `selector`; `Wire` is five bytes, and `word` sits at offset 1, so it is read and written as four unaligned bytes. `repr` takes only `C`.

A field of a packed struct is a number, `Bool`, `Char`, an enum, a pointer, another packed struct or a byte array (`Array<U8, N>`). A `repr(C)` struct, an `Array<U32, N>` or a `U32?` inside one would be read at its own alignment through an address that does not have it, so each is refused; declare an inner struct `packed` as well. On a strict-alignment processor that would be a fault, and everywhere it is undefined. `Bool` is not a byte in memory the way C's `bool` is (see [foreign globals](/language/ffi)), so declare a flag that hardware reads as `U8`.

You cannot yet take the address of a field or ask for a type's size, so a `repr(C)` struct is for layout you can reason about and for passing to C, not for pointing a register at.

## Diagnostics

| Code | Message |
|---|---|
| `P4001` | `no overload of `volatileStoreU8` accepts these argument types` (a value of the wrong width) |
| `P4001` | `` `header` cannot be `Header` in a packed struct: its fields would be read at an address `Header` is not aligned to `` |
| `P4001` | ``cannot cast `Ptr<mut volatile U32>` to `Ptr<mut U32>`: it is volatile`` |
| `P4001` | `the assembly text of `__builtin_asm` must be a string literal` |
| `P4001` | `no overload of `atomicCompareExchangeU32` accepts these argument types` (the wrong number of arguments) |
| `P4001` | `` `portOutU8` is an x86 instruction, and the target is `aarch64-unknown-none-elf` `` |
| `P4001` | `` `__builtin_string_len` is internal to the standard library `` (any `__builtin_*` in a program) |
| `P3201` | `section takes the section's name as a string literal`; `repr takes C`; `align takes a power of two` |
