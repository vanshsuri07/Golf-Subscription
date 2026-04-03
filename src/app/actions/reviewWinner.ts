"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function reviewWinner(
  winnerId: string,
  status: "under_review" | "approved" | "rejected" | "payout_processing" | "paid",
  reason?: string
) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.rpc("update_winner_status", {
    p_winner_id: winnerId,
    p_status: status,
    p_admin_id: user.id,
    p_reason: reason ?? null,
  });

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard");
}
