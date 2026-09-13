'use client';

import React from "react";
import HeaderMain from "@/components/HeaderMain";
import Hero from "@/components/landing/Hero";
import FooterMain from "@/components/FooterMain";

export default function PackagesHomePage() {
    return (
        <div className="relative min-h-screen">
            <HeaderMain />

            {/* Subtle background ambient light gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.06),transparent_60%)]" />

            <main className="relative z-10">
                <Hero />
            </main>

            <FooterMain />
        </div>
    );
}
