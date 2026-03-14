"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem("syspilot-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = stored ? stored === "dark" : prefersDark

    document.documentElement.classList.toggle("dark", shouldUseDark)
  }, [])

  const toggleTheme = () => {
    const nextValue = !document.documentElement.classList.contains("dark")
    setIsDark(nextValue)
    document.documentElement.classList.toggle("dark", nextValue)
    window.localStorage.setItem("syspilot-theme", nextValue ? "dark" : "light")
  }

  return (
    <Button className="gap-2" onClick={toggleTheme} size="sm" type="button" variant="outline">
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Light" : "Dark"}
    </Button>
  )
}
