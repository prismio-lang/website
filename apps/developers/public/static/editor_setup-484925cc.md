# Editor Setup

A great editor experience significantly boosts productivity. This page covers how to configure popular editors for Prismio development, including syntax highlighting, error reporting, code formatting, and auto-completion.

---

## IntelliJ IDEA / JetBrains IDEs (Primary)

The **IntelliJ IDEA plugin for Prismio** is the primary, officially supported editor integration. It provides the richest development experience available.

> 🚧 **Coming Soon** – The IntelliJ IDEA plugin is currently in active development and not yet publicly released. The features listed below represent the planned feature set for the initial release.

### Planned Features

| Feature | Status |
|---------|--------|
| Syntax highlighting | 🚧 In development |
| Error highlighting (real-time) | 🚧 In development |
| Code completion (IntelliSense) | 🚧 In development |
| Go to definition | 🚧 In development |
| Find usages | 🚧 In development |
| Inline type hints | 🚧 In development |
| Format on save (`prismio fmt`) | 🚧 In development |
| Run/debug configurations | 🚧 In development |
| Integrated test runner | 🚧 In development |
| Refactoring support | 🚧 In development |

### Installation (Once Released)

The plugin will be available through the JetBrains Marketplace:

1. Open IntelliJ IDEA (or any JetBrains IDE)
2. Navigate to **Settings → Plugins → Marketplace**
3. Search for **"Prismio"**
4. Click **Install** and restart the IDE

Alternatively, install from disk:

