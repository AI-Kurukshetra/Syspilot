import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseEnv } from "@/lib/supabase/env"
import { extractTenantSlugFromHost } from "@/lib/tenant"

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

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
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
