import type { Metadata, Viewport } from "next";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Footer, Header } from "@/components/SiteChrome";
import { site } from "@/config/site";

export const metadata: Metadata = {
    metadataBase: new URL(site.url),
    title: { default: `${site.name}: measured results from the Prismio compiler`, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    authors: [{ name: site.author.name, url: site.author.url }],
    creator: site.author.name,
    publisher: site.publisher.name,
    alternates: { canonical: "/", types: { "application/atom+xml": "/feed.xml" } },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
    },
    openGraph: {
        type: "website",
        siteName: site.name,
        locale: "en_US",
        url: "/",
        title: site.name,
        description: site.description,
        images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.name }],
    },
    category: "technology",
};

// Light only: the colour scheme is fixed in CSS and declared here so the browser does not darken the page.
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    colorScheme: "only light",
    themeColor: "#fdfcf9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang={site.language}>
            <body>
                <a className="skip" href="#main">Skip to content</a>
                <Header />
                <main id="main">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
