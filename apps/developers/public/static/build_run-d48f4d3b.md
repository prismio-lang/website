# Build & Run

Prismio ships with **UMS** (Unified Module System), an integrated build system and package manager. UMS handles compilation, dependency resolution, testing, formatting, and more — all through the single `prismio` CLI.

This page covers every build command, flag, and configuration option you need to go from source code to running program.

---

## Overview of UMS Commands

```
prismio <COMMAND> [OPTIONS] [ARGS]
```

| Command | Purpose |
|---------|---------|
| `build` | Compile the project |
| `run` | Build and immediately execute the program |
| `test` | Compile and run all tests |
| `clean` | Remove all build artifacts |
| `new` | Scaffold a new project |
| `add` | Add a dependency to `prismio.toml` |
| `remove` | Remove a dependency |
| `update` | Update dependencies to their latest compatible versions |
| `fmt` | Format all source files |
| `doc` | Generate HTML documentation |
| `vendor` | Copy all dependencies into `deps/` |

---

## `prismio build`

Compiles your project according to `prismio.toml`.

### Basic Usage

```bash
# Build in debug mode (default)
prismio build

# Build a single file (outside of a project)
prismio build main.pr

# Build in release mode (optimised)
prismio build --release
```

### Build Modes

Prismio has two built-in build profiles:

#### Debug (Default)

```bash
prismio build
```

- Optimisation level: `O0` (no optimisation)
- Debug symbols: **enabled** (full DWARF info)
- Overflow checks: **enabled**
- Fast compilation, larger binary
- Output: `build/debug/<project_name>`

#### Release

```bash
prismio build --release
```

- Optimisation level: `O3` (maximum optimisation)
- Debug symbols: **disabled** (stripped)
- Link-Time Optimisation (LTO): **enabled**
- Slower compilation, smaller and faster binary
- Output: `build/release/<project_name>`

#### Comparison

| Property | Debug | Release |
|----------|-------|---------|
| Optimisation | O0 | O3 |
| Debug info | ✅ Full | ❌ Stripped |
| Overflow checks | ✅ | ❌ |
| LTO | ❌ | ✅ |
| Compile speed | Fast | Slower |
| Binary size | Larger | Smaller |
| Runtime speed | Slower | Fastest |

> **Tip:** Always develop and test with `debug` builds. Only switch to `release` for distribution or benchmarking.

### Build Flags

```bash
# Specify a custom output path
prismio build --output bin/myapp

# Specify target triple (cross-compilation)
prismio build --target aarch64-unknown-linux-gnu

# Emit LLVM IR alongside the binary
prismio build --emit-llvm

# Enable verbose compiler output
prismio build --verbose

# Set a specific optimisation level (0-3)
prismio build --opt-level 2

# Treat all warnings as errors
prismio build --deny-warnings

# Build with a specific feature flag enabled
prismio build --features http,json

# Build all packages in a workspace
prismio build --workspace
```

### Custom Build Profiles

You can define additional profiles in `prismio.toml`:

```toml
[profile.bench]
opt_level   = 3
debug_info  = true     # Keep symbols for profiling
lto         = false
strip       = false

[profile.size]
opt_level   = "s"      # Optimise for binary size
lto         = true
strip       = true
```

```bash
# Build using a custom profile
prismio build --profile bench
prismio build --profile size
```

### Cross-Compilation

Prismio supports cross-compilation via LLVM's target system. You need the appropriate LLVM target installed.

```bash
# List available targets
prismio build --list-targets

# Cross-compile for ARM Linux
prismio build --target aarch64-unknown-linux-gnu --release

# Cross-compile for Windows from Linux
prismio build --target x86_64-pc-windows-gnu --release

# Cross-compile for WebAssembly
prismio build --target wasm32-unknown-unknown --release
```

> 🚧 **Coming Soon** – Cross-compilation support is planned but not yet fully implemented. Basic host-target compilation is stable.

---

## `prismio run`

