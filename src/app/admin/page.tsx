import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  // Fetch aggregated platform metrics
  const [
    { count: usersCount },
    { count: subsCount },
    { data: recentDraws },
    { data: winners },
    { data: allUsers },
    { data: prizePoolRows },
    { data: charityContribRows },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("draw_events")
      .select("*, prize_pools(total_amount, is_locked)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("draw_winners")
      .select("*, draw_events(name), users(full_name, email)")
      .neq("status", "paid")
      .order("selected_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, full_name, email, role, created_at, subscriptions(status), user_score_summary(last_5_scores)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("prize_pools").select("total_amount").eq("is_locked", false),
    supabase.from("charity_contributions").select("amount"),
  ]);

  const totalPrizePool = (prizePoolRows || []).reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);
  const charityFunds = (charityContribRows || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

  // Normalise shapes for child components
  const drawsNormalised = (recentDraws || []).map((d: any) => ({
    ...d,
    prize_pool: d.prize_pools?.[0]?.total_amount ?? 0,
    pool_locked: d.prize_pools?.[0]?.is_locked ?? false,
  }));

  const winnersNormalised = (winners || []).map((w: any) => ({
    ...w,
    draw_name: w.draw_events?.name,
    full_name: w.users?.full_name,
    email: w.users?.email,
  }));

  const usersNormalised = (allUsers || []).map((u: any) => ({
    ...u,
    sub_status: u.subscriptions?.[0]?.status ?? null,
    scores: u.user_score_summary?.[0]?.last_5_scores ?? [],
  }));

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground">Manage platform operations, run draws, and verify payouts.</p>
      </div>

      <Metrics
        totalSubscribers={usersCount ?? 0}
        activeSubscriptions={subsCount ?? 0}
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
          <DrawControl draws={drawsNormalised} />
        </TabsContent>

        <TabsContent value="winners" className="space-y-4">
          <WinnersQueue winners={winnersNormalised} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTable users={usersNormalised} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
