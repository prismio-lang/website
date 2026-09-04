# Project Layout

A well-organised project structure makes your codebase easier to navigate, test, and maintain. Prismio enforces a conventional layout that the compiler and build tool (UMS) understand by default. This page describes that layout, explains the role of each directory and file, and shows how module resolution works.

---

## Standard Project Structure

When you create a new project with `prismio new`, the following directory tree is generated:

```
my_project/
├── prismio.toml          ← Project manifest and build configuration
├── src/                  ← All source code lives here
│   └── main.pr           ← Program entry point (for executables)
├── tests/                ← Integration and unit tests
│   └── main_test.pr
├── deps/                 ← Local or vendored dependencies
│   └── (auto-managed)
└── build/                ← Generated build artifacts (gitignored)
    ├── debug/
    └── release/
```

For a **library** project, the structure is almost identical, but there is no `main.pr`; instead, the entry point for consumers is typically `src/lib.pr`:

```
my_library/
├── prismio.toml
├── src/
│   ├── lib.pr            ← Library root module
│   ├── math.pr
│   └── utils/
│       ├── mod.pr        ← Module declaration for utils/
│       └── string_ext.pr
├── tests/
│   └── math_test.pr
└── deps/
```

---

## Directory Reference

### `src/` — Source Code

All Prismio source files (`.pr`) go inside `src/`. The compiler treats each `.pr` file as a **module**. Subdirectories create nested modules.

```
src/
├── main.pr          → module main
├── parser.pr        → module parser
├── lexer.pr         → module lexer
└── ast/
    ├── mod.pr       → module ast (declares the ast module)
    ├── expr.pr      → module ast.expr
    └── stmt.pr      → module ast.stmt
```

Each subdirectory that contains source files must have a `mod.pr` file. This file acts as the module declaration and can re-export members from sibling files:

```prismio
// src/ast/mod.pr
import ast.expr
import ast.stmt

// Re-export key types for convenience
pub use ast.expr.Expr
pub use ast.stmt.Stmt
```

#### `src/main.pr`

The entry point for executable projects. It must define the `fn main()` function:

```prismio
// src/main.pr
import parser
import ast

fn main() {
    let source = input()
    let tree = parser.parse(source)
    println(tree.toString())
}
```

#### `src/lib.pr`

The entry point for library projects. It declares what is publicly exposed:

```prismio
// src/lib.pr
pub import math
pub import utils.string_ext

// You can also define types directly here
pub struct Config {
    pub let debug: Bool
    pub let outputDir: String
}
```

---

### `tests/` — Tests

All test files go in `tests/`. By convention, test files are named `<module>_test.pr`. Tests are run with `prismio test`.

```
tests/
├── parser_test.pr
├── lexer_test.pr
└── integration/
    └── full_pipeline_test.pr
```

A test file looks like this:

```prismio
// tests/parser_test.pr
import std.test
import parser

@test
fn testParseInteger() {
    let result = parser.parse("42")
    test.assertEqual(result.kind, NodeKind.Integer)
    test.assertEqual(result.value, "42")
}

@test
fn testParseString() {
    let result = parser.parse("\"hello\"")
    test.assertEqual(result.kind, NodeKind.StringLiteral)
}
```

> **Note:** Test functions are annotated with `@test`. The test runner automatically discovers all `@test`-annotated functions in the `tests/` directory.

---

### `deps/` — Dependencies

The `deps/` directory is managed automatically by the Prismio package manager. You should not manually add files here. When you run `prismio add <package>`, the package is downloaded and placed in `deps/`.

```
deps/
├── prismio-json@1.2.0/
│   ├── prismio.toml
│   └── src/
│       └── lib.pr
└── prismio-http@0.5.1/
    ├── prismio.toml
    └── src/
        └── lib.pr
```

To **vendor** dependencies (bundle them with your project, useful for reproducible offline builds):

```bash
prismio vendor
```

This copies all dependencies into `deps/` and sets a flag in `prismio.toml` to use the local copies instead of downloading.

> **Tip:** Add `deps/` to your `.gitignore` unless you are vendoring dependencies, in which case commit it.

---

### `build/` — Build Artifacts

The `build/` directory is created automatically and contains all compiler output:

```
build/
├── debug/
│   ├── my_project          ← Debug executable
│   └── my_project.ll       ← LLVM IR (when --emit-llvm is used)
└── release/
    └── my_project          ← Optimised release executable
```

Always add `build/` to your `.gitignore`:

```gitignore
# .gitignore
build/
deps/
*.prismio_cache
```

---

## The `prismio.toml` Manifest

`prismio.toml` is the project manifest. It configures the project name, version, dependencies, and build settings.

### Full Example

