---
title: The language server
description: How `prismio lsp` answers an editor from the compiler's own analysis, what it keeps in memory and why that is so little, and how to test and measure it.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-29"
tags: [lsp, ide, tooling, memory]
related: [tooling/ide-protocol, tooling/intellij-plugin, tooling/vscode-extension, compiler/cli]
---

An editor wants errors as you type, a type on hover, completion after a dot, rename. Teaching each editor the language means writing the language twice, once in Java for IntelliJ and once in TypeScript for VS Code, and keeping both in step with the compiler. `prismio lsp` avoids that: it answers all of it from the compiler's own analysis, over the Language Server Protocol, so every editor is a thin client. The IntelliJ plugin went from fifteen thousand lines of Java to eight thousand by deleting what the server now answers; the VS Code extension is 154 lines of TypeScript.

## See it work

Ask the server what it says about a file, with no editor, by driving it the way the test client does:

```bash
python3 - <<'EOF'
import sys
sys.path.insert(0, "tests")
from lsp_client import LspClient
import pathlib, tempfile
root = pathlib.Path(tempfile.mkdtemp())
file = root / "demo.psm"
text = "fn add(a: Int, b: Int) -> Int { return a + b }\nfn main() -> Int { return add(1, missing) }\n"
file.write_text(text)
client = LspClient(["prismio", "lsp"], env={"PRISMIO_INTERNAL_HOSTED": "1"})
client.initialize(root.as_uri())
client.notify("textDocument/didOpen", {"textDocument": {"uri": file.as_uri(), "languageId": "prismio", "version": 1, "text": text}})
for d in client.diagnostics_for(file.as_uri())["diagnostics"]:
    print(d["range"]["start"], d["code"], d["message"])
client.shutdown()
EOF
```

```text
{'line': 1, 'character': 33} P4001 unknown identifier `missing`
```

`tests/lsp_client.py` is a complete client in 130 lines; the `lsp`, `lsp_features`, `lsp_manifest` and `lsp_workspace` fixtures in `tests/test_runner.py` are the reference for every behaviour below.

## What it answers

| Request | Comes from |
|---|---|
| diagnostics | `prismio check --partial`, per program, debounced 150 ms after the last edit |
| hover, definition, type definition, references, highlights, outline, workspace symbols, signature help, inlay hints, semantic tokens, folding, prepare rename, rename, code actions | the **semantic index** the same check writes (`--emit-index`) |
| completion | the compiler, asked at the cursor with a placeholder identifier in place of the word being typed (`check --complete`) |
| formatting, range formatting | `prismio fmt` |
| `build.ums` diagnostics | `prismio check build.ums` |
| `build.ums` completion | a table in `lsp/manifest.psm`, tested against what the manifest loader accepts |

Everything else answers `-32601`. Capabilities are advertised only for what works.

**A definition in the library** is a position in the source a compiled module carries. A `.plib` is binary (its header holds NUL bytes, which a Prismio `String` cannot), so the server asks the compiler for the text, `prismio library-source <file.plib> <module>`, writes it once into its scratch directory as `stdlib/<name>.psm`, and answers with that file. An `import std.io` resolves to the same file.

**Hints name what was written.** A parameter-name hint is given for an argument the author wrote, in a function of more than one parameter: not the receiver of `xs.contains(3)` (written before the dot), not a call sema made up (`println(x)` is split into one write per value), and not the one parameter of `println(value)`.

## Which program a file belongs to

The compiler cannot check a module alone: its imports resolve against the program's entry directory and the program's modules share names. The server therefore decides, in `lsp/projects.psm`, which program to check and passes the open file as an overlay:

1. a file that declares `fn main(` is a program;
2. a module of the standard library in a checkout is checked alone as `--module std.<leaf>`;
3. otherwise the entry of the nearest `build.ums` target whose directory holds the file;
4. otherwise the first program, found from the file's directory upward, that imports it;
5. otherwise the file alone.

Each manifest is read once per change of the file (size and time), not once per request: see the memory section for why.

## Memory: the rules the server is written by

A language server lives for hours and is asked something hundreds of times a minute. Prismio has no garbage collector, so a leak per request is a process that the operating system eventually kills. The first version leaked 2.2 GB after twenty edits of a 99 KiB file. What it is held to now, in `tests/test_runner.py`: 130 rounds of six requests on a 99 KiB document grow the server by less than 6,000 KiB (it measures about 450).

