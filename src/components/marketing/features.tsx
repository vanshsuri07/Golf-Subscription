"use client"

import { SPACING } from "@/lib/design-tokens"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Trophy, Target, HeartHandshake, ShieldCheck } from "lucide-react"

const features = [
  {
    name: "Submit Scores",
    description: "Log your rounds securely. We maintain a dynamic rolling average of your last 5 scores.",
    icon: Target,
  },
  {
    name: "Support Charity",
    description: "Hit your targets and trigger automatic contributions to local charities on your behalf.",
    icon: HeartHandshake,
  },
  {
    name: "Win Exclusive Draws",
    description: "Active subscribers who meet their score targets enter our transparent monthly prize pools.",
    icon: Trophy,
  },
  {
    name: "Verified Fairness",
    description: "Every draw is executed securely via tamper-proof database transactions. Verify anytime.",
    icon: ShieldCheck,
  },
]

export function Features() {
  return (
    <section id="how-it-works" className={`${SPACING.sectionPadding} bg-muted/30 border-y`}>
      <div className={SPACING.container}>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            How The Platform Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A seamless bridge between improving your golf game and supporting causes you care about.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.name} index={index} className="p-6 bg-card border-border/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">{feature.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  )
}
