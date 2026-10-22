---
title: Memory and buffers
description: The std.mem module — Buffer, a bounds-checked byte buffer with typed little- and big-endian reads and writes; alloc, realloc and free for memory a program manages itself; and Arena, a bump allocator you reset in one step.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-09"
tags: [standard-library, memory, buffer, bytes, allocation, arena, manual-memory, binary-formats]
related: [stdlib, stdlib/raw, guides/freestanding, language/low-level, language/ownership-and-borrowing, guides/memory-and-aif, stdlib/vec]
---

`import std.mem`. Read and write binary data, allocate memory you free yourself, and carve short-lived scratch memory out of one block.

Most programs never need this module: a `Vec`, a `String` or a struct is freed for you when it goes out of use. Reach for `std.mem` when you parse or produce a binary format, hand a block of bytes to C, or want to control exactly when memory comes and goes.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.mem

fn main() -> Int {
    // A PNG signature and a big-endian chunk length, as a file would hold them.
    let mut header = Buffer(12)
    header.writeU32BE(0, 0x89504E47)
    header.writeU32BE(8, 13)
    println(header.readU32BE(8))             // 13
    println(header[0])                       // 137

    // Memory you manage yourself: the address is a number, and you free it.
    let block = alloc(64)
    block.storeU32(7)
    println(block.loadU32())                 // 7
    free(block)

    // Scratch memory taken back all at once.
    let mut scratch = Arena(4096)
    let node = scratch.alloc(24, 8)          // 24 bytes, 8-byte aligned
    node.storeU64(42)
    println(scratch.used)                    // 24
    scratch.reset()
    println(scratch.used)                    // 0
    return 0
}
```

## Three tools, two kinds of ownership

| Tool | What it is | Who frees it | Checked |
| --- | --- | --- | --- |
| `Buffer` | a run of bytes with a length | freed automatically, like a `Vec` | every access is bounds-checked |
| `alloc` / `free` | a block named by its address, a `Usize` | **you**, with `free` | no: like C |
| `Arena` | one block that hands out aligned pieces | freed automatically; `reset` reuses it | allocation is checked, the addresses are not |

**A `Buffer` and an `Arena` are ordinary values.** Their bytes are freed when the value is, exactly as a `Vec`'s are, so there is nothing to forget.

**An address from `alloc` is just a number.** Nothing frees it for you, nothing stops you using it after `free`, and a load or store through it is unchecked. What you do get is the ledger: build with [`--verify`](/guides/memory-and-aif) and a block you never freed is reported as a leak, and one freed twice as a violation.

## `Buffer`

### Making one

| Call | Result |
| --- | --- |
| `Buffer(n)` | `n` zero bytes; the same as `Buffer.new(n)` |
| `Buffer.withCapacity(n)` | empty, with room for `n` bytes before it reallocates |
| `Buffer.fromString(s)` | the String's UTF-8 bytes, no terminator |

### Size and bytes

| On a `Buffer` | Meaning |
| --- | --- |
| `b.length` | the number of bytes |
| `b.capacity` | how many fit before the next reallocation |
| `b.isEmpty` | whether the length is zero |
| `b[i]` | the byte at `i`, a `U8` |
| `b[i] = x` | replaces the byte at `i`; needs `let mut b` |
| `b.address` | where the bytes are now, as a `Usize` (see [below](#reaching-a-buffers-bytes-directly)) |
| `b.pointer` | the same place as a `Ptr<mut U8>?`, `none` for an empty Buffer (see [below](#reaching-a-buffers-bytes-directly)) |

An offset outside the Buffer stops the program with the offset and the length:

```text
runtime error: 4 byte(s) at offset 13 are out of range for a Buffer of 16
```

### Typed reads and writes

Every read takes a byte offset, and every write an offset and a value. The offset needs no alignment.

| Type | Read | Write |
| --- | --- | --- |
| `U8`, `I8` | `readU8(o)`, `readI8(o)` | `writeU8(o, v)`, `writeI8(o, v)` |
| `U16`, `I16` | `readU16LE`, `readU16BE`, `readI16LE`, `readI16BE` | `writeU16LE` … `writeI16BE` |
| `U32`, `Int` | `readU32LE`, `readU32BE`, `readI32LE`, `readI32BE` | `writeU32LE` … `writeI32BE` |
| `U64`, `I64` | `readU64LE`, `readU64BE`, `readI64LE`, `readI64BE` | `writeU64LE` … `writeI64BE` |
| `Float` | `readFloatLE`, `readFloatBE` | `writeFloatLE`, `writeFloatBE` |

`LE` is little-endian, least significant byte first; `BE` is big-endian, the order most file formats and network protocols use. `Int` is 32 bits, so the `I32` methods read and write an `Int`. `Float` is the 8-byte IEEE double.

Every target Prismio builds for is little-endian, so an `LE` access is a single load or store and a `BE` one adds a byte swap. A read inside a loop costs one bounds check and one load, and the compiler lifts the check out of the loop when it can prove the range.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.mem

// A record: a 2-byte tag, a 4-byte count and an 8-byte Float, big-endian.
fn encode(tag: U16, count: Int, scale: Float) -> Buffer {
    let mut b = Buffer(14)
    b.writeU16BE(0, tag)
    b.writeI32BE(2, count)
    b.writeFloatBE(6, scale)
    return b
}

fn main() -> Int {
    let record = encode(0xCAFE, -3, 1.5)
    println(record.readU16BE(0))   // 51966
    println(record.readI32BE(2))   // -3
    println(record.readFloatBE(6)) // 1.5
    println(record.readU16LE(0))   // 65226: the same two bytes, the other way round
    return 0
}
```

