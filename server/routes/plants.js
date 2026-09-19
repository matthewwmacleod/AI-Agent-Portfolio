import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";

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

function pickPlantInput(body) {
  const input = {};
  for (const field of PLANT_FIELDS) {
    if (body[field] !== undefined) input[field] = body[field];
  }
  return input;
}

router.get("/", (req, res) => {
  const plants = db.prepare("SELECT * FROM plants ORDER BY created_at DESC").all();
  res.json(plants);
});

router.get("/:id", (req, res) => {
  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(req.params.id);
  if (!plant) return res.status(404).json({ error: "Plant not found" });
  const logs = db
    .prepare("SELECT * FROM care_logs WHERE plant_id = ? ORDER BY logged_at DESC")
    .all(req.params.id);
  res.json({ ...plant, care_logs: logs });
});

router.post("/", (req, res) => {
  const input = pickPlantInput(req.body);
  if (!input.name) return res.status(400).json({ error: "name is required" });

  const id = nanoid();
  const fields = ["id", ...Object.keys(input)];
  const placeholders = fields.map(() => "?").join(", ");
  const values = [id, ...Object.values(input)];

  db.prepare(`INSERT INTO plants (${fields.join(", ")}) VALUES (${placeholders})`).run(...values);
  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(id);
  res.status(201).json(plant);
});

router.patch("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM plants WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Plant not found" });

  const input = pickPlantInput(req.body);
  if (Object.keys(input).length === 0) return res.json(existing);

  const setClause = Object.keys(input)
    .map((key) => `${key} = ?`)
    .join(", ");
  db.prepare(`UPDATE plants SET ${setClause} WHERE id = ?`).run(...Object.values(input), req.params.id);

  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(req.params.id);
  res.json(plant);
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM plants WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Plant not found" });
  res.status(204).send();
});

// Log a care action (water, fertilize, prune, note) and update the plant's tracking fields.
router.post("/:id/care", (req, res) => {
  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(req.params.id);
  if (!plant) return res.status(404).json({ error: "Plant not found" });

  const { type, notes = "" } = req.body;
  if (!["water", "fertilize", "prune", "note"].includes(type)) {
    return res.status(400).json({ error: "type must be one of water, fertilize, prune, note" });
  }

  const id = nanoid();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO care_logs (id, plant_id, type, notes, logged_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    plant.id,
    type,
    notes,
    now
  );

  if (type === "water") {
    db.prepare("UPDATE plants SET last_watered = ? WHERE id = ?").run(now, plant.id);
  } else if (type === "fertilize") {
    db.prepare("UPDATE plants SET last_fertilized = ? WHERE id = ?").run(now, plant.id);
  }

  const updatedPlant = db.prepare("SELECT * FROM plants WHERE id = ?").get(plant.id);
  res.status(201).json(updatedPlant);
});

export default router;
