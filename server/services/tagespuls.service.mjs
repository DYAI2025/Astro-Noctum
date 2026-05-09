// server/services/tagespuls.service.mjs
//
// Pure helpers for the Tagespuls neu-architecture. Imported by the
// /api/daily-pulse and /api/daily-interpretation route handlers in
// server.mjs and exercised directly by unit tests.
//
// IMPORTANT: This module contains NO fallback text generation. The whole
// point of the no-placeholders rewrite is that the aphorism (slot_1) is
// always real curated content; slot_2 / slot_3 may be null when the AI
// router is exhausted. The route handler is responsible for that null
// behaviour — these helpers stay pure.

/**
 * Cosine similarity between two five-element vectors.
 * @param {{wood:number,fire:number,earth:number,metal:number,water:number}} a
 * @param {{wood:number,fire:number,earth:number,metal:number,water:number}} b
 * @returns {number} similarity in [-1, 1]; 0 if either vector is zero.
 */
export function cosineSimilarity(a, b) {
  const av = [a.wood, a.fire, a.earth, a.metal, a.water];
  const bv = [b.wood, b.fire, b.earth, b.metal, b.water];
  const dot = av.reduce((sum, x, i) => sum + x * bv[i], 0);
  const an = Math.sqrt(av.reduce((sum, x) => sum + x * x, 0));
  const bn = Math.sqrt(bv.reduce((sum, x) => sum + x * x, 0));
  if (an === 0 || bn === 0) return 0;
  return dot / (an * bn);
}

/**
 * Map a fusion harmony_index in [0, 1] to a {mode, intensity} pair.
 *
 * Thresholds are the project annotation in
 * apps/tagespuls_package/docs/PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md §6:
 *   H < 0.45            → spannung
 *   0.45 <= H < 0.5     → pulse
 *   H >= 0.5            → trace
 *   intensity = clamp(|H - 0.45| / 0.55, 0, 1)
 *
 * @param {number} h
 * @returns {{mode: 'pulse'|'trace'|'spannung', intensity: number}}
 */
export function dayModeFromHarmony(h) {
  const safe = Number.isFinite(h) ? h : 0.45;
  const mode = safe < 0.45 ? 'spannung' : safe < 0.5 ? 'pulse' : 'trace';
  const intensity = Math.max(0, Math.min(1, Math.abs(safe - 0.45) / 0.55));
  return { mode, intensity };
}

/**
 * FNV-1a-ish 32-bit hash, deterministic across processes. Mirrors the
 * helper in apps/tagespuls_package/packages/voice/src/tagespuls.ts so
 * the deterministic pick stays consistent if we ever bring the JS
 * package live.
 *
 * @param {string} value
 * @returns {number} non-negative integer.
 */
export function simpleHash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/**
 * Resolve the fusion harmony_index from an astro_profiles.astro_json
 * payload. Production data sometimes nests it as `fusion.harmony_index`
 * being an object (with method/vectors/interpretation/harmony_index
 * inside) and sometimes as a flat number, so this helper accepts both
 * shapes plus the cosmic_state mirror.
 *
 * Returns null when no usable value is present — the caller should
 * treat that as "profile not yet enriched".
 *
 * @param {any} astroJson
 * @returns {number|null}
 */
