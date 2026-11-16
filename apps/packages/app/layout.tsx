import type {Metadata, Viewport} from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import {siteConfig} from "@/config/site";
import {JsonLd} from "@/components/json-ld";
import {siteStructuredData} from "@/config/structured-data";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#ffffff",
    colorScheme: "light",
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
    title: {default: "Prismio Packages: libraries for Prismio", template: "%s · Prismio Packages"},
    description: siteConfig.description,
    applicationName: siteConfig.name,
    alternates: {canonical: "/"},
    icons: {
        icon: [
            {url: "/favicon.ico", sizes: "32x32"},
            {url: "/icons/prismio.png", sizes: "512x512", type: "image/png"},
        ],
        apple: [{url: "/icons/prismio.png", sizes: "180x180", type: "image/png"}],
    },
    openGraph: {
        type: "website",
        siteName: siteConfig.name,
        title: "Prismio Packages: libraries for Prismio",
        description: siteConfig.description,
        url: siteConfig.url,
        locale: "en_US",
        images: [{url: "/icons/og-card.jpg", width: 1200, height: 630, alt: "Prismio logo"}],
    },
    twitter: {card: "summary_large_image", title: "Prismio Packages", description: siteConfig.description, images: ["/icons/og-card.jpg"]},
    keywords: ["Prismio", "package registry", "Prismio packages", "build.ums", "LLVM", "systems programming language"],
    authors: [{name: siteConfig.author, url: siteConfig.authorURL}],
    creator: siteConfig.author,
    publisher: siteConfig.author,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light" style={{colorScheme: "light"}} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-zinc-900`}>
                <JsonLd data={siteStructuredData}/>
                {children}
            </body>
        </html>
    );
}
