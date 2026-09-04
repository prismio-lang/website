# Refactoring APIs

Prismio provides **programmatic refactoring support** through its compiler library, enabling editors, IDEs, and build tools to perform reliable, syntax-aware code transformations on Prismio source files.

> 🚧 **Coming Soon** – The Refactoring API is not yet publicly available. It is planned for release alongside the stable LSP server and Prismio 1.0. This page documents the planned API surface and design.

---

## Overview

Refactoring in Prismio is built on three layers:

```
Editor / Plugin
     │  (requests refactoring via LSP or direct API call)
     ▼
Refactoring Engine (libprismio-refactor)
     │  (computes semantic-aware TextEdits)
     ▼
Semantic Model + Symbol Table
     │  (provides name binding, scope info, type info)
     ▼
Text Edit Set (file path + byte range + replacement text)
     │
     ▼
Applied to source files (atomically, with undo support)
```

All refactorings operate on the **semantic model** — they understand scopes, types, and cross-file references — not just text substitution. This prevents erroneous renames that would break unrelated code.

---

## 1. Rename Symbol

Renames a symbol (variable, function, struct, field, etc.) and all of its references across the entire project.

> 🚧 **Coming Soon**

### Planned API

```prismio
// Planned (not yet available)
import prismio.refactor.RenameRefactoring

fn rename_symbol(
    project: &Project,
    symbol_at: FilePosition,   // file + byte offset of the symbol
    new_name: String,
) -> RefactoringResult

struct FilePosition {
    file: FilePath,
    offset: ByteOffset,
}

struct RefactoringResult {
    edits: [FileEdit],
    errors: [RefactorError],
}

struct FileEdit {
    file: FilePath,
    changes: [TextChange],
}

struct TextChange {
    range: ByteRange,
    new_text: String,
}
```

### Usage Example (Planned)

```prismio
let result = rename_symbol(
    project,
    FilePosition { file: "src/math.prism", offset: 42 },
    "calculate_sum",
)

for edit in result.edits {
    apply_edit(edit)
}
```

### What It Handles

- Local variables within a function scope
- Function names (updates all call sites)
- Struct and enum names (updates all type annotations and initializations)
- Struct field names
- Imported module items
- Cross-file references within the same project

### What It Does Not Handle (Planned Limitations)

- Renaming across package boundaries (cross-crate rename)
- Symbols exported in a public API (will warn)
- Names that collide with keywords

---

## 2. Extract Function

Extracts a selected block of statements into a new function, replacing the original code with a call to the new function.

> 🚧 **Coming Soon**

### Planned API

```prismio
import prismio.refactor.ExtractFunctionRefactoring

fn extract_function(
    project: &Project,
    selection: FileRange,         // range of statements to extract
    new_function_name: String,
    visibility: Visibility,
) -> RefactoringResult

struct FileRange {
    file: FilePath,
    start: ByteOffset,
    end: ByteOffset,
}
```

### Example (Planned)

Before:

```prismio
fn process(data: [Int]) -> Int {
    let filtered = data.filter(|x| x > 0)
    let doubled = filtered.map(|x| x * 2)
    let sum = doubled.fold(0, |acc, x| acc + x)
    sum
}
```

After extracting lines 2–4 into `compute_positive_double_sum`:

```prismio
fn process(data: [Int]) -> Int {
    compute_positive_double_sum(data)
}

fn compute_positive_double_sum(data: [Int]) -> Int {
    let filtered = data.filter(|x| x > 0)
    let doubled = filtered.map(|x| x * 2)
    doubled.fold(0, |acc, x| acc + x)
}
```

The engine automatically:
- Detects which variables from the outer scope are used (become parameters)
- Detects which values are produced and returned (become return type)
- Infers the correct function signature

---

## 3. Inline Variable

Replaces all uses of a variable with its initializer expression, then removes the `let` binding.

> 🚧 **Coming Soon**

