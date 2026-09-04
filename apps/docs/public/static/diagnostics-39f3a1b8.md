# Diagnostics

The Prismio compiler produces structured, human-readable **diagnostic messages** when it encounters errors, potential issues, or notable situations in your code. This page explains the diagnostic format, the meaning of error codes, the different diagnostic levels, and how to interpret and resolve common errors.

---

## Diagnostic Format

Every diagnostic the compiler produces follows a consistent structure:

```
<level>[<code>]: <message>
  --> <file>:<line>:<column>
   |
<line> | <source code>
   |   <underline/caret>
   |
   = <note or help>
```

| Component        | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `level`          | Severity: `error`, `warning`, `note`, or `help`                |
| `code`           | Unique identifier for this class of diagnostic (e.g., `E0201`) |
| `message`        | Plain-English description of the problem                        |
| `file:line:col`  | Exact source location where the problem was detected            |
| Source snippet   | The lines of code surrounding the problem, with carets (`^`)   |
| `note` / `help`  | Additional context or a concrete suggested fix                  |

---

## Diagnostic Levels

Prismio diagnostics come in four levels:

| Level     | Prefix    | Exit Code | Description                                             |
|-----------|-----------|-----------|----------------------------------------------------------|
| `error`   | `error`   | Non-zero  | Fatal — compilation cannot proceed                      |
| `warning` | `warning` | `0`       | Non-fatal — compiles successfully but may have issues   |
| `note`    | `note`    | —         | Supplementary info attached to an error or warning      |
| `help`    | `help`    | —         | A concrete suggestion on how to fix the issue           |

### Promoting Warnings to Errors

To treat all warnings as errors (recommended in CI):

```bash
prismio build --deny-warnings
```

To suppress all warnings:

```bash
prismio build --allow-warnings
```

---

## Error Codes

Error codes use the format `E` followed by a four-digit number (e.g., `E0101`). They are grouped by category.

### E01xx — Syntax Errors

| Code    | Name                    | Description                                                  |
|---------|-------------------------|--------------------------------------------------------------|
| `E0101` | `unexpected_token`      | A token appeared where it was not expected                   |
| `E0102` | `missing_token`         | A required token (e.g., `}`) is absent                       |
| `E0103` | `invalid_literal`       | A literal value could not be parsed (e.g., `0xGG`)          |
| `E0104` | `unclosed_delimiter`    | A `(`, `[`, or `{` was opened but never closed              |
| `E0105` | `invalid_escape`        | An unrecognized escape sequence in a string literal          |

### E02xx — Type Errors

| Code    | Name                    | Description                                                  |
|---------|-------------------------|--------------------------------------------------------------|
| `E0201` | `type_mismatch`         | An expression's type does not match the expected type        |
| `E0202` | `cannot_infer_type`     | The compiler could not infer a type; add an annotation       |
| `E0203` | `missing_return_type`   | A function's return type is missing or unresolvable          |
| `E0204` | `wrong_arg_count`       | Wrong number of arguments in a function call                 |
| `E0205` | `not_callable`          | An expression that is not a function was called              |
| `E0206` | `incompatible_types`    | Two types cannot be used together in an operation            |
| `E0207` | `missing_field`         | A struct literal is missing one or more required fields      |
| `E0208` | `unknown_field`         | A struct literal or access references a field that does not exist |
| `E0209` | `trait_not_implemented` | A type does not implement the required trait                 |

### E03xx — Name Resolution Errors

| Code    | Name                    | Description                                                  |
|---------|-------------------------|--------------------------------------------------------------|
| `E0301` | `undefined_variable`    | An identifier was used but never declared                    |
| `E0302` | `undefined_function`    | A called function does not exist in scope                    |
| `E0303` | `undefined_type`        | A type annotation refers to an unknown type                  |
| `E0304` | `undefined_module`      | An imported path does not resolve to a known module          |
| `E0305` | `use_after_move`        | A value was used after ownership was transferred             |
| `E0306` | `use_before_init`       | A variable was read before it was initialized                |
| `E0307` | `duplicate_definition`  | A name is defined more than once in the same scope           |

