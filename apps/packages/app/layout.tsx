import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";

import ComingSoon from "@/components/ComingSoon";

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
    title: "Prismio Packages · Official & Community Registry (Coming Soon)",
    description: "Discover, install, and manage libraries and tools for the Prismio systems programming language.",
    keywords: [
        "Prismio",
        "Packages",
        "Registry",
        "Modules",
        "Libraries",
        "Systems Programming",
        "LLVM",
        "AIF",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light" style={{colorScheme: "light"}} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-zinc-900`}>
                <ComingSoon />
                {/* Once registry launches, replace <ComingSoon /> with {children} */}
            </body>
        </html>
    );
}
