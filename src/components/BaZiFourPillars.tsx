import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getCoinAsset } from "../lib/astro-data/coinAssets";
import { getBranchByAnimal } from "../lib/astro-data/earthlyBranches";
import { getWuxingByKey } from "../lib/astro-data/wuxing";
import { getStemByCharacter } from "../lib/astro-data/heavenlyStems";
import type { MappedPillar } from "@/src/types/bafe";
import { useLanguage } from "../contexts/LanguageContext";

interface BaZiFourPillarsProps {
  pillars: {
    year: MappedPillar;
    month: MappedPillar;
    day: MappedPillar;
    hour: MappedPillar;
  } | undefined;
  lang: "en" | "de";
  planetariumMode?: boolean;
}

const PILLAR_META: Record<string, { label: { en: string; de: string }; chinese: string; desc: { en: string; de: string } }> = {
  year:  {
    label: { en: "Year Pillar", de: "Jahres-Säule" },
    chinese: "年柱",
    desc: {
      en: "The Year Pillar reveals your outer persona — how society perceives you and the role you naturally assume in groups.",
      de: "Die Jahres-Säule zeigt deine äußere Persona — wie die Gesellschaft dich wahrnimmt und welche Rolle du natürlich in Gruppen einnimmst.",
    },
  },
  month: {
    label: { en: "Month Pillar", de: "Monats-Säule" },
    chinese: "月柱",
    desc: {
      en: "The Month Pillar governs career, ambition, and the middle phase of life — your drive toward achievement.",
      de: "Die Monats-Säule regiert Karriere, Ambition und die mittlere Lebensphase — deinen Antrieb zur Leistung.",
    },
  },
  day:   {
    label: { en: "Day Pillar", de: "Tages-Säule" },
    chinese: "日柱",
    desc: {
      en: "The Day Pillar is your Day Master (日主) — the truest expression of your inner self and core personality.",
      de: "Die Tages-Säule ist dein Day Master (日主) — der wahrste Ausdruck deines inneren Selbst und deiner Kernpersönlichkeit.",
    },
  },
  hour:  {
    label: { en: "Hour Pillar", de: "Stunden-Säule" },
    chinese: "時柱",
    desc: {
      en: "The Hour Pillar reveals your hidden self — unconscious patterns, private aspirations, and the legacy you leave.",
      de: "Die Stunden-Säule enthüllt dein verborgenes Selbst — unbewusste Muster, private Bestrebungen und das Vermächtnis, das du hinterlässt.",
    },
  },
};

