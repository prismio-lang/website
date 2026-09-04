# C / C++ Interoperability

> 🚧 **Coming Soon** – This feature is planned but not yet implemented. The syntax and tooling described below reflect the current design and may change before the 1.0 release.

Prismio is designed for seamless interoperability with the C and C++ ecosystems. Since Prismio compiles to native code via LLVM, it can link against any C-compatible library with zero overhead.

---

## Overview

C interoperability in Prismio works through:
1. **`extern "C"` declarations** — tell Prismio about C function signatures
2. **`#[link]` attributes** — tell the linker which libraries to include
3. **`#[repr(C)]` structs** — match C struct memory layout exactly
4. **`#[export]` + `extern "C"`** — expose Prismio functions to C

C++ requires an extra step: C++ symbols are **mangled**, so you must expose a `extern "C"` interface from C++ (or use header wrappers) to call C++ from Prismio.

---

## Calling C Libraries

### Basic Example: Using `libc`

```prismio
import interop.c

#[link(name = "c")]
extern "C" {
    fn getpid() -> Int32
    fn getenv(name: *Char) -> *Char
    fn exit(code: Int32) -> Void
}

fn main() {
    let pid = unsafe { getpid() }
    println("Process ID: {pid}")
    
    let home = unsafe { getenv("HOME".toCString()) }
    if home != null {
        println("Home directory: {String.fromCString(home)}")
    }
}
```

### Using POSIX APIs

```prismio
#[link(name = "c")]
extern "C" {
    fn open(path: *Char, flags: Int32, mode: UInt32) -> Int32
    fn read(fd: Int32, buf: *Void, count: UInt) -> Int
    fn write(fd: Int32, buf: *Void, count: UInt) -> Int
    fn close(fd: Int32) -> Int32
}

let O_RDONLY: Int32 = 0
let O_WRONLY: Int32 = 1
let O_CREAT:  Int32 = 64

fn readFileRaw(path: String) -> Result<[UInt8], String> {
    let fd = unsafe { open(path.toCString(), O_RDONLY, 0) }
    if fd < 0 {
        return .err("Failed to open file: {path}")
    }
    
    let buf: [UInt8] = Array.withCapacity(4096)
    let nRead = unsafe { read(fd, buf.rawPtr(), 4096) }
    unsafe { close(fd) }
    
    if nRead < 0 {
        return .err("Read error")
    }
    return .ok(buf.slice(0, nRead as Int))
}
```

### Using a Third-Party C Library (Example: `libcurl`)

```prismio
#[link(name = "curl")]
extern "C" {
    fn curl_easy_init() -> *Void
    fn curl_easy_setopt(handle: *Void, option: Int32, value: *Void) -> Int32
    fn curl_easy_perform(handle: *Void) -> Int32
    fn curl_easy_cleanup(handle: *Void)
    fn curl_easy_strerror(code: Int32) -> *Char
}

let CURLOPT_URL:       Int32 = 10002
let CURLOPT_FOLLOWLOC: Int32 = 52
let CURLE_OK:          Int32 = 0

fn httpGet(url: String) -> Result<Void, String> {
    let handle = unsafe { curl_easy_init() }
    if handle == null {
        return .err("Failed to initialize curl")
    }
    
    unsafe {
        curl_easy_setopt(handle, CURLOPT_URL, url.toCString() as *Void)
        curl_easy_setopt(handle, CURLOPT_FOLLOWLOC, 1 as *Void)
        
        let code = curl_easy_perform(handle)
        curl_easy_cleanup(handle)
        
        if code != CURLE_OK {
            let msg = String.fromCString(curl_easy_strerror(code))
            return .err("curl error: {msg}")
        }
    }
    return .ok(())
}
```

---

## Exposing Prismio Functions to C

To call Prismio code from C, mark functions with `#[export]` and `extern "C"`:

### Prismio Side

```prismio
// math_lib.prism

#[export]
extern "C" fn prismio_add(a: Int32, b: Int32) -> Int32 {
    return a + b
}

#[export]
extern "C" fn prismio_fibonacci(n: Int32) -> Int64 {
    if n <= 1 {
        return n as Int64
    }
    let mut a: Int64 = 0
    let mut b: Int64 = 1
    for _ in 2..=n {
        let tmp = a + b
        a = b
        b = tmp
    }
    return b
}

#[export]
extern "C" fn prismio_string_length(s: *Char) -> UInt32 {
    let str = unsafe { String.fromCString(s) }
    return str.len() as UInt32
}
```

