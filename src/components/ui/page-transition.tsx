"use client"

import { motion } from "framer-motion"
import { VARIANTS } from "@/lib/design-tokens"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="pageInitial"
      animate="pageAnimate"
      exit="pageExit"
      variants={VARIANTS}
      className={className}
    >
      {children}
    </motion.div>
  )
}
