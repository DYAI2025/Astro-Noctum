import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const distPath = path.join(__dirname, "dist");

const stripTrailingSlash = (url) => (url ? url.replace(/\/+$/, "") : url);

const BAFE_PUBLIC_URL = stripTrailingSlash(
  process.env.BAFE_BASE_URL ||
    process.env.VITE_BAFE_BASE_URL ||
    "https://bafe-production.up.railway.app",
);
const BAFE_INTERNAL_URL = stripTrailingSlash(process.env.BAFE_INTERNAL_URL) || null;
const BAFE_BASE_URL = BAFE_INTERNAL_URL || BAFE_PUBLIC_URL;

function bafeFallbackUrls(routePath) {
  const urls = [];
  if (BAFE_INTERNAL_URL) urls.push(`${BAFE_INTERNAL_URL}${routePath}`);
  urls.push(`${BAFE_PUBLIC_URL}${routePath}`);
  return urls;
}

async function proxyToBafeWithFallback(targetUrls, req, res) {
  let lastResponse = null;

  for (const targetUrl of targetUrls) {
    console.log("[proxy] trying", req.method, targetUrl);
    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: req.method === "GET" ? undefined : JSON.stringify(req.body),
      });

      const contentType = upstream.headers.get("content-type") || "application/json";
      const body = await upstream.text();

      if (upstream.ok) {
        return res.status(upstream.status).set("Content-Type", contentType).send(body);
      }

      if (upstream.status === 404) {
        console.warn("[proxy] 404", targetUrl, body.slice(0, 200));
      } else {
        console.error("[proxy] upstream error", upstream.status, body.slice(0, 300));
      }

      lastResponse = { status: upstream.status, contentType, body };
    } catch (err) {
      console.error("[proxy] network error", targetUrl, err.message);
    }
  }

  if (lastResponse) {
    return res
      .status(lastResponse.status)
      .set("Content-Type", lastResponse.contentType)
      .send(lastResponse.body);
  }

  return res.status(502).json({
    error: "BAFE API unreachable",
    details: "All fallback endpoints failed",
  });
}

const CALC_ENDPOINTS = ["bazi", "western", "fusion", "wuxing", "tst"];

app.post("/api/calculate/:endpoint", express.json(), (req, res) => {
  const { endpoint } = req.params;
  if (!CALC_ENDPOINTS.includes(endpoint)) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
  }

  return proxyToBafeWithFallback(bafeFallbackUrls(`/calculate/${endpoint}`), req, res);
});

app.post("/api/chart", express.json(), (req, res) => {
  return proxyToBafeWithFallback(bafeFallbackUrls("/chart"), req, res);
});

app.get("/api/chart", (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const suffix = `/chart${qs ? `?${qs}` : ""}`;
  return proxyToBafeWithFallback(bafeFallbackUrls(suffix), req, res);
});

app.post("/api/webhook/chart", express.json(), (req, res) => {
  return proxyToBafeWithFallback(bafeFallbackUrls("/api/webhooks/chart"), req, res);
});

app.get("/api/debug-bafe", async (_req, res) => {
  const baseUrl = BAFE_PUBLIC_URL;
  const probes = [
    { label: "root", method: "GET", url: `${baseUrl}/` },
    { label: "docs", method: "GET", url: `${baseUrl}/docs` },
    { label: "openapi", method: "GET", url: `${baseUrl}/openapi.json` },
    { label: "health", method: "GET", url: `${baseUrl}/health` },
    { label: "chart", method: "GET", url: `${baseUrl}/chart` },
    { label: "calculate-western", method: "POST", url: `${baseUrl}/calculate/western` },
    { label: "calculate-bazi", method: "POST", url: `${baseUrl}/calculate/bazi` },
  ];

  const testBody = JSON.stringify({
    date: "1990-01-01T12:00:00",
    tz: "Europe/Berlin",
    lon: 13.405,
    lat: 52.52,
  });

  const results = [];
  for (const probe of probes) {
    try {
      const response = await fetch(probe.url, {
        method: probe.method,
        headers: probe.method === "POST" ? { "Content-Type": "application/json" } : {},
        body: probe.method === "POST" ? testBody : undefined,
      });
      const text = await response.text();
      results.push({
        label: probe.label,
        url: probe.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        body: text.slice(0, 500),
      });
    } catch (err) {
      results.push({ label: probe.label, url: probe.url, error: err.message });
    }
  }

  return res.json({
    bafe_public_url: BAFE_PUBLIC_URL,
    bafe_internal_url: BAFE_INTERNAL_URL,
    bafe_active: BAFE_BASE_URL,
    probes: results,
  });
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ELEVENLABS_TOOL_SECRET = process.env.ELEVENLABS_TOOL_SECRET || "";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const PROFILE_SELECT_FIELDS = [
  "user_id",
  "birth_date",
  "birth_time",
  "iana_time_zone",
  "birth_lat",
  "birth_lng",
  "birth_place_name",
  "sun_sign",
  "moon_sign",
  "asc_sign",
  "astro_json",
  "astro_computed_at",
].join(", ");

function requireToolAuth(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token !== ELEVENLABS_TOOL_SECRET) {
    console.warn("[elevenlabs] unauthorized profile access", req.params.userId);
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (!supabaseAdmin) {
    res.status(503).json({ error: "Supabase not configured on server" });
    return false;
  }
  return true;
}

// ── GET /api/profile/:userId — ElevenLabs Custom Tool endpoint ──────
// Returns astro profile + display_name + last 10 conversation summaries
app.get("/api/profile/:userId", async (req, res) => {
  if (!requireToolAuth(req, res)) return;

  const { userId } = req.params;
  const { data, error } = await supabaseAdmin
    .from("astro_profiles")
    .select(PROFILE_SELECT_FIELDS)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.warn("[elevenlabs] profile not found", userId);
    return res.status(404).json({ error: "Profile not found" });
  }

  console.log("[elevenlabs] profile delivered", userId);
  return res.json({
    user_id: data.user_id,
    sun_sign: data.sun_sign,
    moon_sign: data.moon_sign,
    asc_sign: data.asc_sign,
    birth_date: data.birth_date,
    birth_time: data.birth_time,
    timezone: data.iana_time_zone,
    astro_json: data.astro_json,
    computed_at: data.astro_computed_at,
  });
});

app.post("/api/agent/session", express.json(), async (req, res) => {
  const { user_id, chart_context } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "user_id required" });
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  return res.json({
    session_token: sessionToken,
    user_id,
    chart_context: chart_context || "",
    expires_in: 3600,
  });
});

app.post("/api/auth/signup", express.json(), async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase not configured on server" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("[auth/signup] error", error.message);
    return res.status(400).json({ error: error.message });
  }

  return res.json({ user_id: data.user.id, email: data.user.email });
});

app.use(express.static(distPath, { index: "index.html" }));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log("Astro-Noctum listening on port", port);
  console.log("BAFE public", BAFE_PUBLIC_URL);
  if (BAFE_INTERNAL_URL) console.log("BAFE internal", BAFE_INTERNAL_URL);
});
