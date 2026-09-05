# Source Repositories

Prismio is open source. All source code, documentation, and tooling is hosted on GitHub under the [prismio-lang](https://github.com/prismio-lang) organization.

## Repositories

### Main Compiler

**[github.com/prismio-lang/prismio](https://github.com/prismio-lang/prismio)**

The primary repository containing:
- `src/` — Compiler source code (lexer, parser, type checker, codegen)
- `tests/` — Integration and unit tests
- `examples/` — Example Prismio programs
- `tools/` — Supporting tools (formatter, linter — coming soon)
- `docs/` — This documentation site

### Standard Library

> 🚧 **Coming Soon** – The standard library will be in a separate repository.

**[github.com/prismio-lang/prismio-std](https://github.com/prismio-lang/prismio-std)** (planned)

### Documentation

The documentation source lives in the main compiler repository under `docs/`.

---

## Cloning and Building from Source

### Prerequisites

| Dependency | Version | Install |
|-----------|---------|---------|
| Git | Any | System package manager |
| LLVM | 15–17 | See below |
| Clang | 15–17 | Bundled with LLVM |
| CMake | 3.20+ | System package manager |
| Ninja | Any | System package manager |

#### Installing LLVM

```bash
# Ubuntu/Debian
sudo apt install llvm-17-dev clang-17 libclang-17-dev

# macOS
brew install llvm@17

# Windows (via Chocolatey)
choco install llvm
```

### Clone and Build

```bash
# Clone the repository
git clone https://github.com/prismio-lang/prismio
cd prismio

# Configure with CMake
cmake -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLVM_DIR=$(llvm-config --cmakedir)

# Build
cmake --build build -j$(nproc)

# Run tests to verify
cmake --build build --target test

# Install (optional)
sudo cmake --install build
```

### Build with Debug Info

```bash
cmake -B build-debug -G Ninja \
  -DCMAKE_BUILD_TYPE=Debug \
  -DLLVM_DIR=$(llvm-config --cmakedir)

cmake --build build-debug
```

---

## Repository Structure

```
prismio/
├── src/
│   ├── lexer/          # Tokenizer
│   ├── parser/         # AST parser
│   ├── ast/            # AST node definitions
│   ├── typeck/         # Type checker
│   ├── semantic/       # Semantic analysis
│   ├── codegen/        # LLVM IR generation
│   ├── driver/         # Compiler driver (CLI)
│   └── diagnostics/    # Error reporting
├── tests/
│   ├── unit/           # Unit tests per component
│   ├── integration/    # End-to-end compilation tests
│   └── programs/       # Test programs
├── examples/
│   ├── hello_world/
│   ├── fibonacci/
│   └── ...
├── docs/               # This documentation site (Next.js)
├── tools/              # Formatter, linter (coming soon)
├── CMakeLists.txt
├── prismio.toml        # Build config
└── README.md
```

---

## Contributing

We welcome contributions of all kinds:

- 🐛 **Bug reports** — [Open an issue](https://github.com/prismio-lang/prismio/issues)
- 💡 **Feature requests** — [Open an issue](https://github.com/prismio-lang/prismio/issues)
- 🔧 **Code contributions** — [Open a pull request](https://github.com/prismio-lang/prismio/pulls)
- 📖 **Documentation** — Edit files in `docs/content/` and open a PR
- 🧪 **Test cases** — Add tests in `tests/`

See the [Style Guide](./style.md) and [RFC Process](./rfc.md) for contribution guidelines.

---

## Communication

- **GitHub Issues** — Bug reports and feature requests
- **GitHub Discussions** — General questions and community discussion
- **Email** — vibrant.official275@gmail.com (security issues only)
