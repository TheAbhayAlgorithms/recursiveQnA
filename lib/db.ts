import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const isPostgres = Boolean(process.env.DATABASE_URL);

interface StatementResult {
  get: <T = any>(...params: any[]) => Promise<T | undefined>;
  all: <T = any>(...params: any[]) => Promise<T[]>;
  run: (...params: any[]) => Promise<{ changes?: number }>;
}

export interface UnifiedDb {
  isPostgres: boolean;
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  run: (sql: string, params?: any[]) => Promise<{ changes?: number }>;
  prepare: (sql: string) => StatementResult;
  exec: (sql: string) => Promise<void>;
}

// Convert SQLite '?' parameter placeholders to PostgreSQL '$1, $2, ...'
function convertPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const normalized: any = Array.isArray(row) ? [] : {};
  for (const [key, value] of Object.entries(row)) {
    if (
      (key.toLowerCase().includes('count') || key.toLowerCase().endsWith('_count')) &&
      typeof value === 'string' &&
      !isNaN(Number(value))
    ) {
      normalized[key] = Number(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

interface GlobalWithDb {
  __recursiveqna_unified_db?: UnifiedDb;
}

const globalObj = globalThis as unknown as GlobalWithDb;

function initDb(): UnifiedDb {
  if (globalObj.__recursiveqna_unified_db) return globalObj.__recursiveqna_unified_db;

  if (isPostgres) {
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
    });

    const get = async <T = any>(rawSql: string, params: any[] = []): Promise<T | undefined> => {
      const converted = convertPlaceholders(rawSql);
      const rows = await sql.unsafe(converted, params);
      return rows[0] ? (normalizeRow(rows[0]) as T) : undefined;
    };

    const all = async <T = any>(rawSql: string, params: any[] = []): Promise<T[]> => {
      const converted = convertPlaceholders(rawSql);
      const rows = await sql.unsafe(converted, params);
      return rows.map((r: any) => normalizeRow(r) as T);
    };

    const run = async (rawSql: string, params: any[] = []): Promise<{ changes?: number }> => {
      const converted = convertPlaceholders(rawSql);
      const res = await sql.unsafe(converted, params);
      return { changes: res.count };
    };

    const exec = async (rawSql: string): Promise<void> => {
      await sql.unsafe(rawSql);
    };

    const instance: UnifiedDb = {
      isPostgres: true,
      get,
      all,
      run,
      prepare: (statementSql: string) => ({
        get: (...params: any[]) => get(statementSql, params),
        all: (...params: any[]) => all(statementSql, params),
        run: (...params: any[]) => run(statementSql, params),
      }),
      exec,
    };

    globalObj.__recursiveqna_unified_db = instance;
    return instance;
  }

  // --- SQLite Mode (Local development fallback) ---
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'recursiveqna.db');
  const legacyDbPath = path.join(process.cwd(), 'data', 'eduquest.db');

  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
    try {
      fs.copyFileSync(legacyDbPath, dbPath);
    } catch {}
  }

  const sqlite = new Database(dbPath, { timeout: 20000 });
  try {
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 20000');
  } catch {}

  // Schema initialization for SQLite
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      field_of_interest TEXT DEFAULT 'General',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      field TEXT NOT NULL,
      image_url TEXT,
      video_url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS solutions (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      video_url TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS thoughts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      solution_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY(solution_id) REFERENCES solutions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      reset_at INTEGER NOT NULL,
      last_requested_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS answer_verifications (
      id TEXT PRIMARY KEY,
      answer_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'incorrect', 'unsure')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY(answer_id) REFERENCES solutions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_questions_field ON questions(field, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_solutions_qid ON solutions(question_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_thoughts_qid ON thoughts(question_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_thoughts_sid ON thoughts(solution_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
    CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);
    CREATE INDEX IF NOT EXISTS idx_verifications_aid ON answer_verifications(answer_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_uid ON answer_verifications(user_id);
  `);

  try {
    sqlite.exec(`ALTER TABLE thoughts ADD COLUMN solution_id TEXT;`);
  } catch {}
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN email TEXT;`);
  } catch {}
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN phone TEXT;`);
  } catch {}
  try {
    sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  } catch {}

  // Pre-seed Admin and Demo Student account if empty
  const userCount = sqlite.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminPassHash = bcrypt.hashSync('admin', 10);
    const studentPassHash = bcrypt.hashSync('student123', 10);
    const now = Date.now();

    const insertUser = sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, name, password_hash, role, field_of_interest, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', 'Academic Administrator', adminPassHash, 'admin', 'Administration', now);
    insertUser.run('alex_student', 'Alex Rivera', studentPassHash, 'user', 'Mathematics & Computer Science', now);
    insertUser.run('sophia_phy', 'Sophia Chen', studentPassHash, 'user', 'Physics & Engineering', now);
  } else {
    // Ensure root admin account always exists and retains admin role
    const existingAdmin = sqlite.prepare('SELECT id, role FROM users WHERE id = ?').get('admin') as { id: string; role: string } | undefined;
    if (!existingAdmin) {
      const adminPassHash = bcrypt.hashSync('admin', 10);
      sqlite.prepare(`
        INSERT INTO users (id, name, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin', 'Academic Administrator', adminPassHash, 'admin', 'Administration', Date.now());
    } else if (existingAdmin.role !== 'admin') {
      sqlite.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', 'admin');
    }

    const existingStudent = sqlite.prepare('SELECT id FROM users WHERE id = ?').get('alex_student');
    if (!existingStudent) {
      const studentPassHash = bcrypt.hashSync('student123', 10);
      sqlite.prepare(`
        INSERT INTO users (id, name, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('alex_student', 'Alex Rivera', studentPassHash, 'user', 'Mathematics & Computer Science', Date.now());
    }
  }

  const get = async <T = any>(rawSql: string, params: any[] = []): Promise<T | undefined> => {
    return sqlite.prepare(rawSql).get(...params) as T | undefined;
  };

  const all = async <T = any>(rawSql: string, params: any[] = []): Promise<T[]> => {
    return sqlite.prepare(rawSql).all(...params) as T[];
  };

  const run = async (rawSql: string, params: any[] = []): Promise<{ changes?: number }> => {
    const res = sqlite.prepare(rawSql).run(...params);
    return { changes: res.changes };
  };

  const exec = async (rawSql: string): Promise<void> => {
    sqlite.exec(rawSql);
  };

  const instance: UnifiedDb = {
    isPostgres: false,
    get,
    all,
    run,
    prepare: (statementSql: string) => ({
      get: (...params: any[]) => get(statementSql, params),
      all: (...params: any[]) => all(statementSql, params),
      run: (...params: any[]) => run(statementSql, params),
    }),
    exec,
  };

  globalObj.__recursiveqna_unified_db = instance;
  return instance;
}

const db = initDb();
export default db;
