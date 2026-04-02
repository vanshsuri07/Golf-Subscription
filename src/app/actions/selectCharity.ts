"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function selectCharity(charityId: string) {
  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate if the charity_id exists and is active
    const charityCheck = await pool.query(
      `SELECT id FROM public.charities WHERE id = $1 AND is_active = true`,
      [charityId]
    );

    if (charityCheck.rows.length === 0) {
      return { success: false, message: "Invalid or inactive charity selected." };
    }

    // Update user's charity_id
    await pool.query(
      `UPDATE public.users SET charity_id = $1 WHERE id = $2`,
      [charityId, user.id]
    );

    revalidatePath("/charity");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to select charity:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
