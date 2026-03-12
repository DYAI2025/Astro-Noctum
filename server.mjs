import express from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ── Boot-time env var validation ─────────────────────────────────────
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[server] Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}

const OPTIONAL_ENV_VARS = ['GEMINI_API_KEY', 'ELEVENLABS_TOOL_SECRET'];
for (const v of OPTIONAL_ENV_VARS) {
  if (!process.env[v]) {
    console.warn(`[server] Optional env var not set: ${v} (some features may be degraded)`);
  }
}

// ── Gemini client (server-side only — key never reaches browser) ──────
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function buildGeminiPrompt(data, lang) {
  const l = lang === 'de' ? 'German' : 'English';
  const you = lang === 'de' ? 'du' : 'you';
  return `
You are Bazodiac's fusion astrologer — the ONLY system that synthesizes Western astrology, Chinese BaZi, and Wu-Xing Five Elements into one unified reading.

BIRTH DATA (JSON):
${JSON.stringify(data, null, 2)}

TASK: Generate a deeply personal ${l} horoscope. Address the reader as "${you}". Respond with VALID JSON only — no markdown fences, no commentary outside the JSON.

OUTPUT FORMAT (strict JSON):
{
  "interpretation": "5 paragraphs, 400-500 words, Markdown formatted. Structure: 1) Cosmic Identity (Sun sign + Day Master), 2) Emotional Depths (Moon + BaZi pillars + dominant element), 3) Fusion Revelation (unique Western+BaZi+WuXing intersection), 4) WuXing Balance (element strengths/weaknesses + Ascendant + life recommendation), 5) Path Forward (synthesis + closing).",
  "tiles": {
    "sun": "2-3 sentences about this specific Sun sign personality in context of the full chart. Reference element and ruling planet.",
    "moon": "2-3 sentences about this specific Moon sign emotional nature in context of the full chart.",
    "yearAnimal": "2-3 sentences about the specific BaZi year animal + element combination and what it reveals about character.",
    "dominantWuXing": "2-3 sentences about the dominant Wu-Xing element and how it shapes this person's energy.",
    "dayMaster": "2-3 sentences about the Heavenly Stem Day Master and what it says about core vitality."
  },
  "houses": {
    "1": "2-3 sentences: what this specific zodiac sign in the 1st house means for this person's self-image and appearance.",
    "2": "2-3 sentences: what this sign in the 2nd house means for values and finances.",
    "3": "2-3 sentences: what this sign in the 3rd house means for communication.",
    "4": "2-3 sentences: what this sign in the 4th house means for home and roots.",
    "5": "2-3 sentences: what this sign in the 5th house means for creativity and romance.",
    "6": "2-3 sentences: what this sign in the 6th house means for health and daily routines.",
    "7": "2-3 sentences: what this sign in the 7th house means for partnerships.",
    "8": "2-3 sentences: what this sign in the 8th house means for transformation.",
    "9": "2-3 sentences: what this sign in the 9th house means for philosophy and travel.",
    "10": "2-3 sentences: what this sign in the 10th house means for career and public image.",
    "11": "2-3 sentences: what this sign in the 11th house means for friendships and ideals.",
    "12": "2-3 sentences: what this sign in the 12th house means for the subconscious and spirituality."
  }
}

RULES:
- Every text MUST reference specific data from the birth chart — never generic
- If house data is missing or empty, omit the "houses" key entirely
- Language: ALL text in ${l}
- Do NOT hallucinate data not present in the birth chart
- TONE: Warm, precise, mystical but grounded. Every sentence for THIS chart only.
`.trim();
}

// ── Security Headers ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "blob:",
        "https://maps.googleapis.com", 
        "https://elevenlabs.io", 
        "https://*.elevenlabs.io",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://www.googletagmanager.com",
        "https://pagead2.googlesyndication.com",
        "https://*.adtrafficquality.google"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://generativelanguage.googleapis.com", "https://bafe-production.up.railway.app", "https://bafe.vercel.app", "https://maps.googleapis.com", "https://elevenlabs.io", "https://*.elevenlabs.io", "wss://elevenlabs.io", "wss://*.elevenlabs.io", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googlesyndication.com", "https://pagead2.googlesyndication.com", "https://*.adtrafficquality.google", "https://www.googletagmanager.com"],
      frameSrc: ["'self'", "https://elevenlabs.io", "https://*.elevenlabs.io", "https://checkout.stripe.com", "https://pagead2.googlesyndication.com", "https://googleads.g.doubleclick.net"],
      mediaSrc: ["'self'", "blob:", "https://elevenlabs.io", "https://*.elevenlabs.io"],
      workerSrc: ["'self'", "blob:", "https://elevenlabs.io", "https://*.elevenlabs.io", "https://unpkg.com"],
      workletSrc: ["'self'", "blob:", "data:", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://elevenlabs.io", "https://*.elevenlabs.io"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for external resources
}));

