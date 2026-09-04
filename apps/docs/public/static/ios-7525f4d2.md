# iOS Target

> 🚧 **Coming Soon** – iOS support is planned for a future release of Prismio. This page describes the intended design.

## Overview

Prismio aims to support iOS as a compilation target, enabling developers to write high-performance iOS application components in Prismio. The primary use case is performance-critical code (game engines, signal processing, image manipulation) embedded in larger iOS applications.

---

## Planned Architecture

iOS support in Prismio will follow a similar model to Rust on iOS:

```
Prismio source code
        │
        ▼
    Prismio compiler
        │
        ▼
  LLVM backend (ARM64)
        │
        ▼
  .a static library (XCFramework)
        │
        ▼
  Swift/ObjC iOS App (Xcode)
```

---

## Target Triples

| Device | Architecture | Target Triple |
|--------|-------------|---------------|
| iPhone / iPad | ARM64 | `aarch64-apple-ios` |
| iOS Simulator (Apple Silicon Mac) | ARM64 | `aarch64-apple-ios-sim` |
| iOS Simulator (Intel Mac) | x86_64 | `x86_64-apple-ios` |

---

## Building for iOS

> 🚧 **Coming Soon** – Exact commands subject to change.

```bash
# Build for iOS device
prismio build --target aarch64-apple-ios --release

# Build for iOS Simulator on Apple Silicon
prismio build --target aarch64-apple-ios-sim --release

# Create XCFramework (for both device and simulator)
xcodebuild -create-xcframework \
  -library target/aarch64-apple-ios/release/libmylib.a \
  -headers include/ \
  -library target/aarch64-apple-ios-sim/release/libmylib.a \
  -headers include/ \
  -output MyLib.xcframework
```

---

## Xcode Integration

Once a Prismio library is built as an XCFramework:

1. Drag `MyLib.xcframework` into your Xcode project
2. Add it to "Frameworks, Libraries, and Embedded Content"
3. Create a bridging header or Swift wrapper
4. Call Prismio functions from Swift

---

## Swift Interoperability

> 🚧 **Coming Soon**

Prismio functions exported with `extern fn` can be called from Swift via C interop:

```prismio
// Prismio (my_math.pr)
#[no_mangle]
pub extern fn fast_sqrt(x: Float64) -> Float64 {
    // optimized implementation
    x.sqrt()
}
```

```swift
// Swift
import Foundation

// Import via bridging header or module map
let result = fast_sqrt(16.0)
print(result)  // 4.0
```

---

## UIKit / SwiftUI Interoperability

> 🚧 **Future Consideration**

Direct UIKit or SwiftUI interop from Prismio is not planned in the initial implementation. Prismio on iOS is intended for computation, not UI. Use Swift for the UI layer and call into Prismio for performance-critical work.

---

## App Store Considerations

- Prismio-compiled code follows Apple's App Store guidelines
- No JIT compilation (not allowed on iOS) — Prismio compiles to native ARM64
- Code signing requirements apply to all included libraries
- Bitcode: > 🚧 **Coming Soon** – Bitcode support may be required for certain workflows

---

## Memory Considerations

iOS has strict memory limits. Prismio's ownership model (no GC) is well-suited for iOS:
- No garbage collector pauses
- Predictable memory usage
- No hidden reference counting overhead (vs. Swift/ObjC ARC)

---

## Requirements (Planned)

- macOS 13+ development machine
- Xcode 15+
- iOS 15+ deployment target (planned minimum)
- Apple Developer account (for device deployment)

See also: [macOS Target](./macos.md), [Android Target](./android.md), [FFI Basics](../interop/ffi.md)