### E04xx — Ownership & Borrow Errors

| Code    | Name                    | Description                                                  |
|---------|-------------------------|--------------------------------------------------------------|
| `E0401` | `cannot_borrow_moved`   | Attempt to borrow a value that has already been moved        |
| `E0402` | `mutable_borrow_conflict` | A mutable borrow conflicts with an existing borrow         |
| `E0403` | `mutate_immutable`      | Attempt to mutate a variable declared with `let` (not `let mut`) |
| `E0404` | `lifetime_too_short`    | A borrowed reference outlives the value it refers to         |
| `E0405` | `double_free`           | A value may be dropped more than once                        |

### E05xx — Control Flow Errors

| Code    | Name                    | Description                                                  |
|---------|-------------------------|--------------------------------------------------------------|
| `E0501` | `missing_match_arm`     | A `match` expression is not exhaustive                       |
| `E0502` | `break_outside_loop`    | `break` used outside of a loop                               |
| `E0503` | `continue_outside_loop` | `continue` used outside of a loop                            |
| `E0504` | `return_outside_fn`     | `return` used outside of a function body                     |

---

## Example Diagnostic Messages

### Type Mismatch (`E0201`)

```
error[E0201]: type mismatch
  --> src/main.prism:8:18
   |
 8 |     let x: Int = "hello"
   |            ---   ^^^^^^^ expected `Int`, found `String`
   |            |
   |            expected due to this annotation
   |
   = help: if you intended to store a string, change the type to `String`:
           let x: String = "hello"
```

### Undefined Variable (`E0301`)

```
error[E0301]: undefined variable `count`
  --> src/main.prism:14:16
   |
14 |     println(count)
   |             ^^^^^ not found in this scope
   |
   = help: did you mean to declare it first?
           let count = 0
```

### Use After Move (`E0305`)

```
error[E0305]: use of moved value `name`
  --> src/main.prism:20:13
   |
17 |     let name = get_name()
   |         ---- value bound here
18 |     greet(name)
   |           ---- value moved into `greet` here
...
20 |     println(name)
   |             ^^^^ value used here after move
   |
   = note: `String` does not implement `Copy`, so it is moved
   = help: consider cloning the value before the move:
           greet(name.clone())
```

### Mutate Immutable Variable (`E0403`)

```
error[E0403]: cannot assign to immutable variable `x`
  --> src/main.prism:5:5
   |
 3 |     let x = 10
   |         - help: make this variable mutable: `let mut x`
 4 |     ...
 5 |     x = 20
   |     ^^^^^^ cannot assign twice to immutable variable
```

### Missing Match Arm (`E0501`)

```
error[E0501]: non-exhaustive `match` expression
  --> src/main.prism:22:5
   |
22 |     match direction {
   |     ^^^^^ patterns not covered
   |
   = note: the following variants are not covered:
           `Direction::West`
   = help: add a catch-all arm or handle the missing variant:
           Direction::West => { /* handle */ }
```

### Wrong Argument Count (`E0204`)

```
error[E0204]: function `add` takes 2 arguments, but 3 were supplied
  --> src/main.prism:11:18
   |
 3 | fn add(a: Int, b: Int) -> Int = a + b
   |    --- defined here with 2 parameters
...
11 |     let result = add(1, 2, 3)
   |                  ^^^^^^^^^^^ expected 2 arguments, found 3
```

### Unclosed Delimiter (`E0104`)

```
error[E0104]: unclosed delimiter `{`
  --> src/main.prism:7:20
   |
 7 | fn example() -> Int {
   |                     ^ unclosed delimiter
   |
   = note: the file ended while this block was still open
   = help: add a closing `}` at the end of the function body
```

---

## Warnings

Warnings do not prevent compilation but indicate code that may be incorrect or suboptimal.

