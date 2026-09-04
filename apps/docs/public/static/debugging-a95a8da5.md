# Debugging Basics

Good debugging skills turn frustrating hours into productive minutes. This page covers practical techniques for diagnosing and fixing issues in Prismio programs — from understanding compiler error messages to print-based debugging and future debugger integration.

---

## Compiler Error Messages

The Prismio compiler produces structured, human-readable error messages. Learning to read them effectively is the most important debugging skill you can develop.

### Anatomy of a Compiler Error

```
error[E0301]: type mismatch
  → src/main.pr:8:18
   |
 6 |     let x: Int = 42
 7 |     let y: String = "hello"
 8 |     let z: Int = x + y
   |                      ^ expected `Int`, found `String`
   |
   = note: operator `+` requires both operands to have the same type
   = help: did you mean to convert `y` to `Int`? try: `y.toInt()`
```

| Part | Meaning |
|------|---------|
| `error[E0301]` | Unique error code — searchable in the error index |
| `type mismatch` | Human-readable error name |
| `→ src/main.pr:8:18` | File, line, and column |
| Code snippet | The exact lines with the problem highlighted |
| `note:` | Additional context explaining the error |
| `help:` | A suggested fix |

> **Tip:** Every error code (like `E0301`) can be looked up for a detailed explanation:
> ```bash
> prismio explain E0301
> ```

### Warning Messages

Warnings are non-fatal but indicate potential bugs:

```
warning[W0102]: unused variable `result`
  → src/main.pr:12:9
   |
12 |     let result = compute()
   |         ^^^^^^ variable is declared but never used
   |
   = help: if intentional, prefix with `_`: `let _result = compute()`
```

Treat warnings seriously — they often point to real bugs.

To promote all warnings to errors (recommended in CI):

```bash
prismio build --deny-warnings
```

---

## Common Error Scenarios and Fixes

### 1. Type Mismatch

```prismio
// ❌ Error: type mismatch
fn add(a: Int, b: Int) -> Int {
    return a + b
}

fn main() {
    let result = add(1, "two")  // "two" is String, not Int
    println(result)
}
```

```
error[E0301]: type mismatch
  → src/main.pr:7:22
  |
7 |     let result = add(1, "two")
  |                      ^^^^^ expected `Int`, found `String`
```

**Fix:**

```prismio
fn main() {
    let result = add(1, 2)  // ✅ Both are Int
    println(result)
}
```

---

### 2. Mutating an Immutable Variable

```prismio
// ❌ Error: cannot assign to immutable variable
fn main() {
    let count = 0
    count = count + 1  // count is immutable!
    println(count)
}
```

```
error[E0204]: cannot assign to immutable binding `count`
  → src/main.pr:4:5
  |
3 |     let count = 0
  |         ----- help: make this binding mutable: `let mut count`
4 |     count = count + 1
  |     ^^^^^ assignment to immutable binding
```

**Fix:**

```prismio
fn main() {
    let mut count = 0  // ✅ Declare as mutable
    count = count + 1
    println(count)
}
```

---

### 3. Undefined Variable

```prismio
// ❌ Error: undefined variable
fn main() {
    println(message)  // message is not defined
}
```

```
error[E0101]: cannot find value `message` in this scope
  → src/main.pr:3:13
  |
3 |     println(message)
  |             ^^^^^^^ not found in this scope
```

**Fix:**

```prismio
fn main() {
    let message = "Hello, World!"  // ✅ Define before use
    println(message)
}
```

---

### 4. Missing Return Value

```prismio
// ❌ Error: function declared to return Int but doesn't
fn double(n: Int) -> Int {
    let result = n * 2
    // Forgot to return!
}
```

```
error[E0302]: missing return value
  → src/main.pr:2:1
  |
2 | fn double(n: Int) -> Int {
  | ^^^^^^^^^^^^^^^^^^^^^^^^^ function declared to return `Int`
4 | }
  | ^ implicit return type is `Unit`
  |
  = help: add a `return` statement or make the last expression the return value
```

**Fix:**

```prismio
fn double(n: Int) -> Int {
    let result = n * 2
    return result  // ✅ Explicit return
}

// Or use expression body:
fn double(n: Int) -> Int = n * 2  // ✅ Implicit return
```

---

### 5. Ownership and Borrowing Errors

```prismio
// ❌ Error: use after move
fn consume(s: String) {
    println(s)
}

fn main() {
    let greeting = "Hello"
    consume(greeting)
    println(greeting)  // greeting was moved into consume()!
}
```

