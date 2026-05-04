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
import Stripe from 'stripe';

// Exponential-backoff fetch helper used by the bootstrap endpoint.
// Retries on network errors and 5xx responses only; 4xx is returned immediately.
async function fetchWithRetry(url, options, maxRetries = 3, baseDelayMs = 2000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        // 2xx–3xx: success; 4xx: client error, do not retry
        return res;
      }
      // 5xx: server error — fall through to retry
      lastError = new Error(`BAFE responded with ${res.status}`);
    } catch (err) {
      // Network error
      lastError = err;
    }
    if (attempt < maxRetries) {
      const delayMs = baseDelayMs * Math.pow(2, attempt); // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

const SUPERGLUE_BASE_URL = (process.env.SUPERGLUE_BASE_URL || "https://api.superglue.ai/v1").replace(/\/$/, "");
const SUPERGLUE_API_KEY = process.env.SUPERGLUE_API_KEY || null;

async function triggerBazodiacUserChart(userId, forceRecalculate = false) {
  if (!SUPERGLUE_API_KEY) {
    throw new Error("superglue_not_configured");
  }

  const hookUrl = `${SUPERGLUE_BASE_URL}/hooks/bazodiac-user-chart?token=${encodeURIComponent(SUPERGLUE_API_KEY)}`;
  const response = await fetch(hookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      force_recalculate: Boolean(forceRecalculate),
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`superglue_hook_failed:${response.status}${body ? ` ${body.slice(0, 300)}` : ""}`);
  }
}

function extractStoredChart(astroJson) {
  if (!astroJson || typeof astroJson !== "object") return null;
  const candidate = astroJson.bafe && typeof astroJson.bafe === "object" ? astroJson.bafe : astroJson;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate;
}

async function waitForStoredChart(userId, maxAttempts = 8, waitMs = 750) {
  if (!supabaseServer) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabaseServer
      .from("astro_profiles")
      .select("sun_sign, moon_sign, asc_sign, astro_json")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const storedChart = extractStoredChart(data.astro_json);
      const hasCoreFields = !!(data.sun_sign && data.moon_sign && data.asc_sign);
      if (storedChart && hasCoreFields) {
        return { row: data, chart: storedChart };
      }
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return null;
}

/**
 * Persists soulprint_sectors to astro_profiles via upsert and returns { saved: boolean }.
 *
 * Uses upsert (not update) because the astro_profiles row may not exist yet at
 * bootstrap time: the Superglue worker writes astro_json asynchronously outside
 * the request lifecycle, so the row is often created *after* we've already
 * fallen back to the direct BAFE call and tried to persist the soulprint.
 * A plain .update() returns 0 rows affected in that race and soulprint_sectors
 * stays NULL forever for that user — confirmed on prod 2026-04-18 (all users NULL).
 *
 * See DEC-synthetic-soulprint-fallback: when this column is NULL the frontend
 * derives a sign-based synthetic soulprint, but the authoritative computation
 * must still land here so downstream consumers see the real value.
 *
 * @param {any} client — Supabase client (or null when env vars missing in tests)
 * @param {string} userId
 * @param {number[]} sectors — 12-element array
 * @returns {Promise<{ saved: boolean }>}
 */
/**
 * Recomputes the 12-sector soulprint from a stored astro_json blob using
 * the same pipeline as /api/experience/bootstrap (natal dimensions + zero
 * quiz + 100/0 blend). Exported for the backfill script
 * (scripts/backfill-soulprint.mjs) that repairs existing rows where
 * soulprint_sectors is NULL from the pre-upsert race-condition window.
 *
 * @param {any} astroJson — the persisted bafeData from astro_profiles.astro_json
 * @returns {number[]} 12-element array
 */
export function recomputeSoulprintFromAstroJson(astroJson) {
  const nDim = computeNatalDimensions(astroJson);
  const qDim = zeroDimensions();
  return projectToRing(nDim, qDim, 1, 0);
}

export async function persistSoulprintSectors(client, userId, sectors) {
  if (!client) return { saved: false };
  try {
    const { data, error } = await client
      .from("astro_profiles")
      .upsert(
        { user_id: userId, soulprint_sectors: sectors },
        { onConflict: "user_id" },
      )
      .select("user_id");
    if (error) {
      console.warn("[bootstrap] soulprint save failed", error.message);
      return { saved: false };
    }
    if (Array.isArray(data) && data.length > 0) {
      return { saved: true };
    }
    console.warn("[bootstrap] soulprint save affected 0 rows for user_id", userId);
    return { saved: false };
  } catch (err) {
    console.warn("[bootstrap] soulprint save threw", err);
    return { saved: false };
  }
}

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

const OPTIONAL_ENV_VARS = ['GEMINI_API_KEY', 'ELEVENLABS_TOOL_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_BUY_ID', 'SUPERGLUE_API_KEY'];
for (const v of OPTIONAL_ENV_VARS) {
  if (!process.env[v]) {
    console.warn(`[server] Optional env var not set: ${v} (some features may be degraded)`);
  }
}

// ── Gemini client (server-side only — key never reaches browser) ──────
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// ── Stripe client (server-side only) ──────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-15' })
  : null;

if (!stripe && process.env.NODE_ENV === 'production') {
  console.warn('[server] Stripe not configured (STRIPE_SECRET_KEY missing)');
}

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
        "https://fundingchoicesmessages.google.com",
        "https://*.adtrafficquality.google"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://generativelanguage.googleapis.com", "https://bafe-production.up.railway.app", "https://bafe.vercel.app", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://elevenlabs.io", "https://*.elevenlabs.io", "wss://elevenlabs.io", "wss://*.elevenlabs.io", "wss://api.elevenlabs.io", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googlesyndication.com", "https://pagead2.googlesyndication.com", "https://fundingchoicesmessages.google.com", "https://*.adtrafficquality.google", "https://www.googletagmanager.com", "https://api.nasa.gov", "https://services.swpc.noaa.gov"],
      frameSrc: ["'self'", "https://elevenlabs.io", "https://*.elevenlabs.io", "https://checkout.stripe.com", "https://pagead2.googlesyndication.com", "https://googleads.g.doubleclick.net", "https://fundingchoicesmessages.google.com"],
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

// ── Global Body Parsing Middleware ───────────────────────────────────
// Parse JSON/urlencoded bodies for all /api/* routes.
// Exception: /api/webhook/stripe uses express.raw() for signature verification.
app.use('/api/', (req, res, next) => {
  // Skip Stripe webhook – it needs raw body
  if (req.path.startsWith('/webhook/stripe')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/webhook/stripe')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// ── Rate Limiting ────────────────────────────────────────────────────
const HIGH_FREQUENCY_API_PREFIXES = [
  "/transit-state",
  "/impact/active",
  "/experience/daily",
  "/vibes",
];

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  // app.use('/api/', ...) strips the mount path from req.path, so these
  // prefixes must be relative to /api and not include '/api'.
  skip: (req) => HIGH_FREQUENCY_API_PREFIXES.some((prefix) => req.path.startsWith(prefix)),
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
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "https://bazodiac.space")
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

/** Returns headers for direct BAFE/FuFirE fetch calls (includes X-API-Key when configured). */
function bafeDirectHeaders(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  if (process.env.BAFE_API_KEY) h["X-API-Key"] = process.env.BAFE_API_KEY;
  return h;
}

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
// Single source of truth for valid agent IDs.
// To add a 3rd agent: set AGENT_IDS=levi,eve,oracle in env (REQ-MNT-agent-extensibility).
const VALID_AGENT_TYPES = process.env.AGENT_IDS
  ? process.env.AGENT_IDS.split(',').map(s => s.trim()).filter(Boolean)
  : ['levi', 'eve'];

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 200;
const FETCH_TIMEOUT_MS = 10_000;
const SPACE_WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

let spaceWeatherCache = null;

const MAX_KP_INDEX = 9;

function deriveSolarPressureFromKp(kpLike) {
  const kp = Number(kpLike);
  if (!Number.isFinite(kp)) return 0;
  return Math.max(0, Math.min(1, kp / MAX_KP_INDEX));
}

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
          headers: bafeDirectHeaders(),
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

// ── Tier middleware ─────────────────────────────────────────────────────────
//
// attachUserTier   — fetches profiles.tier for req.userId, attaches req.userTier
//                    ('free' default). Used by endpoints that need tier info without
//                    blocking access (e.g. rate-limit differentiation).
//
// requirePremium   — chains attachUserTier then enforces tier === 'premium'.
//                    Apply after requireUserAuth on premium-gated routes.
//
// DEC-conversion-tiers: "Tier gates are enforced server-side (not just hidden in UI)"

async function attachUserTier(req, res, next) {
  if (req.userTier !== undefined) { next(); return; } // already resolved
  if (!supabaseServer) { req.userTier = 'free'; next(); return; }
  try {
    const { data } = await supabaseServer
      .from('profiles')
      .select('tier')
      .eq('id', req.userId)
      .maybeSingle();
    req.userTier = data?.tier ?? 'free';
  } catch {
    req.userTier = 'free';
  }
  next();
}

async function requirePremium(req, res, next) {
  await attachUserTier(req, res, async () => {
    if (req.userTier !== 'premium') {
      return res.status(403).json({ error: 'premium_required' });
    }
    next();
  });
}

// ── /calculate/:endpoint  (bazi, western, fusion, wuxing, tst) ──────
const CALC_ENDPOINTS = ["bazi", "western", "fusion", "wuxing", "tst"];

app.post("/api/calculate/:endpoint", requireUserAuth, (req, res) => {
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
app.post("/api/chart", requireUserAuth, (req, res) => {
  proxyToBafeWithFallback(bafeFallbackUrls("/chart"), req, res);
});

app.get("/api/chart", requireUserAuth, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const suffix = `/chart${qs ? `?${qs}` : ""}`;
  proxyToBafeWithFallback(bafeFallbackUrls(suffix), req, res);
});

// ── /api/synastry ─────────────────────────────────────────────────
//
// POST /api/synastry
// Requires: Bearer auth (premium users only).
// Body: { partner_id: string }   — UUID from partner_profiles
//
// Fetches both natal charts from FuFirE and computes inter-aspects
// server-side using staggered orb tolerances (DEC-aspect-orb-tolerances).
// FuFirE has no synastry endpoint; aspect math is done here.
//
// Decisions enforced:
//   DEC-synastry-architecture  : premium gate, separate system
//   DEC-aspect-orb-tolerances  : Conj/Opp ±8°, Trine/Square ±6°, Sextile ±4°
//   DEC-house-system-placidus  : house_system: "placidus" passed to FuFirE

const SYNASTRY_ASPECT_DEFS = [
  { name: 'conjunction', angle: 0,   orb: 8 },
  { name: 'opposition',  angle: 180, orb: 8 },
  { name: 'trine',       angle: 120, orb: 6 },
  { name: 'square',      angle: 90,  orb: 6 },
  { name: 'sextile',     angle: 60,  orb: 4 },
];
const SYNASTRY_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

function synastrySeparation(lon1, lon2) {
  const diff = Math.abs(((lon2 - lon1) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

function synastryExtractLongitudes(bodies) {
  if (!bodies) return {};
  const result = {};
  for (const p of SYNASTRY_PLANETS) {
    const lon = bodies[p]?.longitude;
    if (lon != null && isFinite(lon)) result[p] = ((lon % 360) + 360) % 360;
  }
  return result;
}

function synastryComputeAspects(pos1, pos2) {
  const aspects = [];
  for (const p1 of SYNASTRY_PLANETS) {
    const lon1 = pos1[p1];
    if (lon1 == null) continue;
    for (const p2 of SYNASTRY_PLANETS) {
      const lon2 = pos2[p2];
      if (lon2 == null) continue;
      const sep = synastrySeparation(lon1, lon2);
      for (const def of SYNASTRY_ASPECT_DEFS) {
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= def.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type:    def.name,
            angle:   def.angle,
            orb:     Math.round(deviation * 100) / 100,
            exact:   deviation <= def.orb / 2,
          });
          break;
        }
      }
    }
  }
  return aspects;
}

// ── Synastry narrative templates (DEC-narrative-engine-hybrid) ───────
// JS mirror of src/lib/synastry/templates.ts — server.mjs cannot import TypeScript.

const SYNASTRY_PLANET_DE = {
  Sun: 'Sonne', Moon: 'Mond', Mercury: 'Merkur',
  Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
};

const SYNASTRY_ASPECT_DE = {
  conjunction: 'Konjunktion', opposition: 'Opposition',
  trine: 'Trigon', square: 'Quadrat', sextile: 'Sextil',
};

const SYNASTRY_ASPECT_TMPL = {
  conjunction: (p1, p2, exact) => exact
    ? `${p1} und ${p2} vereinen sich in exakter Konjunktion — eine intensive Verschmelzung, die gemeinsame Themen zwischen euch stark betont.`
    : `${p1} und ${p2} stehen in Konjunktion — ihre Energien fließen ineinander und verstärken gemeinsame Themen in dieser Verbindung.`,
  opposition: (p1, p2, exact) => exact
    ? `${p1} und ${p2} stehen sich in exakter Opposition gegenüber — ein starkes Spannungsfeld, das zur bewussten Ergänzung einlädt.`
    : `${p1} und ${p2} befinden sich in Opposition — ein Gegenüber, das Wachstum durch gegenseitige Reflexion ermöglicht.`,
  trine: (p1, p2, exact) => exact
    ? `${p1} und ${p2} bilden ein exaktes Trigon — ein harmonischer Fluss, der Resonanz und Leichtigkeit in diese Verbindung bringt.`
    : `${p1} und ${p2} stehen im Trigon — eine fließende Harmonie, die euch in diesen Bereichen natürlich unterstützt.`,
  square: (p1, p2, exact) => exact
    ? `${p1} und ${p2} bilden ein exaktes Quadrat — produktive Spannung, die Wachstum durch bewusste Auseinandersetzung fordert.`
    : `${p1} und ${p2} stehen im Quadrat — eine reibende Spannung, die zur aktiven Klärung einlädt.`,
  sextile: (p1, p2, exact) => exact
    ? `${p1} und ${p2} bilden ein exaktes Sextil — eine sanfte Chance zur Zusammenarbeit, die gegenseitige Neugier stärkt.`
    : `${p1} und ${p2} stehen im Sextil — ein weicher Kontakt, der Möglichkeiten zur gegenseitigen Bereicherung eröffnet.`,
};

function synastryAspectNarrative(aspect) {
  const p1 = SYNASTRY_PLANET_DE[aspect.planet1] ?? aspect.planet1;
  const p2 = SYNASTRY_PLANET_DE[aspect.planet2] ?? aspect.planet2;
  const fn = SYNASTRY_ASPECT_TMPL[aspect.type];
  return fn ? fn(p1, p2, aspect.exact) : `${p1}–${p2} ${SYNASTRY_ASPECT_DE[aspect.type] ?? aspect.type}`;
}

function synastryTemplateSummary(aspects) {
  if (!aspects.length) {
    return 'Die astrologische Analyse ergibt keine signifikanten Hauptaspekte zwischen euren Geburtshoroskopen.';
  }
  const sorted = [...aspects].sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    return a.orb - b.orb;
  });
  const top = sorted.slice(0, 3).map(a => {
    const p1 = SYNASTRY_PLANET_DE[a.planet1] ?? a.planet1;
    const p2 = SYNASTRY_PLANET_DE[a.planet2] ?? a.planet2;
    return `${p1}–${p2} in ${SYNASTRY_ASPECT_DE[a.type] ?? a.type}`;
  });
  const total    = aspects.length;
  const exact    = aspects.filter(a => a.exact).length;
  const harmonic = aspects.filter(a => a.type === 'trine' || a.type === 'sextile').length;
  const tense    = aspects.filter(a => a.type === 'square' || a.type === 'opposition').length;
  const intro = `Zwischen euren Horoskopen zeigen sich ${total} Hauptaspekte${exact > 0 ? `, davon ${exact} präzise` : ''}.`;
  const tone = harmonic > tense
    ? ' Die Verbindung trägt eine überwiegend fließende Qualität — ein natürliches gegenseitiges Verständnis scheint angelegt.'
    : tense > harmonic
      ? ' Die Konstellation enthält produktive Spannung — Wachstum durch aktiven Austausch ist ein zentrales Thema.'
      : ' Die Verbindung vereint harmonische und spannungsreiche Aspekte — eine vielschichtige Begegnung mit Tiefe.';
  return intro + tone + ` Besonders prägend: ${top.join(', ')}.`;
}

async function synastryGeminiSummary(aspects, userSunSign, partnerSunSign) {
  if (!geminiClient) return null;
  try {
    // Sanitise sun signs against known zodiac values — userSunSign comes from
    // astro_profiles.sun_sign (DB) and could hold stale or unexpected data.
    const ZODIAC_EN_SET = new Set(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
    const safeUserSign    = userSunSign    && ZODIAC_EN_SET.has(userSunSign)    ? userSunSign    : null;
    const safePartnerSign = partnerSunSign && ZODIAC_EN_SET.has(partnerSunSign) ? partnerSunSign : null;

    const topAspects = [...aspects]
      .sort((a, b) => (a.exact === b.exact ? a.orb - b.orb : a.exact ? -1 : 1))
      .slice(0, 7)
      .map(a => {
        const p1 = SYNASTRY_PLANET_DE[a.planet1] ?? a.planet1;
        const p2 = SYNASTRY_PLANET_DE[a.planet2] ?? a.planet2;
        return `${p1}–${p2} ${SYNASTRY_ASPECT_DE[a.type]}${a.exact ? ' (exakt)' : ''}, Orb ${a.orb}°`;
      })
      .join('\n');

    const prompt = `Du bist Bazodiac's Synastrie-Analyst. Schreibe einen prägnanten deutschen Absatz (3-4 Sätze) über die astrologische Verbindung zwischen zwei Menschen.

DATEN:
- Sonnenzeichen Person 1: ${safeUserSign || 'unbekannt'}
- Sonnenzeichen Person 2: ${safePartnerSign || 'unbekannt'}
- Relevante Synastrie-Aspekte:
${topAspects}

REGELN:
1. Sprache: ausschließlich Deutsch
2. Ressourcenorientiert: verwende "Tendenz", "kann", "begünstigt", "Phase", "lädt ein" — NIEMALS "wird", "muss", "Schicksal"
3. Konkret: beziehe dich auf die tatsächlichen Aspekte, keine generischen Liebesaussagen
4. 3-4 Sätze, fließend formuliert
5. Kein Markdown, keine Listen, kein JSON — nur reiner Fließtext
6. Beginne NICHT mit "Diese Verbindung" oder "Zwischen euch"`;

    const model = geminiClient.models;
    const result = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.75 },
    });
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
               ?? result?.text
               ?? '';
    const trimmed = text.trim();
    return trimmed.length > 20 ? trimmed : null;
  } catch (err) {
    console.warn('[synastry] Gemini narrative failed, using template fallback:', err?.message);
    return null;
  }
}

