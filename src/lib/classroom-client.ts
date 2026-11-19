import { createClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"];
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
export const accountsConfigured = Boolean(url && key);
export const classroom =
  typeof window !== "undefined" && url && key ? createClient(url, key) : null;