### Changing a Buffer

These need `let mut b`.

| Method | Effect |
| --- | --- |
| `b.fill(x)` | every byte becomes `x` |
| `b.fill(x, offset, count)` | `count` bytes from `offset` become `x` |
| `b.copyFrom(source, sourceOffset, offset, count)` | copies `count` bytes of `source` into `b` at `offset`; `source` may be `b`, and the ranges may overlap |
| `b.resize(n)` | longer with zero bytes, or shorter; the capacity is kept |
| `b.push(x)` | appends one byte |
| `b.append(other)` | appends every byte of `other` |
| `b.clear()` | empties it; the capacity is kept |

### Reading a Buffer

| Method | Returns |
| --- | --- |
| `b.slice(offset, count)` | a new Buffer holding a copy of those bytes |
| `b.indexOf(x)` / `b.indexOf(x, from)` | the first offset holding the byte `x`, or `-1` |
| `b.toString()` | the bytes as a `String` |
| `a == b` | whether both have the same length and the same bytes |

A `String` cannot hold a zero byte, so `toString()` stops at the first one.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.mem

fn main() -> Int {
    let mut line = Buffer.fromString("key=value")
    let eq = line.indexOf('=' as U8)
    let key = line.slice(0, eq)
    let value = line.slice(eq + 1, line.length - eq - 1)
    println(key.toString())        // key
    println(value.toString())      // value

    line.append(Buffer.fromString(";"))
    line.fill('*' as U8, 0, 3)
    println(line.toString())       // ***=value;
    return 0
}
```

### Reaching a Buffer's bytes directly

`b.address` is where the bytes are now, for the [`load`/`store` methods](#loads-and-stores-at-an-address), a [low-level builtin](/language/low-level) or a C function. It stays valid until the next `resize`, `push`, `append` or `clear`, which may move the bytes, and until the Buffer itself is freed.

`b.pointer` is the same place as a [typed pointer](/language/pointers), a `Ptr<mut U8>?`: `none` for an empty Buffer, which has no bytes to point at, and otherwise the first byte, so `expect(b.pointer).offset(4).load()` reads the fifth. It follows the same validity rule as `address`.

## Manual memory

| Function | Effect |
| --- | --- |
| `alloc(size)` | a new block of `size` bytes; its contents are whatever was there |
| `allocZeroed(size)` | a new block of `size` zero bytes |
| `realloc(address, size)` | the block grown or shrunk to `size`, possibly moved; the old address is dead afterwards. An address of `0` allocates |
| `free(address)` | gives the block back. `free(0)` does nothing |
| `copy(to, from, count)` | copies `count` bytes; the two ranges may overlap |
| `fill(address, value, count)` | sets `count` bytes to `value` |
| `compare(a, b, count)` | `-1`, `0` or `1` as the first differing byte of `a` is below, equal to or above `b`'s |

A block can also be a typed pointer, for a `T` of plain data (numbers, `Bool`, `Char`, enums, pointers and structs of those; a type that owns memory is refused by the pointer type):

| Function | Meaning |
|---|---|
| `allocOf<T>(count)` | room for `count` of `T` as a `Ptr<mut T>`; the contents are whatever was there |
| `allocZeroedOf<T>(count)` | the same, zero-filled |
| `reallocOf(block, count)` | the block grown or shrunk to room for `count`, possibly moved; the old pointer is dead afterwards |
| `free(block)` | gives a block from any of these back |

There is no size to compute and no cast: the element size is read off the type, so a padded struct and a packed one are each their own. `let headers = allocZeroedOf<Header>(4)` is a `Ptr<mut Header>` four elements long; step it with `headers.offset(i)`, and the pointer is as unchecked as an address is.

Sizes and addresses are `Usize`. **An allocation never returns `0`.** A program that runs out of memory stops with `runtime error: out of memory allocating N bytes`, so there is no failure value to test after every call.

### Loads and stores at an address

| Method on a `Usize` | Meaning |
| --- | --- |
| `a.loadU8()`, `a.loadU16()`, `a.loadU32()`, `a.loadU64()` | the value at `a` |
| `a.storeU8(v)`, `a.storeU16(v)`, `a.storeU32(v)`, `a.storeU64(v)` | writes `v` at `a` |

These are the plain loads and stores of [low-level programming](/language/low-level#memory-through-an-address) under a method name, so the same rule applies: **the address must be a multiple of the width.** A `Buffer`'s typed reads have no such rule.

Address arithmetic is ordinary `Usize` arithmetic: `(block + 8).loadU32()` reads the four bytes at offset 8.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.mem

// A growable array of U32, managed by hand.
fn main() -> Int {
    let mut capacity: Usize = 4
    let mut items = alloc(capacity * 4)
    let mut count: Usize = 0
    for i in 0..<10 {
        if (count == capacity) {
            capacity = capacity * 2
            items = realloc(items, capacity * 4)
        }
        (items + count * 4).storeU32((i * i) as U32)
        count = count + 1
    }
    println((items + 36).loadU32())   // 81
    free(items)
    return 0
}
```

