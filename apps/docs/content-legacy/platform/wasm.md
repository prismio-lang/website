# WebAssembly Target

> 🚧 **Coming Soon** – WebAssembly support is planned for a future release of Prismio.

## Overview

WebAssembly (WASM) is a binary instruction format that runs in web browsers and server-side runtimes. Prismio can compile to WASM, bringing near-native performance to web applications and enabling Prismio code to run in environments like browsers, Node.js, Deno, and WASI-compatible runtimes.

---

## Target Triples

| Target | Description |
|--------|-------------|
| `wasm32-unknown-unknown` | Bare WASM, no OS |
| `wasm32-wasi` | WASM with WASI system interface |
| `wasm32-unknown-emscripten` | WASM via Emscripten (planned) |

---

## Building for WASM

```bash
# Bare WASM (no system calls)
prismio build --target wasm32-unknown-unknown --release

# WASI (filesystem, network via WASI syscalls)
prismio build --target wasm32-wasi --release
```

The output is a `.wasm` file that can be loaded in any WASM runtime.

---

## Memory Model in WASM

WASM uses a linear memory model — a flat array of bytes. Key differences from native:

| Feature | Native | WASM |
|---------|--------|------|
| Memory | Virtual address space | Linear memory (fixed array) |
| Pointers | 64-bit | 32-bit (wasm32) |
| Threads | OS threads | SharedArrayBuffer + workers |
| Stack | OS-managed | WASM-managed |

Prismio's ownership model maps cleanly to WASM's memory model — owned values live in linear memory, stack values in the WASM stack.

---

## Import / Export Mechanism

WASM modules communicate with the host (JavaScript/Node.js) through **imports** and **exports**.

### Exporting Prismio Functions

```prismio
// Mark functions for export to WASM host
#[wasm_export]
pub fn add(a: Int32, b: Int32) -> Int32 {
    a + b
}

#[wasm_export]
pub fn processArray(ptr: *mut Float32, len: Int32) {
    // operates on WASM linear memory
}
```

### Importing Host Functions

```prismio
// Call JavaScript functions from Prismio
extern fn consoleLog(ptr: *const Int8, len: Int32);
extern fn random() -> Float64;

fn logMessage(msg: String) {
    unsafe { consoleLog(msg.asPtr(), msg.length() as Int32) }
}
```

---

## JavaScript Interoperability

### Loading the WASM Module (Browser)

```javascript
// Load and instantiate the WASM module
const response = await fetch('myapp.wasm');
const { instance } = await WebAssembly.instantiateStreaming(response, {
    env: {
        console_log: (ptr, len) => {
            const bytes = new Uint8Array(instance.exports.memory.buffer, ptr, len);
            console.log(new TextDecoder().decode(bytes));
        }
    }
});

// Call exported Prismio functions
const result = instance.exports.add(3, 4);
console.log(result);  // 7
```

### Loading in Node.js

```javascript
const fs = require('fs');
const wasmBuffer = fs.readFileSync('myapp.wasm');
const { instance } = await WebAssembly.instantiate(wasmBuffer, importObject);

const { add, processArray, memory } = instance.exports;
console.log(add(10, 20));  // 30
```

---

## Planned: wasm-bindgen-like Interface

> 🚧 **Coming Soon** – A high-level WASM binding generator is planned.

Manual memory management for strings and arrays between WASM and JS is tedious. Prismio will provide a binding generator similar to wasm-bindgen:

```prismio
// Planned high-level WASM bindings
#[wasm_bindgen]
pub fn greet(name: String) -> String {
    "Hello, ${name}!".toString()
}

#[wasm_bindgen]
pub fn sortNumbers(numbers: [Float64]) -> [Float64] {
    let mut sorted = numbers
    sorted.sort()
    sorted
}
```

```javascript
// Generated JS wrapper handles memory automatically
import init, { greet, sortNumbers } from './myapp.js';

await init();
console.log(greet("Prismio"));  // "Hello, Prismio!"
console.log(sortNumbers([3.0, 1.0, 2.0]));  // [1.0, 2.0, 3.0]
```

---

## WASI (WebAssembly System Interface)

WASI provides a standardized system interface for WASM modules running outside browsers:

```bash
# Build with WASI support
prismio build --target wasm32-wasi --release

# Run with a WASI runtime (e.g., wasmtime)
wasmtime myapp.wasm

# Run with wasmer
wasmer myapp.wasm
```

WASI-enabled Prismio programs can:
- Read/write files (with capability-based permissions)
- Read environment variables
- Accept command-line arguments
- Use stdin/stdout/stderr

---

## Performance Tips

1. **Use `--release`** — optimization makes a huge difference for WASM
2. **Minimize WASM-JS boundary crossings** — each call has overhead
3. **Batch data operations** — pass arrays rather than individual values
4. **Use WASM SIMD** — (planned) vectorized operations via WASM SIMD proposal
5. **Minimize binary size** — use `-Oz` for size-optimized builds

```bash
# Size-optimized WASM build
prismio build --target wasm32-unknown-unknown --opt-level z --release

# Further optimize with wasm-opt (from Binaryen)
wasm-opt -Oz myapp.wasm -o myapp.opt.wasm
```

---

## Binary Size

| Build type | Typical size |
|------------|-------------|
| Debug | 500KB – 2MB |
| Release (-O2) | 100KB – 500KB |
| Release (-Oz) | 50KB – 200KB |
| Release + wasm-opt | 30KB – 150KB |

---

## Threads in WASM

> 🚧 **Coming Soon** – WASM threads require `SharedArrayBuffer`.

WASM threads use Web Workers + SharedArrayBuffer. The browser must be served with specific CORS headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

See also: [Linux Target](./linux.md), [Interoperability: WASM](../interop/wasm.md), [Performance Guide](../guides/performance.md)
