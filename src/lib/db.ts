import { Pool } from "pg"

// Ensure connection string config works within Edge / Node properly where env vars are available
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("DATABASE_URL is not defined in environment variables.")
}

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Optional helper for running quick queries
export const query = (text: string, params?: any[]) => pool.query(text, params)
