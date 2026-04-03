"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, HeartHandshake } from "lucide-react";

interface PrizePoolCardProps {
  drawName: string | null;
  prizePool: number;
  charityRate: number;
}

export function PrizePoolCard({ drawName, prizePool, charityRate }: PrizePoolCardProps) {
  const charityAmount = prizePool * charityRate;
  const netPayout = prizePool - charityAmount;

  if (!drawName || prizePool <= 0) {
    return (
      <Card className="relative overflow-hidden border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold">Prize Pool</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active prize pool at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-background to-background">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-400/5 blur-2xl" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/30 animate-pulse">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <CardTitle className="text-base font-semibold">Prize Pool</CardTitle>
          </div>
          <Badge className="bg-amber-400/15 text-amber-400 border-amber-400/30 text-xs">Live</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hero number */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{drawName}</p>
          <p className="text-4xl font-extrabold tabular-nums text-amber-400">
            ${prizePool.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Breakdown */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
              Charity ({Math.round(charityRate * 100)}%)
            </span>
            <span className="font-medium text-rose-400">−${charityAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-border/50 pt-1.5 flex justify-between font-semibold">
            <span>Winner Net Payout</span>
            <span className="text-emerald-400">${netPayout.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Make sure your subscription is active and scores are lodged to be eligible.
        </p>
      </CardContent>
    </Card>
  );
}