// ── Rate Limiting ────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // strict limit on auth-adjacent endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});
app.use("/api/checkout", authLimiter);

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

// Railway Public Domain fallback for APP_URL
const APP_URL = stripTrailingSlash(
  process.env.APP_URL || 
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "https://bazodiac.com")
);

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
  // Collect expired keys first, then delete — avoids mutating the Map mid-iteration.
  const expired = [...bafeCache.entries()]
    .filter(([, entry]) => now - entry.timestamp > CACHE_TTL)
    .map(([key]) => key);
  expired.forEach(key => bafeCache.delete(key));
  if (expired.length > 0) console.log(`[cache] evicted ${expired.length} expired entries, ${bafeCache.size} remaining`);
}, 60 * 60 * 1000);

// ── Retry + Timeout constants ────────────────────────────────────────
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 200;
const FETCH_TIMEOUT_MS = 10_000;
const SPACE_WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

let spaceWeatherCache = null;

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

function bafeFallbackUrlsFromCandidates(routeCandidates) {
  const urls = [];
  for (const routePath of routeCandidates) {
    if (BAFE_INTERNAL_URL) urls.push(`${BAFE_INTERNAL_URL}${routePath}`);
    urls.push(`${BAFE_PUBLIC_URL}${routePath}`);
  }
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

// ── /api/transit-state/:userId ───────────────────────────────────────
app.get("/api/transit-state/:userId", (req, res) => {
  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const normalizeElementValue = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return clamp01(n > 1 ? n / 100 : n);
  };
  const hashToUnit = (seed) => {
    const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
    const int = parseInt(hex, 16);
    return (int % 1000) / 1000;
  };
  const fallbackStateFromProfile = (userId, profile) => {
    const astro = profile?.astro_json ?? {};
    const wuxing = astro?.wuxing ?? {};

    const rawElements = Object.values(
      wuxing?.element_percentages || wuxing?.balance || {},
    )
      .map(normalizeElementValue)
      .filter((v) => v != null);

    const baseFromElements = rawElements.length > 0
      ? Array.from({ length: 12 }, (_, i) => rawElements[i % rawElements.length])
      : null;

    const baseFromHash = Array.from({ length: 12 }, (_, i) => {
      const u = hashToUnit(`${userId}:${profile?.sun_sign || ""}:${profile?.moon_sign || ""}:${i}`);
      // Stable pseudo profile between 0.25 and 0.75
      return 0.25 + u * 0.5;
    });

    const soulprint = (baseFromElements ?? baseFromHash).map(clamp01);
    const ring = soulprint.map((value, i) => {
      const drift = (hashToUnit(`${userId}:drift:${i}`) - 0.5) * 0.12;
      return clamp01(value + drift);
    });

    return {
      ring: { sectors: ring },
      soulprint: { sectors: soulprint },
      transit_contribution: { transit_intensity: 0.35 },
      delta: { vs_30day_avg: { avg_sectors: soulprint } },
      events: [],
      resolution: 33,
    };
  };

  const userId = String(req.params.userId || "").trim();
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  res.set("Cache-Control", "no-store");

  const safeUserId = encodeURIComponent(userId);
  const candidates = bafeFallbackUrlsFromCandidates([
    `/api/transit-state/${safeUserId}`,
    `/transit-state/${safeUserId}`,
  ]);

  const fetchUpstreamTransit = async () => {
    let lastResponse = null;

    for (const targetUrl of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const upstream = await fetch(targetUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const contentType = upstream.headers.get("content-type") || "application/json";
        const body = await upstream.text();

        if (upstream.ok) {
          return { ok: true, status: upstream.status, contentType, body };
        }

        lastResponse = { ok: false, status: upstream.status, contentType, body, targetUrl };

        // try the next fallback endpoint on any non-2xx
        continue;
      } catch (err) {
        lastResponse = {
          ok: false,
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ error: err?.message || "network error" }),
          targetUrl,
        };
      }
    }

    return lastResponse;
  };

  const respondWithFallback = async () => {
    if (!supabaseServer) {
      return res
        .status(200)
        .set("X-Transit-Fallback", "neutral")
        .json(fallbackStateFromProfile(userId, null));
    }

    const { data: profile } = await supabaseServer
      .from("astro_profiles")
      .select("user_id, sun_sign, moon_sign, astro_json")
      .eq("user_id", userId)
      .single();

    return res
      .status(200)
      .set("X-Transit-Fallback", profile ? "profile-derived" : "neutral")
      .json(fallbackStateFromProfile(userId, profile || null));
  };

  fetchUpstreamTransit()
    .then(async (upstream) => {
      if (upstream?.ok) {
        return res
          .status(upstream.status)
          .set("Content-Type", upstream.contentType)
          .send(upstream.body);
      }

      console.warn(
        "[transit-state] upstream unavailable, serving fallback",
        upstream?.status,
        upstream?.targetUrl || "",
      );
      return respondWithFallback();
    })
    .catch(async (err) => {
      console.warn("[transit-state] unexpected failure, serving fallback:", err?.message || err);
      return respondWithFallback();
    });
});

