import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";
import Hero from "@/components/landing/Hero";
import FAQ from "@/components/landing/FAQ";
import {JsonLd} from "@/components/json-ld";
import {homeStructuredData} from "@/config/structured-data";

export default function PackagesHomePage() {
    return (
        <div className="relative min-h-screen">
            <JsonLd data={homeStructuredData}/>
            <HeaderMain />
            {/* Subtle background ambient light gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.06),transparent_60%)]" />
            <main className="relative z-10">
                <Hero />
                <div className="mx-auto w-full max-w-7xl px-6">
                    <FAQ/>
                </div>
            </main>
            <FooterMain />
        </div>
    );
}
