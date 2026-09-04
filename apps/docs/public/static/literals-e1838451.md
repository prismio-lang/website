# Literals

A **literal** is a fixed value written directly in source code. Prismio supports a rich set of literal forms covering all primitive types, with convenient syntax for numbers in multiple bases, special characters, interpolated strings, and more.

---

## Integer Literals

Integer literals default to type `Int` (64-bit signed). You can specify a different integer type with a type annotation or suffix.

### Decimal

Standard base-10 integers:

```prismio
let a = 0
let b = 42
let c = -17
let d = 1000000
```

### Underscore Separators

Use `_` to improve readability of large numbers. Underscores are ignored by the compiler:

```prismio
let million    = 1_000_000
let billion    = 1_000_000_000
let credit     = 4_539_1488_0343_6467   // credit card style grouping
```

### Hexadecimal (Base 16)

Prefix with `0x` or `0X`. Letters `a`–`f` are case-insensitive:

```prismio
let red:   Int = 0xFF0000
let green: Int = 0x00FF00
let blue:  Int = 0x0000FF
let alpha: Int = 0xDE_AD_BE_EF
let reg:   Int = 0xCAFEBABE
```

### Binary (Base 2)

Prefix with `0b` or `0B`:

```prismio
let flags:    Int = 0b1010_1100
let readBit:  Int = 0b0000_0001
let writeBit: Int = 0b0000_0010
let execBit:  Int = 0b0000_0100

let perms = readBit | writeBit   // 0b0000_0011
```

### Octal (Base 8)

Prefix with `0o` or `0O`:

```prismio
let perm755: Int = 0o755   // rwxr-xr-x
let perm644: Int = 0o644   // rw-r--r--
let byte:    Int = 0o377   // 255 in octal
```

### Integer Type Suffixes

> 🚧 **Coming Soon** – Numeric type suffixes are planned. Currently, use a type annotation instead.

```prismio
// Planned syntax:
let small = 42i8     // Int8
let medium = 1000i32 // Int32
let big = 9999i64    // Int64
let unsigned = 255u  // UInt

// Current idiomatic style:
let small: Int8  = 42
let medium: Int32 = 1000
```

---

## Float Literals

Float literals contain a decimal point and default to `Float` (64-bit). Use the `f` suffix or explicit type annotation for `Float32`.

```prismio
let pi    = 3.14159265358979
let e     = 2.71828182845904
let zero  = 0.0
let neg   = -1.5
```

### Scientific Notation

Use `e` or `E` for powers of 10:

```prismio
let lightSpeed = 2.998e8      // 2.998 × 10⁸ m/s
let electron   = 9.109e-31    // 9.109 × 10⁻³¹ kg
let avogadro   = 6.022E23     // 6.022 × 10²³
```

### Float32 Literals

Append `f` to produce a `Float32` literal:

```prismio
let x: Float32 = 3.14f
let y = 1.5f             // inferred as Float32
```

---

## Boolean Literals

There are exactly two boolean literals: `true` and `false`.

```prismio
let isActive = true
let hasErrors = false

let result = isActive && !hasErrors   // true
```

---

## Character Literals

Character literals are single Unicode scalar values enclosed in single quotes (`'`):

```prismio
let letter  = 'A'
let digit   = '7'
let space   = ' '
let emoji   = '🚀'
```

### Escape Sequences in Char Literals

