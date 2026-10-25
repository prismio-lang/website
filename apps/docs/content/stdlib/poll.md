---
title: Waiting on several things
description: The std.poll module — wait on standard input and a child's pipes at once, with a timeout, so one thread can serve a client and supervise a program.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-25"
tags: [standard-library, poll, process, input, timeout]
related: [stdlib/process, stdlib/input, stdlib/time, stdlib/concurrency]
---

`import std.poll`. A program that serves a client and supervises a child cannot read either one first: whichever it picks may never speak. `waitReadable` waits on both, with a timeout, and says which one has something. Reading whichever answered, with a call that returns at once, needs no tasks, no channels and no locks — and the timeout doubles as a timer.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.poll
import std.process
import std.string
import std.vec

// Upper-cases text with `tr`, reading its output as it arrives
// instead of waiting for it to finish.
fn main() -> Int {
    let upper = Process()
    upper.program = "tr"
    upper.arguments = ["a-z", "A-Z"]
    upper.stdin = StreamMode.Pipe
    upper.stdout = StreamMode.Pipe

    let child = upper.spawn()
    child.stdin.write("quiet words")
    child.stdin.close()

    let mut text = ""
    while (waitReadable(child.stdout.descriptor, 5000)) {
        let piece = child.stdout.readSome(4096)
        if (piece.equals("")) { break }
        text = text.concat(piece)
    }
    child.wait()
    println(text)
    return 0
}
```

```text
QUIET WORDS
```

## Reference

| Call | Returns |
|---|---|
| `waitReadable(descriptor, milliseconds)` | `Bool`: whether a read of `descriptor` would not wait |
| `waitReadable(first, second, milliseconds)` | `Int?`: `0` or `1` for the one that is ready (the first, if both), `none` on timeout |
| `waitReadable(descriptors, milliseconds)` | `Int?`: the same for a `Vec<Int>` of up to 64 |

A descriptor is a stream's `descriptor`; `0` is this process's standard input. A negative one (a stream that was closed or never opened) is never ready, so it may stay in the list.

**"Ready" means a read will not wait**: there is data, or the other end has closed and the read reports it. It does not say how much, and a message may arrive in pieces.

**Standard input is counted with its buffer.** [`readLine`](/stdlib/input) and its siblings read ahead from the pipe into a buffer, and bytes already there will never make the descriptor readable again. A wait that asked only the operating system would sleep through a message that had already arrived, so descriptor `0` is ready whenever the buffer holds something, or the input has ended.

## Things that bite

**It does not read.** It answers "would a read wait?"; the read is yours — [`Stream.readSome`](/stdlib/process#doing-other-things-while-a-child-runs) for a child, `readLine` or [`readBytes`](/stdlib/input#length-prefixed-messages) for standard input.

**One watcher at a time.** The list is built in a process-wide table, so two tasks waiting at the same moment can interleave their descriptors.

**Windows polls pipes.** A pipe handle cannot be waited on there, so a pipe is checked about once a millisecond; a console or a file is always ready. Sockets are not covered.
