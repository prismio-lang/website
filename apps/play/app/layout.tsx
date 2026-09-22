import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import React from 'react';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});

const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata: Metadata = {
    title: 'Prismio Playground · Interactive Compiler Workspace',
    description: 'Write, run, and inspect Prismio code online. Analyze Adaptive Inference Framework (AIF) storage placement, examine LLVM IR, and explore AST diagnostics in real-time.',
    keywords: [
        'Prismio',
        'Playground',
        'Compiler',
        'Interactive',
        'AIF',
        'Adaptive Inference Framework',
        'LLVM',
        'Systems Programming',
        'IDE',
        'Online Compiler',
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#070709] text-[#e4e4e7] min-h-screen flex flex-col selection:bg-[#47d7b5]/30 selection:text-white`}
            >
                {children}
            </body>
        </html>
    );
}
