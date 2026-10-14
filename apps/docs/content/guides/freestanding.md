---
title: Freestanding programs
description: Build a Prismio kernel that runs with no operating system and no C library, write its boot code, serial output and panic hook in Prismio, declare it in build.ums, and boot it under QEMU.
status: experimental
version: "0.1.0"
lastUpdated: "2026-10-08"
tags: [guide, freestanding, kernel, bare-metal, qemu, native, assembly, atomics]
related: [guides/freestanding-benchmarks, language/low-level, guides/calling-c, language/ffi, compiler/cli, compiler/targets, package-manager]
---

A hosted Prismio program leans on an operating system without saying so: it starts through the C library, allocates with `malloc`, and prints through `write`. A kernel, a boot stage or firmware has none of those. `--freestanding` builds a program for that case. The compiler stops linking the Prismio runtime, the link takes no C library and no startup files, and the image is static. You supply the entry point, the stack and everything else the machine needs before the first line of your program can run, and since the language reached the hardware you can write all of it in Prismio.

This is **experimental**, and the edges are sharp. The page ends with a list of what a freestanding program cannot do yet.

## What a freestanding program can use

The language core needs no runtime at all: integer and float arithmetic, `if` and `while`, `for` over a range, functions, structs, fixed-length `Array<T, N>`, enums and `match`. A program written in only those links to a few machine instructions.

On top of that, [low-level programming](/language/low-level) gives it what hardware needs: volatile access to a device register, atomics, inline assembly, x86 port I/O, a way to name a function with a plain symbol (`export`), to strip its prologue (`naked`) and to place it in a section, and `repr(C)` and `packed` structs.

