---
title: The VS Code extension
description: How the Prismio extension for VS Code is built, why it stays a thin client of the language server, how its grammars are generated or held to the compiler, and how to test it in a real VS Code.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-11"
tags: [vscode, editor, lsp, tooling]
related: [tooling/language-server, tooling/ide-protocol, tooling/intellij-plugin, compiler/cli]
---

An editor extension that knows the language has to be kept in step with the compiler, one release at a time. This one does not know the language: it starts `prismio lsp`, and everything an editor shows (errors, hover, completion, rename, formatting) is the toolchain's answer. What is left for the extension is finding the toolchain, colouring text before the server has answered, snippets, and what `build.ums` and `prismio init` make possible: tasks, Run and Debug lenses, and a New Project command. The code is in the `vscode-plugin` repository; 0.1.0 is its first release.

## See it work

The end-to-end suite starts the installed VS Code with the extension and throwaway copies of two demo projects, and asks the editor's own commands what they see:

```bash
cd vscode-plugin
npm install
PRISMIO=/path/to/prismio npm test
```

```text
ok   the sample program is clean, then an error shows with its code
ok   hover shows the signature and the comment, across files
ok   go to definition crosses files
ok   go to definition reaches the library, whose source the server writes out
ok   find references lists the declaration and the uses
ok   completion after a dot lists the members
ok   the outline lists the functions
ok   rename changes every use
ok   formatting uses prismio fmt
ok   semantic tokens colour the declarations
ok   tasks come from build.ums in every folder, and only what can run
ok   a task of the second folder runs in the second folder
ok   Debug without a debugger extension says so, offers CodeLLDB and starts no session
ok   a manifest error shows up as a diagnostic, from the server
ok   run and debug code lenses sit above fn main and above the manifest's targets and commands
ok   the second folder gets its lenses too, and no Run on a test target
ok   the snippets are offered
ok   Enter in a /// comment continues it
ok   New Project writes what prismio init writes
ok   completion offers the names in scope: locals, functions and types
ok   completion offers a library function that is not imported, and accepting it adds the import
ok   completion on an import line offers modules
ok   completion offers type names where a type is written
ok   completion in build.ums offers blocks and keys
ok   signature help names the function and follows the argument
ok   inlay hints show the type of a let and the parameter names at a call
ok   document highlights mark the declaration as written and the uses as read
ok   workspace symbols find functions and types across files
ok   go to type definition leads from a value to its struct
ok   folding ranges cover each function body
ok   range formatting changes the lines asked for and leaves the rest
ok   hover on a library name shows the standard library's signature and comment
ok   the add-import quick fix clears the error, for a package module and a library one
ok   restarting the server leaves it running, again and again
ok   after a restart the diagnostics are back
ok   the status bar item shows the toolchain's version and a running server
ok   a change to prismio.trace.server reaches the running server without a restart
```

37 checks, run in VS Code 1.143 against the 0.2.0 toolchain, in a two-folder workspace, through the editor's own provider commands (`vscode.executeHoverProvider`, `executeDefinitionProvider`, `executeTypeDefinitionProvider`, `executeReferenceProvider`, `executeCompletionItemProvider`, `executeSignatureHelpProvider`, `executeInlayHintProvider`, `executeCodeActionProvider`, `executeDocumentHighlights`, `executeDocumentSymbolProvider`, `executeWorkspaceSymbolProvider`, `executeFoldingRangeProvider`, `executeDocumentRenameProvider`, `executeFormatDocumentProvider`, `executeFormatRangeProvider`, `executeCodeLensProvider`, `provideDocumentSemanticTokens`), so a feature the server answers and the client never wired up fails here. Each asserts what a user would see: the completion for `println` carries the `import std.io` edit and the file compiles clean after it. For the release they were also run against the unpacked `.vsix`, with the tests copied inside it: a test that stubs `vscode.window` only reaches the extension when it is loaded from the extension's own folder, since VS Code gives each extension its own API object.

## What the extension does

