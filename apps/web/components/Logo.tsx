import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/icons/prismio.png" alt="Logo" width={32} height={32}/>
            </div>
            <span className="font-semibold text-xl text-white">Prismio</span>
        </Link>
    )
}