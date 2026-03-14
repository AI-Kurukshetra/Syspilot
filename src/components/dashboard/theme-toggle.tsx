"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    const stored = window.localStorage.getItem("syspilot-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return stored ? stored === "dark" : prefersDark
  })

  useEffect(() => {
    if (!mounted) {
      return
    }
    document.documentElement.classList.toggle("dark", isDark)
    window.localStorage.setItem("syspilot-theme", isDark ? "dark" : "light")
  }, [isDark, mounted])

  const toggleTheme = () => {
    setIsDark((currentValue) => !currentValue)
  }

  if (!mounted) {
    return (
      <Button className="gap-2" size="sm" type="button" variant="outline">
        <Moon className="size-4" />
        Dark
      </Button>
    )
  }

  return (
    <Button className="gap-2" onClick={toggleTheme} size="sm" type="button" variant="outline">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Light" : "Dark"}
    </Button>
  )
}
