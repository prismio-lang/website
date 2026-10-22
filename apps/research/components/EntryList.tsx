import Link from "next/link";
import { formatDate } from "@/libs/format";
import { pathOf } from "@/libs/seo";
import type { Research } from "@/libs/velite";

export function EntryList({ entries, heading: Heading = "h2" }: { entries: Research[]; heading?: "h2" | "h3" }) {
    return (
        <ol className="entries">
            {entries.map((entry) => (
                <li key={entry.slug} className="entry">
                    <time className="entry-when" dateTime={entry.published.slice(0, 10)}>
                        {formatDate(entry.published)}
                    </time>
                    <div>
                        <Heading>
                            <Link href={pathOf(entry)}>{entry.title}</Link>
                        </Heading>
                        <p>{entry.description}</p>
                        <ul className="pills">
                            <li className="pill pill-accent">{entry.kind === "paper" ? "Paper" : "Note"}</li>
                            <li className="pill">Prismio {entry.version}</li>
                            <li className="pill">{entry.minutes} min read</li>
                        </ul>
                    </div>
                </li>
            ))}
        </ol>
    );
}
