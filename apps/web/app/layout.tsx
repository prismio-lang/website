import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import React from "react";
import {siteConfig} from "@/config/site";

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

export const metadata: Metadata = {
    title: siteConfig.name,
    description: siteConfig.description,
    keywords: [
        "Prismio",
        "Programming",
        "Language",
        "Open Source",
        "Cross platform",
        "Multi platform",
        "Software",
        "Development",
        "Native",
        "Performance",
        "System"
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
        <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} scrollbar-none`}>
                {children}
        </body>
        </html>
    );
}
