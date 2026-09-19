import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import plantsRouter from "./routes/plants.js";
import bedsRouter from "./routes/beds.js";
import advisorRouter from "./routes/advisor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "../client/dist");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use("/api/plants", plantsRouter);
app.use("/api/beds", bedsRouter);
app.use("/api/advisor", advisorRouter);

// Serve the built client (npm run build in client/) as a static SPA so the whole
// app is one HTTPS origin — required for an installable PWA on iOS.
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Garden app server listening on http://localhost:${PORT}`);
});
