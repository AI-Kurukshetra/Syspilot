"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const tenantHint = hostname.split(".").length > 2 ? hostname.split(".")[0] : null

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
