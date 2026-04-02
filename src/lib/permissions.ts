import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { pool } from "./db";

type AuthResult = {
  userId: string;
  email: string;
  role: string;
};

/**
 * Server-only helper enforcing authentication.
 * Returns userId and email if authenticated, throws otherwise.
 */
export const requireAuth = async (): Promise<AuthResult> => {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("Unauthorized: You must be logged in to access this resource.");
  }

  // Fetch role from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email,
    role: profile?.role || "subscriber",
  };
};

/**
 * Server-only helper enforcing administrator capabilities.
 */
export const requireAdmin = async (): Promise<AuthResult> => {
  const result = await requireAuth();

  if (result.role !== "admin") {
    throw new Error("Forbidden: Administrator access required.");
  }

  return result;
};

/**
 * Server-only helper enforcing active subscription.
 */
export const requireActiveSubscription = async (): Promise<AuthResult> => {
  const result = await requireAuth();

  const subResult = await pool.query(
    "SELECT status FROM public.subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
    [result.userId]
  );

  if (subResult.rows.length === 0) {
    throw new Error("Forbidden: Active subscription required.");
  }

  return result;
};
