import React from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';

const CHANGES = [
    {
        title: 'Async and scoped tasks',
        copy: 'async fn, Future<T> and await, with scope { } and spawn { } so a scope cannot end while a task it started is still running.',
    },
    {
        title: 'A language server and a formatter',
        copy: 'prismio lsp and prismio fmt are part of the compiler, so an editor, a CI check and the command line agree on one answer.',
    },
    {
        title: 'Down to the metal',
        copy: 'Freestanding builds, std.syscall, and linux { }, macos { } and windows { } blocks reach kernels and bare-metal targets.',
    },
    {
        title: 'Integers of any width',
        copy: 'Int<N> and UInt<N> from 1 to 8,388,608 bits, five float types, and an index out of range now stops the program.',
    },
    {
        title: 'A larger standard library',
        copy: 'std.json, HashSet, token and byte input, std.poll for serving a client while supervising a child, and sizeOf and offsetOf for C layouts.',
    },
    {
        title: 'A smaller language to learn',
        copy: 'T? replaces Option<T>, HashMap replaces Map, and conditions need no parentheses. Breaking changes are listed in the release notes.',
    },
];

export default function WhatsNew() {
    return (
        <section aria-labelledby="new-heading" className="mx-auto max-w-7xl px-6 pb-24 max-md:pb-16">
            <div className="grid gap-12 border-t border-white/[0.1] pt-20 lg:grid-cols-12 lg:gap-16 max-md:gap-6 max-md:pt-14">
                <div className="lg:col-span-4">
                    <p className="font-mono text-sm text-indigo-300">0.2.0 · 10 November 2026</p>
                    <h2 id="new-heading" className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        What’s new in 0.2.
                    </h2>
                    <p className="mt-6 text-base leading-7 text-zinc-300">
                        The language reaches async code and bare metal, and the compiler now serves editors itself.
                    </p>
                    <Link
                        href="/releases/0.2.0"
                        className="mt-8 max-md:mt-3 max-md:min-h-11 max-md:text-base inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                        Read the release notes
                        <ArrowRight size={15} />
                    </Link>
                </div>

                <ul className="grid divide-y divide-white/[0.1] sm:grid-cols-2 sm:divide-y-0 lg:col-span-8">
                    {CHANGES.map((item, i) => (
                        <li
                            key={item.title}
                            className={`py-6 sm:border-t sm:border-white/[0.1] sm:py-7 ${
                                i % 2 === 0 ? 'sm:pr-8' : 'sm:border-l sm:pl-8'
                            } ${i < 2 ? 'sm:border-t-0 sm:pt-0' : ''}`}
                        >
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400 max-md:text-base max-md:leading-7">{item.copy}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
