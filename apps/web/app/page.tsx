import React from "react";
import HeaderMain from "@/components/HeaderMain";
import Hero from "@/components/landing/Hero";
import WhatsNew from "@/components/landing/WhatsNew";
import BenchmarkTeaser from "@/components/landing/BenchmarkTeaser";
import WhyPrismio from "@/components/landing/WhyPrismio";
import Principles from "@/components/landing/Principles";
import AIReady from "@/components/landing/AIReady";
import EditorSupport from "@/components/landing/EditorSupport";
import CommunityNote from "@/components/landing/CommunityNote";
import FAQ from "@/components/landing/FAQ";
import NextRelease from "@/components/NextRelease";
import CTA from "@/components/landing/CTA";
import {JsonLd} from "@/components/json-ld";
import {faqStructuredData, prismioEntityData} from "@/config/structured-data";
import FooterMain from "@prismio/ui/FooterMain";
import type {Metadata} from "next";
import {siteConfig} from "@/config/site";
import {pageMetadata} from "@/lib/seo";

const home = pageMetadata({
    title: "Prismio — Systems Programming Language for Native Performance",
    description: siteConfig.description,
    path: "/",
});

export const metadata: Metadata = {
    ...home,
    alternates: {...home.alternates, types: {"application/atom+xml": siteConfig.releasesFeed}},
};

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]"/>

            <JsonLd data={prismioEntityData} />
            <JsonLd data={faqStructuredData} />
            <HeaderMain />

            <main className="relative z-10">
                <Hero />
                <WhatsNew />
                <BenchmarkTeaser />
                <WhyPrismio />
                <Principles />
                <AIReady />
                <EditorSupport />
                <CommunityNote />
                <section aria-labelledby="next-heading" className="mx-auto max-w-7xl px-6 py-24">
                    <NextRelease />
                </section>
                <CTA />
                <FAQ />
            </main>

            <FooterMain />
        </div>
    );
}
