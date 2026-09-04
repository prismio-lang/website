---
title: Install the Prismio compiler
description: Configure LLVM 22 and bootstrap a Prismio 0.1 compiler on Windows, macOS, or Linux.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [installation, bootstrap, llvm]
related: [start/hello-world, compiler/bootstrap, compiler/targets]
---

Prismio 0.1 is installed from the compiler repository. There is not yet a stable package-channel installer, signed binary channel, or package-manager formula. The website's **Install** button takes you to the canonical installation entry point; the source bootstrap below is the current supported path.

This guide installs a local compiler without changing the language source. Keep the repository available after installation because the runtime sources and bootstrap tools are part of the current toolchain.

## Requirements

- Python 3.8 or newer
- A C/LLVM toolchain compatible with LLVM 22 IR
- Git and a shell; PowerShell scripts are supplied for Windows

The repository pins the supported LLVM line to **22.1.8**. Apple Clang is not interchangeable with that LLVM IR version; on macOS, use the LLVM toolchain configured by the setup script.

Before bootstrapping, check the prerequisites available on your path:

```bash
python3 --version
git --version
```

On Windows, use `python --version` in PowerShell if that is how Python is registered. The setup helper installs or locates the expected LLVM toolchain for the repository scripts; avoid manually substituting an older system LLVM.

## Get the source

Clone the compiler repository and run installation commands from its root:

```bash
git clone https://github.com/prismio-lang/prismio.git prismio
cd prismio
```

If you are using a source archive or an existing checkout, verify that it corresponds to the documentation version shown at the top of this page. The `main` branch can move ahead of the 0.1.0 reference.

## macOS and Linux

```bash
python3 tools/setup_llvm.py
tools/bootstrap.sh --seed --out build/prismio
./build/prismio --version
```

`tools/setup_llvm.py` prepares the pinned LLVM dependency. `tools/bootstrap.sh --seed` begins with the committed trusted seed and writes a self-hosted compiler to the requested output path.

The output path may be absolute or repository-relative. Keep generation binaries under `build/` while developing so they remain separate from source.

## Windows

```powershell
python tools/setup_llvm.py
./tools/bootstrap.ps1 -Seed -Out build/prismio.exe
./build/prismio.exe --version
```

Run the commands from PowerShell. The repository provides a PowerShell bootstrap path so you do not need to translate the shell script manually.

An installed binary should report Prismio `0.1.0` and LLVM `22.1.8`.

## Put the compiler on your path

You can invoke the binary directly from `build/`, or copy/link it into a user-owned tools directory already present on `PATH`. Path management is platform-specific and does not change Prismio's import behavior.

Confirm which executable your shell finds:

```bash
prismio --version
```

During compiler development, prefer an explicit path such as `./build/prismio`. That prevents an older globally discoverable binary from accidentally building a new generation.

## Verify the toolchain

Build a second generation with the compiler you just created. A successful self-host confirms that the executable can compile the current source tree.

```bash
tools/bootstrap.sh --compiler build/prismio --out build/prismio-next
```

Then compile a minimal program:

```bash
./build/prismio run examples/hello.psm
```

If your checkout does not contain that example path, create the program from [Hello, Prismio](/start/hello-world) and pass its local `.psm` path.

## Upgrade or switch versions

Prismio 0.1 does not have an in-place update command. Check out the desired compiler revision, repeat LLVM setup when the pinned toolchain changes, and bootstrap a new output binary. Keep the old binary until the new generation passes `--version`, a self-host, and the regression tests relevant to your project.

Documentation versions are designed to remain separately addressable. Always compare the page version with the compiler output before relying on experimental AIF behavior or ABI details.

## Troubleshooting

If bootstrap cannot find LLVM, rerun the repository setup helper and use the paths it configures rather than the platform's default `clang`. If linking fails, confirm the target toolchain and runtime objects exist for your operating system. If a generation can compile applications but not the compiler, run the fixed-point workflow in [Bootstrapping](/compiler/bootstrap) to isolate the first divergent generation.

The current CI exercises Windows, macOS, and Linux. A platform being present in CI does not make every system linker or C library version interchangeable; include the exact command, compiler version, LLVM version, and host target in bug reports.

See [Bootstrapping](/compiler/bootstrap) for fixed-point verification and platform-specific details.
