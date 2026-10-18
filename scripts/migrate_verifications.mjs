import postgres from 'postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const databaseUrl = process.env.DATABASE_URL;

async function migratePostgres() {
  if (!databaseUrl) {
    console.log('No DATABASE_URL set, skipping Postgres migration');
    return;
  }
  console.log('--- Migrating PostgreSQL for answer_verifications ---');
  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Create table answer_verifications
    await sql`
      CREATE TABLE IF NOT EXISTS public.answer_verifications (
        id TEXT PRIMARY KEY,
        answer_id TEXT NOT NULL UNIQUE REFERENCES public.solutions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'incorrect', 'unsure')),
        created_at BIGINT NOT NULL
      );
    `;
    console.log('✓ Table answer_verifications created / verified');

    // 2. Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_verifications_aid ON public.answer_verifications(answer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verifications_uid ON public.answer_verifications(user_id);`;
    console.log('✓ Indexes idx_verifications_aid & idx_verifications_uid created');

    // 3. Enable Row-Level Security
    await sql`ALTER TABLE public.answer_verifications ENABLE ROW LEVEL SECURITY;`;
    console.log('✓ Row Level Security enabled on answer_verifications');

    // 4. Policy: only owner can select their own verdict
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'answer_verifications' AND policyname = 'owner_read_only'
        ) THEN
          CREATE POLICY owner_read_only ON public.answer_verifications
            FOR SELECT
            USING (auth.uid()::text = user_id);
        END IF;
      END $$;
    `;
    console.log('✓ Security policy owner_read_only created');

    console.log('--- PostgreSQL migration complete! ---');
  } catch (err) {
    console.error('Error during PostgreSQL migration:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

function migrateSqlite() {
  console.log('--- Migrating SQLite for answer_verifications ---');
  const dbPath = path.join(process.cwd(), 'data', 'recursiveqna.db');
  if (!fs.existsSync(dbPath)) {
    console.log('SQLite database not found at', dbPath);
    return;
  }

  const db = new Database(dbPath);
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS answer_verifications (
        id TEXT PRIMARY KEY,
        answer_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'incorrect', 'unsure')),
        created_at INTEGER NOT NULL,
        FOREIGN KEY(answer_id) REFERENCES solutions(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_verifications_aid ON answer_verifications(answer_id);
      CREATE INDEX IF NOT EXISTS idx_verifications_uid ON answer_verifications(user_id);
    `);
    console.log('✓ SQLite answer_verifications table & indexes ensured');
  } catch (err) {
    console.error('Error during SQLite migration:', err);
  } finally {
    db.close();
  }
}

async function run() {
  if (databaseUrl) {
    await migratePostgres();
  }
  migrateSqlite();
}

run().catch(console.error);
