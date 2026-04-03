import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { Metrics } from "./metrics";
import { DrawControl } from "./draw-control";
import { WinnersQueue } from "./winners-queue";
import { UsersTable } from "./users-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Admin — GolfSub",
  description: "Admin control center for GolfSub platform",
};

export default async function AdminDashboardPage() {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch aggregated data using pool to avoid RLS issues
  const [
    usersCountResult,
    subsCountResult,
    recentDrawsResult,
    winnersResult,
    allUsersResult,
    prizePoolResult,
    charityFundsResult,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int as count FROM public.users`),
    pool.query(`SELECT COUNT(*)::int as count FROM public.subscriptions WHERE status = 'active'`),
    pool.query(`SELECT * FROM public.draw_events ORDER BY created_at DESC LIMIT 10`),
    pool.query(`
      SELECT dw.*, de.name as draw_name, u.full_name, u.email 
      FROM public.draw_winners dw 
      JOIN public.draw_events de ON dw.draw_id = de.id 
      JOIN public.users u ON dw.user_id = u.id 
      WHERE dw.status != 'paid' 
      ORDER BY dw.selected_at DESC
    `),
    pool.query(`
      SELECT u.id, u.full_name, u.email, u.role, u.created_at,
        (SELECT s.status FROM public.subscriptions s WHERE s.user_id = u.id AND s.status = 'active' LIMIT 1) as sub_status,
        (SELECT last_5_scores FROM public.user_score_summary uss WHERE uss.user_id = u.id LIMIT 1) as scores
      FROM public.users u 
      ORDER BY u.created_at DESC LIMIT 50
    `),
    pool.query(`SELECT COALESCE(SUM(total_amount), 0)::numeric as total FROM public.prize_pools WHERE is_locked = false`),
    pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric as total FROM public.charity_contributions`),
  ]);

  const usersCount = usersCountResult.rows[0]?.count || 0;
  const subsCount = subsCountResult.rows[0]?.count || 0;
  const recentDraws = recentDrawsResult.rows || [];
  const winners = winnersResult.rows || [];
  const allUsers = allUsersResult.rows || [];
  const totalPrizePool = Number(prizePoolResult.rows[0]?.total) || 0;
  const charityFunds = Number(charityFundsResult.rows[0]?.total) || 0;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground">Manage platform operations, run draws, and verify payouts.</p>
      </div>

      <Metrics
        totalSubscribers={usersCount}
        activeSubscriptions={subsCount}
        totalPrizePool={totalPrizePool}
        charityFunds={charityFunds}
      />

      <Tabs defaultValue="draws" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="draws">Draw Engine</TabsTrigger>
          <TabsTrigger value="winners">Winners Queue</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="draws" className="space-y-4">
          <DrawControl draws={recentDraws} />
        </TabsContent>

        <TabsContent value="winners" className="space-y-4">
          <WinnersQueue winners={winners} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTable users={allUsers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
