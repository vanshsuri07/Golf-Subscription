"use server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function selectCharity(charityId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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
      `
        UPDATE public.users
        SET charity_id = $1
        WHERE id = $2
      `,
      [charityId, session.user.id]
    );

    revalidatePath("/charity");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to select charity:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
