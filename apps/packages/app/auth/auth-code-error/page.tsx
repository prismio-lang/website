import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export const metadata = {title: "Sign-in failed"};

export default function AuthErrorPage() {
    return (
        <AuthShell title="Sign-in didn’t finish" subtitle="The sign-in link was invalid or has expired.">
            <Link
                href="/auth"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 text-base font-medium text-white transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                Try again
            </Link>
        </AuthShell>
    );
}
