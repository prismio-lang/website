import {faqItems} from "@/config/faq";

/** Native <details>: no script, and the answers are in the page HTML for crawlers and answer engines. */
export default function FAQ() {
    return (
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 border-t border-zinc-200 py-24 md:py-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
                <h2 id="faq-heading" className="text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:col-span-4">
                    Questions
                    <span className="block opacity-50">and answers.</span>
                </h2>
                <div className="divide-y divide-zinc-200 border-y border-zinc-200 lg:col-span-8">
                    {faqItems.map(({question, answer}) => (
                        <details key={question} className="group py-5">
                            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                                {question}
                                <span aria-hidden="true" className="shrink-0 text-xl leading-none text-zinc-400 transition-transform duration-200 group-open:rotate-45">+</span>
                            </summary>
                            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">{answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
