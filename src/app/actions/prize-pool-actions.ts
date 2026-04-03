"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setPrizePool(drawId: string, amount: number) {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  if (amount < 0) throw new Error("Prize pool amount cannot be negative");

  const { error } = await supabase.rpc("set_prize_pool", {
    p_draw_id: drawId,
    p_amount: amount,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
