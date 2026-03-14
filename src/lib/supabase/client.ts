import { createBrowserClient } from "@supabase/ssr"
import { supabaseEnv } from "@/lib/supabase/env"

export function createClient() {
  return createBrowserClient(supabaseEnv.url, supabaseEnv.anonKey)
}
