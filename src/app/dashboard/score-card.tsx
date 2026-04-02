"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function ScoreCard({ scores }: { scores: any[] }) {
  const latestFive = scores.slice(0, 5);
  const avg = latestFive.length > 0 
    ? latestFive.reduce((acc, curr) => acc + curr.score, 0) / latestFive.length 
    : 0;
  
  const minRequired = 3;
  const isEligible = latestFive.length >= minRequired;
  const progressPercent = Math.min((latestFive.length / minRequired) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Score Tracker
          {isEligible ? (
            <Badge variant="success">Eligible</Badge>
          ) : (
            <Badge variant="secondary">Need {minRequired - latestFive.length} More</Badge>
          )}
        </CardTitle>
        <CardDescription>Your rolling average and draw eligibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <span className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-slate-50">
            {avg > 0 ? avg.toFixed(1) : "--"}
          </span>
          <span className="text-sm font-medium text-slate-500">Rolling Average (Last 5)</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Eligibility Progress</span>
            <span className="text-slate-500">{latestFive.length} / {minRequired} Scores</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-500">Recent Entries</span>
          <div className="flex gap-2 justify-between">
            {Array.from({ length: 5 }).map((_, i) => {
              const score = latestFive[i];
              return (
                <div 
                  key={i} 
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 font-semibold ${
                    score 
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                      : "border-slate-100 border-dashed text-slate-300 dark:border-slate-800 dark:text-slate-600"
                  }`}
                >
                  {score ? score.score : "-"}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
