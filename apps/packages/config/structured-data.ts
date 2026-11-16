import {faqItems} from "@/config/faq";
import {siteConfig} from "@/config/site";

const ORG_ID = `${siteConfig.mainUrl}/#organization`;
const SITE_ID = `${siteConfig.url}/#website`;

/** On every page. The organization is the same entity as prismio.org's, so engines merge the two sites. */
export const siteStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": ORG_ID,
            name: "Prismio",
            url: siteConfig.mainUrl,
            logo: `${siteConfig.mainUrl}/icons/prismio.png`,
            sameAs: [siteConfig.github],
        },
        {
            "@type": "WebSite",
            "@id": SITE_ID,
            name: siteConfig.name,
            url: siteConfig.url,
            description: siteConfig.description,
            inLanguage: "en",
            publisher: {"@id": ORG_ID},
        },
    ],
};

/** The home page: what the registry is and an honest status. No package is listed, because none is published yet. */
export const homeStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebPage",
            "@id": `${siteConfig.url}/#webpage`,
            url: siteConfig.url,
            name: "Prismio Packages: libraries for Prismio",
            description: siteConfig.description,
            isPartOf: {"@id": SITE_ID},
            about: {"@id": ORG_ID},
        },
        {
            "@type": "FAQPage",
            mainEntity: faqItems.map(({question, answer}) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: {"@type": "Answer", text: answer},
            })),
        },
    ],
};
