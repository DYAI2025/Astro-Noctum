export type SpecVersion = 'sp.contribution.v1';

export type Marker = {
  id: string;           // marker.domain.keyword
  weight: number;       // 0..1
  evidence?: {
    itemsAnswered?: number;
    confidence?: number;  // 0..1
  };
};

export type TraitScore = {
  id: string;
  score: number;        // 1..100
  band?: 'low' | 'midlow' | 'mid' | 'midhigh' | 'high';
  confidence?: number;
  method?: 'likert' | 'forced_choice' | 'scenario' | 'task' | 'derived';
};

export type Tag = {
  id: string;
  label: string;
  kind: 'archetype' | 'shadow' | 'style' | 'astro' | 'interest' | 'misc';
  weight?: number;
};

export type ContributionEvent = {
  specVersion: SpecVersion;
  eventId: string;
  occurredAt: string;    // ISO
  userRef?: string;
  source: {
    vertical: 'character' | 'quiz' | 'horoscope' | 'future';
    moduleId: string;
    domain?: string;
    locale?: string;
    build?: string;
  };
  payload: {
    markers: Marker[];
    traits?: TraitScore[];
    tags?: Tag[];
    summary?: {
      title?: string;
      bullets?: string[];
      resultId?: string;
    };
  };
};
