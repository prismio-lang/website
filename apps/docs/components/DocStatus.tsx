import type { DocStatus } from "@/libs/velite";

const statusDetails: Record<DocStatus, { label: string; summary: string; classes: string }> = {
    implemented: {
        label: "Implemented",
        summary: "Available in the audited Prismio 0.1.0 compiler. Pre-1.0 syntax may still change.",
        classes: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    },
    experimental: {
        label: "Experimental",
        summary: "Present in Prismio 0.1.0, but its interface or semantics may change substantially.",
        classes: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
    },
    draft: {
        label: "Draft",
        summary: "Compiler-derived documentation that is not yet a frozen compatibility contract.",
        classes: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100",
    },
    "coming-soon": {
        label: "Coming Soon",
        summary: "Not implemented in Prismio 0.1.0. Illustrative syntax on this page does not compile.",
        classes: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-100",
    },
};

export function statusLabel(status: DocStatus) {
    return statusDetails[status].label;
}

export function DocStatusBadge({ status }: { status: DocStatus }) {
    const detail = statusDetails[status];

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${detail.classes}`}>
            {detail.label}
        </span>
    );
}

export function DocStatusNotice({ status }: { status: DocStatus }) {
    const detail = statusDetails[status];

    return (
        <div className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${detail.classes}`}>
            <strong>{detail.label}.</strong> {detail.summary}
        </div>
    );
}
