import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import Stripe from 'stripe';

// ── Boot-time env var validation ─────────────────────────────────────
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);

if (missing.length > 0 && !['test', 'development'].includes(process.env.NODE_ENV)) {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Configuration ───────────────────────────────────────────────────
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    buyId: process.env.STRIPE_BUY_ID,
  },
  elevenlabs: {
    toolSecret: process.env.ELEVENLABS_TOOL_SECRET,
  },
  nasa: {
    apiKey: process.env.NASA_API_KEY || "DEMO_KEY",
  },
  isProduction: process.env.NODE_ENV === 'production',
};

// ── Clients ────────────────────────────────────────────────────────
export const supabaseServer = config.supabase.url && config.supabase.serviceKey
  ? createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const geminiClient = config.gemini.apiKey
  ? new GoogleGenAI({ apiKey: config.gemini.apiKey })
  : null;

export const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, { apiVersion: '2024-12-15' })
  : null;
