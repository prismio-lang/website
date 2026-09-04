# Linux Target

Prismio has first-class support for Linux, making it the primary development and production platform.

## Supported Distributions

Prismio supports any Linux distribution with:
- **glibc 2.17+** (or musl libc for static linking)
- **LLVM 15+** (required for compilation)
- **Kernel 4.4+**

Tested distributions:

| Distribution | Min Version | Architectures |
|---|---|---|
| Ubuntu | 20.04 LTS | x86_64, ARM64 |
| Debian | 11 (Bullseye) | x86_64, ARM64 |
| Fedora | 36 | x86_64, ARM64 |
| Arch Linux | Rolling | x86_64, ARM64 |
| RHEL / CentOS Stream | 8 | x86_64 |
| Alpine Linux | 3.16 | x86_64, ARM64 |

---

## Installation on Linux

### From Release Binary

```bash
# Download the latest release (x86_64)
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz
tar -xzf prismio-linux-x86_64.tar.gz
sudo mv prismio /usr/local/bin/

# Verify
prismio --version
```

### From Package Manager

> 🚧 **Coming Soon** – Package manager support is planned.

```bash
# Planned: Ubuntu/Debian
sudo apt install prismio

# Planned: Fedora/RHEL
sudo dnf install prismio

# Planned: Arch Linux (AUR)
yay -S prismio
```

### Build from Source

```bash
# Prerequisites
sudo apt install llvm-17-dev clang-17 cmake build-essential git

# Clone and build
git clone https://github.com/prismio-lang/prismio
cd prismio
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
sudo cmake --install build
```

---

## Architectures

### x86_64

The primary supported architecture. All features and optimizations are available.

```bash
# Build for x86_64 (default on x86_64 host)
prismio build

# Explicit target
prismio build --target x86_64-unknown-linux-gnu
```

### ARM64 (aarch64)

Supported for both native compilation (e.g., Raspberry Pi 4, AWS Graviton) and cross-compilation from x86_64.

```bash
# Build for ARM64
prismio build --target aarch64-unknown-linux-gnu

# Cross-compile from x86_64 (requires cross-linker)
sudo apt install gcc-aarch64-linux-gnu
prismio build --target aarch64-unknown-linux-gnu
```

### musl (Static Linking)

Build fully static binaries using musl libc:

```bash
# Static binary — no runtime dependencies
prismio build --target x86_64-unknown-linux-musl
file ./target/myapp   # ELF 64-bit, statically linked
```

---

## Linking

### Dynamic Linking (Default)

By default, Prismio links against the system's glibc dynamically:

```bash
ldd ./target/myapp
# linux-vdso.so.1
# libm.so.6
# libc.so.6
```

### Static Linking

```bash
prismio build --target x86_64-unknown-linux-musl
# Results in a binary with no shared library dependencies
```

---

## System Libraries

Prismio programs can link against system libraries via FFI:

```toml
# prismio.toml (planned)
[dependencies.system]
libs = ["pthread", "dl", "m"]
```

---

## Docker / Container Usage

Prismio works great in containers:

```dockerfile
# Build stage
FROM ubuntu:22.04 AS builder
RUN apt-get update && apt-get install -y curl
RUN curl -LO https://releases.prismio.dev/prismio-linux-x86_64.tar.gz \
    && tar xzf prismio-linux-x86_64.tar.gz \
    && mv prismio /usr/local/bin/

WORKDIR /app
COPY . .
RUN prismio build --release

# Runtime stage (minimal image)
FROM debian:bullseye-slim
COPY --from=builder /app/target/myapp /usr/local/bin/
CMD ["myapp"]
```

For the smallest images, build with musl and use scratch or Alpine:

```dockerfile
FROM scratch
COPY --from=builder /app/target/myapp /myapp
ENTRYPOINT ["/myapp"]
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Prismio
        run: |
          curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz
          tar xzf prismio-linux-x86_64.tar.gz
          echo "$PWD" >> $GITHUB_PATH
      
      - name: Build
        run: prismio build --release
      
      - name: Test
        run: prismio test
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test

build:
  image: ubuntu:22.04
  stage: build
  script:
    - apt-get update -q && apt-get install -yq curl
    - curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz
    - tar xzf prismio-linux-x86_64.tar.gz && mv prismio /usr/local/bin/
    - prismio build --release
  artifacts:
    paths:
      - target/
```

---

## Linux-Specific Features

- **epoll** — Used by the async runtime for efficient I/O multiplexing
- **io_uring** — (planned) High-performance async I/O on Linux 5.1+
- **seccomp** — (planned) Syscall filtering for sandboxing
- **eBPF** — (future consideration) For observability tools

See also: [Installation](../getting_started/install.md), [Build & Run](../getting_started/build_run.md)
