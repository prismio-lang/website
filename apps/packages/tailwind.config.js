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