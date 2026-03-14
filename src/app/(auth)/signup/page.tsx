import type { Metadata } from "next"

import { SignupForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Sign Up | SysPilot",
  description: "Create your SysPilot account.",
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="absolute inset-0 bark-grid opacity-60" />
      <div className="relative z-10 w-full max-w-lg">
        <SignupForm />
      </div>
    </main>
  )
}
