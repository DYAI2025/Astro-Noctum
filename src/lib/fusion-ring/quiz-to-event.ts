import type { ContributionEvent, Marker, Tag } from '@/src/lib/lme/types';

// ═══════════════════════════════════════════════════════════════
// LOVE LANGUAGES
// ═══════════════════════════════════════════════════════════════

const LOVE_LANG_MARKERS: Record<string, string> = {
  touch:   'marker.love.physical_touch',
  words:   'marker.love.expression',
  time:    'marker.love.togetherness',
  gifts:   'marker.love.sensory_connection',
  service: 'marker.love.protective',
};

export function loveLangToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(LOVE_LANG_MARKERS)) {
    if (scores[dim] != null && scores[dim] > 0) {
      markers.push({
        id: markerId,
        weight: Math.min(scores[dim] / maxScore, 1),
        evidence: { confidence: 0.7, itemsAnswered: 12 },
      });
    }
  }

  // Sekundäre Marker: Intensität / Leidenschaft
  if (scores.touch > maxScore * 0.7) {
    markers.push({
      id: 'marker.love.passionate',
      weight: scores.touch / maxScore * 0.8,
      evidence: { confidence: 0.6 },
    });
  }

  return buildEvent('quiz.love_languages.v1', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// KRAFTTIER
// ═══════════════════════════════════════════════════════════════

const KRAFTTIER_MARKERS: Record<string, Marker[]> = {
  wolf: [
    { id: 'marker.social.pack_loyalty',       weight: 0.82, evidence: { confidence: 0.75 } },
    { id: 'marker.instinct.primal_sense',     weight: 0.75, evidence: { confidence: 0.75 } },
    { id: 'marker.leadership.servant_leader', weight: 0.68, evidence: { confidence: 0.75 } },
  ],
  eagle: [
    { id: 'marker.cognition.analytical',      weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.freedom.independence',      weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.leadership.charisma',       weight: 0.60, evidence: { confidence: 0.75 } },
  ],
  bear: [
    { id: 'marker.instinct.primal_sense',     weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.love.protective',           weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.emotion.body_awareness',    weight: 0.70, evidence: { confidence: 0.75 } },
  ],
  fox: [
    { id: 'marker.cognition.analytical',      weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.social.diplomacy',          weight: 0.75, evidence: { confidence: 0.75 } },
    { id: 'marker.instinct.gut_feeling',      weight: 0.70, evidence: { confidence: 0.75 } },
  ],
  owl: [
    { id: 'marker.cognition.analytical',      weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.values.achievement',        weight: 0.75, evidence: { confidence: 0.75 } },
    { id: 'marker.instinct.gut_feeling',      weight: 0.65, evidence: { confidence: 0.75 } },
  ],
  dolphin: [
    { id: 'marker.social.extroversion',       weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.eq.empathy',               weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.social.openness',           weight: 0.75, evidence: { confidence: 0.75 } },
  ],
};

export function krafttierToEvent(animalId: string): ContributionEvent {
  const key = animalId.toLowerCase();
  const markers = KRAFTTIER_MARKERS[key] ?? [];
  const tag: Tag = { id: `tag.archetype.${key}`, label: animalId, kind: 'archetype', weight: 0.9 };
  return buildEvent('quiz.krafttier.v1', markers, [tag]);
}

// ═══════════════════════════════════════════════════════════════
// PERSONALITY (Big Five basiert)
// ═══════════════════════════════════════════════════════════════

const PERSONALITY_MARKERS: Record<string, string> = {
  openness:          'marker.social.openness',
  conscientiousness: 'marker.values.achievement',
  extraversion:      'marker.social.extroversion',
  agreeableness:     'marker.eq.empathy',
  neuroticism:       'marker.eq.stress_sensitivity',
};

export function personalityToEvent(
  scores: Record<string, number>,
): ContributionEvent {
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(PERSONALITY_MARKERS)) {
    const score = scores[dim];
    if (score != null) {
      markers.push({
        id: markerId,
        weight: Math.min(score / 100, 1),
        evidence: { confidence: 0.8, itemsAnswered: 20 },
      });
    }
  }

  return buildEvent('quiz.personality.v1', markers, []);
}

// ═══════════════════════════════════════════════════════════════
// EQ (Emotionale Intelligenz)
// ═══════════════════════════════════════════════════════════════

const EQ_MARKERS: Record<string, string> = {
  self_awareness:  'marker.eq.self_awareness',
  self_regulation: 'marker.eq.self_regulation',
  motivation:      'marker.eq.motivation',
  empathy:         'marker.eq.empathy',
  social_skill:    'marker.eq.social_skill',
};

export function eqToEvent(scores: Record<string, number>): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(EQ_MARKERS)) {
    if (scores[dim] != null) {
      markers.push({
        id: markerId,
        weight: Math.min(scores[dim] / maxScore, 1),
        evidence: { confidence: 0.75, itemsAnswered: 15 },
      });
    }
  }

  return buildEvent('quiz.eq.v1', markers, []);
}

