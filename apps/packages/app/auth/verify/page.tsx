"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight, Clock, Loader2} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";

const PENDING_EMAIL_KEY = "prismio.packages.auth.email";
const RESEND_SECONDS = 60;

function formatTime(total: number) {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function VerifyPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [expired, setExpired] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [cooldown, setCooldown] = useState(RESEND_SECONDS);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    // Load the pending sign-in; without one there is nothing to verify.
    useEffect(() => {
        const raw = sessionStorage.getItem(PENDING_EMAIL_KEY);
        if (!raw) {
            router.replace("/auth");
            return;
        }
        const {email: stored, expiresAt} = JSON.parse(raw) as { email: string; expiresAt: number };
        setEmail(stored);
        const tick = () => {
            const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeLeft(left);
            if (left === 0) setExpired(true);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [router]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => window.clearTimeout(id);
    }, [cooldown]);

    async function verify() {
        if (code.length < 6) {
            setError("Enter the code from your email");
            return;
        }
        setError(null);
        setVerifying(true);
        const {error} = await createClient().auth.verifyOtp({email, token: code, type: "email"});
        setVerifying(false);
        if (error) {
            setError("Invalid verification code. Please try again.");
            return;
        }
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
        router.replace("/");
        router.refresh();
    }

    async function resend() {
        if (cooldown > 0 || !email) return;
        setResending(true);
        const {error} = await createClient().auth.signInWithOtp({email});
        setResending(false);
        if (error) {
            setError(error.message);
            return;
        }
        setCooldown(RESEND_SECONDS);
    }

    if (expired) {
        return (
            <AuthShell title="Your sign-in expired" subtitle="Start again to get a new code.">
                <Link
                    href="/auth"
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-base font-medium text-white transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                    Continue <ArrowRight size={16}/>
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Check your inbox"
            subtitle={email ? <>Enter the verification code we sent to <span className="font-medium text-zinc-900">{email}</span></> : undefined}
        >
            <p className="-mt-4 mb-2 flex items-center gap-2 text-sm text-zinc-500">
                <Clock size={16} strokeWidth={1.5}/>
                Expires in {formatTime(timeLeft)}
            </p>

            <AuthField
                label="Code"
                kind="code"
                value={code}
                error={error}
                maxLength={8}
                autoFocus
                onChange={(v) => {
                    setCode(v);
                    setError(null);
                }}
                onEnter={verify}
            />

            <button
                type="button"
                onClick={verify}
                disabled={code.length < 6 || verifying}
                className="mt-1 flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-950 text-base font-medium text-white transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                {verifying && <Loader2 size={16} className="animate-spin"/>}
                Verify
            </button>

            <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || resending}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-base text-zinc-700 transition-colors hover:bg-zinc-950/[0.04] disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                {resending && <Loader2 size={16} className="animate-spin"/>}
                {cooldown > 0 ? `Resend code in ${cooldown}s` : <>Resend code <ArrowRight size={16}/></>}
            </button>
        </AuthShell>
    );
}
