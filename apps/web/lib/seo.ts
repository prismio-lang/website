import type {Metadata} from "next";
import {siteConfig} from "@/config/site";

const IMAGES = [
    {url: "/icons/og-card.jpg", width: 1200, height: 630, alt: "Prismio logo"},
    {url: "/icons/prismio.png", width: 512, height: 512, alt: "Prismio logo"},
    {url: "/icons/prismio-banner.png", width: 489, height: 121, alt: "Prismio logo and wordmark"},
];

/**
 * Title, description and canonical URL for a page, and the same title, description and URL as Open Graph.
 * A page's `openGraph` replaces the root layout's whole object, so without it every page is shared as the home page.
 */
export function pageMetadata({
    title,
    description,
    path,
    type = "website",
}: {
    title: string;
    description: string;
    path: string;
    type?: "website" | "article";
}): Metadata {
    return {
        title,
        description,
        alternates: {canonical: path},
        openGraph: {type, siteName: siteConfig.name, locale: "en_US", title, description, url: path, images: IMAGES},
    };
}
