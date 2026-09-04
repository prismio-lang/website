---
title: Strings
description: The String type, its operators, and the std.string method surface -- length, indexing, comparison, concatenation, slicing, iteration, searching, and parsing.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-30"
tags: [standard-library, strings, operators, methods, ownership]
related: [language/operators, language/methods, language/ownership-and-borrowing, language/control-flow]
---

`String` is an owned, move-only runtime type carrying a pointer and a byte length.
It has operators, properties, and methods; all of them are ordinary `std.string`
functions underneath, and every one of them needs `import std.string`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let greeting = "Hello, World"

    println(greeting.length)          // 12
    println(greeting[0])              // H
    println(greeting == "Hello, World")

    let shout = greeting.toUpper()
    println(shout)

    for c in greeting {
        if (c.isSpace) { println("space") }
    }
    return 0
}
```

## The one rule that catches everyone

**Bind what allocates.** An owned result passed straight into a parameter is a
value nothing names, and nothing names it is nothing frees it.

| Written | Result |
|---|---|
| `println(text.trim())` | compiles, **leaks** |
| `let trimmed = text.trim()` then `println(trimmed)` | correct |
| `list_len(text.split(','))` | leaks the temporary list |
| `let parts = text.split(',')` then `list_len(parts)` | correct |

Every table below marks which entries allocate. Build with `--verify` and run the
binary to check: the ledger line reads `N allocated, N released, N leaked,
N violation(s)`. **Read `violations` before `leaked`** — a leak costs bytes, a
violation corrupts.

## Operators

Five operators work on `String`. Each is rewritten during semantic analysis into
the `std.string` call it means, so ownership, overload resolution, and code
generation see an ordinary call — which is exactly why the allocation rule above
applies to `+` and `[a..b]` just as it does to a method.

| Operator | Means | Allocates |
|---|---|---|
| `a == b`, `a != b` | content equality, same answer as `a.equals(b)` | no |
| `a < b`, `a <= b`, `a > b`, `a >= b` | sign of `a.compare(b)`, byte order | no |
| `a + b` | `a.concat(b)` | **yes** |
| `s[i]` | `s.charAt(i)` — the byte at `i`, NUL out of range | no |
| `s[start..end]` | `s.slice(start, end)` — half-open, clamped | **yes** |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let path = "src/main.psm"

    if (path.endsWith(".psm")) { println("prismio source") }

    let name = path[4..12]
    println(name)

    let label = "file: " + name
    println(label)

    if (name < "n") { println("sorts before n") }
    return 0
}
```

### `==` compares content, not addresses

A `String` is a pointer, so a raw address comparison would quietly answer
"not equal" for two equal strings. `==` is the content comparison; there is no
way to spell the address one.

### A chain of `+` is a single allocation

`a + b + c` becomes one `a.concat(b, c)`, not two nested calls. This is a
correctness measure rather than an optimisation: the intermediate of a nested
concatenation is a value nothing names, so the pairwise form would leak once per
`+`. Chains of up to six parts are supported; past that, build a `List<String>`
and call `strJoin`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let user = "ada"
    let host = "example.com"

    // One allocation, not two.
    let address = user + "@" + host
    println(address)
    return 0
}
```

`+` requires both sides to be Strings. The language does not promote anything
implicitly, so convert first — `"n = " + count.toString()`.

## Properties

A property is a method call with the parentheses left off. **A property never
allocates**: the rewrite is refused when the function it resolves to returns an
owned value, so `s.trim` is a compile error naming the fix and `s.length` is not.
That keeps the "bind what allocates" rule visible — anything that allocates has
parentheses on it.

| Property | Type | Meaning |
|---|---|---|
| `s.length` | `Int` | byte length; a multi-byte UTF-8 character counts as its bytes |
| `s.isEmpty` | `Bool` | length is zero |
| `s.isNotEmpty` | `Bool` | length is not zero |
| `s.isBlank` | `Bool` | empty, or nothing but whitespace |
| `s.first`, `s.last` | `Char` | first/last byte, NUL when empty |

## Iteration

`for c in s` yields each byte as a `Char`. The string is borrowed, not moved, so
it is still usable afterwards.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let text = "a1b2c3"
    let mut digits = 0

    for c in text {
        if (c.isDigit) { digits = digits + 1 }
    }

    println(digits)
    println(text.length)
    return 0
}
```

