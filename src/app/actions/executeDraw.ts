"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function executeDraw(drawId: string) {
  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only admins can execute draws" };
    }

    const { rows } = await pool.query(
      `SELECT public.execute_draw($1) as winner`,
      [drawId]
    );

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { success: true, winner: rows[0].winner };
  } catch (error: any) {
    console.error("Execute draw error:", error);
    return { success: false, error: error.message || "Failed to execute draw" };
  }
}
