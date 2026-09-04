# Benchmarking

> 🚧 **Coming Soon** – The built-in benchmarking framework is planned but not yet implemented. This page describes the intended design and API for reference.

Prismio has a **built-in benchmarking framework** that lets you measure the performance of your code with statistical rigor. Benchmarks are declared with the `#[bench]` annotation and run via `prismio bench`. The framework handles warm-up iterations, outlier detection, and formatted result output automatically.

---

## Writing a Benchmark

A benchmark function is annotated with `#[bench]` and receives a `Bencher` parameter. Inside the function, you call `b.iter { ... }` with the code you want to measure. The framework runs the closure repeatedly and measures how long each iteration takes.

```prismio
import prismio.bench.Bencher

fn sort(items: [Int]) -> [Int] {
    // ... sorting implementation
}

#[bench]
fn bench_sort_1000(b: Bencher) {
    let data = (0..1000).toList().reversed()
    b.iter {
        sort(data.clone())
    }
}
```

Run the benchmarks:

```bash
prismio bench
```

---

## Running Benchmarks

### Run All Benchmarks

```bash
prismio bench
```

### Filter Benchmarks by Name

```bash
prismio bench --filter sort
prismio bench --filter "bench_hash"
```

### Set the Number of Iterations

The framework auto-calibrates iteration count, but you can override it:

```bash
prismio bench --iterations 10000
```

### Set the Sample Count

Control how many timing samples to collect:

```bash
prismio bench --samples 100
```

### Warm-Up Duration

Set the warm-up duration before measurements begin:

```bash
prismio bench --warm-up 3s
```

---

## The `Bencher` API

The `Bencher` object passed to every `#[bench]` function provides methods to control the benchmark loop.

### `b.iter { ... }`

The primary measurement method. Runs the closure as many times as needed to collect statistically stable results.

```prismio
#[bench]
fn bench_fibonacci(b: Bencher) {
    b.iter {
        fibonacci(30)
    }
}
```

### `b.iterBatched { ... }`

For benchmarks where setup cost should not be included in the measurement, use `iterBatched` to prepare inputs for each batch:

```prismio
#[bench]
fn bench_sort_with_setup(b: Bencher) {
    b.iterBatched(
        setup: { (0..1000).toList().shuffled() },
        routine: fn(data) { sort(data) }
    )
}
```

### `b.bytes(n)`

Report throughput in bytes per second alongside timing results. Useful for I/O, hashing, or serialization benchmarks:

```prismio
#[bench]
fn bench_hash(b: Bencher) {
    let data = ByteArray.random(4096)
    b.bytes(data.len())
    b.iter {
        sha256(data)
    }
}
```

### `b.elements(n)`

Report throughput in elements per second:

```prismio
#[bench]
fn bench_map(b: Bencher) {
    let list = (1..10000).toList()
    b.elements(list.len())
    b.iter {
        list.map(fn(x) { x * 2 })
    }
}
```

---

## Interpreting Benchmark Results

### Example Output

```
running 3 benchmarks
bench bench_fibonacci_30      ... bench:       5,432 ns/iter (± 84)
bench bench_sort_1000         ... bench:      21,301 ns/iter (± 412)  [1.05 MB/s]
bench bench_hash_sha256_4k    ... bench:       1,201 ns/iter (± 19)   [3.40 GB/s]

benchmark result: ok. 3 benches in 4.23s
```

| Column         | Description                                                          |
|----------------|----------------------------------------------------------------------|
| `ns/iter`      | Average nanoseconds per iteration                                    |
| `(± N)`        | Standard deviation across all samples                                |
| `[X MB/s]`     | Throughput in bytes per second (only shown when `b.bytes()` is set) |

### Statistical Details

Run with `--verbose` to see full statistical breakdowns:

```bash
prismio bench --verbose
```

```
bench bench_sort_1000
  samples:     100
  mean:        21,301 ns
  median:      21,180 ns
  std dev:     412 ns
  min:         20,899 ns
  max:         23,441 ns
  outliers:    3 detected, removed from analysis
```

---

## Comparing Benchmarks

### Baseline Mode

Save the current results as a baseline:

```bash
prismio bench --save-baseline main
```

Later, compare against the saved baseline:

```bash
prismio bench --baseline main
```

Output:

