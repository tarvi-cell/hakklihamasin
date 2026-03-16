import { createClient } from "@supabase/supabase-js";

// Server-side only — service role key, MITTE client-side'is kasutada
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("SUPABASE_URL ja SUPABASE_SERVICE_ROLE_KEY peavad olema .env.local-is");
}

export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
