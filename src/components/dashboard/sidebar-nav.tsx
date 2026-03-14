"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import type { ComponentType } from "react"
import {
  Boxes,
  ChartColumn,
  ClipboardList,
  Factory,
  Gauge,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  SquareStack,
  Users,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
}

type SidebarNavProps = {
  items: NavItem[]
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "/dashboard": Gauge,
  "/inventory": Boxes,
  "/sales": ShoppingCart,
  "/purchases": ClipboardList,
  "/production": Factory,
  "/finance": Wallet,
  "/bom": SquareStack,
  "/quality": Receipt,
  "/ai-forecasting": ChartColumn,
  "/users": Users,
  "/super-admin": ShieldCheck,
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <motion.nav
      animate="visible"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1"
      initial="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.045, delayChildren: 0.12 },
        },
      }}
    >
      {items.map((item) => {
        const Icon = iconMap[item.href] ?? Gauge
        const isActive = pathname === item.href

        return (
          <motion.div
            key={item.href}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          >
            <Link
              className={cn(
                "group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200",
                "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-300/12",
                isActive && "border-cyan-300/65 bg-cyan-300/20 text-white shadow-[0_0_0_1px_rgba(110,231,255,0.25)]"
              )}
              href={item.href}
            >
              <Icon className={cn("size-4 text-cyan-200/90", isActive && "text-cyan-100")} />
              <span className="truncate">{item.label}</span>
            </Link>
          </motion.div>
        )
      })}
    </motion.nav>
  )
}
