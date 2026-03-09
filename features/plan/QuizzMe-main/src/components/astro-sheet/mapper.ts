import {
  AstroSheetViewModel,
  AstroProfileRow,
  HousePlacement,
  NatalAspect,
  NatalBody,
  BaZiData,
  BaZiPillar,
  FusionData,
  WuXing
} from './model';

type RawPlanet = { name?: string; body?: string; sign?: string; degree?: number; house?: number };
type RawHouse = { number?: number; sign?: string; degree?: number };
type RawAspect = { from?: string; to?: string; p1?: string; p2?: string; type?: string; aspect?: string; orb?: number };

// ═══════════════════════════════════════════════════════════════════════════
// BA ZI MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapBaZiPillar(raw: Record<string, unknown> | undefined): BaZiPillar | null {
  if (!raw) return null;
  return {
    stem: (raw.stem as string) || '',
    stemCN: (raw.stemCN as string) || '',
    branch: (raw.branch as string) || '',
    branchCN: (raw.branchCN as string) || '',
    element: (raw.element as WuXing) || 'Earth',
    polarity: (raw.polarity as 'Yang' | 'Yin') || 'Yang',
    animal: (raw.animal as string) || '',
    animalDE: (raw.animalDE as string) || '',
  };
}

function mapBaZiData(raw: Record<string, unknown> | undefined): BaZiData | null {
  if (!raw) return null;

  const year = mapBaZiPillar(raw.year as Record<string, unknown>);
  const month = mapBaZiPillar(raw.month as Record<string, unknown>);
  const day = mapBaZiPillar(raw.day as Record<string, unknown>);
  const hour = mapBaZiPillar(raw.hour as Record<string, unknown>);
  const dayMasterRaw = raw.dayMaster as Record<string, unknown> | undefined;

  if (!year || !month || !day || !hour) return null;

  return {
    year,
    month,
    day,
    hour,
    dayMaster: {
      stem: (dayMasterRaw?.stem as string) || day.stem,
      stemCN: (dayMasterRaw?.stemCN as string) || day.stemCN,
      element: (dayMasterRaw?.element as WuXing) || day.element,
      polarity: (dayMasterRaw?.polarity as 'Yang' | 'Yin') || day.polarity,
    },
    fullNotation: (raw.fullNotation as string) || '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUSION MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapFusionData(raw: Record<string, unknown> | undefined): FusionData | null {
  if (!raw) return null;

  const ev = raw.elementVector as Record<string, unknown> | undefined;
  if (!ev) return null;

  const combined = (ev.combined as number[]) || [0.2, 0.2, 0.2, 0.2, 0.2];
  const eastern = (ev.eastern as number[]) || [0.2, 0.2, 0.2, 0.2, 0.2];
  const western = (ev.western as number[]) || [0.2, 0.2, 0.2, 0.2, 0.2];

  return {
    elementVector: {
      combined: combined as [number, number, number, number, number],
      eastern: eastern as [number, number, number, number, number],
      western: western as [number, number, number, number, number],
      dominantElement: (ev.dominantElement as WuXing) || 'Earth',
      dominantElementDE: (ev.dominantElementDE as FusionData['elementVector']['dominantElementDE']) || 'Erde',
      deficientElement: (ev.deficientElement as WuXing) || 'Earth',
      deficientElementDE: (ev.deficientElementDE as FusionData['elementVector']['deficientElementDE']) || 'Erde',
    },
    harmonyIndex: (raw.harmonyIndex as number) || 0.5,
    harmonyInterpretation: (raw.harmonyInterpretation as string) || 'Moderate Kohärenz',
    resonances: ((raw.resonances as Array<Record<string, unknown>>) || []).map(r => ({
      type: (r.type as string) || '',
      eastern: (r.eastern as string) || '',
      western: (r.western as string) || '',
      strength: (r.strength as number) || 0,
      quality: (r.quality as 'harmony' | 'tension' | 'neutral') || 'neutral',
      description: r.description as string | undefined,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MAPPER
// ═══════════════════════════════════════════════════════════════════════════

export function mapProfileToViewModel(row: AstroProfileRow | null): AstroSheetViewModel {
  if (!row) {
    return getEmptyViewModel();
  }

  const isPremium = row.account_tier === 'premium';
  const status = row.input_status ?? 'ready';

  const hasJson = row.astro_json && Object.keys(row.astro_json).length > 0;
  const validationStatus = row.astro_validation_status;
  const jsonStatus = row.astro_json?.validation?.status;
  const isOk = (validationStatus === 'ok' || jsonStatus === 'ok') && hasJson;

  const needsCompute = !isOk;
  const hasAmbiguousTime = validationStatus === 'AMBIGUOUS_LOCAL_TIME' || jsonStatus === 'AMBIGUOUS_LOCAL_TIME';
  const errorMessage = status === 'error' || !isOk
    ? (validationStatus || row.astro_validation_json?.message || 'Compute required')
    : undefined;

  // Western signs
  const sun = row.sun_sign || row.astro_json?.western?.planets?.Sun?.sign || "Unknown";
  const moon = row.moon_sign || row.astro_json?.western?.planets?.Moon?.sign || "Unknown";
  const asc = row.asc_sign || row.astro_json?.western?.ascendantSign || "Unknown";

  // Ba Zi data
  const baziData = mapBaZiData(row.astro_json?.bazi as Record<string, unknown>);
  const element = baziData?.dayMaster?.element || row.astro_json?.bazi?.year?.element || "Metal";
  const animal = baziData?.year?.animal || row.astro_json?.bazi?.year?.animal || "Horse";

  // Fusion data
  const fusionData = mapFusionData(row.astro_json?.fusion as Record<string, unknown>);

  // Generate stats from fusion element vector
  const stats = fusionData ? [
    { label: "Holz", value: Math.round(fusionData.elementVector.combined[0] * 100) },
    { label: "Feuer", value: Math.round(fusionData.elementVector.combined[1] * 100) },
    { label: "Erde", value: Math.round(fusionData.elementVector.combined[2] * 100) },
    { label: "Metall", value: Math.round(fusionData.elementVector.combined[3] * 100) },
    { label: "Wasser", value: Math.round(fusionData.elementVector.combined[4] * 100) },
  ] : [
    { label: "Holz", value: 20 },
    { label: "Feuer", value: 20 },
    { label: "Erde", value: 20 },
    { label: "Metall", value: 20 },
    { label: "Wasser", value: 20 },
  ];

  const planets: NatalBody[] = (row.astro_json?.western?.planets as RawPlanet[] | undefined || []).map((p) => ({
    name: p.name || p.body || "Planet",
    sign: p.sign || "",
    degree: Number(p.degree || 0),
    house: p.house,
  }));

  const houses: HousePlacement[] = (row.astro_json?.western?.houses as RawHouse[] | undefined || []).map((h, idx: number) => ({
    number: h.number || idx + 1,
    sign: h.sign || "",
    degree: Number(h.degree || 0),
  }));

  const aspects: NatalAspect[] = (row.astro_json?.western?.aspects as RawAspect[] | undefined || []).map((a) => ({
    from: a.from || a.p1 || "",
    to: a.to || a.p2 || "",
    type: a.type || a.aspect || "",
    orb: a.orb ? Number(a.orb) : undefined,
  }));

  return {
    identity: {
      displayName: row.username || "Traveler",
      solarSign: sun,
      lunarSign: moon,
      ascendantSign: asc,
      level: 1,
      status: "INITIATE",
      element,
      animal,
      symbol: row.astro_json?.symbol ? {
        svg: row.astro_json.symbol.svg,
        description: row.astro_json.symbol.description,
        prompt: row.astro_json.symbol.prompt,
      } : undefined,
    },
    bazi: baziData,
    fusion: fusionData,
    stats,
    quizzes: [
      { id: "q1", title: "Unlock your Moon", href: "#", status: "locked", progress: 0 }
    ],
    agents: [],
    monetization: {
      isPremium,
      showAds: !isPremium,
    },
    natal: {
      planets,
      houses,
      aspects,
    },
    validation: {
      needsCompute,
      hasAmbiguousTime,
      errorMessage: hasAmbiguousTime ? undefined : errorMessage,
      status,
      computedAt: row.astro_computed_at ?? null,
    }
  };
}

function getEmptyViewModel(): AstroSheetViewModel {
  return {
    identity: { displayName: "", solarSign: "", lunarSign: "", ascendantSign: "", level: 0, status: "" },
    bazi: null,
    fusion: null,
    stats: [],
    quizzes: [],
    agents: [],
    monetization: { isPremium: false, showAds: false },
    natal: { planets: [], houses: [], aspects: [] },
    validation: { needsCompute: true, hasAmbiguousTime: false }
  };
}
