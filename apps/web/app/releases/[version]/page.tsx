import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft, ExternalLink} from "lucide-react";
import ReleaseToc from "@/components/releases/ReleaseToc";
import {pageMetadata} from "@/lib/seo";
import {formatDate, getRelease, releases, tagUrl} from "@/lib/releases";

type Params = {version: string};

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
    return releases.map(({version}) => ({version}));
}

export async function generateMetadata({params}: {params: Promise<Params>}): Promise<Metadata> {
    const release = getRelease((await params).version);
    if (!release) return {};
    return pageMetadata({
        title: `${release.title} — Release Notes`,
        description: release.summary,
        path: `/releases/${release.version}`,
        type: "article",
    });
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

/** The rendered markdown is styled from here, so the generated HTML carries no classes. */
const PROSE = [
    "text-[0.95rem] leading-8 text-zinc-300",
    "[&_h2]:mt-16 [&_h2]:scroll-mt-28 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-white",
    "[&_h3]:mt-10 [&_h3]:scroll-mt-28 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white",
    "[&_p]:mt-4 [&_p]:max-w-3xl",
    "[&_strong]:font-semibold [&_strong]:text-zinc-100",
    "[&_a]:text-sky-300 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-sky-200",
    "[&_ul]:mt-4 [&_ul]:max-w-3xl [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ul]:marker:text-zinc-600",
    "[&_ol]:mt-4 [&_ol]:max-w-3xl [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-5",
    "[&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-zinc-100",
    "[&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#06070a] [&_pre]:p-4 [&_pre]:ring-1 [&_pre]:ring-white/[0.08]",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm [&_pre_code]:leading-relaxed",
    "[&_table]:mt-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_table]:leading-6",
    "[&_th]:border-b [&_th]:border-white/[0.12] [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-white",
    "[&_td]:border-b [&_td]:border-white/[0.06] [&_td]:px-4 [&_td]:py-3 [&_td]:align-top",
].join(" ");

export default async function ReleasePage({params}: {params: Promise<Params>}) {
    const release = getRelease((await params).version);
    if (!release) notFound();

    return (
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
            <Link href="/releases" className={`inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white ${FOCUS}`}>
                <ArrowLeft size={14} />
                All releases
            </Link>

            <header className="mt-8 max-w-3xl">
                <h1 className="text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">{release.title}</h1>
                <p className="mt-6 text-base leading-8 text-zinc-300 sm:text-lg">{release.summary}</p>
                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 font-mono text-sm">
                    <div>
                        <dt className="text-xs text-zinc-400">Published</dt>
                        <dd className="mt-1 text-white">
                            <time dateTime={release.date}>{formatDate(release.date)}</time>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-zinc-400">Status</dt>
                        <dd className="mt-1 text-white">{release.status}</dd>
                    </div>
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/install"
                        className={`inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200 ${FOCUS}`}
                    >
                        Install
                    </Link>
                    <a
                        href={tagUrl(release.version)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white ${FOCUS}`}
                    >
                        Archives on GitHub
                        <ExternalLink size={13} />
                    </a>
                </div>
            </header>

            <div className="mt-16 grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <ReleaseToc items={release.toc} />
                <article className={`min-w-0 ${PROSE} [&>:first-child]:mt-0`} dangerouslySetInnerHTML={{__html: release.html}} />
            </div>
        </main>
    );
}
