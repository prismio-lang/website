# Hello, World!

Welcome to Prismio! This guide walks you through writing, compiling, and running your very first Prismio program. By the end, you'll understand the basic structure of a Prismio source file and how to interact with the terminal.

---

## Step 1: Create a Source File

Prismio source files use the `.pr` extension. Create a new file called `main.pr`:

```bash
# Linux / macOS
touch main.pr

# Windows (PowerShell)
New-Item main.pr -ItemType File
```

Open it in any text editor of your choice.

---

## Step 2: Write the Program

Type the following into `main.pr`:

```prismio
fn main() {
    println("Hello, World!")
}
```

That's it — three lines. Let's break down what each part means:

| Element | Explanation |
|---------|------------|
| `fn` | Keyword that declares a function |
| `main` | The name of the function — `main` is the program's entry point |
| `()` | The parameter list — `main` takes no arguments |
| `{ ... }` | The function body, enclosed in curly braces |
| `println(...)` | A built-in function that prints a line of text followed by a newline |
| `"Hello, World!"` | A string literal enclosed in double quotes |

> **Note:** Every executable Prismio program must have a `fn main()` function. This is where execution begins.

---

## Step 3: Compile the Program

Use the `prismio build` command to compile your source file:

```bash
prismio build main.pr
```

If there are no errors, this produces a native executable:

- **Linux/macOS:** `./main`
- **Windows:** `main.exe`

You should see output like:

```
Compiling main.pr
  → Finished [debug] in 0.34s
```

---

## Step 4: Run the Program

```bash
# Linux / macOS
./main

# Windows
.\main.exe
```

Output:

```
Hello, World!
```

🎉 Congratulations — you've just run your first Prismio program!

---

## Step 5: Build and Run in One Step

You don't have to compile and run separately. The `prismio run` command does both:

```bash
prismio run main.pr
```

Output:

```
Compiling main.pr
  → Running main
Hello, World!
```

---

## Variants and Examples

### Using `print` vs `println`

Prismio provides two output functions:

| Function | Behavior |
|----------|---------|
| `print(...)` | Prints text **without** a trailing newline |
| `println(...)` | Prints text **with** a trailing newline |

```prismio
fn main() {
    print("Hello, ")
    print("World")
    println("!")
    // Output: Hello, World!
}
```

```prismio
fn main() {
    println("Line 1")
    println("Line 2")
    println("Line 3")
}
```

Output:

```
Line 1
Line 2
Line 3
```

---

### Printing Variables

You can declare a variable with `let` and print it:

```prismio
fn main() {
    let name = "Prismio"
    println("Hello from " + name + "!")
}
```

Output:

```
Hello from Prismio!
```

Variables in Prismio are **immutable by default**. Use `let mut` if you need to reassign:

```prismio
fn main() {
    let mut greeting = "Hello"
    greeting = "Hi there"
    println(greeting)
}
```

---

### String Interpolation

Prismio supports string interpolation using the `${}` syntax inside double-quoted strings:

```prismio
fn main() {
    let name = "World"
    let version = 1
    println("Hello, ${name}! This is Prismio v${version}.")
}
```

Output:

```
Hello, World! This is Prismio v1.
```

For simple variable names (no expressions), you can omit the braces:

```prismio
fn main() {
    let lang = "Prismio"
    println("Welcome to $lang!")
}
```

---

### Printing Numbers

```prismio
fn main() {
    let x: Int = 42
    let pi: Float = 3.14159
    println("The answer is $x")
    println("Pi is approximately $pi")
}
```

Output:

```
The answer is 42
Pi is approximately 3.14159
```

---

### Hello World with a Function

You can extract the greeting into its own function:

```prismio
fn greet(name: String) {
    println("Hello, $name!")
}

fn main() {
    greet("World")
    greet("Prismio")
    greet("Developer")
}
```

Output:

```
Hello, World!
Hello, Prismio!
Hello, Developer!
```

---

### Hello World with a Return Value

Functions in Prismio can return values using the `->` syntax:

```prismio
fn buildGreeting(name: String) -> String {
    return "Hello, $name!"
}

fn main() {
    let message = buildGreeting("World")
    println(message)
}
```

Prismio also supports the **expression form** for single-expression functions:

```prismio
fn buildGreeting(name: String) -> String = "Hello, $name!"

fn main() {
    println(buildGreeting("World"))
}
```

---

### Accepting Command-Line Arguments

```prismio
fn main(args: [String]) {
    if args.size() > 0 {
        println("Hello, ${args[0]}!")
    } else {
        println("Hello, World!")
    }
}
```

```bash
prismio run main.pr -- Alice
```

Output:

```
Hello, Alice!
```

> **Note:** Arguments after `--` are passed to your program rather than to the `prismio` tool itself.

---

### Reading Input from the User

You can read a line from standard input using the built-in `input()` function:

```prismio
fn main() {
    print("Enter your name: ")
    let name = input()
    println("Hello, $name!")
}
```

Running this interactively:

```
Enter your name: Alice
Hello, Alice!
```

---

### Multi-line Hello World

Here is a slightly more elaborate example combining several concepts:

```prismio
fn greet(name: String, lang: String) -> String {
    return "Hello from $name, written in $lang!"
}

fn main() {
    let author = "Saksham"
    let language = "Prismio"

    let message = greet(author, language)
    println(message)

    println("Version: 0.1.0")
    println("Backend: LLVM")
}
```

Output:

```
Hello from Saksham, written in Prismio!
Version: 0.1.0
Backend: LLVM
```

---

## Understanding Compilation

When you run `prismio build main.pr`, here is what happens under the hood:

```
main.pr
  │
  ▼ Lexing & Parsing
Abstract Syntax Tree (AST)
  │
  ▼ Type Checking & Analysis
Typed IR
  │
  ▼ Code Generation (LLVM IR)
LLVM Bitcode
  │
  ▼ LLVM Optimization & Machine Code
Native Executable (main / main.exe)
```

The native executable has **no runtime dependency** on the Prismio compiler — it runs directly on your operating system.

---

## Common Mistakes

### Forgetting the `fn main()` entry point

```prismio
// ❌ Error: no main function found
println("Hello")
```

```prismio
// ✅ Correct
fn main() {
    println("Hello")
}
```

### Using single quotes for strings

```prismio
// ❌ Error: single quotes are for Char literals, not Strings
println('Hello, World!')
```

```prismio
// ✅ Correct: use double quotes for String literals
println("Hello, World!")

// ✅ Single quotes are for Char
let c: Char = 'A'
```

### Missing parentheses on `println`

```prismio
// ❌ Error: println requires parentheses
println "Hello"
```

```prismio
// ✅ Correct
println("Hello")
```

---

## Next Steps

Now that you've run your first program, explore further:

- [Project Layout](./project_layout.md) – Organise your code into a proper project
- [Build & Run](./build_run.md) – Learn all `prismio` CLI commands
- [Language Basics](/language/basics.md) – Dive into variables, types, and control flow
