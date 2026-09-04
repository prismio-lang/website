import React from "react";
import Link from "next/link";
import { Hash } from "lucide-react";

export interface Props {
    id?: string;
    children?: React.ReactNode;
}

export const virtualAnchorEncode = (text?: string) => {
    if (typeof text !== "string") return undefined;
    return text.toLowerCase().replace(/ /g, "-").replace(/[.:]/g, "");
};

export const VirtualAnchor: React.FC<Props> = ({ children, id }) => {
    const finalId = id ?? virtualAnchorEncode(typeof children === "string" ? children : undefined);
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