`Vec`, `String`, `Map` and [`std.mem`](/stdlib/mem) work too, once the program says where memory comes from: it defines `prismio_alloc`, `prismio_realloc` and `prismio_free`, and the build compiles Prismio's runtime for the program's target with no C library under it. [Memory and buffers](/stdlib/mem#in-a-freestanding-program) has the three functions and a bump allocator to start from. A program that imports none of these links no runtime at all.

What talks to the system is out: a freestanding program may import every `std` module but `std.io`, `std.display`, `std.input`, `std.fs`, `std.process`, `std.time`, `std.term` and `std.math`.

```text
error[P1094]: `std.io` cannot be imported by a `--freestanding` program
  note: std.io, std.display, std.input, std.fs, std.process, std.time, std.term and std.math need an operating system or a C library
```

## A kernel written entirely in Prismio

The hardware access in it comes from three modules that call nothing in the C runtime, so a kernel may import them and stay free of C: `import std.raw` for volatile access and addresses, `import std.asm` for assembly and `import std.port` for x86 port I/O. `import std.mem` is for plain loads and stores and for memory a program allocates, and it brings the runtime in, so a kernel that wants none leaves it out.

This one runs on QEMU's 64-bit Arm `virt` board. There is no C file in it. The entry point is a `naked` function in the section the linker script starts the image with, the serial port is a volatile store to the UART's data register, the exit is a semihosting call, and the failure hook is an `export`ed function:

```prismio
// QEMU `virt`'s PL011 UART.
fn put(c: U8) {
    volatileStoreU32(0x09000000, c as U32)
}

// A C string: bytes at an address, up to a zero.
fn puts(text: Ptr) {
    let mut at = addressOf(text)
    let mut byte = loadU8(at)
    while (byte != 0) {
        put(byte)
        at = at + 1
        byte = loadU8(at)
    }
}

// ARM semihosting SYS_EXIT: QEMU's exit status becomes the program's.
fn halt(status: Int) {
    storeU64(0x42000000, 0x20026)
    storeU64(0x42000008, status as U64)
    asm("mov x0, #0x18\nmovz x1, #0x4200, lsl #16\nhlt #0xf000")
    while (true) {}
}

export naked section(".text.boot") fn _start() {
    asm("ldr x0, =__stack_top\nmov sp, x0\nbl main\n1: wfi\nb 1b")
}

// The one function the failure core asks of a program.
export fn prismio_panic_hook(kind: Ptr, detail: Ptr, file: Ptr, line: Int, col: Int) {
    puts(kind)
    put(58)
    put(32)
    puts(detail)
    put(10)
    halt(1)
}

fn main() -> Int {
    put(80)
    put(77)
    put(10)
    halt(0)
    return 0
}
```

The linker script places the image where the board loads it, and names the stack the entry stub uses:

```text
ENTRY(_start)

SECTIONS {
    . = 0x40080000;
    .text   : { *(.text.boot) *(.text .text.*) }
    .rodata : { *(.rodata .rodata.*) }
    .data   : { *(.data .data.*) }
    .bss    : { *(.bss .bss.*) *(COMMON) }
    . = ALIGN(16);
    . += 0x4000;
    __stack_top = .;
}
```

Build and boot:

```bash
prismio build kernel.psm --target aarch64-unknown-none-elf --freestanding \
    --native-flag -mgeneral-regs-only --target-features -neon,-fp-armv8 \
    --link-arg -T --link-arg link.ld -o kernel.elf

qemu-system-aarch64 -M virt -cpu cortex-a57 -nographic -semihosting -kernel kernel.elf
```

```text
PM
```

You need `clang` and `ld.lld` on your `PATH`. The system linker on a macOS host links Mach-O and cannot place an ELF image at the address a script names. On a Linux host of the same architecture, GNU ld can: if `ld.lld` is missing or will not run (the one in LLVM's release tarball needs a particular ICU library), add `--link-arg -fuse-ld=bfd`, or `arg("-fuse-ld=bfd")` in `link { }`. A bare-metal x86 target from an AArch64 host needs lld.

## The same kernel in `build.ums`

A manifest can declare the target, so `prismio build` and `prismio test` need no flags:

```ums
project {
    name = "kernel"
    version = "0.1.0"
    prismio = "0.1.0"
}

targets {
    executable("kernel") {
        entry = "kernel.psm"
        freestanding = true
        triple = "aarch64-unknown-none-elf"
        features = "-neon,-fp-armv8"
        native {
            flag("-mgeneral-regs-only")
        }
        link {
            script("link.ld")
        }
    }
}
```

`prismio build` writes `.prismio/build/debug/kernel`, with debug info and overflow checks in the default profile. `prismio run` has nothing to run it on, so boot the file yourself. A `native { source("boot.c") }` adds a C or assembly stub when you want one, and `link { arg("-z") arg("noexecstack") }` passes a bare linker argument.

## A 32-bit x86 kernel

x86 differs in two ways that matter. The serial port and the exit device are port I/O, and QEMU 11's `-kernel` loader wants a Xen PVH entry note rather than a Multiboot header. The note is data, and a function is the only place assembly can appear, so it is the body of a function that is never called:

```prismio
export naked section(".note.Xen") align(4) fn pvh_note() {
    asm(".align 4\n.long 4\n.long 4\n.long 18\n.asciz \"Xen\"\n.long _start")
}

export naked section(".text.boot") fn _start() {
    asm("movl $$__stack_top, %esp\ncall main\n1: hlt\njmp 1b")
}

fn put(c: U8) {
    portOutU8(0x3F8, c)
}

fn halt(status: U8) {
    portOutU8(0xF4, status)
    while (true) {}
}
```

Link with `SUBALIGN(4)` on the note's output section, or the note segment keeps the 16-byte alignment the compiler gives code and QEMU skips it:

```text
.note : SUBALIGN(4) { *(.note.Xen) }
```

```bash
prismio build kernel.psm --target i686-unknown-none-elf --freestanding \
    --native-flag -mno-sse --native-flag -mno-mmx --target-features -sse,-sse2,-mmx \
    --link-arg -T --link-arg link.ld -o kernel.elf

qemu-system-i386 -kernel kernel.elf -display none -serial stdio \
    -device isa-debug-exit,iobase=0xf4,iosize=0x04
```

`isa-debug-exit` turns the value written to port `0xF4` into the emulator's exit status, `(value << 1) | 1`.

## The flags

| Flag | What it does |
|---|---|
| `--freestanding` | Does not link the installed runtime, the C library, startup files, `-lm` or `-lpthread`. The image is static, linked by lld, and the object is not position-independent. Native C compiles with `-ffreestanding -fno-pic -fno-stack-protector`. |
| `--native <file>` | Compiles a C or assembly file with the toolchain's clang and links it. Repeatable. |
| `--native-flag <flag>` | Passes one flag to every `--native` compile, such as `-mgeneral-regs-only` or `-DSEED=2`. |
| `--link-arg <arg>` | Passes one argument to the linker, such as `-T` followed by a script. Repeatable, in order. |
| `--target-features <list>` | An LLVM feature string for code generation, such as `-neon,-fp-armv8` on Arm or `-sse,-sse2,-mmx,+soft-float` on x86_64. |
| `--code-model <model>` | `small`, `kernel`, `medium` or `large`. An x86_64 kernel in the top 2 GiB uses `kernel`. |
| `--no-red-zone` | Marks every function `noredzone`. An interrupt handler runs on the stack it interrupts, and the red zone is memory below the stack pointer that a leaf function may use without moving it. |

In a manifest these are `freestanding`, `triple`, `features`, `codeModel` and `noRedZone` on the target, `native { }`, and `script("...")` and `arg("...")` in `link { }`.

`main` is still the function the entry stub calls. It receives an argument count and vector it ignores, and the two stores of them fold away.

## When something goes wrong

A hosted program prints a message and exits. A freestanding one has nowhere to print, so a failure calls a function you define:

```c
void prismio_panic_hook(const char* kind, const char* detail, const char* file,
                        int line, int col);
```

`kind` and `detail` are string literals, `file` is the source path, and `line` and `col` are positions. The hook must not return: print to a serial port, halt, reboot. It can be written in Prismio with `export fn`, taking `Ptr` for the strings, as above, or in C.

`--freestanding` adds `runtime/freestanding/panic.c` to the build (from an installed toolchain's `lib/runtime/freestanding/`, or from a checkout). It defines the six functions generated code calls on failure (a checked overflow, `panic`, `unreachable`, a failed `assert`, a bad range step, `expect` on `none`) and forwards each to the hook. Every one of them is weak, so a program can define any of them itself. Without a hook of your own, a weak default stops the machine without a word.

```text
integer overflow: + at kernel_trap_aarch64.psm:10
```

Overflow checks are off in a single-file build unless you pass `--overflow-checks`; without them a wrapping `Int` operation wraps, exactly as in a release build. A project's debug profile turns them on.

A fixed-length array index is **not** bounds-checked in any build. An index outside `0..<N` reads whatever is next to the array.

## How fast is it

Prismio is measured against C and Rust on this same bare-metal target, counting the instructions the guest runs under QEMU. See [freestanding benchmarks](/guides/freestanding-benchmarks) for the method, how to read the counts and the first results.

## Packaging for a bare-metal triple

An installed toolchain needs a section of each allowed `std` module for your triple, and the failure core. `tools/package.py` builds both with no sysroot, because a freestanding triple has no C library to compile against:

```bash
python3 tools/package.py --compiler <compiler> --out <dir> \
    --freestanding-target aarch64-unknown-none-elf \
    --freestanding-target i686-unknown-none-elf
```

## Pitfalls

- **A kernel that hangs with no output usually took an exception.** At the exception level QEMU starts in, the first floating-point or SIMD instruction traps, and nothing has installed a vector table, so the CPU stops silently. Build with `-mgeneral-regs-only` for C stubs and `--target-features -neon,-fp-armv8` for the program, or enable the FP unit in your entry code.
- **A stack is yours to set up.** The CPU starts with an undefined stack pointer. `_start` has to set it before it calls anything.
- **A constant never reaches the trap.** `--overflow-checks` on a value the optimiser can see through folds the check away. Read the value from a `volatile` the test controls.
- **A `static` used only from inline assembly is discarded.** Mark it `__attribute__((used))`.

## What a freestanding program cannot do yet

- Declare a `static` data object with a section and an alignment, such as a page table or a descriptor table: a `repr(C)` struct has its layout, but a module-level `let` cannot be placed. A function body is the only place assembly can emit data.
- Take an address of a local or a field. Addresses come from numbers and `Ptr` parameters.
- Define an interrupt handler with the platform's interrupt calling convention. A `naked` function with `asm` can do it by hand.
- Run on x86_64 under QEMU with `-kernel`: the flags and code generation are there, but QEMU does not load a 64-bit x86 ELF directly, so that needs a 32-bit stub that enters long mode.
- Format or parse a `Float` as text: the runtime's formatter is the C library's.
- RISC-V. The backend links AArch64, x86 and WebAssembly.
