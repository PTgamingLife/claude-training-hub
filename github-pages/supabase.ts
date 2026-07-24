import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://hhcubvixldieuwdeqnwc.supabase.co",
  "sb_publishable_S-fBRRvMYbhAq_FmxgTDbQ_qGeQKmwA",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const oauthRedirectUrl = "https://ptgaminglife.github.io/claude-training-hub/";
