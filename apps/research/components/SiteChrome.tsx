import Image from "next/image";
import Link from "next/link";
import { kinds, site } from "@/config/site";

// The same header as the other Prismio sites: the mark, the wordmark, the site's name in the brand colour, a version pill,
// and GitHub at the far edge, across the full width with the same side padding.
export function Header() {
    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link href="/" className="brand" aria-label="Prismio Research, home">
                    <Image src="/icons/prismio.png" alt="" width={32} height={32} priority />
                    <span className="brand-name">Prismio</span>
                    <span className="brand-tag">Research</span>
                </Link>
                <span className="version-pill">v{site.version}</span>
                <nav className="site-nav" aria-label="Primary">
                    <Link href="/papers">{kinds.papers.label}</Link>
                    <Link href="/notes">{kinds.notes.label}</Link>
                    <Link href="/about">About</Link>
                    <a href={site.links.docs}>Docs</a>
                    <a href={site.links.github} className="icon-link" aria-label="Prismio on GitHub">
                        <Image src="/icons/github-mark.svg" alt="" width={20} height={20} />
                    </a>
                </nav>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="frame site-footer-inner">
                <div>
                    <p>
                        {site.name}. Text and figures under the{" "}
                        <a href={site.license} rel="license">
                            {site.licenseName} license
                        </a>
                        .
                    </p>
                    <p>
                        By <a href={site.author.url}>{site.author.name}</a> for{" "}
                        <a href={site.links.home}>Prismio</a>.
                    </p>
                </div>
                <ul>
                    <li><a href="/feed.xml">Feed</a></li>
                    <li><a href="/llms.txt">llms.txt</a></li>
                    <li><a href="/sitemap.xml">Sitemap</a></li>
                    <li><a href={site.links.developers}>Compiler reference</a></li>
                </ul>
            </div>
        </footer>
    );
}
