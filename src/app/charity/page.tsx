// src/app/charity/page.tsx
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";
import CharityClient from "./CharityClient";

export const metadata = {
  title: "Select Your Charity Impact",
};

export default async function CharityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch charities
  const activeCharitiesResult = await pool.query(`
    SELECT id, name, description 
    FROM public.charities 
    WHERE is_active = true 
    ORDER BY name ASC
  `);

  // Fetch current user selection & summary
  const userStatsResult = await pool.query(`
    SELECT u.charity_id, cs.total_contribution 
    FROM public.users u
    LEFT JOIN public.charity_summary cs ON u.id = cs.user_id AND cs.charity_id = u.charity_id
    WHERE u.id = $1
  `, [session.user.id]);

  const charities = activeCharitiesResult.rows;
  const userStats = userStatsResult.rows[0];
  const userCharityId = userStats?.charity_id || null;
  const totalContribution = userStats?.total_contribution || "0.00";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pt-16 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white mb-4">
            Direct Your <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Impact</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-400">
            For every score you submit below the baseline, we contribute to the charity of your choice.
          </p>
        </div>

        {/* Impact Stats */}
        {userCharityId && (
          <div className="mb-12 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Contribution to this Cause</h2>
              <p className="text-slate-400">Derived automatically from your exceptional play.</p>
            </div>
            <div className="mt-4 md:mt-0 text-5xl font-black text-amber-400">
              ${Number(totalContribution).toFixed(2)}
            </div>
          </div>
        )}

        {/* Charity Selector Client Component */}
        <CharityClient
          charities={charities}
          initialSelectedId={userCharityId}
        />
      </div>
    </div>
  );
}
