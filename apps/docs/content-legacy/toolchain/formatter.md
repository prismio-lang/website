# Formatter (`prismfmt`)

> 🚧 **Coming Soon** – The Prismio code formatter is planned but not yet implemented. This page describes the intended design and API for reference.

`prismfmt` is the official, opinionated code formatter for Prismio. Like `gofmt` for Go or `rustfmt` for Rust, it enforces a single, canonical style across all Prismio code — eliminating debates about formatting and making code reviews focus purely on logic.

The formatter is invoked through the `prismio fmt` command (no separate binary installation needed).

---

## Running the Formatter

### Format All Files in a Project

```bash
prismio fmt
```

This recursively finds every `.prism` file under the project's `src/` directory and formats it **in place**.

### Format a Specific File

```bash
prismio fmt src/utils.prism
```

### Check Mode (CI-Friendly)

In check mode, the formatter does not modify any files. Instead, it exits with a non-zero status code if any files are not correctly formatted. This is ideal for use in continuous integration pipelines.

```bash
prismio fmt --check
```

```bash
# In CI (GitHub Actions, etc.)
- name: Check formatting
  run: prismio fmt --check
```

### Format via Standard Input

```bash
echo 'fn add(a:Int,b:Int)->Int=a+b' | prismio fmt --stdin
```

Output:

```prismio
fn add(a: Int, b: Int) -> Int = a + b
```

---

## Configuration

`prismfmt` is intentionally opinionated and requires minimal configuration. Most projects will not need any configuration at all.

Configuration is placed in `prismio.toml` under the `[fmt]` table:

```toml
[fmt]
indent_style   = "spaces"    # "spaces" or "tabs"
indent_size    = 4           # number of spaces per indent level (default: 4)
max_line_width = 100         # soft maximum line length (default: 100)
trailing_comma = "always"    # "always", "never", or "trailing" (multiline only)
```

### Configuration Options

| Option           | Type    | Default    | Description                                                       |
|------------------|---------|------------|-------------------------------------------------------------------|
| `indent_style`   | String  | `"spaces"` | Whether to use spaces or tabs for indentation                     |
| `indent_size`    | Integer | `4`        | Number of spaces per indentation level (ignored when using tabs)  |
| `max_line_width` | Integer | `100`      | Soft limit for line length; formatter wraps where possible        |
| `trailing_comma` | String  | `"always"` | Whether to add trailing commas in multiline expressions/params    |

> **Note:** Unlike many formatters, `prismfmt` does not support per-file or per-directory configuration overrides. The `prismio.toml` file at the project root is the single source of truth.

---

## Style Rules Overview

### Indentation

All blocks are indented with **4 spaces** by default (configurable). Tabs are supported via `indent_style = "tabs"`.

```prismio
// Before formatting
fn example(){
  let x=1
  if x>0{
    println("positive")
  }
}

// After formatting
fn example() {
    let x = 1
    if x > 0 {
        println("positive")
    }
}
```

### Spacing Around Operators

Spaces are inserted around binary operators, after colons in type annotations, and after commas.

```prismio
// Before
let result=a+b*c
fn greet(name:String,age:Int){}

// After
let result = a + b * c
fn greet(name: String, age: Int) {}
```

### Brace Style

Opening braces appear on the same line as the construct they belong to (K&R / "Egyptian" style). Closing braces appear on their own line.

```prismio
// Correct
fn example() {
    // ...
}

// Also correct (expression-form functions)
fn add(a: Int, b: Int) -> Int = a + b
```

### Trailing Commas

In multiline function calls, struct literals, and parameter lists, `prismfmt` adds trailing commas after the last element:

```prismio
// Before
let point = Point {
    x: 1.0,
    y: 2.0
}

// After (trailing_comma = "always")
let point = Point {
    x: 1.0,
    y: 2.0,
}
```

### Line Length and Wrapping

When an expression, call, or parameter list exceeds the configured `max_line_width`, `prismfmt` wraps it across multiple lines:

```prismio
// Short enough to stay on one line
let result = compute(a, b, c)

// Too long — wrapped automatically
let result = compute(
    some_long_argument,
    another_long_argument,
    yet_another_argument,
)
```

### `match` Expressions

Match arms are aligned and consistently spaced:

```prismio
match status {
    200 => println("OK"),
    404 => println("Not Found"),
    500 => println("Server Error"),
    _   => println("Unknown"),
}
```

### Import Sorting

> 🚧 **Coming Soon** – Import statements will be sorted alphabetically and grouped by category (standard library, third-party, local).

```prismio
// Sorted imports (planned behavior)
import prismio.io.File
import prismio.io.Path
import prismio.collections.HashMap
import mypackage.utils.Helper
```

---

## Editor Integration

> 🚧 **Coming Soon** – Editor plugins and language server support are under development.

### Format on Save

Most modern editors can be configured to run `prismio fmt` on save. Integration will be available through the **Prismio Language Server** (PLS), which implements the Language Server Protocol (LSP).

#### VS Code

Install the **Prismio** extension from the VS Code marketplace (coming soon), then add to your settings:

```json
{
  "[prismio]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "prismio.prismio-vscode"
  }
}
```

#### JetBrains IDEs (IntelliJ, CLion, etc.)

> 🚧 **Coming Soon** – A JetBrains plugin is planned.

#### Neovim / Vim

Using [conform.nvim](https://github.com/stevearc/conform.nvim):

```lua
require("conform").setup({
  formatters_by_ft = {
    prismio = { "prismfmt" },
  },
  format_on_save = { timeout_ms = 500 },
})
```

#### Helix

Add to your `languages.toml`:

```toml
[[language]]
name = "prismio"
formatter = { command = "prismio", args = ["fmt", "--stdin"] }
auto-format = true
```

---

## Disabling Formatting for a Region

> 🚧 **Coming Soon** – Region-disable comments are planned.

You will be able to disable formatting for a specific code region using special comments:

```prismio
// prismfmt::off
let matrix = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
]
// prismfmt::on
```

---

## Using `prismfmt` in CI

Add a formatting check step to your CI pipeline to ensure all merged code is consistently formatted:

```yaml
# GitHub Actions example
name: CI

on: [push, pull_request]

jobs:
  fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Prismio
        run: curl -sSf https://get.prismio.dev | sh
      - name: Check formatting
        run: prismio fmt --check
```

---

## See Also

- [Linter](./linter.md) – catching code quality issues
- [Build System (UMS)](./build.md) – `prismio.toml` configuration
- [Diagnostics](./diagnostics.md) – understanding compiler messages
