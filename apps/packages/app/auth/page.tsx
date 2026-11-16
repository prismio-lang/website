"use client";

import React, {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Loader2} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";
import AuthField, {EMAIL_REGEX} from "@/components/auth/AuthField";
import {GithubIcon, GoogleIcon} from "@/components/auth/ProviderIcons";

const PENDING_EMAIL_KEY = "prismio.packages.auth.email";

const PROVIDER_BUTTON =
    "flex h-13 w-full cursor-pointer items-center justify-start gap-5 rounded-full border border-zinc-300 bg-white pl-7 text-base text-zinc-900 transition-[border-color,background-color,transform] duration-100 hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2";

export default function AuthPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function oauth(provider: "google" | "github") {
        setError(null);
        const {error} = await createClient().auth.signInWithOAuth({
            provider,
            options: {redirectTo: `${window.location.origin}/auth/callback`},
        });
        if (error) setError(error.message);
    }

    async function continueWithEmail() {
        if (!EMAIL_REGEX.test(email)) {
            setError(email ? "Invalid email address" : "Email address is required");
            return;
        }
        setError(null);
        setPending(true);
        const {error} = await createClient().auth.signInWithOtp({email, options: {shouldCreateUser: true}});
        setPending(false);
        if (error) {
            setError(error.message);
            return;
        }
        sessionStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify({email, expiresAt: Date.now() + 10 * 60 * 1000}));
        router.push("/auth/verify");
    }

    return (
        <AuthShell title="Welcome to Prismio Packages" subtitle="Log in or sign up">
            <button type="button" className={PROVIDER_BUTTON} onClick={() => oauth("google")}>
                <GoogleIcon/>
                Continue with Google
            </button>
            <button type="button" className={PROVIDER_BUTTON} onClick={() => oauth("github")}>
                <GithubIcon/>
                Continue with GitHub
            </button>

            <div className="flex w-full items-center gap-4 py-3">
                <div className="h-px flex-1 bg-zinc-200"/>
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">or</span>
                <div className="h-px flex-1 bg-zinc-200"/>
            </div>

            <AuthField
                label="Email address"
                kind="email"
                value={email}
                error={error}
                onChange={(v) => {
                    setEmail(v);
                    setError(null);
                }}
                onEnter={continueWithEmail}
            />

            <button
                type="button"
                onClick={continueWithEmail}
                disabled={pending}
                className="mt-1 flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-950 text-base font-medium text-white transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                {pending && <Loader2 size={16} className="animate-spin"/>}
                Continue
            </button>

            <p className="mt-4 text-center text-sm leading-6 text-zinc-500">
                By continuing, you agree to the{" "}
                <Link href="https://prismio.org/legal/terms" className="font-medium text-indigo-600 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="https://prismio.org/legal/privacy" className="font-medium text-indigo-600 hover:underline">Privacy Policy</Link>.
            </p>
        </AuthShell>
    );
}
