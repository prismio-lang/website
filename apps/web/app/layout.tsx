import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import {siteConfig} from "@/config/site";

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
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#070709] text-zinc-100 scrollbar-none`}>
                {children}
        </body>
        </html>
    );
}
