import express from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const DEV_ALLOWED_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

// ── Boot-time env var validation ─────────────────────────────────────
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0 && !['test', 'development'].includes(process.env.NODE_ENV)) {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[server] Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}
if (missing.length > 0) {
  console.warn(`[server] WARNING: Missing env vars (dev mode): ${missing.join(', ')}`);
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
        "https://elevenlabs.io",
        "https://*.elevenlabs.io",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://www.googletagmanager.com",
        "https://pagead2.googlesyndication.com",
        "https://*.adtrafficquality.google"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://generativelanguage.googleapis.com", "https://bafe-production.up.railway.app", "https://bafe.vercel.app", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://elevenlabs.io", "https://*.elevenlabs.io", "wss://elevenlabs.io", "wss://*.elevenlabs.io", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googlesyndication.com", "https://pagead2.googlesyndication.com", "https://*.adtrafficquality.google", "https://www.googletagmanager.com", "https://api.nasa.gov", "https://services.swpc.noaa.gov"],
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

app.use((req, res, next) => {
  const origin = req.get("origin");
  const isDevOrigin = origin && DEV_ALLOWED_ORIGIN_PATTERN.test(origin);

  if (isDevOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-App-Platform, X-App-Version, X-Device-Id",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }

  if (req.method === "OPTIONS" && isDevOrigin) {
    return res.status(204).end();
  }

  next();
});

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
app.use("/api/customer-portal", authLimiter);

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

const APP_ORIGIN = (() => {
  try {
    return new URL(APP_URL).origin.toLowerCase();
  } catch {
    return "";
  }
})();

const parseCsvSet = (value) =>
  new Set(
    String(value || "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );

const MOBILE_RETURN_ORIGINS = parseCsvSet(
  process.env.MOBILE_CHECKOUT_ALLOWED_ORIGINS || APP_ORIGIN,
);
const MOBILE_RETURN_SCHEMES = parseCsvSet(
  process.env.MOBILE_CHECKOUT_ALLOWED_SCHEMES || "bazodiac,astroio,exp",
);

const toBoolean = (value, fallback) => {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

function extractClientTelemetry(req) {
  const headerValue = (name) => {
    const raw = req.get(name);
    return typeof raw === "string" ? raw.trim().slice(0, 128) : "";
  };
  return {
    appPlatform: headerValue("X-App-Platform"),
    appVersion: headerValue("X-App-Version"),
    deviceId: headerValue("X-Device-Id"),
  };
}

function sanitizeCheckoutReturnUrl(rawUrl, fallbackUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > 1024) return fallbackUrl;

  try {
    const parsed = new URL(rawUrl.trim());
    const scheme = parsed.protocol.replace(":", "").toLowerCase();

    if ((scheme === "http" || scheme === "https") && MOBILE_RETURN_ORIGINS.has(parsed.origin.toLowerCase())) {
      return parsed.toString();
    }

    if (MOBILE_RETURN_SCHEMES.has(scheme)) {
      return parsed.toString();
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

// Primary URL for logging
const BAFE_BASE_URL = BAFE_INTERNAL_URL || BAFE_PUBLIC_URL;

// ── BAFE Response Cache (24h TTL) ────────────────────────────────────
const bafeCache = new Map(); // key → { body, contentType, status, timestamp }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cache key is intentionally NOT scoped by user — BAFE calculate endpoints
// are pure functions of birth data (deterministic, no PII in response).
// Two users with identical birth data share a cached result, which is correct.
function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
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

// ── Auth middleware — validates Supabase JWT ─────────────────────────
async function requireUserAuth(req, res, next) {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Auth service not configured" });
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    req.userId = user.id;
    next();
  } catch {
    return res.status(503).json({ error: "Auth service temporarily unavailable" });
  }
}

// ── /calculate/:endpoint  (bazi, western, fusion, wuxing, tst) ──────
const CALC_ENDPOINTS = ["bazi", "western", "fusion", "wuxing", "tst"];

app.post("/api/calculate/:endpoint", requireUserAuth, express.json(), (req, res) => {
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
app.post("/api/chart", requireUserAuth, express.json(), (req, res) => {
  proxyToBafeWithFallback(bafeFallbackUrls("/chart"), req, res);
});

app.get("/api/chart", requireUserAuth, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const suffix = `/chart${qs ? `?${qs}` : ""}`;
  proxyToBafeWithFallback(bafeFallbackUrls(suffix), req, res);
});

// ── Transit-state helpers ────────────────────────────────────────────

/** Derive 12 soulprint sectors from astro_profiles.astro_json */
function deriveSoulprintSectors(astroJson, userId) {
  const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  const wuxing = astroJson?.wuxing ?? {};
  const rawElements = Object.values(
    wuxing?.element_percentages || wuxing?.balance || {},
  )
    .map((v) => { const n = Number(v); return Number.isFinite(n) ? clamp01(n > 1 ? n / 100 : n) : null; })
    .filter((v) => v != null);

  if (rawElements.length > 0) {
    return Array.from({ length: 12 }, (_, i) => rawElements[i % rawElements.length]);
  }
  const hashToUnit = (seed) => {
    const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
    return (parseInt(hex, 16) % 1000) / 1000;
  };
  return Array.from({ length: 12 }, (_, i) =>
    0.25 + hashToUnit(`${userId}:soulprint:${i}`) * 0.5
  );
}

// ── Master Signal JS Port (Sprint 04) ────────────────────────────────

const DIMENSION_KEYS = ['passion', 'stability', 'future', 'connection', 'autonomy'];

function zeroDimensions() {
  return { passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0 };
}

function clampVector(v) {
  const out = {};
  for (const k of DIMENSION_KEYS) out[k] = Math.max(0, Math.min(1, v[k] ?? 0));
  return out;
}

function cosineSimilarity(A, B) {
  let dotProduct = 0; let normA = 0; let normB = 0;
  for (const k of DIMENSION_KEYS) {
    dotProduct += A[k] * B[k];
    normA += A[k] * A[k];
    normB += B[k] * B[k];
  }
  if (normA === 0 || normB === 0) return 0.5; // fallback for no data
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. NATAL
const ELEMENT_DIMENSION_MAP = {
  Fire:  { passion: 0.8, stability: 0.1, future: 0.2, connection: 0.3, autonomy: 0.6 },
  Earth: { passion: 0.2, stability: 0.8, future: 0.3, connection: 0.7, autonomy: 0.2 },
  Metal: { passion: 0.1, stability: 0.6, future: 0.7, connection: 0.2, autonomy: 0.5 },
  Water: { passion: 0.3, stability: 0.3, future: 0.6, connection: 0.8, autonomy: 0.3 },
  Wood:  { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.4, autonomy: 0.7 },
};

const SIGN_ELEMENT = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Metal', Libra: 'Metal', Aquarius: 'Metal',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function computeNatalDimensions(apiData) {
  let sources = 0;
  
  const signToD = (sign) => {
    if (!sign) return zeroDimensions();
    const e = SIGN_ELEMENT[sign];
    if (!e || !ELEMENT_DIMENSION_MAP[e]) return zeroDimensions();
    const aff = ELEMENT_DIMENSION_MAP[e];
    const out = zeroDimensions();
    for (const k of DIMENSION_KEYS) out[k] = aff[k] ?? 0;
    return out;
  };

  const sunD = signToD(apiData.western?.zodiac_sign);
  const moonD = signToD(apiData.western?.moon_sign);
  const ascD = signToD(apiData.western?.ascendant_sign);
  const western = zeroDimensions();
  
  const hasWestern = !!(apiData.western?.zodiac_sign || apiData.western?.moon_sign || apiData.western?.ascendant_sign);
  if (hasWestern) {
    sources++;
    for (const k of DIMENSION_KEYS) western[k] = 0.50 * sunD[k] + 0.30 * moonD[k] + 0.20 * ascD[k];
  }

  const bazi = zeroDimensions();
  const hasBazi = !!(apiData.bazi?.pillars);
  if (hasBazi) {
    sources++;
    const weights = { day: 0.40, year: 0.25, month: 0.20, hour: 0.15 };
    for (const [pillar, weight] of Object.entries(weights)) {
      const p = apiData.bazi.pillars[pillar];
      if (!p || !p.element) continue;
      const affinity = ELEMENT_DIMENSION_MAP[p.element];
      if (!affinity) continue;
      for (const k of DIMENSION_KEYS) bazi[k] += weight * (affinity[k] ?? 0);
    }
  }

  const wuxingRaw = apiData.wuxing?.elements || apiData.wuxing?.element_percentages || apiData.wuxing?.balance;
  const wuxing = zeroDimensions();
  const hasWuxing = !!wuxingRaw && Object.keys(wuxingRaw).length > 0;
  if (hasWuxing) {
    sources++;
    const total = Object.values(wuxingRaw).reduce((s, v) => s + v, 0);
    if (total > 0) {
      for (const [elem, count] of Object.entries(wuxingRaw)) {
        const ratio = count / total;
        const affinity = ELEMENT_DIMENSION_MAP[elem];
        if (!affinity) continue;
        for (const k of DIMENSION_KEYS) wuxing[k] += ratio * (affinity[k] ?? 0);
      }
    }
  }

  const dimensions = zeroDimensions();
  if (sources === 0) return dimensions;

  for (const k of DIMENSION_KEYS) {
    let sum = 0;
    if (hasWestern) sum += western[k];
    if (hasBazi) sum += bazi[k];
    if (hasWuxing) sum += wuxing[k];
    dimensions[k] = sum / sources;
  }
  return clampVector(dimensions);
}

// 2. QUIZ
const DOMAIN_DIMENSION_MAP = {
  love:       { passion: 0.5, stability: 0.1, future: 0.1, connection: 0.8, autonomy: 0.1 },
  emotion:    { passion: 0.4, stability: 0.2, future: 0.1, connection: 0.7, autonomy: 0.1 },
  eq:         { passion: 0.2, stability: 0.3, future: 0.2, connection: 0.8, autonomy: 0.2 },
  social:     { passion: 0.3, stability: 0.2, future: 0.3, connection: 0.6, autonomy: 0.3 },
  leadership: { passion: 0.3, stability: 0.3, future: 0.5, connection: 0.3, autonomy: 0.7 },
  cognition:  { passion: 0.1, stability: 0.3, future: 0.6, connection: 0.2, autonomy: 0.5 },
  skills:     { passion: 0.2, stability: 0.4, future: 0.5, connection: 0.2, autonomy: 0.5 },
  instinct:   { passion: 0.7, stability: 0.2, future: 0.1, connection: 0.3, autonomy: 0.6 },
  energy:     { passion: 0.6, stability: 0.3, future: 0.3, connection: 0.3, autonomy: 0.4 },
  creative:   { passion: 0.7, stability: 0.1, future: 0.4, connection: 0.3, autonomy: 0.6 },
  spiritual:  { passion: 0.3, stability: 0.5, future: 0.3, connection: 0.6, autonomy: 0.2 },
  flower:     { passion: 0.3, stability: 0.5, future: 0.2, connection: 0.6, autonomy: 0.2 },
  stone:      { passion: 0.2, stability: 0.6, future: 0.3, connection: 0.5, autonomy: 0.2 },
  aura:       { passion: 0.4, stability: 0.3, future: 0.3, connection: 0.6, autonomy: 0.3 },
  values:     { passion: 0.3, stability: 0.6, future: 0.5, connection: 0.4, autonomy: 0.3 },
  lifestyle:  { passion: 0.3, stability: 0.5, future: 0.4, connection: 0.4, autonomy: 0.4 },
  freedom:    { passion: 0.5, stability: 0.1, future: 0.4, connection: 0.2, autonomy: 0.8 },
};

const FALLBACK_DIMENSION = {
  passion: 0.2, stability: 0.2, future: 0.2, connection: 0.2, autonomy: 0.2,
};

function computeQuizDimensions(events) {
  if (!events || events.length === 0) return zeroDimensions();
  const accumulated = zeroDimensions();
  let totalWeight = 0;

  for (const event of events) {
    const markers = Array.isArray(event.payload?.markers) ? event.payload.markers : (event.markers || []);
    for (const marker of markers) {
      if (!marker || !marker.id) continue;
      const p = marker.id.split('.');
      const domain = p.length >= 2 ? p[1] : 'unknown';
      const affinities = DOMAIN_DIMENSION_MAP[domain] ?? FALLBACK_DIMENSION;
      const w = (marker.weight ?? 1) * (marker.evidence?.confidence ?? 0.7);
      for (const k of DIMENSION_KEYS) accumulated[k] += affinities[k] * w;
      totalWeight += w;
    }
  }
  
  if (totalWeight === 0) return zeroDimensions();
  for (const k of DIMENSION_KEYS) accumulated[k] /= totalWeight;
  return clampVector(accumulated);
}

// 3. GCB
const LIFE_STAGE_BASELINES = {
  childhood:        { passion: 0.70, stability: 0.30, future: 0.40, connection: 0.65, autonomy: 0.25 },
  adolescence:      { passion: 0.75, stability: 0.25, future: 0.55, connection: 0.60, autonomy: 0.55 },
  early_adulthood:  { passion: 0.65, stability: 0.40, future: 0.65, connection: 0.55, autonomy: 0.70 },
  mid_adulthood:    { passion: 0.52, stability: 0.61, future: 0.56, connection: 0.58, autonomy: 0.64 },
  mature_adulthood: { passion: 0.45, stability: 0.70, future: 0.45, connection: 0.65, autonomy: 0.55 },
  senior:           { passion: 0.40, stability: 0.75, future: 0.35, connection: 0.70, autonomy: 0.50 },
};

function computeGCBDimensions(birthYear) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - (birthYear || 2000);
  let stage = 'senior';
  if (age <= 12) stage = 'childhood';
  else if (age <= 19) stage = 'adolescence';
  else if (age <= 29) stage = 'early_adulthood';
  else if (age <= 44) stage = 'mid_adulthood';
  else if (age <= 59) stage = 'mature_adulthood';
  return { ...LIFE_STAGE_BASELINES[stage] };
}

// 4. RING PROJECTION
const SECTOR_AFFINITIES = [
  { primary: 'passion',    secondary: 'autonomy' },
  { primary: 'stability',  secondary: 'connection' },
  { primary: 'future',     secondary: 'autonomy' },
  { primary: 'connection', secondary: 'stability' },
  { primary: 'passion',    secondary: 'autonomy' },
  { primary: 'stability',  secondary: 'future' },
  { primary: 'connection', secondary: 'future' },
  { primary: 'passion',    secondary: 'connection' },
  { primary: 'future',     secondary: 'passion' },
  { primary: 'stability',  secondary: 'autonomy' },
  { primary: 'autonomy',   secondary: 'future' },
  { primary: 'connection', secondary: 'passion' },
];

function projectToRing(nDim, qDim, nCov = 1, qCov = 0) {
  const totalCoverage = nCov + qCov;
  const nWeight = totalCoverage > 0 ? nCov / totalCoverage : 0.5;
  const qWeight = totalCoverage > 0 ? qCov / totalCoverage : 0.5;

  const blended = zeroDimensions();
  for (const k of DIMENSION_KEYS) {
    blended[k] = (nDim[k] || 0) * nWeight + (qDim[k] || 0) * qWeight;
  }

  const sectors = [];
  for (let s = 0; s < 12; s++) {
    const { primary, secondary } = SECTOR_AFFINITIES[s];
    const value = blended[primary] * 0.65 + blended[secondary] * 0.35;
    sectors.push(Number(Math.max(0, Math.min(1, value)).toFixed(4)));
  }
  return sectors;
}

const DIMENSION_LABELS = {
  de: {
    passion: 'Leidenschaft', stability: 'Stabilität', future: 'Zukunftsorientierung',
    connection: 'Verbundenheit', autonomy: 'Autonomie',
  },
  en: {
    passion: 'Passion', stability: 'Stability', future: 'Future Orientation',
    connection: 'Connection', autonomy: 'Autonomy',
  },
};

function generateNarratives(natalDim, quizDim, gcbDim, lang = 'de') {
  const labels = DIMENSION_LABELS[lang] || DIMENSION_LABELS.en;
  
  const getTop = (dim) => {
    return Object.entries(dim)
      .sort(([, a], [, b]) => b - a)
      .map(([k]) => k)
      .slice(0, 2);
  };

  const nTop = getTop(natalDim);
  const qTop = getTop(quizDim);
  const gTop = getTop(gcbDim);
  
  const alignmentVal = cosineSimilarity(natalDim, quizDim);
  const contextFitVal = (cosineSimilarity(natalDim, gcbDim) + cosineSimilarity(quizDim, gcbDim)) / 2;

  const alignment = alignmentVal >= 0.8 ? 'hoch' : alignmentVal >= 0.5 ? 'moderat' : 'gering';
  const contextFit = contextFitVal >= 0.75 ? 'hoch' : contextFitVal >= 0.5 ? 'moderat' : 'gering';

  if (lang === 'de') {
    return {
      core_summary: `Dein integratives Profil zeigt ein Kernmuster mit Schwerpunkt auf ${labels[nTop[0]]} und ${labels[nTop[1]]}. `
        + (qTop[0] ? `Deine Selbsteinschätzung betont ${labels[qTop[0]]}. ` : '')
        + `Übereinstimmung: ${alignment}.`,
      context_summary: `Dieses Kontextmodell (evidence_mode: heuristic_v1) positioniert dich in einer Lebensphase, `
        + `die typischerweise ${labels[gTop[0]]} und ${labels[gTop[1]]} betont.`,
      integration_summary: `Die Passung zwischen Anlage und Selbstbericht ist ${alignment}. `
        + `Profil ${contextFit === 'hoch' ? 'stimmt gut' : 'weicht ab'} vom Kohortenrahmen.`
    };
  } else {
    return {
      core_summary: `Your profile shows a core pattern emphasizing ${labels[nTop[0]]} and ${labels[nTop[1]]}. `
        + (qTop[0] ? `Self-report emphasizes ${labels[qTop[0]]}. ` : '')
        + `Alignment: ${alignmentVal >= 0.8 ? 'high' : 'moderate'}.`,
      context_summary: `This context model (evidence_mode: heuristic_v1) places you in a life stage `
        + `typically emphasizing ${labels[gTop[0]]} and ${labels[gTop[1]]}.`,
      integration_summary: `The fit between disposition and self-report is ${alignmentVal >= 0.8 ? 'high' : 'moderate'}. `
        + `Profile ${contextFitVal >= 0.75 ? 'aligns well' : 'diverges'} from cohort.`
    };
  }
}

/** Merge contribution_events sector_weights into a single 12-element average */
function mergeContributions(contribs) {
  if (!contribs?.length) return Array(12).fill(0.5);
  const sum = Array(12).fill(0);
  let count = 0;
  for (const c of contribs) {
    const weights = c.payload?.sector_weights;
    if (!Array.isArray(weights) || weights.length !== 12) continue;
    for (let i = 0; i < 12; i++) sum[i] += Number(weights[i]) || 0;
    count++;
  }
  if (count === 0) return Array(12).fill(0.5);
  return sum.map((v) => Math.max(0, Math.min(1, v / count)));
}

/** Map FuFirE event format to Astro-Noctum TransitEvent schema */
function mapFufireEvent(ev, generatedAt) {
  return {
    id: `${ev.type || "event"}:${ev.sector ?? 0}:${generatedAt}`,
    type: ev.type || "resonance_jump",
    sector: ev.sector ?? 0,
    delta: [0.4, 0.25, 0.15, 0.1][Math.min((ev.priority || 1) - 1, 3)] ?? 0.1,
    trigger_planet: ev.trigger_planet || "",
    trigger_symbol: "",
    sector_domain: "",
    timestamp: Date.parse(generatedAt) || Date.now(),
  };
}

// ── /api/transit-state/:userId ───────────────────────────────────────
// POSTs to FuFirE /transit/state with soulprint + quiz sectors,
// falls back to profile-derived synthetic state on any error.
app.get("/api/transit-state/:userId", requireUserAuth, async (req, res) => {
  const userId = String(req.params.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  // Require an authenticated user and ensure they are only accessing their own state.
  const authenticatedUserId = String(req.userId || "").trim();
  if (!authenticatedUserId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (authenticatedUserId !== userId) {
    return res.status(403).json({ error: "Forbidden: cannot access another user's transit state" });
  }

  res.set("Cache-Control", "no-store");

  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const hashToUnit = (seed) => {
    const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
    return (parseInt(hex, 16) % 1000) / 1000;
  };

  const fallbackStateFromProfile = (uid, profile) => {
    const soulprint = deriveSoulprintSectors(profile?.astro_json, uid);
    const ring = soulprint.map((v, i) => {
      const drift = (hashToUnit(`${uid}:drift:${i}`) - 0.5) * 0.12;
      return clamp01(v + drift);
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

  const respondWithFallback = async (reason) => {
    let profile = null;
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer
          .from("astro_profiles")
          .select("user_id, sun_sign, moon_sign, astro_json")
          .eq("user_id", userId)
          .single();
        profile = data;
      } catch (err) {
        console.error("[transit-state] profile fallback lookup failed:", err);
        // Leave profile as null to fall back to neutral state
        profile = null;
      }
    }
    console.warn("[transit-state] fallback:", reason);
    return res
      .status(200)
      .set("X-Transit-Fallback", profile ? "profile-derived" : "neutral")
      .json(fallbackStateFromProfile(userId, profile));
  };

  try {
    if (!supabaseServer) {
      return respondWithFallback("no supabase");
    }

    // Step 1: Load user profile
    const { data: profile } = await supabaseServer
      .from("astro_profiles")
      .select("user_id, sun_sign, moon_sign, astro_json")
      .eq("user_id", userId)
      .single();

    const soulprintSectors = deriveSoulprintSectors(profile?.astro_json, userId);

    // Step 2: Load quiz contributions
    const { data: contribs } = await supabaseServer
      .from("contribution_events")
      .select("payload")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const quizSectors = mergeContributions(contribs ?? []);

    // Step 3: POST to FuFirE /transit/state
    const bafePrimaryUrl = process.env.BAFE_INTERNAL_URL
      || process.env.VITE_BAFE_BASE_URL
      || "https://bafe-production.up.railway.app";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const fufireRes = await fetch(`${bafePrimaryUrl}/transit/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soulprint_sectors: soulprintSectors,
        quiz_sectors: quizSectors,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!fufireRes.ok) {
      return respondWithFallback(`FuFirE ${fufireRes.status}`);
    }

    const fufireData = await fufireRes.json();

    // Step 4: Map response to client schema
    const generatedAt = fufireData.generated_at || new Date().toISOString();
    const resolution = Math.min(100, 33 + (contribs?.length ?? 0) * 4);

    const response = {
      ring: fufireData.ring ?? { sectors: soulprintSectors },
      soulprint: { sectors: soulprintSectors },
      transit_contribution: {
        transit_intensity: fufireData.transit_contribution?.transit_intensity ?? 0.35,
      },
      delta: {
        vs_30day_avg: {
          avg_sectors: fufireData.delta?.vs_30day_avg?.avg_sectors ?? soulprintSectors,
        },
      },
      events: (fufireData.events ?? []).map((ev) => mapFufireEvent(ev, generatedAt)),
      resolution,
    };

    return res.status(200).json(response);
  } catch (err) {
    return respondWithFallback(err?.message || "unexpected error");
  }
});

// ── /api/horoscope/daily ─────────────────────────────────────────────
// Generates or returns cached daily horoscope for a user.
// On-demand with 24h cache per user.
const horoscopeCache = new Map(); // userId:dateStr → { horoscope, timestamp }
const HOROSCOPE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Sector domain labels for template generation
const SECTOR_DOMAINS = [
  { de: 'Antrieb', en: 'Drive' },       // 0 Aries
  { de: 'Stabilität', en: 'Stability' }, // 1 Taurus
  { de: 'Kommunikation', en: 'Communication' }, // 2 Gemini
  { de: 'Geborgenheit', en: 'Nurture' }, // 3 Cancer
  { de: 'Ausdruck', en: 'Expression' },  // 4 Leo
  { de: 'Ordnung', en: 'Order' },        // 5 Virgo
  { de: 'Balance', en: 'Balance' },      // 6 Libra
  { de: 'Tiefe', en: 'Depth' },          // 7 Scorpio
  { de: 'Expansion', en: 'Expansion' },  // 8 Sagittarius
  { de: 'Struktur', en: 'Structure' },   // 9 Capricorn
  { de: 'Freiheit', en: 'Freedom' },     // 10 Aquarius
  { de: 'Intuition', en: 'Intuition' },  // 11 Pisces
];

// Template sets for server-side generation
const HOROSCOPE_TEMPLATES = {
  de: {
    high: {
      headlines: [
        'Dein {domain}-Feld flammt heute besonders.',
        'Heute pulsiert dein {domain}-Bereich mit ungewöhnlicher Intensität.',
      ],
      bodies: [
        'Die Energie in deinem {domain}-Feld ist heute deutlich spürbar. Das ist kein Zufall — dein Profil zeigt hier eine natürliche Empfänglichkeit, die heute besonders aktiviert wird.',
        'Dein {domain}-Sektor reagiert heute auf eine starke kosmische Bewegung. Diese Resonanz ist ein Hinweis darauf, dass sich etwas in diesem Bereich deines Lebens bewegen möchte.',
      ],
      advices: [
        'Lass diese Energie fließen, ohne sie kontrollieren zu wollen.',
        'Nimm wahr, was sich heute in diesem Feld bewegt — ohne Bewertung.',
      ],
    },
    moderate: {
      headlines: ['Leichte Bewegung in deinem {domain}-Feld.', 'Dein {domain}-Bereich zeigt heute sanfte Aktivität.'],
      bodies: [
        'Heute zeigt sich eine moderate Bewegung in deinem {domain}-Feld. Es ist weniger ein Signal zum Handeln als eine Einladung zum Wahrnehmen.',
      ],
      advices: ['Beobachte, was heute in diesem Bereich lebendig wird.'],
    },
    calm: {
      headlines: ['Ein ruhiger Tag für dein kosmisches Feld.', 'Heute liegt Stille über deinem Ring.'],
      bodies: [
        'Heute zeigen sich keine starken Transit-Signale in deinem Profil. Das bedeutet nicht Stillstand, sondern Raum für Integration und Vertiefung.',
      ],
      advices: ['Ruhetage sind keine verlorenen Tage — sie sind Integrationszeit.'],
    },
  },
  en: {
    high: {
      headlines: ['Your {domain} field is especially active today.', 'Today pulses with unusual intensity in your {domain} area.'],
      bodies: [
        'The energy in your {domain} field is clearly perceptible today. This is no coincidence — your profile shows a natural receptivity here that is especially activated today.',
      ],
      advices: ['Let this energy flow without trying to control it.'],
    },
    moderate: {
      headlines: ['Gentle movement in your {domain} field.'],
      bodies: ['Today shows moderate movement in your {domain} field. It\'s less a signal to act and more an invitation to notice.'],
      advices: ['Observe what comes alive in this area today.'],
    },
    calm: {
      headlines: ['A quiet day for your cosmic field.'],
      bodies: ['Today shows no strong transit signals in your profile. This doesn\'t mean stagnation, but space for integration and deepening.'],
      advices: ['Rest days aren\'t lost days — they\'re integration time.'],
    },
  },
};

function deterministicIndex(dateStr, sector, max) {
  let hash = 0;
  const seed = `${dateStr}:${sector}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % max;
}

app.get("/api/horoscope/daily/:userId", async (req, res) => {
  const userId = String(req.params.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const lang = req.query.lang === "en" ? "en" : "de";
  const dateStr = new Date().toISOString().slice(0, 10);
  const cacheKeyH = `${userId}:${dateStr}`;

  // Check cache
  const cached = horoscopeCache.get(cacheKeyH);
  if (cached && Date.now() - cached.timestamp < HOROSCOPE_CACHE_TTL) {
    return res.status(200).json(cached.horoscope);
  }

  try {
    // Fetch transit data (reuse existing transit-state logic)
    let transitSectors = Array(12).fill(0.35);
    let transitIntensity = 0.35;
    let events = [];

    if (supabaseServer) {
      const { data: profile } = await supabaseServer
        .from("astro_profiles")
        .select("user_id, astro_json")
        .eq("user_id", userId)
        .single();

      const soulprintSectors = deriveSoulprintSectors(profile?.astro_json, userId);

      try {
        const bafePrimaryUrl = process.env.BAFE_INTERNAL_URL
          || process.env.VITE_BAFE_BASE_URL
          || "https://bafe-production.up.railway.app";

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const fufireRes = await fetch(`${bafePrimaryUrl}/transit/state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soulprint_sectors: soulprintSectors, quiz_sectors: Array(12).fill(0.5) }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (fufireRes.ok) {
          const fufireData = await fufireRes.json();
          transitSectors = fufireData.transit_contribution?.sectors ?? soulprintSectors;
          transitIntensity = fufireData.transit_contribution?.transit_intensity ?? 0.35;
          events = (fufireData.events ?? []).map(ev => ({
            type: ev.type || "resonance_jump",
            sector: ev.sector ?? 0,
            priority: ev.priority ?? 30,
            trigger_planet: ev.trigger_planet || "",
            description_de: ev.description_de || "",
          }));
        }
      } catch { /* use defaults */ }
    }

    // Compute sector impacts
    const sectorImpacts = transitSectors.map((s, i) => ({
      sector: i,
      intensity: Math.min(1, s),
      impact: Math.min(1, s * (0.3 + Math.random() * 0.2)), // slight personalization
    }));

    const sorted = [...sectorImpacts].sort((a, b) => b.impact - a.impact);
    const primary = sorted[0];
    const maxImpact = primary.impact;

    const tier = maxImpact >= 0.5 ? "high" : maxImpact >= 0.2 ? "moderate" : "calm";
    const templates = HOROSCOPE_TEMPLATES[lang][tier];
    const domain = SECTOR_DOMAINS[primary.sector % 12][lang];

    const hi = deterministicIndex(dateStr, primary.sector, templates.headlines.length);
    const bi = deterministicIndex(dateStr, primary.sector + 100, templates.bodies.length);
    const ai = deterministicIndex(dateStr, primary.sector + 200, templates.advices.length);

    const headline = templates.headlines[hi].replace(/\{domain\}/g, domain);
    const body = templates.bodies[bi].replace(/\{domain\}/g, domain);
    const advice = templates.advices[ai];

    const pushworthy = events.some(e => e.priority >= 60) || maxImpact >= 0.6;
    const activeSectors = sorted.filter(s => s.impact > 0.2).map(s => s.sector);

    const horoscope = {
      headline,
      body,
      advice,
      pushworthy,
      push_text: pushworthy ? headline : undefined,
      active_sectors: activeSectors,
      ring_effects: sorted.slice(0, 3).map(s => ({
        sector: s.sector,
        intensity: s.impact,
        type: s.impact >= 0.6 ? "pulse" : s.impact >= 0.4 ? "glow" : "highlight",
      })),
      tier: "freemium",
      generated_at: new Date().toISOString(),
      transit_intensity: transitIntensity,
      evidence_mode: "heuristic_v1",
    };

    // Cache result
    horoscopeCache.set(cacheKeyH, { horoscope, timestamp: Date.now() });

    return res.status(200).json(horoscope);
  } catch (err) {
    console.error("[horoscope] error:", err?.message || err);
    return res.status(500).json({ error: "Horoscope generation failed" });
  }
});

// Evict expired horoscope cache entries hourly
setInterval(() => {
  const now = Date.now();
  const expired = [...horoscopeCache.entries()]
    .filter(([, entry]) => now - entry.timestamp > HOROSCOPE_CACHE_TTL)
    .map(([key]) => key);
  expired.forEach(key => horoscopeCache.delete(key));
  if (expired.length > 0) console.log(`[horoscope-cache] evicted ${expired.length} entries`);
}, 60 * 60 * 1000);

// ── Experience API proxy ──────────────────────────────────────────
app.post('/api/experience/bootstrap', requireUserAuth, express.json(), async (req, res) => {
  try {
    const { birth } = req.body;
    if (!birth) return res.status(400).json({ error: 'Missing birth data' });

    // 1. Fetch Natal Chart from BAFE
    const bafeRes = await fetch(`${BAFE_BASE_URL}/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: birth.date,
        birthTime: birth.time,
        lat: birth.lat,
        lng: birth.lon,
        timeZone: birth.tz
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!bafeRes.ok) {
        throw new Error(`BAFE responded with ${bafeRes.status}`);
    }
    const bafeData = await bafeRes.json();

    // 2. Compute Master Signal (N + G)
    const birthYear = parseInt(birth.date.substring(0, 4), 10);
    const nDim = computeNatalDimensions(bafeData);
    const qDim = zeroDimensions(); // No quiz yet
    const gcbDim = computeGCBDimensions(birthYear);

    // 3. Project to Ring (Initial Soulprint)
    const soulprintSectors = projectToRing(nDim, qDim, 1, 0);

    const narratives = generateNarratives(nDim, qDim, gcbDim, req.query.lang === 'en' ? 'en' : 'de');

    // 4. Generate Blueprint
    const signatureSeed = crypto.createHash('sha256').update(req.userId + Date.now().toString()).digest('hex').substring(0, 16);

    const profileData = {
      sun_sign: bafeData.western?.zodiac_sign || "Unknown",
      moon_sign: bafeData.western?.moon_sign || "Unknown",
      ascendant_sign: bafeData.western?.ascendant_sign || "Unknown",
      day_master: bafeData.bazi?.day_master || "Unknown",
      harmony_index: bafeData.fusion?.harmony_index || 0.8
    };

    const responsePayload = {
      profile: profileData,
      soulprint_sectors: soulprintSectors,
      narratives: narratives,
      signature_blueprint: {
        seed: signatureSeed,
        visual: { symmetry: 0.5, curvature: 0.5, angularity: 0.5, density: 0.5, contrast: 0.5, orbit_count: 5 }
      },
      meta: { engine_version: "master_signal_v1_js", generated_at: new Date().toISOString() }
    };

    // 5. Save to Supabase
    if (supabaseServer) {
        const { error: updateError } = await supabaseServer.from("astro_profiles").update({ 
            soulprint_sectors: soulprintSectors 
        }).eq("user_id", req.userId);
        
        if (updateError) console.warn("[bootstrap] failed to save soulprint_sectors:", updateError.message);
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('[experience/bootstrap] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

app.post('/api/experience/signature-delta', requireUserAuth, express.json(), async (req, res) => {
  try {
    const { quiz_answer, signature_blueprint } = req.body;
    if (!quiz_answer) return res.status(400).json({ error: "Missing quiz_answer" });

    // 1. Compute Quiz dimensions
    // We expect quiz_answer to be an array of markers [{id, weight}]
    const quizEvents = [{ payload: { markers: Array.isArray(quiz_answer) ? quiz_answer : [] } }];
    const qDim = computeQuizDimensions(quizEvents);

    // 2. Get Natal dimensions (from profile)
    let nDim = zeroDimensions();
    if (supabaseServer) {
        const { data: profile } = await supabaseServer.from("astro_profiles").select("astro_json").eq("user_id", req.userId).single();
        if (profile?.astro_json) {
            nDim = computeNatalDimensions(profile.astro_json);
        }
    }

    // 3. Blended projection
    const newSectors = projectToRing(nDim, qDim, 1, 1); // 50/50 blend for delta show
    const alignment = cosineSimilarity(nDim, qDim);
    const gcbDim = computeGCBDimensions(2000); // fallback birth year or we should get it from profile
    const narratives = generateNarratives(nDim, qDim, gcbDim, req.query.lang === 'en' ? 'en' : 'de');

    const payload = {
      quiz_sectors: newSectors,
      narratives: narratives,
      signature_delta: {
        curvature: Number((0.5 + (alignment * 0.2)).toFixed(2)),
        contrast: Number((0.5 + ((1 - alignment) * 0.15)).toFixed(2)),
        density: 0.6
      },
      signature_blueprint: signature_blueprint || {
          seed: "delta_fallback",
          visual: { symmetry: 0.5, curvature: 0.5, angularity: 0.5, density: 0.5, contrast: 0.5, orbit_count: 5 }
      }
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error('[experience/signature-delta] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

app.post('/api/experience/daily', requireUserAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length > 10000) {
      return res.status(413).json({ error: 'payload_too_large' });
    }

    const { birth, target_date, locale } = req.body || {};
    if (!birth || typeof birth !== 'object') {
      return res.status(400).json({
        error: 'invalid_birth',
        message: 'Missing or invalid birth data in request body.'
      });
    }
    const { date, time, lat, lon, tz } = birth;
    if (
      typeof date !== 'string' ||
      typeof time !== 'string' ||
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      typeof tz !== 'string'
    ) {
      return res.status(400).json({
        error: 'invalid_birth',
        message: 'Birth data must include date, time, lat, lon, and tz with correct types.'
      });
    }

    const lang = locale?.startsWith('en') ? 'en' : 'de';
    const targetDate = target_date || new Date().toISOString().slice(0, 10);
    const cacheKeyD = `daily:${userId}:${targetDate}:${lang}`;

    if (horoscopeCache.has(cacheKeyD)) {
      const cached = horoscopeCache.get(cacheKeyD);
      if (Date.now() - cached.timestamp < HOROSCOPE_CACHE_TTL) {
         return res.json(cached.data);
      }
    }

    if (!geminiClient) {
      console.warn('[experience/daily] Gemini API key missing, falling back to proxy');
      const resp = await fetch(`${BAFE_BASE_URL}/experience/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: AbortSignal.timeout(20000),
      });
      const data = await resp.json();
      // Inject day_mode if FuFirE provides harmony_index but omits day_mode
      if (data?.fusion && data.fusion.harmony_index !== undefined && data.fusion.day_mode === undefined) {
        data.fusion.day_mode = data.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
      }
      return res.status(resp.status).json(data);
    }

    // Call BAFE for natal data to feed Gemini
    const bafeRes = await fetch(`${BAFE_BASE_URL}/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: birth.date,
        birthTime: birth.time,
        lat: birth.lat,
        lng: birth.lon,
        timeZone: birth.tz
      })
    });
    const bafeData = bafeRes.ok ? await bafeRes.json() : {};

    const prompt = `
You are Bazodiac's fusion astrologer.
Write a daily horoscope for today (${targetDate}) based on the user's birth chart:
${JSON.stringify(bafeData, null, 2)}

Respond with STRICT JSON matching this EXACT structure (No markdown code blocks, just raw JSON).
{
  "date": "${targetDate}",
  "western": {
    "summary": "1-2 sentences about Western transits.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution",
    "opportunity": "1 sentence opportunity",
    "evidence": { "transit_sectors": [1, 5] }
  },
  "eastern": {
    "summary": "1-2 sentences about BaZi daily energy.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution",
    "opportunity": "1 sentence opportunity",
    "evidence": { "day_master": "${bafeData?.bazi?.pillars?.day?.stem || ''}" }
  },
  "fusion": {
    "summary": "1-2 sentences synthesizing both systems for today.",
    "synthesis": "A deeper 2-3 sentence paragraph explaining the fusion.",
    "action": "One actionable advice",
    "pushworthy": true,
    "push_text": "Short push notification string",
    "harmony_index": 0.52,
    "day_mode": "trace"
  },
  "meta": { "engine_version": "v1-gemini-daily" }
}

RULES:
- Language: ${lang === 'de' ? 'German' : 'English'}
- The output MUST be valid parsing JSON.
- DO NOT wrap the response in \`\`\`json ... \`\`\`. Start directly with {.
- harmony_index: number between 0.0 and 1.0 — cosine similarity between Western and BaZi Wu-Xing vectors. 0.45 = random baseline. >= 0.50 = convergence day.
- day_mode: if harmony_index >= 0.50 set "trace" (poles converge, something happens today), else "pulse" (symmetric, calm day).
`;

    const model = geminiClient.models;
    const result = await model.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    // Normalize and validate model response text before using it.
    const rawText =
      typeof result?.text === "string"
        ? result.text
        : typeof result?.response?.text === "string"
          ? result.response.text
          : undefined;
    let jsonStr = rawText?.trim() || "";

    if (!jsonStr) {
      console.error("[experience/daily] Empty response text from model");
      return res
        .status(502)
        .json({ error: "experience_unavailable", details: "empty_model_response" });
    }

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsedData = JSON.parse(jsonStr);

    // Ensure day_mode is always present (server-side fallback computation)
    if (parsedData?.fusion && parsedData.fusion.harmony_index !== undefined && parsedData.fusion.day_mode === undefined) {
      parsedData.fusion.day_mode = parsedData.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
    }

    horoscopeCache.set(cacheKeyD, { data: parsedData, timestamp: Date.now() });

    res.status(200).json(parsedData);
  } catch (err) {
    console.error('[experience/daily] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

// ── /api/contribute ──────────────────────────────────────────────────
// Persists quiz sector weights to contribution_events table.
// Authenticated via Supabase JWT. Upserts on (user_id, module_id).
app.post("/api/contribute", express.json(), async (req, res) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  const { data: { user }, error: authErr } = await supabaseServer.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { source, sector_weights, confidence } = req.body;

  if (typeof source !== "string" || !source) {
    return res.status(400).json({ error: "Missing source" });
  }
  if (!Array.isArray(sector_weights) || sector_weights.length !== 12) {
    return res.status(400).json({ error: "sector_weights must be number[12]" });
  }
  if (sector_weights.some((v) => typeof v !== "number" || v < 0 || v > 1)) {
    return res.status(400).json({ error: "sector_weights values must be [0..1]" });
  }

  const eventId = `${source}:${user.id}:${Date.now()}`;

  const { error: insertErr } = await supabaseServer
    .from("contribution_events")
    .upsert({
      user_id: user.id,
      event_id: eventId,
      module_id: source,
      occurred_at: new Date().toISOString(),
      payload: {
        sector_weights,
        confidence: typeof confidence === "number" ? Math.max(0, Math.min(1, confidence)) : 0.7,
      },
    }, {
      onConflict: "user_id,module_id",
    });

  if (insertErr) {
    console.error("[contribute] insert error:", insertErr.message);
    return res.status(500).json({ error: "Failed to save contribution" });
  }

  return res.status(201).json({ ok: true });
});

// ── /api/space-weather ───────────────────────────────────────────────
// Primary source: NOAA SWPC — versioned adapter (v2 → v1 fallback)
// Issue #126: NOAA format change on 31.03.2026 — adapter handles both formats
// Fallback: NASA DONKI (requires NASA_API_KEY or uses DEMO_KEY with rate limits)

const NOAA_BASE = process.env.NOAA_SWPC_BASE_URL || "https://services.swpc.noaa.gov";

/**
 * Fetches a JSON endpoint with timeout guard.
 */
async function noaaFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`NOAA fetch ${res.status}: ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse Kp from NOAA planetary_k_index_1m.json.
 * Handles both v1 (kp_index, time_tag, estimated, noaa_scale)
 * and v2 (kp_value, timestamp, is_estimated, g_scale) field names.
 *
 * @param {"v1"|"v2"} version - which field names to prefer
 * @returns {{ kp: number, timestamp: string, estimated: boolean, noaaScale: string } | null}
 */
async function parseKpVersioned(version) {
  const data = await noaaFetch(`${NOAA_BASE}/json/planetary_k_index_1m.json`);
  if (!Array.isArray(data) || data.length === 0) return null;

  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    // v2 keys take precedence when version === "v2", else fall through to v1
    const kp    = version === "v2" ? (row.kp_value    ?? row.kp_index)  : row.kp_index;
    const ts    = version === "v2" ? (row.timestamp   ?? row.time_tag)  : row.time_tag;
    const est   = version === "v2" ? (row.is_estimated ?? row.estimated) : row.estimated;
    const scale = version === "v2" ? (row.g_scale     ?? row.noaa_scale) : row.noaa_scale;
    const isEstimated = est === true || est === "true";
    if (!isEstimated && kp != null) {
      return { kp: Number(kp), timestamp: ts ?? new Date().toISOString(), estimated: false, noaaScale: scale ?? "G0" };
    }
  }
  const last = data[data.length - 1];
  const kp    = version === "v2" ? (last.kp_value    ?? last.kp_index  ?? 0) : (last.kp_index ?? 0);
  const ts    = version === "v2" ? (last.timestamp   ?? last.time_tag)  : last.time_tag;
  const scale = version === "v2" ? (last.g_scale     ?? last.noaa_scale) : last.noaa_scale;
  return { kp: Number(kp), timestamp: ts ?? new Date().toISOString(), estimated: true, noaaScale: scale ?? "G0" };
}

/**
 * NOAA Kp with v2 → v1 → throw fallback chain.
 * Returns { kp_index, noaa_scale, timestamp, estimated, source, adapter_version }
 */
async function fetchKpFromNOAA() {
  let reading = null;
  let adapterVersion = "v2";

  // Try v2 field names first (new format from 31.03.2026)
  try {
    reading = await parseKpVersioned("v2");
  } catch (v2Err) {
    console.warn("[space-weather] NOAA v2 parse failed, trying v1:", v2Err?.message);
  }

  // Fallback to v1 field names if v2 returned null or threw
  if (!reading) {
    try {
      reading = await parseKpVersioned("v1");
      adapterVersion = "v1";
    } catch (v1Err) {
      throw new Error(`NOAA v1 also failed: ${v1Err?.message}`);
    }
  }

  if (!reading) throw new Error("NOAA returned empty data after v2+v1 parse");

  const kp = Math.max(0, Math.min(9, reading.kp || 0));
  return {
    kp_index: kp,
    noaa_scale: reading.noaaScale ?? "G0",
    timestamp: reading.timestamp,
    estimated: reading.estimated,
    source: "NOAA",
    adapter_version: adapterVersion,
  };
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

// ── /api/jieqi/current ──────────────────────────────────────────────
// Load Jieqi terms from a shared canonical JSON file to avoid duplication
const JIEQI_TERMS_JSON_PATH = path.join(__dirname, "src", "lib", "jieqi", "jieqi-terms.json");

/** @type {Array<{ index: number; name: string; nameDE: string; longitude: number; approxDate: string }>} */
let JIEQI_TERMS = [];

try {
  const jieqiJsonContent = fs.readFileSync(JIEQI_TERMS_JSON_PATH, "utf8");
  JIEQI_TERMS = JSON.parse(jieqiJsonContent);
} catch (error) {
  console.error("Failed to load Jieqi terms from JSON file:", error);
  // Fallback to an empty array to avoid crashing the server; callers should handle empty data.
  JIEQI_TERMS = [];
}

function computeJieqiServer() {
  const now = new Date();
  const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1;
  const d = now.getUTCDate() + now.getUTCHours() / 24 + now.getUTCMinutes() / 1440;
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
  const T = (JD - 2451545.0) / 36525;
  const Mrad = ((357.5291 + 35999.0503 * T) % 360) * Math.PI / 180;
  const C = 1.9146 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad);
  let lambda = (280.4665 + 36000.7698 * T + C) % 360;
  if (lambda < 0) lambda += 360;

  let currentIdx = 0;
  for (let i = 0; i < JIEQI_TERMS.length; i++) {
    if ((lambda - 315 + 360) % 360 >= (JIEQI_TERMS[i].longitude - 315 + 360) % 360) {
      currentIdx = i;
    }
  }
  const nextIdx = (currentIdx + 1) % JIEQI_TERMS.length;
  let degToNext = (JIEQI_TERMS[nextIdx].longitude - lambda + 360) % 360;
  if (degToNext === 0) degToNext = 360;
  const secondsToNext = Math.round((degToNext / 0.9856) * 86400);

  return {
    current: JIEQI_TERMS[currentIdx],
    next: JIEQI_TERMS[nextIdx],
    nextTransitionAt: new Date(now.getTime() + secondsToNext * 1000).toISOString(),
    secondsToNext,
    isTransitionWindow: secondsToNext < 48 * 3600,
  };
}

app.get("/api/jieqi/current", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  try {
    return res.json(computeJieqiServer());
  } catch (err) {
    console.error("[jieqi] error:", err?.message);
    return res.status(500).json({ error: "Jieqi computation failed" });
  }
});

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

// ── /api/space-weather/extended ─────────────────────────────────────
// Extended space weather: NOAA real-time + NASA DONKI events → contribution schema
let extendedWeatherCache = null;
const EXTENDED_CACHE_TTL_MS = 5 * 60 * 1000;

function classifyXray(flux) {
  if (flux >= 1e-4) return "X";
  if (flux >= 1e-5) return "M";
  if (flux >= 1e-6) return "C";
  if (flux >= 1e-7) return "B";
  return "A";
}

function estimateSolarCyclePhase(f107) {
  if (f107 >= 200) return "maximum";
  if (f107 >= 150) return "ascending";
  if (f107 >= 100) return "descending";
  return "minimum";
}

app.get("/api/space-weather/extended", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");

  const now = Date.now();
  if (extendedWeatherCache && now - extendedWeatherCache.timestamp < EXTENDED_CACHE_TTL_MS) {
    return res.json(extendedWeatherCache.payload);
  }

  // ── 1. Kp index (reuse existing helpers) ──
  let kpValue = 0;
  let kpSource = "fallback";
  try {
    const kpResult = await fetchKpFromNOAA();
    kpValue = kpResult.kp_index;
    kpSource = "NOAA";
  } catch (noaaErr) {
    console.warn("[space-weather/extended] NOAA Kp failed:", noaaErr?.message);
    try {
      const kpResult = await fetchKpFromDONKI();
      kpValue = kpResult.kp_index;
      kpSource = "DONKI";
    } catch (donkiErr) {
      console.warn("[space-weather/extended] DONKI Kp also failed:", donkiErr?.message);
    }
  }

  // ── 2. NOAA supplementary data (X-ray, Proton, F10.7) ──
  let xrayFlux = 0;
  let xrayClass = "A";
  let protonFlux = 0;
  let f107 = 0;
  let sunspotNumber = 0;

  // Use NOAA_BASE so Railway env var overrides the live endpoint for testing/staging
  const noaaFetches = [
    { name: "xray",   url: `${NOAA_BASE}/json/goes_xray_flux.json` },
    { name: "proton", url: `${NOAA_BASE}/json/goes_proton_flux.json` },
    { name: "f107",   url: `${NOAA_BASE}/json/f107_cm_flux.json` },
  ];

  const noaaResults = await Promise.allSettled(
    noaaFetches.map(async ({ name, url }) => {
      try {
        const data = await noaaFetch(url);
        return { name, data };
      } catch (err) {
        throw new Error(`${name}: ${err?.message}`);
      }
    }),
  );

  for (const result of noaaResults) {
    if (result.status !== "fulfilled") {
      console.warn("[space-weather/extended] NOAA fetch failed:", result.reason?.message);
      continue;
    }
    const { name, data } = result.value;
    try {
      if (name === "xray" && Array.isArray(data) && data.length > 0) {
        const last = data[data.length - 1];
        xrayFlux = Number.parseFloat(String(last?.flux ?? last?.observed_flux ?? 0)) || 0;
        xrayClass = classifyXray(xrayFlux);
      } else if (name === "proton" && Array.isArray(data) && data.length > 0) {
        const last = data[data.length - 1];
        protonFlux = Number.parseFloat(String(last?.flux ?? last?.observed_flux ?? 0)) || 0;
      } else if (name === "f107" && Array.isArray(data) && data.length > 0) {
        const last = data[data.length - 1];
        f107 = Number.parseFloat(String(last?.flux ?? last?.observed_flux ?? 0)) || 0;
      }
    } catch (parseErr) {
      console.warn(`[space-weather/extended] parse ${name}:`, parseErr?.message);
    }
  }

  // ── 2b. NOAA Kp forecast (3h intervals, next ~3 days) ──
  // Endpoint: noaa-planetary-k-index-forecast.json → [[time_tag, kp, observed_flag, noaa_scale], ...]
  let kpForecast3h = [];
  let noaaAdapterVersion = kpSource === "NOAA" ? "v2" : "v1"; // default; refined below
  try {
    const forecastRaw = await noaaFetch(`${NOAA_BASE}/products/noaa-planetary-k-index-forecast.json`);
    if (Array.isArray(forecastRaw)) {
      // Skip header row if present (first item is array of strings like ["time_tag","kp",...])
      const rows = typeof forecastRaw[0]?.[0] === "string" && Number.isNaN(Number(forecastRaw[0]?.[1]))
        ? forecastRaw.slice(1)
        : forecastRaw;
      const nowMs = Date.now();
      kpForecast3h = rows
        .filter((row) => {
          const ts = new Date(row[0]).getTime();
          return !Number.isNaN(ts) && ts > nowMs;
        })
        .slice(0, 24) // next 72h at 3h intervals
        .map((row) => ({
          timestamp: row[0],
          kp: Math.max(0, Math.min(9, Number.parseFloat(String(row[1])) || 0)),
          noaaScale: String(row[3] ?? "G0"),
        }));
    }
  } catch (fcErr) {
    console.warn("[space-weather/extended] Kp forecast fetch failed:", fcErr?.message);
  }

  // ── 3. NASA DONKI extended events (CME, WSA-ENLIL, SEP, HSS, notifications) ──
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const donkiFetches = [
    { name: "cme", url: `https://api.nasa.gov/DONKI/CMEAnalysis?startDate=${startStr}&endDate=${endStr}&mostAccurateOnly=true&api_key=${apiKey}` },
    { name: "wsa", url: `https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}` },
    { name: "sep", url: `https://api.nasa.gov/DONKI/SEP?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}` },
    { name: "hss", url: `https://api.nasa.gov/DONKI/HSS?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}` },
    { name: "notifications", url: `https://api.nasa.gov/DONKI/notifications?startDate=${startStr}&endDate=${endStr}&type=all&api_key=${apiKey}` },
  ];

  const donkiResults = await Promise.allSettled(
    donkiFetches.map(async ({ name, url }) => {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
        const data = await response.json();
        return { name, data };
      } catch (err) {
        throw new Error(`${name}: ${err?.message}`);
      }
    }),
  );

  const events = [];
  const alerts = [];
  const nowISO = new Date().toISOString();

  for (const result of donkiResults) {
    if (result.status !== "fulfilled") {
      console.warn("[space-weather/extended] DONKI fetch failed:", result.reason?.message);
      continue;
    }
    const { name, data } = result.value;
    try {
      if (name === "cme" && Array.isArray(data)) {
        // Filter earthbound CMEs
        for (const cme of data) {
          const enlilList = cme?.cmeAnalyses?.flatMap((a) => a?.enlilList ?? []) ?? [];
          const earthTargeted = enlilList.some((e) => e?.isEarthTargeted);
          if (!earthTargeted) continue;

          const speed = Number.parseFloat(String(cme?.speed ?? 0)) || 0;
          let severity = "G1";
          let weight = 0.15;
          if (speed >= 1500) { severity = "G5"; weight = 0.5; }
          else if (speed >= 1000) { severity = "G3"; weight = 0.35; }
          else if (speed >= 700) { severity = "G2"; weight = 0.25; }

          const startedAt = cme?.startTime || cme?.time21_5 || nowISO;
          // CME effects last ~48h
          const expiresAt = new Date(new Date(startedAt).getTime() + 48 * 60 * 60 * 1000).toISOString();

          events.push({
            schema: "sp.contribution.v1",
            event_id: `cme:${cme?.activityID || Date.now()}`,
            type: "cme_arrival",
            severity,
            signature_weight: Math.min(0.5, weight),
            source_event_id: cme?.activityID,
            started_at: startedAt,
            expires_at: expiresAt,
            description: `Earthbound CME, speed ${speed} km/s`,
          });
        }
      } else if (name === "wsa" && Array.isArray(data)) {
        // WSA-ENLIL solar wind simulations — earth-targeted arrivals
        for (const sim of data) {
          const impactList = Array.isArray(sim?.impactList) ? sim.impactList : [];
          const earthImpact = impactList.find((imp) =>
            (imp?.location || "").toLowerCase().includes("earth") ||
            (imp?.isEarthTargeted === true),
          );
          if (!earthImpact && !sim?.isEarthTargeted) continue;

          const arrivalTime = earthImpact?.arrivalTime || sim?.estimatedShockArrivalTime || nowISO;
          const kp180 = Number.parseFloat(String(sim?.kp_180 ?? sim?.kp_90 ?? 0)) || 0;
          let severity = "G1";
          let weight = 0.1;
          if (kp180 >= 8) { severity = "G4"; weight = 0.4; }
          else if (kp180 >= 7) { severity = "G3"; weight = 0.3; }
          else if (kp180 >= 6) { severity = "G2"; weight = 0.2; }
          else if (kp180 >= 5) { severity = "G1"; weight = 0.15; }

          const expiresAt = new Date(new Date(arrivalTime).getTime() + 36 * 60 * 60 * 1000).toISOString();
          events.push({
            schema: "sp.contribution.v1",
            event_id: `wsa:${sim?.simulationID || arrivalTime}`,
            type: "geomagnetic_storm",
            severity,
            signature_weight: Math.min(0.5, weight),
            source_event_id: sim?.simulationID,
            started_at: arrivalTime,
            expires_at: expiresAt,
            description: `WSA-ENLIL: solar wind arrival, Kp~${kp180}`,
          });
        }
      } else if (name === "sep" && Array.isArray(data)) {
        for (const sep of data) {
          const startedAt = sep?.eventTime || nowISO;
          const expiresAt = new Date(new Date(startedAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
          events.push({
            schema: "sp.contribution.v1",
            event_id: `sep:${sep?.sepID || Date.now()}`,
            type: "sep",
            severity: "S1",
            signature_weight: 0.15,
            started_at: startedAt,
            expires_at: expiresAt,
            description: sep?.instruments?.join(", ") || "Solar Energetic Particle event",
          });
        }
      } else if (name === "hss" && Array.isArray(data)) {
        for (const hss of data) {
          const startedAt = hss?.eventTime || nowISO;
          const expiresAt = new Date(new Date(startedAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
          events.push({
            schema: "sp.contribution.v1",
            event_id: `hss:${hss?.hssID || Date.now()}`,
            type: "hss",
            severity: "G1",
            signature_weight: 0.1,
            started_at: startedAt,
            expires_at: expiresAt,
            description: hss?.instruments?.join(", ") || "High Speed Stream",
          });
        }
      } else if (name === "notifications" && Array.isArray(data)) {
        const filtered = data
          .filter((n) => {
            const type = (n?.messageType || "").toLowerCase();
            return type.includes("warning") || type.includes("watch");
          })
          .slice(-5);
        for (const n of filtered) {
          const body = (n?.messageBody || n?.messageURL || "").slice(0, 200);
          if (body) alerts.push(body);
        }
      }
    } catch (parseErr) {
      console.warn(`[space-weather/extended] parse ${name}:`, parseErr?.message);
    }
  }

  // Filter events: only active (expires_at > now)
  const activeEvents = events.filter((e) => e.expires_at > nowISO);

  const payload = {
    current: {
      kp: kpValue,
      kpForecast3h,
      xrayFlux,
      xrayClass,
      protonFlux,
    },
    events: activeEvents,
    alerts,
    epoch: {
      sunspotNumber,
      f107,
      solarCyclePhase: estimateSolarCyclePhase(f107),
    },
    meta: {
      fetchedAt: new Date().toISOString(),
      noaaVersion: noaaAdapterVersion === "v2" ? "v2" : "v1",
      cacheTtlSeconds: Math.round(EXTENDED_CACHE_TTL_MS / 1000),
    },
  };

  extendedWeatherCache = { timestamp: now, payload };
  console.log(`[space-weather/extended] Kp=${kpValue} (${kpSource}), xray=${xrayClass}, events=${activeEvents.length}, f107=${f107}`);
  return res.json(payload);
});

// ── /api/space-weather/timeline ─────────────────────────────────────
let timelineCache = null;
const TIMELINE_CACHE_TTL_MS = 10 * 60 * 1000;

app.get("/api/space-weather/timeline", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=600");

  const now = Date.now();
  if (timelineCache && now - timelineCache.timestamp < TIMELINE_CACHE_TTL_MS) {
    return res.json(timelineCache.payload);
  }

  try {
    const [xrayRes, kpRes] = await Promise.allSettled([
      fetch("https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json", { signal: AbortSignal.timeout(8000) }),
      fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", { signal: AbortSignal.timeout(8000) }),
    ]);

    const xrayCurve = [];
    if (xrayRes.status === "fulfilled" && xrayRes.value.ok) {
      const xrayData = await xrayRes.value.json();
      if (Array.isArray(xrayData)) {
        for (const point of xrayData.slice(-360)) {
          if (point.time_tag && point.flux != null) {
            xrayCurve.push({ timestamp: point.time_tag, flux: point.flux });
          }
        }
      }
    }

    const kpBars = [];
    if (kpRes.status === "fulfilled" && kpRes.value.ok) {
      const kpData = await kpRes.value.json();
      if (Array.isArray(kpData)) {
        for (const row of kpData.slice(-24)) {
          if (Array.isArray(row) && row.length >= 2) {
            const kp = parseFloat(row[1]);
            if (!isNaN(kp)) {
              const noaaScale = kp >= 9 ? "G5" : kp >= 8 ? "G4" : kp >= 7 ? "G3" : kp >= 6 ? "G2" : kp >= 5 ? "G1" : "G0";
              kpBars.push({ timestamp: row[0], kp, noaaScale });
            }
          }
        }
      }
    }

    const donkiEvents = [];
    if (extendedWeatherCache?.payload?.events) {
      const allowedTimelineTypes = new Set(["flare", "cme", "cme_arrival", "kp_peak", "sep"]);
      for (const evt of extendedWeatherCache.payload.events) {
        if (!allowedTimelineTypes.has(evt.type)) continue;
        donkiEvents.push({
          id: evt.event_id,
          type: evt.type,
          timestamp: evt.started_at,
          label: evt.description || evt.type,
          intensity: evt.signature_weight,
          details: `Severity: ${evt.severity}`,
        });
      }
    }

    let enlilWindow = null;
    if (extendedWeatherCache?.payload?.events) {
      const cmeArrival = extendedWeatherCache.payload.events.find(e => e.type === "cme_arrival");
      if (cmeArrival) {
        enlilWindow = { startAt: cmeArrival.started_at, endAt: cmeArrival.expires_at };
      }
    }

    const payload = { xrayCurve, kpBars, events: donkiEvents, enlilWindow };
    timelineCache = { timestamp: now, payload };
    return res.json(payload);
  } catch (err) {
    console.error("[timeline] error:", err?.message);
    if (timelineCache?.payload) return res.json(timelineCache.payload);
    return res.status(502).json({ error: "Timeline data unavailable" });
  }
});

// ── POST /api/contribution/space-weather ────────────────────────────
// Accepts a space-weather event and converts it to 12-sector contribution
// weights, then upserts into contribution_events for the authenticated user.
app.post("/api/contribution/space-weather", express.json(), async (req, res) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  // --- auth ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseServer.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // --- body validation ---
  const { event_id, type, severity, signature_weight, started_at, expires_at } = req.body;

  if (!event_id || typeof event_id !== "string" || event_id.trim() === "") {
    return res.status(400).json({ error: "event_id must be a non-empty string" });
  }
  if (typeof signature_weight !== "number" || signature_weight < 0 || signature_weight > 0.5) {
    return res.status(400).json({ error: "signature_weight must be a number in [0, 0.5]" });
  }
  if (!expires_at) {
    return res.status(400).json({ error: "expires_at is required" });
  }

  // --- convert to 12-sector weights ---
  // Fire signs (Aries=0, Leo=4, Sagittarius=8) get a 1.2× boost
  const fireIndices = new Set([0, 4, 8]);
  const baseWeight = signature_weight;
  const sectorWeights = Array.from({ length: 12 }, (_, i) =>
    fireIndices.has(i) ? baseWeight * 1.2 : baseWeight
  );

  // --- upsert ---
  const moduleId = "space-weather:" + event_id;
  const { error: insertErr } = await supabaseServer
    .from("contribution_events")
    .upsert(
      {
        user_id: user.id,
        event_id: `sw:${event_id}:${user.id}`,
        module_id: moduleId,
        occurred_at: started_at || new Date().toISOString(),
        payload: {
          sector_weights: sectorWeights,
          confidence: Math.min(1, baseWeight * 2),
          type: type || "space_weather",
          severity: severity || "G0",
          expires_at,
        },
      },
      { onConflict: "user_id,module_id" }
    );

  if (insertErr) {
    console.error("[contribution/space-weather] upsert failed:", insertErr.message);
    return res.status(500).json({ error: "Failed to persist contribution", detail: insertErr.message });
  }

  console.log(`[contribution/space-weather] upserted module_id=${moduleId} for user=${user.id}`);
  return res.status(201).json({ ok: true, module_id: moduleId });
});

// ── /api/aurora ─────────────────────────────────────────────────────
let auroraCache = null;
const AURORA_CACHE_TTL_MS = 30 * 60 * 1000;

app.get("/api/aurora", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=1800");

  const now = Date.now();
  if (auroraCache && now - auroraCache.timestamp < AURORA_CACHE_TTL_MS) {
    return res.json(auroraCache.payload);
  }

  let currentKp = 0;
  if (extendedWeatherCache?.payload?.current?.kp) {
    currentKp = extendedWeatherCache.payload.current.kp;
  }

  let europeForecast = [];
  let gfzKp = null;

  if (currentKp >= 3) {
    try {
      const ovationRes = await fetch(
        "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
        { signal: AbortSignal.timeout(8000) }
      );
      if (ovationRes.ok) {
        const ovationData = await ovationRes.json();
        if (Array.isArray(ovationData)) {
          europeForecast = ovationData
            .filter(p => Array.isArray(p) && p.length >= 4 && p[1] >= 45 && p[1] <= 72 && p[2] >= -15 && p[2] <= 40 && p[3] > 5)
            .map(p => ({ lat: p[1], lon: p[2], probability: p[3] }))
            .slice(0, 200);
        }
      }
    } catch (err) {
      console.warn("[aurora] NOAA ovation fetch failed:", err?.message);
    }

    try {
      const gfzBase = process.env.GFZ_KP_BASE_URL || "https://www-app3.gfz-potsdam.de/kp_index/";
      const gfzRes = await fetch(`${gfzBase}Kp_ap_nowcast.txt`, { signal: AbortSignal.timeout(5000) });
      if (gfzRes.ok) {
        const text = await gfzRes.text();
        const lines = text.trim().split('\n').filter(l => !l.startsWith('#'));
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const parts = lastLine.trim().split(/\s+/);
          const kpVal = parseFloat(parts[parts.length - 2]);
          if (!isNaN(kpVal)) gfzKp = kpVal;
        }
      }
    } catch (err) {
      console.warn("[aurora] GFZ fetch failed:", err?.message);
    }
  }

  let visibilityDE = "Keine Aurora-Aktivitaet erwartet.";
  if (currentKp >= 8) visibilityDE = "Aussergewoehnlich starke Aurora — moeglicherweise bis Sueddeutschland sichtbar!";
  else if (currentKp >= 7) visibilityDE = "Starke Aurora — in Norddeutschland gut sichtbar, vereinzelt bis Mitteldeutschland.";
  else if (currentKp >= 6) visibilityDE = "Aurora moeglich — am noerdlichen Horizont in Norddeutschland sichtbar bei klarem Himmel.";
  else if (currentKp >= 5) visibilityDE = "Aurora-Aktivitaet erhoet — in Skandinavien gut sichtbar, vereinzelt in Norddeutschland.";
  else if (currentKp >= 4) visibilityDE = "Schwache Aurora — nur in hohen Breitengraden (Skandinavien) sichtbar.";

  const payload = {
    kp: currentKp,
    auroraActive: currentKp >= 5,
    europeForecast,
    gfzKp,
    visibilityDE,
    updatedAt: new Date().toISOString(),
  };

  auroraCache = { timestamp: now, payload };
  return res.json(payload);
});

// ── /api/geometry/verify ────────────────────────────────────────────
// JPL Horizons proxy for verified geometry events. 1h cache per query.
const geometryVerifyCache = new Map();
const GEOMETRY_CACHE_TTL_MS = 60 * 60 * 1000;

app.get("/api/geometry/verify", async (req, res) => {
  const { body1, body2, date } = req.query;
  if (!body1 || !body2 || !date) {
    return res.status(400).json({ error: "body1, body2, date query params required" });
  }

  const cacheKey = `${body1}-${body2}-${date}`;
  const cached = geometryVerifyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEOMETRY_CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  try {
    const jplBase = process.env.JPL_HORIZONS_BASE_URL || "https://ssd.jpl.nasa.gov/api/horizons.api";
    const params = new URLSearchParams({
      format: "json",
      COMMAND: String(body1),
      CENTER: String(body2),
      EPHEM_TYPE: "OBSERVER",
      START_TIME: String(date),
      STOP_TIME: String(date),
      STEP_SIZE: "1d",
      QUANTITIES: "1,20",
    });

    const jplRes = await fetch(`${jplBase}?${params}`, { signal: AbortSignal.timeout(15000) });
    if (!jplRes.ok) throw new Error(`JPL returned ${jplRes.status}`);
    const jplData = await jplRes.json();

    const raw = typeof jplData.result === "string" ? jplData.result.substring(0, 2000) : null;

    const payload = {
      body1,
      body2,
      date,
      raw,
      verified: raw !== null,
      source: "JPL Horizons",
    };

    geometryVerifyCache.set(cacheKey, { timestamp: Date.now(), payload });

    // Evict old entries if cache grows
    if (geometryVerifyCache.size > 100) {
      const oldest = [...geometryVerifyCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      geometryVerifyCache.delete(oldest[0][0]);
    }

    return res.json(payload);
  } catch (err) {
    console.error("[geometry/verify] JPL Horizons error:", err?.message);
    return res.status(502).json({ error: "JPL Horizons unavailable" });
  }
});

// ── /api/neo/upcoming ───────────────────────────────────────────────
let neoCache = null;
const NEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

app.get("/api/neo/upcoming", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=21600");

  const now = Date.now();
  if (neoCache && now - neoCache.timestamp < NEO_CACHE_TTL_MS) {
    return res.json(neoCache.payload);
  }

  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const neoRes = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${endDate}&api_key=${apiKey}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!neoRes.ok) throw new Error(`NeoWs returned ${neoRes.status}`);

    const neoData = await neoRes.json();
    const objects = [];
    const EARTH_RADIUS_KM = 6371;

    for (const [, dayObjects] of Object.entries(neoData.near_earth_objects || {})) {
      for (const neo of dayObjects) {
        const approach = neo.close_approach_data?.[0];
        if (!approach) continue;

        const distKm = parseFloat(approach.miss_distance?.kilometers || "0");
        objects.push({
          designation: neo.neo_reference_id || neo.id,
          name: neo.name || null,
          closeApproachDate: approach.close_approach_date_full || approach.close_approach_date,
          distanceKm: distKm,
          distanceEarthRadii: Math.round((distKm / EARTH_RADIUS_KM) * 10) / 10,
          velocityKmS: Math.round(parseFloat(approach.relative_velocity?.kilometers_per_second || "0") * 10) / 10,
          estimatedDiameterM: Math.round(
            (parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_min || "0") +
             parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_max || "0")) / 2
          ),
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid || false,
        });
      }
    }

    objects.sort((a, b) => a.distanceKm - b.distanceKm);

    const payload = {
      objects: objects.slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };

    neoCache = { timestamp: now, payload };
    return res.json(payload);
  } catch (err) {
    console.error("[neo] fetch error:", err?.message);
    if (neoCache?.payload) return res.json(neoCache.payload);
    return res.status(502).json({ error: "NEO data unavailable" });
  }
});

// ── /api/mobile/bootstrap ───────────────────────────────────────────
// Mobile clients use this endpoint to bootstrap minimum-version gating,
// feature flags, and external integration settings.
app.get("/api/mobile/bootstrap", (_req, res) => {
  const defaultSuccessUrl = `${APP_URL}?upgrade=success`;
  const defaultCancelUrl = `${APP_URL}?upgrade=cancelled`;
  const scheme = process.env.MOBILE_APP_SCHEME || "bazodiac";

  res.set("Cache-Control", "no-store");
  return res.json({
    api_version: "2026-03-13",
    server_time: new Date().toISOString(),
    min_supported_versions: {
      ios: process.env.MIN_IOS_APP_VERSION || "1.0.0",
      android: process.env.MIN_ANDROID_APP_VERSION || "1.0.0",
    },
    feature_flags: {
      quizzes_enabled: toBoolean(process.env.MOBILE_FEATURE_QUIZZES_ENABLED, true),
      wissen_enabled: toBoolean(process.env.MOBILE_FEATURE_WISSEN_ENABLED, true),
      levi_voice_enabled: toBoolean(process.env.MOBILE_FEATURE_LEVI_VOICE_ENABLED, true),
      fu_ring_native_enabled: toBoolean(process.env.MOBILE_FEATURE_FU_RING_NATIVE_ENABLED, false),
      transit_polling_enabled: toBoolean(process.env.MOBILE_FEATURE_TRANSIT_POLLING_ENABLED, true),
    },
    checkout: {
      default_success_url: defaultSuccessUrl,
      default_cancel_url: defaultCancelUrl,
      allowed_return_origins: [...MOBILE_RETURN_ORIGINS],
      allowed_return_schemes: [...MOBILE_RETURN_SCHEMES],
      app_scheme: scheme,
    },
    voice: {
      provider: "elevenlabs",
      mode: "webview",
      requires_premium: true,
      agent_id: process.env.ELEVENLABS_AGENT_ID || null,
      profile_endpoint_template: `${APP_URL}/api/profile/:userId`,
    },
  });
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
if (process.env.NODE_ENV !== "production") {
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
}

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
  ? new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY)
  : null;

if (stripe) {
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  console.log(`[stripe] initialized (${testMode ? 'TEST' : 'LIVE'} mode)`);
} else {
  console.log('[stripe] not configured — checkout will return 503');
}

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

  // ── Levi V2 Signatur Context ──────────────────────────────────────
  // Prefer the persisted soulprint_sectors column (set during bootstrap)
  // over the legacy derivation from Wu-Xing percentages.
  const soulprintSectors = Array.isArray(data.soulprint_sectors) && data.soulprint_sectors.length === 12
    ? data.soulprint_sectors
    : deriveSoulprintSectors(raw, userId);

  // Helper: compute 7-planet natal weights from a 12-sector soulprint.
  // Mirrors soulprintToNatalWeights() in signatur-bridge.ts — inlined here
  // because server.mjs cannot import TypeScript source directly.
  function computeNatalWeights(sectors) {
    if (!Array.isArray(sectors) || sectors.length === 0) return null;
    const PLANET_SECTOR_MAP = {
      Sun:     [4],        // Leo
      Moon:    [3],        // Cancer
      Mercury: [2, 5],     // Gemini, Virgo
      Venus:   [1, 6],     // Taurus, Libra
      Mars:    [0, 7],     // Aries, Scorpio
      Jupiter: [8, 11],    // Sagittarius, Pisces
      Saturn:  [9, 10],    // Capricorn, Aquarius
    };
    const weights = {};
    for (const [planet, indices] of Object.entries(PLANET_SECTOR_MAP)) {
      const avg = indices.reduce((sum, i) => sum + (sectors[i] ?? 0.5), 0) / indices.length;
      weights[planet] = Number(avg.toFixed(3));
    }
    return weights;
  }

  const natal_weights = computeNatalWeights(soulprintSectors);
  const sortedPlanets = natal_weights
    ? Object.entries(natal_weights).sort(([, a], [, b]) => b - a)
    : null;
  const dominant_planet = sortedPlanets ? sortedPlanets[0][0] : null;
  const weakest_planet = sortedPlanets ? sortedPlanets[sortedPlanets.length - 1][0] : null;
  const emergence_target = weakest_planet;

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

    // Levi V2 Signatur parameters
    soulprint_sectors: soulprintSectors,
    natal_weights,
    dominant_planet,
    weakest_planet,
    emergence_target,

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
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });

  // Verify the caller is the authenticated user
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });
  if (!stripe) return res.status(503).json({ error: "Payment not configured" });
  const stripePriceId = process.env.STRIPE_PRICE_ID;
  if (!stripePriceId) return res.status(503).json({ error: "Stripe price not configured" });

  const telemetry = extractClientTelemetry(req);
  const userId = authedUser.id;
  const userEmail = authedUser.email || req.body.userEmail;
  const platform =
    (typeof req.body?.platform === "string" ? req.body.platform : telemetry.appPlatform || "web")
      .trim()
      .toLowerCase()
      .slice(0, 24);

  const defaultSuccessUrl = `${APP_URL}?upgrade=success`;
  const defaultCancelUrl = `${APP_URL}?upgrade=cancelled`;
  const successUrl = sanitizeCheckoutReturnUrl(req.body?.successUrl, defaultSuccessUrl);
  const cancelUrl = sanitizeCheckoutReturnUrl(req.body?.cancelUrl, defaultCancelUrl);
  if (telemetry.appPlatform || telemetry.appVersion || telemetry.deviceId) {
    console.log(
      `[checkout] telemetry platform=${telemetry.appPlatform || "unknown"} version=${telemetry.appVersion || "unknown"} device=${telemetry.deviceId || "unknown"}`,
    );
  }

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
        metadata: {
          userId,
          platform,
          appVersion: telemetry.appVersion || "",
        },
      });
      customerId = customer.id;

      await supabaseServer
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId,
          platform,
        },
      },
      metadata: {
        userId,
        platform,
        appVersion: telemetry.appVersion || "",
        deviceId: telemetry.deviceId || "",
      },
    });
    res.json({
      url: session.url,
      resolved: {
        successUrl,
        cancelUrl,
      },
    });
  } catch (err) {
    console.error("[Stripe] Checkout error:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// ── Stripe: Customer Portal (manage billing) ──────────────────────────
app.post("/api/customer-portal", express.json(), async (req, res) => {
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });

  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });
  if (!stripe) return res.status(503).json({ error: "Payment not configured" });

  const returnUrl = sanitizeCheckoutReturnUrl(req.body?.returnUrl, APP_URL);

  try {
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("tier, stripe_customer_id")
      .eq("id", authedUser.id)
      .single();

    if (profileError) {
      console.error("[Stripe] Customer portal profile lookup failed:", profileError);
      return res.status(500).json({ error: "Profile lookup failed" });
    }

    if (profile?.tier !== "premium") {
      return res.status(403).json({ error: "Premium account required" });
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authedUser.email || undefined,
        metadata: {
          userId: authedUser.id,
          source: "portal-recovery",
        },
      });
      customerId = customer.id;

      const { error: customerPersistError } = await supabaseServer
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", authedUser.id);

      if (customerPersistError) {
        console.error("[Stripe] Customer portal persist failed:", customerPersistError);
        return res.status(500).json({ error: "Customer sync failed" });
      }
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({
      url: portalSession.url,
      resolved: { returnUrl },
    });
  } catch (err) {
    console.error("[Stripe] Customer portal error:", err.message);
    return res.status(500).json({ error: "Customer portal failed" });
  }
});

// ── Stripe: Webhook (raw body required for signature verification) ───
app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(503).end();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(503).json({ error: "Webhook not configured" });

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string" || !sig) {
    return res.status(400).send("Missing stripe-signature header");
  }
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe] Webhook sig error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Event: checkout completed → subscription created ──────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId && supabaseServer) {
      const { error } = await supabaseServer
        .from("profiles")
        .update({
          tier: "premium",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("id", userId);
      if (error) console.error("[Stripe] checkout.session.completed profile update failed:", error);
      else console.log(`[Stripe] User ${userId} upgraded to premium (sub: ${session.subscription})`);
    }

  // ── Event: subscription updated (renewal, plan change, cancel scheduled) ─
  } else if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const userId = sub.metadata?.userId;
    if (!userId || !supabaseServer) return res.json({ received: true });

    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    const now = new Date();
    const stillInGrace = periodEnd && new Date(periodEnd) > now;

    // Treat past_due/unpaid as premium while still within the current period.
    const isPremium =
      sub.status === "active" ||
      sub.status === "trialing" ||
      ((sub.status === "past_due" || sub.status === "unpaid") && stillInGrace);

    const { error } = await supabaseServer
      .from("profiles")
      .update({
        tier: isPremium ? "premium" : "free",
        stripe_subscription_id: sub.id,
        subscription_end: periodEnd,
      })
      .eq("stripe_customer_id", sub.customer);

    if (error) console.error("[Stripe] subscription.updated profile update failed:", error);
    else console.log(`[Stripe] Subscription ${sub.id} updated — status=${sub.status}, periodEnd=${periodEnd}`);

  // ── Event: subscription deleted (hard cancel, billing failure after retries) ─
  } else if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    // sub.current_period_end is still set — grant access until that date
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    const now = new Date();
    const stillInGrace = periodEnd && new Date(periodEnd) > now;

    const customerId =
      typeof sub.customer === "string"
        ? sub.customer
        : sub.customer && typeof sub.customer === "object"
          ? sub.customer.id
          : null;

    if (!customerId) {
      console.error("[Stripe] subscription.deleted missing customer id on subscription object");
    } else {
      const { error } = await supabaseServer
        .from("profiles")
        .update({
          tier: stillInGrace ? "premium" : "free",
          subscription_end: periodEnd,
        })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("[Stripe] subscription.deleted profile update failed:", error);
      else console.log(`[Stripe] Subscription deleted — grace until ${periodEnd}, tier=${stillInGrace ? "premium" : "free"}`);
    }
  // ── Event: invoice payment succeeded (renewal confirmed) ──────────────
  } else if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.billing_reason === "subscription_cycle" && supabaseServer) {
      const periodEnd = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;
      // Normalize customer to an ID string in case Stripe sends an expanded object
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) {
        console.error("[Stripe] invoice.payment_succeeded: missing customer ID on invoice", {
          invoiceId: invoice.id,
        });
      } else if (periodEnd) {
        const { error } = await supabaseServer
          .from("profiles")
          .update({ tier: "premium", subscription_end: periodEnd })
          .eq("stripe_customer_id", customerId);
        if (error) console.error("[Stripe] invoice.payment_succeeded update failed:", error);
        else console.log(`[Stripe] Renewal confirmed for customer ${customerId}, end=${periodEnd}`);
      }
    }

  // ── Event: invoice payment failed (hard failure) ───────────────────────
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    console.warn(`[Stripe] Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`);
    // Stripe handles retry logic. We do NOT immediately downgrade — Stripe will fire
    // subscription.updated with status=past_due, then subscription.deleted if all retries fail.

  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    console.log(`[Stripe] Checkout expired for session ${session.id}`);
  }

  res.json({ received: true });
});

// ── Share URL ────────────────────────────────────────────────────────
app.post("/api/share", express.json(), async (req, res) => {
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });

  const telemetry = extractClientTelemetry(req);
  if (telemetry.appPlatform || telemetry.appVersion || telemetry.deviceId) {
    console.log(
      `[share] telemetry platform=${telemetry.appPlatform || "unknown"} version=${telemetry.appVersion || "unknown"} device=${telemetry.deviceId || "unknown"}`,
    );
  }

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

// ── Compression ────────────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Static files ────────────────────────────────────────────────────
// Hashed assets (JS/CSS in /assets/) — immutable, cache 1 year
app.use("/assets", express.static(path.join(distPath, "assets"), {
  maxAge: "1y",
  immutable: true,
}));

// Other static files (HTML, media, icons) — short cache, revalidate
app.use(express.static(distPath, {
  index: "index.html",
  maxAge: "1h",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
}));

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
