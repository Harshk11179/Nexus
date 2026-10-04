import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

// Server-side only. Never import this file from a client component.
export const supabase = createClient(url, key, { auth: { persistSession: false } });