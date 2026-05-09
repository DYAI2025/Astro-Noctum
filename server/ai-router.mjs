/**
 * AI provider fallback router.
 *
 * Wraps `@google/genai` with a transparent fallback chain through Groq and
 * OpenRouter so a Gemini-direct quota exhaustion (429 RESOURCE_EXHAUSTED)
 * no longer bubbles up as a 502 at the edge.
 *
 * Priority order (each tier has independent quota; chain multiplies capacity):
 *   1. Gemini direct       — GEMINI_API_KEY (highest fidelity + lowest latency)
 *   2. Groq free           — GROQ_API_KEY × GROQ_MODEL_CHAIN
 *                            (free 30 RPM per model, fast inference, dedicated
 *                            quota per OpenAI-compatible endpoint)
 *   3. OpenRouter free     — OPENROUTER_API_KEY × FREE_MODEL_CHAIN
 *                            (shared "Venice" pool — last resort; often 429s)
 *
 * Surface mirrors `@google/genai` closely:
 *   - `.models.generateContent({ model, contents, config })` → `{ text, response: { text } }`
 *   - `.getGenerativeModel({ model }).generateContent(prompt)` → `{ response: { text(): string } }`
 *
 * Non-quota errors (malformed request, auth failure, network) short-circuit
 * and throw — we only fall through on 429/404/502/503-like signals so
 * latency stays predictable for genuine bugs.
 */

import { GoogleGenAI } from '@google/genai';
import { logEvent } from './observability/logger.mjs';

/**
 * OpenRouter free-tier models, ordered by preference. Each has its own
 * rate-limit bucket, so the chain effectively multiplies free capacity.
 * Keep Gemini-compatible models first (similar prompt/JSON behaviour) and
 * diverse providers afterwards as emergency fallback.
 */
export const DEFAULT_FREE_MODEL_CHAIN = Object.freeze([
  // Non-Google providers first — Google's :free slots have been deprecated /
  // removed from OpenRouter (404 "No endpoints found" as of 2026-05-09).
  // Each provider has its own quota bucket → effective capacity multiplies.
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
]);

/**
 * Groq free-tier models, ordered by capability. Each has its own RPM bucket
 * (typically 30 RPM on free tier as of 2026-05-09). Faster than OpenRouter
 * because Groq runs LPU inference at sub-second latency.
 */
export const DEFAULT_GROQ_MODEL_CHAIN = Object.freeze([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'llama-3.2-3b-preview',
]);

const PROVIDER_TIMEOUT_MS = 30_000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Detect "model unavailable" failures that should trigger next-model
 * fallback within the OpenRouter chain (NOT short-circuit the whole call).
 *
 * Triggers cascade-to-next-model:
 *   - 429 RESOURCE_EXHAUSTED      (quota / rate-limit)
 *   - 404 No endpoints found      (model deprecated / removed)
 *   - 503 model overloaded        (transient capacity)
 *   - 502 bad gateway upstream    (provider outage)
 *
 * Non-cascadable errors (401 auth, 400 bad request, network drop) bubble
 * so the caller sees them — fallback would mask real bugs.
 */
function isCascadableProviderError(err) {
  if (!err) return false;
  const status = err.status ?? err.statusCode ?? err?.error?.code;
  if (status === 429 || status === 404 || status === 503 || status === 502) return true;
  const msg = String(err?.message || err || '').toLowerCase();
  return /429|resource_exhausted|quota|rate.?limit|exceeded your current quota|no endpoints found|model overloaded|bad gateway/.test(msg);
}

/**
 * Redact potentially sensitive fields from a provider error body before
 * including it in an error message. Defensive — provider errors usually
 * don't leak credentials, but request IDs and internal trace IDs are best
 * kept out of error chains that might bubble to clients via `err.message`.
 *
 * Strips: authorization headers, bearer tokens (anywhere in raw text),
 * api_key fields, request_id values. Truly malformed bodies fall through
 * as-is (we only redact what we can confidently identify).
 */
