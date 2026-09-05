# Installation

This guide walks you through installing the Prismio compiler on your system. You can either download a prebuilt binary or build the compiler from source.

---

## Prerequisites

Before installing Prismio, ensure your system meets the following requirements:

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| OS | Linux (glibc 2.17+), macOS 12+, Windows 10+ | 64-bit only |
| Disk Space | ~500 MB | Includes standard library |
| RAM | 2 GB | 4 GB+ recommended for large projects |

---

## Option 1: Download a Prebuilt Binary (Recommended)

The fastest way to get started is by downloading the latest prebuilt binary from the [Prismio releases page](https://github.com/prismio-lang/prismio/releases).

### Linux

```bash
# Download the latest release
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz

# Extract the archive
tar -xzf prismio-linux-x86_64.tar.gz

# Move the binary to a directory on your PATH
sudo mv prismio /usr/local/bin/

# Verify the installation
prismio --version
```

### macOS

```bash
# Download the latest release
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-macos-arm64.tar.gz

# Extract the archive
tar -xzf prismio-macos-arm64.tar.gz

# Move the binary to a directory on your PATH
sudo mv prismio /usr/local/bin/

# On Apple Silicon, you may need to allow the binary in Security & Privacy settings
# Alternatively, remove the quarantine attribute
xattr -d com.apple.quarantine /usr/local/bin/prismio

# Verify the installation
prismio --version
```

> **Note:** macOS x86_64 (Intel) builds are also available. Replace `arm64` with `x86_64` in the URL above.

### Windows

```powershell
# Download the latest release (PowerShell)
Invoke-WebRequest -Uri "https://github.com/prismio-lang/prismio/releases/latest/download/prismio-windows-x86_64.zip" -OutFile "prismio-windows-x86_64.zip"

# Extract the archive
Expand-Archive -Path "prismio-windows-x86_64.zip" -DestinationPath "C:\prismio"

# Add to PATH permanently (run as Administrator)
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\prismio\bin", [System.EnvironmentVariableTarget]::Machine)

# Verify the installation (open a new terminal)
prismio --version
```

> **Tip:** On Windows, you may need to restart your terminal session after modifying the PATH for the changes to take effect.

---

## Option 2: Build From Source

Building from source gives you access to the latest unreleased features and allows you to target custom LLVM backends.

### Source Build Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| LLVM | 17.0+ | Compiler backend |
| Clang | 17.0+ | C++ compiler for building Prismio |
| CMake | 3.20+ | Build system |
| Git | 2.30+ | Cloning the repository |
| Python | 3.8+ | Build scripts |
| Ninja | 1.10+ | Fast build tool (recommended) |

### Installing Build Dependencies

#### Linux (Ubuntu/Debian)

```bash
# Install LLVM 17 and Clang
wget https://apt.llvm.org/llvm.sh
chmod +x llvm.sh
sudo ./llvm.sh 17

# Install remaining dependencies
sudo apt-get update
sudo apt-get install -y \
    cmake \
    ninja-build \
    git \
    python3 \
    python3-pip \
    libzstd-dev \
    zlib1g-dev
```

#### Linux (Fedora/RHEL)

```bash
sudo dnf install -y \
    llvm17 \
    llvm17-devel \
    clang \
    cmake \
    ninja-build \
    git \
    python3
```

#### macOS

```bash
# Using Homebrew
brew install llvm cmake ninja git python3

# Add LLVM to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$(brew --prefix llvm)/bin:$PATH"
export LDFLAGS="-L$(brew --prefix llvm)/lib"
export CPPFLAGS="-I$(brew --prefix llvm)/include"
```

#### Windows

```powershell
# Using winget
winget install LLVM.LLVM
winget install Kitware.CMake
winget install Ninja-build.Ninja
winget install Git.Git
winget install Python.Python.3.11

# Or using Chocolatey
choco install llvm cmake ninja git python
```

### Cloning and Building

```bash
# Clone the repository
git clone https://github.com/prismio-lang/prismio.git
cd prismio

# Initialize submodules (standard library, runtime)
git submodule update --init --recursive

# Create the build directory
mkdir build && cd build

# Configure with CMake (Release mode)
cmake .. \
    -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DLLVM_DIR=$(llvm-config --cmakedir) \
    -DCMAKE_C_COMPILER=clang \
    -DCMAKE_CXX_COMPILER=clang++

# Build (use -j to specify the number of parallel jobs)
ninja -j$(nproc)

# Install to /usr/local (Linux/macOS)
sudo ninja install
```

> **Tip:** On a machine with 8 CPU cores, building typically takes 3–8 minutes. The first build may take longer due to dependency compilation.

#### Windows (Source Build)

```powershell
# Open a Developer PowerShell for VS 2022 (or set up MSVC environment)
# Then:

git clone https://github.com/prismio-lang/prismio.git
cd prismio
git submodule update --init --recursive

mkdir build
cd build

cmake .. `
    -G Ninja `
    -DCMAKE_BUILD_TYPE=Release `
    -DLLVM_DIR="C:\Program Files\LLVM\lib\cmake\llvm" `
    -DCMAKE_C_COMPILER=clang-cl `
    -DCMAKE_CXX_COMPILER=clang-cl

ninja
```

---

## Setting Up Your PATH

Prismio needs to be on your system `PATH` so that you can invoke `prismio` from any directory.

### Linux & macOS

Add the following line to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# If installed to /usr/local/bin (standard install)
export PATH="/usr/local/bin:$PATH"

# If installed to a custom directory
export PATH="$HOME/.prismio/bin:$PATH"
```

Then reload your shell:

```bash
source ~/.zshrc   # or ~/.bashrc
```

### Windows

```powershell
# User-level PATH (no admin required)
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$userPath;C:\prismio\bin", "User")
```

Or navigate to **System Properties → Environment Variables → Path → Edit** and add the Prismio `bin` directory.

---

## Verifying Your Installation

Once installed, run the following command to verify that Prismio is correctly set up:

```bash
prismio --version
```

You should see output similar to:

```
Prismio 0.1.0 (LLVM 17.0.6)
Author: Saksham Jaiswal
Target: x86_64-unknown-linux-gnu
Build: release
```

You can also check the available commands:

```bash
prismio --help
```

```
USAGE:
    prismio <COMMAND> [OPTIONS]

COMMANDS:
    build       Compile a Prismio project or file
    run         Build and run a Prismio project
    test        Run tests for the current project
    clean       Remove build artifacts
    new         Create a new Prismio project
    add         Add a dependency to prismio.toml
    fmt         Format Prismio source code
    doc         Generate documentation
    version     Print version information

OPTIONS:
    -h, --help       Print help information
    -V, --version    Print version information
```

---

## Standard Library

The Prismio standard library (`prismio-std`) is bundled with the compiler. It is automatically available in every project without any additional installation.

```prismio
// Standard library modules are available immediately
import std.io
import std.collections.List
import std.math
```

---

## Updating Prismio

### Binary Install

To update, simply download the new binary and replace the existing one:

```bash
# Linux/macOS
curl -LO https://github.com/prismio-lang/prismio/releases/latest/download/prismio-linux-x86_64.tar.gz
tar -xzf prismio-linux-x86_64.tar.gz
sudo mv prismio /usr/local/bin/
```

### Source Build

```bash
cd prismio
git pull origin main
git submodule update --recursive
cd build
ninja -j$(nproc)
sudo ninja install
```

---

## Uninstalling

```bash
# Linux/macOS (binary install)
sudo rm /usr/local/bin/prismio

# Remove cached build artifacts and packages
rm -rf ~/.prismio

# Linux/macOS (source install)
cd prismio/build
sudo ninja uninstall
```

On Windows, remove the Prismio directory and update your PATH accordingly.

---

## Troubleshooting

### `command not found: prismio`

The `prismio` binary is not on your `PATH`. Check that the directory containing `prismio` is listed in your `PATH` environment variable. See [Setting Up Your PATH](#setting-up-your-path).

### LLVM version mismatch (source build)

```
Error: LLVM version 16.x.x is not supported. Minimum required: 17.0.0
```

Install LLVM 17 or newer and ensure `llvm-config` points to the correct version:

```bash
llvm-config --version
# Should print 17.x.x or higher

# If multiple LLVM versions are installed, specify the path explicitly:
cmake .. -DLLVM_DIR=/usr/lib/llvm-17/lib/cmake/llvm
```

### Permission denied (Linux/macOS)

```bash
# If you get permission denied when moving to /usr/local/bin
sudo mv prismio /usr/local/bin/
sudo chmod +x /usr/local/bin/prismio
```

### macOS Security Warning

If macOS blocks the binary with "cannot be opened because the developer cannot be verified":

```bash
# Remove the quarantine flag
xattr -d com.apple.quarantine /usr/local/bin/prismio

# Or allow it via System Settings → Privacy & Security → Allow Anyway
```

---

## Next Steps

Now that Prismio is installed, continue with:

- [Hello, World!](./hello_world.md) – Write and run your first Prismio program
- [Project Layout](./project_layout.md) – Understand the standard project structure
- [Build & Run](./build_run.md) – Learn all the build commands
