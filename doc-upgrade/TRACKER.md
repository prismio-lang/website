# Documentation upgrade — progress tracker

Working notes for the DOC_STYLE.md readability upgrade. **Delete this folder
when the work is finished.** It is untracked on purpose.

Last updated: 2026-09-17, after round 2. **Next: round 3** (llvm-b, runtime, tooling).
All four gates green at that point: developers 50 snippets / 69 pages, docs 195 / 102.

## How to resume after a break

1. Read this file, then `../DOC_STYLE.md`.
2. Check the tree. Do not trust this file's counts blindly:
   ```bash
   git -C ../ status --short          # website
   git -C ../../prismio status --short # compiler (see "Not ours" below)
   ```
3. Find where things stand. The audit prints `fixed — remove it` for a page an
   agent finished but whose baseline entry is still listed:
   ```bash
   cd ../apps/developers && node scripts/audit-content.mjs
   cd ../apps/docs       && node scripts/audit-content.mjs
   ```
   A page with `lastUpdated: "2026-09-17"` that still fails was left half-done
   by an agent that hit a limit — give it to the next agent of that batch.
4. Remove finished entries from `apps/*/scripts/readability-baseline.json`
   (lead agent only; subagents never edit it), run both gates, then launch the
   next round below.
5. If the scratchpad was wiped, subagent prompts should point at
   `doc-upgrade/BRIEF.md` in this repo instead.

**Rules the user set:** Sonnet subagents; **at most 2–3 at once**; let a round
finish before starting the next. The last attempt at 18 in parallel hit the
session limit and every agent died before writing anything.

Compiler for every command and gate:
`P=/Users/vibrant/Desktop/Projects/Prismio/prismio/.prismio/build/debug/prismio`
(built 2026-09-16 16:40; if it changes mid-run, outputs may shift).

## Gates (all four must pass at the end)

```bash
cd apps/developers && PRISMIO=$P node scripts/verify-doc-examples.mjs && node scripts/audit-content.mjs
cd apps/docs       && PRISMIO=$P node scripts/verify-doc-examples.mjs && node scripts/audit-content.mjs
```

Baseline at start (2026-09-16): developers 9 opening + 49 no-block, 3 checked
snippets, 69 pages; docs 5 + 25, 195 snippets, 102 pages. All green.

## Status

| Round | Batch | Pages | State |
| --- | --- | --- | --- |
| — | Tier 1 (lead, by hand) | developers: start, compiler/overview, runtime/overview, llvm/overview, start/repository-tour | **done**, baseline updated |
| 1 | cookbook-a | cookbook/add-a-diagnostic, add-a-language-feature, add-a-runtime-or-stdlib-api | **done**, baseline updated |
| 1 | cookbook-b | cookbook/debug-a-compiler-regression, extend-ums, cookbook (index) | **done**, baseline updated |
| 1 | aif | aif/ffi-contracts, layout-selection, regions-views-and-provenance, tiers-and-analysis-domains | **done**, baseline updated |
| 2 | compiler-a | compiler/closures-and-captures, diagnostics, enums-and-pattern-lowering (O+B), frontend, generics-and-monomorphization | **done**, baseline updated |
| 2 | compiler-b | compiler/imports-and-symbols (O+B), ownership-and-drop-lowering, pipeline-and-driver (O), semantic-analysis-and-types (O+B), traits-impls-and-dispatch | **done**, baseline updated |
| 2 | llvm-a | llvm/control-flow, debug-information, functions-and-calls | **done**, baseline updated |
| 3 | llvm-b | llvm/llvm-c-bridge (O+B), runtime-ir-and-optimization, types-and-abi | todo |
| 3 | runtime | runtime/allocation-arenas-rc-and-cycles, collection-representations, platform-and-packaging (O), **supported-surface (user-dirty)**, tasks-and-channels (O+B) | todo |
| 3 | tooling | tooling/build-graph-and-linking, build-manifest (O+B), debugging-targets-and-build-tracing, ide-protocol, ums-overview | todo |
| 4 | testperf | testing/regression-suite, start/first-compiler-change, performance/benchmark-contract (O+B), performance/investigation-method | todo |
| 4 | devmisc-a | faq, glossary, migration | todo |
| 4 | devmisc-b | project/security-and-compatibility, releases, releases/0.1.0, roadmap | todo |
| 5 | docs-open | docs: errors/invalid-drop, language/pattern-matching, language/variables, stdlib/option, stdlib/strings (all O only) | todo |
| 5 | spec-a | docs: specification (index), specification/behavior, conformance, evaluation | todo |
| 5 | spec-b | docs: specification/memory-model, **specification/name-resolution (user-dirty)**, type-system | todo |
| 6 | docs-index | docs: cookbook, errors, guides, stdlib, tutorials (indexes); language/lifetimes, language/macros, stdlib/concurrency, stdlib/networking, stdlib/time (coming-soon) | todo |
| 6 | docs-misc-a | docs: compiler/diagnostics, compiler/targets, faq, glossary | todo |
| 6 | docs-misc-b | docs: migration, releases, releases/0.1.0, roadmap | todo |
| 7 | lead | update DOC_STYLE.md §7, final four gates, final report, delete this folder | todo |

