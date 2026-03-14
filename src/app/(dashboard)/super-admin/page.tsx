import type { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAuthenticatedContext } from "@/lib/supabase/context"

export const metadata: Metadata = {
  title: "Super Admin | SysPilot",
  description: "Global tenancy and data control for SysPilot super admins.",
}

const createCompanySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
})

export default async function SuperAdminPage() {
  const { supabase, profile, isSuperAdmin } = await getAuthenticatedContext()

  if (!isSuperAdmin || profile.role !== "super_admin") {
    redirect("/dashboard")
  }

  const [companiesResult, productsResult, customersResult, salesResult, purchaseResult] = await Promise.all([
    supabase.from("companies").select("id,name,slug,created_at").order("created_at", { ascending: false }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("sales_orders").select("*", { count: "exact", head: true }),
    supabase.from("purchase_orders").select("*", { count: "exact", head: true }),
  ])

  if (
    companiesResult.error ||
    productsResult.error ||
    customersResult.error ||
    salesResult.error ||
    purchaseResult.error
  ) {
    throw new Error("Unable to load super admin data")
  }

  const companies = companiesResult.data ?? []

  async function createCompany(formData: FormData) {
    "use server"

    const parsed = createCompanySchema.parse({
      name: formData.get("name"),
      slug: formData.get("slug"),
    })

    const { supabase: actionSupabase, profile: actionProfile, isSuperAdmin: actionIsSuperAdmin } =
      await getAuthenticatedContext()

    if (!actionIsSuperAdmin || actionProfile.role !== "super_admin") {
      throw new Error("Only super admins can create companies")
    }

    const { error } = await actionSupabase.from("companies").insert({
      name: parsed.name,
      slug: parsed.slug,
      code: parsed.slug.toUpperCase().slice(0, 12),
      industry: "Manufacturing",
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/super-admin")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Super Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage companies and monitor all tenant data from a global scope.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader className="pb-2">
            <CardDescription>Total Companies</CardDescription>
            <CardTitle className="text-2xl">{companies.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl">{productsResult.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader className="pb-2">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-2xl">{customersResult.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bark-shadow glass-surface border-white/65">
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">
              {(salesResult.count ?? 0) + (purchaseResult.count ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Create Company</CardTitle>
          <CardDescription>Create a tenant company and reserve its subdomain.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCompany} className="grid gap-3 md:grid-cols-3">
            <Input name="name" placeholder="Company name" required />
            <Input name="slug" placeholder="company-slug" required />
            <div>
              <Button type="submit">Create Tenant</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>Each tenant is reachable at {'{slug}.syspilot.vercel.app'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.slug}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