// ═══════════════════════════════════════════════════════════════
// AURA COLORS
// ═══════════════════════════════════════════════════════════════

export function auraToEvent(
  primaryAura: string,
  scores: Record<string, number>,
): ContributionEvent {
  // Map color scores to semantic aura markers
  // warm colors → warmth, cool colors → mystery, bright → authority
  const warmth = (scores.rot ?? 0) + (scores.orange ?? 0) + (scores.rosa ?? 0);
  const mystery = (scores.indigo ?? 0) + (scores.violett ?? 0) + (scores.blau ?? 0);
  const authority = (scores.gelb ?? 0) + (scores.tuerkis ?? 0) + (scores.gruen ?? 0);
  const maxVal = Math.max(warmth, mystery, authority, 1);

  const markers: Marker[] = [
    { id: 'marker.aura.warmth', weight: Math.min(warmth / maxVal, 1), evidence: { confidence: 0.6, itemsAnswered: 12 } },
    { id: 'marker.aura.mystery', weight: Math.min(mystery / maxVal, 1), evidence: { confidence: 0.6, itemsAnswered: 12 } },
    { id: 'marker.aura.authority', weight: Math.min(authority / maxVal, 1), evidence: { confidence: 0.6, itemsAnswered: 12 } },
  ].filter(m => m.weight > 0);

  return buildEvent('quiz.aura_colors.v1', markers, [
    { id: `tag.style.${primaryAura}`, label: primaryAura, kind: 'style', weight: 0.7 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL ROLE
// ═══════════════════════════════════════════════════════════════

export function socialRoleToEvent(
  roleId: string,
  scores: Record<string, number>,
): ContributionEvent {
  const SOCIAL_MARKERS: Record<string, string> = {
    leadership:  'marker.social.dominance',
    harmony:     'marker.social.openness',
    expression:  'marker.social.extroversion',
    support:     'marker.eq.empathy',
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(SOCIAL_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.social_role.v2', markers, [
    { id: `tag.archetype.${roleId}`, label: roleId, kind: 'archetype', weight: 0.75 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// BLUMENWESEN
// ═══════════════════════════════════════════════════════════════

const BLUMENWESEN_MARKERS: Record<string, Marker[]> = {
  sonnenblume: [
    { id: 'marker.flower.warmth',       weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.social.extroversion', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  lotusblume: [
    { id: 'marker.flower.depth',        weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing',   weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  wildblume: [
    { id: 'marker.flower.spontaneity',  weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  eiche: [
    { id: 'marker.flower.guardian',     weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.instinct.primal_sense', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  rose: [
    { id: 'marker.flower.passionate',   weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.sensory_connection', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function blumenwesenToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = BLUMENWESEN_MARKERS[key] ?? [];
  return buildEvent('quiz.blumenwesen.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ENERGIESTEIN
// ═══════════════════════════════════════════════════════════════

const ENERGIESTEIN_MARKERS: Record<string, Marker[]> = {
  amethyst: [
    { id: 'marker.stone.clarity',         weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.vision',      weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  obsidian: [
    { id: 'marker.stone.depth',           weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.shadow_work', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  citrin: [
    { id: 'marker.stone.warmth',          weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.eq.motivation',         weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  bergkristall: [
    { id: 'marker.stone.clarity',         weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.analytical',  weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  rosenquarz: [
    { id: 'marker.stone.warmth',          weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.togetherness',     weight: 0.80, evidence: { confidence: 0.7 } },
  ],
  tigerauge: [
    { id: 'marker.stone.primal_force',    weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.leadership.authority',  weight: 0.70, evidence: { confidence: 0.7 } },
  ],
};

export function energiesteinToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = ENERGIESTEIN_MARKERS[key] ?? [];
  return buildEvent('quiz.energiestein.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CHARME
// ═══════════════════════════════════════════════════════════════

const CHARME_MARKERS: Record<string, string> = {
  warmth:       'marker.aura.warmth',
  resonance:    'marker.eq.empathy',
  authenticity: 'marker.eq.self_awareness',
  presence:     'marker.aura.authority',
};

export function charmeToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CHARME_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.charme.v1', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CAREER DNA
// ═══════════════════════════════════════════════════════════════

const CAREER_MARKERS: Record<string, string> = {
  vision:       'marker.values.vision',
  structure:    'marker.skills.system_thinking',
  people:       'marker.social.extroversion',
  creativity:   'marker.creative.creativity',
  independence: 'marker.freedom.independence',
};

export function careerDnaToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CAREER_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.75, itemsAnswered: 15 },
    }));

  return buildEvent('quiz.career_dna.v2', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SPOTLIGHT
// ═══════════════════════════════════════════════════════════════

export function spotlightToEvent(
  profileId: string,
  scores: Record<string, number>,
): ContributionEvent {
  const SPOTLIGHT_MARKERS: Record<string, string> = {
    charisma:   'marker.aura.charisma',
    warmth:     'marker.aura.warmth',
    authority:  'marker.leadership.authority',
    mystery:    'marker.aura.mystery',
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(SPOTLIGHT_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.spotlight.v2', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.75 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// DESTINY
// ═══════════════════════════════════════════════════════════════

const DESTINY_MARKERS: Record<string, Marker[]> = {
  pioneer: [
    { id: 'marker.psyche.risk_taking',   weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  sage: [
    { id: 'marker.psyche.self_awareness', weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.analytical',  weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  creator: [
    { id: 'marker.psyche.creativity',    weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.creative.expression',  weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  healer: [
    { id: 'marker.psyche.empathy',       weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing',    weight: 0.80, evidence: { confidence: 0.7 } },
  ],
  guardian: [
    { id: 'marker.psyche.guardian',      weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.protective',      weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function destinyToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = DESTINY_MARKERS[key] ?? [];
  return buildEvent('quiz.destiny.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.85 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// RPG IDENTITY
// ═══════════════════════════════════════════════════════════════

const RPG_MARKERS: Record<string, Marker[]> = {
  paladin: [
    { id: 'marker.leadership.guardian',        weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.social.protective',          weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  berserker: [
    { id: 'marker.instinct.primal_force',      weight: 0.90, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence',       weight: 0.60, evidence: { confidence: 0.7 } },
  ],
  heiler: [
    { id: 'marker.emotion.empathy',            weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing',          weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  nekromant: [
    { id: 'marker.cognition.shadow_work',      weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.depth',            weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  stratege: [
    { id: 'marker.cognition.system_thinking',  weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.leadership.planner',         weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  seher: [
    { id: 'marker.instinct.gut_feeling',       weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.vision',           weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function rpgIdentityToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = RPG_MARKERS[key] ?? [];
  return buildEvent('quiz.rpg_identity.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.85 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PARTY NEED
// ═══════════════════════════════════════════════════════════════

const PARTY_MARKERS: Record<string, string> = {
  social:     'marker.lifestyle.extroversion',
  energy:     'marker.lifestyle.spontaneity',
  intimacy:   'marker.lifestyle.warmth',
  adventure:  'marker.lifestyle.adventure',
};

export function partyToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(PARTY_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.65, itemsAnswered: 10 },
    }));

  return buildEvent('quiz.party_need.v1', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.7 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CELEBRITY SOULMATE
// ═══════════════════════════════════════════════════════════════

const CELEB_MARKERS: Record<string, string> = {
  charisma:    'marker.social.charisma',
  creativity:  'marker.creative.creativity',
  empathy:     'marker.social.empathy',
  ambition:    'marker.values.achievement',
};

export function celebritySoulmateToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CELEB_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.6, itemsAnswered: 10 },
    }));

  return buildEvent('quiz.celebrity_soulmate.v1', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.7 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// GENERIC BUILDER
// ═══════════════════════════════════════════════════════════════

function buildEvent(
  moduleId: string,
  markers: Marker[],
  tags: Tag[],
): ContributionEvent {
  return {
    specVersion: 'sp.contribution.v1',
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: 'quiz',
      moduleId,
      locale: 'de-DE',
    },
    payload: {
      markers,
      tags: tags.length > 0 ? tags : undefined,
    },
  };
}
