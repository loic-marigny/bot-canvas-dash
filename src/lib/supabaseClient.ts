import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Supabase env variables are missing; live market data may be unavailable.");
}

export const supabaseClient = url && anonKey ? createClient(url, anonKey) : null;
