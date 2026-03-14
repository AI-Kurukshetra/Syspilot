import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { extractTenantSlugFromHost } from "@/lib/tenant"

export async function GET(request: Request) {
  const supabase = await createClient()
  const host = request.headers.get("host") ?? ""
  const tenantSlug = extractTenantSlugFromHost(host)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ tenantSlug, companyId: null, role: null }, { status: 200 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle()

  return NextResponse.json(
    {
      tenantSlug,
      companyId: profile?.company_id ?? null,
      role: profile?.role ?? null,
    },
    { status: 200 }
  )
}
