import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AnimatedPage } from "@/components/dashboard/animated-page"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard | SysPilot",
  description: "SysPilot dashboard workspace.",
}

const moduleLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/sales", label: "Sales" },
  { href: "/purchases", label: "Purchases" },
  { href: "/production", label: "Production" },
  { href: "/finance", label: "Finance" },
  { href: "/bom", label: "BOM" },
  { href: "/quality", label: "Quality" },
  { href: "/ai-forecasting", label: "AI Forecasting" },
]

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, company_id")
    .eq("id", user.id)
    .maybeSingle()

  const displayName = profile?.full_name ?? user.email ?? "User"
  const displayRole = profile?.role ?? "user"
  const isSuperAdmin = displayRole === "super_admin"
  const canManageUsers = displayRole === "company_admin" || isSuperAdmin
  const activeCompanyId = cookieStore.get("active_company_id")?.value ?? profile?.company_id ?? null

  const { data: activeCompany } = activeCompanyId
    ? await supabase.from("companies").select("id, name, slug").eq("id", activeCompanyId).maybeSingle()
    : { data: null }

  const { data: scopeCompanies } = isSuperAdmin
    ? await supabase.from("companies").select("id, name, slug").order("name")
    : { data: [] }

  const navigationLinks = [
    ...moduleLinks,
    ...(canManageUsers ? [{ href: "/users", label: "Users" }] : []),
    ...(isSuperAdmin ? [{ href: "/super-admin", label: "Super Admin" }] : []),
  ]
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  async function logoutAction() {
    "use server"

    const serverClient = await createClient()
    await serverClient.auth.signOut()
    redirect("/login")
  }

  async function setCompanyScopeAction(formData: FormData) {
    "use server"

    const companyId = String(formData.get("company_id") ?? "")

    const actionSupabase = await createClient()
    const {
      data: { user: actionUser },
    } = await actionSupabase.auth.getUser()

    if (!actionUser) {
      redirect("/login")
    }

    const { data: actionProfile } = await actionSupabase
      .from("profiles")
      .select("role")
      .eq("id", actionUser.id)
      .maybeSingle()

    if (actionProfile?.role !== "super_admin") {
      throw new Error("Only super admins can switch company scope")
    }

    const cookieActionStore = await cookies()
    cookieActionStore.set("active_company_id", companyId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    })

    redirect("/dashboard")
  }

  return (
    <div className="relative min-h-screen bark-grid">
      <div className="pointer-events-none absolute -top-16 left-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-[1580px] flex-col p-3 md:flex-row md:gap-3 md:p-5">
        <aside className="bark-shadow animate-fade-rise w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1d2f5f] via-[#1a2a54] to-[#122044] p-4 md:w-80 md:rounded-3xl">
          <div className="mb-6 flex items-center justify-between md:block">
            <div>
              <p className="text-xl font-semibold tracking-tight text-white">SysPilot</p>
              <p className="text-sm text-cyan-100/80">Material Operations Console</p>
            </div>
          </div>

          <SidebarNav items={navigationLinks} />

          <div className="mt-6 rounded-2xl border border-white/15 bg-white/8 p-3">
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="ring-2 ring-cyan-200/40">
                <AvatarFallback className="bg-cyan-100/15 text-cyan-50">{initials || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-cyan-100/70 capitalize">{displayRole}</p>
                {activeCompany ? (
                  <p className="truncate text-[11px] text-cyan-100/65">
                    Scope: {activeCompany.name} ({activeCompany.slug})
                  </p>
                ) : null}
              </div>
            </div>

            {isSuperAdmin ? (
              <form action={setCompanyScopeAction} className="mb-3 space-y-2">
                <label className="block text-xs text-cyan-100/70" htmlFor="companyScope">
                  Company Scope
                </label>
                <select
                  className="h-8 w-full rounded-lg border border-white/20 bg-white/10 px-2 text-xs text-white"
                  defaultValue={activeCompanyId ?? ""}
                  id="companyScope"
                  name="company_id"
                >
                  {(scopeCompanies ?? []).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.slug})
                    </option>
                  ))}
                </select>
                <Button className="w-full" size="sm" type="submit" variant="secondary">
                  Apply Scope
                </Button>
              </form>
            ) : null}

            <form action={logoutAction}>
              <Button className="w-full border-cyan-100/40 text-white hover:bg-cyan-300/20 bg-transparent hover:text-white" type="submit" variant="outline">
                Logout
              </Button>
            </form>
          </div>
        </aside>

        <section className="flex-1">
          <div className="glass-surface bark-shadow relative overflow-hidden rounded-2xl border border-white/55 p-4 md:rounded-3xl md:p-7">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-full bg-blue-300/20 blur-xl" />

            <header className="mb-6 flex flex-col gap-3 border-b border-slate-300/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700/80">Intelligent Workspace</p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Enterprise Resource Hub</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link className="rounded-full border border-blue-300/60 bg-white/70 px-4 py-1.5 text-xs font-medium text-blue-800 transition hover:bg-blue-100" href="/dashboard">
                  Return to Overview
                </Link>
              </div>
            </header>

            <AnimatedPage>{children}</AnimatedPage>
          </div>
        </section>
      </div>
    </div>
  )
}
