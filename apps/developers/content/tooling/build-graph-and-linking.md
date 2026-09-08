---
title: UMS build graph and native linking
description: How UMS resolves packages, local dependencies, targets, artifacts, libraries, frameworks, files, and ordered build commands.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [ums, dependencies, linking]
related: [tooling/build-manifest, runtime/platform-and-packaging, compiler/imports-and-symbols]
---

UMS lowers validated project data into a dependency-ordered build plan. A node represents an
artifact or required component; edges establish what must exist before a command can run.

## Dependencies

The current resolver supports local path dependencies and records lock information. It does not
provide a registry fetcher or general version solver. A version constraint can be represented
without being satisfied from a remote registry.

Dependency resolution and Prismio import resolution are separate. UMS decides which package or
artifact participates in a build; the compiler decides how source imports are found and named.

## Link inputs

Targets can add named libraries, search locations, direct files, and platform frameworks. Toolchain
components bundle compiler- or platform-provided native behavior. The build plan must preserve
ordering where the native linker requires it and produce platform-appropriate flags.

## Incrementality

Do not describe UMS as a complete content-addressed incremental build engine. The current system
plans and executes project targets, manages the local compiler host, and records dependency state.
Caching claims must name the artifact and invalidation rule actually implemented.

Tests should cover graph ordering, duplicate or cyclic dependencies, missing native inputs, path
normalization, profile selection, and generated command lines on each supported platform.

## Dependency and target lookup

`umsDependencyFind(dependencies, scope, name)` returns the exact scoped dependency; build,
development, and test entries do not collapse into one namespace. `umsDependencyScopeName`
provides stable diagnostics/writer text. The resolver combines local path, requested version,
lockfile data, and project root into a resolved record. `umsLockfileVersion` identifies the
lockfile format read by the current compiler.

`umsTargetFind(targets, name)` selects a declared target. `umsTargetHasComponent` checks whether
an entry/component belongs to it. `umsBuildPlanCreate(project, profile, diagnostics)` validates
the profile, expands target/dependency edges, detects missing/cyclic references, and produces the
ordered plan consumed by CLI code.

## Build execution

`buildUmsProject` iterates the plan rather than manifest order.
`buildUmsTarget` chooses the compiler entry/output for one target.
`configureUmsTargetLink` resets native link state and visits every `UmsLinkInput`.

| Link kind | Native bridge call |
| --- | --- |
| library | `compiler_link_library` |
| search path | `compiler_link_search` |
| object/archive/file | `compiler_link_file` |
| Apple framework | `compiler_link_framework` |

`umsNativePath` anchors relative file/search entries at the project root. Absolute paths remain
explicit manifest commitments. The native build driver applies platform quoting and final linker
syntax; UMS passes structured values, not a concatenated shell fragment.

Custom commands use ordered `UmsCommandStep` records. `runUmsCommandStep` dispatches build, run,
test, clean, command, or script actions. `runUmsScriptStep` selects an interpreter where required.
`umsStepArguments` combines fixed and explicitly forwarded arguments, and `command_quote_arg`
protects each value at the platform boundary.

Graph tests must assert the plan itself, not only that a final binary appeared. Include diamond
dependencies, cycles, duplicate names across scopes, profile-specific targets, missing entry files,
relative and absolute native paths, link ordering, spaces/quotes, frameworks on unsupported hosts,
and a clean rebuild with the object cache disabled.
