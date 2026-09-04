# Build System (UMS)

**UMS** (Unified Module System) is the official build system and project manager for Prismio. It handles project scaffolding, compilation, dependency resolution, test execution, and benchmarking — all through a single `prismio` command-line interface.

> 🚧 **Coming Soon** – UMS is under active development. Core build commands (`build`, `run`, `clean`) are available today; advanced features like build scripts, workspaces, and the full dependency registry are planned for upcoming releases.

---

## Creating a New Project

To create a new Prismio project, run:

```bash
prismio new my_project
```

This generates the following directory layout:

```
my_project/
├── prismio.toml        # Project manifest (configuration file)
├── src/
│   └── main.prism      # Entry point
└── .gitignore
```

For a library project (no `main` entry point):

```bash
prismio new my_library --lib
```

```
my_library/
├── prismio.toml
├── src/
│   └── lib.prism       # Library root module
└── .gitignore
```

---

## The `prismio.toml` Configuration File

Every Prismio project is described by a `prismio.toml` manifest file in the project root. This file uses [TOML](https://toml.io/) syntax.

### Minimal Example

```toml
[package]
name    = "my_project"
version = "0.1.0"
author  = "Your Name <you@example.com>"
edition = "2025"
```

### Full Example

```toml
[package]
name        = "my_project"
version     = "1.0.0"
author      = "Saksham Jaiswal <vibrant.official275@gmail.com>"
description = "A blazing-fast CLI tool written in Prismio"
license     = "MIT"
edition     = "2025"
repository  = "https://github.com/example/my_project"
keywords    = ["cli", "tool"]

# Binary entry point (for executable projects)
[bin]
name = "my_project"
path = "src/main.prism"

# Library target (for library projects)
# [lib]
# name = "my_library"
# path = "src/lib.prism"

# Dependencies
[dependencies]
prismio-json  = "1.2.0"
prismio-http  = "0.8.3"
my-utils      = { path = "../my-utils" }      # Local path dependency
other-lib     = { git = "https://github.com/example/other-lib", branch = "main" }

# Development-only dependencies (not included in release builds)
[dev-dependencies]
prismio-test-utils = "0.3.1"

# Build profiles
[profile.release]
opt_level    = 3          # -O3 optimization
lto          = true       # Link-time optimization
strip        = true       # Strip debug symbols from binary
panic        = "abort"    # Use abort instead of unwind on panic

[profile.debug]
opt_level    = 0          # No optimization
debug_info   = true       # Include full debug info
overflow_checks = true    # Enable integer overflow checks
```

### `[package]` Fields

| Field         | Type     | Required | Description                                    |
|---------------|----------|----------|------------------------------------------------|
| `name`        | String   | ✅ Yes   | Package name (lowercase, hyphens allowed)      |
| `version`     | String   | ✅ Yes   | Semantic version (`MAJOR.MINOR.PATCH`)         |
| `edition`     | String   | ✅ Yes   | Language edition (currently `"2025"`)          |
| `author`      | String   | No       | Author name and optional email                 |
| `description` | String   | No       | Short description for the package registry     |
| `license`     | String   | No       | SPDX license identifier (e.g., `"MIT"`)        |
| `repository`  | String   | No       | URL to the source repository                   |
| `keywords`    | String[] | No       | Tags for package discovery                     |

---

## Build Targets

UMS supports three built-in build profiles:

### `debug` (default)

Produces a development build with fast compile times and full debug information. No optimizations are applied.

```bash
prismio build
```

Output: `target/debug/<project_name>`

### `release`

Produces an optimized production build. Compile times are longer but the resulting binary is significantly faster and smaller.

```bash
prismio build --release
```

Output: `target/release/<project_name>`

### `test`

Compiles the project in test mode, including all `#[test]` functions. Used internally by `prismio test`.

```bash
prismio test
```

---

## CLI Commands

### `prismio build`

Compiles the project.

```bash
prismio build               # Debug build
prismio build --release     # Release build
prismio build --target aarch64-unknown-linux-gnu  # Cross-compile
prismio build --emit ir     # Emit LLVM IR instead of a binary
```

| Flag               | Description                                      |
|--------------------|--------------------------------------------------|
| `--release`        | Build with release optimizations                 |
| `--target <triple>`| Cross-compile to the specified target            |
| `--emit <type>`    | Emit `ir`, `asm`, `obj`, or `ast`                |
| `--verbose`        | Print detailed compilation output                |
| `--deny-warnings`  | Treat compiler warnings as errors                |
| `-o <path>`        | Override the output file path                    |

---

### `prismio run`

Builds and immediately runs the project.

```bash
prismio run                         # Debug build and run
prismio run --release               # Release build and run
prismio run -- --my-arg value       # Pass arguments to the program
```

Arguments after `--` are forwarded directly to the compiled binary.

---

### `prismio clean`

Removes all build artifacts from the `target/` directory.

```bash
prismio clean
```

To only clean a specific profile:

```bash
prismio clean --release
```

---

### `prismio test`

> 🚧 **Coming Soon** – See [Testing](./testing.md) for details.

Compiles and runs all test functions in the project.

```bash
prismio test                        # Run all tests
prismio test my_module              # Run tests in a specific module
prismio test --filter test_name     # Run tests matching a name pattern
```

---

### `prismio bench`

> 🚧 **Coming Soon** – See [Benchmarking](./benchmarking.md) for details.

Compiles and runs benchmark functions annotated with `#[bench]`.

```bash
prismio bench
prismio bench --filter bench_sort
```

---

### `prismio add`

> 🚧 **Coming Soon** – See [Package Manager](./package_manager.md) for details.

Adds a dependency to `prismio.toml` and fetches it.

```bash
prismio add prismio-json
prismio add prismio-http@0.8.3
```

---

### `prismio fmt`

> 🚧 **Coming Soon** – See [Formatter](./formatter.md) for details.

Formats all `.prism` source files in the project.

```bash
prismio fmt
prismio fmt --check   # Check formatting without modifying files (useful in CI)
```

---

### `prismio lint`

> 🚧 **Coming Soon** – See [Linter](./linter.md) for details.

Runs the linter across all source files.

```bash
prismio lint
prismio lint --fix    # Automatically fix lint issues where possible
```

---

## Dependency Management

Dependencies are declared in the `[dependencies]` section of `prismio.toml`.

### Registry Dependencies

> 🚧 **Coming Soon** – The Prismio package registry is under development.

```toml
[dependencies]
prismio-json = "1.2.0"
```

### Local Path Dependencies

Use `path` to depend on another package on your local filesystem:

```toml
[dependencies]
my-utils = { path = "../my-utils" }
```

### Git Dependencies

> 🚧 **Coming Soon**

Depend directly on a Git repository:

```toml
[dependencies]
some-lib = { git = "https://github.com/example/some-lib", tag = "v1.0.0" }
```

Supported keys: `git`, `branch`, `tag`, `rev`.

---

## The `target/` Directory

UMS places all build outputs in the `target/` directory at the project root:

```
target/
├── debug/
│   ├── my_project          # Debug binary (Linux/macOS)
│   ├── my_project.exe      # Debug binary (Windows)
│   └── deps/               # Compiled dependencies
├── release/
│   ├── my_project
│   └── deps/
└── .prismio-lock           # Dependency lock file
```

The `.prismio-lock` file records the exact resolved versions of all dependencies. It should be committed to version control for binary projects, and excluded for libraries.

---

## Build Scripts

> 🚧 **Coming Soon** – Build scripts allow running custom Prismio code before compilation (e.g., code generation, linking native libraries).

Build scripts will be declared in `prismio.toml`:

```toml
[package]
build = "build.prism"
```

---

## Workspaces

> 🚧 **Coming Soon** – Workspaces allow grouping multiple related packages in a single repository with shared dependency resolution.

```toml
# Root prismio.toml
[workspace]
members = [
    "my_app",
    "my_lib",
    "shared_utils",
]
```

---

## Environment Variables

UMS respects several environment variables at build time:

| Variable               | Description                                     |
|------------------------|-------------------------------------------------|
| `PRISMIO_LOG`          | Set log verbosity (`error`, `warn`, `info`, `debug`) |
| `PRISMIO_TARGET_DIR`   | Override the default `target/` directory        |
| `PRISMIO_HOME`         | Override the Prismio home directory             |

---

## See Also

- [Compiler Architecture](./compiler.md) – how the Prismio compiler works
- [Package Manager](./package_manager.md) – publishing and installing packages
- [Testing](./testing.md) – writing and running tests
- [Benchmarking](./benchmarking.md) – measuring performance
