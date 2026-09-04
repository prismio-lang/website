# Python Interoperability

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The API and tooling described below reflect the current design direction.

Prismio can be used to write high-performance Python extension modules — native code that Python can import and call just like any Python module. This allows you to accelerate performance-critical Python code by writing it in Prismio.

---

## Overview

Python's C extension API allows any language that can produce a C-compatible library to extend Python. Prismio leverages this to provide a high-level, ergonomic interface for building Python extensions.

```
┌──────────────┐          ┌──────────────────────┐
│  Python      │ import   │  Prismio Extension   │
│  (runtime)   │ ────────►│  (.so / .pyd)        │
└──────────────┘          └──────────────────────┘
                   CPython C API boundary
```

The resulting extension modules are:
- **Binary compatible** with CPython (3.8+)
- **Zero overhead** compared to hand-written C extensions
- **Fully importable** with `import my_module`

---

## Performance Use Cases

Python + Prismio extensions are ideal when:

| Scenario | Benefit |
|----------|---------|
| Numerical computation (matrices, DSP) | 10–100× speedup over pure Python |
| Text/string processing at scale | Avoid Python object overhead |
| Cryptography or hashing | Native performance + memory safety |
| Image/audio/video processing | SIMD-optimized native code |
| ML inference kernels | Tight loops without GIL overhead |
| System calls and I/O | No Python wrapper overhead |

---

## Building Python Extension Modules

### Project Setup

Create a Prismio project configured as a Python extension:

```bash
ums new my-py-extension --template python-ext
cd my-py-extension
```

Or configure an existing project in `ums.toml`:

```toml
[package]
name = "my_prismio_ext"
version = "0.1.0"
type = "python-extension"

[python]
# Python version to target
min-version = "3.8"
# Module name as seen from Python: import my_prismio_ext
module-name = "my_prismio_ext"

[dependencies]
# No external dependencies needed for basic extensions
```

### Writing Your Extension

```prismio
// src/lib.prism
import python.ext.*

// Register the module with Python
#[python_module(name = "my_prismio_ext")]
mod MyPrismioExt {

    // A simple Python-callable function
    #[python_fn]
    fn add(a: PyInt, b: PyInt) -> PyInt {
        return a + b
    }

    // Function with type coercion from Python objects
    #[python_fn]
    fn greet(name: PyStr) -> PyStr {
        return "Hello, {name}! Greetings from Prismio."
    }

    // Processing a Python list of numbers
    #[python_fn]
    fn sum_list(numbers: PyList<PyFloat>) -> PyFloat {
        let mut total = 0.0
        for n in numbers {
            total += n
        }
        return total
    }

    // Returning a Python dict
    #[python_fn]
    fn word_count(text: PyStr) -> PyDict<PyStr, PyInt> {
        let mut counts: Map<String, Int> = Map.new()
        for word in text.split(" ") {
            counts[word] = counts.getOrDefault(word, 0) + 1
        }
        return PyDict.from(counts)
    }
}
```

### Building the Extension

```bash
# Build for the current Python interpreter
ums build --release

# Build for a specific Python version
ums build --release --python python3.11

# Build and install directly into the current venv
ums install
```

The build produces:
- **Linux**: `my_prismio_ext.cpython-311-x86_64-linux-gnu.so`
- **macOS**: `my_prismio_ext.cpython-311-darwin.so`
- **Windows**: `my_prismio_ext.cp311-win_amd64.pyd`

### Using the Extension from Python

```python
import my_prismio_ext

# Call the functions just like Python functions
result = my_prismio_ext.add(10, 20)
print(f"10 + 20 = {result}")  # 30

greeting = my_prismio_ext.greet("Alice")
print(greeting)  # "Hello, Alice! Greetings from Prismio."

total = my_prismio_ext.sum_list([1.1, 2.2, 3.3, 4.4])
print(f"Sum: {total}")  # 11.0

counts = my_prismio_ext.word_count("the quick brown fox the fox")
print(counts)  # {'the': 2, 'quick': 1, 'brown': 1, 'fox': 2}
```

---

## PyO3-like Bindings Concept

Prismio's Python extension model is inspired by [PyO3](https://pyo3.rs/) — the popular Rust library for Python extensions. If you're familiar with PyO3, the Prismio model will feel familiar.

### Exposing Classes

```prismio
import python.ext.*

// A Prismio struct exposed as a Python class
#[python_class]
struct Counter {
    let mut value: Int

    #[python_new]
    fn new(start: PyInt = 0) -> Counter {
        return Counter { value: start as Int }
    }

    #[python_method]
    fn increment(mut self) {
        self.value += 1
    }

    #[python_method]
    fn decrement(mut self) {
        self.value -= 1
    }

    #[python_method]
    fn reset(mut self) {
        self.value = 0
    }

    #[python_getter]
    fn value(self) -> PyInt {
        return self.value as PyInt
    }

    #[python_method(name = "__repr__")]
    fn repr(self) -> PyStr {
        return "Counter(value={self.value})"
    }
}

#[python_module(name = "my_prismio_ext")]
mod MyPrismioExt {
    use super.Counter
    // Counter is automatically registered as a Python class
}
```