// ── /api/space-weather ───────────────────────────────────────────────
// Primary source: NOAA SWPC (no API key required, highly reliable)
// Fallback: NASA DONKI (requires NASA_API_KEY or uses DEMO_KEY with rate limits)

async function fetchKpFromNOAA() {
  // NOAA 1-minute Kp planetary index — returns array of {time_tag, kp, estimated, noaa_scale}
  const url = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`NOAA responded with ${response.status}`);
    const records = await response.json();
    if (!Array.isArray(records) || records.length === 0) throw new Error("NOAA returned empty data");
    // Get most recent non-estimated reading, or last entry as fallback
    const real = records.filter((r) => !r.estimated).at(-1) ?? records.at(-1);
    const kpRaw = real?.kp ?? real?.kp_index ?? 0;
    const kp = Math.max(0, Math.min(9, Number.parseFloat(String(kpRaw)) || 0));
    return { kp_index: kp, source: "NOAA" };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function fetchKpFromDONKI() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const url =
    `https://api.nasa.gov/DONKI/KP?startDate=${startDate.toISOString().slice(0, 10)}` +
    `&endDate=${endDate.toISOString().slice(0, 10)}&api_key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`DONKI responded with ${response.status}`);
    const records = await response.json();
    const latest = Array.isArray(records) && records.length > 0 ? records[records.length - 1] : null;
    const kpRaw =
      latest?.kpIndex ??
      latest?.kp_index ??
      latest?.estimatedKp ??
      latest?.allKpIndex?.[latest?.allKpIndex?.length - 1]?.kpIndex ??
      0;
    const kp = Math.max(0, Math.min(9, Number.parseFloat(String(kpRaw)) || 0));
    return { kp_index: kp, source: "DONKI" };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

app.get("/api/space-weather", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=900");

  const now = Date.now();
  if (spaceWeatherCache && now - spaceWeatherCache.timestamp < SPACE_WEATHER_CACHE_TTL_MS) {
    return res.json(spaceWeatherCache.payload);
  }

  let result = null;

  // 1. Try NOAA (primary — no API key, production-grade)
  try {
    result = await fetchKpFromNOAA();
    console.log(`[space-weather] NOAA Kp=${result.kp_index}`);
  } catch (noaaErr) {
    console.warn("[space-weather] NOAA failed, trying NASA DONKI:", noaaErr?.message || noaaErr);
  }

  // 2. Try NASA DONKI (fallback)
  if (!result) {
    try {
      result = await fetchKpFromDONKI();
      console.log(`[space-weather] DONKI Kp=${result.kp_index}`);
    } catch (donkiErr) {
      console.warn("[space-weather] DONKI also failed:", donkiErr?.message || donkiErr);
    }
  }

  // 3. Serve stale cache if both fail
  if (!result && spaceWeatherCache?.payload) {
    console.warn("[space-weather] both sources failed — serving stale cache");
    return res.json(spaceWeatherCache.payload);
  }

  // 4. Neutral fallback
  if (!result) {
    console.warn("[space-weather] all sources failed — returning neutral Kp=0");
    return res.json({
      kp_index: 0,
      source: "fallback",
      fetched_at: new Date().toISOString(),
      cache_ttl_seconds: Math.round(SPACE_WEATHER_CACHE_TTL_MS / 1000),
    });
  }

  const payload = {
    ...result,
    fetched_at: new Date().toISOString(),
    cache_ttl_seconds: Math.round(SPACE_WEATHER_CACHE_TTL_MS / 1000),
  };
  spaceWeatherCache = { timestamp: now, payload };
  return res.json(payload);
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
// Only available in development — never expose internal URLs in production.
app.get("/api/debug-bafe", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
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
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
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

  // Log auth outcome only, never token values
  console.log(`[profile] auth check — match: ${!!ELEVENLABS_TOOL_SECRET && token === ELEVENLABS_TOOL_SECRET}`);

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

// ── Helper: verify Supabase JWT from Authorization header ───────────
async function verifySupabaseUser(req) {
  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt || !supabaseServer) return null;
  const { data: { user }, error } = await supabaseServer.auth.getUser(jwt);
  if (error || !user) return null;
  return user;
}

// ── Stripe: Create Checkout Session ──────────────────────────────────
// Reuses existing Stripe customer if one exists in profiles.stripe_customer_id,
// otherwise creates a new customer and saves the ID immediately.
app.post("/api/checkout", express.json(), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payment not configured" });
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });

  // Verify the caller is the authenticated user
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });

  const userId = authedUser.id;
  const userEmail = authedUser.email || req.body.userEmail;

  try {
    // Look up existing Stripe customer ID from DB
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // First checkout — create Stripe customer and persist ID
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;

      await supabaseServer
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${APP_URL}?upgrade=success`,
      cancel_url: `${APP_URL}?upgrade=cancelled`,
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
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });

  const userId = authedUser.id;

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
    shareUrl: `${APP_URL}/share/${hash}`,
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

