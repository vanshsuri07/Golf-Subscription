"use server";

import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function reviewWinner(
  winnerId: string,
  status: "under_review" | "approved" | "rejected" | "payout_processing" | "paid",
  reason?: string
) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await pool.query(
    `select update_winner_status($1, $2, $3, $4)`,
    [winnerId, status, session.user.id, reason ?? null]
  );
  
  revalidatePath("/admin/winners");
}
