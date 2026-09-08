---
title: Project compiler host and promotion
description: How an installed Prismio compiler delegates to a repository-local host and atomically promotes successful self-builds.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [ums, self-hosting, compiler]
related: [start/local-compiler-loop, compiler/bootstrap, testing/fixed-point-verification]
---

The compiler repository names `.prismio/build/debug/prismio` as its optional project host. This
lets compiler development use the generation produced by the checkout while retaining an installed
compiler that can recover or bootstrap.

## Routing

The parent compiler locates `build.ums` and reads its stable host declaration. If the host is
missing, the parent processes the project and builds it. If the host exists, the parent forwards
the complete user command so the local generation interprets the rest of the manifest.

Forwarded stdout and stderr retain their command contracts. A host-routing message must not be
written to stdout when the command emits JSON, LLVM IR, or an AIF manifest.

## Promotion

A compiler cannot safely overwrite the executable currently running. Self-build output is staged
under a separate path. After the child succeeds, the parent replaces the project host atomically.
A failed compile or test leaves the previous working host intact.

Named `build/genN` compilers remain the correct choice when the exact generation is part of the
experiment. The project host is intentionally moving state for the ordinary edit-build-test loop.

Tests should interrupt failed builds, exercise missing and existing hosts, verify argument
forwarding, and confirm that promotion never exposes a partial binary.

## Bootstrap discovery

`umsProjectHost(startDirectory)` discovers `build.ums`, reads only the bootstrap-safe prefix
computed by `umsBootstrapPrefixLength`, and returns the configured host path. This small parser
must remain understandable to the previously installed compiler. It intentionally does not require
the entire newest UMS grammar before deciding which compiler should parse that grammar.

`dispatchToUmsHost` checks:

1. whether the current invocation is already hosted with `compiler_is_hosted`;
2. whether a project host is configured and exists;
3. whether it is the current executable via `compiler_is_current_executable`; and
4. whether forwarding is safe.

`compiler_forward_cli(host)` sets a hosted-environment guard, forwards the original argument
vector without re-tokenizing it, waits for the child, and restores the caller's environment.
`compiler_hosted_env_begin` and `compiler_hosted_env_end` make that state scoped even on failure.

## Building and promoting a host

`buildUmsHostTarget` recognizes the manifest target designated as the compiler host and builds it
through the bootstrap path. The candidate is not made active immediately.

`compiler_check_executable(candidate)` first verifies that the artifact exists and can execute the
required compiler probe. `checkUmsCompilerCandidate` performs the UMS-side checks.
`compiler_promote_executable(candidate, active)` publishes by safe replacement; on platforms
that cannot overwrite a running executable, it uses a staged path and rename strategy.
`promoteUmsCompilerCandidate` reports the exact failure without deleting the known-good active
host.

Host identity is path/executable identity, not merely matching `--version` text. Two builds can
claim the same version while containing different runtime sources or compiler behavior.

Tests should cover recursion prevention, forwarded spaces and Unicode arguments, child exit-status
propagation, stale/missing hosts, a candidate that does not run, an interrupted promotion, Windows
running-file rules, recovery with the previous host, and a successful build whose next command is
served by the promoted compiler.
