import {faqItems} from "@/config/faq";
import {siteConfig} from "@/config/site";
import {PRISMIO_VERSION} from "@prismio/utils";

export const PRISMIO_ORG_ID =
  "https://prismio.org/#organization";

export const PRISMIO_WEBSITE_ID =
  "https://prismio.org/#website";

export const PRISMIO_SOFTWARE_ID =
  "https://prismio.org/#software";

export const SAKSHAM_PERSON_ID =
  "https://prismio.org/team/saksham-jaiswal/#person";

/** The publisher and the site: on every page. */
export const prismioStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": PRISMIO_ORG_ID,
      "name": "Prismio",
      "url": "https://prismio.org",
      "description":
        "Prismio is an open-source systems programming language that compiles to native machine code through LLVM.",
      "founder": {
        "@id": SAKSHAM_PERSON_ID
      },
      "logo": "https://prismio.org/icons/prismio.png",
      "sameAs": [
        siteConfig.wikidata,
        siteConfig.rosettaCode,
        siteConfig.github,
        siteConfig.githubOrg,
        siteConfig.homebrewTap,
        siteConfig.jetbrainsPlugin,
        siteConfig.fossUnitedGrant,
        siteConfig.discord
      ]
    },
    {
      "@type": "WebSite",
      "@id": PRISMIO_WEBSITE_ID,
      "name": "Prismio",
      "url": "https://prismio.org",
      "description": siteConfig.description,
      "inLanguage": "en",
      "publisher": {
        "@id": PRISMIO_ORG_ID
      }
    }
  ]
};

/** The product, its source and its creator: on the home page, where they are described. */
export const prismioEntityData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": PRISMIO_SOFTWARE_ID,
      "name": "Prismio",
      "applicationCategory": "DeveloperApplication",
      "applicationSubCategory": "Compiler and Systems Programming Language",
      "operatingSystem": "macOS, Linux, Windows",
      "description": siteConfig.description,
      "url": "https://prismio.org",
      "downloadUrl": "https://prismio.org/install",
      "license": "https://www.apache.org/licenses/LICENSE-2.0",
      "softwareVersion": PRISMIO_VERSION,
      "softwareRequirements": "LLVM 23, C toolchain",
      "author": {
        "@id": SAKSHAM_PERSON_ID
      },
      "publisher": {
        "@id": PRISMIO_ORG_ID
      },
      "sameAs": [
        siteConfig.wikidata,
        siteConfig.rosettaCode,
        siteConfig.github,
        siteConfig.homebrewTap,
        siteConfig.jetbrainsPlugin,
        siteConfig.fossUnitedGrant
      ]
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${siteConfig.github}#source`,
      "name": "Prismio source code",
      "codeRepository": siteConfig.github,
      "programmingLanguage": "Prismio",
      "runtimePlatform": `LLVM ${siteConfig.name} toolchain`,
      "version": PRISMIO_VERSION,
      "isPartOf": {
        "@id": PRISMIO_ORG_ID
      },
      "targetProduct": {
        "@id": PRISMIO_SOFTWARE_ID
      },
      "license": "https://www.apache.org/licenses/LICENSE-2.0"
    },
    {
      "@type": "Person",
      "@id": SAKSHAM_PERSON_ID,
      "name": "Saksham Jaiswal",
      "url":
        "https://prismio.org/team/saksham-jaiswal",
      "jobTitle": "Creator & Lead Developer",
      "worksFor": {
        "@id": PRISMIO_ORG_ID
      },
      "sameAs": [
        "https://github.com/saksham1319",
        "https://www.linkedin.com/in/saksham6975/"
      ]
    }
  ]
};

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(({question, answer}) => ({
    "@type": "Question",
    "name": question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": answer
    }
  }))
};
