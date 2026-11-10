---
title: Standard input
description: The std.input module — reading what is piped into a program as lines, tokens or bytes, one at a time or all at once, with one cursor under all of them.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [standard-library, input, io, lines, tokens, bytes, readLine, readToken]
related: [stdlib/io, stdlib/filesystem, stdlib/option, cookbook/cli-arguments]
---

`import std.input`. A program that reads what is piped into it — a filter, a line counter, a tool that takes a list on stdin — reads it with plain functions: `readLine()`, `readInt()`, `inputLines()`. There is no `stdin` to name first, since a process has one.

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io
import std.string

// Counts the lines, words and bytes of whatever is piped in.
fn main() {
    let mut lines = 0
    let mut words = 0
    let mut bytes = 0
    for line in inputLines() {
        lines = lines + 1
        bytes = bytes + line.length
        for word in line.split(' ') {
            if (word.isNotEmpty) { words = words + 1 }
        }
    }
    println("${lines} lines, ${words} words, ${bytes} bytes")
}
```

```text
$ printf 'the quick brown fox\r\njumps over\n\nthe lazy dog' | ./count
4 lines, 9 words, 41 bytes
```

The input has four lines. The empty third line is a line, and the last one counts even though nothing ends it. The byte count leaves out the terminators, including the `\r` of the Windows-style first line.

## Ways to read

| Call | Returns | Use it for |
| --- | --- | --- |
| `inputLines()` | an iterator of `String`, for `for line in` | every line, in order — the usual case |
| `readLine()` | `String?`: the next line, or `none` at the end of input | one line on demand: a header, a prompt's answer |
| `prompt(text)` | `String?`: `text` is written first, then a line is read | asking a question |
| `readInt()`, `readFloat()` | `Int?`, `Float?`: the next line as a number | a count or a measurement on a line of its own |
| `readIntResult()`, `readFloatResult()` | `Result<Int?, InputError>`, `Result<Float?, InputError>` | telling a number, the end of input, a line that is not a number and a failing descriptor apart |
| `readLines()` | `Vec<String>`: every line not yet read | input you want all of, at once, as lines |
| `tokens()` | an iterator of `String`, for `for token in` | whitespace-separated values, read as the loop reaches them |
| `readToken()` | `String?`: the next token, or `none` | one value on demand, wherever the line breaks fall |
| `readTokens()` | `Vec<String>`: every token not yet read | a small list of tokens, all at once |
| `readAll()` | `String`: everything not yet read, terminators included | input that is one document rather than lines |
| `readByte()` | `U8?`: the next byte, or `none` | a binary format, a byte at a time |
| `readBytes(count)` | `Vec<U8>`: the next `count` bytes, fewer if the input ends first | a fixed-size record |
| `readAllBytes()` | `Vec<U8>`: everything not yet read, byte for byte | binary input, or input that is not text |
| `readText(count)` | `String`: `readBytes(count)` as text | a body whose length a header announced |
| `waitForInput(milliseconds)` | `Bool`: whether a read would not wait | acting on a burst of input once, not on each piece |

There is no `stdin` value to call them on: a process has one standard input, so each is a function of its own. There is no fallback variant of any of them — `??` is the fallback, as in `readLine() ?? "stranger"` — and no `atEndOfInput()`: ask for the next item and `none` says the input is over, or let a `for` loop end on its own.

**A line never carries its terminator.** `\n` and `\r\n` both end a line, and neither is part of it. A last line with no terminator is still a line, so `"a\nb"` and `"a\nb\n"` are the same two lines, and an empty input has none.

**A token is a run of anything but space, tab, `\n` and `\r`**, the whitespace `trim` and `splitWhitespace` mean. Looking for one skips the whitespace before it, line ends included, and the byte after it is left unread: `readToken()` followed by `readLine()` gives the rest of that line, the way `cin >> x` followed by `getline` does.

**All of them share one cursor, so they can be mixed.** Each begins exactly where the one before stopped: a `readLine` followed by `readAllBytes` gives the rest of the input after that line, and a `readToken` followed by `readAll` gives what comes after the token. There is one 64 KiB buffer behind them, and no call has a buffer of its own.

### Numbers, a token at a time

`readInt` reads a *line*. For input laid out in tokens — a count, then that many values on lines of their own or all on one — read the tokens and convert them. `tokens()` reads one when the loop reaches it, so the whole input is never held:

<!-- prismio-check: pass -->
```prismio
import std.input
import std.io
import std.option
import std.string

// Input: a count, then that many numbers, wherever the line breaks fall.
fn main() {
    let count = (readToken() ?? "0").parseInt() ?? 0
    let mut sum = 0
    let mut seen = 0
    for token in tokens() {
        if (seen == count) { break }
        sum = sum + (token.parseInt() ?? 0)
        seen = seen + 1
    }
    println(sum)
}
```

```text
$ printf '5\n10 20 30\n40 50\n' | ./sum
150
```

### When the difference matters

`readInt()` is `none` at the end of input and also for a line that is not a number. That is the right amount of detail for a script, and `readInt() ?? 18` is all it takes. A program that must tell them apart asks for `readIntResult()`, which keeps four outcomes distinct:

<!-- prismio-check: pass -->
```prismio
import std.input
import std.io
import std.option
import std.string

