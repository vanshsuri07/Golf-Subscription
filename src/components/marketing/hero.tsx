"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SPACING } from "@/lib/design-tokens"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <div className={`${SPACING.container} relative z-10`}>
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              New Charity Draw System Live
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-bold tracking-tight sm:text-7xl mb-6 text-foreground"
          >
            Play Golf. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-success">
              Make an Impact.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg leading-8 text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            The premium golf subscription that turns your scores into charity contributions and gives you a chance to win exclusive golf prizes every month.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-background" asChild>
              <Link href="#how-it-works">Learn More</Link>
            </Button>
          </motion.div>
        </div>

        {/* Dashboard Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 mx-auto max-w-5xl rounded-2xl border bg-card/50 backdrop-blur-sm p-2 shadow-2xl relative"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl blur-xl" />
          <div className="rounded-xl overflow-hidden border bg-background shadow-sm flex flex-col md:flex-row h-64 md:h-96 items-center justify-center relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {/* Minimalist abstract representation of dashboard */}
            <div className="p-8 w-full h-full flex flex-col justify-between">
              <div className="flex gap-4 items-center mb-8 opacity-50">
                <div className="h-10 w-10 rounded-full bg-primary/20"></div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-muted-foreground/20 rounded"></div>
                  <div className="h-2 w-16 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-lg bg-muted/30 border border-border/50 p-4 flex flex-col justify-end">
                    <div className="h-2 w-1/2 bg-primary/20 rounded mb-2"></div>
                    <div className="h-6 w-3/4 bg-foreground/10 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
