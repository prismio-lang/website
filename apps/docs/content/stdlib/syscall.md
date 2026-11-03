---
title: System calls
description: The std.syscall module — the raw system-call instruction, and the calls of Linux and macOS by name, with no C library underneath.
status: experimental
version: "0.2.0"
lastUpdated: "2026-11-03"
tags: [standard-library, low-level, syscall, linux, macos, freestanding]
related: [stdlib, stdlib/asm, stdlib/raw, stdlib/mem, language/platform-blocks, guides/freestanding]
---

`import std.syscall`. A system call asks the operating system's kernel to do something: write bytes to a descriptor, map memory, read a clock. The module gives you the instruction itself and the calls of two kernels by name. It calls nothing in the C runtime, so a [freestanding](/guides/freestanding) Linux program can use it.

```prismio
import std.syscall

linux {
    let pid = linux.syscall.getpid()
}
macos {
    let pid = macos.syscall.getpid()
}
```

## Three ways to make a call

| Form | What it is |
| --- | --- |
| `linux.syscall.write(fd, buffer, count)` | Linux's call, by name |
| `macos.syscall.write(fd, buffer, count)` | macOS's call, by name |
| `syscall(number, a0, a1, ...)` | the raw instruction: a number and up to six operands |

The raw form takes the target's own number. Linux numbers differ between x86_64 and arm64 (`getpid` is 39 and 172); macOS uses the BSD numbers on both architectures, so the instruction sequence adds the class bit that x86_64 macOS wants for you. The named forms pick the number for the target they are compiled for.

## What a call answers

A call answers an `I64`: what the kernel answered, with **a failure as `-errno` on every target**. Linux already works that way. macOS reports a failure through the carry flag and a positive errno, and the compiler's sequence negates it, so one check serves both:

```prismio
import std.syscall

fn describe(result: I64) -> Int {
    if (syscallFailed(result)) { return syscallErrno(result) }
    return 0
}
```

`syscallFailed(result)` is true for a result from -4095 to -1, and `syscallErrno(result)` is the positive errno of one. A larger magnitude is a valid answer: an address `mmap` returns can look negative as an `I64`.

## Addresses and strings

An address is a `Usize`, as in [`std.raw`](/stdlib/raw) and [`std.mem`](/stdlib/mem), so what `alloc` answers goes in as it is. A path is the address of a **NUL-terminated byte string**, not a `String`: build one in a `Buffer` or a block from `alloc`. Nothing is checked. A bad address or length is as undefined as in C.

## The calls

The tables are the same shape on both systems where the kernel has the call. A call a kernel does not have is not in its table:

| Name | Linux | macOS |
| --- | --- | --- |
| `read`, `write`, `open`, `close`, `lseek` | yes (`open` is `openat(AT_FDCWD, ...)`) | yes |
| `mmap`, `munmap`, `mprotect` | yes | yes |
| `ioctl`, `fcntl`, `dup`, `dup2` | yes (`dup2` is `dup3`) | yes |
| `chdir`, `mkdir`, `unlink`, `rmdir`, `rename`, `readlink` | yes (the `*at` forms) | yes |
| `execve`, `wait4`, `kill`, `exit` | yes | yes |
| `getpid`, `getppid`, `getuid`, `sched_yield` | yes | yes |
| `socket`, `connect`, `bind`, `listen`, `accept`, `shutdown`, `sendto`, `recvfrom` | yes | yes |
| `brk`, `getcwd`, `pipe` (`pipe2`), `exitGroup`, `gettid`, `clockGettime`, `getrandom` | yes | no |
| `gettimeofday`, `getentropy` | no | yes |

macOS has no `pipe` here because it answers the two descriptors in registers rather than through a pointer, which a one-result call cannot return.

Linux arm64 has no `open`, `pipe`, `dup2`, `mkdir`, `unlink`, `rename`, `rmdir` or `readlink`, only the `*at` forms, so the Linux wrappers use those on both architectures and answer alike.

Constants are plain values prefixed by system: `LINUX_O_CREAT`, `MACOS_O_CREAT`, `LINUX_PROT_READ`, `MACOS_MAP_ANONYMOUS`, `LINUX_ENOENT`, and so on. They differ between the two (`O_CREAT` is 64 and 512), which is why neither is shared. `O_DIRECTORY`, `O_NOFOLLOW` and `O_DIRECT` are left out because Linux x86_64 and arm64 disagree on them; write the number for your target.

## Targets

`linux.syscall` and `macos.syscall` exist on every target so that a file compiles everywhere. On a target that is not that system, a named call or the raw `syscall` answers `-38` (`-ENOSYS`) without running anything. Write each system's calls in its own [platform block](/language/platform-blocks) and the other system's never reach the build.

Windows has no stable system-call interface: its numbers change between releases, and the supported way in is the Win32 API. There is no `windows.syscall`. A `windows { }` block calls Win32 through `extern fn`.

Supported targets are Linux and macOS on x86_64 and arm64. macOS arm64 is run by the test suite (`tests/test_366_syscalls.psm`). Linux arm64 and x86_64 were run as static, libc-free executables in a Linux VM and passed the same kind of checks, but no test in the suite does that yet. macOS x86_64 has been compiled and its instruction sequence read, and not run.

## Where the numbers come from

The numbers and constants are not typed by hand. `tools/gen_syscalls.py` reads them from the headers each kernel ships and writes `std/syscall.psm`:

- Linux x86_64 and arm64: the kernel's uapi `unistd_64.h` of each, as shipped in an Android NDK sysroot.
- macOS: the SDK's `sys/syscall.h` (XNU's `syscalls.master`).

`tools/gen_syscalls.py --check` regenerates in memory and fails when the file differs; `tools/check_source_lists.py` runs it wherever those headers are installed.
