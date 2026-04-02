"use server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function executeDraw(drawId: string) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can execute draws");
    }

    const { rows } = await pool.query(
      `select public.execute_draw($1) as winner`,
      [drawId]
    );

    revalidatePath("/admin/draws"); // Revalidate admin draws path if it exists

    return { success: true, winner: rows[0].winner };
  } catch (error: any) {
    console.error("Execute draw error:", error);
    return { success: false, error: error.message || "Failed to execute draw" };
  }
}
