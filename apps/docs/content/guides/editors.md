---
title: Set up your editor
description: Get errors as you type, completion, hover, go to definition, rename and formatting in VS Code and the JetBrains IDEs.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-13"
tags: [guide, editor, lsp, vscode, intellij, formatting]
related: [guides/intellij, start/installation, compiler/cli, compiler/diagnostics]
---

Without editor support you write a file, switch to a terminal, run `prismio check`, and read the errors there. The Prismio toolchain includes a language server, `prismio lsp`, that does what that terminal does while you type, and answers the other things an editor asks: what is the type of this, where is it declared, what can I write after the dot. Both editors below are thin clients of the same server, so they all know exactly what your compiler knows.

You need nothing but the toolchain: [install it](/start/installation), and check that the server is there:

```bash
ls "$(dirname "$(command -v prismio)")/prismio-lsp"
```

If it is not there, `prismio lsp` refuses to start and names what is missing (`P1099`).

## VS Code

Install the **Prismio** extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Prismio.prismio): search for Prismio in the Extensions view, or run

```bash
code --install-extension Prismio.prismio
```

It needs VS Code 1.100 or newer.

Open a folder with a `build.ums` or any `.psm` file; `.psm` files carry the Prismio logo in the explorer and on their tabs, and `build.ums` the manifest's mark. The extension finds `prismio` on your `PATH`, then in `~/.prismio/bin`; to use another one, set `prismio.path`. After installing a newer toolchain, run **Prismio: Restart Language Server** from the command palette.

You get errors as you type (with the compiler's `P####` codes), hover, go to definition (into the standard library's source too), find references, rename, completion, signature help, inlay hints, semantic colours, folding, the outline, the import quick fix and format document. The **Tasks** menu lists `build`, `test`, `run <target>` and every `command` your `build.ums` declares; **Prismio: Build and Debug a Target** builds in the debug profile and starts CodeLLDB (or `cppdbg` with LLDB) on the result.

## IntelliJ and other JetBrains IDEs

The plugin starts the same server through the IDE's own language client, and everything it shows about the language (errors, completion, hover, hints, navigation, rename, formatting) is the server's. See [Use Prismio in IntelliJ](/guides/intellij) for installing it; the setting **Use the Prismio language server** (on by default) is under **Settings | Languages & Frameworks | Prismio**.

## Format on save

The formatter is a command of its own, so it can run in a hook or in CI as well as in the editor:

```bash
printf 'fn  add( a:Int,b:Int )->Int {\nreturn a+b\n}\n' > messy.psm
prismio fmt messy.psm --check
```

```text
would reformat messy.psm
```

The status is 1 when something would change, so `--check` is what CI runs. `--write` rewrites the file:

```bash
prismio fmt messy.psm --write
cat messy.psm
```

```text
fn add(a: Int, b: Int) -> Int {
    return a + b
}
```

`--range <from>:<to>` formats only those lines, which is what an editor's "format selection" sends.

Name files or folders, as many as you like. A folder stands for every `.psm` file under it, searched recursively, with hidden folders such as `.git` skipped:

```bash
prismio fmt --check src std lsp          # CI: exits 1 if any file would change
prismio fmt --write src tests/test_1.psm # a folder and a file in one command
```

Line breaks are yours, with one exception: an `if` that has an `else` (and an `else if` chain) is written over several lines, one branch to a block, with `} else {` kept together. An `if` with no `else` is left as written, on one line or several, and an empty branch stays `{ }`:

```text
if (a) { b() } else { c() }   →   if (a) {
                                      b()
                                  } else {
                                      c()
                                  }
```

## When something looks wrong

- **No errors appear and nothing completes.** The server did not start. In VS Code, open the **Prismio** output channel; in IntelliJ, the IDE log (**Help | Show Log**). A toolchain that has no `prismio-lsp` beside it refuses with `P1099`.
- **Errors you cannot reproduce with `prismio build`.** The editor checks each open file as part of its program, with your unsaved buffers. A file that belongs to no program is checked alone and may report names it would have got from the program that imports it. Put the program in a `build.ums` target.
- **A new toolchain, old behaviour.** The server is the toolchain's: restart it.
