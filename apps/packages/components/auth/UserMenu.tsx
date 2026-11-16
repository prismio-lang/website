"use client";

import React, {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {LogOut, User as UserIcon} from "lucide-react";
import type {User} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/client";

/** Header account control: "Sign in" when signed out, an initial and a sign-out menu when signed in. */
export default function UserMenu() {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({data}) => {
            setUser(data.user);
            setReady(true);
        });
        const {data: sub} = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
        return () => sub.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!open) return;
        const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
        const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", away);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("pointerdown", away);
            document.removeEventListener("keydown", esc);
        };
    }, [open]);

    if (!ready) return <div className="h-9 w-20" aria-hidden="true"/>;

    if (!user) {
        return (
            <Link
                href="/auth"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-950"
            >
                <UserIcon size={13} className="text-zinc-400"/>
                <span>Sign in</span>
            </Link>
        );
    }

    const meta = user.user_metadata as Record<string, string | undefined>;
    const name = meta.name ?? meta.full_name ?? meta.user_name ?? meta.preferred_username ?? user.email ?? "Account";
    const avatar = meta.avatar_url ?? meta.picture;
    return (
        <div ref={box} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold uppercase text-white transition-transform duration-100 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote provider avatar, host varies
                    <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full object-cover"/>
                ) : (
                    name.charAt(0)
                )}
            </button>
            {open && (
                <div role="menu" className="material absolute right-0 top-11 w-60 origin-top-right rounded-2xl p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-zinc-200">
                    <p className="truncate px-3 py-2 text-xs text-zinc-500">{user.email ?? name}</p>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                            await createClient().auth.signOut();
                            setOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-950/[0.05]"
                    >
                        <LogOut size={14}/>
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
