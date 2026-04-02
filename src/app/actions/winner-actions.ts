"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateWinnerStatus(winnerId: string, status: string, reason?: string) {
  const supabase = createClient(await cookies());

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase.rpc("update_winner_status", {
    p_winner_id: winnerId,
    p_new_status: status,
    p_admin_id: user.id,
    p_reason: reason || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/winners");
  revalidatePath("/dashboard");
}
