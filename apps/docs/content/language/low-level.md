---
title: Low-level programming
description: Memory through an integer address, volatile and atomic access, inline assembly, x86 port I/O, export, naked and section on functions, and repr(C) and packed on structs, for code that talks to hardware.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-09"
tags: [low-level, volatile, atomics, assembly, repr-c, packed, export, naked, freestanding]
related: [guides/freestanding, stdlib/mem, language/ffi, language/types, language/structs, language/functions, language/annotations]
---

Most programs never need anything on this page. It is for code that reads and writes a device register, takes a lock, runs an instruction the language has no syntax for, or lays a structure out the way hardware expects. The usual place to need all of it at once is a kernel: see [freestanding programs](/guides/freestanding).

It is **experimental**: the spellings may change before 1.0. There is no `unsafe` block yet. These are compiler builtins whose names begin `__builtin_`, and a mistake in one is the same mistake it is in C.

To **allocate** memory to point at, rather than reach memory that is already there, use [`std.mem`](/stdlib/mem): `alloc` and `free` for blocks you manage yourself, a bounds-checked `Buffer` for binary data, and an `Arena`. Its `a.loadU32()` and `a.storeU32(v)` methods are the plain loads and stores below under a shorter name.

## Memory through an address

An address is a `Usize`: a number as wide as a pointer on the target. `Ptr` stays an opaque handle for foreign code, with no arithmetic. The two convert in exactly two places:

| Builtin | Meaning |
|---|---|
| `__builtin_ptr_addr(p: Ptr) -> Usize` | The address a `Ptr` holds. |
| `__builtin_addr_ptr(a: Usize) -> Ptr` | A `Ptr` at an address. |

The width is in the name, because a device register is read at exactly its width and a wider read of the neighbouring byte is a bus error. Each family comes in `u8`, `u16`, `u32` and `u64`, and the value is the unsigned type of that width:

| Builtin | Meaning |
|---|---|
| `__builtin_mem_load_u32(address)` | A plain load. The compiler may drop, merge or reorder it. |
| `__builtin_mem_store_u32(address, value)` | A plain store. |
| `__builtin_mem_vload_u32(address)` | A **volatile** load: never dropped, merged or reordered against another volatile access. |
| `__builtin_mem_vstore_u32(address, value)` | A volatile store. Two to one address are two stores. |
| `__builtin_mem_uload_u32(address)` | A load at **any** alignment, of memory used only as bytes. |
| `__builtin_mem_ustore_u32(address, value)` | A store at any alignment, of memory used only as bytes. |

```prismio
// QEMU `virt`'s UART: each store has to reach the device.
fn put(c: U8) {
    __builtin_mem_vstore_u32(0x09000000, c as U32)
}
```

Every access but `uload` and `ustore` is naturally aligned; an address that is not is undefined behaviour, as it is in C. `uload` and `ustore` take any address, and in return the compiler assumes the memory is byte storage, such as a [`Buffer`](/stdlib/mem)'s bytes or a block from `alloc`, and never also a struct field or a `Vec` element it reads as another type. That assumption is what lets a loop of byte writes keep everything else in registers. A literal argument adopts the width, so `__builtin_mem_vstore_u8(0x1000, 65)` is a `U8`, and a `U32` variable passed for a `U8` is refused rather than truncated.

## Byte order and Float bits

| Builtin | Meaning |
|---|---|
| `__builtin_swap_bytes(x)` | `x` with its bytes in reverse order, for any integer type; one instruction (`rev`, `bswap`) |
| `__builtin_float_bits(f) -> U64` | the 64 bits of a `Float` |
| `__builtin_float_from_bits(b: U64) -> Float` | the `Float` with those bits |

```prismio
let wire = __builtin_swap_bytes(0x12345678 as U32)    // 0x78563412
let bits = __builtin_float_bits(1.0)                  // 0x3FF0000000000000
```

## Atomics

Atomic operations are sequentially consistent, and work on `u8` through `u64`:

| Builtin | Answers |
|---|---|
| `__builtin_mem_aload_u32(address)` | the value |
| `__builtin_mem_astore_u32(address, value)` | nothing |
| `__builtin_mem_aswap_u32(address, value)` | the old value |
| `__builtin_mem_aadd_u32`, `asub`, `aand`, `aor`, `axor` `(address, value)` | the old value |
| `__builtin_mem_acas_u32(address, expected, desired)` | the value that was there; the swap happened if it equals `expected` |
| `__builtin_mem_fence()` | nothing; a full barrier |

```prismio
// A spinlock taken and released.
fn lock(word: Usize) {
    while (__builtin_mem_acas_u32(word, 0, 1) != 0) {}
}

fn unlock(word: Usize) {
    __builtin_mem_astore_u32(word, 0)
}
```

## Inline assembly

```prismio
__builtin_asm("nop")
__builtin_asm_write("msr tpidr_el0, $0", 12345)
let el: U64 = __builtin_asm_read("mrs $0, CurrentEL")
```

| Builtin | Meaning |
|---|---|
| `__builtin_asm(text)` | Run the instructions. Memory is treated as clobbered, so a load or store is never moved across it. |
| `__builtin_asm_read(text) -> U64` | Run them; `$0` is the result. |
| `__builtin_asm_write(text, value: U64)` | Run them; `$0` is the operand. |

The text must be a **string literal**, because it is part of the instruction stream. It is in LLVM's inline-assembly syntax (AT&T on x86): `$$` writes a literal `$`, and `\n` separates instructions. Registers other than `$0` are yours to preserve; the builtins do not declare clobbers.

On x86, `in` and `out` name their registers, so they are builtins of their own and are refused on any other target:

| Builtin | Meaning |
|---|---|
| `__builtin_port_out_u8(port: U16, value: U8)` | `outb`. Also `u16` (`outw`) and `u32` (`outl`). |
| `__builtin_port_in_u8(port: U16) -> U8` | `inb`. Also `u16` and `u32`. |

## Function modifiers

These stand before `fn`, in any order, after a visibility marker:

| Modifier | Effect |
|---|---|
| `export` | The function is also reachable under its source name, the symbol an assembler stub, a C file or a linker script writes. Give it parameters of numbers and `Ptr`; a `String` is not a C string. |
| `naked` | No prologue or epilogue, and never inlined. The body is `__builtin_asm`; locals and calls in it are your problem. |
| `section("name")` | The object-file section the function's code goes in, which a linker script names. |
| `align(n)` | The function's alignment in bytes, a power of two. |

```prismio
export naked section(".text.boot") fn _start() {
    __builtin_asm("ldr x0, =__stack_top\nmov sp, x0\nbl main\n1: wfi\nb 1b")
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
| `P4001` | `memory operand: expected U8, found U32` (a value of the wrong width) |
| `P4001` | `the assembly text of `__builtin_asm` must be a string literal` |
| `P4001` | `__builtin_mem_acas_u32 expects 3 arguments, found 2` |
| `P4001` | `` `__builtin_port_out_u8` is an x86 instruction, and the target is `aarch64-unknown-none-elf` `` |
| `P3201` | `section takes the section's name as a string literal`; `repr takes C`; `align takes a power of two` |