### Planned API

```prismio
import prismio.refactor.InlineVariableRefactoring

fn inline_variable(
    project: &Project,
    variable_at: FilePosition,
) -> RefactoringResult
```

### Example (Planned)

Before:

```prismio
fn area(width: Float, height: Float) -> Float {
    let product = width * height
    product * 2.0
}
```

After inlining `product`:

```prismio
fn area(width: Float, height: Float) -> Float {
    (width * height) * 2.0
}
```

### Safety Checks

The refactoring engine refuses to inline if:
- The initializer has **side effects** and is used more than once (would duplicate effects)
- The variable is **mutable** (inlining could change semantics)
- The variable is **borrowed** across the inline point

---

## 4. Move Item to Module

Moves a top-level item (function, struct, enum, etc.) from one file to another, updating all import statements across the project.

> 🚧 **Coming Soon**

### Planned API

```prismio
import prismio.refactor.MoveItemRefactoring

fn move_item(
    project: &Project,
    item_at: FilePosition,
    destination_module: ModulePath,
) -> RefactoringResult
```

### Example (Planned)

```prismio
// Move `JsonParser` struct from src/utils.prism to src/parsing/json.prism
let result = move_item(
    project,
    FilePosition { file: "src/utils.prism", offset: 120 },
    "src.parsing.json",
)
```

The engine automatically:
- Moves the item definition to the target file
- Removes the original definition
- Updates all `import` statements that reference the old path
- Adds a new `import` in the target file for any dependencies the item had

---

## 5. Additional Planned Refactorings

| Refactoring | Status | Description |
|---|---|---|
| **Extract Variable** | 🚧 Planned | Extract an expression into a `let` binding |
| **Convert to Method** | 🚧 Planned | Convert a free function to an `impl` method |
| **Convert to Free Function** | 🚧 Planned | Extract an `impl` method into a free function |
| **Add Type Annotation** | 🚧 Planned | Insert inferred type as explicit annotation |
| **Remove Unused Import** | 🚧 Planned | Remove `import` declarations with no references |
| **Organize Imports** | 🚧 Planned | Sort and group `import` declarations |
| **Change Signature** | 🚧 Planned | Reorder, add, or remove function parameters |
| **Introduce Parameter** | 🚧 Planned | Turn a hardcoded value into a function parameter |

---

## 6. API for Editor Plugins

The refactoring API will be available via two integration paths:

### 6.1 LSP Code Actions

Refactorings are surfaced as **LSP Code Actions** (`textDocument/codeAction`). When the user places their cursor on a symbol and requests code actions, the LSP server returns a list of applicable refactorings. The editor then applies the resulting `WorkspaceEdit`.

See [Language Server Protocol](/ai/lsp) for LSP integration details.

### 6.2 Direct Library API (libprismio-refactor)

For tools that embed the compiler directly (e.g., custom code editors, batch refactoring scripts), the refactoring engine will be exposed as a native library:

```bash
# Link against libprismio-refactor (planned)
ums add-dep prismio-refactor
```

```prismio
import prismio.refactor

fn main() {
    let project = Project.load(".")
    let result = refactor.rename_symbol(
        project,
        FilePosition { file: "src/main.prism", offset: 34 },
        "newFunctionName",
    )
    result.apply()
}
```

> 🚧 **Coming Soon** – The native library distribution and package API for `libprismio-refactor` will be available once the API is stabilized.

---

## 7. Undo and Preview

All refactorings support:

- **Preview mode**: compute and display the diff of changes without applying them.
- **Undo**: the applied changes are reversible via the editor's undo stack (since they are standard `WorkspaceEdit` operations in LSP).

---

## See Also

- [Language Server Protocol](/ai/lsp) — LSP server that surfaces these refactorings
- [Semantic Model](/ai/semantic_model) — The model refactorings are built on
- [AST Specification](/ai/ast) — AST traversal used by refactoring passes
