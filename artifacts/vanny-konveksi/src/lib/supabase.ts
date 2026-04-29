import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL dan Anon Key harus dikonfigurasi di environment variables.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseAdminCreate = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "sb-vanny-admin-create",
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
