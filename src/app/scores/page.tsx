import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ScoreForm } from "./ScoreForm";
import { redirect } from "next/navigation";
import { LucideTrophy, LucideTrendingUp, LucideActivity } from "lucide-react";

export default async function ScoresPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  // Fetch the summary details
  const result = await pool.query(
    "SELECT last_5_avg, last_5_scores FROM public.user_score_summary WHERE user_id = $1",
    [session.user.id]
  );
  
  const summary = result.rows[0] || { last_5_avg: null, last_5_scores: [] };
  const lastScores: number[] = summary.last_5_scores || [];
  const average = summary.last_5_avg ? parseFloat(summary.last_5_avg).toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12 font-sans flex justify-center items-start pt-20">
      <div className="max-w-xl w-full grid gap-8">
        
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <LucideTrophy className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Your Performance</h1>
            <p className="text-slate-400">Track and manage your recent rounds</p>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <LucideTrendingUp className="w-20 h-20 text-amber-500/5 absolute -bottom-4 -right-4" />
            <span className="text-slate-400 font-medium text-sm">Rolling Average (Last 5)</span>
            <span className="text-4xl font-bold text-white tracking-tighter">
              {average}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <LucideActivity className="w-20 h-20 text-amber-500/5 absolute -bottom-4 -right-4" />
            <span className="text-slate-400 font-medium text-sm">Games Recorded</span>
            <span className="text-4xl font-bold text-white tracking-tighter">
              {lastScores.length}
            </span>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2">Submit New Score</h2>
          <p className="text-sm text-slate-400">Enter your latest round. We'll automatically adjust your 5-score rolling average.</p>
          <ScoreForm />
        </div>

        {/* Recent History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Latest 5 Scores</h2>
          {lastScores.length > 0 ? (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {lastScores.map((score, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl text-xl font-medium text-white shadow-sm"
                >
                  {score}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 border-dashed text-center mt-4">
              No scores recorded yet. Time to hit the course!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
