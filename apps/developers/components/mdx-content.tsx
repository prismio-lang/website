"use client";

import * as runtime from "react/jsx-runtime";
import {MDXComponents} from "./mdx-components";

interface MDXContentProps {
  code: string;
}

const useMDXComponent = (code: string) => {
    const fn = new Function(code)
    return fn({...runtime}).default
}

export function MDXContent({code}: MDXContentProps) {
  const Component = useMDXComponent(code);

  return (
    <div className="mdx">
        {/* eslint-disable-next-line react-hooks/static-components */}
      <Component components={{...MDXComponents}} />
    </div>
  );
}
