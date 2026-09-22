import React from "react";
import Link from "next/link";
import { Hash } from "lucide-react";
import { slug } from "github-slugger";

export interface Props {
    id?: string;
    children?: React.ReactNode;
}

export const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!node) return "";
    if (Array.isArray(node)) return node.map(getTextContent).join("");
    if (React.isValidElement(node) && node.props && (node.props as any).children) {
        return getTextContent((node.props as any).children);
    }
    return "";
};

export const virtualAnchorEncode = (node?: React.ReactNode): string | undefined => {
    const text = typeof node === "string" ? node : getTextContent(node);
    if (!text) return undefined;
    return slug(text);
};

export const VirtualAnchor: React.FC<Props> = ({ children, id }) => {
    const finalId = id ?? virtualAnchorEncode(children);
    if (!finalId) return <>{children}</>;

    return (
        <Link className="group relative flex w-fit items-center gap-1 text-inherit" href={`#${finalId}`}>
            {children}
            <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Hash size={18} />
            </span>
        </Link>
    );
};

export default VirtualAnchor;
