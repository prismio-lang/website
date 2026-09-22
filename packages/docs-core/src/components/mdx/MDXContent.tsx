"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as runtime from "react/jsx-runtime";
import { createMDXComponents } from "./MDXComponents";

export interface MDXContentProps {
    code: string;
    components?: Record<string, any>;
}

const useMDXComponent = (code: string) => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(code);
    return fn({ ...runtime }).default;
};

export function MDXContent({ code, components }: MDXContentProps) {
    const Component = useMDXComponent(code);
    const mergedComponents = createMDXComponents(components);

    return (
        <div className="mdx">
            {/* eslint-disable-next-line react-hooks/static-components */}
            <Component components={mergedComponents} />
        </div>
    );
}

export default MDXContent;