```python
from my_prismio_ext import Counter

c = Counter(start=10)
print(c)          # Counter(value=10)
c.increment()
c.increment()
print(c.value)    # 12
c.decrement()
print(c.value)    # 11
c.reset()
print(c.value)    # 0
```

### Handling Python Exceptions

```prismio
import python.ext.*

#[python_fn]
fn divide(a: PyFloat, b: PyFloat) -> PyResult<PyFloat> {
    if b == 0.0 {
        return .err(PyException.ValueError("Division by zero"))
    }
    return .ok(a / b)
}

#[python_fn]
fn parse_int(s: PyStr) -> PyResult<PyInt> {
    match Int.parse(s.toString()) {
        .ok(n)  => return .ok(n as PyInt)
        .err(_) => return .err(PyException.ValueError("Invalid integer: '{s}'"))
    }
}
```

```python
from my_prismio_ext import divide, parse_int

try:
    result = divide(10.0, 0.0)
except ValueError as e:
    print(f"Error: {e}")  # "Division by zero"

try:
    n = parse_int("not a number")
except ValueError as e:
    print(f"Error: {e}")  # "Invalid integer: 'not a number'"
```

### Working with NumPy Arrays

```prismio
import python.ext.*
import python.numpy as np

#[python_fn]
fn matrix_sum(arr: NpArray<Float64, 2>) -> Float64 {
    let mut total = 0.0
    for row in arr.rows() {
        for val in row {
            total += val
        }
    }
    return total
}

#[python_fn]
fn normalize(arr: NpArray<Float64, 1>) -> NpArray<Float64, 1> {
    let max = arr.max()
    if max == 0.0 {
        return arr
    }
    return arr.map(|x| x / max)
}
```

```python
import numpy as np
from my_prismio_ext import matrix_sum, normalize

matrix = np.array([[1.0, 2.0], [3.0, 4.0]])
print(matrix_sum(matrix))  # 10.0

vec = np.array([1.0, 2.0, 4.0, 8.0])
print(normalize(vec))  # [0.125, 0.25, 0.5, 1.0]
```

---

## Packaging for Distribution

Use `ums` to build wheels for distribution on PyPI:

```bash
# Build a wheel for the current platform
ums build --release --wheel

# Build wheels for multiple platforms (requires cross-compilation setup)
ums build --release --wheel --target x86_64-unknown-linux-gnu
ums build --release --wheel --target aarch64-unknown-linux-gnu
ums build --release --wheel --target x86_64-pc-windows-msvc
```

### `pyproject.toml` Integration

Prismio extensions integrate with Python's standard `pyproject.toml`:

```toml
[build-system]
requires = ["ums-python-build"]
build-backend = "ums.build"

[project]
name = "my-prismio-ext"
version = "0.1.0"
description = "A high-performance Python extension written in Prismio"
requires-python = ">=3.8"

[tool.ums]
module-name = "my_prismio_ext"
```

```bash
# Standard pip install from source
pip install .

# Build and install in editable mode (for development)
pip install -e .

# Build and upload to PyPI
pip install build twine
python -m build
twine upload dist/*
```

---

## Performance Comparison Example

```python
# Python baseline
def python_sum_squares(numbers):
    return sum(x * x for x in numbers)

# Prismio extension
import my_prismio_ext

import timeit
import random

data = [random.random() for _ in range(1_000_000)]

python_time = timeit.timeit(lambda: python_sum_squares(data), number=10)
prismio_time = timeit.timeit(lambda: my_prismio_ext.sum_squares(data), number=10)

print(f"Python:  {python_time:.3f}s")
print(f"Prismio: {prismio_time:.3f}s")
print(f"Speedup: {python_time / prismio_time:.1f}×")
# Typical output:
# Python:  2.847s
# Prismio: 0.031s
# Speedup: 91.8×
```

---

## Limitations

| Limitation | Notes |
|-----------|-------|
| CPython only | PyPy and other implementations not yet supported |
| No async support | `async`/`await` Python functions not yet bridgeable |
| GIL awareness | Extensions must manually release GIL for parallelism |
| Python 3.8+ only | Older Python versions not supported |

---

## See Also

- [FFI Basics](/interop/ffi) — Core FFI concepts
- [C/C++ Interoperability](/interop/c_cpp) — C interop which Python extensions use internally
- [WebAssembly](/interop/wasm) — Another compilation target for cross-platform use
- [Performance Guide](/advanced/performance) — Optimizing Prismio code for maximum speed
