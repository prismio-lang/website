import type {Metadata, Viewport} from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import {siteConfig} from "@/config/site";
import {JsonLd} from "@/components/json-ld";
import {prismioStructuredData} from "@/config/structured-data";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#070709",
    colorScheme: "dark",
};

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});

const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: "Prismio — Systems Programming Language for Native Performance",
    description: siteConfig.description,
    applicationName: siteConfig.name,
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "32x32" },
            { url: "/icons/prismio.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/icons/prismio.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
        canonical: "/",
        types: {
            "application/atom+xml": siteConfig.releasesFeed,
        },
    },
    openGraph: {
        type: "website",
        siteName: siteConfig.name,
        title: "Prismio — Systems Programming Language for Native Performance",
        description: siteConfig.description,
        locale: "en_US",
        images: [
            {url: "/icons/prismio.png", width: 512, height: 512, alt: "Prismio logo"},
            {url: "/icons/prismio-banner.png", width: 489, height: 121, alt: "Prismio logo and wordmark"},
        ],
    },
    twitter: {
        card: "summary",
        title: siteConfig.name,
        description: siteConfig.description,
        images: ["/icons/prismio.png"],
    },
    robots: {index: true, follow: true},
    keywords: [
        "Prismio",
        "systems programming language",
        "native compiler",
        "LLVM compiler",
        "C interoperability",
        "memory placement",
        "Adaptive Inference Framework",
        "open source compiler",
    ],
    authors: [
        {
            name: siteConfig.author,
            url: siteConfig.authorURL,
        },
    ],
    creator: siteConfig.author,
    publisher: siteConfig.author
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" style={{colorScheme: "dark"}} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#070709] text-zinc-100 scrollbar-none`}>
        <JsonLd data={prismioStructuredData} />
                {children}
        </body>
        </html>
    );
}
