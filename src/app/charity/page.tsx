import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CharityClient from "./CharityClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Select Your Charity — GolfSub",
  description: "Choose a charity to receive contributions from your golf performance.",
};

export default async function CharityPage() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch charities
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, description")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Fetch current user selection & summary
  const { data: userRow } = await supabase
    .from("users")
    .select("charity_id")
    .eq("id", user.id)
    .single();

  const userCharityId = (userRow as any)?.charity_id || null;

  const { data: contributionRow } = await supabase
    .from("charity_summary")
    .select("total_contribution")
    .eq("user_id", user.id)
    .eq("charity_id", userCharityId)
    .single();

  const totalContribution = (contributionRow as any)?.total_contribution || "0.00";

  return (
    <div className="min-h-screen bg-background text-foreground pt-8 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-4">
            Direct Your <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Impact</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
            For every score you submit below the baseline, we contribute to the charity of your choice.
          </p>
        </div>

        {/* Impact Stats */}
        {userCharityId && (
          <div className="mb-12 bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Contribution to this Cause</h2>
              <p className="text-muted-foreground">Derived automatically from your exceptional play.</p>
            </div>
            <div className="mt-4 md:mt-0 text-5xl font-black text-amber-400">
              ${Number(totalContribution).toFixed(2)}
            </div>
          </div>
        )}

        {/* Charity Selector Client Component */}
        <CharityClient
          charities={charities ?? []}
          initialSelectedId={userCharityId}
        />
      </div>
    </div>
  );
}
