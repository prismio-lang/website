"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import NextImage from "next/image";
import React, { JSX, useState } from "react";
import { VirtualAnchor, virtualAnchorEncode} from "@/components/virtual-anchor";
import { cn } from "@heroui/react";
import { Copy, Check } from "lucide-react";
import {
    StringStorageDiagram,
    StringViewLifetimeDiagram,
} from "@/components/string-representation-diagrams";

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 cursor-pointer rounded-md text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Copy code"
        >
            {copied ? (
                <Check size={14} className="text-green-600 dark:text-green-400" />
            ) : (
                <Copy size={14} />
            )}
        </button>
    );
};

const getTextContent = (node: any): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(getTextContent).join("");
    if (node.props && node.props.children) return getTextContent(node.props.children);
    return "";
};

const Trow: React.FC<{children?: React.ReactNode}> = ({children}) => {
    return (
        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 even:bg-zinc-50/30 dark:even:bg-zinc-900/10">
            {children}
        </tr>
    );
};

const Tcol: React.FC<{children?: React.ReactNode}> = ({children}) => {
    return (
        <td className="text-sm p-3 max-w-[200px] overflow-auto whitespace-normal break-normal text-zinc-700 dark:text-zinc-300">
            {children}
        </td>
    );
};

export interface LinkedHeadingProps {
    as: keyof JSX.IntrinsicElements;
    id?: string;
    linked?: boolean;
    children?: React.ReactNode;
    className?: string;
}

const linkedLevels: Record<string, number> = {
    h1: 0,
    h2: 1,
    h3: 2,
    h4: 3,
};

const LinkedHeading: React.FC<LinkedHeadingProps> = ({
                                                         as,
                                                         linked = true,
                                                         id: idProp,
                                                         className,
                                                         ...props
                                                     }) => {
    const Component = as;

    const level = linkedLevels[as] || 1;

    const id = idProp || virtualAnchorEncode(props.children as string);

    return (
        <Component
            className={cn("linked-heading", className)}
            data-id={id}
            data-level={level}
            data-name={props.children}
            id={id}
            {...props}>
            {linked ? <VirtualAnchor id={id}>{props.children}</VirtualAnchor> : <>{props.children}</>}
        </Component>
    );
};

const Pre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, className, style, ...props }) => {
    const codeText = getTextContent(children);

    // Find if the child is a <code> element and check its class for language
    let lang = "code";
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props && (child.props as any).className) {
            const match = (child.props as any).className.match(/language-(\w+)/);
            if (match) {
                lang = match[1];
            }
        }
    });

    return (
        <div className="my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header bar — matches Shiki bg via CSS var */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-200 text-xs font-mono text-zinc-500 dark:border-zinc-800 dark:text-zinc-300">
                <span className="uppercase tracking-wider font-semibold">{lang}</span>
                <CopyButton text={codeText} />
            </div>
            {/* Code container — style has Shiki base text/bg color; CSS vars handle per-token colors */}
            <pre
                {...props}
                className={cn(
                    "p-4 overflow-x-auto text-sm font-mono leading-relaxed",
                    className
                )}
                style={style}
            >
                {children}
            </pre>
        </div>
    );
};

const Code: React.FC<React.HTMLAttributes<HTMLElement>> = ({
                                                               children,
                                                               className,
                                                               ...props
                                                           }) => {
    const isInline = !className;

    if (isInline) {
        return (
            <code className="px-1.5 py-0.5 rounded-md text-sm font-mono dark:bg-zinc-800 text-red-600 dark:text-red-400" {...props}>
                {children}
            </code>
        );
    }

    return (
        <code className={cn("font-mono text-sm", className)} {...props}>
            {children}
        </code>
    );
};

export const MDXComponents = {
    NextImage,
    StringStorageDiagram,
    StringViewLifetimeDiagram,

    pre: Pre,
    code: Code,

    // Text & Semantics
    p: (props: any) => <p className="my-4 leading-7 text-zinc-700 dark:text-zinc-200" {...props} />,
    ul: (props: any) => <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-200" {...props} />,
    ol: (props: any) => <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-200" {...props} />,
    li: (props: any) => <li className="leading-7" {...props} />,
    a: ({ href, ...props }: any) => {
        const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
        return (
            <a
                href={href}
                className="font-medium text-violet-700 transition-colors hover:underline dark:text-violet-300"
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
            />
        );
    },
    blockquote: (props: any) => (
        <blockquote className="my-5 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 italic text-blue-950 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-100" {...props} />
    ),

    h1: (props: React.HTMLAttributes<HTMLElement>) => (
        <LinkedHeading
            as="h1"
            linked={false}
            className="text-4xl font-bold mt-8 mb-4 tracking-tight text-zinc-900 dark:text-white"
            {...props}
        />
    ),

    h2: (props: React.HTMLAttributes<HTMLElement>) => (
        <LinkedHeading
            as="h2"
            className="text-2xl font-semibold mt-8 mb-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-2 text-zinc-900 dark:text-zinc-100"
            {...props}
        />
    ),

    h3: (props: React.HTMLAttributes<HTMLElement>) => (
        <LinkedHeading
            as="h3"
            className="text-xl font-semibold mt-6 mb-3 text-zinc-900 dark:text-zinc-200"
            {...props}
        />
    ),

    h4: (props: React.HTMLAttributes<HTMLElement>) => (
        <LinkedHeading
            as="h4"
            className="text-lg font-medium mt-5 mb-2 text-zinc-900 dark:text-zinc-300"
            {...props}
        />
    ),

    strong: (props: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />
    ),

    Steps: ({...props}) => (
        <div
            className="[&>h3]:step [&>h3>a]:pt-0.5 [&>h4]:step [&>h4>a]:pt-0.5 mb-12 ml-4 relative border-l border-default-100 pl-[1.625rem] [counter-reset:step]"
            {...props}
        />
    ),

    table: (props: any) => (
        <div className="overflow-x-auto my-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <table className="w-full border-collapse" {...props} />
        </div>
    ),
    thead: (props: any) => <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800" {...props} />,
    th: (props: any) => <th className="px-4 py-3 text-left font-semibold text-sm text-zinc-900 dark:text-zinc-100" {...props} />,
    tr: Trow,
    td: Tcol,
} as unknown as Record<string, React.ReactNode>;