The collection has to be a **name**, not an expression. `for line in text.lines()`
is refused, because the loop needs the collection more than once and the result of
`lines()` must be bound anyway under the rule above:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let report = "alpha\nbeta\ngamma\n"
    let lines = report.lines()

    for line in lines {
        println(line)
    }
    return 0
}
```

`for i in 0..s.length` remains available and is what to use when the index itself
is wanted.

## Access and conversion

| Method | Returns | Allocates |
|---|---|---|
| `s.charAt(i)` | `Char` — NUL out of range | no |
| `s.byteAt(i)` | `Int` — no upper-bound check, use inside an established bound | no |
| `s.get(i)` | `Option<Char>` — `None` out of range | no |
| `s.clone()` | `String` | **yes** |
| `s.chars()` | `List<Char>` | **yes** |
| `s.bytes()` | `List<Int>` | **yes** |

`s[i]` and `s.charAt(i)` answer NUL rather than trapping, which is unambiguous
because a Prismio String cannot contain a NUL. `s.get(i)` is the form that makes
the absent case unavoidable.

## Comparison

| Method | Returns |
|---|---|
| `a.equals(b)` | `Bool` — same as `a == b` |
| `a.equalsIgnoreCase(b)` | `Bool` — ASCII fold, not a Unicode case fold |
| `a.compare(b)` | `Int` — negative, zero, or positive, by byte value |

## Searching

None of these allocate.

| Method | Returns |
|---|---|
| `s.contains(needle)` | `Bool` — `needle` may be a `String` or a `Char` |
| `s.startsWith(p)`, `s.endsWith(p)` | `Bool` — `String` or `Char` |
| `s.indexOf(needle)` | `Int` — first index, or `-1` |
| `s.indexOf(needle, from)` | `Int` — first index at or after `from`, or `-1` |
| `s.lastIndexOf(needle)` | `Int` — last index, or `-1` |
| `s.find(needle)` | `Option<Int>` — the same search without the sentinel |
| `s.count(needle)` | `Int` — non-overlapping occurrences |
| `s.matchesAt(needle, at)` | `Bool` — whether `needle` occurs exactly at `at` |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let line = "key = value"

    let at = line.indexOf('=')
    if (at < 0) { return 1 }

    let key = line[0..at].trim()
    let value = line[at + 1..line.length].trim()

    println(key)
    println(value)
    return 0
}
```

`indexOf` and `find` are the same search. The sentinel form is cheaper — an
`Option` with a payload is a tagged struct and an allocation — so `-1` is the
default and `find` is there for callers who would rather be made to handle the
absent case.

## Producing new strings

Every method here allocates and returns an owned `String`. Bind the result.

| Method | Meaning |
|---|---|
| `s.concat(other)` | same as `a + b` |
| `s.substring(start, length)` | **length**-based; a range past the end is clamped |
| `s.slice(start, end)` | **end**-exclusive; same as `s[start..end]` |
| `s.trim()`, `s.trimStart()`, `s.trimEnd()` | space, tab, newline, carriage return |
| `s.trimChars(set)` | trim any byte appearing in `set`, from both ends |
| `s.toUpper()`, `s.toLower()` | ASCII only |
| `s.capitalize()` | first byte uppercased, rest untouched |
| `s.reverse()` | by byte |
| `s.repeat(n)` | `n` copies |
| `s.padStart(w, pad)`, `s.padEnd(w, pad)`, `s.padCenter(w, pad)` | pad to width `w` |
| `s.replace(old, new)` | every occurrence |
| `s.replaceFirst(old, new)` | the first occurrence |
| `s.insert(at, other)` | `at` past the end appends |
| `s.removeRange(start, length)` | clamped |
| `s.stripPrefix(p)`, `s.stripSuffix(p)` | `Option<String>` — `None` when absent |

`substring` takes a length and `slice` takes an end. Both exist because `s[a..b]`
is end-exclusive, and reading a range as a length is the mistake the pair is meant
to prevent.

`replace` does not rescan its own replacement, so replacing `a` with `aa`
terminates.

## Splitting and joining

| Method | Returns |
|---|---|
| `s.split(sep: Char)` | `List<String>` |
| `s.split(sep: String)` | `List<String>` |
| `s.splitWhitespace()` | `List<String>` — splits on runs, discards empty parts |
| `s.lines()` | `List<String>` |
| `parts.join(sep)` | `String` — the inverse, on a `List<String>` receiver |

