import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "garden.sqlite3");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS garden_beds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    width INTEGER NOT NULL DEFAULT 4,
    height INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT DEFAULT '',
    sunlight TEXT DEFAULT 'partial',
    watering_frequency_days INTEGER NOT NULL DEFAULT 7,
    fertilizing_frequency_days INTEGER NOT NULL DEFAULT 30,
    last_watered TEXT,
    last_fertilized TEXT,
    planted_date TEXT,
    notes TEXT DEFAULT '',
    bed_id TEXT REFERENCES garden_beds(id) ON DELETE SET NULL,
    pos_x INTEGER,
    pos_y INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS care_logs (
    id TEXT PRIMARY KEY,
    plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    notes TEXT DEFAULT '',
    logged_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_plants_bed_id ON plants(bed_id);
  CREATE INDEX IF NOT EXISTS idx_care_logs_plant_id ON care_logs(plant_id);
`);
