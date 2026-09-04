# Compiler Architecture

The Prismio compiler (`prismio`) transforms human-readable Prismio source code into optimized native machine code using LLVM as its backend. This page describes the internal architecture of the compiler, the phases source code passes through, and the supported compilation targets.

---

## Overview

The Prismio compiler is organized into three major stages: the **frontend**, the **middle-end**, and the **backend**. Each stage has a well-defined responsibility and communicates with the next through structured intermediate representations.

```
Source Code (.prism)
        │
        ▼
┌───────────────────────────────────────────────────┐
│                    FRONTEND                        │
│  ┌──────────┐   ┌──────────┐   ┌───────────────┐  │
│  │  Lexer   │──▶│  Parser  │──▶│  AST Builder  │  │
│  └──────────┘   └──────────┘   └───────────────┘  │
└───────────────────────────────────────────────────┘
        │
        ▼  Abstract Syntax Tree (AST)
┌───────────────────────────────────────────────────┐
│                   MIDDLE-END                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ Type Checker │─▶│  Semantic    │─▶│   IR    │  │
│  │              │  │  Analyzer    │  │  Gen    │  │
│  └──────────────┘  └──────────────┘  └─────────┘  │
└───────────────────────────────────────────────────┘
        │
        ▼  Prismio Intermediate Representation (PIR)
┌───────────────────────────────────────────────────┐
│                    BACKEND                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │  LLVM IR     │─▶│ Optimization │─▶│  Code   │  │
│  │  Lowering    │  │  Passes      │  │  Gen    │  │
│  └──────────────┘  └──────────────┘  └─────────┘  │
└───────────────────────────────────────────────────┘
        │
        ▼
  Native Binary / WebAssembly / Object File
```

---

## Frontend

The frontend is responsible for reading raw source text and transforming it into a structured, machine-understandable representation — the Abstract Syntax Tree (AST).

### Lexer

The lexer (also called the tokenizer) reads the raw `.prism` source file character by character and groups characters into **tokens** — the atomic units of the language such as keywords, identifiers, literals, operators, and punctuation.

| Token Type     | Examples                          |
|----------------|-----------------------------------|
| Keyword        | `fn`, `let`, `mut`, `if`, `match` |
| Identifier     | `myVar`, `greet`, `Point`         |
| Literal        | `42`, `3.14`, `"hello"`, `true`   |
| Operator       | `+`, `-`, `->`, `==`, `&&`        |
| Punctuation    | `(`, `)`, `{`, `}`, `:`, `;`      |
| Comment        | `//`, `/* */` (stripped)          |

The lexer also tracks **source spans** (file, line, column) for every token, enabling precise error messages later in the pipeline.

### Parser

The parser receives the flat token stream from the lexer and applies the **Prismio grammar** to build a hierarchical Abstract Syntax Tree. Prismio uses a hand-written **recursive descent parser** for speed and high-quality error recovery.

The grammar covers all language constructs:

- Function declarations and expressions
- Variable bindings (`let`, `let mut`)
- Control flow (`if`, `else`, `match`, `loop`, `while`, `for`)
- Type annotations and generics
- Struct, enum, and trait definitions
- Closures and lambda expressions
- Import declarations

### AST Construction

After parsing, the compiler builds a fully typed AST node tree. Each node stores:

- **Kind** – what sort of construct it represents
- **Children** – sub-expressions or sub-statements
- **Span** – the source location for diagnostics
- **Attributes** – user-supplied annotations like `#[test]` or `#[inline]`

```prismio
// Source
fn greet(name: String) -> String {
    return "Hello, " + name
}

// Simplified AST representation
FnDecl {
  name: "greet",
  params: [Param { name: "name", ty: String }],
  return_ty: String,
  body: Block {
    stmts: [
      ReturnStmt {
        expr: BinaryExpr {
          op: Add,
          lhs: StringLit("Hello, "),
          rhs: Ident("name")
        }
      }
    ]
  }
}
```

---

## Middle-End

The middle-end processes the AST, verifies correctness, and lowers it to an intermediate representation suitable for backend code generation.

### Type Checker

The type checker traverses the AST and infers or verifies the type of every expression. Prismio uses **bidirectional type inference**, meaning types flow both top-down (from annotations) and bottom-up (from expressions).

Key responsibilities:

- Resolving inferred types for `let` bindings without explicit annotations
- Verifying function call argument types match parameter declarations
- Checking return types of all code paths
- Validating generic type parameters and constraints
- Enforcing the ownership and borrowing rules

```prismio
let x = 42          // inferred: Int
let y: Float = 3.14  // explicit: Float
let name = "Alice"  // inferred: String
```

If a type mismatch is found, the compiler emits a structured diagnostic pointing to the exact span where the mismatch occurred.

### Semantic Analyzer

After type checking, the semantic analyzer performs deeper correctness checks that go beyond simple type rules:

- **Name resolution** – every identifier must refer to a declared binding
- **Ownership analysis** – verifying that values are not used after being moved
- **Borrow checking** – enforcing that mutable references are exclusive
- **Reachability analysis** – detecting unreachable code
- **Use-before-initialization** – catching variables used before assignment
- **Exhaustiveness checking** – ensuring `match` expressions cover all variants

### IR Generation

