export default {
    darkMode: ["class"],
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
                mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
                kalam: ["var(--font-kalam)", "cursive", "sans-serif"],
                serif: ["var(--font-serif)", "Georgia", "serif"],
                fraunces: ["var(--font-fraunces)", "serif"],
                syne: ["var(--font-syne)", "sans-serif"],
                bricolage: ["var(--font-bricolage)", "sans-serif"],
            },
            colors: {
                dark: "#070709",
                prismio: {
                    DEFAULT: "#47d7b5",
                    dim: "rgba(71, 215, 181, 0.15)",
                }
            }
        },
    },
    plugins: [],
}