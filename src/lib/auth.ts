import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Server-side helper to get the currently authenticated user.
 * Returns { user, supabase } or { user: null, supabase } if not authenticated.
 */
export async function getUser() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * Server-side helper to get user profile with role from public.users table.
 */
export async function getUserProfile() {
  const { user, supabase } = await getUser();

  if (!user) return { user: null, profile: null, supabase };

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile, supabase };
}
