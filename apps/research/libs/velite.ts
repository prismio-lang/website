import { research } from ".velite";

export type Research = (typeof research)[number];

// Drafts are built nowhere: not a page, not the sitemap, not llms.txt.
export const entries: Research[] = research
    .filter((entry) => !entry.draft)
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));

export const byKind = (folder: string): Research[] => entries.filter((entry) => entry.folder === folder);

export const find = (folder: string, name: string): Research | undefined =>
    entries.find((entry) => entry.folder === folder && entry.name === name);