```
bench bench_sort_1000
  before:  21,301 ns/iter (± 412)
  after:   19,880 ns/iter (± 389)
  change:  -6.67% (improved ✅)
```

This is useful for measuring the performance impact of a code change.

---

## Micro vs. Macro Benchmarks

### Micro Benchmarks

Micro benchmarks measure the performance of a **single, isolated function**. They are best for:

- Comparing algorithm implementations
- Measuring the overhead of a data structure operation
- Checking that an optimization actually made a difference

```prismio
#[bench]
fn bench_binary_search(b: Bencher) {
    let sorted = (0..10000).toList()
    b.iter {
        binarySearch(sorted, 7777)
    }
}

#[bench]
fn bench_linear_search(b: Bencher) {
    let data = (0..10000).toList()
    b.iter {
        linearSearch(data, 7777)
    }
}
```

### Macro Benchmarks

Macro benchmarks (also called integration benchmarks or end-to-end benchmarks) measure the performance of **larger workflows**:

```prismio
#[bench]
fn bench_full_pipeline(b: Bencher) {
    b.iter {
        let input = loadFixture("large_dataset.json")
        let parsed = parseJson(input)
        let filtered = parsed.filter(fn(x) { x.score > 50 })
        let output = serializeCsv(filtered)
        // Result is consumed to prevent dead-code elimination
        blackBox(output)
    }
}
```

> **Tip:** Use `blackBox(value)` to prevent the compiler from optimizing away computations whose results are not used. Without it, the optimizer may eliminate your entire benchmark body.

### Choosing the Right Level

| Use Case                            | Benchmark Type |
|-------------------------------------|----------------|
| Compare two sort algorithms         | Micro          |
| Measure hash function throughput    | Micro          |
| Profile request handling in a server| Macro          |
| Measure end-to-end serialization    | Macro          |
| Both, for a complete picture        | Both ✅        |

---

## Preventing Optimizer Interference

The Prismio compiler is free to eliminate computations whose results are never used. In benchmarks, this can cause the optimizer to remove the very code you are trying to measure, producing misleadingly fast results.

Use `blackBox` from the standard library to prevent this:

```prismio
import prismio.bench.blackBox

#[bench]
fn bench_add(b: Bencher) {
    let a = blackBox(42)
    let c_val = blackBox(17)
    b.iter {
        blackBox(a + c_val)
    }
}
```

`blackBox` is a no-op at runtime but tells the compiler to treat the value as opaque, preventing dead-code and constant-folding optimizations from interfering.

---

## Benchmark Organization

By convention, benchmarks live alongside tests in files named `<module>_bench.prism`:

```
src/
├── math.prism
├── math_test.prism
├── math_bench.prism
└── strings.prism
```

For small modules, benchmarks can be placed in the same file as the code:

```prismio
fn fibonacci(n: Int) -> Int {
    if n <= 1 { return n }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

#[bench]
fn bench_fibonacci_20(b: Bencher) {
    b.iter { fibonacci(20) }
}

#[bench]
fn bench_fibonacci_30(b: Bencher) {
    b.iter { fibonacci(30) }
}
```

---

## Output Formats

### Default (Human-Readable)

```bash
prismio bench
```

### JSON

For integration with external tools or CI dashboards:

```bash
prismio bench --format json > results.json
```

```json
{
  "benchmarks": [
    {
      "name": "bench_sort_1000",
      "mean_ns": 21301,
      "std_dev_ns": 412,
      "throughput_bytes_per_sec": null
    }
  ]
}
```

### CSV

```bash
prismio bench --format csv > results.csv
```

---

## CI Integration

Track performance regressions in CI by comparing against a saved baseline:

```yaml
# GitHub Actions example
jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Install Prismio
        run: curl -sSf https://get.prismio.dev | sh
      - name: Restore baseline
        run: prismio bench --load-baseline main || true
      - name: Run benchmarks
        run: prismio bench --baseline main --fail-on-regression 10%
```

`--fail-on-regression 10%` causes the CI step to fail if any benchmark regresses by more than 10%.

---

## See Also

- [Testing](./testing.md) – writing correctness tests with `#[test]`
- [Build System (UMS)](./build.md) – project configuration and build profiles
- [Compiler Architecture](./compiler.md) – how optimization passes affect performance
