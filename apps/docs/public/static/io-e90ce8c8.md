# I/O

Prismio's I/O system covers reading from and writing to the terminal, formatting output, and (in future releases) working with files. Basic I/O functions are part of the **prelude** — they're available in every file without an import. More advanced utilities require importing `std.io`.

---

## Console Output

### `print()` and `println()`

The two most fundamental I/O functions in Prismio:

```prismio
print("Hello")       // writes text without a trailing newline
println("Hello")     // writes text followed by '\n'
```

Both functions accept any value whose type implements the `Display` trait. All built-in types (`Int`, `Float`, `Bool`, `String`, `Char`, `Array`, `Optional`) implement `Display` by default:

```prismio
println(42)           // "42"
println(3.14)         // "3.14"
println(true)         // "true"
println('A')          // "A"
println([1, 2, 3])    // "[1, 2, 3]"
println(Optional.some("hi")) // "Some(hi)"
println(Optional.none<Int>()) // "None"
```

### Printing Multiple Values

`print` and `println` accept a single argument. Use string interpolation to combine values:

```prismio
let name = "Alice"
let score = 98

println("Player: ${name}, Score: ${score}")
// Player: Alice, Score: 98

print("x = ${2 + 2}")
print(", ")
print("y = ${3 * 3}")
println("")
// x = 4, y = 9
```

### Printing to Standard Error

> 🚧 **Coming Soon** – `eprintln` is planned but not yet implemented.

```prismio
import std.io.{ eprintln, eprint }

eprintln("Warning: disk space is low")   // writes to stderr
eprint("Error: ")
eprintln("connection refused")
```

Use `eprintln` for diagnostics, warnings, and error messages so that normal program output and error messages can be separated by the shell.

---

## String Interpolation and Formatting

Prismio uses `${}` interpolation inside string literals. Any expression can appear inside `${}`:

```prismio
let x = 10
let y = 20
println("${x} + ${y} = ${x + y}")   // 10 + 20 = 30

let items = ["a", "b", "c"]
println("Count: ${items.length()}")  // Count: 3

let user = "Bob"
println("Hello, ${user.toUpperCase()}!")  // Hello, BOB!
```

### `format()` Function

> 🚧 **Coming Soon** – Named format specifiers are planned.

The `format()` function (planned) will build a formatted `String` without printing it, enabling more advanced formatting control:

```prismio
import std.io.{ format }

let pi = 3.14159265358979

let s1 = format("{:.2}", pi)      // "3.14" — 2 decimal places
let s2 = format("{:>10}", "hi")   // "        hi" — right-align in width 10
let s3 = format("{:0>5}", 42)     // "00042" — zero-padded integer
let s4 = format("{:b}", 255)      // "11111111" — binary representation
let s5 = format("{:x}", 255)      // "ff" — hexadecimal (lowercase)
let s6 = format("{:X}", 255)      // "FF" — hexadecimal (uppercase)
let s7 = format("{:e}", 12345.0)  // "1.2345e4" — scientific notation

println(s1)  // 3.14
println(s3)  // 00042
```

Until `format()` is available, use string interpolation combined with built-in conversion methods:

```prismio
// Workaround: manual formatting today
fn padLeft(s: String, width: Int, pad: Char) -> String {
    let mut result = s
    while result.length() < width {
        result = pad.toString() + result
    }
    return result
}

println(padLeft("42", 5, '0'))   // "00042"
```

---

## Console Input

### `input()`

`input()` reads a single line from standard input (stdin), blocking until the user presses Enter. The trailing newline is stripped automatically.

```prismio
let line = input()
println("You typed: " + line)
```

With an optional prompt string:

```prismio
let name = input("Enter your name: ")
println("Hello, ${name}!")
```

### Reading and Parsing Input

`input()` always returns a `String`. To get a number, parse it explicitly:

```prismio
fn main() {
    let raw = input("Enter a number: ")

    match raw.toInt() {
        Optional.some(n) => println("Double: ${n * 2}")
        Optional.none()  => println("That's not a valid integer.")
    }
}
```

### Reading Multiple Values

