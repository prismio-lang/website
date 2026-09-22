import type { MetadataRoute } from "next";
import { docs } from "@/libs/velite";
import { docsConfig } from "@/config/docs";
import { generateDocsSitemap } from "@prismio/docs-core";

export default function sitemap(): MetadataRoute.Sitemap {
    return generateDocsSitemap(docs, docsConfig.site, ["start", "compiler/overview"]);
}