Build as a shared or static library:

```bash
# Build as shared library
prismio build --lib --output libmathlib.so math_lib.prism

# Build as static library
prismio build --lib --static --output libmathlib.a math_lib.prism
```

### C Side

```c
// main.c
#include <stdio.h>
#include <stdint.h>

// Declare Prismio-exported functions
extern int32_t prismio_add(int32_t a, int32_t b);
extern int64_t prismio_fibonacci(int32_t n);
extern uint32_t prismio_string_length(const char* s);

int main() {
    printf("add(10, 20) = %d\n", prismio_add(10, 20));
    printf("fibonacci(10) = %lld\n", prismio_fibonacci(10));
    printf("length of 'hello' = %u\n", prismio_string_length("hello"));
    return 0;
}
```

```bash
# Compile and link
gcc -o main main.c -L. -lmathlib -Wl,-rpath,.
./main
```

---

## Header Wrapping

For large C APIs, manually writing `extern "C"` declarations for every function is tedious. Prismio's build tool UMS supports automatic binding generation from C headers using the `bindgen` integration.

### Using `ums bindgen`

```bash
# Generate Prismio bindings from a C header
ums bindgen --header /usr/include/sqlite3.h --output src/bindings/sqlite3.prism
```

The generated file looks like:

```prismio
// Auto-generated by ums bindgen — do not edit manually
// Source: /usr/include/sqlite3.h

#[link(name = "sqlite3")]
extern "C" {
    fn sqlite3_open(filename: *Char, ppDb: **Void) -> Int32
    fn sqlite3_close(db: *Void) -> Int32
    fn sqlite3_exec(
        db: *Void,
        sql: *Char,
        callback: *fn(*Void, Int32, **Char, **Char) -> Int32,
        arg: *Void,
        errmsg: **Char
    ) -> Int32
    fn sqlite3_errmsg(db: *Void) -> *Char
    fn sqlite3_free(ptr: *Void)
    // ... (many more)
}

let SQLITE_OK:   Int32 = 0
let SQLITE_ERROR: Int32 = 1
let SQLITE_ROW:  Int32 = 100
let SQLITE_DONE: Int32 = 101
```

### Configuring Bindgen in `ums.toml`

```toml
[package]
name = "my-sqlite-wrapper"
version = "0.1.0"

[[bindgen]]
header = "/usr/include/sqlite3.h"
output = "src/bindings/sqlite3.prism"
link = "sqlite3"
# Optionally filter to specific functions/types:
allowlist-functions = ["sqlite3_open", "sqlite3_close", "sqlite3_exec"]
allowlist-types = ["sqlite3", "sqlite3_stmt"]
```

---

## C++ Interoperability

C++ interop is more complex than C because:

1. C++ uses **name mangling** (function names are encoded with type info)
2. C++ has **classes, templates, exceptions** with no direct C equivalent
3. C++ standard library types (`std::string`, `std::vector`) cannot be used directly

### Strategy: `extern "C"` Wrapper in C++

The standard approach is to expose a C API from C++:

```cpp
// mylib.hpp
#include <string>
#include <vector>

class DataProcessor {
public:
    DataProcessor();
    ~DataProcessor();
    std::string process(const std::string& input);
    std::vector<int> getResults();
};
```

```cpp
// mylib_c_api.cpp  — C wrapper around C++ class
#include "mylib.hpp"
#include <cstring>

extern "C" {
    // Opaque handle — hides C++ class from C/Prismio
    typedef void* DataProcessorHandle;

    DataProcessorHandle dp_create() {
        return new DataProcessor();
    }

    void dp_destroy(DataProcessorHandle h) {
        delete static_cast<DataProcessor*>(h);
    }

    // Caller must free the returned string
    char* dp_process(DataProcessorHandle h, const char* input) {
        auto* dp = static_cast<DataProcessor*>(h);
        std::string result = dp->process(std::string(input));
        char* out = new char[result.size() + 1];
        std::strcpy(out, result.c_str());
        return out;
    }

    void dp_free_string(char* s) {
        delete[] s;
    }
}
```