async function fetchChartForBirth({ birth_date, birth_time, iana_time_zone, birth_lat, birth_lon }) {
  const dt = birth_time
    ? `${birth_date}T${birth_time}`
    : `${birth_date}T12:00`;
  const body = JSON.stringify({
    date:             dt,
    tz:               iana_time_zone || 'UTC',
    lat:              birth_lat,
    lon:              birth_lon,
    ambiguousTime:    'earlier',
    nonexistentTime:  'error',
    house_system:     'placidus',
  });
  const urls = bafeFallbackUrls('/chart');
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const resp = await fetch(url, {
        method: 'POST',
        headers: bafeDirectHeaders({ 'Content-Type': 'application/json' }),
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (resp.ok) return resp.json();
    } catch { /* try next URL */ }
  }
  throw new Error('FuFirE /chart unavailable');
}

app.post('/api/synastry', requireUserAuth, requirePremium, async (req, res) => {
  if (!supabaseServer) return res.status(503).json({ error: 'Auth service not configured' });

  const userId = req.userId;

  // ── Validate request ──────────────────────────────────────────────
  const { partner_id } = req.body ?? {};
  if (!partner_id || typeof partner_id !== 'string') {
    return res.status(400).json({ error: 'partner_id is required' });
  }

  // ── Load user birth data ──────────────────────────────────────────
  const { data: userProfile, error: userErr } = await supabaseServer
    .from('astro_profiles')
    .select('birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, sun_sign')
    .eq('user_id', userId)
    .maybeSingle();

  if (userErr || !userProfile?.birth_date || userProfile?.birth_lat == null) {
    return res.status(422).json({ error: 'User birth data incomplete' });
  }

  // ── Load partner birth data ───────────────────────────────────────
  const { data: partner, error: partnerErr } = await supabaseServer
    .from('partner_profiles')
    .select('birth_date, birth_time, iana_time_zone, birth_place, birth_lat, birth_lon, display_name')
    .eq('id', partner_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (partnerErr || !partner) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  if (!partner.birth_lat || !partner.birth_lon) {
    return res.status(422).json({ error: 'Partner birth location incomplete' });
  }

  // ── Fetch both natal charts ───────────────────────────────────────
  let userChart, partnerChart;
  try {
    [userChart, partnerChart] = await Promise.all([
      fetchChartForBirth({
        birth_date:    userProfile.birth_date,
        birth_time:    userProfile.birth_time,
        iana_time_zone: userProfile.iana_time_zone,
        birth_lat:     userProfile.birth_lat,
        birth_lon:     userProfile.birth_lng,
      }),
      fetchChartForBirth({
        birth_date:    partner.birth_date,
        birth_time:    partner.birth_time,
        iana_time_zone: partner.iana_time_zone,
        birth_lat:     partner.birth_lat,
        birth_lon:     partner.birth_lon,
      }),
    ]);
  } catch (err) {
    console.error('[synastry] chart fetch failed:', err?.message);
    return res.status(502).json({ error: 'Chart calculation temporarily unavailable' });
  }

  // ── Compute aspects ───────────────────────────────────────────────
  const userBodies    = userChart.positions   || userChart.bodies   || {};
  const partnerBodies = partnerChart.positions || partnerChart.bodies || {};
  const userPositions    = synastryExtractLongitudes(userBodies);
  const partnerPositions = synastryExtractLongitudes(partnerBodies);
  const rawAspects = synastryComputeAspects(userPositions, partnerPositions);

  // ── Add per-aspect template narratives (always German) ───────────
  const aspects = rawAspects.map(a => ({
    ...a,
    narrative: synastryAspectNarrative(a),
  }));

  // ── Overall summary narrative (template or Gemini) ────────────────
  const templateSummary = synastryTemplateSummary(aspects);

  // Sun sign extraction for Gemini prompt context
  const ZODIAC_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const userSunSign   = userProfile.sun_sign   || null;
  const partnerSunSign = (() => {
    const bodies = partnerBodies;
    const sunLon = bodies['Sun']?.longitude ?? bodies['sun']?.longitude;
    if (sunLon == null) return null;
    return ZODIAC_EN[Math.floor(((sunLon % 360) + 360) % 360 / 30)] ?? null;
  })();

  // This endpoint is premium-gated — attempt Gemini summary for all callers.
  // Template fallback on any Gemini failure (DEC-narrative-engine-hybrid).
  let synastry_summary = templateSummary;
  let narrative_source = 'template';

  const geminiSummary = await synastryGeminiSummary(aspects, userSunSign, partnerSunSign);
  if (geminiSummary) {
    synastry_summary = geminiSummary;
    narrative_source = 'gemini';
  }

  return res.json({
    partner: { id: partner_id, display_name: partner.display_name, birth_place: partner.birth_place },
    aspects,
    synastry_summary,
    narrative_source,
    user_positions:    userPositions,
    partner_positions: partnerPositions,
  });
});

// ── /api/create-checkout-session ─────────────────────────────────
app.post('/api/create-checkout-session', requireUserAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  try {
    const { returnUrl } = req.body;
    if (!returnUrl) {
      return res.status(400).json({ error: 'returnUrl is required' });
    }

    const sanitizedReturnUrl = sanitizeCheckoutReturnUrl(
      returnUrl,
      `${APP_URL}?upgrade=success`
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_BUY_ID,
          quantity: 1,
        },
      ],
      success_url: sanitizedReturnUrl,
      cancel_url: `${APP_URL}`,
      customer_email: req.body.email || undefined,
      metadata: {
        userId: req.userId,
        appPlatform: req.body.appPlatform || 'web',
      },
    });

    console.log(`[stripe] checkout session created: ${session.id} for user ${req.userId}`);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[stripe] checkout session creation failed:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// [REMOVED] First /api/webhook/stripe handler — was shadowing the complete
// lifecycle handler below (line ~4675). See docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md

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
    delta: [0.4, 0.25, 0.15, 0.1][Math.min((ev.priority > 0 ? ev.priority : 4) - 1, 3)] ?? 0.1,
    trigger_planet: ev.trigger_planet || "",
    trigger_symbol: "",
    sector_domain: "",
    timestamp: Date.parse(generatedAt) || Date.now(),
    description_de: typeof ev.description_de === "string" ? ev.description_de : "",
    personal_context: typeof ev.personal_context === "string" ? ev.personal_context : "",
    priority: typeof ev.priority === "number" ? ev.priority : 0,
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
      headers: bafeDirectHeaders(),
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

// ── Gemini output guard ─────────────────────────────────────────────
// Detects bare numbers (percentages or decimal scores) in Gemini text fields.
// Returns true when the text contains unexplained numerical values that would
// violate CON-no-unexplained-numbers (REQ-F-transparency-rule).
function containsBareNumbers(text) {
  if (typeof text !== 'string' || !text) return false;
  // Match: bare percentages (72%) or decimal scores (0.85, 3.4)
  return /\d+\s*%|\b\d+[.,]\d+\b/.test(text);
}

// ── Vibes cache (L1 in-memory) ──────────────────────────────────────
const vibesCache = new Map(); // vibes:userId → { data, timestamp }
const VIBES_COOLDOWN_FREE = 4 * 60 * 60 * 1000;    // 4 hours for free-tier
const VIBES_COOLDOWN_PREMIUM = 2 * 60 * 60 * 1000;  // 2 hours for premium

// ── Weekly Insights cache (L1 in-memory) ───────────────────────────
const weeklyCache = new Map(); // weekly:userId:isoWeek → { data, timestamp }

/**
 * ISO 8601 week string, e.g. "2026-W14".
 * Weeks start on Monday; the first week contains the year's first Thursday.
 */
function getISOWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday of current week determines the year
  date.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNum = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ── Inlined life area definitions (mirrors packages/shared/src/weekly/life-area-mapping.ts) ──
const WEEKLY_LIFE_AREAS = [
  { key: 'freundschaften', label: { de: 'Freundschaften', en: 'Friendships' }, sectorIndices: [10, 2], sectorWeights: [0.6, 0.4], tendencyLabels: { de: ['Offenheit', 'Rückzug', 'Klärung', 'Spannung', 'Verbundenheit'], en: ['Openness', 'Withdrawal', 'Clarification', 'Tension', 'Connection'] } },
  { key: 'liebe', label: { de: 'Liebe', en: 'Love' }, sectorIndices: [4, 6], sectorWeights: [0.55, 0.45], tendencyLabels: { de: ['Intensität', 'Distanz', 'Nähe', 'Spannung', 'Harmonie'], en: ['Intensity', 'Distance', 'Closeness', 'Tension', 'Harmony'] } },
  { key: 'sex_zaertlichkeit', label: { de: 'Sex & Zärtlichkeit', en: 'Intimacy' }, sectorIndices: [7, 4], sectorWeights: [0.6, 0.4], tendencyLabels: { de: ['Leidenschaft', 'Zurückhaltung', 'Tiefe', 'Spielerisch', 'Intensität'], en: ['Passion', 'Reserve', 'Depth', 'Playful', 'Intensity'] } },
  { key: 'beruf', label: { de: 'Beruf', en: 'Work' }, sectorIndices: [5, 9], sectorWeights: [0.5, 0.5], tendencyLabels: { de: ['Fokus', 'Ablenkung', 'Produktivität', 'Erschöpfung', 'Klarheit'], en: ['Focus', 'Distraction', 'Productivity', 'Exhaustion', 'Clarity'] } },
  { key: 'alltag', label: { de: 'Alltag', en: 'Daily Life' }, sectorIndices: [3, 5, 0], sectorWeights: [0.4, 0.35, 0.25], tendencyLabels: { de: ['Routine', 'Unruhe', 'Leichtigkeit', 'Überforderung', 'Struktur'], en: ['Routine', 'Restlessness', 'Ease', 'Overwhelm', 'Structure'] } },
  { key: 'karriere', label: { de: 'Karriere', en: 'Career' }, sectorIndices: [9, 1], sectorWeights: [0.6, 0.4], tendencyLabels: { de: ['Ambition', 'Stillstand', 'Wachstum', 'Umbruch', 'Stabilität'], en: ['Ambition', 'Stagnation', 'Growth', 'Upheaval', 'Stability'] } },
  { key: 'gesundheit', label: { de: 'Gesundheit', en: 'Health' }, sectorIndices: [5, 0, 11], sectorWeights: [0.4, 0.35, 0.25], tendencyLabels: { de: ['Vitalität', 'Erschöpfung', 'Regeneration', 'Anspannung', 'Balance'], en: ['Vitality', 'Exhaustion', 'Recovery', 'Tension', 'Balance'] } },
];

/**
 * Blend soulprint + transit sectors (60/40) for weekly scoring.
 */
function blendSectorsForWeeklyServer(soulprint, transit) {
  if (!transit || !Array.isArray(transit) || transit.length < 12) return soulprint;
  return soulprint.map((s, i) => s * 0.6 + (transit[i] || 0) * 0.4);
}

/**
 * Compute life area scores from 12-element sector array.
 * Returns 7 objects with key, label, score, rank, isHighlighted.
 */
function computeLifeAreaScoresServer(sectors) {
  if (!sectors || !Array.isArray(sectors) || sectors.length < 12) {
    return WEEKLY_LIFE_AREAS.map((area, i) => ({
      key: area.key, label: area.label, score: 0.5, rank: i + 1, isHighlighted: i < 3,
    }));
  }
  const rawScores = WEEKLY_LIFE_AREAS.map((area) => {
    let score = 0;
    for (let i = 0; i < area.sectorIndices.length; i++) {
      score += (sectors[area.sectorIndices[i]] || 0) * area.sectorWeights[i];
    }
    return { key: area.key, label: area.label, score };
  });
  const maxScore = Math.max(...rawScores.map(r => r.score), 0.001);
  const minScore = Math.min(...rawScores.map(r => r.score));
  const range = maxScore - minScore || 1;
  const normalized = rawScores.map(r => ({
    ...r, score: Math.round(((r.score - minScore) / range) * 1000) / 1000,
  }));
  const sorted = [...normalized].sort((a, b) => b.score - a.score);
  const rankMap = new Map();
  sorted.forEach((item, idx) => rankMap.set(item.key, idx + 1));
  return normalized.map(item => ({
    ...item, rank: rankMap.get(item.key), isHighlighted: rankMap.get(item.key) <= 3,
  }));
}

