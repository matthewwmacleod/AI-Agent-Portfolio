import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (a Postgres connection string). See server/.env.example.");
}

// Cloud Postgres providers (Neon, Supabase, Render, ...) require SSL; a local
// dev database typically doesn't offer it, so only opt in when it looks remote.
const isLocal = /^(localhost|127\.0\.0\.1)/.test(new URL(process.env.DATABASE_URL).hostname);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS garden_beds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      width INTEGER NOT NULL DEFAULT 4,
      height INTEGER NOT NULL DEFAULT 4,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL DEFAULT '',
      sunlight TEXT NOT NULL DEFAULT 'partial',
      watering_frequency_days INTEGER NOT NULL DEFAULT 7,
      fertilizing_frequency_days INTEGER NOT NULL DEFAULT 30,
      last_watered TIMESTAMPTZ,
      last_fertilized TIMESTAMPTZ,
      planted_date TEXT,
      notes TEXT NOT NULL DEFAULT '',
      bed_id TEXT REFERENCES garden_beds(id) ON DELETE SET NULL,
      pos_x INTEGER,
      pos_y INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS care_logs (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_plants_bed_id ON plants(bed_id);
    CREATE INDEX IF NOT EXISTS idx_care_logs_plant_id ON care_logs(plant_id);
  `);
}
