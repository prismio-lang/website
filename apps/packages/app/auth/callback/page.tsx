"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Loader2} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

/** OAuth lands here with ?code=. The browser client exchanges it (PKCE) while initialising; getSession waits for that. */
export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        createClient()
            .auth.getSession()
            .then(({data: {session}, error}) => {
                if (cancelled) return;
                router.replace(session && !error ? "/" : "/auth/auth-code-error");
            });
        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-white text-zinc-500" role="status">
            <Loader2 className="mr-2 animate-spin" size={18}/>
            Signing you in
        </div>
    );
}
