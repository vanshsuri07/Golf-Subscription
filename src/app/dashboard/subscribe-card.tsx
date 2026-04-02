"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Crown, Zap } from "lucide-react";

export function SubscribeCard() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
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
        alert("Failed to create checkout session. Please try again.");
        setLoading(null);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5 shadow-lg shadow-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Unlock Full Access</CardTitle>
            <CardDescription>Subscribe to enter draws, submit scores, and support charities.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Plan */}
          <div className="rounded-xl border border-border p-5 space-y-3 bg-card">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">Monthly</span>
            </div>
            <div className="text-3xl font-extrabold">
              $99<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Entry to monthly draws</li>
              <li>• Unlimited score tracking</li>
              <li>• Charity contributions</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              disabled={loading !== null}
              onClick={() => handleSubscribe("monthly")}
            >
              {loading === "monthly" ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting...</>
              ) : (
                "Subscribe Monthly"
              )}
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className="rounded-xl border-2 border-primary/50 p-5 space-y-3 bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              SAVE $289
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold">Yearly</span>
            </div>
            <div className="text-3xl font-extrabold">
              $899<span className="text-sm font-normal text-muted-foreground">/yr</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Everything in Monthly</li>
              <li>• 2+ months free</li>
              <li>• Priority draw weighting</li>
            </ul>
            <Button
              className="w-full"
              disabled={loading !== null}
              onClick={() => handleSubscribe("yearly")}
            >
              {loading === "yearly" ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting...</>
              ) : (
                "Subscribe Yearly"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
