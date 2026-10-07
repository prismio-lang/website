import {pageMetadata} from "@/lib/seo";
import Link from "next/link";
import {ArrowUpRight, ExternalLink} from "lucide-react";
import {formatDate, latestRelease, releases, tagUrl} from "@/lib/releases";

export const metadata = pageMetadata({
    title: "Prismio Release Notes — Every Version, What Changed",
    description: "Release notes for every Prismio version: downloads, what is new, breaking changes, what is not included, and known limits.",
    path: "/releases",
});

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";
const REPO = "https://github.com/prismio-lang/prismio";

export default function ReleasesPage() {
    return (
        <main className="relative z-10 mx-auto max-w-4xl px-6 py-20 md:py-28">
            <section className="text-center">
                <h1 className="text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
                    Release <span className="text-sky-300">notes</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
                    What each version of Prismio contains, what it broke, and what it leaves out. Newest first.
                </p>
            </section>

            <ol className="mt-16 space-y-4">
                {releases.map((release, i) => (
                    <li key={release.version}>
                        <Link
                            href={`/releases/${release.version}`}
                            className={`group block rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 p-7 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.04] ${FOCUS}`}
                        >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{release.title}</h2>
                                {i === 0 && (
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
                                        Latest
                                    </span>
                                )}
                                <time dateTime={release.date} className="font-mono text-sm text-zinc-400 sm:ml-auto">
                                    {formatDate(release.date)}
                                </time>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{release.summary}</p>
                            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300">
                                Read the notes
                                <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>

            <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                <a href={`${REPO}/releases`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-zinc-200 underline underline-offset-4 hover:text-white ${FOCUS}`}>
                    Archives on GitHub Releases <ExternalLink size={12} />
                </a>
                {latestRelease && (
                    <a href={tagUrl(latestRelease.version)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-zinc-200 underline underline-offset-4 hover:text-white ${FOCUS}`}>
                        Tag v{latestRelease.version} <ExternalLink size={12} />
                    </a>
                )}
                <Link href="/install" className={`text-zinc-200 underline underline-offset-4 hover:text-white ${FOCUS}`}>
                    Install Prismio
                </Link>
            </p>
        </main>
    );
}
