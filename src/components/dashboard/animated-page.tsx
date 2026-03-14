"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

type AnimatedPageProps = {
  children: ReactNode
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="animate-fade-rise"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
