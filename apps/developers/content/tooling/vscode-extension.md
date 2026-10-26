---
title: The VS Code extension
description: How the Prismio extension for VS Code is built, why it is under 150 lines of TypeScript, how its grammar is generated, and how to test it in a real VS Code.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-26"
tags: [vscode, editor, lsp, tooling]
related: [tooling/language-server, tooling/ide-protocol, tooling/intellij-plugin, compiler/cli]
---

An editor extension that knows the language has to be kept in step with the compiler, one release at a time. This one does not know the language: it starts `prismio lsp`, and everything an editor shows (errors, hover, completion, rename, formatting) is the toolchain's answer. What is left for the extension is finding the toolchain, colouring text before the server has answered, and offering the tasks `build.ums` declares. The code is in the `vscode-prismio` repository.

## See it work

The end-to-end suite starts the installed VS Code with the extension and a throwaway copy of a demo project, and asks the editor's own commands what they see:

```bash
cd vscode-prismio
npm install
PRISMIO=/path/to/prismio npm test
```

```text
ok   the sample program is clean, then an error shows with its code
ok   hover shows the signature and the comment, across files
ok   go to definition crosses files
ok   completion after a dot lists the members
ok   the outline lists the functions
ok   rename changes every use
ok   formatting uses prismio fmt
ok   semantic tokens colour the declarations
ok   tasks come from build.ums
```

Nine checks, run in VS Code 1.143, through `vscode.executeHoverProvider`, `executeDefinitionProvider`, `executeCompletionItemProvider`, `executeDocumentSymbolProvider`, `executeDocumentRenameProvider`, `executeFormatDocumentProvider` and `provideDocumentSemanticTokens`, so a feature the server answers and the client never wired up fails here.

## What the extension does

| File | Job |
|---|---|
| `src/extension.ts` | finds `prismio` (the `prismio.path` setting, then `PATH`, then `~/.prismio/bin`), starts `prismio lsp` through `vscode-languageclient`, restarts it on request or when the setting changes |
| `syntaxes/prismio.tmLanguage.json` | the TextMate grammar, **generated** |
| `language-configuration.json` | comments, brackets, auto-closing pairs, indentation |
| the task provider | `build`, `test`, `run <target>` and every `command` of `build.ums` (read by a line match, not a parse: the manifest's own validator is the toolchain's, and a wrong guess offers one task too many) |
| `prismio.debugTarget` | builds in the debug profile and starts CodeLLDB, or `cppdbg` with LLDB |

If the file grows past a few hundred lines, the logic it is gaining belongs in the server.

## How the grammar stays true

TextMate grammars are usually written by hand and drift. This one is generated from `prismio dump-tokens`, which prints the compiler's own token tables, by `scripts/generate-grammar.mjs`; the script holds only how a class of token is coloured, never the words. The committed snapshot of the tables is `syntaxes/tokens.json`. `test/grammar.test.mjs` fails when:

- the grammar is not what the generator makes of the snapshot;
- the snapshot is not what the compiler says now (when `PRISMIO` names a compiler): a keyword added to the language fails it until `PRISMIO=... npm run grammar -- --refresh` is run;
- the tables are empty, so a generator that produced nothing cannot pass; or
- a sample is not coloured as the language reads it (keywords, `0xFF_FF`, `0..<10` as two numbers and a range, escapes, `and`/`not`, calls).

A TextMate grammar cannot see context, so a contextual keyword is coloured only where the table says it marks a declaration; the server's semantic tokens colour the rest.

## If you are changing this

- `npm run package` builds the `.vsix` (`out/test` is left out by `.vscodeignore`).
- `test/runTests.ts` uses the installed VS Code (`VSCODE_PATH` names another). It writes `prismio.path` into the demo copy's settings, so the test needs `PRISMIO`, not a `prismio` on `PATH`.
- Position encoding is negotiated by the client library; the server converts between the compiler's byte columns and it in one module.
- Not done: a grammar for `build.ums` (it has the language configuration, and the server's diagnostics and completion), publishing to the Marketplace, and Windows.
