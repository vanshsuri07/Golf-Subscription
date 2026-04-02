import type { NextAuthConfig, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { pool } from "./db"
import bcrypt from "bcrypt"

export const authOptions: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toString()
        const password = credentials.password.toString()

        try {
          // Look up user in the postgres database
          const result = await pool.query(
            "SELECT id, email, password, role FROM public.users WHERE email = $1",
            [email]
          )

          const user = result.rows[0]

          if (!user || !user.password) {
            return null
          }

          // Compare provided password with hashed password in database
          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (!passwordsMatch) {
            return null
          }

          // Return user without password
          return {
            id: user.id,
            email: user.email,
            role: user.role as "subscriber" | "admin",
          }
        } catch (error) {
          console.error("Error during authentication:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // User is passed in the first time the token is created
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
}
