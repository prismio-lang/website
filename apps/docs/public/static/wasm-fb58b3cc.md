# WebAssembly

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The target and API described here reflect the current design direction.

Prismio supports compiling to **WebAssembly (WASM)**, allowing you to run native-performance Prismio code in the browser, in Node.js, and in any WASM runtime. LLVM's excellent WebAssembly backend powers this capability.

---

## Overview

WebAssembly is a portable binary format that runs at near-native speed in all modern web browsers and many server environments. Compiling Prismio to WASM allows you to:

- **Ship performance-critical web features** without JavaScript's overhead
- **Reuse** existing Prismio code in web applications
- **Run Prismio** in serverless functions, edge computing, and plugin systems
- **Target any WASM runtime**: browsers, Node.js, Deno, Wasmtime, WasmEdge, etc.

```
┌──────────────┐   ums build --target wasm32   ┌──────────────┐
│  Prismio     │  ────────────────────────────► │  .wasm file  │
│  source      │                                │  (binary)    │
└──────────────┘                                └──────────────┘
                                                      │
                    ┌─────────────────────────────────┼──────────┐
                    ▼                                 ▼          ▼
              ┌──────────┐                    ┌──────────┐  ┌──────────┐
              │ Browser  │                    │  Node.js │  │ Wasmtime │
              └──────────┘                    └──────────┘  └──────────┘
```

---

## Target: `wasm32-unknown-unknown`

The primary WASM target is `wasm32-unknown-unknown` — a bare-metal WASM environment with no assumed host environment (no OS, no libc). This target is suitable for:

- Browser usage via JavaScript
- Embedding in any host that provides imports manually

### Configuring the Target

```toml
# ums.toml
[package]
name = "my-wasm-lib"
version = "0.1.0"
type = "wasm"

[wasm]
target = "wasm32-unknown-unknown"
# Optimize for size by default (browsers care about download size)
opt-level = "s"
# Strip debug info from release builds
strip = true
```

### Building

```bash
# Build for WASM
ums build --target wasm32-unknown-unknown --release

# Output: target/wasm32/release/my_wasm_lib.wasm
```

---

## wasm-bindgen-like Interface

Prismio provides a `wasm.bindgen`-inspired attribute system for exposing Prismio functions to JavaScript. This automatically generates the JavaScript glue code needed to call WASM from JS.

### Exposing Functions

```prismio
import wasm.bindgen.*

// Mark functions for export to JavaScript
#[wasm_export]
fn add(a: Int32, b: Int32) -> Int32 {
    return a + b
}

#[wasm_export]
fn fibonacci(n: UInt32) -> UInt64 {
    if n <= 1 { return n as UInt64 }
    let mut a: UInt64 = 0
    let mut b: UInt64 = 1
    for _ in 2..=n {
        let tmp = a + b
        a = b
        b = tmp
    }
    return b
}

#[wasm_export]
fn greet(name: WasmStr) -> WasmStr {
    return "Hello, {name}! Greetings from Prismio WASM."
}

#[wasm_export]
fn process_bytes(data: WasmBuffer) -> WasmBuffer {
    // Process binary data
    let result = data.map(|b| b ^ 0xFF)
    return WasmBuffer.from(result)
}
```

### Importing from JavaScript

```prismio
import wasm.bindgen.*

// Call a JavaScript function from Prismio WASM
#[wasm_import(module = "env")]
extern fn jsLog(msg: WasmStr)

#[wasm_import(module = "env")]
extern fn jsRandom() -> Float64

#[wasm_import(module = "env")]
extern fn jsTimestamp() -> Float64

fn main() {
    let rnd = jsRandom()
    let ts = jsTimestamp()
    jsLog("Random: {rnd}, Timestamp: {ts}")
}
```

### Generated JavaScript Glue

The `ums build --wasm-bindgen` command generates a JavaScript wrapper:

```javascript
// Auto-generated: my_wasm_lib.js
// Do not edit manually

let wasm;
const imports = {};

imports.env = {
    jsLog: (ptr, len) => {
        const text = new TextDecoder().decode(
            new Uint8Array(wasm.memory.buffer, ptr, len)
        );
        console.log(text);
    },
    jsRandom: () => Math.random(),
    jsTimestamp: () => Date.now(),
};

export async function initWasm(wasmUrl) {
    const response = await fetch(wasmUrl);
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, imports);
    wasm = instance.exports;
    return wasm;
}

export function add(a, b) { return wasm.add(a, b); }
export function fibonacci(n) { return Number(wasm.fibonacci(n)); }
export function greet(name) {
    // Encode string to WASM memory, call, decode result
    // ... (glue code handles memory management)
}
```