O = on the opensWithIdentifier list, B = noRunnableBlock. Unmarked developers
pages in the table are B only.

Baseline after round 1: developers 9 opening + 35 no-block; docs unchanged.
After llvm-a: developers 9 + 32. After compiler-b: developers 6 + 28. After round 2: developers 5 + 23; docs 5 + 25 (untouched so far).

## Per-batch hints for the prompts still to launch

Every prompt starts: *"Read `<BRIEF path>` first and follow it exactly. Site:
apps/…. Your scratch dir: `<scratchpad>/w-<batch>`. Your pages: …"*, then:

- **llvm-b** — read llvm/overview.md first. Verified: `ir_write_file` verifies,
  runs `run_optimization` at `g_opt_level` (0 by default), verifies again,
  writes; native build merges bitcode and runs whole-program -O3 in
  build_driver.c; `--target not-a-triple` → `error[P1043]`. llvm-c-bridge: value
  protocol (`intern_value`, `resolve_value`), `ir_*` in src/ir/bridge.psm,
  runtime/test_llvm_backend.c (read-only). runtime-ir: compare `.ll` against the
  native binary (`nm`, `otool -tV`), `lib/runtime/*.bc`. types-and-abi: struct
  layouts, `%prismio.str`, `Int` = i32, `I64` for `size_t`, wasm datalayout
  `p:32:32`, tagged short strings (RUNTIME.md: bit 31, ≤12 bytes inline).
