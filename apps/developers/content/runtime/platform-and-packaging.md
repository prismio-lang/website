---
title: Runtime platforms and packaging
description: Platform abstraction, embedded sources, toolchain archives, runtime discovery, native targets, and packaged Prismio layout.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [runtime, platforms, packaging]
related: [compiler/bootstrap, tooling/debugging-targets-and-build-tracing, start/development-setup]
---

`runtime/prismio_platform.h` centralizes platform differences used by the runtime and build
driver. Windows and POSIX implementations must agree on observable language behavior even when
threads, processes, paths, libraries, and object formats differ.

## Packaged layout

A packaged toolchain keeps the compiler executable, application runtime archive, compiler backend
archive, runtime hash, and standard library in a relative layout. Runtime discovery begins from the
compiler location rather than a hardcoded installation prefix.

The application runtime is distinct from the compiler backend. Ordinary programs need language and
program support; a self-hosted compiler generation additionally links the LLVM-facing backend.

## Embedded sources

`runtime/embedded_sources.h` contains sources needed for bootstrap and portable build behavior.
`generate_embedded_sources.py` refreshes that generated input. A source change is incomplete if a
packaged or bootstrap path continues to use a stale embedded copy.

## Targets

Native and cross targets require a compatible LLVM target, object format, system libraries, and
runtime archive for the requested triple. Producing target-shaped IR is not equivalent to shipping
a runnable target. WebAssembly, for example, still needs an embedder/runtime decision beyond IR.

Packaging checks should verify archive separation, runtime discovery, hashes, executable behavior,
and absence of repository-only path assumptions.

## Build-driver responsibilities

`compiler_default_exe_path` derives a native output name from the source and host platform.
`compiler_temp_path_for`, `compiler_temp_private_path`, `compiler_temp_ir_path`, and
`compiler_temp_obj_path` create collision-resistant intermediate names. `compiler_publish_file`
uses an atomic/replace-safe publish step so a failed build does not expose a partial final artifact.

`find_toolchain_source`, `find_toolchain_library`, and `find_runtime_library` search the
installed layout first and use repository sources only in the explicit development/bootstrap path.
`compiler_runtime_source_hash` hashes the current runtime inputs;
`compiler_installed_runtime_hash` reads the packaged counterpart. The driver can therefore
diagnose a host whose embedded runtime does not match the source being compiled.

## Native build stages

`compiler_build_executable(ir, exe)` is the ordinary packaged path. It may build/merge a curated
runtime IR module, compile program IR with `compile_ir_to_object`, consult the object cache, gather
runtime/native objects, construct platform link arguments, and publish the executable.

`compiler_bootstrap_executable` intentionally compiles runtime sources from the working tree. It
is used when producing a new compiler generation, because the old compiler's embedded runtime
cannot contain C changes made after that host was built.

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
compatible sysroot/linker, a runtime archive built for that triple, and all native dependencies.
The driver must state which artifact is missing instead of reporting a generic linker failure.

## Cache and installed-layout tests

The object cache key includes source/runtime bytes, target flags, optimization/debug/verification
choices, and relevant native inputs. `object_cache_disabled`, `object_cache_trace`, and
`object_cache_dir` control diagnostics and location; a cache hit must be byte-compatible with a
fresh build.

Packaging tests should install to a temporary prefix, move or hide the repository, run
`prismio --version`, compile and execute a program, exercise `std.*`, debug output, UMS native
links, and compare runtime hashes. Bootstrap tests additionally rebuild two generations and prove
the promoted compiler uses the new runtime sources.
