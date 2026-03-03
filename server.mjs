import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const distPath = path.join(__dirname, "dist");

// BAFE API URLs - build ordered list for fallback chain.
// Railway private networking (.railway.internal) is IPv6-only and often
// fails with ENETUNREACH from Node.js fetch. We keep it as an option but
// always include the public URL as a reliable fallback.
const stripTrailingSlash = (url) => url ? url.replace(/\/+$/, "") : url;

const BAFE_PUBLIC_URL = stripTrailingSlash(
  process.env.BAFE_BASE_URL ||
  process.env.VITE_BAFE_BASE_URL ||
  "https://bafe-production.up.railway.app"
);

const BAFE_INTERNAL_URL = stripTrailingSlash(process.env.BAFE_INTERNAL_URL) || null;

// Primary URL for logging
const BAFE_BASE_URL = BAFE_INTERNAL_URL || BAFE_PUBLIC_URL;

// ── Proxy with fallback chain ────────────────────────────────────────
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

      const contentType = upstream.headers.get("content-type") || "application/json";
      const body = await upstream.text();

      if (upstream.ok) {
        // Successful response: return immediately and do not try further fallbacks
        return res.status(upstream.status).set("Content-Type", contentType).send(body);
      }

      if (upstream.status === 404) {
        console.warn(`[proxy] 404 at ${targetUrl}: ${body.slice(0, 200)}`);
      } else {
        console.error(`[proxy] → ${upstream.status}  body: ${body.slice(0, 300)}`);
      }

      // Record the last non-ok response and try the next fallback URL
      lastResponse = { status: upstream.status, body, contentType };
      continue;
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

// ── Helper: build fallback URL list ─────────────────────────────────
// Tries internal URL first (if configured), then public URL.
// BAFE routes live at /calculate/{endpoint} (no /api/ prefix).
function bafeFallbackUrls(routePath) {
  const urls = [];
  if (BAFE_INTERNAL_URL) urls.push(`${BAFE_INTERNAL_URL}${routePath}`);
  urls.push(`${BAFE_PUBLIC_URL}${routePath}`);
  return urls;
}

// ── /calculate/:endpoint  (bazi, western, fusion, wuxing, tst) ──────
const CALC_ENDPOINTS = ["bazi", "western", "fusion", "wuxing", "tst"];

app.post("/api/calculate/:endpoint", express.json(), (req, res) => {
  const { endpoint } = req.params;
  if (!CALC_ENDPOINTS.includes(endpoint)) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
  }
  proxyToBafeWithFallback(
    bafeFallbackUrls(`/calculate/${endpoint}`),
    req,
    res,
  );
});

// ── /chart ──────────────────────────────────────────────────────────
app.post("/api/chart", express.json(), (req, res) => {
  proxyToBafeWithFallback(bafeFallbackUrls("/chart"), req, res);
});

app.get("/api/chart", (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const suffix = `/chart${qs ? `?${qs}` : ""}`;
  proxyToBafeWithFallback(bafeFallbackUrls(suffix), req, res);
});

// ── /api/webhook/chart ──────────────────────────────────────────────
app.post("/api/webhook/chart", express.json(), (req, res) => {
  proxyToBafeWithFallback(
    bafeFallbackUrls("/api/webhooks/chart"),
    req,
    res,
  );
});

// ── Diagnostic: probe BAFE to discover available routes ─────────────
app.get("/api/debug-bafe", async (_req, res) => {
  const baseUrl = BAFE_PUBLIC_URL;
  const probes = [
    { label: "root /", method: "GET", url: `${baseUrl}/` },
    { label: "/docs", method: "GET", url: `${baseUrl}/docs` },
    { label: "/openapi.json", method: "GET", url: `${baseUrl}/openapi.json` },
    { label: "/health", method: "GET", url: `${baseUrl}/health` },
    { label: "/chart", method: "GET", url: `${baseUrl}/chart` },
    { label: "POST /calculate/western", method: "POST", url: `${baseUrl}/calculate/western` },
    { label: "POST /calculate/bazi", method: "POST", url: `${baseUrl}/calculate/bazi` },
  ];

  const testBody = JSON.stringify({
    date: "1990-01-01T12:00:00", tz: "Europe/Berlin", lon: 13.405, lat: 52.52,
  });

  const results = [];
  for (const { label, method, url } of probes) {
    try {
      const r = await fetch(url, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : {},
        body: method === "POST" ? testBody : undefined,
      });
      const text = await r.text();
      results.push({
        label, url,
        status: r.status,
        contentType: r.headers.get("content-type"),
        body: text.slice(0, 500),
      });
    } catch (err) {
      results.push({ label, url, error: err.message });
    }
  }

  res.json({
    bafe_public_url: BAFE_PUBLIC_URL,
    bafe_internal_url: BAFE_INTERNAL_URL,
    bafe_active: BAFE_BASE_URL,
    probes: results,
  });
});