```prismio
fn main() {
    let line = input("Enter two numbers separated by space: ")
    let parts = line.trim().split(" ")

    if parts.length() != 2 {
        println("Please enter exactly two numbers.")
        return
    }

    let a = parts[0].toInt()
    let b = parts[1].toInt()

    match (a, b) {
        (Optional.some(x), Optional.some(y)) => println("Sum: ${x + y}")
        _ => println("Invalid input.")
    }
}
```

### Reading Until EOF

> 🚧 **Coming Soon** – Reading multiple lines from stdin in a loop will be ergonomically supported via `std.io.readLines()`.

```prismio
// Future API (coming soon):
import std.io.{ readLines }

fn main() {
    let lines = readLines()   // reads all of stdin until EOF
    for line in lines {
        println("> " + line)
    }
}
```

---

## Buffered I/O

> 🚧 **Coming Soon** – Buffered I/O APIs are planned.

For performance-sensitive I/O, Prismio will provide `BufferedReader` and `BufferedWriter` which batch read/write operations to reduce system call overhead:

```prismio
import std.io.{ BufferedReader, BufferedWriter, stdin, stdout }

fn main() {
    let mut reader = BufferedReader.new(stdin())
    let mut writer = BufferedWriter.new(stdout())

    let line = reader.readLine()
    match line {
        Optional.some(text) => {
            writer.write("Echo: " + text + "\n")
            writer.flush()
        }
        Optional.none() => println("No input.")
    }
}
```

Buffered I/O will be especially important for:
- Processing large files line-by-line
- High-throughput network servers
- Piped command-line tools

---

## File I/O

> 🚧 **Coming Soon** – File I/O is part of the `std.fs` module, currently in development.

The planned file I/O API follows the same pattern as console I/O, using `Reader` and `Writer` traits:

```prismio
import std.fs.{ readFile, writeFile, appendFile }

fn main() {
    // Simple file read
    match readFile("input.txt") {
        Result.ok(contents) => println(contents)
        Result.err(e)       => eprintln("Failed to read: ${e}")
    }

    // Simple file write
    match writeFile("output.txt", "Hello, file!") {
        Result.ok(_) => println("Written successfully.")
        Result.err(e) => eprintln("Failed to write: ${e}")
    }

    // Append to file
    appendFile("log.txt", "New log entry\n")
}
```

See [File System](/stdlib/fs) for the full planned API.

---

## Practical Examples

### Simple Echo Program

```prismio
fn main() {
    loop {
        let line = input()
        if line == "quit" || line == "exit" { break }
        println("> " + line)
    }
    println("Goodbye!")
}
```

### Interactive Calculator

```prismio
fn main() {
    println("Simple Calculator. Type 'quit' to exit.")

    loop {
        let expr = input(">>> ")
        if expr == "quit" { break }

        let parts = expr.trim().split(" ")
        if parts.length() != 3 {
            println("Usage: <number> <op> <number>")
            continue
        }

        let a = parts[0].toFloat()
        let op = parts[1]
        let b = parts[2].toFloat()

        match (a, b) {
            (Optional.some(x), Optional.some(y)) => {
                let result = match op {
                    "+" => Optional.some(x + y)
                    "-" => Optional.some(x - y)
                    "*" => Optional.some(x * y)
                    "/" => if y != 0.0 { Optional.some(x / y) } else { Optional.none() }
                    _   => Optional.none()
                }
                match result {
                    Optional.some(r) => println("= ${r}")
                    Optional.none()  => println("Invalid operation or division by zero.")
                }
            }
            _ => println("Invalid numbers.")
        }
    }
}
```

### Greeting Loop

```prismio
fn main() {
    let count = input("How many people to greet? ").toInt().unwrapOr(1)

    let mut i = 0
    while i < count {
        let name = input("Name ${i + 1}: ")
        println("Hello, ${name.trim()}!")
        i = i + 1
    }
}
```

---

## See Also

- [Core Types → String](/stdlib/core-types#string) — string interpolation and manipulation
- [File System](/stdlib/fs) — file reading and writing (Coming Soon)
- [Standard Library Overview](/stdlib/overview) — all stdlib modules
