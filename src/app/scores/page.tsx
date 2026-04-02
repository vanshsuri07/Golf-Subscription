import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ScoreForm } from "./ScoreForm";
import { pool } from "@/lib/db";
import { LucideTrophy, LucideTrendingUp, LucideActivity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Scores — GolfSub",
  description: "Track and submit your golf scores",
};

export default async function ScoresPage() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the summary details
  const result = await pool.query(
    "SELECT last_5_avg, last_5_scores FROM public.user_score_summary WHERE user_id = $1",
    [user.id]
  );

  const summary = result.rows[0] || { last_5_avg: null, last_5_scores: [] };
  const lastScores: number[] = summary.last_5_scores || [];
  const average = summary.last_5_avg ? parseFloat(summary.last_5_avg).toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans flex justify-center items-start pt-8">
      <div className="max-w-xl w-full grid gap-8">

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <LucideTrophy className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Performance</h1>
            <p className="text-muted-foreground">Track and manage your recent rounds</p>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <LucideTrendingUp className="w-20 h-20 text-amber-500/5 absolute -bottom-4 -right-4" />
            <span className="text-muted-foreground font-medium text-sm">Rolling Average (Last 5)</span>
            <span className="text-4xl font-bold tracking-tighter">
              {average}
            </span>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <LucideActivity className="w-20 h-20 text-amber-500/5 absolute -bottom-4 -right-4" />
            <span className="text-muted-foreground font-medium text-sm">Games Recorded</span>
            <span className="text-4xl font-bold tracking-tighter">
              {lastScores.length}
            </span>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2">Submit New Score</h2>
          <p className="text-sm text-muted-foreground">Enter your latest round. We&apos;ll automatically adjust your 5-score rolling average.</p>
          <ScoreForm />
        </div>

        {/* Recent History */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Latest 5 Scores</h2>
          {lastScores.length > 0 ? (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {lastScores.map((score, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-muted border border-border rounded-xl text-xl font-medium shadow-sm"
                >
                  {score}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm p-4 bg-muted/50 rounded-xl border border-border/50 border-dashed text-center mt-4">
              No scores recorded yet. Time to hit the course!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
