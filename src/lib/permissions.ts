import { auth } from "@/lib/auth"
import { Session } from "next-auth"
import { pool } from "./db"

/**
 * Validates if a session corresponds to an admin role.
 * Safe for Client Components if session is passed as a prop,
 * but primarily used server-side.
 */
export const isAdmin = (session: Session | null): boolean => {
  return session?.user?.role === "admin"
}

/**
 * Validates if a session corresponds to a subscriber role.
 */
export const isSubscriber = (session: Session | null): boolean => {
  return session?.user?.role === "subscriber"
}

/**
 * Server-only helper enforcing authentication.
 * Useful in Server Actions, Route Handlers, or Layouts/Pages.
 * Throws a generic Error ("Unauthorized") if user is not signed in.
 */
export const requireAuth = async (): Promise<Session> => {
  const session = await auth()
  
  if (!session || !session.user) {
    // Intentionally throwing error per design choice instead of redirecting
    throw new Error("Unauthorized: You must be logged in to access this resource.")
  }
  
  return session
}

/**
 * Server-only helper enforcing administrator capabilities.
 * Throws a 403-equivalent Error ("Forbidden") if user is not an admin.
 */
export const requireAdmin = async (): Promise<Session> => {
  const session = await requireAuth() // Re-uses requireAuth logic safely
  
  if (!isAdmin(session)) {
    throw new Error("Forbidden: Administrator access required.")
  }
  
  return session
}

/**
 * Server-only helper enforcing active subscription capabilities.
 * Throws a 403-equivalent Error ("Forbidden") if user does not have an active or trialing subscription.
 */
export const requireActiveSubscription = async (): Promise<Session> => {
  const session = await requireAuth()
  
  if (!session.user?.id) {
    throw new Error("Unauthorized: User ID missing")
  }
  
  const result = await pool.query(
    "SELECT status FROM public.subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
    [session.user.id]
  )

  if (result.rows.length === 0) {
    throw new Error("Forbidden: Active subscription required.")
  }
  
  return session
}
