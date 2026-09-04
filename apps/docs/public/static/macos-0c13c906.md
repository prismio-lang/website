# macOS Target

Prismio fully supports macOS on both Intel (x86_64) and Apple Silicon (ARM64/arm64e).

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| macOS version | 12.0 (Monterey) |
| Xcode Command Line Tools | 14.0+ |
| Architecture | x86_64 or ARM64 |

---

## Installation

### Via Homebrew

> 🚧 **Coming Soon** – Homebrew tap is planned.

```bash
# Planned
brew tap prismio-lang/prismio
brew install prismio
```

### Manual Download

```bash
# Apple Silicon (M1/M2/M3)
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-macos-arm64.tar.gz
tar -xzf prismio-macos-arm64.tar.gz

# Intel Mac
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-macos-x86_64.tar.gz
tar -xzf prismio-macos-x86_64.tar.gz

# Move to PATH
sudo mv prismio /usr/local/bin/

# Verify
prismio --version
```

### Xcode Command Line Tools

The Xcode Command Line Tools must be installed for the linker and SDK headers:

```bash
xcode-select --install
```

### Build from Source

```bash
# Install dependencies via Homebrew
brew install llvm cmake

# Set LLVM path
export LLVM_DIR=$(brew --prefix llvm)

# Build
git clone https://github.com/prismio-lang/prismio
cd prismio
cmake -B build -DCMAKE_BUILD_TYPE=Release -DLLVM_DIR=$LLVM_DIR/lib/cmake/llvm
cmake --build build -j$(sysctl -n hw.ncpu)
sudo cmake --install build
```

---

## Apple Silicon (ARM64)

Prismio runs natively on Apple Silicon (M1, M2, M3, M4 chips) providing excellent performance:

```bash
# Compile for ARM64 (default on Apple Silicon)
prismio build

# Explicit ARM64 target
prismio build --target aarch64-apple-macos
```

### Universal Binaries

Build fat binaries that run on both Intel and Apple Silicon:

```bash
# Build both architectures
prismio build --target x86_64-apple-macos --output myapp-x86_64
prismio build --target aarch64-apple-macos --output myapp-arm64

# Combine with lipo
lipo -create -output myapp myapp-x86_64 myapp-arm64
file myapp
# myapp: Mach-O universal binary with 2 architectures: [x86_64] [arm64]
```

---

## Intel (x86_64)

```bash
# Compile for Intel Mac (default on Intel host)
prismio build --target x86_64-apple-macos
```

---

## Frameworks and System Libraries

Prismio programs can link against macOS frameworks:

```toml
# prismio.toml (planned)
[dependencies.frameworks]
frameworks = ["Foundation", "AppKit", "Metal"]
```

---

## macOS-Specific Behaviors

### PATH Configuration

Add Prismio to your shell's PATH by adding to `~/.zshrc` or `~/.bash_profile`:

```bash
export PATH="/usr/local/bin:$PATH"
```

### Gatekeeper and Code Signing

macOS Gatekeeper may block unsigned binaries. To allow a Prismio binary:

```bash
# Remove quarantine flag
xattr -dr com.apple.quarantine ./myapp

# Or, for distribution: sign the binary
codesign --sign "Developer ID Application: Your Name" ./myapp
```

For App Store distribution:
```bash
codesign --sign "Apple Distribution: Your Name" \
  --entitlements entitlements.plist \
  --deep ./MyApp.app
```

### System Integrity Protection (SIP)

SIP restricts writing to system directories. Always install to `/usr/local/bin/` (user-writable), not `/usr/bin/`.

---

## Rosetta 2

Intel Prismio binaries run under Rosetta 2 on Apple Silicon. For best performance, always use native ARM64 binaries when on Apple Silicon.

---

## CI/CD on macOS

### GitHub Actions

```yaml
build-macos:
  runs-on: macos-14   # Apple Silicon runner
  steps:
    - uses: actions/checkout@v3
    
    - name: Install Prismio
      run: |
        curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-macos-arm64.tar.gz
        tar xzf prismio-macos-arm64.tar.gz
        echo "$PWD" >> $GITHUB_PATH
    
    - name: Build
      run: prismio build --release
    
    - name: Test
      run: prismio test
```

---

## macOS-Specific APIs

> 🚧 **Coming Soon** – macOS system API bindings are planned.

- **Core Foundation** bindings
- **Grand Central Dispatch (GCD)** for async operations
- **Metal** for GPU compute
- **Core Data** for persistence

See also: [iOS Target](./ios.md), [Installation](../getting_started/install.md)