### What `--verify` tells you

`alloc` and `free` go through the same allocator as every `String` and `Vec`, so a [`--verify`](/guides/memory-and-aif) build counts them:

```text
aif-verify: 6 allocated, 5 released, 1 leaked, 0 violation(s)
```

A block you never freed shows as **leaked**. Freeing one twice, or freeing an address `alloc` never returned, shows as a **violation**. A use after `free` is not reported: it is a read, not an allocator event.

## `Arena`

An `Arena` is one block that hands out pieces from the front. Each `alloc` is a comparison and an addition, and `reset` takes every piece back at once. Use one for memory that lives exactly as long as some unit of work, such as a frame, a request or a parse.

| On an `Arena` | Meaning |
| --- | --- |
| `Arena(capacity)` | a block of `capacity` zero bytes, nothing handed out |
| `arena.alloc(size, align)` | the address of `size` bytes, a multiple of `align`, which must be a power of two |
| `arena.reset()` | every piece back at once |
| `arena.capacity` | the block's size |
| `arena.used` | bytes handed out, padding included |
| `arena.remaining` | bytes not yet handed out |

An `alloc` that does not fit stops the program, with the size asked for and the room left. The block never moves, so an address stays valid until the next `reset` or until the Arena is freed. **Memory handed out again after a `reset` is not cleared**: it holds whatever was last written to it.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.mem

