# Package Manager

> 🚧 **Coming Soon** – The Prismio package manager and package registry are planned but not yet implemented. This page describes the intended design and API for reference.

Prismio ships with a built-in package manager as part of the **UMS (Unified Module System)** toolchain. There is no separate tool to install — everything is available through the `prismio` CLI. The package manager handles adding, updating, and removing dependencies; resolving version conflicts; and publishing packages to the Prismio package registry.

---

## Overview

| Command                          | Description                                      |
|----------------------------------|--------------------------------------------------|
| `prismio add <package>`          | Add a dependency to the project                  |
| `prismio remove <package>`       | Remove a dependency from the project             |
| `prismio update`                 | Update all dependencies to their latest versions |
| `prismio update <package>`       | Update a specific dependency                     |
| `prismio publish`                | Publish the package to the registry              |
| `prismio search <query>`         | Search the package registry                      |
| `prismio info <package>`         | Show details about a package                     |

---

## Adding Dependencies

### Adding a Package from the Registry

```bash
prismio add prismio-json
```

This command:
1. Resolves the latest compatible version of `prismio-json`
2. Adds it to the `[dependencies]` section of `prismio.toml`
3. Fetches the package and its transitive dependencies
4. Updates the `.prismio-lock` lockfile

`prismio.toml` after running the command:

```toml
[dependencies]
prismio-json = "1.4.2"
```

### Adding a Specific Version

```bash
prismio add prismio-json@1.2.0
```

### Adding a Version Range

```bash
prismio add "prismio-json@^1.0.0"    # >=1.0.0 and <2.0.0
prismio add "prismio-json@~1.2.0"    # >=1.2.0 and <1.3.0
prismio add "prismio-json@>=1.1.0"   # 1.1.0 or higher
```

### Adding a Dev Dependency

Dev dependencies are only included in debug/test builds:

```bash
prismio add --dev prismio-test-utils
```

`prismio.toml`:

```toml
[dev-dependencies]
prismio-test-utils = "0.3.1"
```

### Adding a Git Dependency

```bash
prismio add --git https://github.com/example/my-lib
prismio add --git https://github.com/example/my-lib --branch dev
prismio add --git https://github.com/example/my-lib --tag v2.0.0
prismio add --git https://github.com/example/my-lib --rev abc1234
```

`prismio.toml`:

```toml
[dependencies]
my-lib = { git = "https://github.com/example/my-lib", tag = "v2.0.0" }
```

### Adding a Local Path Dependency

```bash
prismio add --path ../my-local-lib
```

`prismio.toml`:

```toml
[dependencies]
my-local-lib = { path = "../my-local-lib" }
```

---

## Removing Dependencies

```bash
prismio remove prismio-json
```

This removes the entry from `prismio.toml` and updates the lockfile. Any packages that were only required by the removed dependency are also cleaned up.

---

## Updating Dependencies

### Update All Dependencies

```bash
prismio update
```

Updates all dependencies to the latest version that satisfies the version constraints in `prismio.toml`.

### Update a Specific Package

```bash
prismio update prismio-json
```

### Update to a New Major Version

Major version bumps (which may include breaking changes) require an explicit version constraint update:

```bash
prismio add prismio-json@2.0.0   # Explicitly upgrades to v2
```

---

## The `prismio.toml` Dependencies Section

### Dependency Specification

```toml
[dependencies]
# Simple version constraint (latest matching)
prismio-json   = "1.4.2"
prismio-http   = "^0.8.0"      # >=0.8.0 and <0.9.0
prismio-crypto = "~2.1.0"      # >=2.1.0 and <2.2.0

# Git dependency
some-lib = { git = "https://github.com/example/some-lib", branch = "stable" }

# Local path dependency (for monorepos or local development)
my-shared-utils = { path = "../shared/utils" }

# Optional dependency (not compiled unless a feature enables it)
prismio-serde = { version = "1.0.0", optional = true }

[dev-dependencies]
prismio-test-utils = "0.3.1"
```

### Version Constraint Syntax

| Syntax              | Meaning                                          | Example                             |
|---------------------|--------------------------------------------------|-------------------------------------|
| `"1.2.3"`           | Exact version                                    | Only `1.2.3`                        |
| `"^1.2.3"`          | Compatible (same major)                          | `>=1.2.3` and `<2.0.0`             |
| `"~1.2.3"`          | Approximately equal (same minor)                 | `>=1.2.3` and `<1.3.0`             |
| `">=1.0.0"`         | Greater than or equal                            | `1.0.0`, `1.5.0`, `2.0.0`, …      |
| `">=1.0.0, <2.0.0"` | Range                                            | `1.0.0` up to (not including) `2.0.0` |
| `"*"`               | Any version (not recommended)                    | Whatever is latest                  |

---

## The Lockfile (`.prismio-lock`)

The lockfile records the **exact resolved versions** of every dependency (direct and transitive). This ensures reproducible builds: anyone who clones your repository and runs `prismio build` will use the same dependency versions.

