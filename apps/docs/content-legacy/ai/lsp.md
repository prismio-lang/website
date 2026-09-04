# Language Server Protocol

The Prismio Language Server (PrismLS) brings first-class IDE intelligence to any LSP-compatible editor.

> 🚧 **Coming Soon** – PrismLS is under active development. This page describes the planned feature set.

## What is the Language Server Protocol?

The [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) is a standardized communication protocol between code editors and language services. Instead of every editor needing its own Prismio plugin logic, a single language server handles all the intelligence, and any LSP-compatible editor can connect to it.

```
Editor (VS Code, Neovim, etc.)  <-->  LSP Protocol  <-->  PrismLS (Prismio Language Server)
```

## Planned Features

PrismLS aims to support the full LSP feature set:

### Code Intelligence
- **Auto-completion** — symbol-aware completions for variables, functions, types, imports
- **Hover documentation** — inline doc comments shown on hover
- **Signature help** — parameter hints while typing function calls
- **Go to Definition** — jump to declaration of any symbol
- **Go to Type Definition** — navigate to the type of a symbol
- **Find All References** — list every use of a symbol
- **Document Symbols** — outline of all symbols in the current file
- **Workspace Symbols** — search symbols across the entire project

### Diagnostics
- **Real-time error reporting** — type errors, ownership violations, unused variables
- **Warning highlighting** — lint warnings inline as you type
- **Quick fixes** — one-click fixes for common errors

### Code Actions
- **Rename symbol** — safely rename across all usages
- **Extract function** — turn selected code into a new function
- **Auto-import** — automatically add missing import statements
- **Organize imports** — sort and deduplicate imports

### Formatting
- **Format document** — run `prismfmt` on the current file
- **Format on save** — automatic formatting when you save
- **Format selection** — format only a selected range

### Inlay Hints
- Type annotations for variables with inferred types
- Parameter name hints in function calls

## Installation

> 🚧 **Coming Soon** – Installation instructions will be provided when PrismLS is released.

The language server will be distributed as part of the Prismio toolchain. Once installed, the `prismio` binary will include the `lsp` subcommand:

```bash
prismio lsp --stdio
```

## Editor Integration

### VS Code

> 🚧 **Coming Soon** – A VS Code extension for Prismio is in development.

The official Prismio VS Code extension will automatically start PrismLS and connect your editor.

```json
// .vscode/settings.json (planned)
{
  "prismio.languageServer.enabled": true,
  "prismio.languageServer.path": "prismio",
  "editor.formatOnSave": true,
  "[prismio]": {
    "editor.defaultFormatter": "prismio-lang.prismio"
  }
}
```

### Neovim

> 🚧 **Coming Soon** – Tree-sitter grammar and nvim-lspconfig support planned.

```lua
-- init.lua (planned configuration)
require('lspconfig').prismls.setup {
  cmd = { 'prismio', 'lsp', '--stdio' },
  filetypes = { 'prismio', 'pr' },
  root_dir = require('lspconfig').util.root_pattern('prismio.toml'),
}
```

### IntelliJ IDEA

> 🚧 **Coming Soon** – A native IntelliJ plugin is planned.

The IntelliJ plugin will provide deeper integration than LSP alone, including:
- Project system integration
- Run configurations
- Integrated debugger support

### Emacs

> 🚧 **Coming Soon** – eglot/lsp-mode configuration planned.

```elisp
;; Emacs (planned)
(add-to-list 'eglot-server-programs
  '(prismio-mode . ("prismio" "lsp" "--stdio")))
```

### Helix

Helix has built-in LSP support. Once PrismLS is available, add to `languages.toml`:

```toml
# languages.toml (planned)
[[language]]
name = "prismio"
scope = "source.prismio"
file-types = ["pr"]
roots = ["prismio.toml"]
language-servers = ["prismio-lsp"]

[language-server.prismio-lsp]
command = "prismio"
args = ["lsp", "--stdio"]
```

## Performance Goals

PrismLS is designed with performance as a priority:

| Metric | Target |
|--------|--------|
| First completion response | < 100ms |
| Diagnostic refresh | < 500ms after keystroke |
| Project indexing (10k files) | < 5s |
| Memory footprint | < 200MB for typical projects |

## Architecture

PrismLS will use an incremental compilation model:

```
Source Files
    │
    ▼
Incremental Parser ──► Syntax Tree Cache
    │
    ▼
Semantic Analysis ──► Symbol Index
    │
    ▼
Type Checker ──► Type Cache
    │
    ▼
LSP Response
```

Only changed files and their dependents are re-analyzed on each edit, keeping response times fast.

## Contributing

Contributions to PrismLS development are welcome. The server will be part of the main Prismio repository under `tools/prismls/`.

See the [Contribute](../contribute/source.md) section for how to get involved.