```prismio
// Prismio side — call the C wrapper
extern "C" {
    fn dp_create() -> *Void
    fn dp_destroy(h: *Void)
    fn dp_process(h: *Void, input: *Char) -> *Char
    fn dp_free_string(s: *Char)
}

struct DataProcessor {
    handle: *Void

    fn new() -> DataProcessor {
        let h = unsafe { dp_create() }
        return DataProcessor { handle: h }
    }

    fn process(self, input: String) -> String {
        let result = unsafe {
            let raw = dp_process(self.handle, input.toCString())
            let s = String.fromCString(raw)
            dp_free_string(raw)
            s
        }
        return result
    }
}

impl Drop for DataProcessor {
    fn drop(self) {
        unsafe { dp_destroy(self.handle) }
    }
}

fn main() {
    let dp = DataProcessor.new()
    let result = dp.process("hello world")
    println("Processed: {result}")
}
```

### C++ Name Mangling Reference

If you know the mangled symbol name, you can call C++ functions directly (not recommended):

```prismio
// NOT recommended — mangled names are compiler-specific and fragile
extern "C++" fn _ZN3foo3barEv() -> Void   // mangled name for foo::bar()
```

Use `nm` or `c++filt` to inspect mangled names:

```bash
nm -D libmylib.so | c++filt
```

---

## CMake Integration

For projects using CMake, you can build Prismio as a library and link it into a C/C++ project:

### `CMakeLists.txt`

```cmake
cmake_minimum_required(VERSION 3.20)
project(MyProject C CXX)

# Find the Prismio-built library
find_library(PRISMIO_LIB
    NAMES mymathlib
    PATHS ${CMAKE_SOURCE_DIR}/prismio/target/release
)

add_executable(my_app main.cpp)
target_link_libraries(my_app PRIVATE ${PRISMIO_LIB})
target_include_directories(my_app PRIVATE ${CMAKE_SOURCE_DIR}/prismio/include)
```

### Building Prismio as Part of CMake

Use `ExternalProject` or a custom command to invoke UMS from CMake:

```cmake
include(ExternalProject)

ExternalProject_Add(prismio_lib
    SOURCE_DIR ${CMAKE_SOURCE_DIR}/prismio
    BUILD_COMMAND ums build --release
    INSTALL_COMMAND ""
    BUILD_IN_SOURCE ON
)

add_dependencies(my_app prismio_lib)
```

### UMS `ums.toml` for Library Output

```toml
[package]
name = "mymathlib"
version = "1.0.0"
type = "cdylib"          # C-compatible dynamic library

[lib]
name = "mymathlib"
crate-type = ["cdylib", "staticlib"]

[profile.release]
opt-level = 3
lto = true
```

---

## Data Type Reference

| C/C++ Type | Prismio FFI Type | Notes |
|-----------|-----------------|-------|
| `int` | `Int32` | Always 32-bit |
| `long` | `Int32` or `Int64` | Platform-dependent in C |
| `long long` | `Int64` | Always 64-bit |
| `unsigned int` | `UInt32` | |
| `size_t` | `UInt` | Platform pointer size |
| `ptrdiff_t` | `Int` | Platform pointer size |
| `float` | `Float32` | |
| `double` | `Float64` | |
| `char` | `Char` | 1 byte |
| `bool` | `Bool` | `#include <stdbool.h>` in C |
| `void*` | `*Void` | Raw opaque pointer |
| `char*` | `*Char` | Null-terminated string |
| `int*` | `*Int32` | Pointer to int |
| `struct Foo` | `#[repr(C)] struct Foo` | Requires matching layout |
| `enum` | `Int32` | C enums are integers |
| `std::string` | — | Not directly compatible |

---

## Safety Best Practices

1. **Always use safe wrappers** — keep `unsafe` blocks minimal and hidden behind safe Prismio APIs
2. **Document ownership** — clarify who allocates and who frees memory across FFI boundaries
3. **Avoid C++ types** — do not attempt to use C++ standard library types across the boundary
4. **Test with Valgrind or AddressSanitizer** — memory errors in FFI code are easy to introduce
5. **Version your C ABI** — if you export Prismio functions to C, version them for backward compatibility

---

## See Also

- [FFI Basics](/interop/ffi) — Core FFI concepts and `extern` declarations
- [ABI & Calling Conventions](/interop/abi) — Low-level ABI details
- [Rust Interoperability](/interop/rust) — Interoperating with Rust via C ABI
- [Memory Safety](/language/memory) — Prismio's ownership model