- **runtime** — WARNING block for supported-surface.md (Edit tool only, keep
  the user's 4-line change; never touch library-artifacts.md). Read
  runtime/overview.md first (verify ledger, lib/runtime listing, nm, slice
  failure). Tasks/channels in program_support.c; `list_get` out of range → 0.
  platform-and-packaging: `$P --version`, `.prismio/build/{debug,lib,stdlib}`,
  `--target`/`--sysroot`, cross build links `runtime-<triple>`.
- **tooling** — UMS = Unified Manifest System. `$P init demo` in scratch works
  (prints `created demo`; build → `Built …/.prismio/build/debug/demo`; run →
  `Hello, Prismio!`). Break build.ums for real errors (UMS2004 unknown property,
  UMS1101/UMS2003/UMS2307 missing brace, P1062 reserved command name — note
  ums/ARCHITECTURE.md says P1058, the compiler says P1062). IDE: IDE_PROTOCOL.md;
  `check --diagnostic-format=json` (clean run still emits a summary).
  Build trace: two lines on an ordinary build; `PRISMIO_OBJ_CACHE_TRACE=1`
  prints nothing on an ordinary build.
- **testperf** — `start/first-compiler-change.md` line ~30 names `scan()`,
  which does not exist: the lexer is `createLexer()` + `lexAllTokens()`
  (private `lexerNextToken()` dispatches to `lex*`), parser `parserCreate()` +
  `parseModule()`. Never run benchmarks/run.py; quote committed results and
  name the file. run_suite.py `-k` only. Do not run `prismio build` in the
  checkout (promotes the host) — show without output.
- **devmisc-a** — glossary: verify every entry; add generation, seed, project
  host, PLIB, sema (match start/index.md's table); "flattening" wording is stale
  (nodes carry file id + logical module; qualified calls, aliases, private
  default visibility). migration: visibility default is now private — capture
  the real two-file error.
- **devmisc-b** — CHANGELOG.md / RELEASE.md / SECURITY.md / KNOWN_ISSUES.md;
  `$P --version` block; roadmap may use `no-command:` if nothing is runnable;
  anything shipped but listed as future must be corrected. To show a broken
  `.plib` (P1068), copy the toolchain layout to scratch first — **never modify
  `~/prismio/.prismio/build`** (an agent was about to, before the limit hit).
- **docs-open** — only the opening paragraph is gated; proportionate edits;
  stdlib/strings (~3,000 words) opening + headings only.
- **spec-a / spec-b** — reference pages; add checked examples demonstrating a
  stated rule; never change a normative rule — report compiler disagreements.
  spec-b WARNING for name-resolution.md (Edit only; keep the user's 2-line
  change). Don't edit grammar.md or language/modules.md.
- **docs-index** — indexes get one useful block each; coming-soon pages: first
  verify still unimplemented (no std/time, std/net, std/concurrency files; but
  spawn/tasks/channels exist in the language) — show the real rejection with
  `prismio-check: fail`; the audit requires "not implemented" wording.
- **docs-misc-a** — diagnostics: JSON format, multi-error recovery
  (neg_12_multiple_errors); targets: `--target wasm32-unknown-unknown`
  datalayout, P1043. glossary: AIF/UMS exact expansions.
- **docs-misc-b** — releases from CHANGELOG.md; migration: real private-default
  visibility error; roadmap as devmisc-b.

## Not ours — never touch

- Website, user's uncommitted work: developers runtime/library-artifacts.md,
  runtime/supported-surface.md; docs language/lexical-structure.md,
  language/modules.md, specification/grammar.md, specification/name-resolution.md,
  stdlib/filesystem.md, stdlib/process.md; both `.velite/docs.json`.
  Pre-change copies of those files: `<scratchpad>/user-files/` (lost if the
  scratchpad is wiped — re-copy before a round that edits one).
- Compiler repo: `src/main.psm` and `std/process.psm` changed on 2026-09-17
  around 08:55 (migration to `process.args`, `cli_arg_count` made private). Not
  from any doc agent (transcripts checked). Leave alone.

## Findings for the final report

- Brief was off: website had 10 dirty files (not ~43), compiler repo was clean
  (not ~18), docs had 195 snippets / 102 pages (not 178 / 100).
- Facts corrected in Tier 1: compiler/overview said `src/main.psm` owns import
  resolution and orchestration (it is `src/driver/`); the build trace does not
  print a `link` line on an ordinary build; `dump-ast` runs full sema;
  repository-tour named `statement.psm` (is `stmt.psm`), put tasks/channels in
  lang_runtime.c (program_support.c), and named `scan()` (does not exist);
  llvm/overview implied `.ll` is optimised (it is written at -O0 by default).
- Facts corrected by agents: add-a-language-feature named `scan()`;
  llvm/control-flow said enum matches use `ir_switch_*` (they are an `icmp`
  chain in source order; `switch` is only string dispatch);
  functions-and-calls' fall-through `ret i32 0` is unreachable (sema P4001
  rejects a non-void fall-through first).
- Behaviour worth knowing: out-of-range `list_get` returns 0 silently (slices
  are checked).
- Compiler observations (not doc bugs):
  - `pin(T)` refutation (P5002) is enforced only by `build`; `check`/`aif`
    exit 0 — and the IDE boundary is `check`. Cause: `aifReportPins` is
    called only from `compileSource` (src/driver/compile.psm:357), never from
    `aifCommand`. The P5002 location points into
    `string.plib`, not at the user's `pin`.
  - `--why` for an undeclared `cli_arg` suggests declaring a return contract;
    taken as `produce(free)` that would free `argv`. `alias` is right.
  - **`spawn` of any generic function** passes `check`, then fails with
    `internal backend error: address of unknown function (<name>__task)` — no
    task entry point is generated for a monomorphized specialization. Repro:
    `fn measure<T>(x: T, s: String) -> Int` + `spawn measure("abc", "hello")`.
    Not in KNOWN_ISSUES.md; no fixture covers it. Closures reach `spawn` only via
    a generic wrapper, so they inherit it (documented on
    compiler/closures-and-captures).
  - Returning a closure is rejected (P4001, no spellable type) — matches the
    user docs' "Not in 0.1" list.
  - Match exhaustiveness is payload-enums only, by design (comment above
    `semaCheckExhaustive` in src/sema/enums.psm, which cites a HANDOFF file that
    no longer exists).
  - ums/ARCHITECTURE.md cites P1058 for a reserved command name; the compiler
    emits P1062.
  - `apps/docs/scripts/verify-doc-examples.mjs` default compiler path resolves
    to `apps/prismio/build/gen6` (wrong); `PRISMIO=` hides it.
- Website README.md replaced (was Turborepo boilerplate); it now points to
  DOC_STYLE.md and documents the gates.
