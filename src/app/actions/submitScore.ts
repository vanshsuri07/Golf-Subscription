"use server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitScore(score: number): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Validate range and type
    if (typeof score !== "number" || isNaN(score) || !Number.isInteger(score)) {
      return { success: false, message: "Score must be a valid integer." };
    }
    
    if (score < 0 || score > 150) { // Using 150 as a reasonable upper limit for golf, minimum 0.
      return { success: false, message: "Score must be between 0 and 150." };
    }

    // 2. Check auth
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "Unauthorized." };
    }

    // 3. Check subscriber role
    if (session.user.role !== "subscriber") {
      return { success: false, message: "Only subscribers can submit scores." };
    }

    // 4. Check active subscription
    const subResult = await pool.query(
      `SELECT status FROM public.subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [session.user.id] // Use NextAuth user ID
    );

    if (subResult.rows.length === 0) {
      return { success: false, message: "Active subscription required to submit scores." };
    }

    // 5. Call RPC submit_score
    await pool.query(
      `SELECT public.submit_score($1, $2)`,
      [session.user.id, score]
    );

    revalidatePath("/scores");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to submit score:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