1. **The server is its own program, `prismio-lsp`**, not part of the compiler binary. The ownership analysis is whole-program and shares one allocation site per library function; the compiler stores `substring` and `concat` results in containers all over its 85,000 lines, so linked into it every string the server read was treated as escaping and never released. `prismio lsp` starts the program beside it, so the command is unchanged.
2. **A `String` function allocates on every path.** `return "".clone()`, never a literal on one path.
3. **Do not replace anything in a `Vec<String>` or a struct field.** A displaced element is kept until the `Vec` dies; a field store through `self` never releases. A local `let mut` does. This is why an open document's text lives in a file in the scratch directory, which is also the overlay handed to the compiler.
4. **`slice`, not `substring`, on a large parameter.** A `substring` of the document inside `completionItems` made the whole program treat the document as never released: every request path that passed it on leaked a copy, including hover, which never completes anything. `slice` is the same cut by another route.
5. **A `for line in readLines(path)` left by `return` or `break` leaks a descriptor and a 64 KiB buffer.** Bind `let mut lines = readLines(path)`, iterate `lines`, and call `lines.close()` before leaving early. `--verify` cannot see it (the memory is the C runtime's): the process's RSS grew 66 KiB per request, linearly.
6. **Never load a manifest on a request path.** `umsLex` over the repository's own `build.ums` leaks about 20 KB a call (a `Vec` of structs that hold strings is not released), which is nothing for `prismio build` and fatal for a server. Diagnostics for a manifest run in a child (`prismio check build.ums`) and the program a file belongs to is cached per manifest change.

### How to measure it

Build the server alone with the allocation ledger, in a packaged layout, and drive it with the test client:

```bash
prismio build lsp/main.psm --verify -o /tmp/lspv
```

Read **peak live bytes** in the ledger printed at exit, not the leaked count (parked values read as released), and watch the process's resident set (`ps -o rss= -p <pid>`) over a few hundred requests. A per-request-type loop finds the culprit fast: when one kind of request is clean and another leaks, stub the callee and see which stub clears it. Build in the checkout, not a copy of it: a copy changed which program a file belonged to and changed the numbers.

## Latency

Measured 2026-10-26 on an Apple M-series laptop, the edit reaching published diagnostics (150 ms of it is the debounce):

| Program | Edit to diagnostics |
|---|---|
| 2 lines | 162 ms |
| one 99 KiB function | 177 ms |
| a test program | 167 ms |
| one module of the compiler (136 files, 85,000 lines) | 1,225 ms |

Ordinary programs are inside the debounce; only the compiler checking itself is slow. That is where a parse cache or a body-independent item summary would pay, and nothing else has asked for one, so none is built.

## What the index must name

The editor can only say what the index recorded, and the index (`src/index/`) is held to the compiler's own corpus: `tools/check_index.py` runs it over 359 programs and fails on a reference that points at the wrong name, at a declaration that does not exist, or at nothing. When an editor misses a name, the fix is a reference in the walker, not a table in a client. Held to the IntelliJ plugin's resolver over the checkout's tests (3,961 names), the first run found sixty the index lacked: a trait's name in `Trait.method(x)`, a field through a `Ptr<mut T>`, an `extern fn`'s result type, a parameter pack's name, `made<Int>()` and `mapNew<K, V>()` with the types in the brackets, `Maybe<Int>.None` and `Shape<Int>.Rect { }` (also in a pattern), and the constants a folded `Array<Int, N * N>` or `grid.length` named. Several are a name sema folded away or rewrote, so the walker reads the text where the tree has nothing.

## Windows

One index can hold one file in two spellings: `C:/work/a.psm` (the path an overlay was given as) and `C:\work\a.psm` (the compiler's own join of an import). The server compares paths as text after `pathCanonical` (forward slashes, an upper-case drive letter), and the compiler keys an overlay by the same spelling (`overlayKey` in `src/driver/imports.psm`); before that, a module open in the editor was never found to belong to the program that imports it, and every reference from the other file was missing. `prismio lsp` is a launcher that runs the server: Windows has no `execvp`, and `_execvp` exits the launcher at once with status 0, which an editor reads as the server ending, so the Windows `proc_exec` waits for the program and exits with its status. A wait (`std.poll`) follows the clock rather than counting 1 ms sleeps, which last 15 ms on Windows. The `lsp` fixtures run there with two checks honestly skipped (a killed check needs a POSIX shell script; the server's memory is measured through `ps`).

## If you are changing this

- Add a feature to `lsp/features.psm`, read the index through `lsp/index.psm`, and add the request to `isFeature` and `writeProviders` in `lsp/server.psm`. A place in the document is converted between the compiler's byte columns and the client's encoding in exactly one module, `lsp/positions.psm`.
- Positions in the index are 1-based lines and UTF-8 byte columns; a declaration's name span is the AST node's span except for `let mut` and `inout`, where it is the keyword and `ixNameToken` scans forward.
- Run `tools/check_index.py` after a change to `src/index/`, and `lsp_features` after any change: it holds the memory limit. Run it against a packaged compiler under a clean `TMPDIR`: a server killed earlier leaves `prismio-lsp-*` directories behind and the fixture reports them.