function redactErrorBody(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  return raw
    .replace(/"(?:authorization|api[_-]?key|access[_-]?token|x-amz-security-token)"\s*:\s*"[^"]*"/gi, '"[redacted]":"[redacted]"')
    .replace(/(bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
    .replace(/("request_id"\s*:\s*)"[^"]*"/g, '$1"[redacted]"');
}

/**
 * Convert a Gemini `contents` payload (string | array of turns) into OpenAI
 * chat-completion `messages`. `systemInstruction` from the Gemini config
 * becomes a system-role message prepended to the chain.
 */
function geminiContentsToMessages(contents, systemInstruction) {
  const messages = [];
  if (systemInstruction) {
    const sysText =
      typeof systemInstruction === 'string'
        ? systemInstruction
        : Array.isArray(systemInstruction?.parts)
          ? systemInstruction.parts.map((p) => p?.text ?? '').join('')
          : '';
    if (sysText) messages.push({ role: 'system', content: sysText });
  }

  if (contents == null) return messages;
  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
    return messages;
  }
  if (Array.isArray(contents)) {
    for (const turn of contents) {
      if (typeof turn === 'string') {
        messages.push({ role: 'user', content: turn });
        continue;
      }
      if (!turn || typeof turn !== 'object') continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
      const text = Array.isArray(turn.parts)
        ? turn.parts.map((p) => (typeof p === 'string' ? p : (p?.text ?? ''))).join('')
        : (turn.text || '');
      if (text) messages.push({ role, content: text });
    }
    return messages;
  }
  return messages;
}

/**
 * Map a Gemini model id to whatever OpenRouter exposes for a closely
 * matching capability. We don't need an exhaustive map — the fallback
 * chain itself rotates through known-good free models.
 */
function normalizeOpenRouterModel(requestedModel, fallbackModel) {
  if (!requestedModel) return fallbackModel;
  // If caller passed an OpenRouter slug directly, let it override only the
  // matching chain entry. For all other chain entries we use the chain
  // entry itself, so the cascade rotates through diverse providers as
  // designed (we do NOT collapse the chain into a single model).
  if (requestedModel.includes('/')) {
    return requestedModel === fallbackModel ? requestedModel : fallbackModel;
  }
  return fallbackModel;
}

/**
 * Single Groq call. OpenAI-compatible chat-completions API. Throws on any
 * non-2xx; router decides cascade based on {@link isCascadableProviderError}.
 */
async function callGroq({ apiKey, model, request }) {
  const systemInstruction = request?.config?.systemInstruction;
  const messages = geminiContentsToMessages(request?.contents, systemInstruction);
  const wantsJson = request?.config?.responseMimeType === 'application/json';

  const body = { model, messages };
  if (request?.config?.temperature != null) body.temperature = request.config.temperature;
  if (request?.config?.maxOutputTokens != null) body.max_tokens = request.config.maxOutputTokens;
  if (wantsJson) body.response_format = { type: 'json_object' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      const defanged = redactErrorBody(raw);
      const err = new Error(`groq ${model} ${res.status}: ${defanged.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return { text, response: { text }, _source: `groq:${model}`, raw: data };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Single OpenRouter call. Throws on any non-2xx response; the router above
 * decides whether to fall through based on {@link isCascadableProviderError}.
 */
async function callOpenRouter({ apiKey, model, request, referer, title }) {
  const systemInstruction = request?.config?.systemInstruction;
  const messages = geminiContentsToMessages(request?.contents, systemInstruction);
  const wantsJson = request?.config?.responseMimeType === 'application/json';

  const body = {
    model,
    messages,
  };
  if (request?.config?.temperature != null) body.temperature = request.config.temperature;
  if (request?.config?.maxOutputTokens != null) body.max_tokens = request.config.maxOutputTokens;
  if (wantsJson) body.response_format = { type: 'json_object' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Recommended by OpenRouter so requests show up in the dashboard.
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      const defanged = redactErrorBody(raw);
      const err = new Error(`openrouter ${model} ${res.status}: ${defanged.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return { text, response: { text }, _source: `openrouter:${model}`, raw: data };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Factory. Returns an object that mirrors the subset of `@google/genai`
 * used by server.mjs. Falsy inputs (no direct key AND no openrouter key)
 * return `null` so the existing `if (!geminiClient)` guards at every
 * call-site keep working.
 */
/**
 * Default aggregate cascade budget. Caps worst-case latency for a
 * dashboard request: even if every provider times out at 30s/leg, the
 * router throws after 90s rather than 275s.
 */
const DEFAULT_AGGREGATE_BUDGET_MS = 90_000;

export function createGenAiRouter({
  geminiApiKey,
  groqApiKey,
  openrouterApiKey,
  freeModelChain = DEFAULT_FREE_MODEL_CHAIN,
  groqModelChain = DEFAULT_GROQ_MODEL_CHAIN,
  // OpenRouter-specific — Groq doesn't use these. Kept on the factory
  // signature for now to avoid a breaking change; if more provider-
  // specific knobs accumulate, refactor to per-tier config objects.
  referer = 'https://bazodiac.space',
  title = 'Bazodiac',
  aggregateBudgetMs = DEFAULT_AGGREGATE_BUDGET_MS,
} = {}) {
  const hasGemini = typeof geminiApiKey === 'string' && geminiApiKey.length > 0;
  const hasGroq = typeof groqApiKey === 'string' && groqApiKey.length > 0;
  const hasOpenRouter = typeof openrouterApiKey === 'string' && openrouterApiKey.length > 0;
  if (!hasGemini && !hasGroq && !hasOpenRouter) return null;

  const direct = hasGemini ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
  // An empty array passed by a caller falls back to the DEFAULT chain —
  // this is a defensive guard against accidental zero-length config, NOT
  // a way to disable a tier. To disable a tier, omit its API key.
  const chain = Array.isArray(freeModelChain) && freeModelChain.length > 0 ? freeModelChain : DEFAULT_FREE_MODEL_CHAIN;
  const groqChain = Array.isArray(groqModelChain) && groqModelChain.length > 0 ? groqModelChain : DEFAULT_GROQ_MODEL_CHAIN;

  async function generateContent(request) {
    const startedAt = Date.now();
    const attempts = [];
    if (direct) {
      attempts.push({
        label: 'gemini-direct',
        call: () => direct.models.generateContent(request),
      });
    }
    if (hasGroq) {
      for (const model of groqChain) {
        attempts.push({
          label: `groq:${model}`,
          call: () => callGroq({ apiKey: groqApiKey, model, request }),
        });
      }
    }
    if (hasOpenRouter) {
      for (const model of chain) {
        const resolved = normalizeOpenRouterModel(request?.model, model);
        attempts.push({
          label: `openrouter:${resolved}`,
          call: () => callOpenRouter({ apiKey: openrouterApiKey, model: resolved, request, referer, title }),
        });
      }
    }
    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      // Aggregate-budget guard: don't start a new leg if we've already
      // burned more than the budget. Per-leg AbortControllers still cap
      // individual call latency.
      if (Date.now() - startedAt >= aggregateBudgetMs) {
        const total = Date.now() - startedAt;
        console.warn(`[ai-router] aggregate budget exhausted after ${total}ms, giving up`);
        logEvent({
          event: 'ai_router_exhausted',
          reason: 'CASCADE_TIMEOUT',
          totalAttempts: i,
          elapsedMs: total,
        });
        const budgetErr = new Error(`[ai-router] aggregate budget exhausted (${total}ms >= ${aggregateBudgetMs}ms)`);
        budgetErr.code = 'CASCADE_TIMEOUT';
        throw budgetErr;
      }
      const { label, call } = attempts[i];
      try {
        const result = await call();
        if (i > 0) {
          console.warn(`[ai-router] recovered via ${label} after ${i} failed attempt(s)`);
          logEvent({
            event: 'ai_router_recovery',
            via: label,
            failedAttempts: i,
            elapsedMs: Date.now() - startedAt,
          });
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (!isCascadableProviderError(err)) {
          // Non-quota error — surface it rather than wasting the rest of the chain.
          throw err;
        }
        console.warn(`[ai-router] ${label} quota/429, falling through`);
        logEvent({
          event: 'ai_router_cascade',
          from: label,
          to: i + 1 < attempts.length ? attempts[i + 1].label : null,
          errorStatus: err?.status ?? null,
        });
      }
    }
    logEvent({
      event: 'ai_router_exhausted',
      reason: 'ALL_PROVIDERS_FAILED',
      totalAttempts: attempts.length,
      elapsedMs: Date.now() - startedAt,
    });
    throw lastErr ?? new Error('[ai-router] all providers exhausted');
  }

  return {
    /** New-API surface used by most call-sites. */
    models: { generateContent },
    /**
     * Legacy surface used by `/api/analyze/conversation` — returns a
     * pseudo-model whose `.generateContent(prompt)` returns `{ response: { text() } }`.
     * Caller at server.mjs L5912 uses `result.response.text()` as a FUNCTION.
     */
    getGenerativeModel({ model }) {
      return {
        generateContent: async (promptOrRequest) => {
          const request =
            typeof promptOrRequest === 'string'
              ? { model, contents: promptOrRequest }
              : { model, ...promptOrRequest };
          const result = await generateContent(request);
          const text = typeof result?.text === 'string' ? result.text : '';
          return {
            text,
            response: {
              text: () => text,
            },
            _source: result?._source,
          };
        },
      };
    },
  };
}
