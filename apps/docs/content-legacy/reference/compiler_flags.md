# Compiler Flags

Reference for all command-line flags accepted by the `prismio` compiler and toolchain.

> 🚧 **Coming Soon** – The full CLI is under development. This page documents currently supported flags and planned additions.

## Basic Usage

```bash
prismio <command> [options] [files]
```

## Top-Level Commands

| Command | Description |
|---------|-------------|
| `prismio build` | Compile the current project |
| `prismio run` | Build and run the project |
| `prismio check` | Type-check without producing output |
| `prismio clean` | Remove build artifacts |
| `prismio test` | Run tests |
| `prismio fmt` | Format source files |
| `prismio lint` | Run the linter |
| `prismio lsp` | Start the language server |
| `prismio version` | Print version information |
| `prismio help` | Show help |

---

## Build Flags

### `--target <triple>`
Specify the compilation target triple.

```bash
prismio build --target x86_64-unknown-linux-gnu
prismio build --target aarch64-apple-macos
prismio build --target wasm32-unknown-unknown
```

Common targets:

| Triple | Platform |
|--------|----------|
| `x86_64-unknown-linux-gnu` | Linux (64-bit) |
| `aarch64-unknown-linux-gnu` | Linux (ARM64) |
| `x86_64-apple-macos` | macOS (Intel) |
| `aarch64-apple-macos` | macOS (Apple Silicon) |
| `x86_64-pc-windows-msvc` | Windows (64-bit) |
| `wasm32-unknown-unknown` | WebAssembly |

---

### `-O<level>` / `--opt-level <level>`
Set the LLVM optimization level.

| Flag | Level | Description |
|------|-------|-------------|
| `-O0` | None | No optimization (default in debug) |
| `-O1` | Basic | Basic optimizations |
| `-O2` | Moderate | Most optimizations (default in release) |
| `-O3` | Aggressive | All optimizations including vectorization |
| `-Os` | Size | Optimize for binary size |
| `-Oz` | Min size | Minimize binary size aggressively |

```bash
prismio build -O2
prismio build --opt-level 3
```

---

### `--debug` / `--release`
Select the build profile.

```bash
prismio build --debug      # debug build (default): no opt, debug symbols
prismio build --release    # release build: -O2, no debug symbols
```

---

### `--emit <format>`
Emit intermediate representations instead of the final binary.

| Format | Output |
|--------|--------|
| `ir` | LLVM IR (`.ll`) |
| `bc` | LLVM Bitcode (`.bc`) |
| `asm` | Assembly (`.s`) |
| `obj` | Object file (`.o`) |
| `ast` | AST dump (JSON) |

```bash
prismio build --emit ir       # output LLVM IR
prismio build --emit asm      # output assembly
prismio build --emit obj      # stop after object file generation
```

---

### `--out-dir <path>`
Set the output directory for build artifacts.

```bash
prismio build --out-dir ./dist
```

---

### `-o <file>` / `--output <file>`
Set the output file name.

```bash
prismio build -o myapp
prismio build --output ./bin/myapp
```

---

### `--verbose` / `-v`
Enable verbose output showing each compilation step.

```bash
prismio build --verbose
```

---

## Diagnostic Flags

### `--error-format <format>`
Control error message output format.

| Format | Description |
|--------|-------------|
| `human` | Human-readable (default) |
| `json` | Machine-readable JSON |
| `short` | Compact single-line format |

```bash
prismio build --error-format json
```

---

### `--max-errors <N>`
Stop after N errors (default: 50).

```bash
prismio build --max-errors 10
```

---

### `-W <lint>` / `--warn <lint>`
Enable a specific lint warning.

```bash
prismio build -W unused-variables
```

---

### `-D <lint>` / `--deny <lint>`
Treat a lint as an error.

```bash
prismio build -D unused-imports
```

---

### `-A <lint>` / `--allow <lint>`
Suppress a lint warning.

```bash
prismio build -A dead-code
```

---

## Check Flags

```bash
prismio check          # type-check only, no output
prismio check --all    # check all files including tests
```

---

## Run Flags

```bash
prismio run                         # build and run
prismio run --release               # build in release mode and run
prismio run -- arg1 arg2            # pass arguments to the program
```

---

## Test Flags

> 🚧 **Coming Soon** – Full test runner support.

```bash
prismio test                        # run all tests
prismio test --filter "my_test"     # run tests matching a pattern
prismio test --release              # run tests in release mode
prismio test -- --nocapture         # show stdout from tests
```

---

## Format Flags

> 🚧 **Coming Soon** – Formatter CLI.

```bash
prismio fmt                         # format all .pr files in project
prismio fmt src/main.pr             # format a specific file
prismio fmt --check                 # check formatting without modifying
prismio fmt --diff                  # show diff of formatting changes
```

---

## LSP Flags

```bash
prismio lsp --stdio                 # run LSP over stdin/stdout
prismio lsp --port 7777             # run LSP over TCP
```

---

## Version

```bash
prismio version
# Output:
# prismio 0.1.0 (2026-06-01)
# LLVM version: 17.0.6
# Host: x86_64-unknown-linux-gnu

prismio --version     # short form
```

---

## Help

```bash
prismio help
prismio help build      # help for a specific command
prismio build --help    # alternative form
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRISMIO_HOME` | Root directory of the Prismio installation |
| `PRISMIO_TARGET` | Default compilation target |
| `PRISMIO_OPT_LEVEL` | Default optimization level |
| `PRISMIO_LOG` | Log verbosity (`error`, `warn`, `info`, `debug`, `trace`) |

```bash
PRISMIO_LOG=debug prismio build
```

> 🚧 **Coming Soon** – Many additional flags are planned. This reference will be updated as the compiler matures.