// ── Supabase (server-side, service role key) ────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_TOOL_SECRET = process.env.ELEVENLABS_TOOL_SECRET;

const supabaseServer =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

// ── GET /api/profile/:userId — ElevenLabs Custom Tool endpoint ──────
app.get("/api/profile/:userId", async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const { userId } = req.params;

  const { data, error } = await supabaseServer
    .from("astro_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Profile not found" });
    }
    console.error("[profile] Supabase error:", error);
    return res.status(500).json({ error: error.message });
  }

  // Build a concise summary for Levi instead of dumping raw BAFE data.
  // ElevenLabs agents have limited context — send only what's interpretable.
  const raw = data.astro_json || {};
  const bafe = raw.bafe || raw;

  const bazi = bafe.bazi || {};
  const western = bafe.western || {};
  const wuxing = bafe.wuxing || {};
  const fusion = bafe.fusion || {};

  // Extract BaZi pillars in readable form
  const pillars = bazi.pillars
    ? Object.fromEntries(
        Object.entries(bazi.pillars).map(([k, v]) => [
          k,
          `${v.stem || "?"} / ${v.branch || "?"}${v.animal ? ` (${v.animal})` : ""}`,
        ])
      )
    : null;

  // Fetch past conversation summaries for session continuity
  let pastConversations = [];
  try {
    const { data: convos, error: convosError } = await supabaseServer
      .from("agent_conversations")
      .select("summary, topics, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (convosError) {
      console.warn("[profile] conversation fetch failed:", convosError.message || convosError);
    } else if (convos) {
      pastConversations = convos;
    }
  } catch (convErr) {
    console.warn("[profile] conversation fetch failed (thrown):", convErr.message);
  }

  res.json({
    user_id: data.user_id,
    birth_date: data.birth_date,
    birth_time: data.birth_time,
    timezone: data.iana_time_zone,
    computed_at: data.astro_computed_at,

    // Western astrology
    sun_sign: data.sun_sign,
    moon_sign: data.moon_sign,
    ascendant: data.asc_sign,

    // BaZi (Chinese)
    day_master: bazi.day_master || null,
    zodiac_animal: bazi.zodiac_sign || null,
    pillars: pillars,

    // Wu-Xing (Five Elements)
    dominant_element: wuxing.dominant_element || null,
    element_balance: wuxing.element_percentages || wuxing.balance || null,

    // Fusion insights (if available)
    fusion_theme: fusion.theme || fusion.summary || null,

    // AI interpretation (the Gemini text the user already saw)
    interpretation: bafe.interpretation || raw.interpretation || null,

    // Past conversation summaries for session continuity
    past_conversations: pastConversations,
  });
});

// ── POST /api/agent/conversation — Save Levi conversation summary ───
app.post("/api/agent/conversation", express.json(), async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const { user_id, summary, topics } = req.body;

  if (!user_id || !summary) {
    return res.status(400).json({ error: "user_id and summary are required" });
  }

  const { error } = await supabaseServer
    .from("agent_conversations")
    .insert({
      user_id,
      summary,
      topics: topics || [],
    });

  if (error) {
    console.error("[agent/conversation] Supabase error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ status: "saved" });
});

// ── Static files ────────────────────────────────────────────────────
app.use(express.static(distPath, { index: "index.html" }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Astro-Noctum listening on port ${port}`);
  console.log(`BAFE public  → ${BAFE_PUBLIC_URL}`);
  if (BAFE_INTERNAL_URL) console.log(`BAFE internal → ${BAFE_INTERNAL_URL}`);
});
