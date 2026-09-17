---
title: Lexical structure
description: Prismio 0.1 identifiers, comments, literals, punctuation, and reserved words.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-03"
tags: [lexer, comments, literals, keywords]
related: [specification/grammar, language/operators, language/types]
---

Prismio source files use the `.psm` extension and are read as UTF-8 text. A UTF-8 byte-order mark at the start of a file is ignored. Source is tokenized before parsing; whitespace and comments separate tokens but otherwise have no runtime meaning.

Statements are separated by their grammar and line structure, not by semicolons. Do not add `;` after a binding, call, assignment, or return.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let answer = 40 + 2
    println(answer)
    return 0
}
```

## Whitespace and comments

Spaces, tabs, and newlines may appear between tokens. Use `//` for a line comment; it continues through the next newline.

```prismio
// The entry point can return a process status.
fn main() -> Int {
    let value = 42 // comments may follow code
    return value
}
```

`/* ... */` is a block comment, and block comments **nest**:

<!-- prismio-check: pass -->
```prismio
import std.io

/* An outer comment
   /* holding an inner one */
   which the inner closing delimiter did not end. */

fn main() -> Int {
    let value = 21 /* comments are whitespace, so they fit anywhere whitespace fits */ * 2
    println(value)
    return 0
}
```

Nesting is why the feature is worth having. In the C form, commenting out a region that already contains a comment ends the outer comment at the first inner `*/`, turning the rest of the region back into code — usually without a syntax error to say so. Prismio counts depth, so wrapping a region is safe however many comments it already holds.

Two things nesting does not do. A `//` inside a block comment is not a line comment: it neither hides a following closing delimiter nor protects a stray opening one, because depth counts delimiters and nothing else. That also applies to prose — a closing delimiter written inside a comment, even in backticks, closes it. And an unclosed `/*` is an error reported at the opening delimiter, not at the end of the file — every unterminated comment reaches the end of the file, so that position identifies nothing.

Documentation-comment syntax is not supported in 0.1. Consecutive `//` lines are ordinary comments; the documentation generator does not extract API documentation from them.

## Identifiers

Identifiers name bindings, functions, fields, structs, enums, variants, and regions. Use letters or `_` at the beginning and letters, digits, or `_` afterward. Identifiers are case-sensitive: `point`, `Point`, and `POINT` are different names.

By convention, types and enum variants use `UpperCamelCase`, while functions, bindings, fields, and region names use `snake_case`. These are conventions, not compiler-enforced casing rules.

A reserved word cannot be used as an identifier. Name resolution also distinguishes declaration kinds: a local binding can shadow an outer binding, while duplicate top-level declarations of the same kind are normally rejected.

## Integer literals

Integer literals are decimal: `0`, `42`, and `5000000000`. A leading `-` is a unary operator rather than part of the token, which matters when the compiler checks types and constant expressions.

Literal values are checked against their contextual type. For example, `255` fits `U8`, but `256` does not. There are no hexadecimal, octal, or binary literal prefixes and no digit separators in 0.1.

```prismio
let signed: Int = -42
let byte: U8 = 255
let wide: U64 = 5000000000
```

## Floating-point and Boolean literals

A decimal point produces a `Float` literal, such as `1.5` or `0.0`. `Float` is the only floating-point type in 0.1 and maps to a 64-bit IEEE-style backend value.

The Boolean literals are `true` and `false`. Prismio does not treat integers as conditions, so `if (1)` is invalid; the condition must have type `Bool`.

## Strings and characters

Strings use double quotes and characters use single quotes:

```prismio
let message: String = "line one\nline two"
let initial: Char = 'P'
```

String and character escapes include `\n`, `\t`, `\r`, `\\`, `\"`, and `\'`. Character literals additionally support `\0`; a NUL escape is rejected in a string. Hexadecimal and binary literals are not implemented.

**A `"..."` literal is one line.** A newline inside one is an error rather than part of the text, which is what makes a missing closing quote a mistake reported on the line that made it instead of a string that swallows the rest of the file:

```text
error[P2001]: unterminated string literal; multiline strings require triple quotes """..."""
```

### Triple-quoted strings

`"""..."""` spans lines, and holds its text as written — the same pair of spellings as Kotlin.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let usage = """Usage: tool [options] <file>
  -v   verbose
  -h   this text"""
    println(usage)
    return 0
}
```

Inside `"""`, a `\n` is a backslash followed by an `n` and a `"` is a quote — there are no escapes to write and none to read, so a Windows path or a regular expression goes in unchanged. Quotes are literal as long as three in a row do not appear, since three is what ends the literal.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let pattern = """C:\logs\"today".txt"""
    println(strLength(pattern))
    return 0
}
```

Interpolation works in both forms, and lowers to `show(...)` — so a file that interpolates imports `std.display`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.display

fn main() -> Int {
    let name = "world"
    println("""Hello ${name},
welcome.""")
    return 0
}
```

`Char` is a byte-sized character in 0.1, not a Unicode scalar-value type. A string is runtime-managed, move-only data. Source files are UTF-8, but the current character representation should not be described as full Unicode text semantics.

Byte-prefixed string syntax is not implemented.

## The `none` literal

`none` represents absence for an optional reference-shaped type. It needs a contextual optional type in places where the compiler cannot infer one.

```prismio
struct Node { value: Int, next: Node? }

fn empty_next() -> Node? {
    return none
}
```

`none` is not a universal null value. Scalar types such as `Int`, `Bool`, and `Char` cannot be optional in 0.1.

## Punctuation and operators

Braces delimit blocks and declarations. Parentheses delimit parameter lists, call arguments, and control-flow conditions. Brackets form array types, array literals, and index expressions. A dot selects fields and enum variants, while `..` forms a half-open integer range in `for`.

The lexer recognizes the operator spellings documented in [operators and casts](/language/operators). A longer token wins where punctuation shares a prefix, so `!=`, `<=`, `>=`, `<<`, `>>`, and compound assignments are each single tokens.

## Reserved vocabulary

Implemented words include `import`, `let`, `mut`, `fn`, `extern`, `struct`, `enum`, `if`, `else`, `match`, `while`, `loop`, `for`, `in`, `break`, `continue`, `return`, `and`, `or`, `as`, `sink`, `inout`, `region`, `unique`, and `none`.

`trait`, `impl`, and `throw` are lexed as reserved words but their constructs are not parsed in 0.1. They are Coming Soon, not partially supported features.

## Lexical errors

The compiler rejects an unterminated string or character, an unsupported escape, an invalid character literal, or a character that cannot begin any token. Lexical errors happen before imports are semantically merged or types are checked, so correct the source spelling first.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let text = "nul: \0"
    return 0
}
```

This program is invalid because the 0.1 lexer does not allow the NUL escape inside a string. The same escape is valid in a `Char` literal.

## Current limitations

- Only `//` comments are recognized.
- Numeric bases and numeric separators are unavailable.
- A byte-string prefix is unavailable; for raw text use a triple-quoted string, which takes its content as written.
- `Char` is byte-sized rather than a complete Unicode character abstraction.
- Reserved future words cannot be repurposed as identifiers even though their features are not parsed.

The [grammar reference](/specification/grammar) describes how these tokens form declarations, statements, and expressions.
