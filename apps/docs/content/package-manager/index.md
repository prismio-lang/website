---
title: Package manager
description: The UMS manifest, project commands, path dependencies and the lockfile in Prismio 0.1, and what a registry would still add.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-03"
tags: [package-manager, registry, dependencies, manifest, lockfile]
related: [language/modules, guides/modules, roadmap]
---

Prismio 0.1 has a **manifest**, a **lockfile**, and **local path dependencies**. It has **no registry**, so a dependency that does not name a local path cannot be fetched.

## Commands

Every command below reads `build.ums`, found at or above the working directory,
and writes to `.prismio/build/<profile>/`.

| Command | Does |
|---|---|
| `prismio init [name]` | scaffold a project here, or in a new directory |
| `prismio build [--release]` | build every executable or compiler target |
| `prismio run [--release]` | build, then run the executable target |
| `prismio test [--release]` | build and run every `test(...)` target |
| `prismio clean [--release]` | remove this profile's build output |
| `prismio <name> [args...]` | run a command the manifest declares |

A project command is the same command with **no source named**. `prismio build`
builds the project; `prismio build src/main.psm` builds that one file and needs no
manifest at all.

```bash
prismio init hello
cd hello
prismio run
```

That writes three files and nothing else:

```
hello/
├── build.ums
├── .gitignore          # .prismio/
└── src/
    └── main.psm
```

`init` refuses if `build.ums` already exists, and never rewrites a `.gitignore`
or `src/main.psm` it did not create.

## Tests

A `test(...)` target is an ordinary program, and **it passes when it exits 0**.
That is the whole protocol — Prismio has no assertion library and no test
attribute, so nothing richer would be a promise the language could keep.

```ums
targets {
    executable("hello") {
        entry = "src/main.psm"
    }

    test("parser") {
        entry = "tests/parser.psm"
    }
}
```

```
$ prismio test
running 1 test(s)
  ok    parser
1 passed, 0 failed
```

`prismio test` exits non-zero when any test fails, so it works as a CI step.
`prismio build` does **not** build test targets — the ordinary build is the one
run constantly, and paying for the test programs every time buys nothing.

## The manifest

`build.ums` is the required description of a project. Running `prismio build`
with no source argument finds the nearest ancestor manifest, validates it, and
builds each target into `.prismio/build/<profile>/`.

```ums
project {
    name = "app"
    version = "0.1.0"
    prismio = "0.1"
}

targets {
    executable("app") {
        entry = "src/main.psm"
    }
}

dependencies {
    implementation("json", "1.2.0", "../json")
}
```

The explicit form still works and ignores the manifest entirely:

```text
prismio build src/main.psm -o app
```

That is single-file mode, not an implicit project. A directory becomes a
Prismio project by having `build.ums`, just as a Cargo project is identified by
its manifest.

The Prismio compiler repository uses the additional self-hosting target:

```ums
toolchain {
    host = ".prismio/build/debug/prismio"
}

targets {
    executable("prismio") {
        entry = "src/main.psm"
        link {
            component("prismio.backend")
        }
    }
}
```

Artifact shape and native linkage are separate axes: this is still an
`executable`, and `component("prismio.backend")` is what adds the compiler
backend and the LLVM C API it calls. The optional first `toolchain` block makes
global Prismio forward commands to that local compiler once it exists, and the
target whose output path equals `toolchain.host` is the one allowed to replace
the running compiler. An ordinary application declares no component and links
only the Prismio runtime.

## Project commands

A `commands` block declares commands the project owns. Each is a name, an
optional `description`, and one or more steps run in declaration order; the
command stops at the first step that fails.

```ums
commands {
    command("dist") {
        description = "Package a release archive"
        build("app")
        run("tools/package.py", "--out", "dist", args)
    }
}
```

`prismio dist` then runs it, and `prismio dist --keep-symbols` passes
`--keep-symbols` through. Two step forms:

**`build("target")`** builds a declared target and takes nothing else.

**`run(subject, "arg", ...)`** runs one thing, and works out how from the
subject:

| Subject | What happens |
|---|---|
| a declared target | it is built, then executed |
| a `.py` file | run under this host's Python |
| a `.psm` file | compiled into the profile's build directory, then executed |

Anything else is a manifest error rather than a guess, because the toolchain has
to know how to start what it is given. A `.psm` tool is not a declared target and
does not become one: a target is something the project builds every time, a tool
is something it runs when asked.

**`shell("program", "arg", ...)`** is the escape hatch, and its portability is
yours. A program written with a path separator resolves against the project root;
a bare name is left to `PATH`. A `.sh` step is a broken step on Windows, where the
line is handed to `cmd /S /C` — which is why `run` exists and why the Prismio
repository's own tools are Python.

Every argument of every step is quoted for the platform's shell, so an argument
containing spaces or metacharacters stays one argument. The bare word `args`
splices in whatever the user typed after the command name, keeping its position
among the fixed arguments; it is the only identifier a step argument accepts.

Built-in commands win. A manifest that names one of `init`, `build`, `run`,
`test`, `clean`, `check`, `bootstrap`, `aif`, `dump-ast` or `runtime-hash` is
rejected when it loads, so a project cannot quietly redefine what
`prismio build` means, and a future release adding a verb fails loudly rather
than silently taking one over.

A `build` step may not name the `toolchain.host` target: the rebuilt compiler is
promoted by the global parent only after the process exits, so later steps in the
same command would still be running the previous one.

## Dependencies

A dependency takes a name and a version constraint, and optionally a third argument: a **local path**.

| Form | Meaning |
| --- | --- |
| `implementation("json", "1.2.0", "../json")` | path dependency — resolves to that directory |
| `implementation("json", "1.2.0")` | registry dependency — fails, there is no registry |

Scopes are `implementation`, `api`, and `testImplementation`.

A path is resolved against the directory holding `build.ums`, not against the working directory. Those differ whenever you run `prismio build` from a subdirectory, and resolving against the working directory would make one manifest mean different things depending on where it was invoked.

A path that does not name an existing directory is an error (`UMS2210`), and the directory is **not** created for you.

A dependency with no path reports `UMS2211` and names the third-argument form as the fix. This is the one step with nothing behind it: the dependency is modelled, validated, and written to the lockfile exactly like a path dependency, and only the fetch is missing.

## The lockfile

Resolution writes `.prismio/prismio.lock` before it reports any failure, so the file describes the attempt rather than only the successes.

```text
# prismio lockfile v1
# generated from /path/to/build.ums
# scope	name	constraint	source	resolved
implementation	json	1.2.0	path	/path/to/json
implementation	http	2.0.0	registry	-
```

One row per declared dependency, in manifest order, tab-separated. An unresolved dependency is written with `-` rather than omitted, so the row count matches the manifest and a failed fetch is visible in a diff instead of absent from one. Check it in: it exists to be reviewed.

## Not implemented

There is no registry, so no package identity beyond a name, no version *solving* (a constraint is recorded, not satisfied), no integrity verification, no binary dependencies, no offline cache, and no workspace with multiple projects.

A resolved path dependency is recorded but is **not yet added to the import search**, so importing modules from one is still done by vendoring the source beneath your entry module and using dotted imports. Wiring resolution into module resolution is the next step, not part of 0.1.

Do not use a third-party manifest format as though it were part of Prismio.