// Fallback templates per life area (used when Gemini is unavailable)
const WEEKLY_FALLBACK_TEMPLATES = {
  freundschaften: { statement: 'Soziale Kontakte können diese Woche besonders bereichernd sein.', tendency: 'Verbundenheit', explain: 'Deine persönliche Struktur begünstigt offene Begegnungen in dieser Phase.' },
  liebe: { statement: 'In der Liebe zeigt sich eine Phase der Annäherung.', tendency: 'Nähe', explain: 'Deine Signatur deutet auf eine erhöhte Empfänglichkeit für emotionale Tiefe hin.' },
  sex_zaertlichkeit: { statement: 'Körperliche Nähe und Sinnlichkeit stehen im Vordergrund.', tendency: 'Leidenschaft', explain: 'Die aktuelle Konstellation begünstigt intensives Erleben und Hingabe.' },
  beruf: { statement: 'Beruflich zeichnet sich eine Phase mit klarer Ausrichtung ab.', tendency: 'Fokus', explain: 'Deine Struktur unterstützt konzentriertes Arbeiten und klare Prioritäten.' },
  alltag: { statement: 'Der Alltag kann sich diese Woche leichter anfühlen als gewohnt.', tendency: 'Leichtigkeit', explain: 'Deine Grundenergie harmoniert mit den aktuellen Rhythmen.' },
  karriere: { statement: 'Karriereschritte profitieren von ruhiger Überlegung.', tendency: 'Stabilität', explain: 'Die Verbindung zwischen deiner Signatur und der Wochendynamik empfiehlt überlegtes Handeln.' },
  gesundheit: { statement: 'Dein Körper signalisiert, dass Regeneration wichtig ist.', tendency: 'Regeneration', explain: 'Deine persönliche Konstellation legt nahe, auf Erholungsphasen zu achten.' },
};

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

function extractJsonPayload(raw) {
  if (typeof raw !== 'string') return '';
  let value = raw.trim();
  if (!value) return '';
  if (value.startsWith('```json')) {
    value = value.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  }
  if (!value.startsWith('{')) {
    const first = value.indexOf('{');
    const last = value.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      value = value.slice(first, last + 1);
    }
  }
  return value;
}

function buildWeeklyFallbackAreas(areaScores) {
  return areaScores.map((area) => {
    const tpl = WEEKLY_FALLBACK_TEMPLATES[area.key] || WEEKLY_FALLBACK_TEMPLATES.alltag;
    return {
      key: area.key,
      label: area.label,
      statement: tpl.statement,
      tendency: tpl.tendency,
      score: area.score,
      rank: area.rank,
      isHighlighted: area.isHighlighted,
      explain: area.isHighlighted
        ? tpl.explain
        : 'Diese Tendenz entsteht aus der aktuellen Konstellation in Verbindung mit deiner persönlichen Struktur.',
    };
  });
}

function buildDailyFallbackPayload({ targetDate, lang, bafeData }) {
  const german = lang !== 'en';
  const dayMaster = bafeData?.bazi?.pillars?.day?.stem || '';
  const sunSign = bafeData?.western?.zodiac_sign || (german ? 'dein Zeichen' : 'your sign');
  const moonSign = bafeData?.western?.moon_sign || (german ? 'dein Mondzeichen' : 'your moon sign');
  const harmonyIndex = 0.52;
  const dayMode = harmonyIndex >= 0.5 ? 'trace' : 'pulse';
  const synthesis = german
    ? 'Heute entsteht Zug in deinem Alltag. Was innerlich klar ist, will sichtbar werden.'
    : 'Today carries momentum. What is clear inside wants to become visible.';

  return {
    date: targetDate,
    western: {
      summary: german
        ? `${sunSign} bringt heute Fokus auf klare Prioritäten.`
        : `${sunSign} brings a focus on clear priorities today.`,
      themes: german ? ['Ausrichtung', 'Klarheit'] : ['Alignment', 'Clarity'],
      caution: german
        ? 'Verteile deine Aufmerksamkeit nicht auf zu viele Baustellen.'
        : 'Avoid splitting your attention across too many fronts.',
      opportunity: german
        ? 'Ein bewusst gesetzter Schritt kann heute viel tragen.'
        : 'One deliberate step can carry a lot today.',
      evidence: { transit_sectors: [1, 5] },
    },
    eastern: {
      summary: german
        ? `${moonSign} öffnet den Blick für feine Signale im Umfeld.`
        : `${moonSign} opens your attention to subtle signals around you.`,
      themes: german ? ['Wahrnehmung', 'Timing'] : ['Perception', 'Timing'],
      caution: german
        ? 'Handle nicht aus Druck, sondern aus innerer Ruhe.'
        : 'Act from calm intent, not pressure.',
      opportunity: german
        ? 'Eine kleine Kurskorrektur verbessert den Tagesfluss deutlich.'
        : 'A small course correction can improve the flow of your day.',
      evidence: { day_master: dayMaster },
    },
    fusion: {
      summary: german
        ? 'Der Tag zeigt eine konkrete Tendenz mit gut nutzbarer Klarheit.'
        : 'The day shows a concrete tendency with usable clarity.',
      synthesis,
      action: german
        ? 'Entscheide heute eine Sache klar und setze sie direkt um.'
        : 'Choose one thing clearly today and implement it directly.',
      pushworthy: true,
      push_text: german ? 'Heute ist ein guter Moment für einen klaren Schritt.' : 'Today is a good moment for one clear step.',
      harmony_index: harmonyIndex,
      day_mode: dayMode,
    },
    meta: { engine_version: 'v1-gemini-daily' },
  };
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
          headers: bafeDirectHeaders(),
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

// ── BaZi resonance helpers (JS port of src/lib/fusion-bazi/resonance.ts) ─────
// LOCKED by DEC-fusion-bazi-sheng-ke. Do not change mappings without updating that decision.

const IMPACT_PLANET_ELEMENT = {
  Sun: 'fire', Moon: 'water', Mercury: 'water',
  Venus: 'metal', Mars: 'fire', Jupiter: 'wood', Saturn: 'earth',
};

const IMPACT_STEM_ELEMENT = {
  Jia: 'wood', Yi: 'wood', Bing: 'fire', Ding: 'fire',
  Wu: 'earth', Ji: 'earth', Geng: 'metal', Xin: 'metal',
  Ren: 'water', Gui: 'water',
};

const IMPACT_SHENG_NEXT = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const IMPACT_KE_NEXT    = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

function impactBaziResonance(planetEN, dayMasterStem) {
  const pe = IMPACT_PLANET_ELEMENT[planetEN] ?? 'earth';
  const de = IMPACT_STEM_ELEMENT[dayMasterStem] ?? 'earth';
  if (pe === de)                    return { type: 'gleichklang', intensity: 0.85, wu_xing_element: pe };
  if (IMPACT_SHENG_NEXT[pe] === de) return { type: 'naehrung',    intensity: 0.75, wu_xing_element: pe };
  if (IMPACT_SHENG_NEXT[de] === pe) return { type: 'naehrung',    intensity: 0.65, wu_xing_element: pe };
  if (IMPACT_KE_NEXT[pe] === de)    return { type: 'kontrolle',   intensity: 0.70, wu_xing_element: pe };
  if (IMPACT_KE_NEXT[de] === pe)    return { type: 'kontrolle',   intensity: 0.70, wu_xing_element: pe };
  return { type: 'neutral', intensity: 0.35, wu_xing_element: pe };
}

// ── /api/impact/active ──────────────────────────────────────────────────
// Server-side computation — NOT a FuFirE proxy (ASM-noaa-in-fufre invalidated).
// Returns ACTIVE_IMPACTS_v1: harmony_index (0–100), active_planets[] (orb ≤ 8°),
// resonance_badges[]. Cached 15 min keyed on (user_id, date).
//
// Decisions enforced:
//   DEC-fusion-bazi-sheng-ke  : BaZi resonance per planet
//   DEC-aspect-orb-tolerances : staggered orbs (reused from synastry)

const impactCache = new Map();
const IMPACT_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Core impact computation — called from both /api/impact/active and /api/experience/daily.
 * Returns ACTIVE_IMPACTS_v1 object or throws on failure. Uses impactCache internally.
 */
async function computeActiveImpactsCore(userId) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `impact:${userId}:${dateStr}`;

  const cached = impactCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < IMPACT_CACHE_TTL_MS) {
    return { ...cached.data, meta: { ...cached.data.meta, cached: true } };
  }

  if (!supabaseServer) throw new Error('database_unavailable');

  // 1. Load user profile — natal chart + day master + soulprint
  const { data: profile, error: profileErr } = await supabaseServer
    .from('astro_profiles')
    .select('astro_json, soulprint_sectors')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr || !profile?.astro_json) {
    throw new Error('profile_incomplete');
  }

  // Extract natal planet longitudes from stored astro_json
  const natalBodies = profile.astro_json?.positions || profile.astro_json?.bodies || {};
  const natalPositions = synastryExtractLongitudes(natalBodies);

  // 2. Get today's transit positions — BAFE /chart at noon UTC, geocentric
  let transitPositions = {};
  try {
    const transitChart = await fetchChartForBirth({
      birth_date: dateStr,
      birth_time: '12:00',
      iana_time_zone: 'UTC',
      birth_lat: 0,
      birth_lon: 0,
    });
    const transitBodies = transitChart.positions || transitChart.bodies || {};
    transitPositions = synastryExtractLongitudes(transitBodies);
  } catch (err) {
    console.warn('[impact/active] BAFE transit fetch failed, using empty transits:', err?.message);
  }

  // 3. Compute transit-to-natal aspects — staggered orbs per DEC-aspect-orb-tolerances
  const rawAspects = [];
  for (const tp of SYNASTRY_PLANETS) {
    const tLon = transitPositions[tp];
    if (tLon == null) continue;
    for (const np of SYNASTRY_PLANETS) {
      const nLon = natalPositions[np];
      if (nLon == null) continue;
      const sep = synastrySeparation(tLon, nLon);
      for (const def of SYNASTRY_ASPECT_DEFS) {
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= def.orb) {
          rawAspects.push({ transit_planet: tp, natal_planet: np, aspect_type: def.name, orb: Math.round(deviation * 100) / 100 });
          break;
        }
      }
    }
  }

  // 4. Build active planets — one entry per transit planet (tightest aspect wins)
  const dayMaster = profile.astro_json?.bazi?.day_master || null;
  const planetBest = new Map();
  for (const a of rawAspects) {
    const existing = planetBest.get(a.transit_planet);
    if (!existing || a.orb < existing.orb) planetBest.set(a.transit_planet, a);
  }

  const activePlanets = [];
  for (const [planet, aspect] of planetBest) {
    const bazi = dayMaster ? impactBaziResonance(planet, dayMaster) : null;
    const strength = Math.round((1 - aspect.orb / 8) * 100) / 100;
    activePlanets.push({
      planet,
      strength,
      aspect_type: aspect.aspect_type,
      orb: aspect.orb,
      natal_planet: aspect.natal_planet,
      bazi_resonance: bazi?.type ?? null,
      wu_xing_element: bazi?.wu_xing_element ?? null,
    });
  }
  activePlanets.sort((a, b) => b.strength - a.strength);

  // 5. Compute coherence (additive: base + solar delta, never below base)
  const rawHarmony = profile.astro_json?.fusion?.harmony_index;
  const hasFusionData = rawHarmony !== undefined && rawHarmony !== null;
  const baseHarmony = rawHarmony ?? 0.5;
  const sw = spaceWeatherCache?.payload;
  const solarPressure = sw?.solar_pressure_score ?? 0;
  const sWeight = Number(process.env.HARMONY_INDEX_SOLAR_WEIGHT) || 0.35;

  // base_coherence: null when fusion data absent (triggers "unavailable" UI)
  const baseCoherence = hasFusionData
    ? Math.min(100, Math.max(0, Math.round(baseHarmony * 100)))
    : null;
  const solarDelta = hasFusionData
    ? Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)))
    : null;
  const displayedCoherence = hasFusionData ? baseCoherence + solarDelta : null;
  const positiveDailyDelta = solarDelta;
  // harmony_index: always a number for backward compat
  const harmonyIndex = displayedCoherence ?? Math.min(100, Math.max(0,
    Math.round((baseHarmony * 0.65 + solarPressure * sWeight) * 100)
  ));

  // 6. Compute resonance badges (reuse existing server badge logic)
  const badges = computeResonanceBadgesServer({
    transitInfluences: activePlanets.map(p => ({
      planet: p.planet,
      aspectDeg: SYNASTRY_ASPECT_DEFS.find(d => d.name === p.aspect_type)?.angle ?? 0,
      fieldStrength: p.strength,
      isResonant: p.bazi_resonance === 'gleichklang' || p.bazi_resonance === 'naehrung',
    })),
    spaceWeather: sw ?? null,
    soulprintSectors: profile.soulprint_sectors ?? null,
    lang: 'de',
  });

  // 7. Build ACTIVE_IMPACTS_v1 response
  const response = {
    schema: 'ACTIVE_IMPACTS_v1',
    date: dateStr,
    harmony_index: harmonyIndex,
    base_coherence: baseCoherence,
    positive_daily_delta: positiveDailyDelta,
    displayed_coherence: displayedCoherence,
    active_planets: activePlanets,
    resonance_badges: badges,
    meta: {
      engine: 'astro-noctum-server',
      solar_pressure_source: sw ? 'noaa_swpc' : 'unavailable',
      cached: false,
    },
  };

  impactCache.set(cacheKey, { ts: Date.now(), data: response });
  return response;
}

app.post('/api/impact/active', requireUserAuth, async (req, res) => {
  try {
    const result = await computeActiveImpactsCore(req.userId);
    res.json(result);
  } catch (err) {
    const status = err.message === 'database_unavailable' ? 503
      : err.message === 'profile_incomplete' ? 422 : 500;
    console.error('[impact/active] Error:', err?.message || err);
    res.status(status).json({ error: err.message || 'impact_calculation_failed' });
  }
});

// ── Experience API proxy ──────────────────────────────────────────
/**
 * Bootstrap endpoint — 7-step flow:
 *
 * 1. Validate auth: requireUserAuth middleware checks Supabase JWT, attaches req.userId.
 * 2. Parse birth data: req.body must contain { date, time, lat, lon, tz }.
 * 3. Trigger Superglue chart calculation via bazodiac-user-chart webhook.
 *    Polls astro_profiles for sun/moon/asc + astro_json (written by the worker).
 *    Falls back to direct BAFE /chart only if Superglue data is not ready in time.
 * 4. Compute Master Signal: runs gcbBuilder + masterSignalBuilder on the BAFE chart.
 *    Projects the result to 12 soulprint_sectors (Float array, values 0–1).
 * 5. Persist soulprint: awaits Supabase astro_profiles.update({ soulprint_sectors }).
 *    On success: sets soulprint_saved = true in response payload.
 *    On failure: console.warn, sets soulprint_saved = false — still returns HTTP 200.
 *    Recovery: transit-state endpoint derives soulprint from Wu-Xing data when DB row is absent.
 * 6. Build response payload: { soulprint_sectors, soulprint_saved, profile_summary,
 *    signature_blueprint, narratives }.
 * 7. Return HTTP 200 JSON. Client (App.tsx) detects soulprint_saved=false or
 *    seed.startsWith('fallback:') and shows a non-blocking "Soulprint wird berechnet..." hint.
 */
