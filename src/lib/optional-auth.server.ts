import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Non-throwing session check. Used to gate paid third-party API calls
 * (Google Weather / AI gateway) to signed-in users while still allowing
 * anonymous visitors to receive free-tier data.
 */
export async function hasSupabaseSession(): Promise<boolean> {
  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return false;

    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader) return false;

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return false;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { apikey: key } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data?.user;
  } catch {
    return false;
  }
}