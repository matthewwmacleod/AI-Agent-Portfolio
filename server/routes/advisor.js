import { Router } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const MODEL = "claude-sonnet-5";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a knowledgeable, friendly gardening advisor inside a gardening app.
Give practical, concise advice about plant care, pests, diseases, soil, watering, fertilizing,
and garden planning. When a photo is provided, help identify the plant or diagnose visible issues.
If the user references one of their tracked plants, tailor advice to its species and care history.
Keep answers focused and actionable; use short paragraphs or bullet points.`;

function buildPlantContext(plantId) {
  if (!plantId) return "";
  const plant = db.prepare("SELECT * FROM plants WHERE id = ?").get(plantId);
  if (!plant) return "";
  const logs = db
    .prepare("SELECT type, notes, logged_at FROM care_logs WHERE plant_id = ? ORDER BY logged_at DESC LIMIT 5")
    .all(plantId);
  return `\n\nContext about the user's plant "${plant.name}" (${plant.species || "species unknown"}):
- Sunlight: ${plant.sunlight}
- Watering every ${plant.watering_frequency_days} days, last watered: ${plant.last_watered || "unknown"}
- Fertilizing every ${plant.fertilizing_frequency_days} days, last fertilized: ${plant.last_fertilized || "unknown"}
- Notes: ${plant.notes || "none"}
- Recent care log: ${logs.map((l) => `${l.type} on ${l.logged_at}`).join("; ") || "none"}`;
}

router.post("/ask", upload.single("image"), async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({
      error: "AI advisor is not configured. Set ANTHROPIC_API_KEY on the server to enable it.",
    });
  }

  const { question, plant_id } = req.body;
  if (!question && !req.file) {
    return res.status(400).json({ error: "question or image is required" });
  }

  const contentBlocks = [];
  if (req.file) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: req.file.mimetype,
        data: req.file.buffer.toString("base64"),
      },
    });
  }
  contentBlocks.push({
    type: "text",
    text: `${question || "What plant is this, and how should I care for it?"}${buildPlantContext(plant_id)}`,
  });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const answer = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({ answer });
  } catch (err) {
    console.error("Advisor request failed:", err);
    res.status(502).json({ error: "Failed to reach the AI advisor. Please try again." });
  }
});

export default router;
