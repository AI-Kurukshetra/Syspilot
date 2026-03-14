"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import slugify from "slugify"

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
import { toTenantLoginUrl } from "@/lib/tenant"

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companySlug, setCompanySlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [industry, setIndustry] = useState("Manufacturing")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [localInboxUrl, setLocalInboxUrl] = useState<string | null>(null)

  const normalizedSlug = slugify(companySlug || companyName, {
    lower: true,
    strict: true,
    trim: true,
  })
  const previewLoginUrl = toTenantLoginUrl(normalizedSlug || "your-company")

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

  const localMailboxUrl =
    process.env.NEXT_PUBLIC_LOCAL_MAILBOX_URL?.trim() || "http://127.0.0.1:54324"

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value)

    if (!companySlug) {
      setCompanySlug(
        slugify(value, {
          lower: true,
          strict: true,
          trim: true,
        })
      )
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
          role: "company_admin",
          company_name: companyName,
          company_slug: normalizedSlug,
          industry,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    const needsEmailVerification = !data.session

    if (needsEmailVerification) {
      if (isLocalHost) {
        setLocalInboxUrl(localMailboxUrl)
        window.open(localMailboxUrl, "_blank", "noopener,noreferrer")
        setMessage(
          `Signup successful. Opened local inbox for verification. After confirming email, sign in at ${toTenantLoginUrl(normalizedSlug)}`
        )
      } else {
        setMessage(
          `Signup successful. Verify your email, then sign in at ${toTenantLoginUrl(normalizedSlug)}`
        )
      }
    } else {
      router.push(toTenantLoginUrl(normalizedSlug))
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
          Register your company and get a dedicated SysPilot subdomain.
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
            <label className="text-sm font-medium" htmlFor="companyName">
              Company name
            </label>
            <Input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(event) => handleCompanyNameChange(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="companySlug">
              Company subdomain
            </label>
            <Input
              id="companySlug"
              type="text"
              value={companySlug}
              onChange={(event) => setCompanySlug(event.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              Your login URL will be {previewLoginUrl.replace("https://", "").replace("/login", "")}
            </p>
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
            <label className="text-sm font-medium" htmlFor="industry">
              Industry
            </label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-full" id="industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Distribution">Distribution</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {message ? (
            <div className="space-y-2 rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-700 dark:text-emerald-300">
              <p>{message}</p>
              {localInboxUrl ? (
                <a
                  className="font-medium underline"
                  href={localInboxUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open local inbox again
                </a>
              ) : null}
            </div>
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
