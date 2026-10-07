# CLAUDE.md — Agent & Contributor Guide for Prismio Web Ecosystem

This document provides essential instructions, architecture guidelines, and strict verification workflows for Claude (and human contributors) working on the Prismio web presence and documentation.

---

## 1. Project Overview & Architecture

Prismio is a modern, statically typed systems programming language and LLVM-based optimizing compiler designed for performance, memory ergonomics, and native interoperability.

This repository is a **pnpm + Turborepo monorepo** hosting all public web properties:

| Workspace | Purpose | Live URL | Framework / Stack |
| :--- | :--- | :--- | :--- |
| `apps/web` | Landing site, roadmap, downloads, benchmarks | `https://prismio.org` | Next.js 16, Vite/vinext (Cloudflare Workers) |
| `apps/docs` | User & language documentation | `https://docs.prismio.org` | Next.js 16, Velite MDX, vinext |
| `apps/developers` | Compiler internals & contributor docs | `https://developers.prismio.org` | Next.js 16, Velite MDX, vinext |
| `packages/docs-core` | Shared documentation engine, layout, search, SEO, and Velite schemas | Workspace package | React 19, TypeScript, Shiki |
| `packages/ui` | Shared UI primitives & HeroUI components | Workspace package | React 19, Tailwind CSS |
| `packages/utils` | Shared constants (version, links) | Workspace package | TypeScript |

---

## 2. Essential Commands

### Development
```bash
pnpm install                 # Install workspace dependencies
pnpm dev                     # Start all apps concurrently via Turborepo
pnpm --filter docs dev       # Start docs site (runs velite dev + next dev on port 3001)
pnpm --filter developers dev # Start developers site (port 3002)
pnpm --filter web dev        # Start marketing site (port 3000)
```

### Content Building & Validation (Critical for Docs)
Whenever adding or modifying markdown in `apps/docs` or `apps/developers`:
```bash
# In apps/docs or apps/developers:
pnpm build:content           # Compiles Velite MDX + generates robots.txt, sitemap.xml, llms.txt
pnpm audit:content           # Runs scripts/audit-content.mjs (validates frontmatter, links, rules)
pnpm verify:examples         # Validates compiler snippets annotated with <!-- prismio-check -->
pnpm check                   # Complete docs sanity check (content build + audit + examples + lint)
```

### Static Asset Generation
For `apps/web`:
```bash
node apps/web/scripts/generate-static-assets.mjs   # Generates llms.txt, ai/*.json, sitemap, robots
```

### Quality & Type Checking
```bash
pnpm check-types             # TypeScript type check across all 7 packages
pnpm lint                    # ESLint with --max-warnings 0 across all packages
```

### Deployment (Cloudflare Workers via vinext)
```bash
pnpm run build:vinext        # Vite production build across apps
pnpm run deploy:vinext       # Deploy to Cloudflare Workers
```

---

## 3. Documentation Authoring Standards (`apps/docs` & `apps/developers`)

All documentation content lives under:
- `apps/docs/content/**/*.md`
- `apps/developers/content/**/*.md`

### Strict Frontmatter Requirements
Every markdown document **must** include this exact YAML frontmatter:

```yaml
---
title: "Title of the Page"          # Minimum 3 characters
description: "A concise 20-180 character explanation of what the page covers."
status: stable                     # Exactly one of: stable | experimental | planned
draft: false                       # boolean
version: "0.1.0"                   # current toolchain version
lastUpdated: "2026-10-06"          # ISO date
tags: [stdlib, memory, aif]        # array of strings
related: ["language/types"]        # array of valid relative slugs (must actually exist!)
---
```

