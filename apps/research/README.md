# Prismio Research

Papers and notes: the measured results and design records behind Prismio, with the method and the code that reproduces them. <https://research.prismio.org>

## Local development

From the website workspace root:

```bash
pnpm --filter research dev
```

The site runs at <http://localhost:3003>. Velite watches `content/` and regenerates `.velite/`.

## Writing an entry

A paper is `content/papers/<name>.md`, a note `content/notes/<name>.md`; the file name is the URL. The front matter is
defined in `velite.config.ts`:

- `title`, `description` (the snippet, 20 to 180 characters), `abstract` (the summary, not the same text);
- `published`, `updated`, `version` (the Prismio version it was measured on), `tags` (at least two);
- `findings`: self-contained statements a reader or a model can quote. A paper has at least two;
- `evidence`: links to the code or data that reproduces it. A paper has at least one;
- `faq`, `related`, `authors`, `status`, `draft`.

The body starts with prose, not a heading: the title is the page's `h1`. Write `{` and `<` inside code spans, because the
body is MDX.

## Checks

```bash
pnpm --filter research build:content   # Velite, then sitemap, feeds, llms.txt and the Markdown copies
pnpm --filter research audit:content   # front matter, internal links, duplicate titles
pnpm --filter research lint
pnpm --filter research check-types
pnpm --filter research build:vinext    # the static export, as CI builds it
```

## Design and deployment

- **Light only**, with Source Serif 4 for text, Inter for labels and tables, and JetBrains Mono for code. It does not
  use `docs-core`'s components or theme.
- **Static export** on Cloudflare Workers Static Assets, like the other sites: a page view invokes no Worker, so the free
  plan's 100,000 requests a day cap does not apply to readers. Headers and redirects are in `edge-rules.mjs`.
- **Search and answer engines**: canonical, Open Graph, Google Scholar `citation_*` tags, JSON-LD, `sitemap.xml`,
  `feed.xml`, `llms.txt`, `llms-full.txt`, and a Markdown copy of every entry at its URL plus `.md`.
- Deploy with `pnpm --filter research deploy:vinext`; create the Cloudflare project named `research` and point
  `research.prismio.org` at it.
