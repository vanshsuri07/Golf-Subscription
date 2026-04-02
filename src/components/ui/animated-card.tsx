"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ComponentProps } from "react"
import { EASINGS } from "@/lib/design-tokens"

interface AnimatedCardProps extends ComponentProps<typeof Card> {
  delay?: number
  index?: number
}

export function AnimatedCard({ className, children, delay = 0, index = 0, ...props }: AnimatedCardProps) {
  const calculatedDelay = delay || index * 0.1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: EASINGS.easeOut,
        delay: calculatedDelay
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className={`h-full transition-shadow hover:shadow-lg ${className || ""}`} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}
