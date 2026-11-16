import React from "react";
import Logo from "@prismio/ui/Logo";

/** The centered column every auth screen shares: logo, title, subtitle, content. */
export default function AuthShell({title, subtitle, children}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.07),transparent_65%)]"/>
            <header className="relative z-10 flex h-17 items-center px-5 md:px-10">
                <Logo/>
            </header>
            <main className="relative z-10 mx-auto flex w-full max-w-[380px] flex-1 flex-col items-center justify-center px-6 pb-24">
                <h1 className="text-balance text-center text-3xl font-semibold tracking-[-0.03em] text-zinc-950 max-md:text-2xl">{title}</h1>
                {subtitle && <p className="mt-2 text-balance text-center text-base text-zinc-500">{subtitle}</p>}
                <div className="mt-10 flex w-full flex-col items-center gap-3.5">{children}</div>
            </main>
        </div>
    );
}
