import NextAuth from "next-auth"
import PostgresAdapter from "@auth/pg-adapter"
import { pool } from "./db"
import { authOptions } from "./auth-options"

// @auth/pg-adapter is compatible with next-auth@beta and provides seamless postgres integration.
// We explicitly override any adapter session strategy by enforcing JWT in the authOptions, 
// guaranteeing performance while retaining adapter's schema functionality if extended later.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authOptions,
  adapter: PostgresAdapter(pool),
})
