---
title: Inline assembly
description: The std.asm module — asm, asmRead and asmWrite, which run instructions where they are written, for boot stubs, system registers and barriers the language has no word for.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [standard-library, low-level, assembly, freestanding]
related: [stdlib, stdlib/raw, stdlib/port, language/low-level, guides/freestanding]
---

`import std.asm`. Three functions that run assembly where they are written:

```prismio
import std.asm

asm("nop")
asmWrite("msr tpidr_el0, $0", 12345)
let level: U64 = asmRead("mrs $0, CurrentEL")
```

| Function | Meaning |
| --- | --- |
| `asm(text)` | run the instructions; memory is treated as clobbered, so a load or store is never moved across them |
| `asmRead(text) -> U64` | run them; `$0` is the result |
| `asmWrite(text, value: U64)` | run them; `$0` is the operand |

**The text must be a string literal**, because it is part of the instruction stream: it is assembled where it is written, not handed to a function. That is why these three are not ordinary functions. Their declarations in `std/asm.psm` only give the names and argument types something to resolve against, and the compiler lowers a call in place; a program may still define a function of the same name of its own, and a call to it is left alone.

The text is LLVM's inline-assembly syntax, AT&T on x86: `$$` writes a literal `$` and `\n` separates instructions. Registers other than `$0` are yours to preserve; the functions do not declare clobbers. A function body is the only place assembly can emit data, such as a table or a note. The module calls nothing in the C runtime.
