'use client';

import React from "react";

import Hero from "@/components/landing/Hero";
import Principles from "@/components/landing/Principles";
import WhyPrismio from "@/components/landing/WhyPrismio";
import AIReady from "@/components/landing/AIReady";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/FooterMain";
import HeaderMain from "@/components/HeaderMain";

export default function Landing() {
    return (
        <div className="relative min-h-screen bg-dark text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <HeaderMain/>

            <div className="top-0 w-full h-full absolute overflow-x-clip pointer-events-none">
                <div
                    className="absolute z-[100] -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-800/10 blur-3xl"/>
                </div>

            <Hero/>
            <Principles/>
            <WhyPrismio/>
            <AIReady/>
            <CTA/>
            <Footer/>
        </div>
    );
}