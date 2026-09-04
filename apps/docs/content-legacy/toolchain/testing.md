# Testing

> 🚧 **Coming Soon** – The built-in test runner and `#[test]` annotation are partially implemented. Core test execution works; advanced features (coverage, parallel tests, custom reporters) are planned.

Prismio has a **built-in testing framework** — no external libraries needed. Tests are regular Prismio functions annotated with `#[test]`, and they are discovered and executed by `prismio test`.

---

## Writing Your First Test

Tests are functions annotated with `#[test]` that return nothing (`Unit`). A test passes if it runs to completion without panicking, and fails if it panics (including from a failed assertion).

```prismio
fn add(a: Int, b: Int) -> Int = a + b

#[test]
fn test_add() {
    assert(add(2, 3) == 5)
}
```

Run the tests:

```bash
prismio test
```

Output:

```
running 1 test
test test_add ... ok

test result: ok. 1 passed; 0 failed; 0 ignored in 0.001s
```

---

## Running Tests

### Run All Tests

```bash
prismio test
```

### Run Tests in a Specific Module

```bash
prismio test math
prismio test math::arithmetic
```

### Filter Tests by Name

Run only tests whose name contains a specific string:

```bash
prismio test --filter add
prismio test --filter "sort"
```

### Run a Single Named Test

```bash
prismio test test_add
```

### Run Tests in Release Mode

```bash
prismio test --release
```

### Show Output from Passing Tests

By default, output from passing tests is suppressed. To always show `println` output:

```bash
prismio test --show-output
```

### Run Tests in Parallel

> 🚧 **Coming Soon** – Parallel test execution is planned.

```bash
prismio test --jobs 4
```

---

## Test Organization

### Tests in the Same File

For small modules, tests can live directly alongside the code they test in the same `.prism` file:

```prismio
// src/math.prism

fn square(x: Int) -> Int = x * x
fn cube(x:   Int) -> Int = x * x * x

#[test]
fn test_square() {
    assert(square(4) == 16)
    assert(square(0) == 0)
    assert(square(-3) == 9)
}

#[test]
fn test_cube() {
    assert(cube(3) == 27)
}
```

### Dedicated Test Files

For larger projects, place tests in separate files. By convention, test files are named `<module>_test.prism`:

```
src/
├── math.prism
├── math_test.prism
├── strings.prism
└── strings_test.prism
```

```prismio
// src/math_test.prism
import src.math

#[test]
fn test_square_large() {
    assert(math.square(100) == 10000)
}
```

### Test Modules

> 🚧 **Coming Soon** – Grouping tests into dedicated test modules.

You will be able to group related tests into a module:

```prismio
#[test_module]
mod tests {
    #[test]
    fn test_one() { ... }

    #[test]
    fn test_two() { ... }
}
```

---

## Assertions

The standard library provides a set of assertion functions for use in tests.

### `assert(condition)`

Panics if `condition` is `false`.

```prismio
assert(1 + 1 == 2)
assert(!list.isEmpty())
```

### `assertEq(left, right)`

Panics if `left != right`, printing both values for easier debugging.

```prismio
assertEq(add(2, 3), 5)
// On failure:
// assertion failed: `left == right`
//   left:  4
//   right: 5
```

### `assertNe(left, right)`

Panics if `left == right`.

```prismio
assertNe(result, -1)
```

### `assertTrue(value)`

Asserts that a `Bool` is `true`.

```prismio
assertTrue(list.contains(42))
```

### `assertFalse(value)`

Asserts that a `Bool` is `false`.

```prismio
assertFalse(result.isError())
```

### `assertPanics { ... }`

> 🚧 **Coming Soon**

Asserts that a block of code panics:

```prismio
assertPanics {
    let arr: [Int] = []
    arr[5]  // index out of bounds
}
```

### Custom Failure Messages

All assertion functions accept an optional message:

```prismio
assertEq(actual, expected, "Mismatch after processing step 3")
```

---

## Ignoring Tests

Mark a test with `#[ignore]` to skip it. Ignored tests are still compiled but not executed:

```prismio
#[test]
#[ignore]
fn test_slow_operation() {
    // This will be skipped by default
}
```

To run ignored tests explicitly:

```bash
prismio test --include-ignored
```

---

## Setup and Teardown

> 🚧 **Coming Soon** – Test lifecycle hooks are planned.

```prismio
// Planned API
#[before_each]
fn setup() {
    // Runs before every test in this file
}

#[after_each]
fn teardown() {
    // Runs after every test in this file
}

#[before_all]
fn setup_suite() {
    // Runs once before all tests in this file
}
```

---

## Table-Driven Tests

Use loops to run the same test logic over multiple input cases:

```prismio
#[test]
fn test_add_table() {
    let cases = [
        (1, 2, 3),
        (0, 0, 0),
        (-1, 1, 0),
        (100, 200, 300),
    ]

    for (a, b, expected) in cases {
        assertEq(add(a, b), expected)
    }
}
```

---

## Integration Tests

> 🚧 **Coming Soon** – A dedicated `tests/` directory for integration tests that treat the project as a black box.

```
my_project/
├── src/
│   └── main.prism
├── tests/
│   ├── integration_test.prism   # Tests the compiled binary
│   └── api_test.prism
└── prismio.toml
```

---

## Test Output Format

### Default Output

```
running 5 tests
test test_add              ... ok
test test_subtract         ... ok
test test_multiply         ... FAILED
test test_divide           ... ok
test test_modulo_by_zero   ... ok

failures:

---- test_multiply stdout ----
assertion failed: `left == right`
  left:  10
  right: 9
  --> src/math_test.prism:22

test result: FAILED. 4 passed; 1 failed; 0 ignored in 0.003s
```

### JSON Output

> 🚧 **Coming Soon**

```bash
prismio test --format json
```

```json
{
  "results": [
    { "name": "test_add",      "status": "ok",     "duration_ms": 0 },
    { "name": "test_multiply", "status": "failed",  "duration_ms": 1, "message": "..." }
  ],
  "passed": 4,
  "failed": 1,
  "total_duration_ms": 3
}
```

---

## Test Coverage

> 🚧 **Coming Soon** – Code coverage reporting is planned.

```bash
prismio test --coverage
```

This will produce a coverage report showing which lines, branches, and functions were exercised by the test suite:

```
Coverage Report
───────────────────────────────────────────────
 File                  Lines    Branches   Fns
───────────────────────────────────────────────
 src/math.prism        95.2%    88.0%      100%
 src/strings.prism     87.3%    76.5%       90%
───────────────────────────────────────────────
 Total                 91.4%    82.1%       95%
```

HTML coverage reports:

```bash
prismio test --coverage --coverage-report html
# Opens target/coverage/index.html
```

---

## Compile-Only Tests

Verify that code compiles (but don't run it) with `#[compile_test]`:

> 🚧 **Coming Soon**

```prismio
#[compile_test]
fn verify_type_signature_compiles() {
    let _: [Int] = [1, 2, 3]
}
```

---

## See Also

- [Benchmarking](./benchmarking.md) – measuring performance with `#[bench]`
- [Build System (UMS)](./build.md) – project configuration and the `prismio test` command
- [Diagnostics](./diagnostics.md) – understanding test failure messages
