import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WinnersTable } from "./WinnersTable";

export const metadata = {
  title: "Winner Verification — GolfSub Admin",
};

export default async function AdminWinnersPage() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get winners with joined data
  const { data: rawWinners } = await supabase
    .from("draw_winners")
    .select(`
      id,
      status,
      rejection_reason,
      verified_at,
      user_id,
      draw_events(name, executed_at),
      users!winners_user_id_fkey(email, full_name),
      prize_pools(locked_amount)
    `)
    .order("draw_events(executed_at)", { ascending: false });

  const winners = (rawWinners || []).map((row: any) => ({
    winner_id: row.id,
    status: row.status,
    rejection_reason: row.rejection_reason,
    verified_at: row.verified_at ? new Date(row.verified_at).toISOString() : null,
    user_id: row.user_id,
    user_email: row.users?.email,
    user_name: row.users?.full_name,
    draw_name: row.draw_events?.name,
    executed_at: row.draw_events?.executed_at ? new Date(row.draw_events.executed_at).toISOString() : null,
    prize_amount: row.prize_pools?.[0]?.locked_amount ? Number(row.prize_pools[0].locked_amount) : 0,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Winner Verification Dashboard</h1>
      <WinnersTable initialWinners={winners} />
    </div>
  );
}
