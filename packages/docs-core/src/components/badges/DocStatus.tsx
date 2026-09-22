import type { ElementType } from "react";
import { FlaskConical, Rocket, PenLine, Sparkles } from "lucide-react";
import type { DocStatus } from "../../types";

interface StatusConfig {
    label: string;
    tag: string;
    summary: string;
    icon: ElementType;
    colors: {
        eyebrowText: string;
        cardBorder: string;
        cardBg: string;
        cardBar: string;
        iconBg: string;
        iconBorder: string;
        iconText: string;
        tagText: string;
    };
}

const statusConfig: Record<DocStatus, StatusConfig> = {
    stable: {
        label: "Stable",
        tag: "Verified",
        summary: "Available in the audited Prismio 0.1.0 compiler.",
        icon: Sparkles,
        colors: {
            eyebrowText: "text-emerald-600",
            cardBorder: "border-emerald-500/20 dark:border-emerald-500/20",
            cardBg: "bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.01] to-transparent dark:from-emerald-500/10 dark:via-emerald-500/[0.02]",
            cardBar: "bg-emerald-500 dark:bg-emerald-400",
            iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
            iconBorder: "border-emerald-500/20 dark:border-emerald-400/20",
            iconText: "text-emerald-600 dark:text-emerald-400",
            tagText: "text-emerald-800 dark:text-emerald-300",
        },
    },
    experimental: {
        label: "Experimental",
        tag: "Active Development",
        summary: "Present in Prismio 0.1.0, but its interface, syntax, or semantics may change substantially before 1.0 stabilization.",
        icon: FlaskConical,
        colors: {
            eyebrowText: "text-amber-600",
            cardBorder: "border-amber-500/25 dark:border-amber-500/20",
            cardBg: "bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent dark:from-amber-500/10 dark:via-amber-500/[0.02]",
            cardBar: "bg-amber-500 dark:bg-amber-400",
            iconBg: "bg-amber-500/10 dark:bg-amber-400/10",
            iconBorder: "border-amber-500/20 dark:border-amber-400/20",
            iconText: "text-amber-600 dark:text-amber-400",
            tagText: "text-amber-800 dark:text-amber-300",
        },
    },
    planned: {
        label: "Planned",
        tag: "Future Release",
        summary: "Planned for a future release; not implemented in Prismio 0.1.0. Illustrative syntax on this page does not compile.",
        icon: Rocket,
        colors: {
            eyebrowText: "text-fuchsia-600",
            cardBorder: "border-fuchsia-500/25 dark:border-fuchsia-500/20",
            cardBg: "bg-gradient-to-r from-fuchsia-500/[0.07] via-fuchsia-500/[0.02] to-transparent dark:from-fuchsia-500/10 dark:via-fuchsia-500/[0.02]",
            cardBar: "bg-fuchsia-500 dark:bg-fuchsia-400",
            iconBg: "bg-fuchsia-500/10 dark:bg-fuchsia-400/10",
            iconBorder: "border-fuchsia-500/20 dark:border-fuchsia-400/20",
            iconText: "text-fuchsia-600 dark:text-fuchsia-400",
            tagText: "text-fuchsia-800 dark:text-fuchsia-300",
        },
    },
};

const draftConfig: StatusConfig = {
    label: "Draft",
    tag: "Working Specification",
    summary: "Compiler-derived draft documentation that is not yet a frozen compatibility contract.",
    icon: PenLine,
    colors: {
        eyebrowText: "text-sky-600",
        cardBorder: "border-sky-500/25 dark:border-sky-500/20",
        cardBg: "bg-gradient-to-r from-sky-500/[0.07] via-sky-500/[0.02] to-transparent dark:from-sky-500/10 dark:via-sky-500/[0.02]",
        cardBar: "bg-sky-500 dark:bg-sky-400",
        iconBg: "bg-sky-500/10 dark:bg-sky-400/10",
        iconBorder: "border-sky-500/20 dark:border-sky-400/20",
        iconText: "text-sky-600 dark:text-sky-400",
        tagText: "text-sky-800 dark:text-sky-300",
    },
};

export function statusLabel(status: DocStatus) {
    return statusConfig[status]?.label ?? status;
}

export function DocStatusBadge({ status, draft }: { status: DocStatus; draft?: boolean }) {
    const config = draft ? draftConfig : statusConfig[status];
    if (!config) return null;

    if (status === "stable" && !draft) {
        return null;
    }

    return (
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.colors.eyebrowText}`}>
            {config.label.toUpperCase()}
        </span>
    );
}

export function DocStatusNotice({ status, draft }: { status: DocStatus; draft?: boolean }) {
    const config = draft ? draftConfig : statusConfig[status];
    if (!config) return null;

    if (status === "stable" && !draft) {
        return null;
    }

    const { colors, label, tag, summary, icon: Icon } = config;

    return (
        <aside
            aria-label={`${label} notice`}
            className={`relative mt-6 overflow-hidden rounded-xl border pl-4 pr-5 py-3.5 transition-all ${colors.cardBorder} ${colors.cardBg}`}
        >
            <div className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${colors.cardBar}`} />

            <div className="flex items-start gap-3.5 pl-1.5">
                <div
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border shadow-xs ${colors.iconBorder} ${colors.iconBg} ${colors.iconText}`}
                >
                    <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-xs font-semibold uppercase tracking-wider ${colors.tagText}`}>
                            {label} Feature
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            {tag}
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {summary}
                    </p>
                </div>
            </div>
        </aside>
    );
}
