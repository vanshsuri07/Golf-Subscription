import { pool } from "../src/lib/db";

async function debug() {
  try {
    console.log("--- USERS ---");
    const users = await pool.query("SELECT id, email, full_name FROM public.users");
    console.table(users.rows);

    console.log("--- SUBSCRIPTIONS ---");
    const subs = await pool.query("SELECT user_id, status FROM public.subscriptions");
    console.table(subs.rows);

    console.log("--- USER SCORE SUMMARY ---");
    const scores = await pool.query("SELECT user_id, last_5_scores, array_length(last_5_scores, 1) as len FROM public.user_score_summary");
    console.table(scores.rows);

    console.log("--- DRAW EVENTS ---");
    const draws = await pool.query("SELECT id, name, is_active FROM public.draw_events");
    console.table(draws.rows);

    console.log("--- DRAW ENTRIES ---");
    const entries = await pool.query("SELECT * FROM public.draw_entries");
    console.table(entries.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