```toml
# prismio.toml

[package]
name        = "my_project"
version     = "0.1.0"
authors     = ["Saksham Jaiswal <vibrant.official275@gmail.com>"]
description = "A sample Prismio project"
license     = "MIT"
repository  = "https://github.com/prismio-lang/my_project"
keywords    = ["cli", "tools"]
edition     = "2024"

[build]
# Entry point (relative to the project root)
entry       = "src/main.pr"

# Build type: "executable" or "library"
type        = "executable"

# Target triple (leave empty to use the host target)
target      = ""

# Optimisation level: 0, 1, 2, 3 (maps to LLVM -O flags)
opt_level   = 2

# Extra flags passed to the LLVM backend
llvm_flags  = []

[profile.debug]
opt_level   = 0
debug_info  = true
overflow_checks = true

[profile.release]
opt_level   = 3
debug_info  = false
lto         = true       # Enable Link-Time Optimisation
strip       = true       # Strip debug symbols from output

[dependencies]
prismio-json  = "1.2.0"
prismio-http  = { version = "0.5.1", features = ["tls"] }

[dev-dependencies]
# Dependencies only available during testing
prismio-mock  = "0.3.0"

[features]
# Optional features that consumers can enable
default   = ["json"]
json      = ["prismio-json"]
http      = ["prismio-http"]
```

### Key Sections

| Section | Purpose |
|---------|---------|
| `[package]` | Project metadata (name, version, authors, etc.) |
| `[build]` | Compiler settings: entry point, build type, target |
| `[profile.debug]` | Settings used for `prismio build` (default) |
| `[profile.release]` | Settings used for `prismio build --release` |
| `[dependencies]` | Runtime dependencies |
| `[dev-dependencies]` | Test-only dependencies |
| `[features]` | Optional feature flags |

### Library Project Example

```toml
[package]
name    = "prismio-math"
version = "0.2.1"
authors = ["Saksham Jaiswal <vibrant.official275@gmail.com>"]

[build]
type  = "library"
entry = "src/lib.pr"

[dependencies]
# No runtime dependencies

[dev-dependencies]
prismio-bench = "0.1.0"
```

---

## Module Resolution

Prismio resolves module paths relative to `src/`. The mapping between filesystem paths and module names follows these rules:

| File Path | Module Name |
|-----------|------------|
| `src/parser.pr` | `parser` |
| `src/ast/mod.pr` | `ast` |
| `src/ast/expr.pr` | `ast.expr` |
| `src/utils/string_ext.pr` | `utils.string_ext` |

### Importing Modules

```prismio
// Import a top-level module
import parser

// Import a nested module
import ast.expr

// Import a specific item from a module
import ast.expr.Expr
import utils.string_ext.capitalize
```

> **Note:** Prismio does **not** support wildcard imports (`import ast.*`). All imports must be explicit. This ensures that the origin of every name is always clear.

### Accessing Module Items

Once imported, items are accessed using dot notation:

```prismio
import ast.expr

fn main() {
    let node = ast.expr.Expr.Integer(42)
    println(node.toString())
}
```

If you import a specific item, you can use it directly:

```prismio
import ast.expr.Expr

fn main() {
    let node = Expr.Integer(42)
}
```

### Cyclic Dependencies

Prismio **does not allow circular module dependencies**. If module A imports module B, module B cannot (directly or transitively) import module A. The compiler will report a clear error:

```
error[E0401]: circular dependency detected
  → src/a.pr:1
  |
1 | import b
  | ^^^^^^^^ module `b` imports `a`, creating a cycle: a → b → a
```

---

## Workspace Projects

For large projects with multiple related packages, Prismio supports **workspaces**. A workspace root contains a `prismio.toml` with a `[workspace]` section:

```toml
# prismio.toml (workspace root)
[workspace]
members = [
    "compiler",
    "standard_library",
    "tools/formatter",
    "tools/linter",
]
```

Each member is an independent package with its own `prismio.toml`. Workspaces share a single `build/` directory and resolve inter-member dependencies locally.

```
my_workspace/
├── prismio.toml         ← Workspace root
├── compiler/
│   ├── prismio.toml
│   └── src/
├── standard_library/
│   ├── prismio.toml
│   └── src/
└── tools/
    ├── formatter/
    │   ├── prismio.toml
    │   └── src/
    └── linter/
        ├── prismio.toml
        └── src/
```

Build all workspace members at once:

```bash
prismio build --workspace
```

---

## Sample `.gitignore`

Here is a recommended `.gitignore` for Prismio projects:

```gitignore
# Build output
build/

# Dependency cache (remove this line if vendoring)
deps/

# Prismio compiler cache
.prismio_cache/
*.prismio_cache

# IDE files
.idea/
.vscode/
*.swp
*~

# OS files
.DS_Store
Thumbs.db
```

---

## Next Steps

- [Build & Run](./build_run.md) – Detailed reference for UMS build commands
- [Editor Setup](./editor_setup.md) – Configure your editor for Prismio
- [Package Management](/packages/overview.md) – Adding and publishing packages