1. Download `prismio-intellij-plugin-*.zip` from the [releases page](https://github.com/prismio-lang/prismio-intellij)
2. Go to **Settings → Plugins → ⚙️ → Install Plugin from Disk...**
3. Select the downloaded `.zip` file

### Supported JetBrains IDEs

The plugin will be compatible with:

- **IntelliJ IDEA** (Community and Ultimate) — recommended
- **CLion** (for projects mixing Prismio and C/C++)
- **PyCharm**, **GoLand**, **WebStorm** — via the plugin system

---

## Visual Studio Code

> 🚧 **Coming Soon** – The official VS Code extension is planned but not yet released.

### Planned Features

| Feature | Status |
|---------|--------|
| Syntax highlighting | 🚧 Planned |
| Snippets | 🚧 Planned |
| Error diagnostics (via language server) | 🚧 Planned |
| Go to definition | 🚧 Planned |
| Format on save | 🚧 Planned |
| Run & Debug integration | 🚧 Planned |

### Installation (Once Released)

```bash
# Via the VS Code CLI
code --install-extension prismio-lang.prismio-vscode
```

Or through the Extensions panel (`Ctrl+Shift+X`): search for **"Prismio"**.

### Manual Syntax Highlighting (Interim)

While the official extension is in development, you can enable basic syntax highlighting using TextMate grammar:

1. Create the directory `~/.vscode/extensions/prismio-syntax/`:

```bash
mkdir -p ~/.vscode/extensions/prismio-syntax
```

2. Create `package.json`:

```json
{
  "name": "prismio-syntax",
  "displayName": "Prismio Syntax",
  "description": "Basic syntax highlighting for Prismio",
  "version": "0.0.1",
  "engines": { "vscode": "^1.75.0" },
  "contributes": {
    "languages": [{
      "id": "prismio",
      "aliases": ["Prismio", "prismio"],
      "extensions": [".pr"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "prismio",
      "scopeName": "source.prismio",
      "path": "./syntaxes/prismio.tmLanguage.json"
    }]
  }
}
```

3. Create `language-configuration.json`:

```json
{
  "comments": {
    "lineComment": "//",
    "blockComment": ["/*", "*/"]
  },
  "brackets": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"]
  ],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"" },
    { "open": "'", "close": "'" }
  ],
  "surroundingPairs": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["\"", "\""],
    ["'", "'"]
  ]
}
```

4. Restart VS Code. Files with the `.pr` extension will now be recognised.

### VS Code Settings (Recommended)

Add these to your `settings.json` (`Ctrl+Shift+P` → "Open User Settings JSON"):

```json
{
  "[prismio]": {
    "editor.tabSize": 4,
    "editor.insertSpaces": true,
    "editor.rulers": [100],
    "editor.wordWrap": "off"
  }
}
```

---

## Neovim

Neovim users can get syntax highlighting and basic language support via **tree-sitter** and a community grammar.

> 🚧 **Coming Soon** – The official tree-sitter grammar for Prismio is in development. The instructions below describe the interim setup using a community-maintained grammar.

### Tree-sitter Grammar

#### With `nvim-treesitter`

Add the Prismio grammar to your Neovim configuration:

```lua
-- init.lua (using lazy.nvim or packer)
require("nvim-treesitter.configs").setup({
  ensure_installed = { "prismio" },
  highlight = {
    enable = true,
  },
})

-- Register the Prismio parser (until it's merged into nvim-treesitter)
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.prismio = {
  install_info = {
    url = "https://github.com/prismio-lang/tree-sitter-prismio",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "prismio",
}
```

Then install the parser:

```vim
:TSInstall prismio
```

#### File Type Detection

Add this to your `~/.config/nvim/ftdetect/prismio.lua`:

```lua
vim.filetype.add({
  extension = {
    pr = "prismio",
  },
})
```

### Syntax Highlighting via Vim Regex (Fallback)

If tree-sitter is not available, create `~/.config/nvim/syntax/prismio.vim`:

```vim
" Prismio syntax file (regex-based fallback)
if exists("b:current_syntax")
  finish
endif

" Keywords
syntax keyword prismioKeyword fn let mut return if else match for in while loop
syntax keyword prismioKeyword import pub struct enum trait impl type where
syntax keyword prismioKeyword break continue yield self super mod use as
syntax keyword prismioType Int Float Bool String Char
syntax keyword prismioBoolean true false
syntax keyword prismioNull null

" Comments
syntax region prismioLineComment start="//" end="$" contains=@Spell
syntax region prismioBlockComment start="/\*" end="\*/" contains=@Spell

" Strings
syntax region prismioString start='"' end='"' contains=prismioInterpolation
syntax region prismioInterpolation start='\${' end='}' contained

" Numbers
syntax match prismioNumber '\v<\d+>'
syntax match prismioNumber '\v<\d+\.\d+>'
syntax match prismioNumber '\v<0x[0-9A-Fa-f]+>'

" Functions
syntax match prismioFunction '\v\zs\w+\ze\('

highlight def link prismioKeyword    Keyword
highlight def link prismioType       Type
highlight def link prismioBoolean    Boolean
highlight def link prismioNull       Constant
highlight def link prismioString     String
highlight def link prismioNumber     Number
highlight def link prismioFunction   Function
highlight def link prismioLineComment Comment
highlight def link prismioBlockComment Comment

let b:current_syntax = "prismio"
```

### LSP Setup (Future)

When the Prismio Language Server (`prismio-lsp`) is released, connect it via `nvim-lspconfig`:

```lua
-- Future LSP setup (not yet available)
require("lspconfig").prismio_lsp.setup({
  cmd = { "prismio-lsp" },
  filetypes = { "prismio" },
  root_dir = require("lspconfig.util").root_pattern("prismio.toml"),
})
```

> 🚧 **Coming Soon** – The Prismio Language Server Protocol (LSP) implementation is planned for a future release.

---

## Emacs

> 🚧 **Coming Soon** – A `prismio-mode` for Emacs is planned.

### Interim Setup

Create `~/.emacs.d/prismio-mode.el`:

```elisp
;;; prismio-mode.el --- Major mode for Prismio

(defvar prismio-mode-hook nil)

(defvar prismio-font-lock-keywords
  `(
    (,(regexp-opt '("fn" "let" "mut" "return" "if" "else" "match"
                    "for" "in" "while" "loop" "import" "pub" "struct"
                    "enum" "trait" "impl" "type" "where" "break" "continue")
                  'words) . font-lock-keyword-face)
    (,(regexp-opt '("Int" "Float" "Bool" "String" "Char") 'words)
     . font-lock-type-face)
    (,(regexp-opt '("true" "false" "null") 'words) . font-lock-constant-face)
    ("\"[^\"]*\"" . font-lock-string-face)
    ("//.*" . font-lock-comment-face)
    ))

(define-derived-mode prismio-mode prog-mode "Prismio"
  "Major mode for editing Prismio source files."
  (setq font-lock-defaults '(prismio-font-lock-keywords))
  (setq-local comment-start "//")
  (setq-local indent-tabs-mode nil)
  (setq-local tab-width 4))

(add-to-list 'auto-mode-alist '("\\.pr\\'" . prismio-mode))

(provide 'prismio-mode)
```

Add to `~/.emacs` or `~/.emacs.d/init.el`:

```elisp
(load "~/.emacs.d/prismio-mode.el")
```

---

## Sublime Text

> 🚧 **Coming Soon** – A Sublime Text package is planned.

### Interim: TextMate Bundle

Sublime Text supports TextMate grammars. Create `~/.config/sublime-text/Packages/Prismio/Prismio.sublime-syntax`:

```yaml
%YAML 1.2
---
name: Prismio
file_extensions: [pr]
scope: source.prismio

contexts:
  main:
    - include: comments
    - include: strings
    - include: keywords
    - include: types
    - include: numbers

  comments:
    - match: //.*$
      scope: comment.line.prismio
    - match: /\*
      push:
        - meta_scope: comment.block.prismio
        - match: \*/
          pop: true

  strings:
    - match: '"'
      push:
        - meta_scope: string.quoted.double.prismio
        - match: '"'
          pop: true

  keywords:
    - match: \b(fn|let|mut|return|if|else|match|for|in|while|loop|import|pub|struct|enum|trait|impl|type|where|break|continue|true|false|null)\b
      scope: keyword.control.prismio

  types:
    - match: \b(Int|Float|Bool|String|Char)\b
      scope: storage.type.prismio

  numbers:
    - match: \b\d+(\.\d+)?\b
      scope: constant.numeric.prismio
```

---

## Format on Save

For any editor that can run shell commands on save, configure `prismio fmt` as the formatter.

### VS Code (with custom task)

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Format Prismio",
      "type": "shell",
      "command": "prismio fmt ${file}",
      "group": "build",
      "presentation": {
        "reveal": "silent",
        "panel": "shared"
      }
    }
  ]
}
```

Bind to a keyboard shortcut in `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+i",
    "command": "workbench.action.tasks.runTask",
    "args": "Format Prismio",
    "when": "editorLangId == prismio"
  }
]
```

### Neovim (format on save autocmd)

```lua
-- Format Prismio files on save
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.pr",
  callback = function()
    local file = vim.fn.expand("%:p")
    vim.fn.system("prismio fmt " .. file)
    vim.cmd("edit!")
  end,
})
```

### Emacs (format on save hook)

```elisp
(defun prismio-format-on-save ()
  (when (eq major-mode 'prismio-mode)
    (shell-command (format "prismio fmt %s" (buffer-file-name)))
    (revert-buffer t t t)))

(add-hook 'after-save-hook 'prismio-format-on-save)
```

---

## Prismio Language Server (LSP)

> 🚧 **Coming Soon** – The `prismio-lsp` language server is in active development. It will provide editor-agnostic features including:

- Real-time error and warning diagnostics
- Code completion with documentation
- Go to definition / find all references
- Hover information with inferred types
- Rename refactoring
- Code actions (quick fixes)
- Workspace symbols search

Once released, any editor with LSP support (VS Code, Neovim, Emacs, Sublime Text, Helix, etc.) will be able to use it.

---

## Editor Feature Matrix

| Feature | IntelliJ | VS Code | Neovim | Emacs |
|---------|----------|---------|--------|-------|
| Syntax highlighting | 🚧 | 🚧 | ✅ (manual) | ✅ (manual) |
| Error diagnostics | 🚧 | 🚧 | 🚧 (LSP) | 🚧 (LSP) |
| Code completion | 🚧 | 🚧 | 🚧 (LSP) | 🚧 (LSP) |
| Format on save | 🚧 | ✅ (manual) | ✅ (manual) | ✅ (manual) |
| Go to definition | 🚧 | 🚧 | 🚧 (LSP) | 🚧 (LSP) |
| Run configuration | 🚧 | 🚧 | ❌ | ❌ |
| Debugger | 🚧 | 🚧 | ❌ | ❌ |

✅ Available now &nbsp;&nbsp; 🚧 Coming soon &nbsp;&nbsp; ❌ Not planned

---

## Next Steps

- [Debugging Basics](./debugging.md) – Learn how to debug Prismio programs
- [Build & Run](./build_run.md) – Master the `prismio` CLI
- [Hello, World!](./hello_world.md) – Write your first program
