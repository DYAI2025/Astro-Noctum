import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const distPath = path.join(__dirname, "dist");

// BAFE API URL priority:
// 1. BAFE_INTERNAL_URL  – Railway private networking (fastest)
// 2. BAFE_BASE_URL      – explicit override
// 3. VITE_BAFE_BASE_URL – shared with frontend config
// 4. Vercel fallback    – works reliably from any host
const BAFE_BASE_URL =
  process.env.BAFE_INTERNAL_URL ||
  process.env.BAFE_BASE_URL ||
  process.env.VITE_BAFE_BASE_URL ||
  "https://bafe.vercel.app";

// ── Generic proxy helper ────────────────────────────────────────────
async function proxyToBafe(targetUrl, req, res) {
  console.log(`[proxy] ${req.method} ${targetUrl}`);
  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "GET" ? undefined : JSON.stringify(req.body),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    if (!upstream.ok) {
      console.error(`[proxy] → ${upstream.status}  body: ${body.slice(0, 300)}`);
    }

    res.status(upstream.status).set("Content-Type", contentType).send(body);
  } catch (err) {
    console.error(`[proxy] network error:`, err.message);
    res.status(502).json({
      error: "BAFE API unreachable",
      details: err.message,
    });
  }
}

async function proxyToBafeWithFallback(targetUrls, req, res) {
  let lastResponse = null;

  for (const targetUrl of targetUrls) {
    console.log(`[proxy] trying ${req.method} ${targetUrl}`);
    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: req.method === "GET" ? undefined : JSON.stringify(req.body),
      });

      if (upstream.status === 404) {
        const body = await upstream.text();
        console.warn(`[proxy] 404 at ${targetUrl}: ${body.slice(0, 200)}`);
        lastResponse = { status: upstream.status, body, contentType: upstream.headers.get("content-type") || "application/json" };
        continue;
      }

      const contentType = upstream.headers.get("content-type") || "application/json";
      const body = await upstream.text();

      if (!upstream.ok) {
        console.error(`[proxy] → ${upstream.status}  body: ${body.slice(0, 300)}`);
      }

      return res.status(upstream.status).set("Content-Type", contentType).send(body);
    } catch (err) {
      console.error(`[proxy] network error on ${targetUrl}:`, err.message);
    }
  }

  if (lastResponse) {
    return res.status(lastResponse.status).set("Content-Type", lastResponse.contentType).send(lastResponse.body);
  }

  res.status(502).json({
    error: "BAFE API unreachable",
    details: "All fallback endpoints failed",
  });
}

// ── /calculate/:endpoint  (bazi, western, fusion, wuxing, tst) ──────
const CALC_ENDPOINTS = ["bazi", "western", "fusion", "wuxing", "tst"];

app.post("/api/calculate/:endpoint", express.json(), (req, res) => {
  const { endpoint } = req.params;
  if (!CALC_ENDPOINTS.includes(endpoint)) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
  }
  proxyToBafeWithFallback(
    [
      `${BAFE_BASE_URL}/api/calculate/${endpoint}`,
      `${BAFE_BASE_URL}/calculate/${endpoint}`,
    ],
    req,
    res,
  );
});

// ── /chart ──────────────────────────────────────────────────────────
app.post("/api/chart", express.json(), (req, res) => {
  proxyToBafe(`${BAFE_BASE_URL}/chart`, req, res);
});

app.get("/api/chart", (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const url = `${BAFE_BASE_URL}/chart${qs ? `?${qs}` : ""}`;
  proxyToBafe(url, req, res);
});

// ── /api/webhook/chart ──────────────────────────────────────────────
app.post("/api/webhook/chart", express.json(), (req, res) => {
  proxyToBafe(`${BAFE_BASE_URL}/api/webhook/chart`, req, res);
});

// ── Diagnostic: probe BAFE to discover available routes ─────────────
app.get("/api/debug-bafe", async (_req, res) => {
  const probes = [
    { label: "root /", method: "GET", url: `${BAFE_BASE_URL}/` },
    { label: "/docs", method: "GET", url: `${BAFE_BASE_URL}/docs` },
    { label: "/openapi.json", method: "GET", url: `${BAFE_BASE_URL}/openapi.json` },
    { label: "/health", method: "GET", url: `${BAFE_BASE_URL}/health` },
    { label: "/chart", method: "GET", url: `${BAFE_BASE_URL}/chart` },
    { label: "/api/webhook/chart", method: "GET", url: `${BAFE_BASE_URL}/api/webhook/chart` },
    { label: "POST /api/calculate/western", method: "POST", url: `${BAFE_BASE_URL}/api/calculate/western` },
    { label: "POST /calculate/western", method: "POST", url: `${BAFE_BASE_URL}/calculate/western` },
  ];

  const results = [];
  for (const { label, method, url } of probes) {
    try {
      const r = await fetch(url, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : {},
        body: method === "POST" ? JSON.stringify({ date: "1990-01-01T12:00:00", tz: "Europe/Berlin", lon: 13.405, lat: 52.52 }) : undefined,
      });
      const text = await r.text();
      results.push({
        label,
        url,
        status: r.status,
        contentType: r.headers.get("content-type"),
        body: text.slice(0, 500),
      });
    } catch (err) {
      results.push({ label, url, error: err.message });
    }
  }

  res.json({ bafe_base_url: BAFE_BASE_URL, probes: results });
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
