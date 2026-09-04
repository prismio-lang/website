import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";

export default function CTA() {
    return (
        <section className="relative px-8 py-12 md:py-12 max-w-5xl mx-auto text-center">
            {/* Tag */}
            <span className="inline-block mb-6 px-3 py-1 rounded-lg text-sm font-medium
        bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        Open&nbsp;Source
      </span>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-5">
                Prismio is built in the open
            </h2>

            {/* Subtitle */}
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-16">
                The compiler is developed publicly with a focus
                on performance, safety, and AI-native tooling. Follow the roadmap, test
                releases, and contribute to the future of systems programming.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center cursor-pointer">
                <Link href={'https://github.com/prismio-lang/prismio'}>
                    <Button
                        variant="tertiary"
                        className="
                       px-6 rounded-full h-13
                      text-gray-800
                      bg-white
                    "
                    >
                        <Image src={'/icons/github-mark.svg'} alt={'Github'} width={28} height={28}/>
                        View on GitHub
                    </Button>
                </Link>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-20">
                <span className="px-3 py-1 rounded-md text-sm font-medium bg-white/5 border border-white/10 text-gray-300">
                  License: <span className="text-gray-100 font-semibold">Apache-2.0</span>
                </span>

                <span
                    className="px-3 py-1 rounded-md text-sm font-medium bg-white/5 border border-white/10 text-gray-300">
                  Status: <span className="text-gray-100 font-semibold">Actively Developed</span>
                </span>

                <span
                    className="px-3 py-1 rounded-md text-sm font-medium bg-white/5 border border-white/10 text-gray-300">
                  Contributions: <span className="text-gray-100 font-semibold">Welcome</span>
                </span>

                <span
                    className="px-3 py-1 rounded-md text-sm font-medium bg-white/5 border border-white/10 text-gray-300">
                  Compiler: <span className="text-gray-100 font-semibold">LLVM-backed</span>
                </span>
            </div>
        </section>
    );
}
