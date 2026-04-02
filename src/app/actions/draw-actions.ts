"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createDraw(formData: FormData) {
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

  const name = formData.get("name") as string;
  const mode = (formData.get("mode") as "random" | "weighted" | null) || "random";

  if (!name) throw new Error("Name is required");

  const { error } = await supabase
    .from("draw_events")
    .insert({
      name,
      mode,
      is_active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function runDraw(drawId: string) {
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

  const { data, error } = await supabase.rpc("execute_draw", { p_draw_id: drawId });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return data;
}
