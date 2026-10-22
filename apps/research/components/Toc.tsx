import type { TocItem } from "@/libs/toc";

function List({ items }: { items: TocItem[] }) {
    return (
        <ol>
            {items.map((item) => (
                <li key={item.id} className={item.level === 3 ? "sub" : undefined}>
                    <a href={`#${item.id}`}>{item.text}</a>
                </li>
            ))}
        </ol>
    );
}

// Two renderings of one list: a sticky column on a wide screen, a disclosure above the text on a narrow one.
// CSS shows one; neither needs script.
export function TocInline({ items }: { items: TocItem[] }) {
    if (items.length < 3) return null;
    return (
        <details className="toc toc-inline narrow-only">
            <summary>Contents</summary>
            <List items={items} />
        </details>
    );
}

export function TocSide({ items }: { items: TocItem[] }) {
    if (items.length < 3) return <div className="rail" aria-hidden="true" />;
    return (
        <nav className="rail toc" aria-label="Contents">
            <h2>Contents</h2>
            <List items={items} />
        </nav>
    );
}
