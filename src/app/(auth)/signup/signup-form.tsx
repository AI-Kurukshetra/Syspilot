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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

type UserRole = "admin" | "manager" | "user"

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const handleRoleChange = (value: string) => {
    if (value === "admin" || value === "manager" || value === "user") {
      setRole(value)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    const userId = data.user?.id

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        email,
        role,
      })

      if (profileError) {
        setError(profileError.message)
        setIsSubmitting(false)
        return
      }
    }

    const needsEmailVerification = !data.session

    if (needsEmailVerification) {
      setMessage("Signup successful. Please verify your email, then sign in.")
    } else {
      router.push("/dashboard")
      router.refresh()
      return
    }

    setIsSubmitting(false)
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 22 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
    <Card className="glass-surface bark-shadow w-full max-w-md border border-white/65">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Create a SysPilot account</CardTitle>
        <CardDescription className="text-slate-600">
          Register to access your ERP dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fullName">
              Full name
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role">
              Role
            </label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full" id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          ) : null}

          <Button className="w-full bg-blue-700 text-white hover:bg-blue-800" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-blue-700" href="/login">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
    </motion.div>
  )
}
