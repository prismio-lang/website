// Re-export from Velite's generated output.
// This file exists so we have a single import alias (@/libs/velite)
// throughout the codebase.

export { docs } from ".velite";

export type DocStatus = "implemented" | "experimental" | "draft" | "coming-soon";

export type Docs = {
    title: string;
    description: string;
    status: DocStatus;
    version: string;
    lastUpdated: string;
    tags: string[];
    related: string[];
    slug: string;
    raw: string;
    code: string;
};
