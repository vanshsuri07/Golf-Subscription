"use client"

import { useState } from "react"
import { SPACING } from "@/lib/design-tokens"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, Loader2 } from "lucide-react"

const plans = [
  {
    name: "Monthly",
    price: "$99",
    period: "/mo",
    description: "Full access to charity draws & prizes, billed monthly.",
    features: [
      "Submit unlimited scores",
      "Rolling average tracking",
      "Entry to monthly draws",
      "Charity contributions triggered",
      "Verified winner badge",
      "Priority support",
    ],
    cta: "Subscribe Monthly",
    plan: "monthly",
    popular: false,
  },
  {
    name: "Yearly",
    price: "$899",
    period: "/yr",
    description: "Everything in Monthly — save $289 annually.",
    features: [
      "Everything in Monthly",
      "2+ months free",
      "Priority draw weighting",
      "Annual charity impact report",
      "Early access to new features",
      "Exclusive yearly badge",
    ],
    cta: "Subscribe Yearly",
    plan: "yearly",
    popular: true,
  }
]

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session. Please sign in first.");
        setLoading(null);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className={`${SPACING.sectionPadding} bg-background`}>
      <div className={SPACING.container}>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No hidden fees. Choose the plan that fits your game.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedCard
              key={plan.name}
              index={index}
              className={`p-8 relative ${plan.popular ? 'border-primary shadow-primary/10 shadow-xl' : 'border-border/50'}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-8 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Best Value
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6 flex items-baseline text-5xl font-extrabold">
                {plan.price}
                <span className="text-xl font-medium text-muted-foreground ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                disabled={loading !== null}
                onClick={() => handleSubscribe(plan.plan)}
              >
                {loading === plan.plan ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Redirecting...
                  </>
                ) : (
                  plan.cta
                )}
              </Button>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  )
}
