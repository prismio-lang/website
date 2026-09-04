"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
    isDark: false,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const theme = localStorage.getItem("theme") ?? "dark";
            setIsDark(theme === "dark");
            document.documentElement.classList.toggle("dark", theme === "dark");
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark", newTheme);
        localStorage.setItem("theme", newTheme ? "dark" : "light");
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