```
error[E0501]: use of moved value `greeting`
  → src/main.pr:9:13
  |
7 |     consume(greeting)
  |             -------- value moved here
8 |     println(greeting)
  |             ^^^^^^^^ value used here after move
  |
  = note: `String` does not implement `Copy`
  = help: consider borrowing: `consume(&greeting)`
```

**Fix — Borrow instead of move:**

```prismio
fn consume(s: &String) {  // ✅ Borrow instead
    println(s)
}

fn main() {
    let greeting = "Hello"
    consume(&greeting)    // ✅ Pass a reference
    println(greeting)     // ✅ Still valid
}
```

**Fix — Clone the value:**

```prismio
fn main() {
    let greeting = "Hello"
    consume(greeting.clone())  // ✅ Clone before moving
    println(greeting)
}
```

---

### 6. Index Out of Bounds

```prismio
fn main() {
    let nums = [1, 2, 3]
    println(nums[5])  // Index 5 doesn't exist!
}
```

At runtime (debug mode):

```
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 5'
  → src/main.pr:3:13
stack backtrace:
   0: prismio_runtime::panic::panic_handler
   1: main::main
```

**Fix — Bounds check first:**

```prismio
fn main() {
    let nums = [1, 2, 3]
    let idx = 5
    if idx < nums.size() {
        println(nums[idx])
    } else {
        println("Index $idx out of bounds (size: ${nums.size()})")
    }
}
```

**Fix — Use safe access:**

```prismio
fn main() {
    let nums = [1, 2, 3]
    match nums.get(5) {
        Some(val) -> println(val)
        None      -> println("Index not found")
    }
}
```

---

### 7. Import Not Found

```prismio
// ❌ Error: module not found
import myutils.StringHelper
```

```
error[E0401]: unresolved import `myutils.StringHelper`
  → src/main.pr:1:8
  |
1 | import myutils.StringHelper
  |        ^^^^^^^^^^^^^^^^^^^^ no module named `myutils` found
  |
  = help: did you mean `utils.StringHelper`?
  = note: search paths: src/, deps/
```

**Fix:** Check the module name and ensure the file exists at `src/utils/string_helper.pr` (module names are case-sensitive).

---

## Debug Builds

Always develop with debug builds (the default). Debug builds include:

- **Full debug symbols** (DWARF) for accurate line numbers in panic messages
- **Overflow checks** — panics on integer overflow instead of silently wrapping
- **Bounds checks** — panics with a helpful message on array index violations
- **Ownership assertions** — extra validity checks in the runtime

```bash
# Debug build (default) — use this during development
prismio build

# Never use --release during active development
# Release builds disable safety checks for maximum performance
prismio build --release
```

### Reading Panic Messages

A panic in debug mode shows the full call chain:

```
thread 'main' panicked at 'attempt to subtract with overflow'
  → src/math.pr:14:18
stack backtrace:
   0: prismio_runtime::panic::panic_handler
   1: math::subtract
        at src/math.pr:14
   2: main::computeDelta
        at src/main.pr:22
   3: main::main
        at src/main.pr:8
```

Read the backtrace **from the bottom up**: execution started at `main()`, called `computeDelta()`, which called `subtract()`, which panicked at `math.pr:14`.

---

## Print Debugging

Print debugging is quick, effective, and always available. Prismio's `println` and `print` are your primary tools.

### Basic Print Debugging

```prismio
fn computeTotal(items: [Int]) -> Int {
    let mut total = 0
    for item in items {
        println("[DEBUG] Processing item: $item, total so far: $total")  // 👈 debug print
        total = total + item
    }
    println("[DEBUG] Final total: $total")
    return total
}
```

### Using `dbg()` — Debug-Print an Expression

Prismio provides a `dbg()` helper that prints a value along with the file and line number, then returns the value unchanged. This lets you inspect values inline without restructuring your code:

```prismio
fn main() {
    let x = 5
    let y = dbg(x * 2) + 1  // Prints the value and passes it through
    println(y)
}
```

Output:

```
[src/main.pr:3] x * 2 = 10
11
```

> 🚧 **Coming Soon** – The `dbg()` macro is planned but not yet implemented.

### Inspecting Data Structures

If a type implements `toString()`, it can be interpolated directly:

