/** Shown on the home page, emitted as FAQPage JSON-LD, and written to public/ai/faq.json and llms.txt. */
export const faqItems = [
    {
        question: "What is Prismio Packages?",
        answer:
            "Prismio Packages is the registry for Prismio libraries. A package is described by its build.ums manifest and is installed and published from the Prismio command line.",
    },
    {
        question: "Is the registry live yet?",
        answer:
            "It is a preview. Prismio 0.3 builds projects from a build.ums manifest and local path dependencies, and has no registry or version solver yet. The packages listed on this site are examples, not published libraries.",
    },
    {
        question: "How do I publish a package?",
        answer:
            "Publishing is command line only; the website has no upload form. You sign in, and the command line sends a checked package archive to the registry. The publish commands are in development.",
    },
    {
        question: "Does installing a package run scripts?",
        answer:
            "No. A package declares what it needs in its manifest, so installing it never runs an arbitrary script.",
    },
    {
        question: "Where are package files stored?",
        answer:
            "Package archives are served from cdn.prismio.org, one immutable file per name and version.",
    },
    {
        question: "Which languages and licenses are supported?",
        answer:
            "Packages are Prismio libraries, and may bind C code through the C ABI. The registry itself is open source under Apache-2.0.",
    },
] as const;
