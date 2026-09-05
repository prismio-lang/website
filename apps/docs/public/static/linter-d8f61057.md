# Linter

> 🚧 **Coming Soon** – The Prismio linter is planned but not yet implemented. This page describes the intended design and API for reference.

The Prismio linter is a static analysis tool that catches potential bugs, enforces best practices, and improves code quality beyond what the type system and borrow checker enforce. It is invoked via `prismio lint` and integrates with the Prismio Language Server for real-time feedback in your editor.

Unlike the compiler (which rejects invalid programs) and the formatter (which corrects style), the linter works on a spectrum — many lint rules are **warnings** by default, and developers can tune each rule's severity or disable it entirely.

---

## Running the Linter

### Lint the Entire Project

```bash
prismio lint
```

This analyzes every `.prism` file reachable from the project's root module and prints a structured report.

### Lint a Specific File

```bash
prismio lint components/utils.prism
```

### Auto-Fix Mode

> 🚧 **Coming Soon** – Automatic fixing of lint issues.

Many lint rules can be automatically fixed. Run with `--fix` to apply all safe, automatic corrections:

```bash
prismio lint --fix
```

For a dry run that shows what would be changed without modifying files:

```bash
prismio lint --fix --dry-run
```

### CI Mode

Exit with a non-zero status code if any lints are triggered (useful in CI pipelines):

```bash
prismio lint --deny all
```

---

## Configuration

Lint rules are configured in `prismio.toml` under the `[lint]` table:

```toml
[lint]
# Set the default level for all rules not explicitly configured
default_level = "warn"

# Configure individual rules
[lint.rules]
unused_variable       = "error"    # Promote to error
dead_code             = "warn"     # Keep as warning (default)
unnecessary_clone     = "warn"
missing_docs          = "allow"    # Suppress this rule entirely
single_char_variable  = "allow"
implicit_return       = "warn"
```

### Lint Levels

| Level     | Description                                           |
|-----------|-------------------------------------------------------|
| `error`   | Fails the lint run with a non-zero exit code          |
| `warn`    | Prints a warning but exits with code `0`              |
| `allow`   | Completely suppresses the rule — no output produced   |

---

## Inline Lint Directives

Rules can be suppressed inline for specific lines or blocks of code using `#[allow(...)]` attributes:

### Suppress a Single Line

```prismio
#[allow(unused_variable)]
let _debug_value = expensive_computation()
```

### Suppress a Block or Function

```prismio
#[allow(missing_docs)]
fn internal_helper() -> Int {
    42
}
```

### Suppress Multiple Rules

```prismio
#[allow(unused_variable, dead_code)]
fn legacy_function() {
    let temp = 0
}
```

### Deny Inline (Promote to Error)

```prismio
#[deny(unnecessary_clone)]
fn my_critical_function(data: [Int]) {
    process(data.clone())  // error: unnecessary clone
}
```

---

## Available Lint Rules

### Correctness Rules

These rules catch likely bugs and are enabled as `warn` or `error` by default.

| Rule                          | Level    | Description                                                    |
|-------------------------------|----------|----------------------------------------------------------------|
| `unreachable_code`            | `warn`   | Code after a `return`, `break`, or `loop {}` is unreachable   |
| `unused_result`               | `warn`   | Result of a function returning a value is silently discarded  |
| `unused_variable`             | `warn`   | A declared variable is never read                             |
| `unused_import`               | `warn`   | An imported module is not used anywhere in the file           |
| `redundant_condition`         | `warn`   | A condition is always `true` or always `false`                |
| `infinite_loop_no_break`      | `warn`   | A `loop` block contains no reachable `break` statement        |
| `shadowed_variable`           | `warn`   | A `let` binding shadows an outer binding of the same name     |
| `integer_overflow_literal`    | `error`  | A literal value exceeds the maximum for its declared type      |

### Style Rules

These rules enforce idiomatic Prismio style.

