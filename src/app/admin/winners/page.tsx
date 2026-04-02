import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";
import { WinnersTable } from "./WinnersTable";

export default async function AdminWinnersPage() {
  const session = await auth();
  
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  // Get winners
  const result = await pool.query(`
    SELECT 
      dw.id as winner_id,
      dw.status,
      dw.rejection_reason,
      dw.verified_at,
      u.id as user_id,
      u.email as user_email,
      u.full_name as user_name,
      de.name as draw_name,
      de.executed_at,
      pp.locked_amount as prize_amount
    FROM public.draw_winners dw
    JOIN public.users u ON dw.user_id = u.id
    JOIN public.draw_events de ON dw.draw_id = de.id
    LEFT JOIN public.prize_pools pp ON de.id = pp.draw_id
    ORDER BY de.executed_at DESC
  `);

  const winners = result.rows.map(row => ({
    ...row,
    prize_amount: row.prize_amount ? Number(row.prize_amount) : 0,
    executed_at: row.executed_at ? new Date(row.executed_at).toISOString() : null,
    verified_at: row.verified_at ? new Date(row.verified_at).toISOString() : null
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Winner Verification Dashboard</h1>
      <WinnersTable initialWinners={winners} />
    </div>
  );
}
