import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

function defaultJsonFile() {
  return process.env.HOMETASK_DATA_FILE || path.join(DATA_DIR, 'hometask.json');
}

function defaultSqliteFile() {
  return process.env.HOMETASK_SQLITE_FILE || path.join(DATA_DIR, 'hometask.sqlite');
}

function safeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return 'DATABASE_URL';
  }
}

async function createJsonDatabase({ emptyDb, seedDb }) {
  const dataFile = defaultJsonFile();

  return {
    driver: 'json',
    location: dataFile,
    async read() {
      await mkdir(path.dirname(dataFile), { recursive: true });
      if (!existsSync(dataFile)) {
        const db = await seedDb(emptyDb());
        await this.write(db);
        return db;
      }

      const raw = await readFile(dataFile, 'utf8');
      return { ...emptyDb(), ...JSON.parse(raw) };
    },
    async write(db) {
      await mkdir(path.dirname(dataFile), { recursive: true });
      await writeFile(dataFile, JSON.stringify(db, null, 2));
    },
  };
}

async function createSqliteDatabase({ emptyDb, seedDb }) {
  const { DatabaseSync } = await import('node:sqlite');
  const sqliteFile = defaultSqliteFile();
  await mkdir(path.dirname(sqliteFile), { recursive: true });
  const sqlite = new DatabaseSync(sqliteFile);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const selectState = sqlite.prepare('SELECT value FROM app_state WHERE key = ?');
  const writeState = sqlite.prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  return {
    driver: 'sqlite',
    location: sqliteFile,
    connection: sqlite,
    async read() {
      const row = selectState.get('db');
      if (!row) {
        const db = await seedDb(emptyDb());
        await this.write(db);
        return db;
      }

      return { ...emptyDb(), ...JSON.parse(row.value) };
    },
    async write(db) {
      writeState.run('db', JSON.stringify(db), new Date().toISOString());
    },
  };
}

async function createPostgresDatabase({ emptyDb, seedDb }) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when HOMETASK_DB_DRIVER=postgres.');
  }

  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  return {
    driver: 'postgres',
    location: safeDatabaseUrl(databaseUrl),
    connection: pool,
    async read() {
      const result = await pool.query('SELECT value FROM app_state WHERE key = $1', ['db']);
      if (result.rowCount === 0) {
        const db = await seedDb(emptyDb());
        await this.write(db);
        return db;
      }

      return { ...emptyDb(), ...result.rows[0].value };
    },
    async write(db) {
      await pool.query(
        `
          INSERT INTO app_state (key, value, updated_at)
          VALUES ($1, $2::jsonb, now())
          ON CONFLICT (key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        `,
        ['db', JSON.stringify(db)]
      );
    },
    async close() {
      await pool.end();
    },
  };
}

export async function createDatabase(options) {
  const driver = (process.env.HOMETASK_DB_DRIVER || 'json').trim().toLowerCase();

  if (driver === 'json') {
    return createJsonDatabase(options);
  }

  if (driver === 'sqlite') {
    return createSqliteDatabase(options);
  }

  if (driver === 'postgres' || driver === 'postgresql') {
    return createPostgresDatabase(options);
  }

  throw new Error(`Unsupported HOMETASK_DB_DRIVER "${driver}". Use "json", "sqlite", or "postgres".`);
}
