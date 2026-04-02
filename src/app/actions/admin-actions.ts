"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleCharityStatus(charityId: string, isActive: boolean) {
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

  const { error } = await supabase
    .from("charities")
    .update({ is_active: isActive })
    .eq("id", charityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function updateUserRole(userId: string, role: string) {
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

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
