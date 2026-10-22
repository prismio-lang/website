import Link from "next/link";
import { kinds, site } from "@/config/site";

export function Header() {
    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link href="/" className="wordmark">
                    Prismio <span>Research</span>
                </Link>
                <nav className="site-nav" aria-label="Primary">
                    <Link href="/papers">{kinds.papers.label}</Link>
                    <Link href="/notes">{kinds.notes.label}</Link>
                    <Link href="/about">About</Link>
                    <a href={site.links.docs}>Docs</a>
                    <a href={site.links.github}>GitHub</a>
                </nav>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
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
