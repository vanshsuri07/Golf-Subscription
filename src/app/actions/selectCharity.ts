"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function selectCharity(charityId: string) {
  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate if the charity_id exists and is active
    const { data: charity } = await supabase
      .from("charities")
      .select("id")
      .eq("id", charityId)
      .eq("is_active", true)
      .single();

    if (!charity) {
      return { success: false, message: "Invalid or inactive charity selected." };
    }

    // Update user's charity_id
    const { error } = await supabase
      .from("users")
      .update({ charity_id: charityId })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/charity");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to select charity:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