```toml
# .prismio-lock — auto-generated, do not edit manually

[[package]]
name    = "prismio-json"
version = "1.4.2"
source  = "registry+https://registry.prismio.dev"
checksum = "sha256:a3f1b2c4..."

[[package]]
name    = "prismio-utf8"  # transitive dependency of prismio-json
version = "0.2.1"
source  = "registry+https://registry.prismio.dev"
checksum = "sha256:7e9d3c1a..."
```

**Version control guidelines:**

- **Executable projects (apps, CLIs):** Commit `.prismio-lock`. This pins the exact versions for reproducible deployments.
- **Libraries:** Add `.prismio-lock` to `.gitignore`. Libraries should declare version ranges so downstream consumers can resolve compatible versions.

---

## Searching the Registry

```bash
prismio search json
```

Output:

```
prismio-json      1.4.2    Fast, zero-copy JSON parser and serializer  ⬇ 142k/month
prismio-json5     0.9.0    JSON5 format support                        ⬇ 12k/month
prismio-jsonpath  0.5.1    JSONPath query language implementation       ⬇ 4k/month
```

### Viewing Package Details

```bash
prismio info prismio-json
```

```
Package:     prismio-json
Version:     1.4.2
Author:      Jane Doe <jane@example.com>
License:     MIT
Description: Fast, zero-copy JSON parser and serializer for Prismio
Repository:  https://github.com/example/prismio-json
Downloads:   142,000/month

Versions:    1.4.2, 1.4.1, 1.4.0, 1.3.5, 1.2.0, 1.0.0
Dependencies:
  prismio-utf8 ^0.2.0
```

---

## Publishing Packages

### Prerequisites

1. Create an account on the Prismio package registry at `registry.prismio.dev`
2. Log in from the command line:

```bash
prismio login
```

### Preparing Your Package

Ensure your `prismio.toml` has all required fields:

```toml
[package]
name        = "my-awesome-lib"
version     = "1.0.0"
author      = "Your Name <you@example.com>"
description = "A concise description of what your library does"
license     = "MIT"
repository  = "https://github.com/you/my-awesome-lib"
keywords    = ["utility", "parsing"]

[lib]
name = "my-awesome-lib"
path = "src/lib.prism"
```

### Dry Run

Before publishing, verify what will be uploaded:

```bash
prismio publish --dry-run
```

This shows the list of files that would be included and the final size of the package.

### Publishing

```bash
prismio publish
```

The registry will:
1. Verify your authentication token
2. Validate the package metadata
3. Run the package's tests (`prismio test`)
4. Upload the source archive and computed checksums
5. Make the package available at `registry.prismio.dev/<your-name>/my-awesome-lib`

### Yanking a Version

If a published version has a critical bug, you can yank it. Yanked versions are not installed by new projects, but existing projects pinned to that version continue to work:

```bash
prismio yank my-awesome-lib@1.0.1
```

To un-yank:

```bash
prismio yank --undo my-awesome-lib@1.0.1
```

---

## `.prismioignore`

Control which files are included when publishing by creating a `.prismioignore` file (uses the same syntax as `.gitignore`):

```
# .prismioignore
tests/
benches/
examples/
*.log
.env
```

By default, the following are always excluded:
- `.git/`
- `target/`
- `.prismio-lock` (unless publishing an executable)

---

## Package Registry

The official Prismio package registry is hosted at **`registry.prismio.dev`**. It provides:

- A searchable web interface for browsing packages
- Automatic documentation generation from doc comments
- Download statistics and version history
- Security advisories for known vulnerable packages
- A namespace system: `@author/package-name` for scoped packages

### Scoped Packages

```bash
prismio add @prismio/collections
```

```toml
[dependencies]
"@prismio/collections" = "2.1.0"
```

### Private Registries

> 🚧 **Coming Soon** – Support for self-hosted private registries is planned.

Configure an alternate registry in `prismio.toml`:

```toml
[registries]
my-company = { url = "https://packages.my-company.internal" }

[dependencies]
internal-utils = { version = "1.0.0", registry = "my-company" }
```

---

## Dependency Resolution Algorithm

The Prismio package manager uses a **version resolution algorithm** similar to Cargo's (Rust) PubGrub solver:

1. Collect all direct dependencies and their version constraints
2. Fetch the list of available versions for each dependency from the registry
3. Recursively resolve transitive dependencies
4. Find a single assignment of versions that satisfies all constraints
5. If no solution exists, report a clear conflict message
6. Write the resolved versions to `.prismio-lock`

### Conflict Example

```
error: dependency conflict
  prismio-http requires:   prismio-tls ^1.0.0 (resolves to 1.5.2)
  my-ssl-wrapper requires: prismio-tls ^2.0.0 (resolves to 2.1.0)

  These constraints are incompatible. To resolve:
  - Check if a newer version of `prismio-http` supports prismio-tls v2
  - Or pin `prismio-http` to a version that uses prismio-tls v2
```

---

## See Also

- [Build System (UMS)](./build.md) – full `prismio.toml` reference
- [Testing](./testing.md) – running package tests before publishing
- [Compiler Architecture](./compiler.md) – how dependencies are compiled
