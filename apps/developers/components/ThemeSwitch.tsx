"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`relative flex h-7 w-14 items-center rounded-full p-[5px]
                cursor-pointer transition-colors duration-300
                focus-visible:outline-none focus-visible:ring-2
                ${isDark ? "bg-white/20" : "bg-blue-500"}`}
        >
            {/* Moon — dark mode */}
            <motion.div
                className="absolute left-[9px]"
                initial={false}
                animate={{
                    opacity: isDark ? 1 : 0,
                    scale: isDark ? 1 : 0.7,
                }}
                transition={{ duration: 0.2 }}
            >
                <Moon className="h-4 w-4 text-white" />
            </motion.div>

            {/* Sun — light mode */}
            <motion.div
                className="absolute right-[9px]"
                initial={false}
                animate={{
                    opacity: isDark ? 0 : 1,
                    scale: isDark ? 0.7 : 1,
                }}
                transition={{ duration: 0.2 }}
            >
                <Sun className="h-4 w-4 text-white" />
            </motion.div>

            {/* Knob */}
            <motion.div
                className="z-10 h-[18px] w-[18px] rounded-full bg-white shadow-lg"
                animate={{ x: isDark ? 28 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    mass: 0.5,
                }}
            />
        </button>
    );
}