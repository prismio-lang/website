import releasesJson from "./releases.generated.json";

export interface Release {
    version: string;
    title: string;
    date: string;
    status: string;
    summary: string;
    /** The release file's body, rendered by scripts/generate-releases.mjs. */
    html: string;
    toc: {id: string; text: string}[];
}

/** Every release, newest first. Regenerated from content/releases by `pnpm build:releases`. */
export const releases: Release[] = releasesJson;

export const getRelease = (version: string) => releases.find((release) => release.version === version);

export const latestRelease: Release | undefined = releases[0];

export const tagUrl = (version: string) => `https://github.com/prismio-lang/prismio/releases/tag/v${version}`;

export const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric", timeZone: "UTC"});
