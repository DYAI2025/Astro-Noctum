/**
 * Horoscope Templates — Freemium Tageshoroskop
 *
 * Template-based, deterministic horoscope generation.
 * No LLM in the request path — fast and consistent.
 *
 * Templates use the Ring-native voice:
 * - FROM the user, not ABOUT the user
 * - No imperatives, no diagnostics
 * - References active sectors by domain name
 */

import type { DimensionKey } from '@/src/lib/master-signal/types';
import type { SectorResonance, TransitEventInput } from './types';

// ── Sector Domain Labels ──────────────────────────────────────────────

const SECTOR_DOMAINS: Array<{ de: string; en: string; dimension: DimensionKey }> = [
  { de: 'Antrieb',       en: 'Drive',         dimension: 'passion' },     // 0 Aries
  { de: 'Stabilität',    en: 'Stability',      dimension: 'stability' },   // 1 Taurus
  { de: 'Kommunikation', en: 'Communication',  dimension: 'future' },      // 2 Gemini
  { de: 'Geborgenheit',  en: 'Nurture',        dimension: 'connection' },  // 3 Cancer
  { de: 'Ausdruck',      en: 'Expression',     dimension: 'passion' },     // 4 Leo
  { de: 'Ordnung',       en: 'Order',          dimension: 'stability' },   // 5 Virgo
  { de: 'Balance',       en: 'Balance',        dimension: 'connection' },  // 6 Libra
  { de: 'Tiefe',         en: 'Depth',          dimension: 'passion' },     // 7 Scorpio
  { de: 'Expansion',     en: 'Expansion',      dimension: 'future' },      // 8 Sagittarius
  { de: 'Struktur',      en: 'Structure',      dimension: 'stability' },   // 9 Capricorn
  { de: 'Freiheit',      en: 'Freedom',        dimension: 'autonomy' },    // 10 Aquarius
  { de: 'Intuition',     en: 'Intuition',      dimension: 'connection' },  // 11 Pisces
];

export function getSectorDomain(sector: number, lang: 'de' | 'en'): string {
  const s = SECTOR_DOMAINS[sector % 12];
  return lang === 'de' ? s.de : s.en;
}

export function getSectorDimension(sector: number): DimensionKey {
  return SECTOR_DOMAINS[sector % 12].dimension;
}

// ── Headline Templates ────────────────────────────────────────────────

interface TemplateSet {
  headlines: string[];
  bodies: string[];
  advices: string[];
}

const RESONANCE_TEMPLATES_DE: Record<'high' | 'moderate' | 'calm', TemplateSet> = {
  high: {
    headlines: [
      'Dein {domain}-Feld flammt heute besonders.',
      'Heute pulsiert dein {domain}-Bereich mit ungewöhnlicher Intensität.',
      'Ein tiefes Resonanzfeld öffnet sich in deinem {domain}-Sektor.',
    ],
    bodies: [
      'Die Energie in deinem {domain}-Feld ist heute deutlich spürbar. {secondary_note} Das ist kein Zufall — dein Profil zeigt hier eine natürliche Empfänglichkeit, die heute besonders aktiviert wird.',
      'Dein {domain}-Sektor reagiert heute auf eine starke kosmische Bewegung. {secondary_note} Diese Resonanz ist ein Hinweis darauf, dass sich etwas in diesem Bereich deines Lebens bewegen möchte.',
      'Heute zeigt sich eine klare Aktivierung in deinem {domain}-Feld. {secondary_note} Dein persönliches Profil verstärkt dieses Signal — es lohnt sich, aufmerksam zu sein.',
    ],
    advices: [
      'Lass diese Energie fließen, ohne sie kontrollieren zu wollen.',
      'Nimm wahr, was sich heute in diesem Feld bewegt — ohne Bewertung.',
      'Diese Intensität kann produktiv genutzt werden, wenn du ihr Raum gibst.',
    ],
  },
  moderate: {
    headlines: [
      'Leichte Bewegung in deinem {domain}-Feld.',
      'Dein {domain}-Bereich zeigt heute sanfte Aktivität.',
      'Ein subtiles Signal aus deinem {domain}-Sektor.',
    ],
    bodies: [
      'Heute zeigt sich eine moderate Bewegung in deinem {domain}-Feld. {secondary_note} Es ist weniger ein Signal zum Handeln als eine Einladung zum Wahrnehmen.',
      'Dein {domain}-Sektor ist heute aktiver als gewöhnlich, ohne dabei überwältigend zu sein. {secondary_note} Eine gute Gelegenheit, diesem Lebensbereich bewusst Aufmerksamkeit zu schenken.',
      'Die Energie in deinem {domain}-Feld bewegt sich heute in einem angenehmen Rhythmus. {secondary_note} Kein Druck, aber ein leises Anklopfen.',
    ],
    advices: [
      'Beobachte, was heute in diesem Bereich lebendig wird.',
      'Diese sanfte Bewegung könnte am Abend klarer werden.',
      'Lass dich von der Leichtigkeit dieses Signals tragen.',
    ],
  },
  calm: {
    headlines: [
      'Ein ruhiger Tag für dein kosmisches Feld.',
      'Heute liegt Stille über deinem Ring.',
      'Dein Ring ruht heute — und das ist gut so.',
    ],
    bodies: [
      'Heute zeigen sich keine starken Transit-Signale in deinem Profil. {secondary_note} Das bedeutet nicht Stillstand, sondern Raum für Integration und Vertiefung.',
      'Dein kosmisches Feld ist heute relativ ruhig. {secondary_note} Solche Tage eignen sich besonders gut für Reflexion und innere Arbeit.',
      'Die kosmische Aktivität ist heute gedämpft — eine natürliche Atempause. {secondary_note} Nutze die Ruhe, um dich mit dem zu verbinden, was dir wirklich wichtig ist.',
    ],
    advices: [
      'Ruhetage sind keine verlorenen Tage — sie sind Integrationszeit.',
      'Heute darfst du einfach sein, ohne etwas sein zu müssen.',
      'Stille ist auch ein kosmisches Signal.',
    ],
  },
};