fn main() -> Int {
    let mut frame = Arena(1024)
    for round in 0..<3 {
        let positions = frame.alloc(8 * 16, 8)
        for i in 0..<16 {
            (positions + (i * 8) as Usize).storeU64((round * 100 + i) as U64)
        }
        println((positions + 8).loadU64())   // 1, then 101, then 201
        frame.reset()
    }
    return 0
}
```

## In a freestanding program

A [`--freestanding`](/guides/freestanding) program, such as a kernel, can import `std.mem`, and with it `std.vec`, `std.map` and `std.string`. The build then compiles Prismio's runtime for the program's own target, with no C library under it. The memory comes from the program: it defines three functions, and every `Vec`, `String`, `Buffer` and `alloc` goes through them.

| Function | Answers |
| --- | --- |
| `prismio_alloc(size: Usize) -> Ptr` | a block of at least `size` bytes, aligned to 16; never null |
| `prismio_realloc(p: Ptr, size: Usize) -> Ptr` | `p`'s contents in a block of `size` bytes; `p` may be null |
| `prismio_free(p: Ptr)` | nothing; the block is the allocator's again |

They are `export fn`s in Prismio, or C functions linked with the program. A program that never allocates defines none of them: the default stops the machine through `prismio_panic_hook` and says which function to write.

```prismio
import std.mem

// A bump allocator over RAM nothing else uses. Blocks are never reused; each
// carries its size in the eight bytes before it, for realloc.
let HEAP_BASE: Usize = 0x44000000
let mut heapTop: Usize

export fn prismio_alloc(size: Usize) -> Ptr {
    if (heapTop == 0) { heapTop = HEAP_BASE }
    let block = heapTop + 16
    (block - 8).storeU64(size as U64)
    heapTop = block + ((size + 15) & ~(15 as Usize))
    return pointerAt(block)
}

export fn prismio_realloc(p: Ptr, size: Usize) -> Ptr {
    let fresh = prismio_alloc(size)
    let old = addressOf(p)
    if (old != 0) {
        let oldSize = (old - 8).loadU64() as Usize
        let mut count = oldSize
        if (size < count) { count = size }
        copy(addressOf(fresh), old, count)
    }
    return fresh
}

export fn prismio_free(p: Ptr) {}

fn main() -> Int {
    let mut squares: Vec<Int> = []
    for i in 0..<100 { squares.push(i * i) }
    let mut header = Buffer(8)
    header.writeU32BE(0, 0x7F454C46)
    return squares.length + (header[0] as Int)
}
```

What changes without an operating system:

- **A runtime error stops the machine through `prismio_panic_hook`**, with `kind` `"runtime error"` and the message's text as `detail`. The numbers in it are not filled in: `%d byte(s) at offset %d are out of range for a Buffer of %d`.
- **Float text works.** `toString`, `toString(places)` and `parseFloat` are Prismio, so a kernel can call them. They use the FPU's arithmetic, so the program has to be built with it on; the C library is not involved.
- **One core.** The runtime takes no locks. A kernel that uses `Vec` from several cores at once needs its own.
- **What is not used costs nothing.** A program that imports none of these modules links no runtime and no C library functions at all.

## Not available yet

- **`sizeOf<T>()` and `alignOf<T>()`.** Asking a type for its size needs layout information the language does not expose yet, so a struct cannot be placed in an `Arena` by type. Allocate a size you know.
- **Typed pointers.** An address is a `Usize`, and there is no `Ptr<T>` that knows what it points at.
