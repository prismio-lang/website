"use client";

import React, {useEffect, useId, useRef, useState} from "react";
import {Info} from "lucide-react";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthFieldProps {
    label: string;
    kind: "email" | "code";
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
    maxLength?: number;
    autoFocus?: boolean;
    onEnter?: () => void;
}

/** Floating-label field from the Sprinte sign-in screen: pill border, label rides up on focus or content. */
export default function AuthField({label, kind, value, onChange, error, maxLength, autoFocus, onEnter}: AuthFieldProps) {
    const id = useId();
    const ref = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const floating = focused || value.length > 0;

    useEffect(() => {
        if (error) ref.current?.focus();
    }, [error]);

    return (
        <div className="flex w-full flex-col">
            <div className="relative">
                <input
                    id={id}
                    ref={ref}
                    type={kind === "email" ? "email" : "text"}
                    inputMode={kind === "code" ? "numeric" : "email"}
                    autoComplete={kind === "email" ? "email" : "one-time-code"}
                    autoFocus={autoFocus}
                    value={value}
                    maxLength={maxLength}
                    spellCheck={false}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(e) => onChange(kind === "code" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`h-13 w-full rounded-full border bg-white px-6 text-base text-zinc-950 outline-none transition-colors ${
                        kind === "code" ? "font-mono tracking-[0.3em]" : ""
                    } ${error ? "border-red-500" : focused ? "border-indigo-500" : "border-zinc-300 hover:border-zinc-400"}`}
                />
                <label
                    htmlFor={id}
                    className={`pointer-events-none absolute left-5 bg-white px-1.5 transition-all duration-150 ${
                        floating
                            ? `-top-2 text-xs ${error ? "text-red-600" : "text-indigo-600"}`
                            : "top-1/2 -translate-y-1/2 text-base text-zinc-500"
                    }`}
                >
                    {label}
                </label>
            </div>
            {error && (
                <p id={`${id}-error`} role="alert" className="ml-6 mt-1.5 flex items-center gap-1 text-xs text-red-600">
                    <Info size={12}/>
                    {error}
                </p>
            )}
        </div>
    );
}
