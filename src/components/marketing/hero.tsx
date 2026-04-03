"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SPACING } from "@/lib/design-tokens"
import { Trophy, HeartHandshake, TrendingUp, CircleUser } from "lucide-react"

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
          className="mt-20 mx-auto max-w-4xl rounded-2xl border bg-card/50 backdrop-blur-sm p-4 shadow-2xl relative"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl blur-xl" />
          <div className="rounded-xl overflow-hidden border bg-background shadow-sm flex flex-col relative text-left">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            {/* Header */}
            <div className="border-b bg-muted/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CircleUser className="h-10 w-10 text-primary opacity-80" />
                <div>
                  <h3 className="font-semibold text-foreground">Welcome back, Golfer</h3>
                  <p className="text-xs text-muted-foreground">Premium Subscriber</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-xs font-medium text-success">Draw Active</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Scores */}
              <div className="border rounded-xl p-4 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">Rolling Scores</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {[72, 75, 71, 69, 70].map((score, i) => (
                    <div key={i} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 flex-1 text-center rounded">
                      {score}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Avg: 71.4 (Handicap tracking)</p>
              </div>

              {/* Charity */}
              <div className="border rounded-xl p-4 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <HeartHandshake className="h-5 w-5 text-rose-500" />
                  <span className="font-medium">Your Impact</span>
                </div>
                <div className="text-2xl font-bold mb-1">$145.00</div>
                <p className="text-xs text-muted-foreground">Donated to <span className="font-semibold text-foreground">The First Tee</span></p>
                <div className="w-full bg-border h-1.5 rounded-full mt-4">
                  <div className="bg-rose-500 h-1.5 rounded-full w-[65%]"></div>
                </div>
              </div>

              {/* Draw */}
              <div className="border rounded-xl p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-primary">Next Prize Pool</span>
                </div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-1">
                  $1,250
                </div>
                <p className="text-xs text-primary mb-4">Draw happens in 3 days</p>
                <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-2 rounded-md">
                  Entry Confirmed ✓
                </div>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  )
}
