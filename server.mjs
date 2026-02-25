import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const distPath = path.join(__dirname, "dist");
const BAFE_BASE_URL =
  process.env.BAFE_BASE_URL ||
  process.env.VITE_BAFE_BASE_URL ||
  "https://bafe-production.up.railway.app";

// ── API proxy → BAFE backend (avoids browser CORS issues) ──────────
app.post("/api/calculate/:endpoint", express.json(), async (req, res) => {
  const { endpoint } = req.params;
  const allowed = ["bazi", "western", "fusion", "wuxing", "tst"];
  if (!allowed.includes(endpoint)) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
  }

  try {
    const upstream = await fetch(`${BAFE_BASE_URL}/calculate/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();
    res.status(upstream.status).set("Content-Type", contentType).send(body);
  } catch (err) {
    console.error(`Proxy error for /calculate/${endpoint}:`, err.message);
    res.status(502).json({
      error: "BAFE API unreachable",
      details: err.message,
    });
  }
});

// ── Static files ────────────────────────────────────────────────────
app.use(express.static(distPath, { index: "index.html" }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Astro-Noctum listening on port ${port}`);
  console.log(`BAFE proxy → ${BAFE_BASE_URL}`);
});
