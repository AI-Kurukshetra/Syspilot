import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"

type ProfileRow = {
  company_id: string | null
  full_name: string
  role: string
}

export async function getAuthenticatedContext() {
  const supabase = await createClient()
  const cookieStore = await cookies()
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

  if (error || !profile) {
    throw new Error("Profile was not found")
  }

  const isSuperAdmin = profile.role === "super_admin"
  const activeCompanyCookie = cookieStore.get("active_company_id")?.value ?? null
  const tenantSlugCookie = cookieStore.get("tenant_slug")?.value ?? null

  let companyId: string | null = profile.company_id

  if (isSuperAdmin) {
    companyId = activeCompanyCookie ?? null

    if (!companyId) {
      const { data: fallbackCompany } = await supabase
        .from("companies")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

      companyId = fallbackCompany?.id ?? null
    }
  }

  if (!isSuperAdmin && !companyId) {
    throw new Error("Profile is missing a company assignment")
  }

  if (isSuperAdmin && !companyId) {
    throw new Error("No company is available for super admin scope")
  }

  if (!isSuperAdmin && tenantSlugCookie && companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("slug")
      .eq("id", companyId)
      .maybeSingle()

    if (company?.slug && company.slug !== tenantSlugCookie) {
      throw new Error("Tenant URL does not match your company")
    }
  }

  const resolvedCompanyId = companyId

  if (!resolvedCompanyId) {
    throw new Error("No company scope is available")
  }

  return {
    supabase,
    user,
    profile,
    companyId: resolvedCompanyId,
    isSuperAdmin,
    tenantSlug: tenantSlugCookie,
  }
}
