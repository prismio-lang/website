# Issue Labels

Prismio uses a structured label system on GitHub to categorize and prioritize issues and pull requests.

## Status Labels

| Label | Color | Description |
|-------|-------|-------------|
| `status: triage` | Gray | Newly opened, needs initial review |
| `status: confirmed` | Blue | Bug confirmed by a maintainer |
| `status: in-progress` | Yellow | Someone is actively working on it |
| `status: blocked` | Orange | Blocked on another issue or decision |
| `status: wont-fix` | Dark Gray | Will not be addressed (with explanation) |
| `status: duplicate` | Gray | Duplicate of another issue |

---

## Type Labels

| Label | Color | Description |
|-------|-------|-------------|
| `type: bug` | Red | Something is broken |
| `type: feature` | Green | New feature request |
| `type: enhancement` | Light Green | Improvement to existing functionality |
| `type: docs` | Blue | Documentation issue or improvement |
| `type: question` | Purple | Question about behavior |
| `type: performance` | Orange | Performance issue or improvement |
| `type: security` | Dark Red | Security concern (see Security Policy) |
| `type: RFC` | Gold | Substantial design proposal |

---

## Priority Labels

| Label | Color | Description |
|-------|-------|-------------|
| `priority: critical` | Dark Red | Blocker — must fix immediately |
| `priority: high` | Red | Should fix in next release |
| `priority: medium` | Yellow | Should fix soon |
| `priority: low` | Green | Nice to fix when time allows |

---

## Component Labels

Issues are tagged with the affected component:

| Label | Description |
|-------|-------------|
| `component: compiler` | Compiler (lexer, parser, typeck, codegen) |
| `component: lexer` | Tokenizer/lexer |
| `component: parser` | Parser and AST |
| `component: typeck` | Type checker |
| `component: codegen` | LLVM code generation |
| `component: stdlib` | Standard library |
| `component: docs` | Documentation |
| `component: toolchain` | Build system, formatter, linter |
| `component: LSP` | Language server |
| `component: cli` | Command-line interface |
| `component: platform: windows` | Windows-specific |
| `component: platform: macos` | macOS-specific |
| `component: platform: linux` | Linux-specific |
| `component: platform: wasm` | WebAssembly target |

---

## Community Labels

| Label | Description |
|-------|-------------|
| `good first issue` | Suitable for newcomers to the project |
| `help wanted` | Extra attention is needed; open for community |
| `mentor available` | A maintainer is available to guide contributions |
| `hacktoberfest` | Eligible for Hacktoberfest |

---

## Filing a Good Bug Report

A good bug report includes:

### 1. Minimal Reproducible Example

The smallest piece of Prismio code that demonstrates the bug:

```prismio
// This fails with an ICE (Internal Compiler Error):
fn main() {
    let x: [Int] = []
    println(x[0])    // Expected: bounds-check error, Got: crash
}
```

### 2. Expected vs. Actual Behavior

- **Expected:** A runtime bounds-check error with a clear message
- **Actual:** The compiler panics with "index out of bounds at codegen.rs:1234"

### 3. Environment Information

```
Prismio version: 0.1.0
OS: Ubuntu 22.04 x86_64
LLVM version: 17.0.6
```

### 4. Error Output

Paste the full error output, including stack traces if present.

---

## Issue Templates

When you open an issue on GitHub, choose from the available templates:

- **Bug Report** — For compiler bugs, crashes, incorrect behavior
- **Feature Request** — For new language features or standard library additions
- **Documentation Issue** — For missing or incorrect documentation
- **Performance Issue** — For unexpected performance regressions

---

## Triaging Issues

If you want to help triage issues (no coding required):

1. Reproduce reported bugs and confirm they exist
2. Add the `status: confirmed` label to confirmed bugs
3. Add appropriate `component:` and `type:` labels
4. Link duplicate issues together
5. Ask for missing information from the reporter

See also: [Source Repositories](./source.md), [Style Guide](./style.md), [Security Policy](./security.md)
