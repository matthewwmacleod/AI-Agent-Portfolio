import "dotenv/config";
import express from "express";
import cors from "cors";
import plantsRouter from "./routes/plants.js";
import bedsRouter from "./routes/beds.js";
import advisorRouter from "./routes/advisor.js";

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Garden app server listening on http://localhost:${PORT}`);
});