app.post('/api/experience/bootstrap', requireUserAuth, async (req, res) => {
  try {
    const { birth } = req.body;
    if (!birth) return res.status(400).json({ error: 'Missing birth data' });

    // 1. Trigger Superglue tool first (required onboarding path)
    try {
      await triggerBazodiacUserChart(req.userId, false);
    } catch (hookErr) {
      console.error('[experience/bootstrap] Superglue hook failed:', hookErr?.message || hookErr);
      return res.status(502).json({ error: 'superglue_unavailable' });
    }

    // 2. Try to consume chart persisted by Superglue worker
    let bafeData = null;
    const stored = await waitForStoredChart(req.userId);
    if (stored?.chart) {
      bafeData = stored.chart;
    } else {
      console.warn('[experience/bootstrap] Superglue chart not ready, falling back to direct BAFE /chart for user', req.userId);
      const bafeRes = await fetchWithRetry(
        `${BAFE_BASE_URL}/chart`,
        {
          method: "POST",
          headers: bafeDirectHeaders(),
          body: JSON.stringify({
            birthDate: birth.date,
            birthTime: birth.time,
            lat: birth.lat,
            lng: birth.lon,
            timeZone: birth.tz
          }),
          signal: AbortSignal.timeout(7000),
        },
        3,
        1000
      );
      if (!bafeRes.ok) {
        throw new Error(`BAFE responded with ${bafeRes.status}`);
      }
      bafeData = await bafeRes.json();
    }

    // 3. Compute Master Signal (N + G)
    const birthYear = parseInt(birth.date.substring(0, 4), 10);
    const nDim = computeNatalDimensions(bafeData);
    const qDim = zeroDimensions(); // No quiz yet
    const gcbDim = computeGCBDimensions(birthYear);

    // 4. Project to Ring (Initial Soulprint)
    const soulprintSectors = projectToRing(nDim, qDim, 1, 0);

    const narratives = generateNarratives(nDim, qDim, gcbDim, req.query.lang === 'en' ? 'en' : 'de');

    // 5. Generate Blueprint
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

    // 6. Save to Supabase
    const { saved: soulprint_saved } = await persistSoulprintSectors(
      supabaseServer,
      req.userId,
      soulprintSectors
    );

    res.status(200).json({ ...responsePayload, soulprint_saved });
  } catch (err) {
    console.error('[experience/bootstrap] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

app.post('/api/experience/signature-delta', requireUserAuth, async (req, res) => {
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

// ── Night-Pulse H computation ────────────────────────────────────────────────
// Datenbasis: current Moon zodiac sign + current BaZi hour branch element.
// Same cosine-similarity formula as Day-Pulse H, different input vectors.

/** Moon zodiac sign index (0=Aries … 11=Pisces) from approximate ecliptic longitude */
function approxMoonSignIndex(date = new Date()) {
  const msPerDay = 86400000;
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / msPerDay;
  const toRad = (deg) => deg * Math.PI / 180;
  const L = ((218.316 + 13.176396 * d) % 360 + 360) % 360;
  const M = ((134.963 + 13.064993 * d) % 360 + 360) % 360;
  const sunM = ((357.529 + 0.985600 * d) % 360 + 360) % 360;
  const lam = L
    + 6.289 * Math.sin(toRad(M))
    - 1.274 * Math.sin(toRad(2 * L - M))
    + 0.658 * Math.sin(toRad(2 * L))
    - 0.186 * Math.sin(toRad(sunM));
  return Math.floor(((lam % 360 + 360) % 360) / 30); // 0–11
}

// Zodiac sector index → Wu-Xing element (same mapping as DashboardTagesEnergie / SECTOR_ELEMENT)
const NIGHT_ZODIAC_ELEMENT = ['Fire','Earth','Metal','Water','Wood','Fire','Earth','Metal','Water','Wood','Fire','Earth'];

/** Current BaZi hour-branch Wu-Xing element from UTC hour (each 2h slot = 1 branch) */
function hourBranchElement(utcHour) {
  // Zi(23/0)=Water, Chou(1-2)=Earth, Yin(3-4)=Wood, Mao(5-6)=Wood,
  // Chen(7-8)=Earth, Si(9-10)=Fire, Wu(11-12)=Fire, Wei(13-14)=Earth,
  // Shen(15-16)=Metal, You(17-18)=Metal, Xu(19-20)=Earth, Hai(21-22)=Water
  const BRANCH_ELEM = ['Water','Earth','Wood','Wood','Earth','Fire','Fire','Earth','Metal','Metal','Earth','Water'];
  const branchIdx = utcHour === 23 ? 0 : Math.floor((utcHour + 1) / 2);
  return BRANCH_ELEM[branchIdx % 12];
}

/** Night-Pulse H: cosine similarity between Moon-element 5D vector and hour-branch 5D vector */
function computeNightHarmonyIndex(date = new Date()) {
  const moonEl = NIGHT_ZODIAC_ELEMENT[approxMoonSignIndex(date)];
  const hourEl = hourBranchElement(date.getUTCHours());
  const moonVec = ELEMENT_DIMENSION_MAP[moonEl];
  const hourVec = ELEMENT_DIMENSION_MAP[hourEl];
  if (!moonVec || !hourVec) return 0.45;
  let dot = 0, magM = 0, magH = 0;
  for (const k of DIMENSION_KEYS) {
    const m = moonVec[k] ?? 0;
    const h = hourVec[k] ?? 0;
    dot += m * h;
    magM += m * m;
    magH += h * h;
  }
  if (magM < 1e-9 || magH < 1e-9) return 0.45;
  return Math.min(1, Math.max(0, dot / (Math.sqrt(magM) * Math.sqrt(magH))));
}

/** Append night_harmony_index + night_mode to a DailyResponse fusion object (mutates in place) */
function appendNightHarmony(parsedData, date = new Date()) {
  if (!parsedData?.fusion) return;
  if (parsedData.fusion.night_harmony_index !== undefined) return; // already present (cached)
  const nightH = Math.round(computeNightHarmonyIndex(date) * 1000) / 1000;
  parsedData.fusion.night_harmony_index = nightH;
  parsedData.fusion.night_mode = nightH >= 0.50 ? 'trace' : 'pulse';
}

/**
 * Compute deterministic resonance badges from real-time inputs.
 * Pure JS — called inside /api/experience/daily for every request.
 *
 * @param {object} opts
 * @param {Array} opts.transitInfluences - [{planet, aspectDeg, fieldStrength, isResonant}]
 * @param {object|null} opts.spaceWeather - spaceWeatherCache?.payload
 * @param {number[]|null} opts.soulprintSectors - 12-element array from astro_profiles
 * @param {string} opts.lang - 'de' | 'en'
 * @returns {Array} badges
 */
function computeResonanceBadgesServer({ transitInfluences, spaceWeather, soulprintSectors, lang = 'de' }) {
  const badges = [];

  // ── Transit badge — strongest planet by fieldStrength ─────────────────
  if (Array.isArray(transitInfluences) && transitInfluences.length > 0) {
    const strongest = transitInfluences.reduce(
      (best, p) => ((p.fieldStrength ?? 0) > (best.fieldStrength ?? 0) ? p : best),
      transitInfluences[0],
    );
    const ASPECT_NAMES_DE = { 0: 'Konjunktion', 60: 'Sextil', 90: 'Quadrat', 120: 'Trigon', 180: 'Opposition' };
    const ASPECT_NAMES_EN = { 0: 'Conjunction', 60: 'Sextile', 90: 'Square', 120: 'Trine', 180: 'Opposition' };
    const aspectNames = lang === 'de' ? ASPECT_NAMES_DE : ASPECT_NAMES_EN;
    const aspectName = aspectNames[strongest.aspectDeg] ?? `${strongest.aspectDeg}°`;
    const resonanceLabel = lang === 'de'
      ? (strongest.isResonant ? 'Verstärkend' : 'Schärfend')
      : (strongest.isResonant ? 'Amplifying' : 'Sharpening');
    const intensity = strongest.fieldStrength >= 0.80 ? 'hoch' : strongest.fieldStrength >= 0.60 ? 'mittel' : 'niedrig';
    badges.push({
      type: 'transit',
      label: `${strongest.planet} ${aspectName} · ${resonanceLabel}`,
      sublabel: `${Math.round(strongest.fieldStrength * 100)}%`,
      intensity,
      color: strongest.isResonant ? '#D4AF37' : '#E87040',
    });
  }

  // ── Space weather badge — from Kp index ───────────────────────────────
  if (spaceWeather) {
    const kp = Number(spaceWeather.kp_index ?? spaceWeather.kp ?? 0);
    const gScale = kp >= 8 ? 'G5' : kp >= 6 ? 'G4' : kp >= 5 ? 'G3' : kp >= 4 ? 'G2' : kp >= 3 ? 'G1' : null;
    const intensity = kp >= 5 ? 'hoch' : kp >= 3 ? 'mittel' : 'niedrig';
    const labelDe = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Sturm` : `Kp ${kp.toFixed(1)} · Ruhig`;
    const labelEn = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Storm` : `Kp ${kp.toFixed(1)} · Calm`;
    badges.push({
      type: 'space_weather',
      label: lang === 'de' ? labelDe : labelEn,
      sublabel: lang === 'de' ? 'Kosmisches Wetter' : 'Space Weather',
      intensity,
      color: kp >= 5 ? '#E04040' : kp >= 3 ? '#E87040' : '#4CAF50',
    });
  }

  // ── Sektor badge — top soulprint sector ───────────────────────────────
  if (Array.isArray(soulprintSectors) && soulprintSectors.length === 12) {
    const ZODIAC_DE = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];
    const ZODIAC_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const ZODIAC_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
    const maxIdx = soulprintSectors.reduce((best, v, i) => v > soulprintSectors[best] ? i : best, 0);
    const signs = lang === 'de' ? ZODIAC_DE : ZODIAC_EN;
    const intensity = soulprintSectors[maxIdx] >= 0.7 ? 'hoch' : soulprintSectors[maxIdx] >= 0.4 ? 'mittel' : 'niedrig';
    badges.push({
      type: 'sektor',
      label: `${ZODIAC_SYM[maxIdx]} ${signs[maxIdx]}`,
      sublabel: lang === 'de' ? 'Dein Leitsystem' : 'Your Lead System',
      intensity,
      color: '#8B6CD4',
    });
  }

  return badges;
}

app.post('/api/experience/daily', requireUserAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length > 10000) {
      return res.status(413).json({ error: 'payload_too_large' });
    }

    const { birth, target_date, locale, transit_influences, birth_sign, include } = req.body || {};
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
    const wantsImpact = Array.isArray(include) && include.includes('impact');
    const cacheKeyD = `daily:${userId}:${targetDate}:${lang}`;

    const now = new Date();

    // Helper: append resonance badges to any response object (always fresh, not cached)
    const appendBadges = (responseData, soulprintSectors) => {
      responseData.resonance_badges = computeResonanceBadgesServer({
        transitInfluences: transit_influences ?? [],
        spaceWeather: spaceWeatherCache?.payload ?? null,
        soulprintSectors: soulprintSectors ?? null,
        lang,
      });
    };

    const clonePayload = (payload) => {
      try {
        return JSON.parse(JSON.stringify(payload));
      } catch {
        return payload && typeof payload === 'object' ? { ...payload } : payload;
      }
    };

    let resolvedUserTier = req.userTier;
    const resolveIsPremium = async () => {
      if (resolvedUserTier === undefined && supabaseServer) {
        try {
          const { data: tierRow } = await supabaseServer
            .from('profiles').select('tier').eq('id', userId).maybeSingle();
          resolvedUserTier = tierRow?.tier ?? 'free';
        } catch {
          resolvedUserTier = 'free';
        }
      }
      return resolvedUserTier === 'premium';
    };

    const appendImpactAndTierGates = async (responseData) => {
      if (!wantsImpact) return;
      try {
        const impactData = await computeActiveImpactsCore(userId);
        const impactForResponse = clonePayload(impactData);
        responseData.impact = impactForResponse;

        const isPremium = await resolveIsPremium();

        if (responseData.fusion && !isPremium) {
          responseData.fusion.action = lang === 'de'
            ? 'Deine persönliche Tagesempfehlung ist Teil von Bazodiac Premium.'
            : 'Your personal daily recommendation is part of Bazodiac Premium.';
          responseData.fusion.action_locked = true;
        }

        if (!isPremium && responseData.impact) {
          responseData.impact.resonance_badges = [];
        }
      } catch (impactErr) {
        console.warn('[experience/daily] Impact computation failed, omitting impact block:', impactErr?.message);
      }
    };

    const prepareDailyResponse = async (baseData) => {
      const responseData = clonePayload(baseData) || {};
      appendNightHarmony(responseData, now);
      appendBadges(responseData, soulprintSectorsForBadge);
      await appendImpactAndTierGates(responseData);
      return responseData;
    };

    // Load soulprint sectors early — needed for badge computation in ALL paths
    let soulprintSectorsForBadge = null;
    if (supabaseServer) {
      try {
        const { data: soulprintProfile } = await supabaseServer
          .from('astro_profiles')
          .select('soulprint_sectors')
          .eq('user_id', userId)
          .maybeSingle();
        soulprintSectorsForBadge = soulprintProfile?.soulprint_sectors ?? null;
      } catch (e) {
        console.warn('[daily] soulprint load failed, skipping sektor badge:', e?.message);
      }
    }

    if (horoscopeCache.has(cacheKeyD)) {
      const cached = horoscopeCache.get(cacheKeyD);
      if (Date.now() - cached.timestamp < HOROSCOPE_CACHE_TTL) {
        const responseData = await prepareDailyResponse(cached.data);
        return res.json(responseData);
      }
    }

    // L2: Check Supabase daily_horoscope_cache (non-blocking — Supabase outage must not prevent generation)
    if (supabaseServer) {
      try {
        const { data: dbCached } = await supabaseServer
          .from('daily_horoscope_cache')
          .select('payload_json')
          .eq('user_id', userId)
          .eq('local_date', targetDate)
          .eq('engine_version', 'v1-gemini-daily')
          .maybeSingle();

        if (dbCached?.payload_json) {
          horoscopeCache.set(cacheKeyD, { data: dbCached.payload_json, timestamp: Date.now() });
          const responseData = await prepareDailyResponse(dbCached.payload_json);
          return res.json(responseData);
        }
      } catch (e) {
        console.warn('[daily] L2 cache read failed, continuing to generation:', e.message);
      }
    }

    if (!geminiClient) {
      console.warn('[experience/daily] Gemini API key missing, falling back to proxy');
      const resp = await fetch(`${BAFE_BASE_URL}/experience/daily`, {
        method: 'POST',
        headers: bafeDirectHeaders(),
        body: bodyStr,
        signal: AbortSignal.timeout(20000),
      });
      const data = await resp.json();
      // Ensure harmony_index + day_mode are always present
      if (data?.fusion) {
        if (data.fusion.harmony_index === undefined) {
          data.fusion.harmony_index = 0.45;
        }
        if (data.fusion.day_mode === undefined) {
          data.fusion.day_mode = data.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
        }
      }
      if (resp.ok && supabaseServer) {
        // Persist to L2 (fire-and-forget)
        supabaseServer
          .from('daily_horoscope_cache')
          .upsert({
            user_id: userId,
            local_date: targetDate,
            engine_version: 'v1-gemini-daily',
            signature_version: 1,
            payload_json: data,
          }, { onConflict: 'user_id,local_date,engine_version,signature_version' })
          .then(({ error }) => { if (error) console.warn('[daily] DB cache upsert failed:', error.message); })
          .catch((e) => { console.warn('[daily] DB cache upsert threw:', e?.message || e); });
      }
      const responseData = await prepareDailyResponse(data);
      return res.status(resp.status).json(responseData);
    }

    // Call BAFE for natal data to feed Gemini
    const bafeRes = await fetch(`${BAFE_BASE_URL}/chart`, {
      method: "POST",
      headers: bafeDirectHeaders(),
      body: JSON.stringify({
        birthDate: birth.date,
        birthTime: birth.time,
        lat: birth.lat,
        lng: birth.lon,
        timeZone: birth.tz
      })
    });
    const bafeData = bafeRes.ok ? await bafeRes.json() : {};

    // Build transit context for the enriched Gemini prompt
    const transitContextStr = Array.isArray(transit_influences) && transit_influences.length > 0
      ? transit_influences.map(t => {
          const ASPECT_DE = { 0: 'Konjunktion', 60: 'Sextil', 90: 'Quadrat', 120: 'Trigon', 180: 'Opposition' };
          const aspectName = ASPECT_DE[t.aspectDeg] ?? `${t.aspectDeg}°`;
          return `- ${t.planet}: ${aspectName} (${t.aspectDeg}°), Stärke ${Math.round((t.fieldStrength ?? 0) * 100)}%, ${t.isResonant ? 'verstärkend' : 'schärfend'}`;
        }).join('\n')
      : 'Keine Transit-Daten verfügbar.';

    const spaceWeatherStr = (() => {
      const sw = spaceWeatherCache?.payload;
      if (!sw) return 'Keine Weltraumwetter-Daten.';
      const kp = Number(sw.kp_index ?? sw.kp ?? 0);
      return `Kp-Index: ${kp}, Solar-Druck: ${(sw.solar_pressure_score ?? 0).toFixed(2)}`;
    })();

    const soulprintTopStr = (() => {
      if (!Array.isArray(soulprintSectorsForBadge) || soulprintSectorsForBadge.length !== 12) return '';
      const ZODIAC_DE = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];
      const maxIdx = soulprintSectorsForBadge.reduce((best, v, i) => v > soulprintSectorsForBadge[best] ? i : best, 0);
      return `Stärkster Soulprint-Sektor: ${ZODIAC_DE[maxIdx]} (Wert: ${soulprintSectorsForBadge[maxIdx].toFixed(2)})`;
    })();

    const prompt = `
You are Bazodiac's fusion astrologer. You write in "Poetic Realism" — worldly images, not astro-lectures.
Write a daily horoscope for today (${targetDate}) based on the user's birth chart AND today's real planetary transits:

GEBURTSHOROSKOP:
${JSON.stringify(bafeData, null, 2)}

PLANETENTRANSITS HEUTE:
${transitContextStr}

KOSMISCHES WETTER:
${spaceWeatherStr}

${soulprintTopStr ? soulprintTopStr + '\n' : ''}
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
    "synthesis": "THE MAIN TEXT — see DAY-MODE VOICE below.",
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
- harmony_index: number between 0.0 and 1.0 — real measure of today's planetary alignment. 0.45 = baseline. >= 0.50 = convergence day.
- day_mode: if harmony_index >= 0.50 set "trace" (poles converge, something happens today), else "pulse" (symmetric, calm day).

DAY-MODE VOICE — the "synthesis" field MUST follow the voice rules for the computed day_mode:

PULSE (harmony_index < 0.50):
- Tone: atmospheric, inviting, sensory, worldly imagery.
- Examples: "Erde ist Struktur und die hält dich heute. Nicht zu fest, so wie du es brauchst."
  "Die Gedanken kreisen, aber nicht hektisch. Eher wie ein Lied, das sich langsam entfaltet."
- Resonance described through everyday scenes, not astrological facts.
- Max 2–3 sentences. No explanation of why.
- The reader should feel held, not lectured. Rhythm over reason.

TRACE (harmony_index >= 0.50):
- Tone: direct, charged, concrete — something happens today.
- Examples: "Dein detektivischer Skorpion bekommt heute was zu tun."
  "Holz trifft auf Feuer. Was du still aufgebaut hast, will raus — und heute ist der Tag."
- Name the quality, not the cause. No esoteric vocabulary.
- If harmony_index > 0.65: one extra sentence — urgent, clear call to act.
- Max 2–3 sentences.

NEVER use in synthesis: "weil", "da heute", planet names (Mars, Venus etc.), "die kosmischen Energien", "die Sterne sagen".
`;

    const model = geminiClient.models;
    const result = await model.generateContent({
      model: "gemini-2.0-flash",
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
    let parsedData = null;

    if (!jsonStr) {
      console.error("[experience/daily] Empty response text from model, using fallback payload");
      parsedData = buildDailyFallbackPayload({ targetDate, lang, bafeData });
    } else {
      jsonStr = extractJsonPayload(jsonStr);
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn('[experience/daily] Model JSON parse failed, using structured fallback:', parseErr?.message || parseErr);
        parsedData = buildDailyFallbackPayload({ targetDate, lang, bafeData });
      }
    }

    // Ensure harmony_index + day_mode are always present regardless of model output
    if (parsedData?.fusion) {
      if (parsedData.fusion.harmony_index === undefined) {
        parsedData.fusion.harmony_index = 0.45; // random baseline = neutral
      }
      if (parsedData.fusion.day_mode === undefined) {
        parsedData.fusion.day_mode = parsedData.fusion.harmony_index >= 0.50 ? 'trace' : 'pulse';
      }
      appendNightHarmony(parsedData, now);
    }

    horoscopeCache.set(cacheKeyD, { data: parsedData, timestamp: Date.now() });

    if (supabaseServer) {
      // Persist to L2 (fire-and-forget) — badges not cached (computed fresh each request)
      supabaseServer
        .from('daily_horoscope_cache')
        .upsert({
          user_id: userId,
          local_date: targetDate,
          engine_version: 'v1-gemini-daily',
          signature_version: 1,
          payload_json: parsedData,
        }, { onConflict: 'user_id,local_date,engine_version,signature_version' })
        .then(({ error }) => {
          if (error) {
            console.warn('[daily] DB cache upsert failed:', error.message);
          }
        })
        .catch((err) => {
          console.error('[daily] DB cache upsert rejected:', err);
        });
    }

    const responseData = await prepareDailyResponse(parsedData);
    res.status(200).json(responseData);
  } catch (err) {
    console.error('[experience/daily] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

// ── /api/vibes ──────────────────────────────────────────────────────
// Short-horizon vibes signal (2-3h) combining soulprint, transit, and space weather.
// Uses Gemini for generation with L1 (in-memory) + L2 (Supabase vibes_cache) caching.
// Deterministic fallback when Gemini is unavailable (template per dominant Wu-Xing element).

const VIBES_FALLBACK = {
  Wood:  { kurzsignal: 'Wachstumsphase \u2014 neue Impulse entstehen', treiber: ['Kreative Energie', 'Offenheit f\u00fcr Neues', 'Innere Bewegung'], erklaerung: 'Deine Holz-Energie beg\u00fcnstigt Expansion und frische Perspektiven.' },
  Fire:  { kurzsignal: 'Hohe Ausstrahlung \u2014 sichtbar und pr\u00e4sent', treiber: ['Charisma steigt', 'Emotionale Intensit\u00e4t', 'Spontanit\u00e4t'], erklaerung: 'Feuer-Energie verst\u00e4rkt deine Sichtbarkeit und emotionale Resonanz.' },
  Earth: { kurzsignal: 'Stabile Phase \u2014 guter Boden f\u00fcr Entscheidungen', treiber: ['Innere Ruhe', 'Praktischer Fokus', 'Verl\u00e4sslichkeit'], erklaerung: 'Erd-Energie gibt dir Bodenhaftung und klare Orientierung.' },
  Metal: { kurzsignal: 'Klarheit und Struktur \u2014 guter Moment f\u00fcr Ordnung', treiber: ['Analytische Sch\u00e4rfe', 'Reduktion auf das Wesentliche', 'Disziplin'], erklaerung: 'Metall-Energie unterst\u00fctzt Fokus und bewusste Entscheidungen.' },
  Water: { kurzsignal: 'Intuitive Phase \u2014 vertraue deinem Gesp\u00fcr', treiber: ['Tiefe Wahrnehmung', 'Emotionale Sensibilit\u00e4t', 'Reflexion'], erklaerung: 'Wasser-Energie verst\u00e4rkt deine intuitive Wahrnehmung und innere Tiefe.' },
};

// Zodiac sector index (0-11) → Wu-Xing element (Aries=0, Taurus=1, ... Pisces=11)
const SECTOR_ELEMENT = ['Fire', 'Earth', 'Metal', 'Water', 'Wood', 'Fire', 'Earth', 'Metal', 'Water', 'Wood', 'Fire', 'Earth'];

function dominantElementFromSoulprint(sectors) {
  if (!Array.isArray(sectors) || sectors.length !== 12) return 'Fire';
  const totals = { Fire: 0, Earth: 0, Metal: 0, Water: 0, Wood: 0 };
  for (let i = 0; i < 12; i++) {
    totals[SECTOR_ELEMENT[i]] += (sectors[i] || 0);
  }
  let maxEl = 'Fire';
  let maxVal = -1;
  for (const [el, val] of Object.entries(totals)) {
    if (val > maxVal) { maxVal = val; maxEl = el; }
  }
  return maxEl;
}

function vibesCacheKey(userId) {
  return `vibes:${userId}`;
}

app.post('/api/vibes', requireUserAuth, attachUserTier, async (req, res) => {
  try {
    const userId = req.userId;

    // ── Determine cooldown based on premium status ───────────────────
    const isPremium = req.userTier === 'premium';
    const cooldownMs = isPremium ? VIBES_COOLDOWN_PREMIUM : VIBES_COOLDOWN_FREE;

    // ── L1: In-memory cache + cooldown check ────────────────────────
    const cacheKey = vibesCacheKey(userId);
    if (vibesCache.has(cacheKey)) {
      const cached = vibesCache.get(cacheKey);
      const elapsed = Date.now() - cached.timestamp;
      if (elapsed < cooldownMs) {
        const nextAvailableAt = new Date(cached.timestamp + cooldownMs).toISOString();
        const payload = {
          ...cached.data,
          meta: { ...cached.data.meta, cached: true },
          cooldown: { active: true, next_available_at: nextAvailableAt, remaining_ms: cooldownMs - elapsed },
        };
        return res.json(payload);
      }
    }

    // ── L2: Supabase vibes_cache check ───────────────────────────────
    const timeSlot = new Date().toISOString().slice(0, 13); // hour-level slot for DB key
    if (supabaseServer) {
      try {
        const { data: dbCached } = await supabaseServer
          .from('vibes_cache')
          .select('payload_json, generated_at')
          .eq('user_id', userId)
          .eq('time_slot', timeSlot)
          .eq('engine_version', 'v1-gemini-vibes')
          .maybeSingle();

        if (dbCached?.payload_json) {
          const generatedAt = dbCached.generated_at
            ? new Date(dbCached.generated_at).getTime()
            : Date.now();
          const elapsed = Date.now() - generatedAt;
          // Populate L1 cache with the correct generated_at timestamp
          vibesCache.set(cacheKey, { data: dbCached.payload_json, timestamp: generatedAt });
          if (elapsed < cooldownMs) {
            // Still in cooldown — return cached with cooldown info
            const nextAvailableAt = new Date(generatedAt + cooldownMs).toISOString();
            return res.json({
              ...dbCached.payload_json,
              meta: { ...dbCached.payload_json.meta, cached: true },
              cooldown: { active: true, next_available_at: nextAvailableAt, remaining_ms: cooldownMs - elapsed },
            });
          }
          // Cooldown expired — fall through to generation
        }
      } catch (e) {
        console.warn('[vibes] L2 cache read failed, continuing to generation:', e.message);
      }
    }

    // ── Load user data ───────────────────────────────────────────────
    let soulprintSectors = null;
    let sunSign = null;
    let moonSign = null;
    let ascSign = null;

    if (supabaseServer) {
      const { data: profile } = await supabaseServer
        .from('astro_profiles')
        .select('soulprint_sectors, sun_sign, moon_sign, asc_sign, astro_json')
        .eq('user_id', userId)
        .single();

      if (profile) {
        soulprintSectors = profile.soulprint_sectors
          || deriveSoulprintSectors(profile.astro_json, userId);
        sunSign = profile.sun_sign || null;
        moonSign = profile.moon_sign || null;
        ascSign = profile.asc_sign || null;
      }
    }

    // Fallback soulprint if no profile
    if (!soulprintSectors || !Array.isArray(soulprintSectors) || soulprintSectors.length !== 12) {
      soulprintSectors = deriveSoulprintSectors(null, userId);
    }

    // ── Load space weather from existing cache ───────────────────────
    let spaceWeatherSummary = 'Keine aktuelle Weltraumwetter-Daten verfügbar.';
    if (spaceWeatherCache?.payload) {
      const sw = spaceWeatherCache.payload;
      const kp = Number(sw.kp_index ?? sw.kp ?? 0);
      spaceWeatherSummary = `Kp-Index: ${kp}, Quelle: ${sw.source || 'NOAA'}`;
      if (sw.xray_class) spaceWeatherSummary += `, Röntgen-Klasse: ${sw.xray_class}`;
      if (sw.f107) spaceWeatherSummary += `, F10.7: ${sw.f107}`;
    }
    // Also check the extended cache
    if (extendedWeatherCache?.payload) {
      const ext = extendedWeatherCache.payload;
      if (ext.kp?.current) spaceWeatherSummary = `Kp-Index: ${ext.kp.current}`;
      if (ext.xray?.class) spaceWeatherSummary += `, Röntgen: ${ext.xray.class}`;
      if (ext.events?.length > 0) {
        spaceWeatherSummary += `, Aktive Events: ${ext.events.map(e => e.type).join(', ')}`;
      }
    }

    const dominantElement = dominantElementFromSoulprint(soulprintSectors);

    // ── Gemini generation or fallback ────────────────────────────────
    if (!geminiClient) {
      console.warn('[vibes] Gemini API key missing, returning deterministic fallback');
      const fb = VIBES_FALLBACK[dominantElement] || VIBES_FALLBACK.Fire;
      const fallbackPayload = {
        timestamp: new Date().toISOString(),
        horizon: '2-3h',
        kurzsignal: fb.kurzsignal,
        treiber: fb.treiber,
        erklaerung: fb.erklaerung,
        explain: {
          signatur_context: `Dominantes Element: ${dominantElement}`,
          transit_context: spaceWeatherSummary,
        },
        meta: { engine_version: 'v1-gemini-vibes', cached: false },
      };
      vibesCache.set(cacheKey, { data: fallbackPayload, timestamp: Date.now() });
      return res.json(fallbackPayload);
    }

    // ── Construct Gemini prompt ──────────────────────────────────────
    const prompt = `Du bist Bazodiac's Vibes-Engine. Du generierst ein kurzes, ressourcenorientiertes Stimmungsbild für die nächsten 2-3 Stunden.

EINGABEDATEN:
- Soulprint-Sektoren (12 Zodiak-Sektoren, 0-1): ${JSON.stringify(soulprintSectors)}
- Sonnenzeichen: ${sunSign || 'unbekannt'}
- Mondzeichen: ${moonSign || 'unbekannt'}
- Aszendent: ${ascSign || 'unbekannt'}
- Dominantes Wu-Xing Element: ${dominantElement}
- Weltraumwetter: ${spaceWeatherSummary}
- Aktuelle Zeit: ${new Date().toISOString()}

AUSGABE: Striktes JSON mit dieser exakten Struktur:
{
  "kurzsignal": "Ein Satz — die Kernstimmung der nächsten 2-3 Stunden",
  "treiber": ["Label 1", "Label 2", "Label 3"],
  "erklaerung": "1-2 Sätze Erklärung, warum diese Stimmung gerade da ist",
  "explain": {
    "signatur_context": "1-2 Sätze über die Signatur des Users und was sie gerade bedeutet",
    "transit_context": "1-2 Sätze über die aktuelle kosmische Konstellation"
  }
}

REGELN:
1. Sprache: Deutsch
2. KEINE unerklärten Zahlen im Output
3. Ressourcenorientierte Sprache: verwende "Tendenz", "kann", "begünstigt", "Phase" — NIEMALS "wird", "Schicksal", "muss", "bestimmt"
4. kurzsignal: GENAU 1 Satz, maximal 60 Zeichen
5. treiber: 3-5 kurze Labels (je 2-4 Worte), keine ganzen Sätze
6. erklaerung: 1-2 Sätze, alltagsnah formuliert
7. explain.signatur_context: Bezug zur Signatur des Users, ohne Fachjargon
8. explain.transit_context: Bezug zur aktuellen Konstellation/Weltraumwetter
9. KEINE Planetennamen (Mars, Venus etc.), KEIN "die Sterne sagen", KEIN esoterischer Jargon
10. JEDE Aussage muss logisch aus den Eingabedaten ableitbar sein: Soulprint-Sektoren, Transitdaten, Western/BaZi/Fusion/Wu-Xing Interpretation. KEINE generischen Motivationssprüche oder Fülltext.
11. Formuliere möglichst abwechslungsreich und mit variierender Wortwahl und Perspektive, sodass die Antwort frisch wirkt.
12. Output MUSS valides JSON sein. KEIN Markdown, KEINE Code-Blöcke. Direkt mit { beginnen.`;

    const model = geminiClient.models;
    const result = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const rawText =
      typeof result?.text === 'string'
        ? result.text
        : typeof result?.response?.text === 'string'
          ? result.response.text
          : undefined;
    let jsonStr = rawText?.trim() || '';

    if (!jsonStr) {
      console.error('[vibes] Empty response text from model, falling back');
      const fb = VIBES_FALLBACK[dominantElement] || VIBES_FALLBACK.Fire;
      return res.json({
        timestamp: new Date().toISOString(),
        horizon: '2-3h',
        ...fb,
        explain: {
          signatur_context: `Dominantes Element: ${dominantElement}`,
          transit_context: spaceWeatherSummary,
        },
        meta: { engine_version: 'v1-gemini-vibes', cached: false },
      });
    }

    jsonStr = extractJsonPayload(jsonStr);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn('[vibes] Model JSON parse failed, returning deterministic fallback:', parseErr?.message || parseErr);
      const fb = VIBES_FALLBACK[dominantElement] || VIBES_FALLBACK.Fire;
      const fallbackPayload = {
        timestamp: new Date().toISOString(),
        horizon: '2-3h',
        kurzsignal: fb.kurzsignal,
        treiber: fb.treiber,
        erklaerung: fb.erklaerung,
        explain: {
          signatur_context: `Dominantes Element: ${dominantElement}`,
          transit_context: spaceWeatherSummary,
        },
        meta: { engine_version: 'v1-gemini-vibes', cached: false },
      };
      vibesCache.set(cacheKey, { data: fallbackPayload, timestamp: Date.now() });
      return res.status(200).json(fallbackPayload);
    }

    // ── Guard: reject Gemini text fields containing bare numbers ────────
    const fb = VIBES_FALLBACK[dominantElement] || VIBES_FALLBACK.Fire;
    const rawKurzsignal = parsed.kurzsignal || fb.kurzsignal || '';
    const rawErklaerung = parsed.erklaerung || fb.erklaerung || '';
    const rawSignaturCtx = parsed.explain?.signatur_context || `Dominantes Element: ${dominantElement}`;
    const rawTransitCtx = parsed.explain?.transit_context || spaceWeatherSummary;

    if (containsBareNumbers(rawKurzsignal)) {
      console.warn('[vibes] Guard: bare numbers in kurzsignal, substituting fallback');
    }
    if (containsBareNumbers(rawErklaerung)) {
      console.warn('[vibes] Guard: bare numbers in erklaerung, substituting fallback');
    }
    if (containsBareNumbers(rawSignaturCtx)) {
      console.warn('[vibes] Guard: bare numbers in signatur_context, substituting fallback');
    }
    if (containsBareNumbers(rawTransitCtx)) {
      console.warn('[vibes] Guard: bare numbers in transit_context, substituting fallback');
    }

    // Assemble full payload with envelope
    const vibesPayload = {
      timestamp: new Date().toISOString(),
      horizon: '2-3h',
      kurzsignal: containsBareNumbers(rawKurzsignal) ? fb.kurzsignal : rawKurzsignal,
      treiber: Array.isArray(parsed.treiber) ? parsed.treiber.slice(0, 5) : fb.treiber || [],
      erklaerung: containsBareNumbers(rawErklaerung) ? fb.erklaerung : rawErklaerung,
      explain: {
        signatur_context: containsBareNumbers(rawSignaturCtx) ? `Dominantes Element: ${dominantElement}` : rawSignaturCtx,
        transit_context: containsBareNumbers(rawTransitCtx) ? spaceWeatherSummary : rawTransitCtx,
      },
      meta: { engine_version: 'v1-gemini-vibes', cached: false },
    };

    // ── L1: Store in memory ──────────────────────────────────────────
    vibesCache.set(cacheKey, { data: vibesPayload, timestamp: Date.now() });

    // ── L2: Fire-and-forget Supabase upsert ──────────────────────────
    if (supabaseServer) {
      supabaseServer
        .from('vibes_cache')
        .upsert({
          user_id: userId,
          time_slot: timeSlot,
          engine_version: 'v1-gemini-vibes',
          payload_json: vibesPayload,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,time_slot,engine_version' })
        .then(({ error }) => {
          if (error) console.warn('[vibes] DB cache upsert failed:', error.message);
        })
        .catch((e) => {
          console.warn('[vibes] DB cache upsert threw:', e?.message || e);
        });
    }

    // ── L1: Evict stale vibes entries (older than max cooldown) ─────
    const now = Date.now();
    const maxCooldown = VIBES_COOLDOWN_FREE; // evict after the longer cooldown
    const expired = [...vibesCache.entries()]
      .filter(([, entry]) => now - entry.timestamp > maxCooldown)
      .map(([key]) => key);
    expired.forEach(key => vibesCache.delete(key));

    return res.status(200).json(vibesPayload);
  } catch (err) {
    console.error('[vibes] Error:', err.message);
    return res.status(502).json({ error: 'experience_unavailable' });
  }
});

// ── /api/weekly-insights ─────────────────────────────────────────────
// Weekly life-area insights (7 areas, top-3 highlighted).
// Uses Gemini for generation with L1 (in-memory) + L2 (Supabase weekly_insights_cache) caching.
// Cache key is ISO week — valid for entire week, refreshes on Monday boundary.

app.post('/api/weekly-insights', requireUserAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const isoWeek = getISOWeek();

    // ── L1: In-memory cache check ────────────────────────────────────
    const cacheKey = `weekly:${userId}:${isoWeek}`;
    if (weeklyCache.has(cacheKey)) {
      const cached = weeklyCache.get(cacheKey);
      const payload = { ...cached.data, meta: { ...cached.data.meta, cached: true } };
      return res.json(payload);
    }

    // ── L2: Supabase weekly_insights_cache check ─────────────────────
    if (supabaseServer) {
      try {
        const { data: dbCached } = await supabaseServer
          .from('weekly_insights_cache')
          .select('payload_json')
          .eq('user_id', userId)
          .eq('iso_week', isoWeek)
          .eq('engine_version', 'v1-gemini-weekly')
          .maybeSingle();

        if (dbCached?.payload_json) {
          weeklyCache.set(cacheKey, { data: dbCached.payload_json });
          const payload = { ...dbCached.payload_json, meta: { ...dbCached.payload_json.meta, cached: true } };
          return res.json(payload);
        }
      } catch (e) {
        console.warn('[weekly] L2 cache read failed, continuing to generation:', e.message);
      }
    }

    // ── Load user data ───────────────────────────────────────────────
    let soulprintSectors = null;
    let sunSign = null;
    let moonSign = null;
    let ascSign = null;

    if (supabaseServer) {
      const { data: profile } = await supabaseServer
        .from('astro_profiles')
        .select('soulprint_sectors, sun_sign, moon_sign, asc_sign, astro_json')
        .eq('user_id', userId)
        .single();

      if (profile) {
        soulprintSectors = profile.soulprint_sectors
          || deriveSoulprintSectors(profile.astro_json, userId);
        sunSign = profile.sun_sign || null;
        moonSign = profile.moon_sign || null;
        ascSign = profile.asc_sign || null;
      }
    }

    // Fallback soulprint if no profile
    if (!soulprintSectors || !Array.isArray(soulprintSectors) || soulprintSectors.length !== 12) {
      soulprintSectors = deriveSoulprintSectors(null, userId);
    }

    // ── Load transit sectors (from transit-state logic or null) ──────
    let transitSectors = null;
    // Derive a simple transit modulation from current date to provide weekly variation.
    // In production this would come from BAFE transit endpoint or cached transit-state.
    // For now, generate a deterministic per-week variation using the ISO week string.
    const weekHash = isoWeek.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffff, 0);
    transitSectors = Array.from({ length: 12 }, (_, i) => {
      const seed = ((weekHash * (i + 1) * 2654435761) >>> 0) / 0xffffffff;
      return 0.2 + seed * 0.6; // range 0.2 – 0.8
    });

    // ── Compute life area scores ────────────────────────────────────
    const blended = blendSectorsForWeeklyServer(soulprintSectors, transitSectors);
    const areaScores = computeLifeAreaScoresServer(blended);

    // ── Gemini generation or fallback ────────────────────────────────
    if (!geminiClient) {
      console.warn('[weekly] Gemini API key missing, returning deterministic fallback');
      const fallbackAreas = buildWeeklyFallbackAreas(areaScores);
      const fallbackPayload = {
        week: isoWeek,
        areas: fallbackAreas,
        meta: { engine_version: 'v1-gemini-weekly', cached: false },
      };
      weeklyCache.set(cacheKey, { data: fallbackPayload });
      return res.json(fallbackPayload);
    }

    // ── Construct Gemini prompt ──────────────────────────────────────
    const areasForPrompt = areaScores.map((a) => ({
      key: a.key,
      label_de: a.label.de,
      rank: a.rank,
      isHighlighted: a.isHighlighted,
    }));

    const prompt = `Du bist Bazodiac's Weekly-Insights-Engine. Du generierst wöchentliche Einblicke für 7 Lebensbereiche, basierend auf der Signatur des Users und der Wochenkonstellation.

EINGABEDATEN:
- Lebensbereiche mit Ranking: ${JSON.stringify(areasForPrompt)}
- Sonnenzeichen: ${sunSign || 'unbekannt'}
- Mondzeichen: ${moonSign || 'unbekannt'}
- Aszendent: ${ascSign || 'unbekannt'}
- Aktuelle Woche: ${isoWeek}

AUSGABE: Striktes JSON mit dieser exakten Struktur:
{
  "areas": [
    {
      "key": "<area key>",
      "statement": "Ein kurzer Satz zur Tendenz dieser Woche in diesem Bereich",
      "tendency": "Ein-Wort- oder Zwei-Wort-Tendenzlabel",
      "explain": "Ein Satz, der erklärt, warum diese Tendenz gerade da ist"
    }
  ]
}

REGELN:
1. Sprache: Deutsch
2. Für JEDEN der 7 Bereiche genau ein Objekt im "areas"-Array, in dieser Reihenfolge der keys: freundschaften, liebe, sex_zaertlichkeit, beruf, alltag, karriere, gesundheit
3. "statement": GENAU 1 Satz, maximal 80 Zeichen. Ressourcenorientiert — "Phase", "Tendenz", "begünstigt", "kann"
4. "tendency": 1-2 Wörter als Label (z.B. "Intensität", "Offenheit", "Rückzug", "Klarheit")
5. Für die Top-3 Bereiche (isHighlighted=true, Rang ${areaScores.filter(a => a.isHighlighted).map(a => a.label.de).join(', ')}): Der "explain"-Satz soll TIEFERE Einsicht bieten — Bezug zur persönlichen Signatur des Users
6. Für die anderen 4 Bereiche: "explain" darf kürzer und allgemeiner sein
7. KEINE unerklärten Zahlen, KEINE Prozente, KEINE Scores im Output
8. KEINE Planetennamen, KEIN "die Sterne sagen", KEIN esoterischer Jargon
9. Ressourcenorientierte Sprache: NIEMALS "wird", "Schicksal", "muss", "bestimmt"
10. Output MUSS valides JSON sein. KEIN Markdown, KEINE Code-Blöcke. Direkt mit { beginnen.`;

    const model = geminiClient.models;
    const result = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    });

    const rawText =
      typeof result?.text === 'string'
        ? result.text
        : typeof result?.response?.text === 'string'
          ? result.response.text
          : undefined;
    let jsonStr = rawText?.trim() || '';

    if (!jsonStr) {
      console.error('[weekly] Empty response text from model, falling back');
      const fallbackPayload = {
        week: isoWeek,
        areas: buildWeeklyFallbackAreas(areaScores),
        meta: { engine_version: 'v1-gemini-weekly', cached: false },
      };
      weeklyCache.set(cacheKey, { data: fallbackPayload });
      return res.status(200).json(fallbackPayload);
    }

    jsonStr = extractJsonPayload(jsonStr);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn('[weekly] Model JSON parse failed, returning fallback:', parseErr?.message || parseErr);
      const fallbackPayload = {
        week: isoWeek,
        areas: buildWeeklyFallbackAreas(areaScores),
        meta: { engine_version: 'v1-gemini-weekly', cached: false },
      };
      weeklyCache.set(cacheKey, { data: fallbackPayload });
      return res.status(200).json(fallbackPayload);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.areas)) {
      console.warn('[weekly] Model JSON shape invalid, returning fallback');
      const fallbackPayload = {
        week: isoWeek,
        areas: buildWeeklyFallbackAreas(areaScores),
        meta: { engine_version: 'v1-gemini-weekly', cached: false },
      };
      weeklyCache.set(cacheKey, { data: fallbackPayload });
      return res.status(200).json(fallbackPayload);
    }
    const geminiAreas = parsed.areas;

    // Merge Gemini output with computed scores (guard: reject bare numbers)
    const mergedAreas = areaScores.map((area) => {
      const geminiArea = geminiAreas.find(g => g.key === area.key);
      const tpl = WEEKLY_FALLBACK_TEMPLATES[area.key] || WEEKLY_FALLBACK_TEMPLATES.alltag;

      const rawStatement = geminiArea?.statement || tpl.statement;
      const rawExplain = geminiArea?.explain
        || (area.isHighlighted ? tpl.explain : 'Diese Tendenz entsteht aus der aktuellen Konstellation in Verbindung mit deiner persönlichen Struktur.');

      if (containsBareNumbers(rawStatement)) {
        console.warn(`[weekly] Guard: bare numbers in statement for area "${area.key}", substituting fallback`);
      }
      if (containsBareNumbers(rawExplain)) {
        console.warn(`[weekly] Guard: bare numbers in explain for area "${area.key}", substituting fallback`);
      }

      return {
        key: area.key,
        label: area.label,
        statement: containsBareNumbers(rawStatement) ? tpl.statement : rawStatement,
        tendency: geminiArea?.tendency || tpl.tendency,
        score: area.score,
        rank: area.rank,
        isHighlighted: area.isHighlighted,
        explain: containsBareNumbers(rawExplain)
          ? (area.isHighlighted ? tpl.explain : 'Diese Tendenz entsteht aus der aktuellen Konstellation in Verbindung mit deiner persönlichen Struktur.')
          : rawExplain,
      };
    });

    const weeklyPayload = {
      week: isoWeek,
      areas: mergedAreas,
      meta: { engine_version: 'v1-gemini-weekly', cached: false },
    };

    // ── L1: Store in memory ──────────────────────────────────────────
    weeklyCache.set(cacheKey, { data: weeklyPayload });

    // ── L2: Fire-and-forget Supabase upsert ──────────────────────────
    if (supabaseServer) {
      supabaseServer
        .from('weekly_insights_cache')
        .upsert({
          user_id: userId,
          iso_week: isoWeek,
          engine_version: 'v1-gemini-weekly',
          payload_json: weeklyPayload,
        }, { onConflict: 'user_id,iso_week,engine_version' })
        .then(({ error }) => {
          if (error) console.warn('[weekly] DB cache upsert failed:', error.message);
        })
        .catch((e) => {
          console.warn('[weekly] DB cache upsert threw:', e?.message || e);
        });
    }

    // ── L1: Evict stale weekly entries (different week) ──────────────
    const currentWeekSuffix = `:${isoWeek}`;
    const stale = [...weeklyCache.keys()].filter(k => !k.endsWith(currentWeekSuffix));
    stale.forEach(key => weeklyCache.delete(key));

    return res.status(200).json(weeklyPayload);
  } catch (err) {
    console.error('[weekly] Error:', err.message);
    return res.status(502).json({ error: 'weekly_insights_unavailable' });
  }
});

