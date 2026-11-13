import faq from "./faq.json";

export type FaqItem = { question: string; answer: string };

// The one copy of the landing page's FAQ: the page, its FAQPage JSON-LD, and (through
// scripts/generate-static-assets.mjs) llms.txt and ai/faq.json all read faq.json.
// Condensed from https://docs.prismio.org/faq. Keep answers in sync with that page.
export const faqItems: FaqItem[] = faq;