// ── AI Interpretation proxy (Gemini key stays server-side) ───────────
app.post("/api/interpret", express.json({ limit: "50kb" }), async (req, res) => {
  const { data, lang = "en" } = req.body || {};
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "data is required" });
  }
  const safeLang = lang === "de" ? "de" : "en";
  if (!geminiClient) {
    return res.status(503).json({ error: "Interpretation service unavailable" });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await Promise.race([
      geminiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: buildGeminiPrompt(data, safeLang),
        config: { temperature: 0.75 },
      }),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('Gemini timeout')));
      }),
    ]);
    clearTimeout(timeout);
    const raw = response.text?.trim();
    if (!raw) return res.status(502).json({ error: "Empty response from AI" });

    // Try to parse as structured JSON
    try {
      const parsed = JSON.parse(raw);
      if (parsed.interpretation) {
        return res.json(parsed);
      }
    } catch {
      // Gemini returned plain text — fall back to legacy format
    }
    // Legacy fallback: return as plain text
    res.json({ text: raw });
  } catch (err) {
    console.warn("[interpret] Gemini failed:", err?.message ?? String(err));
    res.status(502).json({ error: "AI interpretation failed" });
  }
});

// ── Static files ────────────────────────────────────────────────────
app.use(express.static(distPath, { index: "index.html" }));

app.get("/fu-ring", (_req, res) => {
  const html = fs.readFileSync(path.join(distPath, "index.html"), "utf8");
  const ogHtml = html.replace(
    "<head>",
    `<head>
    <meta property="og:title" content="Mein Fu-Ring — Bazodiac" />
    <meta property="og:description" content="Dein persönliches Energieprofil als Fusionsring" />
    <meta property="og:type" content="website" />`
  );
  res.send(ogHtml);
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── POST /api/analyze/conversation — Dialogue analysis with Gemini ──────
app.post("/api/analyze/conversation", express.json(), async (req, res) => {
  if (!geminiClient) {
    return res.status(503).json({ error: "Gemini API not configured" });
  }

  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are an expert in semantic dialogue analysis using the LeanDeep framework.
      
      TASK:
      1. Separate the following dialogue into "Person A" and "Person B".
      2. For each person, identify 2-3 psychological markers from the LeanDeep framework.
      3. Calculate a "resonance score" (0.0 to 1.0) indicating the quality of alignment between speakers.
      4. Provide a 1-sentence summary of the conversation vibe.

      LEANDEEP MARKER EXAMPLES (Use these format: marker.domain.keyword):
      - marker.emotion.empathy
      - marker.freedom.independence
      - marker.love.passionate
      - marker.emotion.security
      - marker.freedom.growth
      - marker.emotion.anchor
      - marker.creative.expression
      - marker.cognition.curiosity
      
      DIALOGUE:
      ${text}

      RESPONSE FORMAT:
      Respond with VALID JSON only. No markdown fences.
      {
        "lines": [{"speaker": "Person A", "text": "..."}, ...],
        "markersA": [{"id": "marker.emotion.empathy", "weight": 0.8}],
        "markersB": [{"id": "marker.freedom.growth", "weight": 0.8}],
        "resonance": 0.75,
        "summary": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(cleanedJson);

    res.json(analysis);
  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Astro-Noctum listening on port ${port}`);
    console.log(`BAFE public  → ${BAFE_PUBLIC_URL}`);
    if (BAFE_INTERNAL_URL) console.log(`BAFE internal → ${BAFE_INTERNAL_URL}`);
  });
}

export { app };