`s.lines()` is not `s.split('\n')`, and the two differences are the ones that bite
when reading a file: a trailing newline **ends** the last line rather than starting
an empty one, and a CRLF file does not leave a `\r` on every element.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let csv = "ada,grace,alan"
    let names = csv.split(',')

    let rejoined = names.join(" and ")
    println(rejoined)
    return 0
}
```

## Scanning with a closure

| Method | Returns |
|---|---|
| `s.countIf(f)` | `Int` — bytes satisfying `f` |
| `s.indexWhere(f)` | `Int` — first index satisfying `f`, or `-1` |
| `s.allChars(f)`, `s.anyChars(f)` | `Bool` |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let token = "abc123"
    println(token.countIf(|c: Char| charIsDigit(c)))
    println(token.allChars(|c: Char| charIsAlnum(c)))
    return 0
}
```

There is no `each`: a closure's return type has no `Void` spelling yet, so
`|c: Char| println(c)` does not typecheck. Use `for c in s`, which needs no
closure at all.

## `Char`

`Char` is a **byte**, not a Unicode scalar. Every predicate below is ASCII-only.

| Method | Returns |
|---|---|
| `c.isDigit`, `c.isAlpha`, `c.isAlnum` | `Bool` (properties) |
| `c.isLower`, `c.isUpper`, `c.isSpace` | `Bool` (properties) |
| `c.digitValue` | `Int` (property) |
| `c.toUpper()`, `c.toLower()` | `Char` |
| `c.code()` | `Int` — the byte value |
| `c.toString()` | `String` — **allocates** |

## Parsing and formatting

| Method | Returns |
|---|---|
| `s.parseInt()` | `Option<Int>` |
| `s.parseIntOr(fallback)` | `Int` |
| `s.parseFloat()` | `Option<Float>` |
| `s.parseBool()` | `Option<Bool>` — exactly `"true"`/`"false"`, case-insensitively |
| `n.toString()` | `String` — on `Int`, `U64`, `Bool`, and `Char`; **allocates** |

`parseInt` returns `Option<Int>` rather than a number, which is the distinction a C
`atoi` cannot make: it returns 0 for `"0"` and 0 for `"banana"`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.option

fn main() -> Int {
    let port = "8080".parseIntOr(80)
    println(port)

    let maybe = "not a number".parseInt()
    if (optionIsNone(maybe)) { println("rejected") }
    return 0
}
```

`parseFloat` is **not correctly rounded**. Digits are accumulated as an integer and
divided by a power of ten once, so the result is within one ulp but is not always
the nearest double to the decimal text. Use it for configuration and input; do not
use it where a decimal literal must round-trip bit-for-bit.

## Prefixed free functions

Most methods have a `strX` free function behind them — `s.trim()` is `strTrim(s)`,
and `strTrim` is where the implementation lives. Both spellings are supported and
neither is deprecated. The prefix exists because Prismio has no namespacing yet: a
method is a free function whose first parameter is the receiver, so a method name
is a global name, and `strTrim` is what keeps this module's names out of an
application's.

**Five have no prefixed twin: `equals`, `concat`, `slice`, `charAt` and
`compare`.** These are what the operators above lower to, so they carry the
implementation directly and `strEquals`, `strConcat`, `strSlice`, `strCharAt` and
`strCompare` no longer exist. Call the method, or write the operator.

**Do not declare these as `extern fn` yourself.** The wrapper carries the ownership
contract; an extern with no contract has unknown provenance, so the result gets no
owner and leaks on every call.

## Performance

`std.string` is native Prismio down to three compiler primitives — read a byte,
write a byte, allocate the buffer.

`String` carries its byte length, so `s.length` is a field read rather than a scan.
On an Apple-silicon benchmark, removing the old `strlen` call took the uppercase
workload from 0.520s to 0.271s, level with C at 0.272s. Substring search uses
Crochemore-Perrin Two-Way with a SIMD candidate prefilter; measured against pure C
and pure Rust programs it is the fastest of the four on every search workload.

Every producing function allocates its result once and fills it in a single pass,
so each is linear in the length of its output.

## Not implemented

String interpolation, Unicode scalar or grapheme iteration, a string builder,
normalization, a regex module, and locale-aware collation. `Char` is a byte, so
`toUpper` and `toLower` are ASCII-only.

## FFI caution

A Prismio `String` is a pointer-and-length pair and should not be assumed to match
an arbitrary C `char *` contract. Declare `borrow`, `consume`, `retain`, `alias`, or
`produce(free_fn)` accurately, and write a C adapter when terminators, encoding,
allocation, or lifetime differ.
