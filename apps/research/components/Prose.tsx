import * as runtime from "react/jsx-runtime";
import { Children, cloneElement, isValidElement } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import Link from "next/link";
import GithubSlugger from "github-slugger";

function textOf(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textOf).join("");
    if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
    return "";
}

type WithChildren = ReactElement<{ children?: ReactNode }>;

function elementsOf(node: ReactNode): WithChildren[] {
    return Children.toArray(node).filter(isValidElement) as WithChildren[];
}

// A cell longer than this reads as a sentence, not a value: below 768px such a table stacks each row as a block,
// with every cell labelled by its column, instead of scrolling sideways through sentences a word wide.
const STACK_CELL_CHARS = 32;

// Labels each body cell with its column's heading (a `data-label` the phone stylesheet prints) and says whether the
// table carries prose. Attributes only: nothing here renders differently on a wide screen.
function labelCells(children: ReactNode): { children: ReactNode; stack: boolean } {
    const sections = elementsOf(children);
    const head = sections.find((section) => section.type === "thead");
    const headRow = head ? elementsOf(head.props.children)[0] : undefined;
    const labels = headRow ? elementsOf(headRow.props.children).map((cell) => textOf(cell.props.children).trim()) : [];
    let stack = false;
    const labelled = Children.map(children, (section) => {
        if (!isValidElement(section) || section.type !== "tbody") return section;
        const body = section as WithChildren;
        return cloneElement(body, {
            children: Children.map(body.props.children, (row) => {
                if (!isValidElement(row)) return row;
                const tr = row as WithChildren;
                let column = 0;
                return cloneElement(tr, {
                    children: Children.map(tr.props.children, (cell) => {
                        if (!isValidElement(cell)) return cell;
                        const td = cell as WithChildren;
                        if (textOf(td.props.children).length > STACK_CELL_CHARS) stack = true;
                        const label = labels[column++];
                        return label ? cloneElement(td, { "data-label": label } as Record<string, string>) : td;
                    }),
                });
            }),
        });
    });
    return { children: labelled, stack: stack && labels.length > 0 };
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
            const cells = labelCells(children);
            return (
                <div className={cells.stack ? "table-wrap table-stack" : "table-wrap"} role="region" tabIndex={0} aria-label="Table">
                    <table {...props}>{cells.children}</table>
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
