---
title: Project compiler host and promotion
description: How an installed Prismio compiler delegates to a repository-local host, checks its generation, repairs a stale one, and atomically promotes successful self-builds.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-09"
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

**Every observable outcome names the toolchain that served it.** A manifest declaring
`toolchain.host` has asked for a specific compiler, and silently substituting the global one when
that compiler is missing, unrunnable or too old is how a project ends up built by something it did
not choose:

```text
Using local toolchain: /repo/.prismio/build/debug/prismio
Using global toolchain: /opt/homebrew/opt/prismio/bin/prismio
```

A manifest with no `toolchain` block has made no such choice and is told nothing. Forwarded stdout
and stderr retain their command contracts, and `cliWantsMachineOutput` suppresses the banner
entirely when the command emits JSON diagnostics or an AIF manifest — the stream was never the
question, since stdout would corrupt `aif --manifest` and stderr would corrupt JSON Lines.

## Generation handshake

Starting is not enough. A host from an earlier toolchain generation runs, answers `--version`, and
still cannot build: the code it emits names runtime symbols the installed runtime has since stopped
defining. That failure arrives as a linker's undefined-symbol list naming *generated* functions,
with nothing in it pointing at the compiler that emitted them.

`PRISMIO_HOST_ABI` in `runtime/prismio_runtime.h` versions the pairing between what a generation
emits and what the runtime it links defines. The hidden `prismio --internal-host-abi <token>`
reports it: the command prints the compiler's own token and exits 0 only when the argument matches.

Three outcomes, one answer. The host agrees and exits 0; it disagrees and exits 1; or it predates
the command entirely, rejects the argument as unknown (`P1039`) and also exits 1 — which is exactly
the "older than the question" case, reported without the old compiler ever having been taught to
answer. That is why the handshake works on the generation it was introduced to catch, with nothing
back-ported.

The command is answered **before** host routing, in `main`. The question is what *this* executable
emits against; a forwarded answer would describe the host being asked about, and the launcher's own
probe would recurse.

On disagreement `dispatchToUmsHost` rebuilds **only** the `toolchain.host` target with itself,
re-asks — promotion proved the new host starts, this proves the thing it was rebuilt for — and then
forwards the original command with its own arguments and profile:

| Code | Meaning |
| --- | --- |
| `P1064` | warning: the project compiler is from an older generation; rebuilding it first |
| `P1065` | warning: no target in this project builds the configured host; falling back to global |
| `P1066` | error: the rebuilt host still reports a different generation — the installed compiler is older than the project's sources |

`clean` is exempt, and that exemption is the whole of the special-casing: it removes the project's
artifacts and then the launcher removes the host itself, so rebuilding the binary about to be
deleted buys nothing.

**Bump `PRISMIO_HOST_ABI` only in the commit that breaks the pairing.** It is not a build stamp: a
bump costs every project a stage-0 rebuild of its host, so an ordinary runtime or codegen edit —
one where each generation still links what the other emits — leaves it alone. The compatibility
symbol itself survives one generation under `PRISMIO_BOOTSTRAP_COMPAT`, in compilers built from
repository sources, and never appears in packaged runtime bitcode.

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
3. whether it is the current executable via `compiler_is_current_executable`;
4. whether it starts, via `compiler_check_executable`; and
5. whether it is the current generation, via `compiler_check_host_abi`.

`compiler_forward_cli(host)` sets a hosted-environment guard, forwards the original argument
vector without re-tokenizing it, waits for the child, and restores the caller's environment.
`compiler_hosted_env_begin` and `compiler_hosted_env_end` make that state scoped even on failure.

## Building and promoting a host

`buildUmsHostTarget` recognizes the manifest target designated as the compiler host and builds it
through the bootstrap path. The candidate is not made active immediately.

The host build also produces the **rest of the toolchain** beside it — `lib/runtime/*.bc` and
`stdlib/*.plib` under the profile directory's parent — because a compiler alone in a build
directory can rebuild itself and build nothing else. In the self-replacing case the libraries are
emitted by the *candidate*, not the running compiler: they must be what the generation about to be
promoted produces, and it has already been checked. See
[Library artifacts](/runtime/library-artifacts).

`compiler_check_executable(candidate)` first verifies that the artifact exists and can execute the
required compiler probe. `checkUmsCompilerCandidate` performs the UMS-side checks.
`compiler_promote_executable(candidate, active)` publishes by safe replacement; on platforms
that cannot overwrite a running executable, it uses a staged path and rename strategy.
`promoteUmsCompilerCandidate` reports the exact failure without deleting the known-good active
host.

Host identity is path/executable identity, not merely matching `--version` text. Two builds can
claim the same version while containing different runtime sources or compiler behavior — which is
precisely why the generation handshake exists alongside the start probe.

Tests should cover the handshake in both directions and against a compiler that predates it, stale-host auto-repair, the `clean` exemption, recursion prevention, forwarded spaces and Unicode arguments, child exit-status
propagation, stale/missing hosts, a candidate that does not run, an interrupted promotion, Windows
running-file rules, recovery with the previous host, and a successful build whose next command is
served by the promoted compiler.
