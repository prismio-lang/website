# Graph Report - developers  (2026-09-10)

## Corpus Check
- 115 files · ~175,902 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 783 nodes · 795 edges · 88 communities (78 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf9c35a1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.tsx
- devDependencies
- aif-internals.mdx
- string-representation.mdx
- mdx-components.tsx
- repository
- page.tsx
- dependencies
- prismio.tmLanguage.json
- loop-guards.mdx
- audit-content.mjs
- cli.md
- faq.md
- overview.md
- llvm-c-bridge.md
- aif-differential.md
- closures-and-captures.md
- enums-and-pattern-lowering.md
- generics-and-monomorphization.md
- overview.md
- semantic-analysis-and-types.md
- 0.1.0.md
- allocation-arenas-rc-and-cycles.md
- collection-representations.md
- platform-and-packaging.md
- verify-doc-examples.mjs
- layout-selection.md
- bootstrap.md
- frontend.md
- ownership-and-drop-lowering.md
- traits-impls-and-dispatch.md
- control-flow.md
- functions-and-calls.md
- runtime-ir-and-optimization.md
- roadmap.md
- supported-surface.md
- regression-suite.md
- build-manifest.md
- ide-protocol.md
- ffi-contracts.md
- regions-views-and-provenance.md
- reuse-reports-and-verification.md
- tiers-and-analysis-domains.md
- diagnostics.md
- imports-and-symbols.md
- pipeline-and-driver.md
- c-ffi.md
- debug-information.md
- overview.md
- types-and-abi.md
- library-artifacts.md
- overview.md
- index.md
- local-compiler-loop.md
- build-graph-and-linking.md
- compiler-host-and-promotion.md
- debugging-targets-and-build-tracing.md
- ums-overview.md
- add-a-runtime-or-stdlib-api.md
- index.md
- index.md
- development-setup.md
- Divider.tsx
- add-a-diagnostic.md
- add-a-language-feature.md
- benchmark-contract.md
- investigation-method.md
- running-adding-and-reading-results.md
- security-and-compatibility.md
- tasks-and-channels.md
- first-compiler-change.md
- repository-tour.md
- Prismio Developers
- LinkCard.tsx
- debug-a-compiler-regression.md
- fixed-point-verification.md
- overview.md
- cli-arguments.md
- extend-ums.md
- index.md
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `repository` - 12 edges
2. `scripts` - 10 edges
3. `SiteConfig` - 9 edges
4. `DocsPage()` - 8 edges
5. `Docs` - 8 edges
6. `Experiments that were rejected` - 8 edges
7. `statusLabel()` - 7 edges
8. `string-interpolation` - 7 edges
9. `Debugging an AIF change` - 7 edges
10. `include` - 6 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `findDoc()`  [EXTRACTED]
  app/[...slug]/page.tsx → libs/docs/navigation.ts
- `DocsPage()` --calls--> `statusLabel()`  [EXTRACTED]
  app/[...slug]/page.tsx → components/DocStatus.tsx
- `GET()` --calls--> `statusLabel()`  [EXTRACTED]
  app/llms.txt/route.ts → components/DocStatus.tsx
- `Pre()` --references--> `react`  [EXTRACTED]
  components/mdx-components.tsx → package.json
- `DocsPage()` --calls--> `findDoc()`  [EXTRACTED]
  app/[...slug]/page.tsx → libs/docs/navigation.ts

## Import Cycles
- 1-file cycle: `libs/velite.ts -> libs/velite.ts`

## Communities (88 total, 10 thin omitted)

### Community 0 - "layout.tsx"
Cohesion: 0.08
Nodes (23): metadata, viewport, GET(), foundations, metadata, reference, ThemeContext, ThemeContextProps (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.05
Nodes (39): babel-plugin-react-compiler, eslint, devDependencies, babel-plugin-react-compiler, eslint, @prismio/eslint-config, @prismio/typescript-config, @shikijs/rehype (+31 more)

### Community 2 - "aif-internals.mdx"
Cohesion: 0.05
Nodes (36): A tier is not the emitted mechanism, Allocation hooks, Allocation sites, Arena placement, Assertions, diagnostics, and reports, Call-site bracketing, Compare the independent model, Concurrency model (+28 more)

### Community 3 - "string-representation.mdx"
Cohesion: 0.06
Nodes (35): Branching around short-string materialization, C receives a temporary NUL-terminated copy, Caching the canonical pointer per SSA value, Choosing the inline capacity from Prismio workloads, Containers take an owned copy, Costs at ownership and ABI boundaries, Curating `rt_free` into the generated module, Effect on the maintained suite (+27 more)

### Community 4 - "mdx-components.tsx"
Cohesion: 0.08
Nodes (23): AifPipelineDiagram(), AifRegionPlacementDiagram(), AifTierDecisionDiagram(), LatticeCardProps, PipelineStageProps, getCellAlignment(), getTextContent(), InPreContext (+15 more)

### Community 5 - "repository"
Cohesion: 0.06
Nodes (35): name, 0, patterns, match, name, 0, patterns, patterns (+27 more)

### Community 6 - "page.tsx"
Cohesion: 0.12
Nodes (25): useScrollSpy(), activeBranch(), DocsNav(), DocsNavProps, keyFor(), DocNavNode, DocsNavList, DocsSection (+17 more)

### Community 7 - "dependencies"
Cohesion: 0.06
Nodes (31): concurrently, @fontsource-variable/inter, @fontsource-variable/jetbrains-mono, framer-motion, github-slugger, hamburger-react, @heroui/react, @heroui/styles (+23 more)

### Community 8 - "prismio.tmLanguage.json"
Cohesion: 0.07
Nodes (26): fileTypes, name, patterns, $schema, scopeName, next.config.ts, next-env.d.ts, .next/types/**/*.ts (+18 more)

### Community 9 - "loop-guards.mdx"
Cohesion: 0.12
Nodes (15): Debugging a guard change, Emission, Implementation map, Loop versioning, and why totality survives, Measurements, Range, Representation, The bounds check is why the header reloads (+7 more)

### Community 10 - "audit-content.mjs"
Cohesion: 0.15
Nodes (10): ACRONYMS, arrayField(), baseline, contentRoot, failures, field(), files, records (+2 more)

### Community 11 - "cli.md"
Cohesion: 0.18
Nodes (10): AIF options, `bootstrap`, `build`, Build options, Dispatch implementation, Exit behavior, General commands, Inspection commands (+2 more)

### Community 12 - "faq.md"
Cohesion: 0.18
Nodes (10): Does Prismio have a package registry?, Does Prismio use LLVM?, Is Prismio production-ready?, Is the compiler really self-hosted?, What concurrency model exists?, What does AIF stand for?, What does the benchmark suite cover?, What standard modules exist? (+2 more)

### Community 13 - "overview.md"
Cohesion: 0.20
Nodes (9): Ask why, Checking a change, Core objects, Execution order, and why it is fixed, How code generation reads the result, See it on your own code, The ladder, The problem AIF solves (+1 more)

### Community 14 - "llvm-c-bridge.md"
Cohesion: 0.20
Nodes (9): Adding a bridge operation, Blocks, branches, and PHI nodes, Context, module, target, and lifetime, Globals and functions, Instruction builders, Metadata and alias analysis, ORC JIT, Type construction and inspection (+1 more)

### Community 15 - "aif-differential.md"
Cohesion: 0.22
Nodes (8): A worked example, Adding a rule, How to debug a disagreement, Reading a failure, Run it, What is compared, What this test is for, Why it is built this way

### Community 16 - "closures-and-captures.md"
Cohesion: 0.25
Nodes (7): Call lowering, Capture semantics, Generated representation, Lifetime implications, Lowering, Memory consequences, Parsing and capture discovery

### Community 17 - "enums-and-pattern-lowering.md"
Cohesion: 0.25
Nodes (7): Construction and generic inference, Enum semantic representation, Fieldless and payload enums, LLVM lowering and teardown, Lowering and destruction, Match checking, Pattern checking

### Community 18 - "generics-and-monomorphization.md"
Cohesion: 0.25
Nodes (7): Instantiation functions, Substitution, Template collection and identity, Tests, Traits, defaults, and associated types, What reaches later passes, Why ordering matters

### Community 19 - "overview.md"
Cohesion: 0.25
Nodes (7): Allocation inference, Lexer and parser, LLVM generation and verification, Object generation and linking, Semantic analysis, Source loading and imports, Trust and fixed points

### Community 20 - "semantic-analysis-and-types.md"
Cohesion: 0.25
Nodes (7): Analysis order, Builtins and rewrites, Builtins and source rewrites, Expression and statement functions, Flow and program validity, Flow facts, Responsibilities

### Community 21 - "0.1.0.md"
Cohesion: 0.25
Nodes (7): Compiler and tooling, Implementation anchors, Language and memory, Not included, Performance evidence, Release evidence, Runtime and standard modules

### Community 22 - "allocation-arenas-rc-and-cycles.md"
Cohesion: 0.25
Nodes (7): Arenas, Base allocator and pools, Cycle collection, Reference counting, Regions, Unique and shared storage, Verification

### Community 23 - "collection-representations.md"
Cohesion: 0.25
Nodes (7): DataView operations, Growth and mutation, List header and construction, Lists, Maps, Slice operations, Views

### Community 24 - "platform-and-packaging.md"
Cohesion: 0.25
Nodes (7): Build-driver responsibilities, Cache and installed-layout tests, Native build stages, Packaged layout, Platform-specific behavior, Targets, The local toolchain

### Community 25 - "verify-doc-examples.mjs"
Cohesion: 0.25
Nodes (6): cases, compiler, contentRoot, docsRoot, failures, work

### Community 26 - "layout-selection.md"
Cohesion: 0.29
Nodes (6): Acceptance, Field-order selection, Inputs, Object and container context, Split selection and vetoes, Type graph and exact sizing

### Community 27 - "bootstrap.md"
Cohesion: 0.29
Nodes (6): Diagnose divergence, Fixed-point meaning, Generation workflow, Platform neutrality, Reproducibility record, Why runtime/backend sources are rebuilt

### Community 28 - "frontend.md"
Cohesion: 0.29
Nodes (6): AST, AST data model, Lexer implementation, Lexing, Parser implementation, Parsing

### Community 29 - "ownership-and-drop-lowering.md"
Cohesion: 0.29
Nodes (6): Analysis, Backend ownership state, Calls, temporaries, and returns, Lowering, Selecting the release operation, Semantic ownership functions

### Community 30 - "traits-impls-and-dispatch.md"
Cohesion: 0.29
Nodes (6): Applicability and coherence, Calls, Method resolution and static dispatch, Parsing and declaration shape, Static applicability and coherence, Trait objects and vtables

### Community 31 - "control-flow.md"
Cohesion: 0.29
Nodes (6): Basic-block API, If and conditional expressions, Loop guards and bulk paths, Loops, Match lowering, Returns and cleanup

### Community 32 - "functions-and-calls.md"
Cohesion: 0.29
Nodes (6): Declarations and foreign symbols, Definitions, Direct call builder, Indirect calls and trait objects, Owned temporary arguments, Task thunks and inlining

### Community 33 - "runtime-ir-and-optimization.md"
Cohesion: 0.29
Nodes (6): Evaluating an optimization change, Library module merging, Metadata supplied to the optimizer, Object and native output, ORC JIT path, Verification and optimization order

### Community 34 - "roadmap.md"
Cohesion: 0.29
Nodes (6): Established baseline, Foundational memory work, How roadmap status changes, Measured optimization directions, Toolchain and platform work, Unsupported surface

### Community 35 - "supported-surface.md"
Cohesion: 0.29
Nodes (6): Compiler builtins, Failure and ownership conventions, Foreign runtime operations, Runtime service inventory, Standard-module boundary, Standard modules

### Community 36 - "regression-suite.md"
Cohesion: 0.29
Nodes (6): Cross-stage changes, Negative cases, Negative fixtures, Positive cases, Positive fixtures, Specialized artifact assertions

### Community 37 - "build-manifest.md"
Cohesion: 0.29
Nodes (6): Bootstrap host, Lexer and parser functions, Lowering into the project model, Project structure, Source-preserving writer, Validation

### Community 38 - "ide-protocol.md"
Cohesion: 0.29
Nodes (6): AST and source tooling, Compatibility, Diagnostic production, Source positions, Stream discipline, Stream discipline

### Community 39 - "ffi-contracts.md"
Cohesion: 0.33
Nodes (5): `bytes`, the contract that changes marshalling rather than ownership, Constraint and ABI effects, Contract resolution order, Tests, Why defaults are conservative

### Community 40 - "regions-views-and-provenance.md"
Cohesion: 0.33
Nodes (5): Interprocedural provenance, Layout consequence, Scope and region functions, Views are provenance edges, Views preserve an owner relationship

### Community 41 - "reuse-reports-and-verification.md"
Cohesion: 0.33
Nodes (5): Explanations and policy reports, Inspecting a decision, Report entry points, Reuse and runtime verification, What verification proves

### Community 42 - "tiers-and-analysis-domains.md"
Cohesion: 0.33
Nodes (5): Conservative joins, Native fact representation, Pins and widening, Thread and cycle facts, Tier selection function

### Community 43 - "diagnostics.md"
Cohesion: 0.33
Nodes (5): Diagnostic stages, Emission lifecycle, Reading a diagnostic, Source spans, Warnings and notes

### Community 44 - "imports-and-symbols.md"
Cohesion: 0.33
Nodes (5): Flattening and names, Import resolver call graph, Standard modules, Symbol identity and lookup, Visibility

### Community 45 - "pipeline-and-driver.md"
Cohesion: 0.33
Nodes (5): Change discipline, Command-dependent exits, Driver function reference, Native compilation, Pipeline

### Community 46 - "c-ffi.md"
Cohesion: 0.33
Nodes (5): Link and test, Owned foreign results, Verify the real ABI, What this recipe does not promise, Why the wrapper exists

### Community 47 - "debug-information.md"
Cohesion: 0.33
Nodes (5): Disabled builds and platform guards, Function lifecycle, Local and global variables, Module and compile unit, Type metadata

### Community 48 - "overview.md"
Cohesion: 0.33
Nodes (5): End-to-end call path, Module lifecycle in LLVM, State owned on each side, The bridge's value protocol, Where to make a change

### Community 49 - "types-and-abi.md"
Cohesion: 0.33
Nodes (5): Named structs and layout, Optional and enum encoding, Primitive and built-in mappings, Scalars in pointer-sized slots, Three storage questions

### Community 50 - "library-artifacts.md"
Cohesion: 0.33
Nodes (5): Changing the set, How they reach the program, PLIB v2, Runtime bitcode, Two producers, one format

### Community 51 - "overview.md"
Cohesion: 0.33
Nodes (5): Allocation entry points, Runtime compatibility, Runtime file boundaries, Runtime visibility to source, Three surfaces

### Community 52 - "index.md"
Cohesion: 0.33
Nodes (5): Before opening a change, Boundaries, How to read an implementation page, Read in this order, What counts as evidence

### Community 53 - "local-compiler-loop.md"
Cohesion: 0.33
Nodes (5): Before committing, Focused tests while editing, Ordinary loop, Trace or bypass caches, Use named generations for reproducibility

### Community 54 - "build-graph-and-linking.md"
Cohesion: 0.33
Nodes (5): Build execution, Dependencies, Dependency and target lookup, Incrementality, Link inputs

### Community 55 - "compiler-host-and-promotion.md"
Cohesion: 0.33
Nodes (5): Bootstrap discovery, Building and promoting a host, Generation handshake, Promotion, Routing

### Community 56 - "debugging-targets-and-build-tracing.md"
Cohesion: 0.33
Nodes (5): Build tracing, Compiler inspection boundaries, Failure isolation, Target selection, Targets

### Community 57 - "ums-overview.md"
Cohesion: 0.33
Nodes (5): Command integration, Compatibility, Load pipeline, Pipeline, Responsibilities

### Community 58 - "add-a-runtime-or-stdlib-api.md"
Cohesion: 0.40
Nodes (4): Choose the owning layer, Integration, Native boundary, Proof

### Community 59 - "index.md"
Cohesion: 0.40
Nodes (4): Choose the right section, Compiler contributor recipes, Completion rule, Integration recipes

### Community 60 - "index.md"
Cohesion: 0.40
Nodes (4): Audit prototype code, Find the owning break, Generated artifacts are not migration inputs, Verification

### Community 61 - "development-setup.md"
Cohesion: 0.40
Nodes (4): Choose the compiler explicitly, Platform notes, Required tools, Validate the setup

### Community 63 - "add-a-diagnostic.md"
Cohesion: 0.50
Nodes (3): Human and machine forms, Required information, Testing

### Community 64 - "add-a-language-feature.md"
Cohesion: 0.50
Nodes (3): Concrete entry points, Implementation path, Proof

### Community 65 - "benchmark-contract.md"
Cohesion: 0.50
Nodes (3): Correctness before timing, Interpretation, Unsupported workloads

### Community 66 - "investigation-method.md"
Cohesion: 0.50
Nodes (3): Accepting a change, Compare one controlled candidate, Decompose before changing architecture

### Community 67 - "running-adding-and-reading-results.md"
Cohesion: 0.50
Nodes (3): Adding a workload, Command surface, Reading JSON

### Community 68 - "security-and-compatibility.md"
Cohesion: 0.50
Nodes (3): Boundary map, Compatibility, Trusted and unsafe boundaries

### Community 69 - "tasks-and-channels.md"
Cohesion: 0.50
Nodes (3): Channel runtime, Channels, Task runtime

### Community 70 - "first-compiler-change.md"
Cohesion: 0.50
Nodes (3): Follow one node end to end, Prove the boundary, Trace the path

### Community 71 - "repository-tour.md"
Cohesion: 0.50
Nodes (3): Entry points, Finding behavior, Tests and executable evidence

### Community 72 - "Prismio Developers"
Cohesion: 0.50
Nodes (3): Content contract, Local development, Prismio Developers

## Knowledge Gaps
- **520 isolated node(s):** `Collections`, `Docs`, `DocsNavProps`, `PageProps`, `metadata` (+515 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `page.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `react` connect `page.tsx` to `mdx-components.tsx`, `dependencies`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Collections`, `Docs`, `DocsNavProps` to the rest of the system?**
  _520 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07536231884057971 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `aif-internals.mdx` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `string-representation.mdx` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._