export function BaZiFourPillars({ pillars, lang, planetariumMode: _planetariumMode }: BaZiFourPillarsProps) {
  const { t } = useLanguage();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  const pillarEntries = useMemo(() => {
    if (!pillars) return [];
    return (["year", "month", "day", "hour"] as const).map((key) => ({
      key,
      pillar: pillars[key] ?? null,
    }));
  }, [pillars]);

  if (pillarEntries.length === 0) return null;

  const selectedEntry = selectedPillar ? pillarEntries.find((e) => e.key === selectedPillar) : null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {pillarEntries.map(({ key, pillar }, i) => {
          const meta = PILLAR_META[key];
          const isDayMaster = key === "day";
          const branch = pillar?.animal ? getBranchByAnimal(pillar.animal) : null;
          const elData = pillar?.element ? getWuxingByKey(pillar.element) : null;
          const coinSrc = pillar?.animal ? getCoinAsset(pillar.animal) : undefined;
          const isUnavailable = !pillar || (!pillar.stem && !pillar.animal);
          const isSelected = selectedPillar === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <button
                type="button"
                className="w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]/50 rounded-xl"
                onClick={() => setSelectedPillar(isSelected ? null : key)}
                aria-expanded={isSelected}
                aria-label={`${meta.label[lang]} — ${isSelected ? (lang === 'de' ? 'schließen' : 'collapse') : (lang === 'de' ? 'öffnen' : 'expand')}`}
              >
                <div
                  className={`morning-stele group w-full relative transition-shadow ${
                    isDayMaster
                      ? "ring-1 ring-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                      : ""
                  } ${isSelected ? "ring-1 ring-[#D4AF37]/40 shadow-[0_0_16px_rgba(212,175,55,0.1)]" : "hover:ring-1 hover:ring-[#8B6914]/20"}`}
                >
                  {/* Day Master badge */}
                  {isDayMaster && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full px-2.5 py-0.5 text-[7px] uppercase tracking-[0.3em] text-[#D4AF37] whitespace-nowrap">
                      Day Master
                    </div>
                  )}

                  {/* Chinese pillar label */}
                  <div className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/55 mb-3 group-hover:text-[#8B6914] transition-colors">
                    {meta.label[lang]}
                  </div>
                  <div className="text-xs text-[#8B6914]/40 mb-4">{meta.chinese}</div>

                  {isUnavailable ? (
                    <div className="text-center py-6">
                      <p className="text-xs italic" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
                        {t("dashboard.bazi.birthTimeNotProvided")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Coin */}
                      {coinSrc && (
                        <div className="flex justify-center mb-3">
                          <img
                            src={coinSrc}
                            alt={pillar.animal}
                            className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] object-contain rounded-full ${
                              isDayMaster ? "ring-2 ring-[#D4AF37]/20" : ""
                            }`}
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Stem */}
                      <div className="font-serif text-2xl mb-1" style={{ color: 'var(--tile-text-primary)' }}>
                        {pillar.stem || "—"}
                      </div>

                      {/* Branch */}
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
                        {pillar.branch || ""}
                      </div>

                      {/* Animal */}
                      {pillar.animal && (
                        <div className="text-[9px] text-[#8B6914]/50 mt-1.5 tracking-wide">
                          {branch ? branch.animal[lang] : pillar.animal}
                        </div>
                      )}

                      {/* Element */}
                      {elData && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <span className="font-serif text-sm" style={{ color: elData.color }}>
                            {elData.chinese}
                          </span>
                          <span className="text-[9px]" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
                            {elData.name[lang]}
                          </span>
                        </div>
                      )}

                      {/* Expand hint */}
                      <div className={`mt-3 text-[8px] tracking-[0.2em] uppercase transition-colors ${
                        isSelected ? "text-[#D4AF37]/70" : "text-[#8B6914]/35 group-hover:text-[#8B6914]/55"
                      }`}>
                        {isSelected
                          ? (lang === 'de' ? 'schließen' : 'close')
                          : (lang === 'de' ? 'details' : 'details')}
                      </div>
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ── Expandable detail panel ────────────────────────────────── */}
      <AnimatePresence>
        {selectedEntry && selectedEntry.pillar && (
          <motion.div
            key={selectedEntry.key}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <PillarDetail
              pillarKey={selectedEntry.key}
              pillar={selectedEntry.pillar}
              lang={lang}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

interface PillarDetailProps {
  pillarKey: string;
  pillar: MappedPillar;
  lang: "en" | "de";
}

function PillarDetail({ pillarKey, pillar, lang }: PillarDetailProps) {
  const meta = PILLAR_META[pillarKey];
  const stemData = pillar.stem ? getStemByCharacter(pillar.stem) : null;
  const branchData = pillar.animal ? getBranchByAnimal(pillar.animal) : null;
  const isDayMaster = pillarKey === "day";
  const stemContext = isDayMaster ? stemData?.dayMaster : stemData?.monthStem;

  return (
    <div className="mt-4 cosmic-tile p-5 border border-[#D4AF37]/15 space-y-4">
      {/* Pillar description */}
      <div>
        <p className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-1.5">
          {meta.label[lang]} · {meta.chinese}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
          {meta.desc[lang]}
        </p>
      </div>

      {/* Stem description */}
      {stemData && stemContext && (
        <div className="border-t border-[#8B6914]/10 pt-4">
          <p className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-1.5">
            {stemData.name[lang]} · {stemData.chinese}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
            {stemContext[lang]}
          </p>
        </div>
      )}

      {/* Animal description */}
      {branchData && (
        <div className="border-t border-[#8B6914]/10 pt-4">
          <p className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-1.5">
            {branchData.animal[lang]} · {branchData.chinese}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
            {branchData.description[lang]}
          </p>
        </div>
      )}
    </div>
  );
}