```prismio
struct Point {
    x: Int
    y: Int

    fn toString() -> String = "Point($x, $y)"
}

fn main() {
    let p = Point(x: 3, y: 7)
    println("Current position: $p")  // Output: Current position: Point(3, 7)
}
```

### Conditional Debug Output

Avoid shipping debug prints by wrapping them in a compile-time flag:

```prismio
let DEBUG = true  // Set to false for production

fn debugLog(msg: String) {
    if DEBUG {
        println("[DEBUG] $msg")
    }
}

fn main() {
    debugLog("Starting computation")
    // ...
}
```

Or use environment variables at runtime:

```prismio
import std.env

fn main() {
    let verbose = env.get("VERBOSE") == Some("1")
    if verbose {
        println("[INFO] Verbose mode enabled")
    }
}
```

```bash
VERBOSE=1 prismio run
```

### Measuring Performance

Use `std.time` to time sections of code:

```prismio
import std.time

fn main() {
    let start = time.now()

    // ... your code here ...
    let result = expensiveComputation()

    let elapsed = time.now() - start
    println("Computation took ${elapsed.milliseconds()}ms")
    println("Result: $result")
}
```

---

## Compile-Time Debug Information

### Verbose Compiler Output

```bash
# Show detailed compilation steps
prismio build --verbose

# Show generated LLVM IR
prismio build --emit-llvm

# Show type-checked AST
prismio build --dump-ast

# Show each module as it's compiled
prismio build --print-modules
```

Sample `--verbose` output:

```
[1/4] Parsing src/main.pr
[2/4] Type checking src/main.pr
[3/4] Generating LLVM IR
[4/4] Linking with LLVM backend (x86_64)
  → Finished [debug] target in 0.42s
```

---

## Runtime Assertions

Use `assert()` to embed correctness checks that panic if violated:

```prismio
fn divide(a: Int, b: Int) -> Int {
    assert(b != 0, "Cannot divide by zero! b = $b")
    return a / b
}

fn main() {
    println(divide(10, 2))   // ✅ 5
    println(divide(10, 0))   // 💥 Panics with message
}
```

Panic output:

```
thread 'main' panicked at 'Assertion failed: Cannot divide by zero! b = 0'
  → src/main.pr:2:5
```

In release builds, assertions are **retained by default** (unlike some languages). To strip them for maximum performance:

```bash
prismio build --release --no-assertions
```

---

## Future: Debugger Integration

> 🚧 **Coming Soon** – Full debugger integration is planned for a future release.

Since debug builds emit LLVM DWARF debug symbols, you can already use `gdb` or `lldb` to inspect your program today, with some limitations:

```bash
# Build with debug symbols
prismio build

# Launch with GDB (Linux)
gdb ./build/debug/my_project
(gdb) run
(gdb) break main.pr:10
(gdb) continue
(gdb) print result

# Launch with LLDB (macOS)
lldb ./build/debug/my_project
(lldb) run
(lldb) breakpoint set --file main.pr --line 10
(lldb) continue
(lldb) frame variable result
```

Planned official debugger features include:

| Feature | Status |
|---------|--------|
| Breakpoints in `.pr` files | 🚧 Planned |
| Variable inspection with Prismio types | 🚧 Planned |
| Step through, step into, step out | 🚧 Planned |
| Watch expressions | 🚧 Planned |
| IntelliJ IDEA debugger integration | 🚧 Planned |
| VS Code debugger integration | 🚧 Planned |
| Memory view (ownership graph) | 🚧 Planned |

---

## Debugging Checklist

When you encounter a bug, work through this checklist:

1. **Read the error message carefully.** Prismio errors include the location, the problem, and often a suggested fix.
2. **Check the line number.** Compiler errors point to the exact location.
3. **Use `prismio explain <error_code>`** for a detailed explanation with examples.
4. **Add debug prints** around the suspected area to narrow down the problem.
5. **Check your types.** Most logic errors in statically-typed languages come from unexpected types.
6. **Verify mutability.** If a value isn't changing, check that you declared it with `let mut`.
7. **Check ownership.** If you're getting use-after-move errors, consider borrowing (`&`) instead.
8. **Simplify.** Comment out sections until the error disappears, then narrow down.
9. **Rebuild from scratch.** Run `prismio clean && prismio build` to rule out stale cache issues.

---

## Next Steps

- [Build & Run](./build_run.md) – Build flags and debug/release modes
- [Editor Setup](./editor_setup.md) – Set up real-time error highlighting
- [Migration Guide](./migration.md) – Common gotchas when coming from other languages