---

## Browser Usage

### Loading WASM in HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Prismio WASM Demo</title>
</head>
<body>
    <h1>Prismio WebAssembly</h1>
    <button id="runBtn">Run Fibonacci(30)</button>
    <p id="result">Result: —</p>

    <script type="module">
        import { initWasm, fibonacci, greet } from './my_wasm_lib.js';

        const wasm = await initWasm('./my_wasm_lib.wasm');

        document.getElementById('runBtn').addEventListener('click', () => {
            const start = performance.now();
            const result = fibonacci(30);
            const elapsed = (performance.now() - start).toFixed(3);
            document.getElementById('result').textContent =
                `fibonacci(30) = ${result} (computed in ${elapsed}ms)`;
        });

        const message = greet("Web Developer");
        console.log(message);
    </script>
</body>
</html>
```

### Using with a Bundler (Vite / Webpack)

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    assetsInclude: ['**/*.wasm'],
    optimizeDeps: {
        exclude: ['my_wasm_lib']
    }
});
```

```javascript
// app.js — Using with Vite
import init, { add, fibonacci, greet } from './my_wasm_lib/my_wasm_lib.js';

// Initialize the WASM module (loads and compiles the .wasm file)
await init();

console.log(add(5, 7));           // 12
console.log(fibonacci(20));       // 6765
console.log(greet("Vite User"));  // "Hello, Vite User! Greetings from Prismio WASM."
```

### Using with React

```jsx
// usePrismioWasm.js
import { useEffect, useState } from 'react';
import init, * as WasmLib from './my_wasm_lib.js';

export function usePrismioWasm() {
    const [wasm, setWasm] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        init().then(() => {
            setWasm(WasmLib);
            setLoading(false);
        });
    }, []);

    return { wasm, loading };
}

// FibCalculator.jsx
import { useState } from 'react';
import { usePrismioWasm } from './usePrismioWasm';

export function FibCalculator() {
    const { wasm, loading } = usePrismioWasm();
    const [n, setN] = useState(10);
    const [result, setResult] = useState(null);

    if (loading) return <p>Loading WASM...</p>;

    return (
        <div>
            <input
                type="number"
                value={n}
                onChange={e => setN(Number(e.target.value))}
            />
            <button onClick={() => setResult(wasm.fibonacci(n))}>
                Compute
            </button>
            {result !== null && <p>fibonacci({n}) = {result.toString()}</p>}
        </div>
    );
}
```

---

## Node.js Usage

Prismio WASM modules run in Node.js using the built-in `WebAssembly` API:

```javascript
// node-usage.mjs
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, 'my_wasm_lib.wasm');

// Load and instantiate the WASM module
const wasmBytes = await readFile(wasmPath);
const { instance } = await WebAssembly.instantiate(wasmBytes, {
    env: {
        jsLog: (ptr, len) => {
            // Access WASM memory to read the string
            const memory = instance.exports.memory;
            const text = new TextDecoder().decode(
                new Uint8Array(memory.buffer, ptr, len)
            );
            console.log('[WASM]:', text);
        }
    }
});

const { add, fibonacci } = instance.exports;

console.log(`add(100, 200) = ${add(100, 200)}`);
console.log(`fibonacci(40) = ${fibonacci(40)}`);

// Benchmarking
const iterations = 1000;
const start = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    fibonacci(35);
}
const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
console.log(`${iterations}× fibonacci(35): ${elapsed.toFixed(2)}ms total`);
console.log(`Average: ${(elapsed / iterations).toFixed(4)}ms per call`);
```

### Using the Generated Wrapper in Node.js

```javascript
// Using the auto-generated JS wrapper (CommonJS)
const { initWasm, fibonacci, greet } = require('./my_wasm_lib_node.js');

async function main() {
    await initWasm('./my_wasm_lib.wasm');
    
    console.log(fibonacci(30));
    console.log(greet("Node.js User"));
}

main().catch(console.error);
```

### Deno Usage

