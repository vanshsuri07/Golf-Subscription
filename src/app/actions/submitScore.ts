"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitScore(score: number): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Validate range and type
    if (typeof score !== "number" || isNaN(score) || !Number.isInteger(score)) {
      return { success: false, message: "Score must be a valid integer." };
    }

    if (score < 1 || score > 45) {
      return { success: false, message: "Score must be between 0 and 150." };
    }

    // 2. Check auth via Supabase
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized." };
    }

    // 3. Check role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "subscriber") {
      return { success: false, message: "Only subscribers can submit scores." };
    }

    // 4. Check active subscription
    const subResult = await pool.query(
      `SELECT status FROM public.subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user.id]
    );

    if (subResult.rows.length === 0) {
      return { success: false, message: "Active subscription required to submit scores." };
    }

    // 5. Call RPC submit_score
    await pool.query(
      `SELECT public.submit_score($1, $2)`,
      [user.id, score]
    );

    revalidatePath("/scores");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to submit score:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