Builds the project and immediately runs the resulting executable. Accepts the same flags as `build`, plus arguments to pass to the program.

### Basic Usage

```bash
# Build (debug) and run
prismio run

# Build and run a single file
prismio run main.pr

# Build (release) and run
prismio run --release
```

### Passing Arguments to Your Program

Use `--` to separate `prismio` flags from program arguments:

```bash
prismio run -- --config config.toml --verbose
```

Example program that reads those arguments:

```prismio
fn main(args: [String]) {
    for arg in args {
        println("Arg: $arg")
    }
}
```

```bash
prismio run -- hello world 42
# Output:
# Arg: hello
# Arg: world
# Arg: 42
```

### Run with Environment Variables

```bash
# Linux/macOS
APP_ENV=production prismio run --release

# Windows (PowerShell)
$env:APP_ENV = "production"; prismio run --release
```

---

## `prismio test`

Compiles and runs all test functions (annotated with `@test`) found in the `tests/` directory.

### Basic Usage

```bash
# Run all tests
prismio test

# Run tests with verbose output (show each test name)
prismio test --verbose

# Run a specific test file
prismio test tests/parser_test.pr

# Run tests matching a filter string
prismio test --filter "parse"

# Run tests with release optimisations
prismio test --release
```

### Writing Tests

```prismio
// tests/math_test.pr
import std.test
import math

@test
fn testAdd() {
    test.assertEqual(math.add(2, 3), 5)
}

@test
fn testSubtract() {
    test.assertEqual(math.subtract(10, 4), 6)
}

@test
fn testDivideByZero() {
    test.assertPanics {
        math.divide(10, 0)
    }
}
```

### Test Output

```
Running 3 tests from tests/math_test.pr
  ✅ testAdd         (0.2ms)
  ✅ testSubtract    (0.1ms)
  ✅ testDivideByZero (0.3ms)

Test result: ok — 3 passed, 0 failed, 0 skipped (0.6ms total)
```

### Failed Test Output

```
Running 2 tests
  ✅ testAdd         (0.2ms)
  ❌ testSubtract    (0.1ms)
     Expected: 6
     Got:      7
     at tests/math_test.pr:12

Test result: FAILED — 1 passed, 1 failed (0.3ms total)
```

### Test Flags Reference

| Flag | Description |
|------|------------|
| `--verbose` / `-v` | Show individual test names and timings |
| `--filter <pattern>` | Only run tests whose name matches the pattern |
| `--release` | Run tests with release optimisations |
| `--no-fail-fast` | Continue running after a test failure |
| `--workspace` | Run tests for all packages in the workspace |
| `--coverage` | Generate a code coverage report |

> 🚧 **Coming Soon** – `--coverage` (code coverage reporting) is planned but not yet implemented.

---

## `prismio clean`

Removes all generated build artifacts from the `build/` directory.

```bash
# Remove all build artifacts
prismio clean

# Remove only debug artifacts
prismio clean --debug

# Remove only release artifacts
prismio clean --release

# Also remove the dependency cache
prismio clean --deps

# Remove everything including vendored deps
prismio clean --all
```

After `prismio clean`, the next `prismio build` starts a full recompilation from scratch.

---

## `prismio new`

Scaffolds a new Prismio project in a new directory.

```bash
# Create an executable project
prismio new my_app

# Create a library project
prismio new my_lib --lib

# Create a workspace
prismio new my_workspace --workspace

# Specify the directory (defaults to the project name)
prismio new my_app --path /home/user/projects/my_app
```

Generated structure for `prismio new hello`:

```
hello/
├── prismio.toml
├── src/
│   └── main.pr
└── tests/
    └── main_test.pr
```

`src/main.pr` is pre-filled with:

```prismio
fn main() {
    println("Hello, World!")
}
```

---

## `prismio add`

Adds a dependency to your project.