```typescript
// deno-usage.ts
const wasmUrl = new URL('./my_wasm_lib.wasm', import.meta.url);
const wasmBytes = await Deno.readFile(wasmUrl.pathname);

const { instance } = await WebAssembly.instantiate(wasmBytes, {
    env: {
        jsLog: (ptr: number, len: number) => {
            const memory = instance.exports.memory as WebAssembly.Memory;
            const text = new TextDecoder().decode(
                new Uint8Array(memory.buffer, ptr, len)
            );
            console.log('[WASM]:', text);
        }
    }
});

const { add, fibonacci } = instance.exports as {
    add: (a: number, b: number) => number;
    fibonacci: (n: number) => bigint;
};

console.log(`add(42, 58) = ${add(42, 58)}`);
console.log(`fibonacci(25) = ${fibonacci(25)}`);
```

---

## Performance Characteristics

### WASM vs Native Performance

| Benchmark | Native | WASM (V8) | WASM (Wasmtime) |
|-----------|--------|-----------|-----------------|
| Integer arithmetic | 1.00× | ~0.95× | ~0.98× |
| Float math | 1.00× | ~0.90× | ~0.95× |
| Memory-intensive | 1.00× | ~0.70× | ~0.80× |
| String processing | 1.00× | ~0.65× | ~0.75× |
| SIMD operations | 1.00× | ~0.85×† | ~0.88×† |

*† Requires WASM SIMD extension (widely supported)*

### Performance Tips for WASM

**Minimize JS↔WASM crossing frequency**

Every call across the JS/WASM boundary has overhead. Batch operations:

```prismio
// ❌ Avoid: many small calls from JS
#[wasm_export] fn process_one(x: Float64) -> Float64 { ... }

// ✅ Prefer: one call that processes a batch
#[wasm_export]
fn process_batch(data: WasmBuffer) -> WasmBuffer {
    return data.map(|x| expensive_computation(x as Float64))
        |> WasmBuffer.from
}
```

**Use WASM linear memory efficiently**

```prismio
// Allocate a reusable scratch buffer (export to JS)
let mut SCRATCH_BUF: [UInt8; 65536] = [0; 65536]

#[wasm_export]
fn getScratchPtr() -> *UInt8 = SCRATCH_BUF.rawPtr()

#[wasm_export]
fn getScratchLen() -> UInt32 = 65536
```

**Enable WASM optimizations in UMS**

```toml
[profile.wasm-release]
opt-level = "s"          # Optimize for size
lto = true               # Link-time optimization
strip = true             # Remove debug symbols
wasm-opt = true          # Run wasm-opt post-build
wasm-opt-level = 4       # wasm-opt optimization level
```

**Use WASM SIMD when available**

```prismio
import wasm.simd.*

#[wasm_export]
fn dot_product(a: WasmBuffer, b: WasmBuffer) -> Float32 {
    // Uses WASM SIMD v128 instructions when available
    return SIMD.f32x4DotProduct(a, b)
}
```

---

## WASM-Specific Limitations

| Limitation | Explanation |
|-----------|-------------|
| No threads (base WASM) | Thread support requires WASM threads extension + SharedArrayBuffer |
| No file system | Must use JS imports or WASI for file I/O |
| No networking | Must use JS imports for HTTP/WebSocket |
| 32-bit address space | Max 4GB linear memory (wasm32) |
| No native exception handling | Exceptions use workarounds (slower) |
| No dynamic linking | All code compiled into one .wasm file |

### WASI Target

For server-side WASM with system access (file I/O, networking), use the WASI target:

```bash
ums build --target wasm32-wasi --release
# Run with: wasmtime ./target/wasm32-wasi/release/my_app.wasm
```

```prismio
// WASI programs can use file I/O normally
fn main() {
    println("Hello from Prismio WASI!")
    let content = File.readString("input.txt")
    println("File contents: {content}")
}
```

---

## Inspecting WASM Output

```bash
# View exports and imports
wasm-objdump -x my_wasm_lib.wasm

# Disassemble to WAT (WebAssembly Text Format)
wasm2wat my_wasm_lib.wasm -o my_wasm_lib.wat

# Analyze size breakdown
twiggy top my_wasm_lib.wasm

# Run wasm-opt manually for additional size/speed improvements
wasm-opt -Oz my_wasm_lib.wasm -o my_wasm_lib.opt.wasm
```

---

## See Also

- [WebAssembly Target](/platform/wasm) — Platform-specific WASM compilation details
- [FFI Basics](/interop/ffi) — Core FFI concepts used in WASM bindings
- [Python Interoperability](/interop/python) — Another embedding use case
- [Performance Guide](/advanced/performance) — General performance optimization techniques
