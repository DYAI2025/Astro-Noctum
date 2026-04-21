/**
 * Planet tooltip content for the 3D signature sphere.
 *
 * Two short sentences per planet, DE + EN. Surface the astrological
 * archetype in everyday language — not astrologer jargon. The sphere
 * already names the planet and shows the weight; this text answers
 * "what does this planet actually mean for me".
 */
import type { PlanetName } from './planets';

export interface PlanetTooltipContent {
  de: string;
  en: string;
}

export const PLANET_INFLUENCE: Readonly<Record<PlanetName, PlanetTooltipContent>> = {
  Sun: {
    de: 'Die Sonne steht für deine Kern-Identität — wer du wirklich bist, wenn kein Rauschen da ist. Sie prägt, wie klar und selbstverständlich du präsent sein kannst.',
    en: 'The Sun represents your core identity — who you are when the noise falls away. It shapes how clearly and naturally you can simply be present.',
  },
  Moon: {
    de: 'Der Mond zeigt deine Gefühlslage und deinen inneren Rhythmus. Er bestimmt, wie du Eindrücke aufnimmst und wo du Schutz, Nähe und Regeneration suchst.',
    en: 'The Moon carries your emotional tone and inner rhythm. It shapes how you absorb impressions and where you seek safety, closeness, and renewal.',
  },
  Mercury: {
    de: 'Merkur regiert Denken, Sprache und Austausch. Er entscheidet, wie schnell und wie nuanciert du Information verarbeitest und welche Brücken du zwischen Menschen baust.',
    en: 'Mercury runs thought, speech, and exchange. It determines how fast and how subtly you process information and the bridges you build between people.',
  },
  Venus: {
    de: 'Venus steht für Beziehung, Werte und dein Empfinden für Schönheit. Sie zeigt, was dich anzieht und wie du Harmonie, Nähe und Genuss gestaltest.',
    en: 'Venus governs connection, values, and your sense of beauty. It shows what draws you in and how you shape harmony, closeness, and pleasure.',
  },
  Mars: {
    de: 'Mars treibt an und zieht Grenzen. Er formt, wie du Impulse in Handeln verwandelst und wie deutlich du für dich und deine Richtung einstehst.',
    en: 'Mars drives and draws the line. It shapes how you convert impulse into action and how clearly you stand for yourself and your direction.',
  },
  Jupiter: {
    de: 'Jupiter öffnet Horizont und Vertrauen. Er entscheidet, wohin du dich ausdehnst, wie du Sinn erkennst und wo du innerlich weit werden kannst.',
    en: 'Jupiter opens horizon and trust. It decides where you expand, how you recognise meaning, and where you become spacious inside.',
  },
  Saturn: {
    de: 'Saturn baut Struktur, Zeit und Verantwortung ein. Er zeigt, wo du Tragfähiges erschaffst und wie reif du mit Grenzen und Ausdauer umgehst.',
    en: 'Saturn builds structure, time, and responsibility. It shows where you create what lasts and how maturely you handle limits and patience.',
  },
  Uranus: {
    de: 'Uranus bricht Gewohnheiten auf und schenkt Freiheit. Er markiert, wo du unkonventionell denkst, Durchbrüche brauchst und das System neu sortierst.',
    en: 'Uranus breaks open habit and grants freedom. It marks where you think unconventionally, need breakthroughs, and re-sort the system.',
  },
  Neptune: {
    de: 'Neptun löst Grenzen auf und öffnet für Vision und Intuition. Er zeigt, wo du Klarheit eher über feines Spüren als über harte Logik gewinnst.',
    en: 'Neptune dissolves edges and opens vision and intuition. It shows where you find clarity through subtle feeling rather than hard logic.',
  },
  Pluto: {
    de: 'Pluto arbeitet in der Tiefe und wandelt. Er zeigt, wo du durch radikale Ehrlichkeit Macht über dein Leben zurückgewinnst — und wo Altes gehen darf.',
    en: 'Pluto works in the depth and transforms. It shows where radical honesty lets you reclaim power over your own life — and where the old may leave.',
  },
};

export type WeightTier = 'dominant' | 'aktiv' | 'leise';

/**
 * Map a 0..1 weight to a tier label.
 * Thresholds chosen so typical BaZi-derived profiles show ~2–4 dominant
 * planets and ~2–3 leise planets, with the rest aktiv.
 */
export function tierFor(weight: number): WeightTier {
  if (weight >= 0.6) return 'dominant';
  if (weight >= 0.3) return 'aktiv';
  return 'leise';
}

export const TIER_LABEL: Readonly<Record<WeightTier, PlanetTooltipContent>> = {
  dominant: {
    de: 'Bei dir prominent — trägt den Ton deiner Signatur spürbar.',
    en: 'Prominent in your signature — carries the tone noticeably.',
  },
  aktiv: {
    de: 'Ausgewogen bei dir — meldet sich klar, ohne zu dominieren.',
    en: 'Balanced in your signature — clearly present but not dominant.',
  },
  leise: {
    de: 'Im Hintergrund bei dir — wirkt eher beiläufig und wird in Ruhe sichtbar.',
    en: 'Background in your signature — works quietly, visible in calm moments.',
  },
};

export const TIER_SHORT_LABEL: Readonly<Record<WeightTier, PlanetTooltipContent>> = {
  dominant: { de: 'dominant', en: 'dominant' },
  aktiv:    { de: 'aktiv',    en: 'active' },
  leise:    { de: 'leise',    en: 'quiet' },
};