```bash
# Add a package from the registry
prismio add prismio-json

# Add a specific version
prismio add prismio-json@1.2.0

# Add a git dependency
prismio add prismio-json --git https://github.com/prismio-lang/prismio-json

# Add a local path dependency
prismio add my_utils --path ../my_utils

# Add a dev-only dependency
prismio add prismio-mock --dev

# Add a dependency with features
prismio add prismio-http --features tls,http2
```

This automatically updates `prismio.toml`:

```toml
[dependencies]
prismio-json = "1.2.0"
prismio-http = { version = "0.5.1", features = ["tls", "http2"] }
```

---

## `prismio fmt`

Automatically formats all `.pr` files in your project according to the official Prismio style guide.

```bash
# Format all files in the project
prismio fmt

# Check formatting without modifying files (useful in CI)
prismio fmt --check

# Format a specific file
prismio fmt components/parser.pr
```

Sample formatting rules:

- 4-space indentation
- Opening braces `{` on the same line
- Trailing commas in multi-line parameter lists
- One blank line between top-level declarations

---

## `prismio doc`

Generates HTML documentation from doc comments (`///`) in your source code.

```bash
# Generate docs (output: build/doc/)
prismio doc

# Open docs in the browser after generating
prismio doc --open

# Generate docs for all workspace members
prismio doc --workspace
```

Doc comments use Markdown:

```prismio
/// Computes the factorial of `n`.
///
/// # Panics
/// Panics if `n` is negative.
///
/// # Examples
/// ```prismio
/// let result = factorial(5)
/// println(result) // 120
/// ```
fn factorial(n: Int) -> Int {
    if n <= 1 { return 1 }
    return n * factorial(n - 1)
}
```

> 🚧 **Coming Soon** – `prismio doc` is planned but not yet implemented.

---

## Environment Variables

UMS respects the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PRISMIO_HOME` | Root directory for compiler data | `~/.prismio` |
| `PRISMIO_CACHE` | Package download cache | `~/.prismio/cache` |
| `PRISMIO_LOG` | Log verbosity (`error`, `warn`, `info`, `debug`, `trace`) | `warn` |
| `PRISMIO_TARGET` | Default compilation target | host triple |
| `PRISMIO_FLAGS` | Extra flags applied to every build | (empty) |

```bash
# Example: enable debug logging
PRISMIO_LOG=debug prismio build

# Example: always build for a specific target
PRISMIO_TARGET=aarch64-unknown-linux-gnu prismio build
```

---

## Build Scripts

For advanced use cases, you can add a `build.pr` script to your project root. It runs before compilation and can generate code, download assets, or validate environment settings:

```prismio
// build.pr
fn main() {
    // Example: write a generated version file
    let version = env("CARGO_PKG_VERSION") ?? "unknown"
    writeFile("src/generated/version.pr", "pub let VERSION = \"$version\"\n")
}
```

```toml
# prismio.toml
[build]
script = "build.pr"
```

> 🚧 **Coming Soon** – Build scripts are planned but not yet implemented.

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Prismio
        run: |
          curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz
          tar -xzf prismio-linux-x86_64.tar.gz
          sudo mv prismio /usr/local/bin/

      - name: Check formatting
        run: prismio fmt --check

      - name: Build
        run: prismio build

      - name: Test
        run: prismio test --verbose

      - name: Build (release)
        run: prismio build --release
```

---

## Quick Reference Card

```bash
# Day-to-day development
prismio run                     # Build & run in debug mode
prismio test                    # Run all tests
prismio fmt                     # Format all files

# Before committing
prismio fmt --check             # Verify formatting
prismio build --deny-warnings   # Treat warnings as errors
prismio test --verbose          # Full test run

# Before releasing
prismio build --release         # Optimised build
prismio clean                   # Clean slate

# Project management
prismio new my_project          # New project
prismio add prismio-json        # Add dependency
prismio update                  # Update all deps
```

---

## Next Steps

- [Editor Setup](./editor_setup.md) – Integrate Prismio into your editor
- [Debugging](./debugging.md) – Debug your programs effectively
- [Project Layout](./project_layout.md) – Understand the project structure
