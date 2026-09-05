import type { Metadata, Viewport } from "next";
import "./globals.css";
import HeaderMain from "@/components/HeaderMain";
import DocsNav from "@/app/Nav";
import SearchModal from "@/components/SearchModal";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
        default: `${siteConfig.shortName} documentation`,
        template: `%s | ${siteConfig.shortName} docs`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.author, url: siteConfig.authorURL }],
    creator: siteConfig.author,
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: "/",
        title: `${siteConfig.shortName} documentation`,
        description: siteConfig.description,
        siteName: siteConfig.name,
    },
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)||!t){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
                    }}
                />
            </head>
            <body className="font-sans font-[450] antialiased">
                <ThemeProvider>
                    <a href="#main-content" className="sr-only z-[120] rounded-md bg-white px-4 py-2 text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
                        Skip to content
                    </a>
                    <HeaderMain />
                    <SearchModal />

                    <div className="relative flex min-h-[calc(100vh-4rem)]">
                        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto no-scrollbar border-r border-zinc-200 px-3 py-5 lg:block dark:border-zinc-800/80">
                            <DocsNav className="w-full pb-12" />
                        </aside>
                        <main id="main-content" className="min-w-0 flex-1 px-5 pb-20 pt-8 sm:px-8 lg:px-8">
                            {children}
                        </main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
