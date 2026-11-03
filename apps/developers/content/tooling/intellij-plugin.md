---
title: The IntelliJ plugin
description: How the Prismio plugin for JetBrains IDEs finds a compiler, talks to its language server, builds run configurations and creates projects, and the little that must change with the compiler.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-29"
tags: [ide, intellij, plugin, tooling]
related: [tooling/language-server, tooling/ide-protocol, tooling/ums-overview, tooling/compiler-host-and-promotion, compiler/diagnostics, start/repository-tour]
---

The plugin is a separate repository, `jetbrains-plugin`, beside the compiler, and it is a client of [the language server](/tooling/language-server): `prismio lsp`, started through the platform's LSP client. Errors, hover, completion, hints, parameter info, definitions (into the library too), usages, rename, the outline, Go to Symbol, the import quick fix and Reformat Code are the compiler's answers, so a language change reaches the editor with the toolchain. What stays in the plugin is what must answer before a server can (colours, brackets, typing, indentation) and what is the IDE's own (run configurations, the project wizard, the manifest's colours). It was fifteen thousand lines of Java that re-implemented the language and is eight thousand now.

Users of the plugin should read [the user guide](https://docs.prismio.org/guides/intellij). This page is for changing it.

## Build and test

```bash
cd ../jetbrains-plugin
./gradlew test --offline -Dprismio.checkout=/path/to/prismio -Dprismio.compiler=/path/to/toolchain/bin/gen   # most tests need both
./gradlew verifyPlugin buildPlugin --offline                    # compatibility, then the zip
./gradlew verifyPlugin --offline -Pprismio.verifyIdes="/path/CLion.app:/path/WebStorm.app"   # more IDEs
```

It targets IntelliJ Platform 2026.2.1 with a Java 26 toolchain emitting Java 25 bytecode. JFlex and Grammar-Kit are not available offline, so neither is used. Without `-Dprismio.checkout` and `-Dprismio.compiler` the corpus and server tests skip silently and a green run proves less than it looks. The compiler must not be named `prismio` (a launcher forwards by that name); the tests set `PRISMIO_INTERNAL_HOSTED`.

`verifyPlugin` runs against two IDEA builds by default, plus any IDE installs named in `-Pprismio.verifyIdes` (paths separated by `:`; the property is optional so a contributor with one IDE still builds). The plugin claims every JetBrains IDE, so run it against the IDEs you have before a release: it is the only thing that says a platform API exists there. It is the gate for API use: an `@ApiStatus.Experimental` API is a warning, an `@ApiStatus.Internal` one fails the build. The plugin has six experimental warnings, all from `InlineDocumentationProvider`, which has no stable replacement. Do not reach for an internal class to get a feature; there was one (see [documentation comments](#documentation-comments)).

## What must follow the compiler

Both lexers are hand-written and there is no generated source. A contextual keyword (`private`, `dyn`, `pin`, `produce`) is reserved in one position and an identifier in another, which a regular expression cannot decide. The lexer has to colour a file before any server answers, so it keeps tables, and a test keeps them honest.

| Plugin file | Follows |
|---|---|
| `lexer/PrismioLexer.java` | `src/lexer/scanner.psm` |
| `lang/PrismioWords.java` | `prismio dump-tokens`: `PrismioTokenTablesTest` fails when they differ |
| `ums/UmsLexer.java` | `ums/parser/lexer.psm` |
| `ums/UmsWords.java` | `ums/model/lowering.psm` |
| `wizard/PrismioProjectStep.java` | `initUmsProject` in `src/project/ums_cli.psm` |

`PrismioTokenTablesTest` compares the keywords, the contextual words and the built-in types with the compiler's own and lexes every operator and separator it lists; it found that `...` lexed as a range and a dot. `PrismioLexerCorpusTest` lexes every `.psm` and `.ums` in a checkout and fails on a bad character or an offset gap. Run both after a change to the scanner or to syntax. A change to anything else (a declaration form, a call shape) costs the plugin nothing, provided the compiler's index names it.

The PSI is a flat token list, and nothing in it resolves a name: there is no reference, no scope resolver and no type inference in the plugin.

## Finding the compiler

`PrismioToolchainService` returns the first of:

1. the path in Settings, if it is a working executable;
2. in a trusted project only, the host the manifest declares as `toolchain.host` (and only with its `.trusted` stamp beside it, the launcher's own rule), then `.prismio/build/debug`, `.prismio/build/release` and `.prismio/bin`;
3. `PRISMIO`, then `PRISMIO_HOME/bin`;
4. `PATH`;
5. `~/.prismio/bin`, `~/.local/bin`, `/usr/local/bin`, `/opt/homebrew/bin`.

Two rules are deliberate. A project-local compiler runs on every edit, before the user has done anything but open the project, so it is never used in a project the IDE does not trust: a repository can commit a `.prismio/`. And `PATH`, `PRISMIO` and `PRISMIO_HOME` are read with `EnvironmentUtil`, not `System.getenv`, because an IDE started from the Dock has launchd's environment and never sees what a shell profile added. `detectInstalledCompiler()` is steps 3 to 5 with no project, which is what the New Project wizard and Auto-Detect use; Auto-Detect deliberately ignores the saved path, or it could only ever return it.

The standard library is the compiler's: the server reads it from the toolchain that started it, and the plugin keeps no index of it. (A project setting for a library path used to exist, for tests; it is gone with the code that read it.)

## The language server

`io.prismio.lsp` is a `LspServerSupportProvider` (loaded only where the platform has an LSP client) that starts the compiler's `prismio lsp` with `PRISMIO_INTERNAL_HOSTED=1`, so a project's own host cannot take it over. Which program a file belongs to, the unsaved buffers, the cancellation and the timeouts are the server's ([the language server](/tooling/language-server)); the plugin's part is small.

- **`PrismioLspFeatures.SERVED`** lists the server's features the editor uses, by the platform's name for each (`diagnostics`, `hover`, `completion`, `goToDefinition`, `findReferences`, `rename`, `documentSymbol`, `workspaceSymbol`, `documentHighlights`, `formatting`, `semanticTokens`...). The platform client has a customizer for everything the server advertises, so a feature the plugin still answers itself is switched off until it is deleted, and two answers to one question never meet.
- **Names are coloured by the server.** `semanticTokens` is served: `shouldAskServerForSemanticTokens` is overridden for a Prismio file (the platform's default is plain text) and the server's legend (`namespace`, `enum`, `interface`, `struct`, `typeParameter`, `parameter`, `variable`, `property`, `enumMember`, `function`, `method`; modifiers `declaration` and `readonly`) is mapped onto the plugin's own colour keys in `PrismioLspFeatures.semanticKey`, so the colour scheme page applies. The lexer colours first and keeps its word tables, `STDLIB_TYPES` among them, until the server's answer replaces them; `STDLIB_TYPES` is the one table `dump-tokens` cannot check and is a first guess.
- **Three platform defaults are plain text only**: `LspRenameSupport.shouldRunRename`, `LspDocumentHighlightsSupport.shouldAskServerForDocumentHighlights` and `LspFormattingSupport.shouldFormatThisFileExclusivelyByServer` are true for text and TextMate files and false for any other language. A test that talks to the server directly cannot see it: Rename was greyed out in a real IDE until `PrismioLspFeatures` said "a Prismio file" for each (`PrismioLspFeaturesTest`).
- **The setting** *Use the Prismio language server* starts and stops the server live (a settings topic); with it off the plugin keeps highlighting, folding, typing and running.
- **A definition in the library** opens the source the server wrote out of the `.plib` into its scratch directory (`prismio library-source`); that file is read-only in effect, since it is regenerated.

The tests are `PrismioServer*Test` (hover, hints and parameter info, completion, navigation: each asks the server what the plugin's own Java used to answer, so the plugin's old test cases are the acceptance), and the differentials a feature was held to before its Java was deleted are in Git history. Use the IDE too: `./gradlew --offline -I init.gradle runIde` with an init script that sets `args` of `runIde` to a project, and `PRISMIO=<toolchain>/bin/prismio` in the environment. It found Rename, usage highlights and server formatting off, and two noisy hints (`items:` before a receiver, `value:` on `println`) that every test had passed.

## Run configurations

`UmsRunConfigurations` reads every `build.ums` in the project, ignoring ones below `.prismio/`, `build/`, `fixtures/`, `testData/`, `node_modules/` and `.git/` — judged against the path inside the project, so a project that itself lives under `~/build/` still gets entries. It creates one configuration per executable target, plus Build, Test and a configuration per `command`, and syncs again when a `build.ums` is saved, created, moved or deleted. A configuration it generated is removed when its target leaves the manifest; one a user made or copied is never touched.

`PrismioRunProfileState.arguments` maps a configuration to a command line. Program arguments follow a `--`, because without it `prismio run` reads them as its own and refuses the first it does not know (P1050). A program's exit status is the process's, so "exit code N" is the program's answer.

**Colour.** The IDE console is a pipe, so a program asks `isatty` and gets no. The plugin therefore sets `FORCE_COLOR=1` (unless `NO_COLOR` or `FORCE_COLOR` is already set) and starts the process with `ProcessHandlerFactory.createColoredProcessHandler`: a plain `OSProcessHandler` does not decode escape sequences, and the console would print them as text. On the runtime side, `prismio_rt_color_supported` in `runtime/program_support.c` is what `std.term` asks; it answers yes for `FORCE_COLOR` or `CLICOLOR_FORCE` (other than `0`) on a pipe, and `NO_COLOR` still wins. The compiler's own diagnostics (`src/common/terminal.psm`) have honoured the same variables from the start. A toolchain built before that runtime change prints plain text in the IDE.

`PrismioConsoleFilter` links every `file.psm:line:col` on an output line, resolving it against the project, then the file system, then by file name.

## Creating projects

**File | New | Project | Prismio** is two classes, because the IDEs do not share a New Project dialog. A `GeneratorNewProjectWizard` works only where the Java plugin is, which is IntelliJ IDEA; CLion, PyCharm, WebStorm, Rider and RustRover list `DirectoryProjectGenerator`s instead. Both are registered, and both write the same project through `PrismioProjectFiles` and ask for the compiler through `CompilerSelector`, so the two dialogs cannot drift. IDEA shows Prismio once.

**IntelliJ IDEA** (`PrismioNewProjectWizard`): the steps chain as root, `NewProjectWizardBaseStep` (name and location), `GitNewProjectWizardStep` (the platform's own "Create Git repository"), then `PrismioProjectStep`.

**The other IDEs** (`PrismioDirectoryProjectGenerator`): two things are easy to get wrong, and both left CLion's dialog with a Location field and nothing else.

- The generator must also implement `CustomStepProjectGenerator` and return a `ProjectSettingsStepBase`, as CLion's own Rust and Meson generators do. Without it CLion shows a default step that draws only Location.
- The panel comes from `ProjectGeneratorPeer.getComponent(location, checkValid)`, which receives CLion's Location field. The no-argument `getComponent()` is deprecated, and `buildUI(SettingsStep)` is for dialogs that build a settings step; override the first.

That dialog has no Name or Git option, so the peer adds them. Name and the Location field are one fact told twice: the name is the last folder of the location, each rewrites the other, and a guard stops the two listeners from calling each other. "Create Git repository" calls `GitRepositoryInitializer.getInstance()` after the files are written, off the UI thread, and is not offered when that is null (no Git plugin).

**The compiler row** (`CompilerSelector`) refuses to create until `compiler --version` answers with a first line `prismio <version>`; the version it read becomes the manifest's `prismio` line, as `init` writes `PRISMIO_VERSION`. The check runs off the UI thread as the field changes, and validation falls back to asking again synchronously if it has not returned; the other dialog is told to validate again through the `checkValid` runnable. A compiler other than the one `detectInstalledCompiler()` finds is stored in the new project's settings; the default stores nothing, so there is no setting to go stale when the toolchain moves.

The files are `build.ums`, `src/main.psm` and `.gitignore` containing `.prismio/`, written only where absent. The project name is the chosen name with anything `umsValidName` would refuse replaced by `_`, so the plugin cannot write a manifest the compiler then rejects.

**New | UMS Manifest** writes `build.ums` with no prompt, because it is the only name the compiler and the plugin read, and names the project after the folder.

## Documentation comments

The compiler has no documentation syntax. The scanner skips every comment, `/** */` included, so the plugin's lexer makes the rule: `/**` followed by something other than `/` or `*` is a `DOC_COMMENT`, so `/**/` and `/***/` stay ordinary block comments. `///` is read as prose by the same convention. Anything that looks for comments must handle both token types, which is the easy thing to miss: the formatter, the Enter handler and several token scans once recognised only `BLOCK_COMMENT`.

**Reformat Code and range formatting go to the server**, which runs `prismio fmt`, so the IDE, the command line and every other editor format by the same rules. `PrismioBlock` is an indenter and does not space tokens: it answers the indent of the line being typed, which a server cannot, and indents when the server is off, leaving the white space between two tokens as written. It once had spacing rules of its own and changed 19 of 217 files that `prismio fmt` had formatted; `PrismioFormatterDifferentialTest` holds it to changing none. `PrismioEnterHandler` sets the new line's indent and does not add to the one the platform already gave it.

`PrismioBlockCommentPostFormatProcessor` indents the lines inside a multi-line comment whose opener is alone on its line, and keeps a comment with a star on every line aligned one column in under the opener. It changes a comment's text, so a comment already in that shape must come out unchanged; `PrismioFormatterTest` fails on a flattened starred comment.

Rendering is IntelliJ's global "Render documentation comments" setting. The only per-editor switch, `DocRenderManager`, is `@ApiStatus.Internal` and `verifyPlugin` fails on it, so the plugin sets the global setting once, guarded by a stored flag, and never again; a user who turns it off keeps it off.

## Before a release

Run the tests with a checkout and a compiler, `verifyPlugin`, and `buildPlugin`; open a project in `runIde` and use hover, completion, Go to Declaration, Rename and Reformat Code once; read the verifier's output rather than its exit code, since an experimental warning and a deprecated API look alike in a summary. Check the version in `build.gradle.kts` is not one already on the Marketplace. The plugin installs only in 2026.2 or newer, so a 2026.1 IDE (the PyCharm and Rider installs a contributor may have) cannot load it and is not a test target. The New Project dialog is the one place the IDEs differ and the verifier cannot see, so open it in IDEA and in CLion by hand: a missing row looks like a pass to the verifier.
