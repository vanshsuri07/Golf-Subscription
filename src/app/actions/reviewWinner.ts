"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
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

  await pool.query(
    `SELECT update_winner_status($1, $2, $3, $4)`,
    [winnerId, status, user.id, reason ?? null]
  );

  revalidatePath("/admin");
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard");
}
