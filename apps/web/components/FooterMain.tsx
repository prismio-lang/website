import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function FooterMain() {
    return (
        <footer className="relative border-t border-white/10 mt-32 z-[100]">
            <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
                {/* Column — About */}
                <div className="space-y-4 col-span-2 md:col-span-1">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image src="/icons/prismio.png" alt="Logo" width={32} height={32}/>
                        </div>
                        <span className="font-semibold text-xl text-white">Prismio</span>
                    </Link>

                    <p className="text-gray-400 leading-relaxed max-w-xs">
                        A systems programming language focused on performance, safety, and
                        AI-native tooling, built in the open.
                    </p>
                </div>

                {/* Column — Developer */}
                <div className="space-y-3 md:pl-4">
                    <h5 className="font-medium text-gray-200 tracking-tight">Developer</h5>
                    <FooterLink href="/docs">Documentation</FooterLink>
                    <FooterLink href="/install">Install</FooterLink>
                    <FooterLink href="/playground">Playground</FooterLink>
                    <FooterLink href="/packages">Packages</FooterLink>
                </div>

                {/* Column — Project */}
                <div className="space-y-3 md:pl-8">
                    <h5 className="font-medium text-gray-200 tracking-tight">Project</h5>
                    <FooterLink href="https://github.com/prismio-lang/prismio">Repository</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio/issues">Issues</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio/pulls">Contribute</FooterLink>
                </div>

                {/* Column — Community */}
                <div className="space-y-3 md:pl-12">
                    <h5 className="font-medium text-gray-200 tracking-tight">Community</h5>
                    <FooterLink href="https://discord.gg/RUXJjnJF">Discord</FooterLink>
                    <FooterLink href="/community">Twitter / X</FooterLink>
                </div>
            </div>

            <div className="border-t border-white/10 px-8 py-6 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} Prismio. Built with intention and respect for developers.
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-gray-400 hover:text-gray-200 transition-colors"
        >
            {children}
        </Link>
    );
}

function Social({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
        >
            {children}
        </a>
    );
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .5C5.65.5.5 5.66.5 12.07c0 5.11 3.29 9.44 7.86 10.97.58.11.79-.25.79-.56l-.01-2.02c-3.2.71-3.88-1.36-3.88-1.36-.53-1.37-1.29-1.73-1.29-1.73-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.21 1.78 1.21 1.04 1.83 2.72 1.3 3.38.99.11-.77.41-1.3.74-1.6-2.55-.29-5.24-1.29-5.24-5.76 0-1.27.45-2.32 1.2-3.14-.12-.3-.52-1.52.11-3.17 0 0 .97-.31 3.18 1.21a10.6 10.6 0 0 1 2.9-.39c.99 0 1.99.13 2.9.39 2.21-1.52 3.17-1.21 3.17-1.21.64 1.65.24 2.87.12 3.17.75.82 1.2 1.87 1.2 3.14 0 4.49-2.71 5.46-5.29 5.75.42.36.8 1.09.8 2.2v3.27c0 .32.21.68.8.56 4.58-1.53 7.87-5.86 7.87-10.97C23.5 5.66 18.35.5 12 .5z" />
        </svg>
    );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.4 4.8c-.8.4-1.7.7-2.6.8a4.5 4.5 0 0 0 2-2.5 9.2 9.2 0 0 1-2.9 1.1A4.6 4.6 0 0 0 16.3 3c-2.6 0-4.7 2.3-4.1 4.8A13 13 0 0 1 3.2 4.2c-1.3 2.2-.7 5.2 1.7 6.6-.7 0-1.4-.2-2-.5 0 2.3 1.6 4.4 4 4.9-.7.2-1.5.2-2.2 0 .6 2 2.5 3.4 4.7 3.4A9.3 9.3 0 0 1 2 20a13.1 13.1 0 0 0 7.1 2" />
        </svg>
    );
}
