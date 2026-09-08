import React from 'react';
import {Binary, Braces, Bug, FileJson2, Link2, Workflow} from 'lucide-react';

const MANIFEST = `project {
    name = "compiler-tools"
    version = "0.1.0"
}

targets {
    executable("inspect") {
        entry = "src/main.psm"
    }
}

commands {
    command("verify") {
        build("inspect")
        run("inspect", args)
    }
}`;

const TOOLING = [
    {
        icon: FileJson2,
        title: 'Stable diagnostics',
        copy: 'prismio check runs the real frontend without generating code. Versioned JSON Lines diagnostics carry stable P#### codes, severity, files, and UTF-8 source spans.',
    },
    {
        icon: Bug,
        title: 'Native debugging',
        copy: '-g emits DWARF line tables, functions, scopes, locals, and struct layouts for LLDB and GDB. On macOS, the compiler writes a .dSYM beside the binary.',
    },
    {
        icon: Braces,
        title: 'Compiler introspection',
        copy: 'dump-ast exposes parsed source structure. AIF manifests provide a separate, stable account of inferred memory placement for CI and analysis tools.',
    },
];

export default function AIReady() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
            <div className="max-w-4xl">
                <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                    One toolchain, from source file to self-hosted project.
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
                    Prismio’s compiler, project model, native linkage, diagnostics, and memory
                    analysis form one development loop. The lexer, parser, import resolver,
                    semantic analyzer, AIF engine, and LLVM IR generator are themselves written in Prismio.
                </p>
            </div>

            <div className="mt-14 grid overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09] lg:grid-cols-12">
                <div className="border-b border-white/[0.07] p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-3 text-zinc-200">
                        <Workflow size={18} className="text-indigo-300"/>
                        <h3 className="font-semibold">Unified Manifest System</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                        <code className="text-zinc-200">build.ums</code> declares project metadata,
                        executable and test targets, dependencies, native link inputs, and
                        project-defined commands. Prismio finds the nearest manifest and writes
                        profile-specific artifacts under <code className="text-zinc-200">.prismio/build/</code>.
                    </p>

                    <pre className="mt-7 overflow-x-auto rounded-xl bg-[#07080b] p-5 text-[11px] leading-5 text-zinc-400 ring-1 ring-white/[0.06] sm:text-xs">
                        <code>{MANIFEST}</code>
                    </pre>
                </div>

                <div className="lg:col-span-7">
                    <div className="grid border-b border-white/[0.07] sm:grid-cols-2">
                        <article className="border-b border-white/[0.07] p-6 sm:border-b-0 sm:border-r sm:p-8">
                            <div className="flex items-center gap-3 text-zinc-200">
                                <Binary size={18} className="text-emerald-300"/>
                                <h3 className="font-semibold">Self-hosted by design</h3>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                A committed seed builds the first local generation. Later generations
                                compile themselves, with failed rebuilds leaving the last working compiler intact.
                            </p>
                        </article>
                        <article className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 text-zinc-200">
                                <Link2 size={18} className="text-sky-300"/>
                                <h3 className="font-semibold">Direct C interoperability</h3>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                Declare C functions with <code className="text-zinc-200">extern fn</code>.
                                Ownership contracts such as borrow, consume, produce, and alias keep
                                the foreign boundary visible to memory analysis.
                            </p>
                        </article>
                    </div>

                    <div className="p-6 sm:p-8">
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">
                            Reliable interfaces for editors, CI, and coding agents.
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                            Tools consume structured compiler output instead of scraping terminal prose.
                        </p>

                        <div className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {TOOLING.map(({icon: Icon, title, copy}) => (
                                <article key={title} className="grid gap-3 py-5 sm:grid-cols-[2.25rem_1fr]">
                                    <Icon size={17} className="mt-0.5 text-indigo-300"/>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
                                        <p className="mt-1.5 text-sm leading-6 text-zinc-500">{copy}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