### Mandatory Readability & Style Rules (Enforced by `audit-content.mjs`)
Refer to [`DOC_STYLE.md`](file:///Users/vibrant/Desktop/Projects/Prismio/website/DOC_STYLE.md) for full context:

1. **Never lead with a filename or code identifier**:
   - ❌ *Wrong:* `` `src/sema/checker.psm` coordinates semantic analysis... ``
   - ✅ *Right:* Lead with the problem it solves, what value it brings, or what the user is trying to accomplish.
2. **Never duplicate the page H1**:
   - The document title is already rendered as the page `<h1>`.
   - Never begin the body text with `# Heading`. Start with prose, and use `##` (H2) or deeper.
3. **Every page must have at least one runnable or output block**:
   - Include a runnable `bash`, `prismio`, or `text` code block.
   - If a page legitimately has no runnable block, explicitly declare in frontmatter:
     ```yaml
     no-command: "Reference table only; no command needed"
     ```
4. **Canonical Acronym Expansions (Zero Tolerance)**:
   - **AIF** = **Adaptive Inference Framework** (*NEVER "Allocation Inference Framework"*).
   - **UMS** = **Unified Manifest System**.
   - Always expand acronyms on first use per page.
5. **Planned Status Contract**:
   - If `status: planned`, the page **must explicitly state** that the feature is not implemented / coming soon. Never present planned syntax as currently usable.
6. **Code Snippet Verification**:
   - Standalone Prismio examples should be marked with test expectations for `verify-doc-examples.mjs`:
     ```markdown
     <!-- prismio-check: pass -->
     ```prismio
     fn main() {
         println("Hello, Prismio!");
     }
     ```
     ```

---

## 4. Entity Identity & SEO Disambiguation

"Prismio" is actively disambiguated in search engines and AI knowledge graphs from unrelated non-compiler entities. Maintain canonical signals:

### Canonical Entity Definition
> **Prismio** is a modern systems programming language and LLVM-based compiler designed for performance, memory ergonomics, and zero-cost safety.

### Official Ecosystem Nodes (Always Use in Structured Data / `sameAs`)
- **Website**: `https://prismio.org`
- **User Docs**: `https://docs.prismio.org`
- **Compiler Docs**: `https://developers.prismio.org`
- **Source Code**: `https://github.com/prismio-lang/prismio`
- **GitHub Org**: `https://github.com/prismio-lang`
- **Wikidata Item**: `https://www.wikidata.org/wiki/Q141648085` (QID: `Q141648085`)
- **Rosetta Code**: `https://rosettacode.org/wiki/Category:Prismio`
- **JetBrains Plugin**: `https://plugins.jetbrains.com/plugin/34672-prismio/`
- **Homebrew Tap**: `https://github.com/prismio-lang/homebrew-tap` (`brew tap prismio-lang/tap && brew install prismio`)
- **FOSS United Grant**: `https://fossunited.org/grants/prismio`
- **License**: Strictly **Apache-2.0** (`https://www.apache.org/licenses/LICENSE-2.0`) across all metadata, schema, and docs.

---

## 5. Coding & UI Constraints

1. **Zero Unintended Visual UI Changes**:
   - Do not alter UI design, layouts, typography, component hierarchies, or color palettes unless explicitly requested by the user.
2. **Framework Compatibility**:
   - Next.js 16 with React 19 is used in conjunction with `vinext` for Cloudflare Workers edge deployment. Avoid Node.js-only builtins in edge runtime code.
3. **Always Run Verification Before Finishing**:
   - Always execute `pnpm check-types` and `pnpm lint`.
   - If docs were modified, run `pnpm --filter docs audit:content` and `pnpm --filter developers audit:content`.

---

## 6. Static export and deployment (apps/web, apps/docs, apps/developers)

The three Cloudflare sites are **static exports** (`output: "export"` in each `next.config`). Every page is HTML in
Workers Static Assets, so a page view invokes no Worker; only requests with no matching asset reach the 0.28 KiB stub
Worker, which answers with the static `404.html`. That matters on the free plan: Worker requests are capped at 100,000
a day and 10 ms of CPU each, while static asset requests are free and unlimited.

- **No run-time server features.** No route handlers, middleware, `headers()`, `redirects()`, ISR, `dynamic = "force-dynamic"`
  or `next/image` optimisation (`images.unoptimized` is set). A page that needs one fails the export.
- **Redirects and headers** live in each app's `edge-rules.mjs`, which `scripts/finalize-static-site.mjs` writes to the
  `_redirects` and `_headers` files. Both files have limits (100 header rules, 2,000 static redirects).
- **Build and deploy:** `pnpm build:vinext` runs the Vite build, vinext's export and the finalize script;
  `pnpm deploy:vinext` builds and runs `cf deploy --prebuilt`. Do not use `vinext-cloudflare deploy`: it rebuilds
  without the finalize step.
- **Client navigation** fetches `<route>.txt` payloads (static files), so it needs no Worker either.
- **No Twitter/X** anywhere: no `twitter:*` metadata, links or icons.