| File | Job |
|---|---|
| `src/extension.ts` | activation: registers the commands, the task provider, the lenses and the status item |
| `src/toolchain.ts` | finds `prismio` (the `prismio.path` setting, then `PATH`, then `~/.prismio/bin`) and reads `--version` |
| `src/server.ts` | starts `prismio lsp` through `vscode-languageclient` for `.psm` and `build.ums`, restarts it on request or when `prismio.path` changes, and applies `prismio.trace.server` to the running server |
| `src/status.ts` | the status bar item: the toolchain's version and the server's state; a toolchain without `prismio-lsp` is named as the problem |
| `syntaxes/prismio.tmLanguage.json` | the TextMate grammar, **generated** |
| `syntaxes/ums.tmLanguage.json`, `ums-language-configuration.json` | `build.ums`: `#` and `//` comments, blocks, keys, calls, `${}` and `$$` in strings, `const` and `enum`, mirroring the JetBrains plugin's manifest lexer |
| `language-configuration.json` | comments (block comments nest), brackets, auto-closing pairs, indentation, Enter continuing `///` and ` * ` lines |
| `snippets/prismio.json` | the JetBrains plugin's live templates; a test expands each one and runs `prismio check` on it |
| `images/` | the extension's logo (`icon.png`, 128 px, what the Marketplace shows), the `.psm` file icon (`psm.png`) and the `build.ums` one (`ums.svg`), contributed as each language's `icon`, which the default file icon theme shows in the explorer and on tabs; `test/grammar.test.mjs` fails if one is missing or the logo is not 128 px. The pictures are the website's logo (`apps/web/public/icons/prismio.png`) and the IntelliJ plugin's `build.ums` mark |
| `src/manifest.ts`, `src/tasks.ts` | `build`, `test`, `run <target>` for each executable and every `command` of `build.ums`, in every workspace folder (read by a line scan, not a parse: the manifest's own checker is the toolchain's); `prismio.debugTarget` builds in the debug profile and starts CodeLLDB, or `cppdbg` with LLDB, and asks for a debugger when neither is installed |
| `src/codelens.ts` | Run and Debug above `fn main` in a target's entry file and above each runnable target and command in `build.ums` |
| `src/newProject.ts` | **Prismio: New Project**, which runs `prismio init` |
| `package.json` | the `$prismio` and `$prismio-ums` problem matchers (held to captured compiler output by a test) and the `[prismio]` editor defaults |

If a file grows past a few hundred lines, the logic it is gaining belongs in the server. Where the server answers wrong, the extension does not paper over it: the end-to-end checks write the gap down instead (the add-import quick fix for a module no file imports yet, and type completion in an unclosed parameter list, are the server's).

## How the grammar stays true

TextMate grammars are usually written by hand and drift. This one is generated from `prismio dump-tokens`, which prints the compiler's own token tables, by `scripts/generate-grammar.mjs`; the script holds only how a class of token is coloured, never the words. The committed snapshot of the tables is `syntaxes/tokens.json`. `test/grammar.test.mjs` fails when:

- the grammar is not what the generator makes of the snapshot;
- the snapshot is not what the compiler says now (when `PRISMIO` names a compiler): a keyword added to the language fails it until `PRISMIO=... npm run grammar -- --refresh` is run;
- the tables are empty, so a generator that produced nothing cannot pass; or
- a sample is not coloured as the language reads it (keywords, `0xFF_FF`, `0..<10` as two numbers and a range, escapes, `and`/`not`, calls).

A TextMate grammar cannot see context, so a contextual keyword is coloured only where the table says it marks a declaration; the server's semantic tokens colour the rest.

## If you are changing this

- `npm run package` builds the `.vsix`; `test/package.test.mjs` holds what it ships to an allowlist (an IDE's `.idea/workspace.xml`, with local paths, once slipped in).
- `test/runTests.ts` uses the installed VS Code (`VSCODE_PATH` names another) with `--disable-extensions`. It opens copies of `test/fixtures/demo` and `test/fixtures/second` as one two-folder workspace and writes `prismio.path` into the workspace file (a window setting, which a folder's settings cannot set in a multi-root workspace), so the test needs `PRISMIO`, not a `prismio` on `PATH`.
- Position encoding is negotiated by the client library; the server converts between the compiler's byte columns and it in one module.
- Not done: publishing to the Marketplace (an account and a token the maintainer holds; the `.vsix` is on the GitHub release), and the extension itself on Windows (the server it starts has been run there, see [the language server](/tooling/language-server#windows)). The end-to-end suite is automated and also runs against the unpacked `.vsix`, so what ships is what was tested.
