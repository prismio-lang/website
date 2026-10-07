"use client";

import {useEffect, useRef, useState} from "react";

interface TocItem {
    id: string;
    text: string;
}

/** Heading whose top has passed this many pixels from the viewport top is the one being read (the fixed header is ~80px). */
const READ_LINE = 140;

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "On this page": follows the scroll, marking the section being read with a bar that slides between entries. */
export default function ReleaseToc({items}: {items: TocItem[]}) {
    const [active, setActive] = useState(items[0]?.id ?? "");
    const [bar, setBar] = useState<{top: number; height: number} | null>(null);
    const itemRefs = useRef(new Map<string, HTMLLIElement>());

    useEffect(() => {
        const update = () => {
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            let current = items[0]?.id ?? "";
            if (atBottom) {
                current = items[items.length - 1]?.id ?? current;
            } else {
                for (const {id} of items) {
                    const heading = document.getElementById(id);
                    if (heading && heading.getBoundingClientRect().top <= READ_LINE) current = id;
                }
            }
            setActive(current);
        };
        update();
        window.addEventListener("scroll", update, {passive: true});
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, [items]);

    useEffect(() => {
        const li = itemRefs.current.get(active);
        if (li) setBar({top: li.offsetTop, height: li.offsetHeight});
    }, [active]);

    const go = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        const heading = document.getElementById(id);
        if (!heading) return;
        event.preventDefault();
        heading.scrollIntoView({behavior: reducedMotion() ? "auto" : "smooth", block: "start"});
        history.replaceState(null, "", `#${id}`);
    };

    return (
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">On this page</p>
            <ul className="relative mt-3 space-y-2 border-l border-white/[0.08] text-sm">
                {bar && (
                    <span
                        aria-hidden
                        className="absolute -left-px w-px bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-[transform,height] duration-300 ease-out motion-reduce:transition-none"
                        style={{height: bar.height, transform: `translateY(${bar.top}px)`}}
                    />
                )}
                {items.map((item) => (
                    <li
                        key={item.id}
                        ref={(el) => {
                            if (el) itemRefs.current.set(item.id, el);
                            else itemRefs.current.delete(item.id);
                        }}
                    >
                        <a
                            href={`#${item.id}`}
                            onClick={(event) => go(event, item.id)}
                            aria-current={active === item.id ? "location" : undefined}
                            className={`block pl-4 transition-[color,transform] duration-300 motion-reduce:transition-none ${FOCUS} ${
                                active === item.id ? "translate-x-0.5 font-medium text-white" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
