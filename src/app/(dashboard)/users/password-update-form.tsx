"use client"

import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function PasswordUpdateForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(updateError.message)
      setIsSubmitting(false)
      return
    }

    setMessage("Your password has been updated.")
    setNewPassword("")
    setConfirmPassword("")
    setIsSubmitting(false)
  }

  return (
    <Card className="bark-shadow glass-surface border-white/65">
      <CardHeader>
        <CardTitle>Update My Password</CardTitle>
        <CardDescription>Admins can update their own account password here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:max-w-md" onSubmit={handleSubmit}>
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            type="password"
            value={newPassword}
            required
          />
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            required
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
