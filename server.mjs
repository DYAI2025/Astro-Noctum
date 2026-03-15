import express from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

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
app.get("/api/transit-state/:userId", async (req, res) => {
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
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
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
