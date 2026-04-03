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
  const prizePool = parseFloat(formData.get("prize_amount") as string) || 0;

  if (!name) throw new Error("Name is required");

  const { data: draw, error } = await supabase
    .from("draw_events")
    .insert({
      name,
      mode,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (prizePool > 0 && draw?.id) {
    const { error: ppError } = await supabase
      .from("prize_pools")
      .insert({
        draw_id: draw.id,
        total_amount: prizePool,
      });
      
    if (ppError) {
      console.error("Error setting initial prize pool:", ppError);
    }
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

export async function syncEntries(drawId: string) {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase.rpc("sync_draw_entries", { p_draw_id: drawId });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
