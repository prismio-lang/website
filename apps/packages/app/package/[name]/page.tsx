'use client';

import React from "react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";
import { PackageDetail } from "@/components/PackageDetail";

export default function PackageDetailPage() {
    return (
        <div className="relative min-h-screen bg-white text-zinc-900 selection:bg-indigo-500/15 selection:text-indigo-950 flex flex-col justify-between">
            <HeaderMain />
            <main className="relative z-10 flex-1">
                <PackageDetail />
            </main>
            <FooterMain />
        </div>
    );
}
