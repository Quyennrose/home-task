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
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      user_type TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      avatar_url TEXT,
      password_hash TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS helper_profiles (
      id TEXT PRIMARY KEY,
      service TEXT,
      application_status TEXT,
      verified BOOLEAN NOT NULL DEFAULT false,
      rating NUMERIC(3, 2),
      reviews_count INTEGER,
      experience TEXT,
      location TEXT,
      bio TEXT,
      hourly_rate INTEGER,
      completed_jobs INTEGER,
      data JSONB NOT NULL,
      submitted_at TIMESTAMPTZ,
      reviewed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS customer_profiles (
      id TEXT PRIMARY KEY,
      preferences JSONB,
      favorite_helpers JSONB,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      helper_id TEXT,
      service TEXT,
      scheduled_date DATE,
      scheduled_time TEXT,
      hours INTEGER,
      address TEXT,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      total_price INTEGER,
      notes TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS booking_progress (
      booking_id TEXT PRIMARY KEY,
      checklist JSONB,
      check_in JSONB,
      check_out JSONB,
      photo_confirmation JSONB,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS booking_reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      helper_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      service TEXT,
      image_urls JSONB,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      message TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS booking_chat_messages (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      booking_id TEXT,
      purpose TEXT,
      filename TEXT,
      content_type TEXT,
      storage_key TEXT,
      public_url TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_reference TEXT,
      amount INTEGER,
      currency TEXT,
      status TEXT NOT NULL,
      raw_payload JSONB,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_type TEXT,
      actor_name TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      metadata JSONB,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;

    ALTER TABLE helper_profiles
      ADD COLUMN IF NOT EXISTS service TEXT,
      ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2),
      ADD COLUMN IF NOT EXISTS reviews_count INTEGER,
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS hourly_rate INTEGER,
      ADD COLUMN IF NOT EXISTS completed_jobs INTEGER,
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

    ALTER TABLE customer_profiles
      ADD COLUMN IF NOT EXISTS preferences JSONB,
      ADD COLUMN IF NOT EXISTS favorite_helpers JSONB;

    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS service TEXT,
      ADD COLUMN IF NOT EXISTS scheduled_date DATE,
      ADD COLUMN IF NOT EXISTS scheduled_time TEXT,
      ADD COLUMN IF NOT EXISTS hours INTEGER,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS total_price INTEGER,
      ADD COLUMN IF NOT EXISTS notes TEXT;

    ALTER TABLE booking_progress
      ADD COLUMN IF NOT EXISTS checklist JSONB,
      ADD COLUMN IF NOT EXISTS check_in JSONB,
      ADD COLUMN IF NOT EXISTS check_out JSONB,
      ADD COLUMN IF NOT EXISTS photo_confirmation JSONB;

    ALTER TABLE booking_reviews
      ADD COLUMN IF NOT EXISTS comment TEXT,
      ADD COLUMN IF NOT EXISTS service TEXT,
      ADD COLUMN IF NOT EXISTS image_urls JSONB;

    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS message TEXT;

    ALTER TABLE booking_chat_messages
      ADD COLUMN IF NOT EXISTS message TEXT;

    ALTER TABLE assets
      ADD COLUMN IF NOT EXISTS purpose TEXT,
      ADD COLUMN IF NOT EXISTS filename TEXT,
      ADD COLUMN IF NOT EXISTS content_type TEXT,
      ADD COLUMN IF NOT EXISTS storage_key TEXT,
      ADD COLUMN IF NOT EXISTS public_url TEXT;

    ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS provider_reference TEXT,
      ADD COLUMN IF NOT EXISTS amount INTEGER,
      ADD COLUMN IF NOT EXISTS currency TEXT,
      ADD COLUMN IF NOT EXISTS raw_payload JSONB;

    ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS actor_id TEXT,
      ADD COLUMN IF NOT EXISTS actor_type TEXT,
      ADD COLUMN IF NOT EXISTS actor_name TEXT,
      ADD COLUMN IF NOT EXISTS metadata JSONB;

    CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    CREATE INDEX IF NOT EXISTS helper_profiles_status_idx ON helper_profiles(application_status, verified);
    CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS bookings_helper_id_idx ON bookings(helper_id);
    CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
    CREATE INDEX IF NOT EXISTS booking_reviews_helper_id_idx ON booking_reviews(helper_id);
    CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS booking_chat_messages_booking_id_idx ON booking_chat_messages(booking_id);
    CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx ON audit_logs(action, created_at DESC);
  `);

  async function insertJson(client, table, columns, values) {
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }

  function jsonValue(record) {
    return JSON.stringify(record || {});
  }

  function normalizeRows(rows) {
    return rows.map((row) => row.data || {});
  }

  return {
    driver: 'postgres',
    location: safeDatabaseUrl(databaseUrl),
    connection: pool,
    async read() {
      const userCount = await pool.query('SELECT COUNT(*)::int AS count FROM users');
      if (userCount.rows[0].count === 0) {
        const legacyTable = await pool.query("SELECT to_regclass('public.app_state') AS table_name");
        if (legacyTable.rows[0].table_name) {
          const legacyState = await pool.query('SELECT value FROM app_state WHERE key = $1', ['db']);
          if (legacyState.rowCount > 0) {
            const db = { ...emptyDb(), ...legacyState.rows[0].value };
            await this.write(db);
            return db;
          }
        }

        const db = await seedDb(emptyDb());
        await this.write(db);
        return db;
      }

      const [
        users,
        helperProfiles,
        customerProfiles,
        bookings,
        bookingProgress,
        reviews,
        notifications,
        messages,
        assets,
        payments,
        auditLogs,
      ] = await Promise.all([
        pool.query('SELECT data FROM users ORDER BY created_at NULLS LAST, id'),
        pool.query('SELECT data FROM helper_profiles ORDER BY id'),
        pool.query('SELECT data FROM customer_profiles ORDER BY id'),
        pool.query('SELECT data FROM bookings ORDER BY created_at DESC NULLS LAST, id DESC'),
        pool.query('SELECT booking_id, data FROM booking_progress ORDER BY booking_id'),
        pool.query('SELECT data FROM booking_reviews ORDER BY created_at NULLS LAST, id'),
        pool.query('SELECT data FROM notifications ORDER BY created_at DESC NULLS LAST, id DESC'),
        pool.query('SELECT data FROM booking_chat_messages ORDER BY created_at NULLS LAST, id'),
        pool.query('SELECT data FROM assets ORDER BY created_at NULLS LAST, id'),
        pool.query('SELECT data FROM payments ORDER BY created_at NULLS LAST, id'),
        pool.query('SELECT data FROM audit_logs ORDER BY created_at DESC NULLS LAST, id DESC'),
      ]);

      return {
        ...emptyDb(),
        users: normalizeRows(users.rows),
        helperProfiles: normalizeRows(helperProfiles.rows),
        customerProfiles: normalizeRows(customerProfiles.rows),
        bookings: normalizeRows(bookings.rows),
        bookingProgress: Object.fromEntries(bookingProgress.rows.map((row) => [row.booking_id, row.data || {}])),
        reviews: normalizeRows(reviews.rows),
        notifications: normalizeRows(notifications.rows),
        messages: normalizeRows(messages.rows),
        assets: normalizeRows(assets.rows),
        payments: normalizeRows(payments.rows),
        auditLogs: normalizeRows(auditLogs.rows),
      };
    },
    async write(db) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`
          TRUNCATE
            audit_logs,
            payments,
            assets,
            booking_chat_messages,
            notifications,
            booking_reviews,
            booking_progress,
            bookings,
            customer_profiles,
            helper_profiles,
            users
        `);

        for (const user of db.users || []) {
          await insertJson(client, 'users', ['id', 'name', 'email', 'user_type', 'phone', 'address', 'avatar_url', 'password_hash', 'data', 'created_at', 'updated_at'], [
            user.id,
            user.name || null,
            user.email,
            user.userType,
            user.phone || null,
            user.address || null,
            user.avatar || user.avatarUrl || null,
            user.passwordHash || null,
            jsonValue(user),
            user.createdAt || null,
            user.updatedAt || null,
          ]);
        }

        for (const profile of db.helperProfiles || []) {
          await insertJson(client, 'helper_profiles', ['id', 'service', 'application_status', 'verified', 'rating', 'reviews_count', 'experience', 'location', 'bio', 'hourly_rate', 'completed_jobs', 'data', 'submitted_at', 'reviewed_at', 'updated_at'], [
            profile.id,
            profile.service || null,
            profile.applicationStatus || null,
            Boolean(profile.verified),
            profile.rating ?? null,
            profile.reviews ?? profile.reviewsCount ?? null,
            profile.experience || null,
            profile.location || null,
            profile.bio || null,
            profile.hourlyRate ?? null,
            profile.completedJobs ?? null,
            jsonValue(profile),
            profile.submittedAt || null,
            profile.reviewedAt || null,
            profile.updatedAt || profile.reviewedAt || null,
          ]);
        }

        for (const profile of db.customerProfiles || []) {
          await insertJson(client, 'customer_profiles', ['id', 'preferences', 'favorite_helpers', 'data', 'updated_at'], [
            profile.id,
            jsonValue(profile.preferences || []),
            jsonValue(profile.favoriteHelpers || []),
            jsonValue(profile),
            profile.updatedAt || null,
          ]);
        }

        for (const booking of db.bookings || []) {
          await insertJson(client, 'bookings', ['id', 'customer_id', 'helper_id', 'service', 'scheduled_date', 'scheduled_time', 'hours', 'address', 'status', 'payment_status', 'total_price', 'notes', 'data', 'created_at', 'updated_at'], [
            booking.id,
            booking.customerId,
            booking.helperId || null,
            booking.service || null,
            booking.date || null,
            booking.time || null,
            booking.hours ?? null,
            booking.address || null,
            booking.status || 'pending',
            booking.paymentStatus || 'unpaid',
            booking.totalPrice ?? null,
            booking.notes || null,
            jsonValue(booking),
            booking.createdAt || null,
            booking.updatedAt || null,
          ]);
        }

        for (const [bookingId, progress] of Object.entries(db.bookingProgress || {})) {
          await insertJson(client, 'booking_progress', ['booking_id', 'checklist', 'check_in', 'check_out', 'photo_confirmation', 'data', 'updated_at'], [
            bookingId,
            jsonValue(progress.checklist || []),
            progress.checkIn ? jsonValue(progress.checkIn) : null,
            progress.checkOut ? jsonValue(progress.checkOut) : null,
            progress.photoConfirmation ? jsonValue(progress.photoConfirmation) : null,
            jsonValue(progress),
            progress.updatedAt || null,
          ]);
        }

        for (const review of db.reviews || []) {
          await insertJson(client, 'booking_reviews', ['id', 'booking_id', 'helper_id', 'customer_id', 'rating', 'comment', 'service', 'image_urls', 'data', 'created_at'], [
            review.id,
            review.bookingId,
            review.helperId,
            review.customerId,
            Number(review.rating || 0),
            review.comment || null,
            review.service || null,
            jsonValue(review.images || review.imageUrls || []),
            jsonValue(review),
            review.createdAt || review.date || null,
          ]);
        }

        for (const notification of db.notifications || []) {
          await insertJson(client, 'notifications', ['id', 'user_id', 'title', 'message', 'read', 'data', 'created_at'], [
            notification.id,
            notification.userId,
            notification.title || null,
            notification.message || null,
            Boolean(notification.read),
            jsonValue(notification),
            notification.createdAt || null,
          ]);
        }

        for (const message of db.messages || []) {
          await insertJson(client, 'booking_chat_messages', ['id', 'booking_id', 'sender_id', 'message', 'data', 'created_at'], [
            message.id,
            message.bookingId,
            message.senderId,
            message.message || null,
            jsonValue(message),
            message.createdAt || null,
          ]);
        }

        for (const asset of db.assets || []) {
          await insertJson(client, 'assets', ['id', 'owner_id', 'booking_id', 'purpose', 'filename', 'content_type', 'storage_key', 'public_url', 'data', 'created_at'], [
            asset.id,
            asset.ownerId || null,
            asset.bookingId || null,
            asset.purpose || null,
            asset.filename || null,
            asset.contentType || null,
            asset.storageKey || null,
            asset.publicUrl || asset.url || null,
            jsonValue(asset),
            asset.createdAt || null,
          ]);
        }

        for (const payment of db.payments || []) {
          await insertJson(client, 'payments', ['id', 'booking_id', 'provider', 'provider_reference', 'amount', 'currency', 'status', 'raw_payload', 'data', 'created_at', 'updated_at'], [
            payment.id,
            payment.bookingId,
            payment.provider || 'local',
            payment.providerReference || null,
            payment.amount ?? null,
            payment.currency || 'VND',
            payment.status || 'pending',
            payment.rawPayload ? jsonValue(payment.rawPayload) : null,
            jsonValue(payment),
            payment.createdAt || null,
            payment.updatedAt || null,
          ]);
        }

        for (const auditLog of db.auditLogs || []) {
          await insertJson(client, 'audit_logs', ['id', 'actor_id', 'actor_type', 'actor_name', 'action', 'target_type', 'target_id', 'metadata', 'data', 'created_at'], [
            auditLog.id,
            auditLog.actorId || null,
            auditLog.actorType || null,
            auditLog.actorName || null,
            auditLog.action,
            auditLog.targetType,
            auditLog.targetId,
            jsonValue(auditLog.metadata || {}),
            jsonValue(auditLog),
            auditLog.createdAt || null,
          ]);
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
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