export function harmonyIndexFromAstroJson(astroJson) {
  const fusion = astroJson?.fusion;
  if (!fusion || typeof fusion !== 'object') return null;

  const hRaw = fusion.harmony_index;
  if (typeof hRaw === 'number' && Number.isFinite(hRaw)) return hRaw;
  if (hRaw && typeof hRaw === 'object') {
    const inner = hRaw.harmony_index;
    if (typeof inner === 'number' && Number.isFinite(inner)) return inner;
  }

  const cs = fusion.cosmic_state;
  if (typeof cs === 'number' && Number.isFinite(cs)) return cs;
  if (typeof cs === 'string') {
    const parsed = parseFloat(cs);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

/**
 * Build the Rat-der-sechs council figures from a profile's astro_json.
 * Maps backend element/sign names into a stable display string per key.
 *
 * Each entry is `{ key, displayName, signOrElement }`. Missing pieces
 * fall back to '—' (non-breaking-hyphen at runtime is fine; we use a
 * plain ASCII em-dash here for transport).
 *
 * Path assumptions (verified 2026-05-09 against prod astro_profiles):
 *   sonne       <- western.zodiac_sign      (e.g. "Taurus")
 *   mond        <- western.moon_sign         (e.g. "Libra")
 *   aszendent   <- western.ascendant_sign    (e.g. "Libra")
 *   day_master  <- bazi.day_master ?? bazi.pillars.day.stem    (e.g. "Ding")
 *   jahrestier  <- bazi.zodiac_sign ?? bazi.chinese.year.animal (e.g. "Dog")
 *   wuxing_dom  <- wuxing.dominant_element   (e.g. "Holz")
 *
 * @param {any} astroJson
 * @returns {Array<{key:string, displayName:string, signOrElement:string}>}
 */
export function buildCouncilFromProfile(astroJson) {
  const w = astroJson?.western ?? {};
  const b = astroJson?.bazi ?? {};
  const wx = astroJson?.wuxing ?? {};

  const dayMaster =
    b.day_master ??
    b?.pillars?.day?.stem ??
    null;

  const jahrestier =
    b.zodiac_sign ??
    b?.chinese?.year?.animal ??
    b?.pillars?.year?.animal ??
    null;

  const wuxingDom = wx.dominant_element ?? null;

  return [
    { key: 'sonne',       displayName: 'Sonne',          signOrElement: w.zodiac_sign     ?? '—' },
    { key: 'mond',        displayName: 'Mond',           signOrElement: w.moon_sign       ?? '—' },
    { key: 'aszendent',   displayName: 'Aszendent',      signOrElement: w.ascendant_sign  ?? '—' },
    { key: 'day_master',  displayName: 'Day-Master',     signOrElement: dayMaster         ?? '—' },
    { key: 'jahrestier',  displayName: 'Jahrestier',     signOrElement: jahrestier        ?? '—' },
    { key: 'wuxing_dom',  displayName: 'Wu-Xing dominant', signOrElement: wuxingDom       ?? '—' },
  ];
}

const VALID_ARCHETYPE_KEYS = ['sonne', 'mond', 'aszendent', 'day_master', 'jahrestier', 'wuxing_dom'];

/**
 * Build the system prompt for slot_2 / slot_3 generation, distilled from
 * apps/tagespuls_package/.claude/skills/day-pulse-trace/SKILL.md.
 *
 * @param {{aphorism: any, mode: string, intensity: number, locale: 'de'|'en', harmony: number|null}} input
 * @returns {string}
 */
export function buildSlotPrompt({ aphorism, mode, intensity, locale, harmony }) {
  const lang = locale === 'en' ? 'English' : 'German';
  const aphText = locale === 'en' ? (aphorism.text_en || aphorism.text_de) : aphorism.text_de;
  const author = aphorism.author || 'Anonymous';
  const work = aphorism.work ? ` — ${aphorism.work}` : '';
  const harmonyStr = harmony === null ? 'unknown' : harmony.toFixed(2);

  return `
You are Bazodiac's Tagespuls voice. You write in "Poetic Realism" — worldly imagery, never astro-jargon.

Your job RIGHT NOW is to produce slot_2 (Brücke ins Heute) and slot_3 (Handlungsimpuls) for today's Tagespuls. The aphorism (slot_1) is already curated — DO NOT echo it.

CONTEXT:
- Modus: ${mode}            (pulse | trace | spannung)
- Intensity: ${intensity.toFixed(2)}    (0 = still, 1 = sharp)
- Harmony index: ${harmonyStr}
- Aphorismus (slot_1): "${aphText}" — ${author}${work}
- Output language: ${lang}

SLOT 2 (Brücke ins Heute):
- 10-20 Wörter, max 25
- Du-Form, Alltags-Deutsch (or "you" form for English)
- Anchor: a concrete situation, an inner state, OR an observation cue — pick ONE
- Verboten: Zodiac-Name, Grad, Haus, Aspekt, BaZi-Insider-Wort, Element-Name in slot_2,
  direkte Archetyp-Anrede, Wertung des Tages (gut/schlecht), Wiederholung des Aphorismus

SLOT 3 (Handlungsimpuls):
- 10-15 Wörter, max 20
- Verb-getrieben, offener Ausgang, kein Versprechen
- Erlaubte Formen: Imperativ / Frage / Beobachtungs-Vorschlag / Bedingungs-Satz
- Verboten: Affirmation ("Du schaffst das"), Ermächtigungsfloskel, Warnung ("Vorsicht vor")

MODUS-SCHÄRFE:
- pulse:    tragend, sensorisch, einladend
- trace:    direkt, geladen, "etwas passiert heute"
- spannung: zwei Bewegungen in zeitlicher Abfolge ("zuerst… dann…")

Output STRICT JSON only. No markdown, no commentary. Schema:
{
  "slot_2": "string",
  "slot_3": "string"
}
`.trim();
}

/**
 * Build the system prompt for the /daily-interpretation modal text
 * (Phase 2 — "Tagesdeutung" with selected archetype).
 *
 * @param {{pulse: any, archetypeKey: string, locale: 'de'|'en'}} input
 * @returns {string}
 */
export function buildInterpretationPrompt({ pulse, archetypeKey, signOrElement, locale }) {
  if (!VALID_ARCHETYPE_KEYS.includes(archetypeKey)) {
    throw new Error(`invalid archetype key: ${archetypeKey}`);
  }
  const lang = locale === 'en' ? 'English' : 'German';
  const intensity = Number(pulse.intensity ?? 0);
  const intensityBand =
    intensity < 0.4 ? 'low'
      : intensity < 0.7 ? 'mid'
        : 'high';

  // signOrElement is the user's ACTUAL data point for the chosen
  // archetype — e.g. archetypeKey='mond' → 'Libra' (Western moon
  // sign), archetypeKey='wuxing_dom' → 'Holz', etc. If the profile
  // is incomplete (signOrElement is null or '—'), we instruct the
  // LLM to NOT invent a sign. Per 2026-05-09 audit C-1.
  const sign = signOrElement && signOrElement !== '—' ? signOrElement : null;

  return `
You are Bazodiac's Tagesdeutung voice (Phase 2). You write in "Poetic Realism" with worldly imagery — never astro-mechanik.

CONTEXT:
- Modus: ${pulse.mode}            (pulse | trace | spannung)
- Intensity: ${intensity.toFixed(2)} (band: ${intensityBand})
- Slot 1 (aphorismus, do NOT quote): "${pulse.slot_1 ?? ''}"
- Slot 2 (Brücke): "${pulse.slot_2 ?? ''}"
- Slot 3 (Impuls): "${pulse.slot_3 ?? ''}"
- Selected archetype: ${archetypeKey}
- User's signOrElement for this archetype: ${sign ?? 'UNKNOWN — DO NOT invent a sign'}
- Output language: ${lang}

GEMEINSAME REGELN:
- 50-90 Wörter, 3-4 Sätze (intensity high: 4 erlaubt, max 4)
- Du-Form
- DU MUSST das konkrete Zeichen/Element benennen (siehe "User's
  signOrElement" oben). Schreibe z.B. "Dein Skorpion-Mond" oder
  "Deine Wasser-Energie", nicht "der Mond" oder "ein Element".
- WENN signOrElement = UNKNOWN: vermeide Sign-spezifische Aussagen
  ganz — bleib bei archetypischen Qualitäten ohne ein Sign zu erfinden.
- Astrologische Mechanik VERBOTEN ("weil Mars in Konjunktion …")
- Keine Wertung des Tages (gut/schwer/herausfordernd)
- Aphorismus-Bezug erkennbar, aber NICHT zitieren — semantisch fortführen
- Keine Affirmation, keine Pinterest-Esoterik
- DU MUSST mindestens eine konkrete Information geben, die slot_2
  und slot_3 NICHT enthielten — typischerweise eine archetypische
  Eigenschaft des konkreten Zeichens/Elements oder eine konkrete
  Tagessituation, in der dieses Zeichen besonders trägt/spannt.
- VERBOT: slot_2 oder slot_3 paraphrasieren. Wenn dein Output ohne
  Bedeutungsverlust durch slot_2 oder slot_3 ersetzbar wäre, regener
  intern, bevor du antwortest. Die Tagesdeutung muss EIGENSTÄNDIG
  Wert liefern, nicht zwei Sätze umformulieren.

MODUS-LOGIK (zwingend):
- pulse:    Hauptbezug = gewählter Archetyp + 1-3 weitere Figuren mitgenannt, ohne Hervorhebung. Tragend.
- trace:    NUR der gewählte Archetyp. Andere Figuren KOMMEN NICHT VOR. Direkt, schärfer.
- spannung: GENAU zwei Figuren in zeitlicher Abfolge — der gewählte und genau eine weitere. Sequenz-Marker ("zuerst…", "dann…").

INTENSITY-SCHÄRFE:
- low (<0.4):    ruhige, beschreibende Sätze
- mid (0.4-0.7): direkter, klare Handlungs-/Beobachtungs-Ebene
- high (>=0.7):  knapper, ein Satz mehr erlaubt, max 4 insgesamt

Output PLAIN TEXT only — NO JSON, NO markdown, NO labels. Just the paragraph.
`.trim();
}

/**
 * Validate the locale string. Returns 'de' or 'en'; throws on anything else.
 * @param {unknown} locale
 * @returns {'de'|'en'}
 */
export function normalizeLocale(locale) {
  if (locale === 'de' || locale === 'en') return locale;
  throw new Error(`invalid locale: ${String(locale)}`);
}

/**
 * Validate a YYYY-MM-DD date string. Returns the string on success,
 * throws on malformed input.
 * @param {unknown} date
 * @returns {string}
 */
export function normalizeDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`invalid date: ${String(date)}`);
  }
  return date;
}

export const ARCHETYPE_KEYS = VALID_ARCHETYPE_KEYS;
