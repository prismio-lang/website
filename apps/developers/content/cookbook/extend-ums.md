---
title: Extend the UMS manifest
description: Carry a new build.ums capability through tokens, syntax, lowering, validation, planning, diagnostics, tests, and bootstrap compatibility.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [cookbook, ums, build-system]
related: [tooling/ums-overview, tooling/build-manifest, tooling/compiler-host-and-promotion]
---

Define the project problem before adding syntax. A target field, package field, dependency rule, or
toolchain component should have one semantic owner in the UMS model.

The path from text to command is explicit:

`umsDiscoverManifest()` → `umsLex()` → `umsParse()` → `umsLoadText()` → model validation →
`umsBuildPlanCreate()` → project command execution.

Place the change at the earliest stage that needs new information. A new spelling touches the
parser; a new constraint over existing fields may require only model validation; a different
ordering rule belongs only in the plan.

## Implementation path

1. Extend `ums/parser/token.psm`, lexer, AST, and parser.
2. Lower syntax into a typed project, workspace, dependency, or target model.
3. Validate incompatible combinations before producing commands.
4. Update discovery and resolution when the feature affects paths or dependencies.
5. Teach `build_plan.psm` the ordering and native command consequences.
6. Add a canonical writer representation if generated manifests need the field.
7. Emit source-located diagnostics for invalid input.

`ums/parser/lexer.psm` produces `UmsToken` values with source positions. The parser builds syntax
nodes; `umsLoadText()` lowers them into `UmsProjectModel`, targets, dependencies, commands, and the
workspace. Constructors such as `umsTarget()`, `umsLinkInput()`, `umsCommand()`,
`umsCommandStep()`, and `umsCommandArgument()` keep model creation consistent. Lookups use
`umsTargetFind()`, `umsDependencyFind()`, and `umsCommandFind()` rather than duplicating name rules.

Validation reports through `umsDiagnosticAdd()` and prints with `umsDiagnosticsPrint()`. Give each
failure a code, source path and span, and explain the incompatible fields. Do not postpone an invalid
manifest until Clang or the linker emits a less local error.

`umsBuildPlanCreate()` translates the validated model into ordered work. If a field affects native
linking, preserve its semantic kind through `UmsLinkInput` instead of flattening it into a shell
string. Command steps distinguish executable, arguments, forwarding, and environment so platform
quoting remains an execution concern.

Preserve the stable bootstrap host block understood by an installed parent compiler. If older
parents cannot safely ignore the new syntax, make the incompatibility explicit and provide a
migration path.

`umsProjectHost()` intentionally reads only the stable toolchain portion required to find
`.prismio/build/debug/prismio`. `dispatchToUmsHost()` may execute before the current compiler can
parse the rest of a newly extended manifest. Keep this route backward-readable or bump the minimum
parent requirement and make the failure actionable.

Test successful parsing, round-trip writing where relevant, validation failures, path normalization,
graph ordering, generated commands, host forwarding, and platform-specific quoting. Document
whether the capability affects build planning only or also changes compiler source resolution.

Add fixtures under `ums/tests/fixtures` and assertions in `ums/test_ums.psm`. Exercise
`umsManifestAddDependency()` when the canonical writer owns the new field. Then run project-level
tests through `prismio build`, `run`, `test`, and any custom command so the compiler-facing
`src/project/ums_cli.psm` path is covered as well as the model in isolation.