| Rule                          | Level    | Description                                                    |
|-------------------------------|----------|----------------------------------------------------------------|
| `single_char_variable`        | `warn`   | Variable name is a single character (except `i`, `j`, `k`, `_`) |
| `uppercase_variable`          | `warn`   | Variable name starts with an uppercase letter                  |
| `unnecessary_clone`           | `warn`   | A `.clone()` call is not needed (value already owned)         |
| `implicit_return`             | `warn`   | Last expression is returned explicitly with `return` keyword   |
| `empty_block`                 | `warn`   | A block `{}` contains no statements and no comment            |
| `double_negation`             | `warn`   | `!!expr` should be written as `expr`                           |
| `comparison_to_bool`          | `warn`   | `expr == true` or `expr == false` should be simplified        |
| `unnecessary_parentheses`     | `warn`   | Wrapping an `if` or `return` value in parentheses             |

### Performance Rules

> 🚧 **Coming Soon** – Performance lint rules are planned for a future release.

| Rule                          | Level    | Description                                                    |
|-------------------------------|----------|----------------------------------------------------------------|
| `clone_in_loop`               | `warn`   | `.clone()` called inside a loop body                           |
| `large_stack_allocation`      | `warn`   | A stack-allocated array or struct exceeds a configurable size  |
| `string_concat_in_loop`       | `warn`   | String concatenation with `+` inside a loop (use `StringBuilder`) |

### Documentation Rules

| Rule                          | Level    | Description                                                    |
|-------------------------------|----------|----------------------------------------------------------------|
| `missing_docs`                | `allow`  | A public function, struct, or module has no doc comment        |
| `incomplete_docs`             | `allow`  | A doc comment exists but is missing `@param` or `@return`     |

---

## Example Lint Output

```
warning[L0201]: unused variable
  --> src/main.prism:12:9
   |
12 |     let temp = calculate()
   |         ^^^^ variable `temp` is assigned but never used
   |
   = help: if intentional, prefix the name with an underscore: `_temp`
   = note: `#[allow(unused_variable)]` to suppress this warning

warning[L0311]: comparison to bool
  --> src/main.prism:20:8
   |
20 |     if is_ready == true {
   |        ^^^^^^^^^^^^^^^^ unnecessary comparison to `true`
   |
   = help: simplify to: `if is_ready {`
   [auto-fixable]

error[L0102]: unreachable code
  --> src/main.prism:31:5
   |
30 |     return result
31 |     println("done")
   |     ^^^^^^^^^^^^^^^ unreachable statement
   |
   = note: code after `return` will never execute
```

---

## Auto-Fixable Rules

The following rules support automatic correction with `prismio lint --fix`:

| Rule                      | Fix Applied                                              |
|---------------------------|----------------------------------------------------------|
| `unused_import`           | Removes the unused `import` statement                   |
| `comparison_to_bool`      | Rewrites `expr == true` → `expr`, `expr == false` → `!expr` |
| `unnecessary_parentheses` | Removes the redundant parentheses                       |
| `double_negation`         | Rewrites `!!x` → `x`                                   |
| `implicit_return`         | Removes the `return` keyword from the last expression   |
| `single_char_variable`    | *(Suggests* a rename, but does not auto-apply)*         |

> **Note:** Auto-fixes are always safe — they preserve program semantics. The linter will never apply a fix that changes behavior.

---

## Suppressing Rules Project-Wide

To suppress a rule for the entire project, set it to `allow` in `prismio.toml`:

```toml
[lint.rules]
missing_docs = "allow"
single_char_variable = "allow"
```

To promote all warnings to errors (strict mode):

```toml
[lint]
default_level = "error"
```

---

## Using the Linter in CI

```yaml
# GitHub Actions example
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Prismio
        run: curl -sSf https://get.prismio.dev | sh
      - name: Run linter
        run: prismio lint --deny all
```

---

## Editor Integration

> 🚧 **Coming Soon** – Real-time lint diagnostics via the Prismio Language Server (PLS).

Once PLS is available, lint diagnostics will appear inline in your editor as you type — no need to run `prismio lint` manually. Supported editors will include VS Code, Neovim, JetBrains IDEs, and Helix.

---

## See Also

- [Formatter](./formatter.md) – automatic code formatting
- [Diagnostics](./diagnostics.md) – understanding compiler error messages
- [Build System (UMS)](./build.md) – project configuration
