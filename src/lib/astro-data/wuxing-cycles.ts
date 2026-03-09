// ── WuXing Cycle Data ─────────────────────────────────────────────────────
// Generation cycle: 相生 (xiāngshēng) — each element produces the next
// Control cycle: 相克 (xiāngkè) — each element controls another

export interface WuxingCycleEdge {
  from: string;
  to: string;
  label: { en: string; de: string };
}

/** 相生 Generation cycle: Wood → Fire → Earth → Metal → Water → Wood */
export const GENERATION_CYCLE: WuxingCycleEdge[] = [
  { from: "Wood",  to: "Fire",  label: { en: "Wood feeds Fire",    de: "Holz nährt Feuer"      } },
  { from: "Fire",  to: "Earth", label: { en: "Fire creates Earth", de: "Feuer erzeugt Erde"    } },
  { from: "Earth", to: "Metal", label: { en: "Earth bears Metal",  de: "Erde gebiert Metall"   } },
  { from: "Metal", to: "Water", label: { en: "Metal collects Water", de: "Metall sammelt Wasser" } },
  { from: "Water", to: "Wood",  label: { en: "Water nourishes Wood", de: "Wasser nährt Holz"   } },
];

/** 相克 Control cycle: Wood → Earth → Water → Fire → Metal → Wood */
export const CONTROL_CYCLE: WuxingCycleEdge[] = [
  { from: "Wood",  to: "Earth", label: { en: "Wood parts Earth",    de: "Holz teilt Erde"       } },
  { from: "Earth", to: "Water", label: { en: "Earth absorbs Water", de: "Erde absorbiert Wasser" } },
  { from: "Water", to: "Fire",  label: { en: "Water quenches Fire", de: "Wasser löscht Feuer"   } },
  { from: "Fire",  to: "Metal", label: { en: "Fire melts Metal",    de: "Feuer schmilzt Metall" } },
  { from: "Metal", to: "Wood",  label: { en: "Metal chops Wood",    de: "Metall fällt Holz"    } },
];

/** Tension detection: strong element + weak controller = imbalance */
export interface WuxingTension {
  dominant: string;
  controller: string;
  description: { en: string; de: string };
}

export function detectTensions(
  balance: Record<string, number>,
  threshold = 0.6,
  weakThreshold = 0.15,
): WuxingTension[] {
  const tensions: WuxingTension[] = [];
  for (const edge of CONTROL_CYCLE) {
    const domVal = balance[edge.to] ?? 0;
    const ctrlVal = balance[edge.from] ?? 0;
    if (domVal > threshold && ctrlVal < weakThreshold) {
      tensions.push({
        dominant: edge.to,
        controller: edge.from,
        description: {
          en: `Strong ${edge.to} with weak ${edge.from} — ${edge.to} energy operates without natural checks.`,
          de: `Starkes ${edge.to} bei schwachem ${edge.from} — ${edge.to}-Energie wirkt ohne natürliche Begrenzung.`,
        },
      });
    }
  }
  return tensions;
}
