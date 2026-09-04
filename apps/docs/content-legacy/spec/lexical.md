# Lexical Structure

This page describes the lexical structure of Prismio source files — the rules for tokenizing source text into the primitive elements the parser works with.

## Source Files

Prismio source files:
- Are encoded in **UTF-8**
- Have the extension `.pr`
- May contain any Unicode character in string/character literals and comments
- Use Unix-style line endings (`\n`) recommended; Windows-style (`\r\n`) is accepted

## Whitespace

Whitespace (spaces, tabs, newlines) is insignificant in Prismio except as a separator between tokens. The Prismio formatter (`prismfmt`) normalizes whitespace according to the style guide.

```
Whitespace ::= ' ' | '\t' | '\n' | '\r' | '\r\n'
```

## Comments

Prismio supports three comment styles:

### Line Comments
```prismio
// This is a line comment
let x = 5  // Inline comment
```

### Block Comments
```prismio
/* This is a
   block comment */

/* Block comments /* can be nested */ in Prismio */
```

### Documentation Comments
```prismio
/// Single-line doc comment for the item that follows.
/// Supports **Markdown** formatting.
fn add(a: Int, b: Int) -> Int = a + b

/**
 * Multi-line doc comment.
 * Used for longer descriptions.
 */
fn complexFunction() { }
```

Documentation comments are attached to the next declaration and are used by the doc generator.

---

## Keywords

The following identifiers are reserved keywords in Prismio and may not be used as variable or function names:

### Control Flow
| Keyword | Description |
|---------|-------------|
| `if` | Conditional expression |
| `else` | Alternative branch |
| `match` | Pattern matching expression |
| `for` | For loop |
| `while` | While loop |
| `loop` | Infinite loop |
| `break` | Break out of a loop |
| `continue` | Continue to next loop iteration |
| `return` | Return from a function |

### Declarations
| Keyword | Description |
|---------|-------------|
| `fn` | Function declaration |
| `let` | Variable binding |
| `mut` | Mutability modifier |
| `pub` | Public visibility |
| `import` | Module import |
| `as` | Import alias |
| `in` | Range iteration (`for x in ...`) |

### Literals
| Keyword | Description |
|---------|-------------|
| `true` | Boolean true literal |
| `false` | Boolean false literal |

### Reserved for Future Use
| Keyword | Planned use |
|---------|-------------|
| `struct` | Struct type declaration |
| `enum` | Enum type declaration |
| `trait` | Trait declaration |
| `impl` | Implementation block |
| `type` | Type alias |
| `async` | Async function modifier |
| `await` | Await expression |
| `unsafe` | Unsafe block |
| `extern` | External function declaration |
| `mod` | Module declaration |
| `use` | Use declaration |
| `self` | Current module / value |
| `super` | Parent module |
| `where` | Generic constraints |
| `dyn` | Dynamic dispatch |

---

## Identifiers

Identifiers follow these rules:
- Start with a Unicode letter or underscore (`_`)
- Followed by any combination of letters, digits, or underscores
- Case-sensitive: `myVar`, `MyVar`, and `MYVAR` are distinct

```
Identifier ::= (Letter | '_') (Letter | Digit | '_')*
Letter     ::= any Unicode letter (XID_Start)
Digit      ::= '0'..'9'
```

### Examples
```prismio
// Valid identifiers
let x = 1
let myVariable = 2
let _private = 3
let CamelCase = 4
let snake_case = 5
let SCREAMING_SNAKE = 6
let π = 3.14159    // Unicode letters allowed

// Invalid identifiers
// let 2start = ...    // Cannot start with digit
// let my-var = ...    // Hyphens not allowed
```

---

## Literals

### Integer Literals
```prismio
let decimal     = 42
let hex         = 0xFF
let binary      = 0b1010
let octal       = 0o17
let withUnder   = 1_000_000    // underscores for readability
```

Integer types are inferred as `Int` (platform-native, typically 64-bit) by default. Use a suffix to specify:

```prismio
let i8  : Int8  = 127i8
let i16 : Int16 = 1000i16
let i32 : Int32 = 100000i32
let i64 : Int64 = 9999999999i64
let u32 : UInt32 = 42u32
```

### Float Literals
```prismio
let f1 = 3.14
let f2 = 2.0
let f3 = 1.5e10      // scientific notation
let f4 = 6.022e-23
let f5 = 1_000.5
```

Default type is `Float` (64-bit). Suffix `f32` for 32-bit:
```prismio
let small: Float32 = 3.14f32
```

### Boolean Literals
```prismio
let yes = true
let no  = false
```

### Character Literals
```prismio
let c1 = 'a'
let c2 = '\n'    // newline
let c3 = '\t'    // tab
let c4 = '\\'    // backslash
let c5 = '\''    // single quote
let c6 = '\u{1F600}'  // Unicode code point (😀)
```

### String Literals
```prismio
let s1 = "Hello, World!"
let s2 = "Line 1\nLine 2"
let s3 = "Tab\there"
let s4 = "Quote: \""

// String interpolation
let name = "Prismio"
let greeting = "Hello, ${name}!"    // "Hello, Prismio!"
let expr = "2 + 2 = ${2 + 2}"      // "2 + 2 = 4"
```

### Raw String Literals
```prismio
// Raw strings: no escape processing
let raw = r"No \n escape here"
let regex = r"\d+\.\d+"   // useful for regex patterns
```

### Multiline Strings
```prismio
let poem = """
    Roses are red,
    Violets are blue,
    Prismio is fast,
    And memory-safe too.
    """
// Leading indentation stripped up to the closing """
```

---

## Operators and Punctuation

```
+    -    *    /    %          Arithmetic
==   !=   <    >    <=   >=   Comparison
&&   ||   !                   Logical
&    |    ^    ~    <<   >>   Bitwise
=    +=   -=   *=   /=   %=  Assignment
..   ..=                      Range
?.   ??                       Optional (planned)
->                            Return type arrow
=>                            (reserved)
::                            Path separator (planned)
?                             Error propagation
@                             Attribute prefix
#                             Attribute prefix (planned)
(    )                        Parentheses
{    }                        Braces
[    ]                        Brackets
,                             Comma
.                             Field access / method call
:                             Type annotation
;                             Statement separator
_                             Wildcard pattern
```

---

## Token Summary

| Token Type | Examples |
|------------|---------|
| Keywords | `fn`, `let`, `if`, `for`, `match` |
| Identifiers | `x`, `myVar`, `List`, `_unused` |
| Integer literals | `42`, `0xFF`, `0b1010` |
| Float literals | `3.14`, `1.5e10` |
| Bool literals | `true`, `false` |
| Char literals | `'a'`, `'\n'` |
| String literals | `"hello"`, `"${name}"` |
| Operators | `+`, `==`, `&&`, `..` |
| Punctuation | `,`, `;`, `(`, `)`, `{`, `}` |
| Comments | `// ...`, `/* ... */`, `/// ...` |
