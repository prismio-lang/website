---
title: x86 port I/O
description: The std.port module — the x86 in and out instructions as functions, for freestanding programs that talk to a device through an I/O port.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [standard-library, low-level, x86, freestanding, hardware]
related: [stdlib, stdlib/raw, stdlib/asm, language/low-level, guides/freestanding]
---

`import std.port`. The `in` and `out` instructions name their registers, so they cannot be written as assembly text; here each is a function. They are x86 instructions and are **refused on any other target**, with an error that names the function and the target, rather than assembled into something the assembler rejects.

```prismio
import std.port

portOutU8(0x3F8, 65)             // a byte to the first serial port
let status = portInU8(0x3FD)     // its line status register
```

| Function | Instruction |
| --- | --- |
| `portOutU8(port: U16, value: U8)`, `portOutU16`, `portOutU32` | `outb`, `outw`, `outl` |
| `portInU8(port: U16) -> U8`, `portInU16`, `portInU32` | `inb`, `inw`, `inl` |

Meant for `--freestanding` programs, where a kernel talks to the hardware directly; an ordinary process is not allowed to execute either instruction. The module calls nothing in the C runtime.
