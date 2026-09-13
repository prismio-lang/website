export const PRISMIO_ORG_ID =
    "https://prismio.org";

export const SAKSHAM_PERSON_ID =
    "https://prismio.org/team/saksham-jaiswal/";

export const prismioStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": PRISMIO_ORG_ID,
            "name": "Prismio",
            "url": "https://prismio.org/",
            "description":
                "Prismio is an open-source systems programming language that compiles to native machine code through LLVM.",
            "founder": {
                "@id": SAKSHAM_PERSON_ID
            },
            "sameAs": [
                "https://github.com/prismio-lang/prismio"
            ]
        },
        {
            "@type": "Person",
            "@id": SAKSHAM_PERSON_ID,
            "name": "Saksham Jaiswal",
            "url":
                "https://prismio.org/team/saksham-jaiswal/",
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