// ── /api/contribute ──────────────────────────────────────────────────
// Persists quiz sector weights to contribution_events table.
// Authenticated via Supabase JWT. Upserts on (user_id, module_id).
app.post("/api/contribute", async (req, res) => {
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
      solar_pressure_score: deriveSolarPressureFromKp(0),
      source: "fallback",
      fetched_at: new Date().toISOString(),
      cache_ttl_seconds: Math.round(SPACE_WEATHER_CACHE_TTL_MS / 1000),
    });
  }

  const payload = {
    ...result,
    solar_pressure_score: deriveSolarPressureFromKp(result.kp_index ?? result.kp),
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
app.post("/api/contribution/space-weather", async (req, res) => {
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
app.post("/api/webhook/chart", (req, res) => {
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
          headers: method === "POST" ? bafeDirectHeaders() : {},
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

// ── GET /api/profile/:userId — ElevenLabs Custom Tool endpoint ──────
app.get("/api/profile/:userId", async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  // Only log auth failures — never log success/token match details in production

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const { userId } = req.params;

  // Determine which agent is requesting the profile — uses global VALID_AGENT_TYPES (REQ-MNT-agent-extensibility)
  const rawAgentType = req.query.agent_type ?? req.query.agent;
  const agentType = rawAgentType === undefined ? 'levi' : String(rawAgentType);
  if (!VALID_AGENT_TYPES.includes(agentType)) {
    return res.status(400).json({ error: 'invalid_agent_type' });
  }

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

  // DEC-display-name-db-only: read display_name from profiles, not from engine response
  let displayName = null;
  const { data: profileRow, error: displayNameError } = await supabaseServer
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (displayNameError) {
    console.warn("[profile] display_name fetch failed:", displayNameError.message);
  } else {
    displayName = profileRow?.display_name || null;
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

  // ── Signatur V2 enriched context for voice agent personalization ──
  const ELEMENT_DESCRIPTIONS_DE = {
    wood:  { label: 'Holz',   desc: 'Wachstum, Kreativitaet und Erneuerung' },
    fire:  { label: 'Feuer',  desc: 'Leidenschaft, Ausdruck und Transformation' },
    earth: { label: 'Erde',   desc: 'Stabilitaet, Fuersorglichkeit und Erdung' },
    metal: { label: 'Metall', desc: 'Struktur, Klarheit und Praezision' },
    water: { label: 'Wasser', desc: 'Tiefe, Intuition und Anpassungsfaehigkeit' },
  };

  const domEl = (wuxing.dominant_element || '').toLowerCase();
  const elInfo = ELEMENT_DESCRIPTIONS_DE[domEl] || null;

  const signatur_summary = elInfo
    ? `Deine Signatur betont ${elInfo.label} — ${elInfo.desc}.`
    : dominant_planet
      ? `Deine Signatur wird von ${dominant_planet} dominiert.`
      : null;

  // Day mode: check daily horoscope cache for today's pulse/trace
  let day_mode_context = null;
  if (supabaseServer) {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: dailyCache } = await supabaseServer
        .from('daily_horoscope_cache')
        .select('payload_json')
        .eq('user_id', userId)
        .eq('local_date', todayStr)
        .maybeSingle();
      if (dailyCache?.payload_json?.fusion) {
        const f = dailyCache.payload_json.fusion;
        day_mode_context = {
          mode: f.day_mode || null,
          harmony_index: f.harmony_index ?? null,
          synthesis: f.synthesis || null,
        };
      }
    } catch (e) {
      console.warn('[profile] daily cache lookup failed:', e.message);
    }
  }

  // Vibes summary: check latest vibes cache for Kurzsignal
  let vibes_summary = null;
  if (supabaseServer) {
    try {
      const { data: vibesRow } = await supabaseServer
        .from('vibes_cache')
        .select('payload_json')
        .eq('user_id', userId)
        .order('time_slot', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (vibesRow?.payload_json) {
        const vp = vibesRow.payload_json;
        vibes_summary = vp.kurzsignal || vp.vibe?.kurzsignal || null;
      }
    } catch (e) {
      console.warn('[profile] vibes cache lookup failed:', e.message);
    }
  }

  // Fetch past conversation summaries for session continuity
  let pastConversations = [];
  try {
    const { data: convos, error: convosError } = await supabaseServer
      .from("agent_conversations")
      .select("summary, topics, created_at")
      .eq("user_id", userId)
      .eq("agent_type", agentType)
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
    display_name: displayName,
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

    // Signatur V2 enriched context
    dominant_element_detail: elInfo
      ? { element: domEl, label: elInfo.label, description: elInfo.desc }
      : null,
    signatur_summary,
    day_mode: day_mode_context,
    vibes_summary,

    // Past conversation summaries for session continuity
    past_conversations: pastConversations,
  });
});

// ── POST /api/agent/conversation — Save agent conversation summary ──
app.post("/api/agent/conversation", async (req, res) => {
  // Verify bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const { user_id, summary, topics, agent_type } = req.body;

  if (!user_id || !summary) {
    return res.status(400).json({ error: "user_id and summary are required" });
  }

  // Validate agent_type — default to 'levi' for backward compatibility. Uses global VALID_AGENT_TYPES.
  const resolvedAgentType = agent_type === undefined ? 'levi' : agent_type;
  if (!VALID_AGENT_TYPES.includes(resolvedAgentType)) {
    return res.status(400).json({ error: 'invalid_agent_type' });
  }

  const { error } = await supabaseServer
    .from("agent_conversations")
    .insert({
      user_id,
      summary,
      topics: topics || [],
      agent_type: resolvedAgentType,
    });

  if (error) {
    console.error("[agent/conversation] Supabase error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ status: "saved" });
});

// ── GET /api/agent/daily/:userId — Daily horoscope for ElevenLabs agent ──
app.get("/api/agent/daily/:userId", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const { userId } = req.params;

  // 1. Fetch user astro profile
  const { data: profile, error: profileErr } = await supabaseServer
    .from("astro_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileErr) {
    if (profileErr.code === "PGRST116") {
      return res.status(404).json({ error: "Profile not found" });
    }
    console.error("[agent/daily] profile error:", profileErr);
    return res.status(500).json({ error: profileErr.message });
  }

  // 2. Build daily request payload for FuFirE
  if (!profile.birth_date) {
    return res.status(422).json({ error: "Profile is missing birth_date — cannot compute daily horoscope" });
  }
  const today = new Date().toISOString().slice(0, 10);
  const birthTime = profile.birth_time || "12:00:00";
  const birthTimeFormatted = birthTime.length === 5 ? `${birthTime}:00` : birthTime;

  const soulprintSectors = Array.isArray(profile.soulprint_sectors) && profile.soulprint_sectors.length === 12
    ? profile.soulprint_sectors
    : new Array(12).fill(1 / 12);

  const quizSectors = Array.isArray(profile.quiz_sectors) && profile.quiz_sectors.length === 12
    ? profile.quiz_sectors
    : soulprintSectors;

  const dailyPayload = {
    birth: {
      date: profile.birth_date,
      time: birthTimeFormatted,
      tz: profile.iana_time_zone || "Europe/Berlin",
      lat: profile.birth_lat || 52.52,
      lon: profile.birth_lng || 13.405,
      place_label: profile.birth_place_name || null,
    },
    soulprint_sectors: soulprintSectors,
    quiz_sectors: quizSectors,
    target_date: today,
    locale: "de-DE",
  };

  // 3. Call FuFirE /experience/daily
  const bafeUrl = BAFE_INTERNAL_URL || BAFE_PUBLIC_URL;
  try {
    const dailyRes = await fetchWithRetry(`${bafeUrl}/experience/daily`, {
      method: "POST",
      headers: bafeDirectHeaders(),
      body: JSON.stringify(dailyPayload),
      signal: AbortSignal.timeout(12000),
    });

    if (!dailyRes.ok) {
      const errBody = await dailyRes.text().catch(() => "");
      console.error(`[agent/daily] FuFirE error ${dailyRes.status}:`, errBody);
      return res.status(502).json({ error: "Daily horoscope calculation failed", detail: errBody });
    }

    const dailyData = await dailyRes.json();

    // 4. Compute day_mode from harmony if not present in fusion
    const fusionData = dailyData.fusion || {};
    const harmonyRaw = fusionData.harmony_index ?? 0.5;
    const dayMode = fusionData.day_mode || (harmonyRaw < 0.5 ? "pulse" : "trace");

    // 5. Build agent-friendly response
    res.json({
      date: dailyData.date || today,
      day_mode: dayMode,
      harmony_index: harmonyRaw,
      western: {
        summary: dailyData.western?.summary || "",
        themes: dailyData.western?.themes || [],
        caution: dailyData.western?.caution || "",
        opportunity: dailyData.western?.opportunity || "",
      },
      eastern: {
        summary: dailyData.eastern?.summary || "",
        themes: dailyData.eastern?.themes || [],
        caution: dailyData.eastern?.caution || "",
        opportunity: dailyData.eastern?.opportunity || "",
        day_master_relation: dailyData.eastern?.evidence?.relation_to_day_master || null,
        daily_pillar: dailyData.eastern?.evidence?.daily_pillar || null,
      },
      fusion: {
        summary: fusionData.summary || "",
        synthesis: fusionData.synthesis || "",
        action: fusionData.action || "",
      },
      user_context: {
        sun_sign: profile.sun_sign,
        moon_sign: profile.moon_sign,
        ascendant: profile.asc_sign,
        day_master: (profile.astro_json?.bafe?.bazi?.day_master) || (profile.astro_json?.bazi?.day_master) || null,
      },
    });
  } catch (fetchErr) {
    console.error("[agent/daily] fetch error:", fetchErr.message);
    return res.status(502).json({ error: "Could not reach calculation engine" });
  }
});

// ── POST /api/agent/match — Partner match analysis for ElevenLabs agent ──
app.post("/api/agent/match", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!ELEVENLABS_TOOL_SECRET || token !== ELEVENLABS_TOOL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabaseServer) {
    return res.status(500).json({ error: "Supabase not configured on server" });
  }

  const {
    user_id,
    partner_birth_date,
    partner_birth_time,
    partner_birth_place,
    partner_time_known = true,
    agent_type = "eve",
  } = req.body;

  if (!user_id || !partner_birth_date || !partner_birth_place) {
    return res.status(400).json({
      error: "Missing required fields: user_id, partner_birth_date, partner_birth_place",
    });
  }

  // 1. Fetch user profile
  const { data: userProfile, error: userErr } = await supabaseServer
    .from("astro_profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (userErr) {
    if (userErr.code === "PGRST116") {
      return res.status(404).json({ error: "User profile not found" });
    }
    return res.status(500).json({ error: userErr.message });
  }

  const bafeUrl = BAFE_INTERNAL_URL || BAFE_PUBLIC_URL;
  const birthTime = partner_birth_time || "12:00";

  // 2. Compute partner's full chart via FuFirE /api/webhooks/chart
  let partnerChart;
  try {
    const chartRes = await fetchWithRetry(`${bafeUrl}/api/webhooks/chart`, {
      method: "POST",
      headers: bafeDirectHeaders(),
      body: JSON.stringify({
        birthDate: partner_birth_date,
        birthTime: birthTime,
        birthPlace: partner_birth_place,
        ambiguousTime: "earlier",
        nonexistentTime: "shift_forward",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!chartRes.ok) {
      const errBody = await chartRes.text().catch(() => "");
      console.error(`[agent/match] FuFirE chart error ${chartRes.status}:`, errBody);
      return res.status(502).json({ error: "Partner chart calculation failed", detail: errBody });
    }

    partnerChart = await chartRes.json();
  } catch (fetchErr) {
    console.error("[agent/match] partner chart fetch error:", fetchErr.message);
    return res.status(502).json({ error: "Could not compute partner chart" });
  }

  // 3. Extract user's chart data from stored profile
  const raw = userProfile.astro_json || {};
  const bafe = raw.bafe || raw;
  const userBazi = bafe.bazi || {};
  const userWuxing = bafe.wuxing || {};

  const userChartSummary = {
    sun_sign: userProfile.sun_sign,
    moon_sign: userProfile.moon_sign,
    ascendant: userProfile.asc_sign,
    day_master: userBazi.day_master || null,
    bazi_pillars: userBazi.pillars
      ? Object.fromEntries(
          Object.entries(userBazi.pillars).map(([k, v]) => [
            k,
            {
              stem: v.stem || "?",
              branch: v.branch || "?",
              animal: v.animal || null,
              element: v.element || null,
            },
          ])
        )
      : null,
    wuxing_balance: userWuxing.element_percentages || userWuxing.balance || null,
  };

  // 4. Extract partner's chart data from FuFirE response
  const partnerSummary = {
    sun_sign: partnerChart.western?.sunSign || null,
    moon_sign: partnerChart.western?.moonSign || null,
    ascendant: partnerChart.western?.ascendantSign || null,
    day_master: partnerChart.eastern?.dayMaster || null,
    bazi_pillars: {
      year: { animal: partnerChart.eastern?.yearAnimal || null, element: partnerChart.eastern?.yearElement || null },
      month: { animal: partnerChart.eastern?.monthAnimal || null, element: partnerChart.eastern?.monthElement || null },
      day: { animal: partnerChart.eastern?.dayAnimal || null, element: partnerChart.eastern?.dayElement || null },
      hour: { animal: partnerChart.eastern?.hourAnimal || null, element: partnerChart.eastern?.hourElement || null },
    },
    wuxing_balance: partnerChart.fusion?.wuXingBazi || null,
  };

  // 5. Compute matching analysis
  const matchAnalysis = computeMatchAnalysis(userChartSummary, partnerSummary, partnerChart);

  // 6. Return structured response
  res.json({
    user_profile: userChartSummary,
    partner_profile: partnerSummary,
    match_analysis: matchAnalysis,
    meta: {
      partner_time_known: partner_time_known,
      uncertainty_note: partner_time_known
        ? null
        : "Geburtszeit des Partners unbekannt — Aszendent und Stundensaeule sind approximiert (12:00 Mittag).",
      agent_type: agent_type,
    },
  });
});

/**
 * Compute match analysis between two chart profiles.
 * Pure logic — no DB calls, no external APIs.
 */
function computeMatchAnalysis(userChart, partnerChart, partnerRawChart) {
  const ZODIAC_ORDER = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Loewe", "Jungfrau",
    "Waage", "Skorpion", "Schuetze", "Steinbock", "Wassermann", "Fische",
  ];

  function signIndex(sign) {
    if (!sign) return -1;
    const normalized = sign.replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ä/g, "ae");
    return ZODIAC_ORDER.findIndex((z) => z.toLowerCase() === normalized.toLowerCase());
  }

  function aspectBetween(sign1, sign2) {
    const i1 = signIndex(sign1);
    const i2 = signIndex(sign2);
    if (i1 < 0 || i2 < 0) return { aspect: "unbekannt", quality: "neutral", description: "Daten unvollstaendig." };

    const diff = Math.abs(i1 - i2);
    const arc = Math.min(diff, 12 - diff);
    const aspectMap = {
      0: { aspect: "Konjunktion", quality: "intensiv", description: "Gleiche Grundenergie — Verstaerkung und Spiegelung." },
      1: { aspect: "Halbsextil", quality: "neutral", description: "Leichte Reibung, die zur Anpassung einlaedt." },
      2: { aspect: "Sextil", quality: "harmonisch", description: "Natuerlicher Austausch und gegenseitige Unterstuetzung." },
      3: { aspect: "Quadrat", quality: "spannungsgeladen", description: "Produktive Reibung — Wachstum durch Herausforderung." },
      4: { aspect: "Trigon", quality: "harmonisch", description: "Tiefe Resonanz und muehehloser Energiefluss." },
      5: { aspect: "Quinkunx", quality: "justierend", description: "Unterschiedliche Wellenlaengen, die kreative Loesungen erfordern." },
      6: { aspect: "Opposition", quality: "polar", description: "Anziehung der Gegensaetze — Ergaenzung und Spannung zugleich." },
    };
    return aspectMap[arc] || { aspect: "unbekannt", quality: "neutral", description: "" };
  }

  const sunSun = aspectBetween(userChart.sun_sign, partnerChart.sun_sign);
  const moonMoon = aspectBetween(userChart.moon_sign, partnerChart.moon_sign);
  const sunMoonCross = aspectBetween(userChart.sun_sign, partnerChart.moon_sign);
  const ascAsc = aspectBetween(userChart.ascendant, partnerChart.ascendant);

  // Eastern Compatibility
  const STEM_ELEMENTS = {
    "\u7532": "Holz", "\u4E59": "Holz", "\u4E19": "Feuer", "\u4E01": "Feuer",
    "\u620A": "Erde", "\u5DF1": "Erde", "\u5E9A": "Metall", "\u8F9B": "Metall",
    "\u58EC": "Wasser", "\u7678": "Wasser",
  };
  const SHENG_CYCLE = { "Holz": "Feuer", "Feuer": "Erde", "Erde": "Metall", "Metall": "Wasser", "Wasser": "Holz" };
  const KE_CYCLE = { "Holz": "Erde", "Feuer": "Metall", "Erde": "Wasser", "Metall": "Holz", "Wasser": "Feuer" };

  function dayMasterRelation(dm1, dm2) {
    const e1 = STEM_ELEMENTS[dm1];
    const e2 = STEM_ELEMENTS[dm2];
    if (!e1 || !e2) return { relation: "unbekannt", description: "Daten unvollstaendig." };
    if (e1 === e2) return { relation: "Geschwister (比肩/劫财)", description: `Beide ${e1} — Gleichgesinnte, die um Raum konkurrieren koennen.` };
    if (SHENG_CYCLE[e1] === e2) return { relation: "Naehrend (生)", description: `${e1} naehrt ${e2} — natuerliche Unterstuetzung und Ressourcenfluss.` };
    if (SHENG_CYCLE[e2] === e1) return { relation: "Genaehrt (被生)", description: `${e2} naehrt ${e1} — Empfangen und Aufnehmen von Unterstuetzung.` };
    if (KE_CYCLE[e1] === e2) return { relation: "Regulierend (克)", description: `${e1} reguliert ${e2} — Formgebung, aber potenziell Kontrolldruck.` };
    if (KE_CYCLE[e2] === e1) return { relation: "Reguliert (被克)", description: `${e2} reguliert ${e1} — Herausforderung, die Disziplin erzwingt.` };
    return { relation: "neutral", description: "Keine direkte Sheng/Ke-Beziehung zwischen den Day Mastern." };
  }

  const dmRelation = dayMasterRelation(userChart.day_master, partnerChart.day_master);

  // Year pillar harmony (Liu-He / Liu-Chong)
  const LIU_HE = {
    "Ratte": "Rind", "Rind": "Ratte", "Tiger": "Schwein", "Schwein": "Tiger",
    "Hase": "Hund", "Hund": "Hase", "Drache": "Hahn", "Hahn": "Drache",
    "Schlange": "Affe", "Affe": "Schlange", "Pferd": "Schaf", "Schaf": "Pferd",
  };
  const LIU_CHONG = {
    "Ratte": "Pferd", "Pferd": "Ratte", "Rind": "Schaf", "Schaf": "Rind",
    "Tiger": "Affe", "Affe": "Tiger", "Hase": "Hahn", "Hahn": "Hase",
    "Drache": "Hund", "Hund": "Drache", "Schlange": "Schwein", "Schwein": "Schlange",
  };

  function yearPillarMatch(userPillars, partnerPillars) {
    const ua = userPillars?.year?.animal;
    const pa = partnerPillars?.year?.animal;
    if (!ua || !pa) return { harmony: "unbekannt", description: "Daten unvollstaendig." };
    if (LIU_HE[ua] === pa) return { harmony: "Liu-He (六合)", description: `${ua} und ${pa} bilden eine der sechs Harmonien — natuerliche Anziehung.` };
    if (LIU_CHONG[ua] === pa) return { harmony: "Liu-Chong (六冲)", description: `${ua} und ${pa} stehen im Clash — intensive Spannung, die Transformation erzwingen kann.` };
    return { harmony: "neutral", description: `${ua} und ${pa} haben keine direkte Harmonie- oder Clash-Beziehung.` };
  }

  const yearMatch = yearPillarMatch(userChart.bazi_pillars, partnerChart.bazi_pillars);

  // WuXing overlay
  function computeWuxingOverlay(userWuxing, partnerWuxing) {
    if (!userWuxing || !partnerWuxing) return { shared_strengths: [], complementary_gaps: [], friction_points: [] };
    const ELEMENTS = ["Holz", "Feuer", "Erde", "Metall", "Wasser"];
    const shared = [], complementary = [], friction = [];
    for (const elem of ELEMENTS) {
      const u = userWuxing[elem] || 0, p = partnerWuxing[elem] || 0;
      if (u > 0.25 && p > 0.25) shared.push(`${elem} ist bei beiden stark — gemeinsame Ressource.`);
      else if ((u > 0.25 && p < 0.15) || (p > 0.25 && u < 0.15)) {
        complementary.push(`${elem}: ${u > p ? "User" : "Partner"} bringt Staerke, die dem anderen fehlt.`);
      }
      if (u < 0.12 && p < 0.12) friction.push(`${elem} fehlt beiden — gemeinsames Defizit.`);
    }
    return { shared_strengths: shared, complementary_gaps: complementary, friction_points: friction };
  }

  const wuxinOverlay = computeWuxingOverlay(userChart.wuxing_balance, partnerChart.wuxing_balance);

  // Fusion score
  const qualityScores = { harmonisch: 0.85, intensiv: 0.7, polar: 0.6, justierend: 0.5, spannungsgeladen: 0.45, neutral: 0.6, unbekannt: 0.5 };
  const westernAspects = [sunSun, moonMoon, sunMoonCross, ascAsc];
  const westernScore = westernAspects.reduce((sum, a) => sum + (qualityScores[a.quality] || 0.5), 0) / westernAspects.length;
  const dmScore = dmRelation.relation.includes("Naehrend") || dmRelation.relation.includes("Genaehrt") ? 0.85
    : dmRelation.relation.includes("Geschwister") ? 0.7
    : dmRelation.relation.includes("Regulierend") || dmRelation.relation.includes("Reguliert") ? 0.5 : 0.6;
  const yearScore = yearMatch.harmony.includes("Liu-He") ? 0.9 : yearMatch.harmony.includes("Liu-Chong") ? 0.4 : 0.6;
  const harmonyScore = Math.round((westernScore * 0.4 + dmScore * 0.35 + yearScore * 0.25) * 100) / 100;

  const resonanceAnchors = [], growthEdges = [];
  for (const a of westernAspects) {
    if (a.quality === "harmonisch") resonanceAnchors.push(a.description);
    if (a.quality === "spannungsgeladen" || a.quality === "polar") growthEdges.push(a.description);
  }
  if (dmRelation.relation.includes("Naehrend") || dmRelation.relation.includes("Genaehrt")) resonanceAnchors.push(dmRelation.description);
  if (dmRelation.relation.includes("Regulierend") || dmRelation.relation.includes("Reguliert")) growthEdges.push(dmRelation.description);
  if (yearMatch.harmony.includes("Liu-He")) resonanceAnchors.push(yearMatch.description);
  if (yearMatch.harmony.includes("Liu-Chong")) growthEdges.push(yearMatch.description);
  wuxinOverlay.shared_strengths.forEach((s) => resonanceAnchors.push(s));
  wuxinOverlay.friction_points.forEach((f) => growthEdges.push(f));

  return {
    western_compatibility: { sun_sun: sunSun, moon_moon: moonMoon, sun_moon_cross: sunMoonCross, asc_asc: ascAsc },
    eastern_compatibility: { day_master_relation: dmRelation, year_pillar_match: yearMatch, wuxing_overlay: wuxinOverlay },
    fusion_match: {
      harmony_score: harmonyScore,
      resonance_anchors: resonanceAnchors,
      growth_edges: growthEdges,
      fusion_narrative: [
        resonanceAnchors.length > 0 ? `Anker: ${resonanceAnchors.slice(0, 3).join(" ")}` : "",
        growthEdges.length > 0 ? `Kanten: ${growthEdges.slice(0, 2).join(" ")}` : "",
        wuxinOverlay.complementary_gaps.length > 0 ? `Ergaenzungen: ${wuxinOverlay.complementary_gaps.slice(0, 2).join(" ")}` : "",
      ].filter(Boolean).join(" | "),
    },
  };
}

// ── POST /api/agent/summary — Auto-synthesize user profile from conversations ──
app.post("/api/agent/summary", requireUserAuth, async (req, res) => {
  if (!supabaseServer) {
    return res.status(500).json({ error: "Database not configured" });
  }

  const userId = req.userId;
  const REQUIRED_SESSIONS = 3;

  try {
    // Count total conversations for this user
    const { count, error: countError } = await supabaseServer
      .from("agent_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("[agent/summary] count error:", countError);
      return res.status(500).json({ error: countError.message });
    }

    const totalSessions = count || 0;

    if (totalSessions < REQUIRED_SESSIONS) {
      return res.json({
        summary: null,
        sessions_remaining: REQUIRED_SESSIONS - totalSessions,
        total_sessions: totalSessions,
      });
    }

    // Load last 3 conversations with summaries and topics
    const { data: convos, error: convosError } = await supabaseServer
      .from("agent_conversations")
      .select("summary, topics, agent_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (convosError) {
      console.error("[agent/summary] fetch error:", convosError);
      return res.status(500).json({ error: convosError.message });
    }

    // Build context for Gemini synthesis
    const conversationContext = convos
      .map((c, i) => {
        const topicsStr = Array.isArray(c.topics) && c.topics.length > 0
          ? c.topics.join(", ")
          : "keine Themen";
        return `Session ${i + 1} (${c.agent_type || 'levi'}): ${c.summary || 'Keine Zusammenfassung'}. Themen: ${topicsStr}`;
      })
      .join("\n");

    if (!geminiClient) {
      // Without Gemini, return a simple concatenation
      const fallbackSummary = convos
        .filter(c => c.summary)
        .map(c => c.summary)
        .join(" | ");
      return res.json({
        summary: fallbackSummary || null,
        sessions_remaining: 0,
        total_sessions: totalSessions,
        meta: { engine: "fallback" },
      });
    }

    // Call Gemini to synthesize a profile summary
    const prompt = `Du bist Bazodiac, eine Fusions-Astrologie-App. Basierend auf den letzten Gespraechen eines Nutzers mit den Sprach-Agenten Levi und Eve, erstelle ein praegnantes 2-Satz-Profil auf Deutsch. Das Profil soll die Persoenlichkeit, wiederkehrende Themen und astrologische Interessen des Nutzers zusammenfassen. Antworte NUR mit den 2 Saetzen, ohne Anrede oder Erklaerung.

Gespraeche:
${conversationContext}`;

    const response = await Promise.race([
      geminiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { temperature: 0.7 },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 15000)
      ),
    ]);

    const summaryText = response.text?.trim();

    if (!summaryText) {
      return res.status(502).json({ error: "Empty response from AI" });
    }

    // Persist to astro_profiles.agent_summary (fire-and-forget)
    supabaseServer
      .from("astro_profiles")
      .update({ agent_summary: summaryText })
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.warn("[agent/summary] DB persist failed:", error.message);
      })
      .catch((err) => {
        console.error("[agent/summary] DB persist rejected:", err);
      });

    return res.json({
      summary: summaryText,
      sessions_remaining: 0,
      total_sessions: totalSessions,
      meta: { engine: "gemini-2.0-flash" },
    });
  } catch (err) {
    console.error("[agent/summary] Error:", err.message);
    return res.status(500).json({ error: "Summary generation failed" });
  }
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
app.post("/api/checkout", async (req, res) => {
  if (!supabaseServer) return res.status(500).json({ error: "Database not configured" });

  // Verify the caller is the authenticated user
  const authedUser = await verifySupabaseUser(req);
  if (!authedUser) return res.status(401).json({ error: "Unauthorized" });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    console.error('[STRIPE] Checkout called without configured Stripe variables');
    return res.status(503).json({
      error: 'Payment system is being configured. Please try again later.',
      code: 'STRIPE_NOT_CONFIGURED'
    });
  }
  if (!stripe) return res.status(503).json({ error: "Payment not configured" });
  const stripePriceId = process.env.STRIPE_PRICE_ID;

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
      .select("stripe_customer_id, tier")
      .eq("id", userId)
      .single();

    if (profile?.tier === "premium") {
      return res.status(400).json({ error: "Du hast bereits ein Premium-Abonnement. Bitte verwalte es im Kundenportal." });
    }

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
app.post("/api/customer-portal", async (req, res) => {
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
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[STRIPE] Webhook received but STRIPE_WEBHOOK_SECRET is not set!');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
      // Update BOTH tables — profiles stores Stripe metadata, astro_profiles stores tier
      const [profileResult, astroResult] = await Promise.allSettled([
        supabaseServer
          .from("profiles")
          .update({
            tier: "premium",
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq("id", userId),
        supabaseServer
          .from("astro_profiles")
          .update({ tier: "premium" })
          .eq("user_id", userId),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value.error) {
        console.error("[Stripe] checkout profiles update failed:", profileResult.value.error.message);
      }
      if (astroResult.status === "fulfilled" && astroResult.value.error) {
        console.error("[Stripe] checkout astro_profiles update failed:", astroResult.value.error.message);
      }
      const anyError =
        (profileResult.status === "rejected") ||
        (astroResult.status === "rejected") ||
        (profileResult.status === "fulfilled" && profileResult.value.error) ||
        (astroResult.status === "fulfilled" && astroResult.value.error);
      if (!anyError) {
        console.log(`[Stripe] User ${userId} upgraded to premium (sub: ${session.subscription})`);
      }
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

    const [profileResult, astroResult] = await Promise.allSettled([
      supabaseServer
        .from("profiles")
        .update({
          tier: isPremium ? "premium" : "free",
          stripe_subscription_id: sub.id,
          subscription_end: periodEnd,
        })
        .eq("stripe_customer_id", sub.customer),
      // Keep astro_profiles in sync — it may be read by components that don't join profiles
      supabaseServer
        .from("astro_profiles")
        .update({ tier: isPremium ? "premium" : "free" })
        .eq("user_id", userId),
    ]);

    if (profileResult.status === "fulfilled" && profileResult.value.error) {
      console.error("[Stripe] subscription.updated profiles failed:", profileResult.value.error.message);
    }
    if (astroResult.status === "fulfilled" && astroResult.value.error) {
      console.error("[Stripe] subscription.updated astro_profiles failed:", astroResult.value.error.message);
    }
    if (!(profileResult.value?.error || astroResult.value?.error)) {
      console.log(`[Stripe] Subscription ${sub.id} updated — status=${sub.status}, periodEnd=${periodEnd}`);
    }

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
      const results = await Promise.allSettled([
        supabaseServer
          .from("profiles")
          .update({
            tier: stillInGrace ? "premium" : "free",
            subscription_end: periodEnd,
          })
          .eq("stripe_customer_id", customerId),
        // Only update astro_profiles if we have a userId from metadata
        ...(sub.metadata?.userId
          ? [supabaseServer
              .from("astro_profiles")
              .update({ tier: stillInGrace ? "premium" : "free" })
              .eq("user_id", sub.metadata.userId)]
          : []),
      ]);

      const profileResult = results[0];
      const astroResult = results.length > 1 ? results[1] : null;
      if (profileResult.status === "fulfilled" && profileResult.value.error) {
        console.error("[Stripe] subscription.deleted profiles failed:", profileResult.value.error.message);
      }
      if (astroResult?.status === "fulfilled" && astroResult.value.error) {
        console.error("[Stripe] subscription.deleted astro_profiles failed:", astroResult.value.error.message);
      }
      if (!profileResult.value?.error && !astroResult?.value?.error) {
        console.log(`[Stripe] Subscription deleted — grace until ${periodEnd}, tier=${stillInGrace ? "premium" : "free"}`);
      }
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
app.post("/api/share", async (req, res) => {
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
app.post("/api/interpret", async (req, res) => {
  // Body already parsed by global middleware, but we need to enforce 50kb limit
  const rawBody = JSON.stringify(req.body);
  if (rawBody.length > 50000) {
    return res.status(413).json({ error: "Payload too large (max 50kb)" });
  }
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
app.post("/api/analyze/conversation", async (req, res) => {
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
