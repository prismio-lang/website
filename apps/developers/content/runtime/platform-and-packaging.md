---
title: Runtime platforms and packaging
description: Platform abstraction, the packaged and project-local toolchain layouts, artifact discovery, and native targets.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [runtime, platforms, packaging]
related: [compiler/bootstrap, tooling/debugging-targets-and-build-tracing, start/development-setup]
---

`runtime/prismio_platform.h` centralizes platform differences used by the runtime and build
driver. Windows and POSIX implementations must agree on observable language behavior even when
threads, processes, paths, libraries, and object formats differ.

## Packaged layout

```text
<prefix>/
  bin/prismio                     the compiler
  lib/runtime/*.bc                one bitcode module per runtime translation unit
  lib/backend.a                   compiler-only; LLVM-facing backend
  lib/runtime.hash                the source hash those modules were built from
  stdlib/*.plib                   one compiled artifact per standard-library module
  third_party/llvm-paths.json     the LLVM that produced them
```

Everything is located relative to the running executable — `find_in_lib_dir` searches
`<exe>/../lib` then `<exe>/lib`, and `standardModulePath` reads `<exe>/../stdlib` — so a prefix
relocates as a unit and there is no installation path compiled in. **A lone `bin/prismio` is not a
compiler**: it can build compiler generations through the bootstrap path, which uses repository
sources, and cannot build a single ordinary program.

`lib/` holds what the driver consumes and a user never names. `stdlib/` sits outside it because it
*is* named — `import std.io` resolves through it — which is the line the split follows. Formats
are not the criterion: a `.plib` contains bitcode too. See
[Library artifacts](/runtime/library-artifacts) for both formats.

The application runtime is distinct from the compiler backend. Ordinary programs need language and
program support; a self-hosted compiler generation additionally links `backend.a` and the LLVM C
API.

## The local toolchain

`prismio build` on a project that declares `toolchain.host` writes the same layout beside the host
it promotes, with the profile directory as the `bin` directory:

```text
.prismio/build/debug/prismio       the host
.prismio/build/lib/runtime/*.bc
.prismio/build/stdlib/*.plib
```

`compiler_emit_local_toolchain` produces it, and the artifacts are byte-identical to what
`tools/package.py` would ship for the same compiler. It exists because the host would otherwise be
that lone binary: able to rebuild itself and unable to build a benchmark, a corpus program or a
test fixture. It is also what carries an uncommitted `std/` or `runtime/` edit into the next
program the project builds.

## Targets

Native and cross targets require a compatible LLVM target, object format, system libraries, and
runtime bitcode built for the requested triple, found under `lib/runtime/<triple>/`. Producing
target-shaped IR is not equivalent to shipping a runnable target. WebAssembly, for example, still
needs an embedder/runtime decision beyond IR.

**`stdlib/*.plib` is not yet target-namespaced.** Runtime bitcode is; PLIB bitcode is not, and
`clear_packaging_target_attributes` strips only `target-cpu`, `target-features` and `tune-cpu` —
CPU tuning within a target, not the triple. A finished cross build therefore has to grow the same
per-target dimension for the standard library, and that is an open design point rather than
settled behavior.

Packaging checks should verify runtime/backend separation, artifact discovery, hashes, executable
behavior, and absence of repository-only path assumptions.

## Build-driver responsibilities

`compiler_default_exe_path` derives a native output name from the source and host platform.
`compiler_temp_path_for`, `compiler_temp_private_path`, `compiler_temp_ir_path`, and
`compiler_temp_obj_path` create collision-resistant intermediate names. `compiler_publish_file`
uses an atomic/replace-safe publish step so a failed build does not expose a partial final artifact.

`find_in_lib_dir` resolves installed artifacts under `lib/`; `find_runtime_bitcode` builds the
module-relative name, including the `<triple>/` component for an explicit target, and reports a
miss as an installation error naming the file. `find_toolchain_entry` is the separate search for
*repository* inputs — `runtime/*.c` and `std/*.psm` relative to the executable or the working
directory — used only by the bootstrap and local-toolchain paths. Keeping the two apart is why
`<prefix>/runtime/` stays free: that path already means runtime **sources**.

`compiler_runtime_source_hash` hashes the current runtime inputs; `compiler_installed_runtime_hash`
reads the packaged counterpart from `lib/runtime.hash`. The driver can therefore diagnose a
toolchain whose shipped runtime does not match the source being compiled.

## Native build stages

`compiler_build_executable(ir, exe)` is the ordinary packaged path: merge the imported PLIB and
runtime bitcode into the program module with `merge_libraries_into_program`, compile the merged
module with `compile_ir_to_object`, construct platform link arguments, and publish the executable.
There is no curated subset and no source fallback — a missing module fails the build.

`compiler_bootstrap_executable` intentionally compiles runtime sources from the working tree. It
is used when producing a new compiler generation, because a compiler's own runtime must contain C
changes made after its host was built. That path also defines `PRISMIO_BOOTSTRAP_COMPAT`, which is
how a one-generation compatibility symbol stays available to compilers without ever reaching
packaged runtime bitcode.

`native_clang_command` selects the installed compiler driver. `find_llvm_paths` discovers
headers/libraries from packaged metadata or the configured LLVM installation.
`target_clang_flags` translates the selected triple/sysroot. `compiler_set_sysroot` stores an
explicit SDK root. `compiler_link_library`, `compiler_link_search`, `compiler_link_file`, and
`compiler_link_framework` append validated UMS link inputs.

## Platform-specific behavior

`prismio_platform.h` normalizes mutex, condition-variable, thread-local, path, and export
differences. `host_is_windows` supports command selection; quoting stays in
`command_quote_arg` rather than being reproduced by UMS.
`write_dsym` runs only for supported Mach-O debug output. Windows export flags are derived by
`windows_runtime_export_flags`.

Cross-target IR is not sufficient for a runnable product. The target needs LLVM support, a
compatible sysroot/linker, runtime bitcode built for that triple, and all native dependencies.
The driver must state which artifact is missing instead of reporting a generic linker failure.

## Cache and installed-layout tests

The object cache serves the bootstrap and toolchain-source paths, which compile C. Its key includes
source/runtime bytes, target flags, optimization/debug/verification choices, and relevant native
inputs. `object_cache_disabled`, `object_cache_trace`, and `object_cache_dir` control diagnostics
and location; a cache hit must be byte-compatible with a fresh build. An ordinary program build
compiles no C and so produces no cache entries at all — `run_inline_runtime_default_test` asserts
that, because a cache entry appearing there would mean a retired source path had come back.

Packaging tests should install to a temporary prefix, move or hide the repository, run
`prismio --version`, compile and execute a program, exercise `std.*`, debug output, UMS native
links, and compare runtime hashes. Bootstrap tests additionally rebuild two generations and prove
the promoted compiler uses the new runtime sources.
