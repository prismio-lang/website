'use client';

import React, {useEffect, useState} from 'react';

/** The path that was asked for. A static 404 does not know it until the browser does, so it starts generic. */
export default function RequestedPath({fallback}: {fallback: string}) {
    const [path, setPath] = useState<string | null>(null);

    useEffect(() => {
        const current = window.location.pathname;
        if (current && current !== '/404' && current !== '/404/') setPath(current);
    }, []);

    return <span className="break-all">{path ?? fallback}</span>;
}
