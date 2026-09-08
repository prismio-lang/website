import React from "react";
import HeaderMain from "@/components/HeaderMain";
import Hero from "@/components/landing/Hero";
import Principles from "@/components/landing/Principles";
import BenchmarkTeaser from "@/components/landing/BenchmarkTeaser";
import WhyPrismio from "@/components/landing/WhyPrismio";
import AIReady from "@/components/landing/AIReady";
import CTA from "@/components/landing/CTA";
import FooterMain from "@/components/FooterMain";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden selection:bg-indigo-500/30 selection:text-white overflow-hidden">
            {/* Global Noise Texture Overlay */}
            <div 
                className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
            />

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#070709]/80 to-[#070709] pointer-events-none z-0" />
            
            {/* Ultra-subtle precise grid */}
            <div className="absolute top-0 left-0 right-0 h-[800px] bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

            <HeaderMain />

            <main className="relative z-10">
                <Hero />
                <Principles />
                <BenchmarkTeaser />
                <WhyPrismio />
                <AIReady />
                <CTA />
            </main>

            <FooterMain />
        </div>
    );
}