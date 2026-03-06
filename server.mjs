import express from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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

// ── BAFE Response Cache (24h TTL) ────────────────────────────────────
const bafeCache = new Map(); // key → { body, contentType, status, timestamp }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return String(h);
}

// Evict expired entries every hour
setInterval(() => {
  const now = Date.now();
  let evicted = 0;
  for (const [key, entry] of bafeCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      bafeCache.delete(key);
      evicted++;
    }
  }
  if (evicted > 0) console.log(`[cache] evicted ${evicted} expired entries, ${bafeCache.size} remaining`);
}, 60 * 60 * 1000);

// ── Retry + Timeout constants ────────────────────────────────────────
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 200;
const FETCH_TIMEOUT_MS = 10_000;

// ── Proxy with fallback chain + cache + retry + timeout ──────────────
async function proxyToBafeWithFallback(targetUrls, req, res) {
  const reqBody = req.method === "GET" ? undefined : req.body;
  // Use first URL as canonical key (same request body → same result regardless of URL)
  const key = cacheKey(req.method, targetUrls[0], reqBody);

  // Check cache
  const cached = bafeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[cache] HIT for ${req.method} ${targetUrls[0]}`);
    return res.status(cached.status).set("Content-Type", cached.contentType).send(cached.body);
  }
  console.log(`[cache] MISS for ${req.method} ${targetUrls[0]}`);

  let lastResponse = null;

  for (const targetUrl of targetUrls) {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      console.log(`[proxy] trying ${req.method} ${targetUrl} (attempt ${attempt}/${RETRY_ATTEMPTS})`);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const upstream = await fetch(targetUrl, {
          method: req.method,
          headers: { "Content-Type": "application/json" },
          body: reqBody != null ? JSON.stringify(reqBody) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const contentType = upstream.headers.get("content-type") || "application/json";
        const body = await upstream.text();

        if (upstream.ok) {
          // Cache successful response
          bafeCache.set(key, { body, contentType, status: upstream.status, timestamp: Date.now() });
          console.log(`[cache] STORED for ${req.method} ${targetUrls[0]} (cache size: ${bafeCache.size})`);
          return res.status(upstream.status).set("Content-Type", contentType).send(body);
        }

        // Don't retry 4xx (client errors) — break to next URL
        if (upstream.status >= 400 && upstream.status < 500) {
          if (upstream.status === 404) {
            console.warn(`[proxy] 404 at ${targetUrl}: ${body.slice(0, 200)}`);
          } else {
            console.error(`[proxy] → ${upstream.status}  body: ${body.slice(0, 300)}`);
          }
          lastResponse = { status: upstream.status, body, contentType };
          break; // skip retries for 4xx, try next URL
        }

        // 5xx — retry with backoff
        console.warn(`[proxy] ${upstream.status} at ${targetUrl}, retrying...`);
        lastResponse = { status: upstream.status, body, contentType };
        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt - 1)));
        }
      } catch (err) {
        const isTimeout = err.name === "AbortError";
        console.error(`[proxy] ${isTimeout ? "timeout" : "network error"} on ${targetUrl}:`, err.message);
        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt - 1)));
        }
      }
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
    cache: {
      size: bafeCache.size,
      ttl_hours: CACHE_TTL / (60 * 60 * 1000),
    },
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

// ── Stripe ───────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ── GET /api/profile/:userId — ElevenLabs Custom Tool endpoint ──────
app.get("/api/profile/:userId", async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  console.log(`[profile] auth check — received: "${token.slice(0, 12)}…" expected: "${(ELEVENLABS_TOOL_SECRET || "").slice(0, 12)}…" match: ${token === ELEVENLABS_TOOL_SECRET}`);

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

// ── Stripe: Create Checkout Session ──────────────────────────────────
app.post("/api/checkout", express.json(), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payment not configured" });

  const { userId, userEmail } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      customer_email: userEmail,
      success_url: `${process.env.APP_URL || req.headers.origin}?upgrade=success`,
      cancel_url: `${process.env.APP_URL || req.headers.origin}?upgrade=cancelled`,
      metadata: { userId },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe] Checkout error:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ── Stripe: Webhook (raw body required for signature verification) ───
app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(503).end();

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe] Webhook sig error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (userId && supabaseServer) {
      const { error } = await supabaseServer
        .from("profiles")
        .update({
          tier: "premium",
          stripe_customer_id: session.customer,
          stripe_payment_id: session.payment_intent,
        })
        .eq("id", userId);

      if (error) console.error("[Stripe] Profile update failed:", error);
      else console.log(`[Stripe] User ${userId} upgraded to premium`);
    }
  }

  res.json({ received: true });
});

// ── Share URL ────────────────────────────────────────────────────────
app.post("/api/share", express.json(), async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const hash = crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12);

  const { data: profile } = await supabaseServer
    .from("astro_profiles")
    .select("sun_sign, moon_sign, asc_sign")
    .eq("user_id", userId)
    .single();

  if (!profile) return res.status(404).json({ error: "No profile found" });

  res.json({
    shareUrl: `${process.env.APP_URL || req.headers.origin}/share/${hash}`,
    hash,
    profile: {
      sun_sign: profile.sun_sign,
      moon_sign: profile.moon_sign,
      asc_sign: profile.asc_sign,
    },
  });
});

// Public share page — serve the SPA so client-side handles /share/:hash
app.get("/share/:hash", async (_req, res) => {
  const html = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
  res.send(html);
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
