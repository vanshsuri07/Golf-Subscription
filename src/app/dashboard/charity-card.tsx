"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function CharityCard({ charityName, totalContribution }: { charityName?: string | null; totalContribution: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Charity Impact</CardTitle>
        <CardDescription>Your contribution to the community.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">Selected Charity</span>
            <span className="font-semibold">{charityName || "Not Selected"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">Total Contributed</span>
            <span className="font-bold text-emerald-600">${totalContribution.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(totalContribution, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Contributions are calculated automatically based on your scores below the 72 baseline.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