The semantic analyzer outputs a **Prismio Intermediate Representation (PIR)**, a lower-level, SSA-form (Static Single Assignment) representation of the program. PIR is:

- Closer to machine code than the AST
- Explicitly typed with no inference needed
- Free of syntactic sugar (all `for` loops become `while`, etc.)
- Platform-independent — the same PIR is used for all targets

---

## Backend

The backend is responsible for taking PIR and producing optimized native code.

### LLVM IR Lowering

PIR is translated to **LLVM Intermediate Representation (LLVM IR)**, the textual/binary language understood by LLVM. This step maps Prismio's types, functions, and control flow constructs to their LLVM equivalents.

```llvm
; LLVM IR for a simple add function
define i64 @add(i64 %a, i64 %b) {
entry:
  %result = add i64 %a, %b
  ret i64 %result
}
```

### Optimization Passes

Once in LLVM IR, the compiler applies a series of **optimization passes** depending on the selected build profile:

| Profile   | Optimization Level | Description                            |
|-----------|--------------------|----------------------------------------|
| `debug`   | `-O0`              | No optimization, fast compile times    |
| `release` | `-O3`              | Full optimization, best performance    |
| `size`    | `-Oz`              | Optimize for smallest binary size      |

Common passes applied in release mode include:

- **Inlining** – replaces function calls with the function body for small functions
- **Dead code elimination** – removes unreachable or unused code
- **Loop unrolling** – unrolls small loops to reduce branch overhead
- **Constant folding** – evaluates constant expressions at compile time
- **Memory-to-register promotion** – converts stack allocations to register variables

### Native Code Generation

After optimization, LLVM's code generation backend emits machine code for the target platform. The compiler links the resulting object files using the system linker (or LLD) to produce the final executable or library.

---

## Supported Targets

Prismio supports compilation to the following target architectures:

| Target              | Triple                        | Status     |
|---------------------|-------------------------------|------------|
| x86-64 (Linux)      | `x86_64-unknown-linux-gnu`    | ✅ Stable  |
| x86-64 (Windows)    | `x86_64-pc-windows-msvc`      | ✅ Stable  |
| x86-64 (macOS)      | `x86_64-apple-darwin`         | ✅ Stable  |
| ARM64 (Linux)       | `aarch64-unknown-linux-gnu`   | ✅ Stable  |
| ARM64 (macOS/Apple) | `aarch64-apple-darwin`        | ✅ Stable  |
| WebAssembly         | `wasm32-unknown-unknown`      | 🚧 Beta    |
| ARM64 (Windows)     | `aarch64-pc-windows-msvc`     | 🚧 Planned |

To cross-compile for a specific target, pass the `--target` flag:

```bash
prismio build --target aarch64-unknown-linux-gnu
```

> **Note:** Cross-compilation may require the target's system libraries and a compatible linker to be available on your machine.

---

## Error Reporting System

The Prismio compiler prioritizes **developer experience** with structured, actionable error messages. Every diagnostic includes:

- **Error code** – a unique identifier (e.g., `E0101`)
- **Message** – a clear, plain-English description of the problem
- **Source span** – the exact file, line, and column where the error occurred
- **Context snippet** – the surrounding lines of code highlighted with carets
- **Suggestion** – where possible, a concrete fix or explanation

### Example Error Output

```
error[E0201]: type mismatch
  --> src/main.prism:8:14
   |
 8 |     let x: Int = "hello"
   |                  ^^^^^^^ expected `Int`, found `String`
   |
   = help: if you intended a string, change the type annotation to `String`
   = note: `Int` and `String` are not compatible types
```

```
error[E0305]: use of moved value
  --> src/main.prism:15:10
   |
13 |     let name = getName()
   |         ---- value moved here
14 |     process(name)
   |             ---- value moved into `process`
15 |     println(name)
   |             ^^^^ value used here after move
   |
   = help: consider cloning the value before passing it: `process(name.clone())`
```

### Diagnostic Levels

| Level     | Prefix    | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `error`   | `error`   | Compilation cannot proceed; must be fixed        |
| `warning` | `warning` | Code compiles but may have issues                |
| `note`    | `note`    | Supplementary context for an error or warning    |
| `help`    | `help`    | Concrete suggested fixes                         |

Warnings can be promoted to errors using the `--deny-warnings` flag:

```bash
prismio build --deny-warnings
```

---

## Compiler Flags Reference

| Flag                       | Description                                         |
|----------------------------|-----------------------------------------------------|
| `--target <triple>`        | Set the compilation target triple                   |
| `--release`                | Enable release optimizations (`-O3`)                |
| `--emit ir`                | Output LLVM IR instead of a binary                  |
| `--emit ast`               | Output the AST in debug format                      |
| `--deny-warnings`          | Treat all warnings as errors                        |
| `--verbose`                | Print detailed compilation pipeline progress        |
| `--no-std`                 | Compile without the Prismio standard library        |
| `-o <output>`              | Set the output file path                            |

```bash
# Emit LLVM IR for inspection
prismio build --emit ir -o output.ll

# Build a release binary for Linux ARM64
prismio build --release --target aarch64-unknown-linux-gnu -o my_app
```

---

## See Also

- [Build System (UMS)](./build.md) – project configuration and build targets
- [Diagnostics](./diagnostics.md) – full list of error codes and their meanings
- [Testing](./testing.md) – running tests with the compiler's test runner