| Literal  | Meaning                  |
|----------|--------------------------|
| `'\\'`   | Backslash (`\`)          |
| `'\''`   | Single quote (`'`)       |
| `'\"'`   | Double quote (`"`)       |
| `'\n'`   | Newline (LF)             |
| `'\r'`   | Carriage return (CR)     |
| `'\t'`   | Horizontal tab           |
| `'\0'`   | Null character           |
| `'\u{N}'`| Unicode code point (hex) |

```prismio
let newline = '\n'
let tab     = '\t'
let null    = '\0'
let smiley  = '\u{1F600}'   // 😀
let heart   = '\u{2665}'    // ♥
let pi      = '\u{03C0}'    // π
```

---

## String Literals

String literals are sequences of UTF-8 characters enclosed in double quotes (`"`):

```prismio
let greeting = "Hello, World!"
let empty    = ""
let unicode  = "こんにちは"
let emoji    = "I love Prismio 🔥"
```

### Escape Sequences in Strings

The same escape sequences available in char literals work in strings:

```prismio
let path    = "C:\\Users\\vibrant\\Documents"
let newline = "Line 1\nLine 2"
let tab     = "Column1\tColumn2"
let quote   = "She said \"hello\""
let unicode = "Pi is \u{03C0}"
```

---

## String Interpolation

Embed any expression into a string using `${}`. The expression is evaluated, converted to its string representation, and inserted inline.

```prismio
let name = "Prismio"
let version = 1

println("Welcome to ${name} v${version}!")
// Welcome to Prismio v1!
```

Interpolation can contain arbitrary expressions:

```prismio
let width  = 10
let height = 5

println("Area: ${width * height}")           // Area: 50
println("Double: ${width * 2}")              // Double: 20
println("Name: ${"prismio".toUpperCase()}")  // Name: PRISMIO
println("Sum: ${[1, 2, 3].reduce(0) { a, b -> a + b }}")  // Sum: 6
```

### Nested Interpolation

```prismio
let items = ["apple", "banana", "cherry"]
println("Items (${items.length}): ${items.join(", ")}")
// Items (3): apple, banana, cherry
```

### Single Identifier Shorthand

When the expression is a single identifier, you can use `$name` without braces:

> 🚧 **Coming Soon** – Single-identifier shorthand `$name` is planned. Use `${name}` for now.

```prismio
// Planned:
println("Hello, $name!")

// Current:
println("Hello, ${name}!")
```

---

## Multiline Strings

Use triple double-quotes (`"""`) for strings that span multiple lines:

```prismio
let poem = """
    Roses are red,
    Violets are blue,
    Prismio is fast,
    And memory-safe too.
    """

println(poem)
```

### Indentation Trimming

The compiler trims leading whitespace based on the indentation of the closing `"""`. This means you can indent your multiline strings with your code without getting extra spaces in the output:

```prismio
fn getHtml() -> String {
    return """
        <html>
            <body>
                <p>Hello</p>
            </body>
        </html>
        """
    // No leading spaces in the result — indentation is stripped
}
```

### Interpolation in Multiline Strings

String interpolation works inside triple-quoted strings too:

```prismio
let user = "Alice"
let score = 9850

let report = """
    Player Report
    =============
    Name:  ${user}
    Score: ${score}
    Rank:  ${if score > 9000 { "S" } else { "A" }}
    """

println(report)
```

---

## Raw Strings

Prefix a string with `r` to disable all escape processing. Every character is taken literally — backslashes have no special meaning:

```prismio
let windowsPath = r"C:\Users\vibrant\Documents\file.txt"
let regex       = r"\d{3}-\d{4}"
let latex       = r"\frac{1}{2} \cdot \pi^{2}"

println(windowsPath)   // C:\Users\vibrant\Documents\file.txt
println(regex)         // \d{3}-\d{4}
```

Raw strings cannot contain the `"` character directly. If you need embedded quotes in a raw string, use a multiline raw string:

```prismio
// Planned — raw multiline strings
let json = r"""
    {
        "name": "Prismio",
        "version": 1
    }
    """
```

---

## Array Literals

Arrays are created with square brackets:

```prismio
let ints   = [1, 2, 3, 4, 5]
let floats = [1.1, 2.2, 3.3]
let words  = ["hello", "world"]
let empty: [Int] = []
```

---

## Tuple Literals

Tuples are created with parentheses:

```prismio
let pair   = (1, "hello")
let triple = (true, 3.14, 'x')
let named  = (x: 10, y: 20)
```

---

## `none` Literal

The `none` literal represents an absent optional value:

```prismio
let missing: Int? = none
let name: String? = none

println(missing ?? 0)      // 0
println(name ?? "unknown") // unknown
```

---

## Numeric Literal Quick Reference

| Form              | Example             | Type        |
|-------------------|---------------------|-------------|
| Decimal integer   | `42`, `1_000_000`   | `Int`       |
| Hexadecimal       | `0xFF`, `0xDE_AD`   | `Int`       |
| Binary            | `0b1010`, `0b1111_0000` | `Int`   |
| Octal             | `0o755`, `0o644`    | `Int`       |
| Float             | `3.14`, `-0.5`      | `Float`     |
| Float32           | `3.14f`             | `Float32`   |
| Scientific        | `1.5e10`, `9e-31`   | `Float`     |
| Boolean           | `true`, `false`     | `Bool`      |
| Character         | `'A'`, `'\n'`, `'\u{2665}'` | `Char` |
| String            | `"hello"`           | `String`    |
| Interpolated      | `"Hi ${name}"`      | `String`    |
| Multiline         | `"""..."""`         | `String`    |
| Raw string        | `r"C:\path"`        | `String`    |
| None              | `none`              | `T?`        |

---

## See Also

- [Types](../types.md)
- [Operators](./operators.md)
- [Variables](../statements/bindings.md)
- [Evaluation Order](./evaluation.md)
