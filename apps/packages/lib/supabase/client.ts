import {createBrowserClient} from "@supabase/ssr";
import type {SupabaseClient} from "@supabase/supabase-js";
import {getSupabaseEnv} from "./env";

let browserClient: SupabaseClient | undefined;

/** One browser client per page; created on first use so a missing env var fails at the call, not at import. */
export function createClient(): SupabaseClient {
    if (!browserClient) {
        const {url, key} = getSupabaseEnv();
        browserClient = createBrowserClient(url, key);
    }
    return browserClient;
}
