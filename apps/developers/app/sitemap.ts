import type { MetadataRoute } from "next";
import { docs, type Docs } from "@/libs/velite";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
    const pages: MetadataRoute.Sitemap = (docs as Docs[]).map((doc) => ({
        url: `${siteConfig.siteUrl}/${doc.slug}`,
        lastModified: new Date(doc.lastUpdated),
        changeFrequency: doc.status === "coming-soon" ? "monthly" : "weekly",
        priority: doc.slug === "start" || doc.slug === "compiler/overview" ? 0.9 : 0.7,
    }));

    return [
        {
            url: siteConfig.siteUrl,
            lastModified: new Date("2026-09-08"),
            changeFrequency: "weekly",
            priority: 1,
        },
        ...pages,
    ];
}
