import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseEnv } from "@/lib/supabase/env"
import { extractTenantSlugFromHost } from "@/lib/tenant"

type TenantProfileRow = {
  role: string
  company_id: string | null
  companies: { slug: string } | null
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const tenantSlug = extractTenantSlugFromHost(request.headers.get("host") ?? "")

  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug)
  } else {
    requestHeaders.delete("x-tenant-slug")
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicPath =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth")

  if (user && tenantSlug) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id, companies:company_id(slug)")
      .eq("id", user.id)
      .maybeSingle<TenantProfileRow>()

    const isSuperAdmin = profile?.role === "super_admin"
    const companySlug = profile?.companies?.slug ?? null
    const hasTenantMismatch = !isSuperAdmin && companySlug !== tenantSlug

    if (hasTenantMismatch) {
      await supabase.auth.signOut()

      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "tenant_mismatch")

      const mismatchResponse = NextResponse.redirect(url)
      mismatchResponse.cookies.delete("tenant_slug")
      return mismatchResponse
    }
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (tenantSlug) {
    supabaseResponse.cookies.set("tenant_slug", tenantSlug, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: request.nextUrl.protocol === "https:",
    })
  } else if (request.cookies.get("tenant_slug")) {
    supabaseResponse.cookies.delete("tenant_slug")
  }

  return supabaseResponse
}