const RESONANCE_TEMPLATES_EN: Record<'high' | 'moderate' | 'calm', TemplateSet> = {
  high: {
    headlines: [
      'Your {domain} field is especially active today.',
      'Today pulses with unusual intensity in your {domain} area.',
      'A deep resonance field opens in your {domain} sector.',
    ],
    bodies: [
      'The energy in your {domain} field is clearly perceptible today. {secondary_note} This is no coincidence — your profile shows a natural receptivity here that is especially activated today.',
      'Your {domain} sector is responding to a strong cosmic movement today. {secondary_note} This resonance indicates that something in this area of your life wants to move.',
      'Today shows a clear activation in your {domain} field. {secondary_note} Your personal profile amplifies this signal — it\'s worth paying attention.',
    ],
    advices: [
      'Let this energy flow without trying to control it.',
      'Notice what moves in this field today — without judgment.',
      'This intensity can be used productively when you give it space.',
    ],
  },
  moderate: {
    headlines: [
      'Gentle movement in your {domain} field.',
      'Your {domain} area shows soft activity today.',
      'A subtle signal from your {domain} sector.',
    ],
    bodies: [
      'Today shows moderate movement in your {domain} field. {secondary_note} It\'s less a signal to act and more an invitation to notice.',
      'Your {domain} sector is more active than usual today without being overwhelming. {secondary_note} A good opportunity to consciously direct attention to this area.',
      'The energy in your {domain} field moves in a pleasant rhythm today. {secondary_note} No pressure, but a quiet knock.',
    ],
    advices: [
      'Observe what comes alive in this area today.',
      'This gentle movement might become clearer by evening.',
      'Let yourself be carried by the lightness of this signal.',
    ],
  },
  calm: {
    headlines: [
      'A quiet day for your cosmic field.',
      'Today, stillness lies over your ring.',
      'Your ring rests today — and that\'s good.',
    ],
    bodies: [
      'Today shows no strong transit signals in your profile. {secondary_note} This doesn\'t mean stagnation, but space for integration and deepening.',
      'Your cosmic field is relatively quiet today. {secondary_note} Such days are especially good for reflection and inner work.',
      'Cosmic activity is muted today — a natural breathing space. {secondary_note} Use the calm to connect with what truly matters to you.',
    ],
    advices: [
      'Rest days aren\'t lost days — they\'re integration time.',
      'Today you may simply be, without having to be something.',
      'Stillness is also a cosmic signal.',
    ],
  },
};

// ── Secondary Note Templates ──────────────────────────────────────────

