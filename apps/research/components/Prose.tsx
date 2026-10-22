import * as runtime from "react/jsx-runtime";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import GithubSlugger from "github-slugger";

function textOf(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textOf).join("");
    if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
    return "";
}

function components() {
    const slugger = new GithubSlugger();
    const heading = (Tag: "h2" | "h3" | "h4") =>
        function Heading({ children, ...props }: ComponentProps<"h2">) {
            const id = slugger.slug(textOf(children));
            return (
                <Tag {...props} id={id}>
                    {Tag === "h4" ? children : <a href={`#${id}`}>{children}</a>}
                </Tag>
            );
        };
    return {
        h2: heading("h2"),
        h3: heading("h3"),
        h4: heading("h4"),
        a({ href = "", children, ...props }: ComponentProps<"a">) {
            if (href.startsWith("/") || href.startsWith("#")) {
                return <Link href={href} {...props}>{children}</Link>;
            }
            return <a href={href} rel="noopener" {...props}>{children}</a>;
        },
        table({ children, ...props }: ComponentProps<"table">) {
            return (
                <div className="table-wrap" role="region" tabIndex={0} aria-label="Table">
                    <table {...props}>{children}</table>
                </div>
            );
        },
    };
}

// The compiled MDX that velite emits is a function body that returns the module. It runs here at build time,
// so the page ships as HTML and the reader's browser runs none of it.
export function Prose({ code }: { code: string }) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const Component = new Function(code)({ ...runtime }).default;
    return (
        <div className="prose">
            <Component components={components()} />
        </div>
    );
}