### Unused Variable (`W0101`)

```
warning[W0101]: unused variable `temp`
  --> src/main.prism:9:9
   |
 9 |     let temp = calculate()
   |         ^^^^ variable assigned but never used
   |
   = help: prefix with `_` to suppress: `let _temp = calculate()`
   = note: `#[allow(unused_variable)]` suppresses this warning
```

### Dead Code (`W0102`)

```
warning[W0102]: function `legacy_helper` is never used
  --> src/utils.prism:34:1
   |
34 | fn legacy_helper() {
   |    ^^^^^^^^^^^^^ function is defined but never called
   |
   = note: `#[allow(dead_code)]` suppresses this warning
```

### Redundant Clone (`W0201`)

```
warning[W0201]: redundant `.clone()` call
  --> src/main.prism:18:17
   |
18 |     process(value.clone())
   |                   ^^^^^^^ value is `Copy` — `.clone()` is unnecessary
   |
   = help: remove the `.clone()` call:
           process(value)
   [auto-fixable with `prismio lint --fix`]
```

---

## Suggestions and Fixes in Error Output

Many Prismio diagnostics include an automatic fix suggestion. These are purely advisory — the compiler shows you the fix but does not apply it. To apply fixable lints automatically, use:

```bash
prismio lint --fix
```

Fixes are marked with `[auto-fixable]` in the diagnostic output.

---

## Common Error Patterns and Solutions

### "I forgot `mut`"

**Error:** `E0403 cannot assign to immutable variable`

**Solution:** Change `let x = ...` to `let mut x = ...`

```prismio
// ❌ Error
let counter = 0
counter = counter + 1

// ✅ Fixed
let mut counter = 0
counter = counter + 1
```

---

### "I used a value after passing it to a function"

**Error:** `E0305 use of moved value`

**Solution:** Either clone the value before passing it, or change the function to accept a reference (borrow).

```prismio
// ❌ Error
let data = loadData()
process(data)
println(data)    // error: moved

// ✅ Option 1: Clone
process(data.clone())
println(data)

// ✅ Option 2: Borrow (when the function supports it)
process(&data)
println(data)
```

---

### "My match is not exhaustive"

**Error:** `E0501 non-exhaustive match expression`

**Solution:** Add the missing variants, or add a wildcard `_` arm.

```prismio
// ❌ Error — missing arms
match color {
    Color::Red   => println("red"),
    Color::Green => println("green"),
}

// ✅ Fixed — all variants handled
match color {
    Color::Red   => println("red"),
    Color::Green => println("green"),
    Color::Blue  => println("blue"),
}

// ✅ Also valid — wildcard catch-all
match color {
    Color::Red => println("red"),
    _          => println("other"),
}
```

---

### "The compiler can't infer my type"

**Error:** `E0202 cannot infer type`

**Solution:** Add an explicit type annotation.

```prismio
// ❌ Error — ambiguous type
let items = []

// ✅ Fixed — annotated
let items: [Int] = []

// ✅ Also valid — inferred from usage
let mut items = []
items.push(42)   // Now inferred as [Int]
```

---

## Controlling Diagnostic Output

| Flag                    | Description                                             |
|-------------------------|---------------------------------------------------------|
| `--deny-warnings`       | Treat all warnings as errors                            |
| `--allow-warnings`      | Suppress all warnings                                   |
| `--no-color`            | Disable ANSI color codes in output                      |
| `--json-diagnostics`    | Emit diagnostics as newline-delimited JSON (for tooling)|
| `--error-limit <n>`     | Stop after emitting `n` errors (default: 50)            |

```bash
# Machine-readable output for editor integrations
prismio build --json-diagnostics 2> diagnostics.json
```

---

## See Also

- [Compiler Architecture](./compiler.md) – how the compiler produces diagnostics
- [Linter](./linter.md) – additional code quality warnings
- [Formatter](./formatter.md) – automatically fixing style issues
