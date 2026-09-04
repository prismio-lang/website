# Style Guide

This document describes the coding style used in the Prismio compiler codebase and is the expected style for all contributions.

## Code Formatting

All Prismio code should be formatted using `prismfmt` (coming soon). In the meantime, follow these conventions manually.

```bash
# Format before committing (when available)
prismio fmt
```

---

## Naming Conventions

### Variables and Function Parameters

Use **camelCase**:

```prismio
let userName = "Alice"
let totalCount = 42
let isActive = true

fn getUserName(userId: Int) -> String { ... }
```

### Functions

Use **camelCase**:

```prismio
fn calculateArea(radius: Float) -> Float { ... }
fn parseInput(raw: String) -> Result<Int, Error> { ... }
pub fn renderFrame() { ... }
```

### Types (Structs, Enums, Type Aliases)

Use **PascalCase**:

```prismio
struct UserProfile { ... }
enum ConnectionState { ... }
type UserId = Int
```

### Constants

Use **SCREAMING_SNAKE_CASE** for module-level constants:

```prismio
let MAX_RETRY_COUNT = 3
let DEFAULT_TIMEOUT_MS = 5000
let PI = 3.14159265358979
```

### Modules and Files

Use **snake_case** for file and module names:

```
src/
├── type_checker.pr
├── ast_nodes.pr
├── code_gen.pr
└── error_reporter.pr
```

---

## Comment Style

### Line Comments

Use `//` with a space after the slashes:

```prismio
// Good: space after //
let x = 5  // Inline comment on same line

//Bad: no space (avoid)
```

### Documentation Comments

All public functions, types, and constants should have doc comments (`///`):

```prismio
/// Computes the nth Fibonacci number.
///
/// Returns 0 for n = 0, 1 for n = 1, and fib(n-1) + fib(n-2) for n > 1.
///
/// # Example
/// ```prismio
/// let result = fibonacci(10)
/// println(result)  // 55
/// ```
pub fn fibonacci(n: Int) -> Int {
    if n <= 1 { return n }
    fibonacci(n - 1) + fibonacci(n - 2)
}
```

### Block Comments

Use `/* */` sparingly, mainly for temporarily disabling code:

```prismio
/*
fn oldImplementation() {
    // This will be removed once new impl is stable
}
*/
```

---

## Code Structure

### Imports

Group imports in this order, separated by blank lines:

```prismio
// 1. Standard library imports
import std.io
import std.collections.List

// 2. Third-party imports
import some.external.Library

// 3. Internal/local imports
import myapp.utils
import myapp.models.User
```

No wildcard imports. Be explicit:

```prismio
// Bad
import std.io.*

// Good
import std.io.{ print, println, input }
```

### Function Length

Keep functions focused. If a function exceeds ~40 lines, consider breaking it into smaller functions.

### Error Handling

Prefer `Result<T, E>` over panicking for recoverable errors:

```prismio
// Good: propagate error
fn readConfig() -> Result<Config, Error> {
    let content = fs.readToString("config.toml")?
    parseConfig(content)
}

// Avoid for recoverable errors
fn readConfig() {
    let content = fs.readToString("config.toml")!!  // panics!
}
```

---

## Module Organization

Structure modules to keep related code together:

```
src/
├── main.pr          # Entry point
├── config.pr        # Configuration types and loading
├── models/
│   ├── mod.pr       # Re-exports
│   ├── user.pr      # User model
│   └── post.pr      # Post model
└── utils/
    ├── mod.pr
    ├── string.pr
    └── math.pr
```

---

## Test Organization

Tests live in the `tests/` directory or adjacent to source files:

```prismio
// In source file or tests/test_math.pr
#[test]
fn testAddPositiveNumbers() {
    let result = add(3, 4)
    assert(result == 7, "3 + 4 should equal 7")
}

#[test]
fn testAddNegativeNumbers() {
    let result = add(-3, -4)
    assert(result == -7)
}
```

Test naming: `test` + PascalCase description of what is being tested.

---

## Commit Message Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation changes
- `test` — adding or fixing tests
- `refactor` — code restructuring (no feature/bug change)
- `perf` — performance improvements
- `chore` — maintenance tasks (CI, build config, etc.)

Examples:
```
feat(parser): add support for raw string literals
fix(typeck): correctly infer type of empty array literal
docs(guide): add error handling best practices
test(codegen): add test for function with multiple returns
```

---

## Pull Request Guidelines

1. **Branch from `main`** — always create your branch from `main`
2. **One feature per PR** — keep PRs focused and reviewable
3. **Write tests** — new features should include tests
4. **Update docs** — if behavior changes, update the documentation
5. **Run the test suite** — all tests must pass before requesting review
6. **Descriptive PR title** — use the same convention as commit messages
7. **Fill out the PR template** — describe what the PR does and how to test it

### PR Checklist

- [ ] Code follows the style guide
- [ ] Tests added/updated
- [ ] Documentation updated (if relevant)
- [ ] `prismio fmt` run on changed files
- [ ] `prismio test` passes
- [ ] PR title follows conventional commits format

See also: [Source Repositories](./source.md), [RFC Process](./rfc.md)
