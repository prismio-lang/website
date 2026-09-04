# Android Target

> 🚧 **Coming Soon** – Android support is planned for a future release of Prismio.

## Overview

Prismio will support Android as a compilation target through the Android NDK (Native Development Kit). This enables writing performance-critical native code in Prismio and calling it from Java or Kotlin Android applications via JNI.

---

## Use Cases

- **Game engines** — High-performance game logic and rendering
- **Signal processing** — Audio, video, image processing
- **Cryptography** — Native implementations of crypto algorithms
- **Computational workloads** — ML inference, physics simulation
- **Shared libraries** — Cross-platform native code shared between Android and iOS

---

## Target Triples

| ABI | Architecture | Target Triple |
|-----|-------------|---------------|
| arm64-v8a | ARM64 | `aarch64-linux-android` |
| armeabi-v7a | ARM32 | `armv7-linux-androideabi` |
| x86_64 | x86_64 | `x86_64-linux-android` |
| x86 | x86 | `i686-linux-android` |

Modern Android devices use `arm64-v8a`. Always include this ABI.

---

## Prerequisites (Planned)

- Android NDK r25+
- Android SDK (API level 21+ recommended)
- Android Studio (for project integration)
- Linux, macOS, or Windows development machine

---

## Building for Android

> 🚧 **Coming Soon** – Exact workflow subject to change.

```bash
# Set NDK path
export ANDROID_NDK_HOME="$HOME/Library/Android/sdk/ndk/25.2.9519653"

# Build for arm64-v8a (most common)
prismio build \
  --target aarch64-linux-android \
  --release

# Build for all common ABIs
for ABI in aarch64-linux-android armv7-linux-androideabi x86_64-linux-android; do
    prismio build --target $ABI --release
done
```

---

## JNI Integration

Prismio functions can be called from Java/Kotlin through JNI:

```prismio
// Prismio (libmylib.pr)
#[no_mangle]
pub extern fn Java_com_example_MyClass_processData(
    data: *const Int8,
    len: Int32,
) -> Float64 {
    // Process data and return result
    let slice = unsafe { slice_from_raw_parts(data, len as usize) }
    computeAverage(slice)
}
```

```kotlin
// Kotlin
class MyClass {
    external fun processData(data: ByteArray): Double
    
    companion object {
        init {
            System.loadLibrary("mylib")
        }
    }
}
```

---

## Android.mk / CMake Integration

> 🚧 **Coming Soon**

```cmake
# CMakeLists.txt
add_library(mylib SHARED IMPORTED)
set_target_properties(mylib PROPERTIES
    IMPORTED_LOCATION
    "${CMAKE_SOURCE_DIR}/libs/${ANDROID_ABI}/libmylib.so"
)

target_link_libraries(myapp mylib)
```

```gradle
// app/build.gradle
android {
    defaultConfig {
        ndk {
            abiFilters "arm64-v8a", "x86_64"
        }
    }
    externalNativeBuild {
        cmake {
            path "CMakeLists.txt"
        }
    }
}
```

---

## Memory and Performance

Android has varying memory constraints by device. Prismio's ownership model is ideal for Android native code:

- No garbage collector (no GC pauses in native layer)
- Predictable memory usage
- Low-latency suitable for real-time applications

---

## Android-Specific Considerations

### JNI Overhead

Each JNI call has overhead. Batch operations to minimize crossings:

```prismio
// Better: process a whole array in one JNI call
pub extern fn Java_processArray(data: *const Float32, len: Int32, out: *mut Float32) {
    // Process everything here
}
```

### Thread Safety

JNI requires careful thread handling. Always attach/detach threads before calling JNI from non-main threads.

### ABI Compatibility

Always build for all target ABIs your app supports. Include the library in `app/src/main/jniLibs/`:

```
app/src/main/jniLibs/
├── arm64-v8a/
│   └── libmylib.so
├── armeabi-v7a/
│   └── libmylib.so
└── x86_64/
    └── libmylib.so
```

---

## Minimum API Level

Prismio on Android will target **API level 21 (Android 5.0)** as the minimum, covering 99%+ of active Android devices.

See also: [iOS Target](./ios.md), [FFI Basics](../interop/ffi.md), [Linux Target](./linux.md)
