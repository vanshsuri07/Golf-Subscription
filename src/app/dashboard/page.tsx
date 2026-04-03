import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
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

  // Fetch all data in parallel using direct pool queries (avoids RLS issues)
  const [
    profileResult,
    subscriptionResult,
    scoresResult,
    drawEventsResult,
    charityContributionsResult,
    recentWinsResult,
    userCharityResult,
    activePrizePoolResult,
  ] = await Promise.all([
    pool.query(`SELECT * FROM public.users WHERE id = $1`, [user.id]),
    pool.query(`SELECT * FROM public.subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`, [user.id]),
    pool.query(`SELECT * FROM public.scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [user.id]),
    pool.query(`SELECT * FROM public.draw_events WHERE is_active = true ORDER BY created_at DESC LIMIT 1`),
    pool.query(`SELECT SUM(amount) as total FROM public.charity_contributions WHERE user_id = $1`, [user.id]),
    pool.query(`
      SELECT dw.*, de.name as draw_name,
        (SELECT pp.total_amount FROM public.prize_pools pp WHERE pp.draw_id = de.id LIMIT 1) as prize_amount,
        dw.net_payout,
        dw.charity_deduction
      FROM public.draw_winners dw 
      JOIN public.draw_events de ON dw.draw_id = de.id 
      WHERE dw.user_id = $1 
      ORDER BY dw.selected_at DESC
    `, [user.id]),
    pool.query(`
      SELECT u.charity_id, c.name as charity_name 
      FROM public.users u 
      LEFT JOIN public.charities c ON u.charity_id = c.id 
      WHERE u.id = $1
    `, [user.id]),
    // Active draw prize pool for the prize card
    pool.query(`
      SELECT de.name as draw_name, pp.total_amount, pp.charity_rate
      FROM public.draw_events de
      JOIN public.prize_pools pp ON pp.draw_id = de.id
      WHERE de.is_active = true
      ORDER BY de.created_at DESC
      LIMIT 1
    `),
  ]);

  const profile = profileResult.rows[0] || null;
  const subscription = subscriptionResult.rows[0] || null;
  const scores = scoresResult.rows || [];
  const activeDraw = drawEventsResult.rows[0] || null;
  const totalContributions = Number(charityContributionsResult.rows[0]?.total) || 0;
  const recentWins = recentWinsResult.rows || [];
  const userCharity = userCharityResult.rows[0] || null;
  const hasSubscription = !!subscription;

  // Wallet / winning data
  const walletBalance = Number(profile?.wallet_balance) || 0;
  const totalGrossWinnings = recentWins.reduce((sum: number, w: any) => {
    return sum + (w.prize_amount ? Number(w.prize_amount) : 0);
  }, 0);
  const totalCharityDonated = recentWins.reduce((sum: number, w: any) => {
    return sum + (w.charity_deduction ? Number(w.charity_deduction) : 0);
  }, 0);

  // Active prize pool
  const prizePoolRow = activePrizePoolResult.rows[0] || null;
  const activePrizePool = Number(prizePoolRow?.total_amount) || 0;
  const activePrizeCharityRate = Number(prizePoolRow?.charity_rate) || 0.20;

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
        <ScoreCard scores={scores} />

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

        <DrawsTable recentWins={recentWins} />
      </div>
    </div>
  );
}
