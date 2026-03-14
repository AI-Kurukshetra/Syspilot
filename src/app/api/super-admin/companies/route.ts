import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const createCompanySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  industry: z.string().trim().min(2).optional(),
})

async function ensureSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, isAuthorized: false as const }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return {
    supabase,
    isAuthorized: profile?.role === "super_admin",
  } as const
}

export async function GET() {
  const { supabase, isAuthorized } = await ensureSuperAdmin()

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, industry, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 200 })
}

export async function POST(request: Request) {
  const { supabase, isAuthorized } = await ensureSuperAdmin()

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payload = await request.json()
  const parsed = createCompanySchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await supabase.from("companies").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    code: parsed.data.slug.toUpperCase().slice(0, 12),
    industry: parsed.data.industry ?? "Manufacturing",
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
