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

import { PasswordUpdateForm } from "./password-update-form"

export const metadata: Metadata = {
  title: "User Management | SysPilot",
  description: "Admin controls for manager/user access and account security.",
}

const managedRoleSchema = z.enum(["manager", "user"])

const updateManagedUserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().trim().min(2),
  role: managedRoleSchema,
})

function getManagedRoleValue(role: string): "manager" | "user" {
  return role === "manager" ? "manager" : "user"
}

export default async function UsersPage() {
  const { supabase, companyId, profile, isSuperAdmin } = await getAuthenticatedContext()

  if (profile.role !== "company_admin" && !isSuperAdmin) {
    redirect("/dashboard")
  }

  const { data: managedUsers, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("company_id", companyId)
    .in("role", ["manager", "user"])
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Unable to load managed users")
  }

  async function updateManagedUser(formData: FormData) {
    "use server"

    const parsed = updateManagedUserSchema.parse({
      user_id: formData.get("user_id"),
      full_name: formData.get("full_name"),
      role: formData.get("role"),
    })

    const {
      supabase: serverSupabase,
      companyId: serverCompanyId,
      profile: serverProfile,
    } = await getAuthenticatedContext()

    if (serverProfile.role !== "company_admin" && serverProfile.role !== "super_admin") {
      throw new Error("Only admins can manage users")
    }

    const { data: updatedUser, error: updateError } = await serverSupabase
      .from("profiles")
      .update({
        full_name: parsed.full_name,
        role: parsed.role,
      })
      .eq("id", parsed.user_id)
      .eq("company_id", serverCompanyId)
      .in("role", ["manager", "user"])
      .select("id")
      .maybeSingle()

    if (updateError) {
      throw new Error(updateError.message)
    }

    if (!updatedUser) {
      throw new Error("User not found or role is not manageable")
    }

    revalidatePath("/users")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Admins can manage users with the manager and user roles.
        </p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Managed Accounts</CardTitle>
          <CardDescription>
            This list includes only non-admin accounts in your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Update Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-sm text-muted-foreground" colSpan={6}>
                      No manager/user accounts found for this company.
                    </TableCell>
                  </TableRow>
                ) : (
                  managedUsers.map((managedUser) => (
                    <TableRow key={managedUser.id}>
                      <TableCell className="font-medium">{managedUser.full_name}</TableCell>
                      <TableCell>{managedUser.email}</TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant="secondary">
                          {managedUser.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <form action={updateManagedUser} className="flex min-w-[160px] items-center gap-2">
                          <input name="user_id" type="hidden" value={managedUser.id} />
                          <input name="full_name" type="hidden" value={managedUser.full_name} />
                          <select
                            className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                            defaultValue={getManagedRoleValue(managedUser.role)}
                            name="role"
                          >
                            <option value="manager">Manager</option>
                            <option value="user">User</option>
                          </select>
                          <Button size="sm" type="submit" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>{new Date(managedUser.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <form action={updateManagedUser} className="flex min-w-[220px] items-center gap-2">
                          <input name="user_id" type="hidden" value={managedUser.id} />
                          <Input
                            className="h-8"
                            defaultValue={managedUser.full_name}
                            name="full_name"
                            required
                          />
                          <input
                            name="role"
                            type="hidden"
                            value={getManagedRoleValue(managedUser.role)}
                          />
                          <Button size="sm" type="submit">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PasswordUpdateForm />
    </main>
  )
}
