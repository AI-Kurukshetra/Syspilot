"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { extractTenantSlugFromHost } from "@/lib/tenant"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const host = typeof window !== "undefined" ? window.location.host : ""
  const tenantHint = extractTenantSlugFromHost(host)
  const tenantMismatchError = searchParams.get("error") === "tenant_mismatch"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    if (tenantHint) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, company_id")
          .eq("id", user.id)
          .maybeSingle<{ role: string; company_id: string | null }>()

        if (profile?.role !== "super_admin") {
          if (!profile?.company_id) {
            await supabase.auth.signOut()
            setError("Your account is missing a company assignment. Contact support.")
            setIsSubmitting(false)
            return
          }

          const { data: company } = await supabase
            .from("companies")
            .select("slug")
            .eq("id", profile.company_id)
            .maybeSingle<{ slug: string }>()

          if (!company?.slug || company.slug !== tenantHint) {
            await supabase.auth.signOut()
            setError(
              company?.slug
                ? `This account belongs to \"${company.slug}\". Please sign in at that company URL.`
                : "This account is not mapped to this company URL. Please sign in at your company URL."
            )
            setIsSubmitting(false)
            return
          }
        }
      }
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 22 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
    <Card className="glass-surface bark-shadow w-full max-w-md border border-white/65">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Sign in to SysPilot</CardTitle>
        <CardDescription className="text-slate-600">
          Continue into your intelligent operations workspace.
        </CardDescription>
        {tenantHint ? (
          <p className="text-xs text-slate-500">Tenant workspace: {tenantHint}</p>
        ) : null}
        {tenantMismatchError ? (
          <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            This account does not belong to this company URL. Use your own company subdomain to sign in.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="w-full bg-blue-700 text-white hover:bg-blue-800" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-600">
          No account?{" "}
          <Link className="font-medium text-blue-700" href="/signup">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
    </motion.div>
  )
}
