import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SysPilot",
  description: "SysPilot app root route.",
}

export default function DashboardRootPage() {
  redirect("/dashboard")
}
