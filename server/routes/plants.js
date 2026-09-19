import { Router } from "express";
import { nanoid } from "nanoid";
import { pool } from "../db/index.js";
import { buildInsert, buildUpdate } from "../db/queryHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const PLANT_FIELDS = [
  "name",
  "species",
  "sunlight",
  "watering_frequency_days",
  "fertilizing_frequency_days",
  "last_watered",
  "last_fertilized",
  "planted_date",
  "notes",
  "bed_id",
  "pos_x",
  "pos_y",
];

// Date/timestamp columns reject "" in Postgres (unlike SQLite's loose TEXT
// typing) — an empty date input from the client means "no value", i.e. null.
const DATE_FIELDS = new Set(["last_watered", "last_fertilized", "planted_date"]);

function pickPlantInput(body) {
  const input = {};
  for (const field of PLANT_FIELDS) {
    if (body[field] === undefined) continue;
    input[field] = DATE_FIELDS.has(field) && body[field] === "" ? null : body[field];
  }
  return input;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM plants ORDER BY created_at DESC");
    res.json(rows);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM plants WHERE id = $1", [req.params.id]);
    const plant = rows[0];
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    const { rows: logs } = await pool.query(
      "SELECT * FROM care_logs WHERE plant_id = $1 ORDER BY logged_at DESC",
      [req.params.id]
    );
    res.json({ ...plant, care_logs: logs });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = pickPlantInput(req.body);
    if (!input.name) return res.status(400).json({ error: "name is required" });

    const id = nanoid();
    const { text, values } = buildInsert("plants", "id", id, input);
    const { rows } = await pool.query(text, values);
    res.status(201).json(rows[0]);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows: existingRows } = await pool.query("SELECT * FROM plants WHERE id = $1", [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Plant not found" });

    const input = pickPlantInput(req.body);
    if (Object.keys(input).length === 0) return res.json(existing);

    const { text, values } = buildUpdate("plants", "id", req.params.id, input);
    const { rows } = await pool.query(text, values);
    res.json(rows[0]);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query("DELETE FROM plants WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Plant not found" });
    res.status(204).send();
  })
);

// Log a care action (water, fertilize, prune, note) and update the plant's tracking fields.
router.post(
  "/:id/care",
  asyncHandler(async (req, res) => {
    const { rows: plantRows } = await pool.query("SELECT * FROM plants WHERE id = $1", [req.params.id]);
    const plant = plantRows[0];
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    const { type, notes = "" } = req.body;
    if (!["water", "fertilize", "prune", "note"].includes(type)) {
      return res.status(400).json({ error: "type must be one of water, fertilize, prune, note" });
    }

    const id = nanoid();
    const now = new Date().toISOString();
    await pool.query(
      "INSERT INTO care_logs (id, plant_id, type, notes, logged_at) VALUES ($1, $2, $3, $4, $5)",
      [id, plant.id, type, notes, now]
    );

    if (type === "water") {
      await pool.query("UPDATE plants SET last_watered = $1 WHERE id = $2", [now, plant.id]);
    } else if (type === "fertilize") {
      await pool.query("UPDATE plants SET last_fertilized = $1 WHERE id = $2", [now, plant.id]);
    }

    const { rows: updatedRows } = await pool.query("SELECT * FROM plants WHERE id = $1", [plant.id]);
    res.status(201).json(updatedRows[0]);
  })
);

export default router;
