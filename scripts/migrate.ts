import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client } = pg;

// We expect DATABASE_URL to be loaded via process.env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined. Please ensure it is set in .env.local.');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const SEED_FILE = path.join(process.cwd(), 'supabase', 'seed.sql');

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // 1. Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Get already applied migrations
    const { rows } = await client.query('SELECT name FROM _migrations');
    const appliedMigrations = new Set(rows.map((r: { name: string }) => r.name));

    // 3. Read migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure 001, 002... order

    console.log(`📂 Found ${files.length} migration files.`);

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`⏩ Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`🚀 Applying ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      // Use a transaction for each migration file to ensure atomic success
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✨ Successfully applied ${file}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        
        // Handle "Relation already exists" (42P07) or "Duplicate Object" (42710)
        // This allows the migration to proceed if the table was previously created manually.
        if (err.code === '42P07' || err.code === '42710') {
          console.warn(`⚠️  Notice for ${file}: Table or relation already exists. Marking as applied.`);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          continue;
        }

        console.error(`❌ Error applying ${file}:`, err);
        throw err;
      }
    }

    // 4. (Optional) Run Seed if requested
    if (process.argv.includes('--seed')) {
      if (fs.existsSync(SEED_FILE)) {
        console.log('🌱 Seeding database...');
        const seedSql = fs.readFileSync(SEED_FILE, 'utf8');
        await client.query(seedSql);
        console.log('✅ Seed completed.');
      } else {
        console.warn('⚠️ Seed file not found at supabase/seed.sql');
      }
    }

    console.log('🎊 All migrations applied successfully.');
  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

(async () => {
  try {
    await migrate();
  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  }
})();