function buildSecondaryNote(
  resonances: SectorResonance[],
  primarySector: number,
  lang: 'de' | 'en',
): string {
  // Find a secondary active sector for contrast
  const secondary = resonances
    .filter(r => r.sector !== primarySector && r.impact > 0.2)
    .sort((a, b) => b.impact - a.impact)[0];

  if (!secondary) return '';

  const secDomain = getSectorDomain(secondary.sector, lang);
  if (lang === 'de') {
    return `Gleichzeitig bewegt sich auch dein ${secDomain}-Feld — eine interessante Spannung, die Tiefe erzeugt.`;
  }
  return `Simultaneously, your ${secDomain} field is also moving — an interesting tension that creates depth.`;
}

// ── Event-Specific Headlines ──────────────────────────────────────────

function eventHeadline(event: TransitEventInput, lang: 'de' | 'en'): string {
  const domain = getSectorDomain(event.sector, lang);
  if (lang === 'de') {
    switch (event.type) {
      case 'resonance_jump': return `Ein Resonanzsprung aktiviert dein ${domain}-Feld.`;
      case 'dominance_shift': return `Die Dominanz verschiebt sich — dein ${domain}-Feld übernimmt.`;
      case 'moon_event': return `Der Mond berührt dein ${domain}-Feld.`;
      default: return `Bewegung in deinem ${domain}-Feld.`;
    }
  }
  switch (event.type) {
    case 'resonance_jump': return `A resonance jump activates your ${domain} field.`;
    case 'dominance_shift': return `Dominance shifts — your ${domain} field takes over.`;
    case 'moon_event': return `The moon touches your ${domain} field.`;
    default: return `Movement in your ${domain} field.`;
  }
}

// ── Main Template Generator ───────────────────────────────────────────

/**
 * Pick a deterministic template index based on a date seed.
 * Same date + same sector → always same template index.
 */
function deterministicPick(dateStr: string, sector: number, max: number): number {
  let hash = 0;
  const seed = `${dateStr}:${sector}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % max;
}

export interface TemplateHoroscopeResult {
  headline: string;
  body: string;
  advice: string;
  pushworthy: boolean;
  push_text?: string;
  primary_sector: number;
}

export function generateTemplateHoroscope(
  resonances: SectorResonance[],
  events: TransitEventInput[],
  lang: 'de' | 'en',
  dateStr: string,
): TemplateHoroscopeResult {
  const templates = lang === 'de' ? RESONANCE_TEMPLATES_DE : RESONANCE_TEMPLATES_EN;

  // Sort resonances by impact
  const sorted = [...resonances].sort((a, b) => b.impact - a.impact);
  const primary = sorted[0];

  // Determine intensity tier
  const maxImpact = primary?.impact ?? 0;
  const tier: 'high' | 'moderate' | 'calm' =
    maxImpact >= 0.5 ? 'high' :
    maxImpact >= 0.2 ? 'moderate' : 'calm';

  const set = templates[tier];
  const sector = primary?.sector ?? 0;
  const domain = getSectorDomain(sector, lang);

  // Pick deterministic templates from the set
  const hi = deterministicPick(dateStr, sector, set.headlines.length);
  const bi = deterministicPick(dateStr, sector + 100, set.bodies.length);
  const ai = deterministicPick(dateStr, sector + 200, set.advices.length);

  // If there's a strong event, use event-specific headline
  const strongEvent = events.find(e => e.priority >= 50 && e.sector === sector);
  const headline = strongEvent
    ? eventHeadline(strongEvent, lang)
    : set.headlines[hi].replace(/\{domain\}/g, domain);

  const secondaryNote = buildSecondaryNote(resonances, sector, lang);
  const body = set.bodies[bi]
    .replace(/\{domain\}/g, domain)
    .replace(/\{secondary_note\}/g, secondaryNote);

  const advice = set.advices[ai];

  // Pushworthy if any event has priority >= 60 or max impact >= 0.6
  const pushworthy = events.some(e => e.priority >= 60) || maxImpact >= 0.6;
  const push_text = pushworthy && lang === 'de'
    ? `Dein ${domain}-Feld ist heute besonders aktiv.`
    : pushworthy
    ? `Your ${domain} field is especially active today.`
    : undefined;

  return {
    headline,
    body,
    advice,
    pushworthy,
    push_text,
    primary_sector: sector,
  };
}
