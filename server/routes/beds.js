import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";

const router = Router();

router.get("/", (req, res) => {
  const beds = db.prepare("SELECT * FROM garden_beds ORDER BY created_at DESC").all();
  const plantsByBed = db.prepare("SELECT * FROM plants WHERE bed_id IS NOT NULL").all();
  const withPlants = beds.map((bed) => ({
    ...bed,
    plants: plantsByBed.filter((p) => p.bed_id === bed.id),
  }));
  res.json(withPlants);
});

router.post("/", (req, res) => {
  const { name, description = "", width = 4, height = 4 } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const id = nanoid();
  db.prepare(
    "INSERT INTO garden_beds (id, name, description, width, height) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, description, width, height);

  const bed = db.prepare("SELECT * FROM garden_beds WHERE id = ?").get(id);
  res.status(201).json(bed);
});

router.patch("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM garden_beds WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Bed not found" });

  const fields = ["name", "description", "width", "height"];
  const input = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) input[field] = req.body[field];
  }
  if (Object.keys(input).length === 0) return res.json(existing);

  const setClause = Object.keys(input)
    .map((key) => `${key} = ?`)
    .join(", ");
  db.prepare(`UPDATE garden_beds SET ${setClause} WHERE id = ?`).run(...Object.values(input), req.params.id);

  const bed = db.prepare("SELECT * FROM garden_beds WHERE id = ?").get(req.params.id);
  res.json(bed);
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM garden_beds WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Bed not found" });
  res.status(204).send();
});

// Place (or move/remove) a plant within a bed's grid.
router.post("/:id/place", (req, res) => {
  const bed = db.prepare("SELECT * FROM garden_beds WHERE id = ?").get(req.params.id);
  if (!bed) return res.status(404).json({ error: "Bed not found" });

  const { plant_id, x, y } = req.body;
  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(plant_id);
  if (!plant) return res.status(404).json({ error: "Plant not found" });

  if (x < 0 || x >= bed.width || y < 0 || y >= bed.height) {
    return res.status(400).json({ error: "Position is outside the bed's grid" });
  }

  const occupied = db
    .prepare("SELECT * FROM plants WHERE bed_id = ? AND pos_x = ? AND pos_y = ? AND id != ?")
    .get(bed.id, x, y, plant_id);
  if (occupied) return res.status(409).json({ error: "That spot is already occupied" });

  db.prepare("UPDATE plants SET bed_id = ?, pos_x = ?, pos_y = ? WHERE id = ?").run(bed.id, x, y, plant_id);
  const updatedPlant = db.prepare("SELECT * FROM plants WHERE id = ?").get(plant_id);
  res.json(updatedPlant);
});

router.post("/:id/unplace", (req, res) => {
  const { plant_id } = req.body;
  const plant = db.prepare("SELECT * FROM plants WHERE id = ? AND bed_id = ?").get(plant_id, req.params.id);
  if (!plant) return res.status(404).json({ error: "Plant not found in this bed" });

  db.prepare("UPDATE plants SET bed_id = NULL, pos_x = NULL, pos_y = NULL WHERE id = ?").run(plant_id);
  const updatedPlant = db.prepare("SELECT * FROM plants WHERE id = ?").get(plant_id);
  res.json(updatedPlant);
});

export default router;
