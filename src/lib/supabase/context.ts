import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type ProfileRow = {
  company_id: string | null
  full_name: string
  role: string
}

export async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("company_id, full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>()

  if (error || !profile?.company_id) {
    throw new Error("Profile is missing a company assignment")
  }

  return {
    supabase,
    user,
    profile,
    companyId: profile.company_id,
  }
}