fn main() {
    loop {
        match (readIntResult()) {
            Result.Ok(value) => {
                if (value == none) { break }
                println("number: ", value ?? 0)
            }
            Result.Err(problem) => {
                match (problem) {
                    InputError.NotANumber => { println("skipped a line that is not a number") }
                    InputError.Io => {
                        eprintln("standard input failed")
                        break
                    }
                }
            }
        }
    }
}
```

```text
$ printf '12\nhello\n7\n' | ./numbers
number: 12
skipped a line that is not a number
number: 7
```

`Ok(none)` is the end of input, `Err(NotANumber)` is a line that was read and is not a number (consumed, as `readInt` consumes it), and `Err(Io)` is the descriptor failing, which `readInt` and `readLine` cannot tell from the end. `readFloatResult()` is the same for a `Float`.

### Length-prefixed messages

`readText` and `readBytes` read through the same buffer as the lines, so a header can be read with `readLine` and the body it announced with either one: `readText` when the body is text, `readBytes` when it is not. That is how the Language Server Protocol frames its messages: `Content-Length: 12`, a blank line, then exactly twelve bytes — which may themselves contain newlines, so a line-based read would have changed them.

<!-- prismio-check: pass -->
```prismio
import std.input
import std.io
import std.option
import std.string

fn main() -> Int {
    let header = readLine()
    let blank = readLine()
    let length = expect(header).replaceAll("Content-Length: ", "").parseInt().unwrapOr(0)
    let body = readText(length)
    println(body.length)
    return 0
}
```

```text
$ printf 'Content-Length: 11\r\n\r\nhello\nworld' | ./message
11
```

A `String` ends at its first NUL byte, so `readText` cuts there (the bytes are still consumed); `readBytes` returns a `Vec<U8>` and keeps every byte, NUL and invalid UTF-8 included. To wait for input *and* something else — a child's output, say — use [`waitReadable`](/stdlib/poll) with descriptor `0`; it counts bytes already in the buffer as ready, which `waitForInput` does too.

### An optional line prints, and has a fallback

`readLine` and `prompt` answer a `String?`, because the input may have ended. With [`std.display`](/stdlib/io#printing-your-own-types) imported, an optional prints as its value, or as `none`, so the usual first look at a line needs no test:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io

// The first line is a title; everything after it is the body.
fn main() {
    let header = readLine()
    println("Your message:", header)
    println("body:", readAll().length, "bytes")
}
```

```text
$ printf 'Report\nline one\nline two\n' | ./report
Your message: Report
body: 18 bytes
$ ./report < /dev/null
Your message: none
body: 0 bytes
```

When the program should not go on without a line, ask for the value or the fallback instead of testing:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io
import std.option
import std.string

// Reads a name and an age, each on a line of its own.
fn main() {
    let name = readLine() ?? "stranger"
    let age = readInt() ?? 0
    println("hello, ${name}")
    println("next year:", age + 1)
}
```

```text
$ printf 'Ada\n36\n' | ./hello
hello, Ada
next year: 37
```

`readInt` is `none` at the end of input and also when the line is not a number (spaces around it are ignored); the line is consumed either way. `??` gives it a default, and a comparison with `none` takes the two cases apart:

<!-- prismio-check: pass -->
```prismio
import std.input
import std.io
import std.option
import std.string

fn main() -> Int {
    let title = readLine()
    if (title == none) {
        eprintln("no input")
        return 1
    }
    println("title: " + expect(title))
    return 0
}
```

In a loop, prefer `inputLines()` to calling `readLine()` repeatedly: each `String?` is a test and an unwrap, and the iterator hands the line over bare.

## How fast

Input is read 64 KiB at a time into one buffer in the runtime, and each line is found in memory with `memchr` and copied out, so a line costs a scan and a copy rather than a system call. A line longer than the buffer arrives whole. Counting the lines of a 118 MB, 3-million-line file takes 134 ms, against 156 ms for C++'s `getline` and 274 ms for Rust's `lines()`. Counting lines and words together takes 212 ms, against 450 ms and 606 ms.

Every line is released when the loop moves on: the counting example above measures `0 leaked` under `--verify`.

## Why it is its own module

`std.io` is imported by every program that prints. If the reads lived there, every printing program would carry them into its debug information and link, and carry `std.option`'s allocation sites into its ownership analysis. A program that reads its input asks for that by importing `std.input`; one that only prints does not pay for it.

## Limits

- **The text reads stop at a NUL.** A line, a token and the text from `readText` are `String`s, and text after a NUL byte is not part of them. `readByte`, `readBytes` and `readAllBytes` keep everything.
- **One call returns at most 2 GiB - 1 bytes** of `readBytes` or `readAllBytes`; call again for the rest.
- **Each call is atomic; a pair of calls is not.** Two tasks reading at once never tear or repeat an item — each line, token or byte goes to exactly one of them — but `inputLines()` asks "is there another?" and then takes, and the other task can take what the first one found. Give the input to one task.
- **The descriptor directly bypasses the buffer.** `Stream { descriptor: 0 }.readAll()` from [`std.process`](/stdlib/process) reads descriptor 0 itself and skips whatever these reads have already buffered. Use one or the other.
- **Output is not buffered, so a prompt is already on screen.** `print` writes straight to descriptor 1; there is nothing for `prompt(text)` to flush before it blocks.
- No line editing. `prompt(text)` writes the text and reads a line; nothing edits it.

To read a *file* a line at a time, use [`readLines`](/stdlib/filesystem#reading-a-file-a-line-at-a-time) from `std.fs`, which uses the same reader.
