"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface WalletCardProps {
  walletBalance: number;
  totalGrossWinnings: number;
  totalCharityDonated: number;
}

export function WalletCard({ walletBalance, totalGrossWinnings, totalCharityDonated }: WalletCardProps) {
  return (
    <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-background to-background">
      {/* Glow effect */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <CardTitle className="text-base font-semibold">Your Winnings</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Big balance number */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Credited Balance</p>
          <p className="text-4xl font-extrabold tabular-nums text-emerald-400">
            ${walletBalance.toFixed(2)}
          </p>
        </div>

        {walletBalance > 0 && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Prize Pool Won</span>
              <span className="font-medium text-foreground">${totalGrossWinnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Charity Donated</span>
              <span className="font-medium text-rose-400">−${totalCharityDonated.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-1.5 flex justify-between font-semibold">
              <span>Net Credited</span>
              <span className="text-emerald-400">${walletBalance.toFixed(2)}</span>
            </div>
          </div>
        )}

        {walletBalance === 0 && (
          <p className="text-sm text-muted-foreground">
            Win a draw and your net prize will appear here after admin approval.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
