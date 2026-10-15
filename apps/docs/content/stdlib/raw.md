---
title: Raw memory and hardware access
description: The std.raw module — volatile loads and stores, atomics on 8- to 64-bit words, a memory barrier, unaligned access, byte order, the conversions between a pointer and its address, and a Float's bits, with no C runtime under it.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [standard-library, low-level, volatile, atomics, freestanding, hardware]
related: [stdlib, stdlib/mem, stdlib/port, stdlib/asm, language/low-level, guides/freestanding]
---

`import std.raw`. What code that talks to hardware needs and the language has no syntax for: a device register read or written exactly as written, a lock taken with an atomic, a barrier, an address turned back into a pointer. Each function is one instruction or a few and calls nothing in the C runtime, so a [freestanding](/guides/freestanding) kernel may import it and link nothing but the failure core.

It is **experimental**. There is no `unsafe` block: an address is a `Usize`, and a load or store through a bad one is as undefined as it is in C. The plain, non-volatile `loadU32` and `storeU32` are [`std.mem`](/stdlib/mem)'s.

```prismio
import std.raw

// QEMU `virt`'s PL011 UART: each store has to reach the device.
fn put(c: U8) {
    volatileStoreU32(0x09000000, c as U32)
}

fn lock(word: Usize) {
    while (atomicCompareExchangeU32(word, 0, 1) != 0) {}
}

fn unlock(word: Usize) {
    atomicStoreU32(word, 0)
}
```

## Addresses

| Function | Meaning |
| --- | --- |
| `addressOf(p: Ptr) -> Usize` | the address a `Ptr` holds |
| `pointerAt(a: Usize) -> Ptr` | a `Ptr` at an address |

## Volatile access

Each call is one load or store of that width, in program order, and is never merged, reordered with another volatile access, or dropped because nothing reads the result.

| Function | Meaning |
| --- | --- |
| `volatileLoadU8`, `volatileLoadU16`, `volatileLoadU32`, `volatileLoadU64` `(address)` | the value |
| `volatileStoreU8`, `volatileStoreU16`, `volatileStoreU32`, `volatileStoreU64` `(address, value)` | writes `value` |

A literal argument takes the width (`volatileStoreU8(0x1000, 65)`), and a variable of another width is refused rather than truncated. Every access here is naturally aligned; an address that is not is undefined behaviour.

## Unaligned access

| Function | Meaning |
| --- | --- |
| `unalignedLoadU16`, `unalignedLoadU32`, `unalignedLoadU64` `(address)` | a load at any alignment |
| `unalignedStoreU16`, `unalignedStoreU32`, `unalignedStoreU64` `(address, value)` | a store at any alignment |

For memory used only as bytes, such as a [`Buffer`](/stdlib/mem)'s bytes or a block from `alloc`. The compiler assumes such memory is never also a struct field or a `Vec` element read as another type, which is what lets a loop of byte writes keep everything else in registers.

## Atomics

Sequentially consistent, in `U8`, `U16`, `U32` and `U64` (shown for `U32`):

| Function | Answers |
| --- | --- |
| `atomicLoadU32(address)` | the value |
| `atomicStoreU32(address, value)` | nothing |
| `atomicSwapU32(address, value)` | the old value |
| `atomicAddU32`, `atomicSubU32`, `atomicAndU32`, `atomicOrU32`, `atomicXorU32` `(address, value)` | the old value |
| `atomicCompareExchangeU32(address, expected, desired)` | the value that was there; the swap happened if it equals `expected` |
| `fence()` | nothing; a full barrier |

On a [typed pointer](/language/low-level#typed-pointers-ptrt) the same operations are methods with the ordering written at the call, from the `AtomicOrder` this module declares:

| Variant | Meaning |
| --- | --- |
| `Relaxed` | Atomic, and nothing is ordered around it: a counter. |
| `Acquire` | What follows cannot move above it: taking a lock. A load or a read-modify-write. |
| `Release` | What precedes cannot move below it: dropping one. A store or a read-modify-write. |
| `AcqRel` | Both, for a read-modify-write. |
| `SeqCst` | Every thread sees every such access in one order. What the address functions above use. |

`p.atomicLoad(order)`, `p.atomicStore(value, order)`, `p.atomicSwap`, `atomicAdd`, `atomicSub`, `atomicAnd`, `atomicOr`, `atomicXor` `(value, order)` (the old value) and `p.atomicCompareExchange(expected, desired, order)` (the value that was there). The pointee is an integer of 8, 16, 32 or 64 bits, and a method that writes needs a `Ptr<mut T>`. The ordering must be written as a variant (`AtomicOrder.Acquire`), because it is a property of the instruction, not a value; a load cannot be `Release` or `AcqRel`, and a store cannot be `Acquire` or `AcqRel`.

## Byte order and Float bits

| Function | Meaning |
| --- | --- |
| `swapBytes(x)` | `x` with its bytes reversed, for a `U16`, `U32` or `U64`; one `rev` or `bswap` |
| `x.bits` | the 64 bits of a `Float`, as a `U64`, keeping a NaN's payload and a negative zero |
| `Float.fromBits(b: U64)` | the `Float` with those bits |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.raw

fn main() -> Int {
    println(swapBytes(0x12345678 as U32))    // 2018915346, which is 0x78563412
    println(1.0.bits)                        // 4607182418800017408, which is 0x3FF0000000000000
    println(Float.fromBits(0x4000000000000000))   // 2
    return 0
}
```
