# Prismio Developers

The contributor reference for Prismio's self-hosted compiler, AIF memory analysis, LLVM backend, runtime, UMS project system, tests, and performance evidence.

## Local development

From the website workspace root:

```bash
pnpm --filter developers dev
```

The site runs at <http://localhost:3002>. Velite watches `content/` and regenerates `.velite/` alongside Next.js.

## Content contract

Every Markdown or MDX page under `content/` must include the metadata defined in `velite.config.ts`: title, description, version, implementation status, verification date, source links, and tags. Internal links are root-relative and must resolve to another content slug.

Run the contributor checks before publishing:

```bash
pnpm --filter developers build:content
pnpm --filter developers audit:content
pnpm --filter developers verify:examples
pnpm --filter developers lint
pnpm --filter developers check-types
pnpm --filter developers build
```
