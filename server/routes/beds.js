import { Router } from "express";
import { nanoid } from "nanoid";
import { pool } from "../db/index.js";
import { buildUpdate } from "../db/queryHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows: beds } = await pool.query("SELECT * FROM garden_beds ORDER BY created_at DESC");
    const { rows: plantsInBeds } = await pool.query("SELECT * FROM plants WHERE bed_id IS NOT NULL");
    const withPlants = beds.map((bed) => ({
      ...bed,
      plants: plantsInBeds.filter((p) => p.bed_id === bed.id),
    }));
    res.json(withPlants);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description = "", width = 4, height = 4 } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const id = nanoid();
    const { rows } = await pool.query(
      "INSERT INTO garden_beds (id, name, description, width, height) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, name, description, width, height]
    );
    res.status(201).json(rows[0]);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows: existingRows } = await pool.query("SELECT * FROM garden_beds WHERE id = $1", [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Bed not found" });

    const fields = ["name", "description", "width", "height"];
    const input = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) input[field] = req.body[field];
    }
    if (Object.keys(input).length === 0) return res.json(existing);

    const { text, values } = buildUpdate("garden_beds", "id", req.params.id, input);
    const { rows } = await pool.query(text, values);
    res.json(rows[0]);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query("DELETE FROM garden_beds WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Bed not found" });
    res.status(204).send();
  })
);

// Place (or move/remove) a plant within a bed's grid.
router.post(
  "/:id/place",
  asyncHandler(async (req, res) => {
    const { rows: bedRows } = await pool.query("SELECT * FROM garden_beds WHERE id = $1", [req.params.id]);
    const bed = bedRows[0];
    if (!bed) return res.status(404).json({ error: "Bed not found" });

    const { plant_id, x, y } = req.body;
    const { rows: plantRows } = await pool.query("SELECT * FROM plants WHERE id = $1", [plant_id]);
    const plant = plantRows[0];
    if (!plant) return res.status(404).json({ error: "Plant not found" });

    if (x < 0 || x >= bed.width || y < 0 || y >= bed.height) {
      return res.status(400).json({ error: "Position is outside the bed's grid" });
    }

    const { rows: occupiedRows } = await pool.query(
      "SELECT * FROM plants WHERE bed_id = $1 AND pos_x = $2 AND pos_y = $3 AND id != $4",
      [bed.id, x, y, plant_id]
    );
    if (occupiedRows[0]) return res.status(409).json({ error: "That spot is already occupied" });

    const { rows: updatedRows } = await pool.query(
      "UPDATE plants SET bed_id = $1, pos_x = $2, pos_y = $3 WHERE id = $4 RETURNING *",
      [bed.id, x, y, plant_id]
    );
    res.json(updatedRows[0]);
  })
);

router.post(
  "/:id/unplace",
  asyncHandler(async (req, res) => {
    const { plant_id } = req.body;
    const { rows: plantRows } = await pool.query("SELECT * FROM plants WHERE id = $1 AND bed_id = $2", [
      plant_id,
      req.params.id,
    ]);
    if (!plantRows[0]) return res.status(404).json({ error: "Plant not found in this bed" });

    const { rows: updatedRows } = await pool.query(
      "UPDATE plants SET bed_id = NULL, pos_x = NULL, pos_y = NULL WHERE id = $1 RETURNING *",
      [plant_id]
    );
    res.json(updatedRows[0]);
  })
);

export default router;
