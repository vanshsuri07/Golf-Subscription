import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ScoreCard } from "./score-card";
import { CharityCard } from "./charity-card";
import { DrawsTable } from "./draws-table";
import { SubscribeCard } from "./subscribe-card";
import { PrizePoolCard } from "./prize-pool-card";
import { WalletCard } from "./wallet-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — GolfSub",
  description: "Your GolfSub subscriber dashboard",
};

export default async function DashboardPage() {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all data in parallel using the Supabase client (works in serverless/production)
  const [
    { data: profile },
    { data: subscriptionRows },
    { data: scores },
    { data: drawEventRows },
    { data: charityContribRows },
    { data: recentWins },
    { data: userCharityRows },
    { data: prizePoolRows },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").limit(1),
    supabase.from("scores").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("draw_events").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1),
    supabase.from("charity_contributions").select("amount").eq("user_id", user.id),
    supabase
      .from("draw_winners")
      .select(`*, draw_events(name), net_payout, charity_deduction, prize_pools(total_amount)`)
      .eq("user_id", user.id)
      .order("selected_at", { ascending: false }),
    supabase
      .from("users")
      .select("charity_id, charities(name)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("draw_events")
      .select("name, prize_pools(total_amount, charity_rate)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const subscription = subscriptionRows?.[0] || null;
  const activeDraw = drawEventRows?.[0] || null;
  const totalContributions = (charityContribRows || []).reduce(
    (sum: number, r: any) => sum + (Number(r.amount) || 0),
    0
  );
  const wins = recentWins || [];
  const userCharity = userCharityRows
    ? { charity_id: (userCharityRows as any).charity_id, charity_name: (userCharityRows as any).charities?.name }
    : null;
  const hasSubscription = !!subscription;

  // Wallet / winning data
  const walletBalance = Number((profile as any)?.wallet_balance) || 0;
  const totalGrossWinnings = wins.reduce((sum: number, w: any) => {
    return sum + (w.prize_pools?.total_amount ? Number(w.prize_pools.total_amount) : 0);
  }, 0);
  const totalCharityDonated = wins.reduce((sum: number, w: any) => {
    return sum + (w.charity_deduction ? Number(w.charity_deduction) : 0);
  }, 0);

  // Active prize pool
  const prizePoolRow = (prizePoolRows?.[0] as any) || null;
  const prizePoolData = prizePoolRow?.prize_pools?.[0] || null;
  const activePrizePool = Number(prizePoolData?.total_amount) || 0;
  const activePrizeCharityRate = Number(prizePoolData?.charity_rate) || 0.20;

  // Normalise wins shape for DrawsTable (expects draw_name, prize_amount)
  const recentWinsNormalised = wins.map((w: any) => ({
    ...w,
    draw_name: w.draw_events?.name,
    prize_amount: w.prize_pools?.total_amount,
  }));

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriber Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || user.email || "Golfer"}.</p>
        </div>
        <Badge variant={hasSubscription ? "success" : "secondary"} className="px-4 py-1.5 text-sm">
          {hasSubscription ? "Active Subscription" : "No Active Subscription"}
        </Badge>
      </div>

      {/* Show subscription CTA if not subscribed */}
      {!hasSubscription && <SubscribeCard />}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Account Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your current subscription and impact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{subscription?.status || "Free"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Selected Charity</span>
              <span className="font-medium">{userCharity?.charity_name || "Not Selected"}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Your Contributions</span>
              <span className="font-bold text-emerald-600">${totalContributions.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Score Tracker */}
        <ScoreCard scores={scores ?? []} />

        {/* Charity Impact */}
        <CharityCard charityName={userCharity?.charity_name} totalContribution={totalContributions} />
      </div>

      {/* Prize Pool + Wallet row */}
      <div className="grid gap-6 md:grid-cols-2">
        <PrizePoolCard
          drawName={prizePoolRow?.draw_name || activeDraw?.name || null}
          prizePool={activePrizePool}
          charityRate={activePrizeCharityRate}
        />
        <WalletCard
          walletBalance={walletBalance}
          totalGrossWinnings={totalGrossWinnings}
          totalCharityDonated={totalCharityDonated}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Draw</CardTitle>
            <CardDescription>Details for the next prize pool.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeDraw ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center rounded-lg border p-4">
                  <div>
                    <h4 className="font-semibold">{activeDraw.name}</h4>
                    <p className="text-sm text-muted-foreground">Mode: {activeDraw.mode}</p>
                  </div>
                  <Badge>Open</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Make sure your scores are lodged and subscription is active to be eligible for entry.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No active draw at the moment.</div>
            )}
          </CardContent>
        </Card>

        <DrawsTable recentWins={recentWinsNormalised} />
      </div>
    </div>
  );
}
