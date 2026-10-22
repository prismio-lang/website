import Link from "next/link";
import { formatDate } from "@/libs/format";
import { pathOf } from "@/libs/seo";
import type { Research } from "@/libs/velite";

export function EntryList({ entries, heading: Heading = "h2" }: { entries: Research[]; heading?: "h2" | "h3" }) {
    return (
        <ol className="entries">
            {entries.map((entry) => (
                <li key={entry.slug} className="entry">
                    <Heading>
                        <Link href={pathOf(entry)}>{entry.title}</Link>
                    </Heading>
                    <ul className="meta">
                        <li><time dateTime={entry.published.slice(0, 10)}>{formatDate(entry.published)}</time></li>
                        <li>{entry.kind === "paper" ? "Paper" : "Note"}</li>
                        <li>Prismio {entry.version}</li>
                        <li>{entry.minutes} min read</li>
                    </ul>
                    <p>{entry.description}</p>
                </li>
            ))}
        </ol>
    );
}
