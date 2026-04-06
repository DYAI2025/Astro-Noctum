import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { PremiumGate } from "../PremiumGate";
import { useLanguage } from "../../contexts/LanguageContext";
import { WUXING_ELEMENTS } from "../../lib/astro-data/wuxing";
import { usePlanetarium } from "../../contexts/PlanetariumContext";
import { Tooltip } from "../Tooltip";
import { BaZiFourPillars } from "../BaZiFourPillars";
import { BaZiInterpretation } from "../BaZiInterpretation";
import type { ApiData } from "../../types/bafe";
import type { TileTexts } from "../../types/interpretation";

import { DashboardHeroNav } from "./DashboardHeroNav";
import { AstroDetailModal, type AstroDetailId } from "./AstroDetailModal";
import { WuXingIcon } from "../animated-icons/CosmicSymbols";
import { IconOrbit } from "../animated-icons";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const ZODIAC_SIGNS_LIST = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

function signFromIndex(idx: number | undefined | null): string {
  if (idx == null || idx < 0 || idx > 11) return "";
  return ZODIAC_SIGNS_LIST[idx];
}

// ── Animation helper ──────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  };
}

// ── Section sub-components ────────────────────────────────────────────────

function SectionDivider({ label, title, icon }: { label: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="border-b border-[#8B6914]/15 pb-3 sm:pb-4 mb-6 sm:mb-8">
      <p className="text-[#8B6914]/75 text-[8px] uppercase tracking-[0.45em] mb-1">{label}</p>
      <h2 className="font-serif text-xl sm:text-2xl" style={{ color: 'var(--tile-text-primary)' }}>{icon}{title}</h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardAstroSectionProps {
  apiData: ApiData;
  isPremium: boolean;
  tileTexts?: TileTexts;
  leviSlot?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardAstroSection({
  apiData,
  isPremium,
  tileTexts,
  leviSlot,
}: DashboardAstroSectionProps) {
  const { lang, t } = useLanguage();
  const { planetariumMode } = usePlanetarium();

  // ── Astro detail modal ────────────────────────────────────────────
  const [activeDetail, setActiveDetail] = useState<AstroDetailId | null>(null);

  // ── Data extraction ────────────────────────────────────────────────

  const sunSign       = apiData.western?.zodiac_sign      || "";
  const dominantEl    = apiData.wuxing?.dominant_element  || "";

  // WuXing element counts + percentage fix
  const wuxingCounts: Record<string, number> = useMemo(
    () => apiData.wuxing?.elements || (apiData.wuxing?.element_counts as Record<string, number> | undefined) || {},
    [apiData.wuxing],
  );
  const hasWuxingData = useMemo(
    () => Object.values(wuxingCounts).some((v) => Number(v) > 0),
    [wuxingCounts],
  );
  const totalCount = useMemo(
    () => Object.values(wuxingCounts).reduce((sum, v) => sum + Number(v), 0),
    [wuxingCounts],
  );
  const maxCount = useMemo(
    () => Math.max(...Object.values(wuxingCounts).map(Number), 1),
    [wuxingCounts],
  );

  // Development-only WuXing data verification
  useEffect(() => {
    if (import.meta.env.DEV && Object.keys(wuxingCounts).length > 0) {
      console.log("[WuXing Verify] Raw API elements:", apiData.wuxing?.elements);
      console.log("[WuXing Verify] Mapped counts:", wuxingCounts);
      console.log("[WuXing Verify] Total:", totalCount, "Max:", maxCount, "Has data:", hasWuxingData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — dev-only logging, no need to re-run on every dep change
  }, [wuxingCounts]);

  // BaZi section computed data
  const wuxingBalance = useMemo(() => {
    const raw = apiData.wuxing?.elements || apiData.wuxing?.element_counts || {};
    const total: number = Object.values(raw).reduce<number>((sum, v) => sum + Number(v), 0);
    if (total === 0) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Number(v) / total])
    );
  }, [apiData.wuxing]);

  const yearAnimal = apiData.bazi?.zodiac_sign || "";
  const yearEl = apiData.bazi?.pillars?.year?.element || "";

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══ HERO NAV — Three section tiles ══════════════════════════ */}
      <DashboardHeroNav
        sunSign={sunSign}
        dominantElement={dominantEl}
        zodiacAnimal={yearAnimal}
        onTileClick={setActiveDetail}
      />

      {/* ═══ ASTRO DETAIL MODAL ════════════════════════════════════════ */}
      <AstroDetailModal
        activeId={activeDetail}
        onClose={() => setActiveDetail(null)}
        apiData={apiData}
        tileTexts={tileTexts || {}}
      />

      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <div id="section-bazi" />
      <div id="section-wuxing" />
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
        <motion.div className="mb-12" {...fadeIn(0.3)}>
          {/* Block A: Header */}
          <SectionDivider
            label={t("dashboard.bazi.sectionLabel")}
            title={t("dashboard.bazi.sectionTitleFull")}
            icon={<IconOrbit className="w-6 h-6 text-[#8B6914] inline-block mr-3 align-middle" />}
          />

          {/* Block B: Four Pillars */}
          {apiData.bazi?.pillars && (
            <div className="mb-10">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/70 mb-4">
                {t("dashboard.bazi.fourPillarsShort")}
              </p>
              <BaZiFourPillars
                pillars={apiData.bazi.pillars}
                lang={lang}
                planetariumMode={planetariumMode}
              />
            </div>
          )}

          {/* Block C: Element Balance */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/70">
                WuXing {"\u4E94\u884C"}
              </p>
              <Link
                to="/wu-xing"
                className="text-[9px] uppercase tracking-[0.2em] text-[#8B6914]/60 hover:text-[#8B6914] transition-colors flex items-center gap-1.5"
              >
                <span>{lang === "de" ? "Detailansicht" : "Detailed view"}</span>
                <ArrowUp className="w-3 h-3 rotate-45" />
              </Link>
            </div>
            <p className="text-xs text-[var(--color-text-bright-dim)] mb-6 leading-relaxed max-w-2xl">
              {t("dashboard.wuxing.sectionDesc")}
            </p>

            <div className="cosmic-tile p-5 md:p-6 max-w-2xl">
              <div className="space-y-4">
                {WUXING_ELEMENTS.map((el) => {
                  const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
                  const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  const pctBar = hasWuxingData ? (count / maxCount) * 100 : 0;
                  const isDom = el.key === dominantEl || el.name.de === dominantEl;
                  return (
                    <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                      <div className="flex items-center gap-2 sm:gap-4 cursor-help group">
                        <div className="w-24 sm:w-28 md:w-36 shrink-0 flex items-center gap-2 sm:gap-2.5">
                          <WuXingIcon element={el.key} className="w-6 h-6" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: 'var(--tile-text-primary)' }}>{el.name[lang]}</div>
                            <div className="text-[10px] text-[var(--color-text-bright-dim)]">{el.pinyin}</div>
                          </div>
                        </div>
                        <div className="flex-1 wuxing-bar-track">
                          {hasWuxingData ? (
                            <div
                              className="wuxing-bar-fill"
                              style={{ backgroundColor: el.color, width: `${Math.max(pctBar, pctBar > 0 ? 2 : 0)}%` }}
                            />
                          ) : (
                            <div className="h-full rounded-full" style={{ backgroundColor: el.color + "20", width: "100%" }} />
                          )}
                        </div>
                        <div className="w-12 shrink-0 text-right flex items-center justify-end gap-1">
                          {hasWuxingData && pctLabel > 0 && (
                            <span className="text-[10px] text-[var(--color-text-bright-dim)] font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>{pctLabel}%</span>
                          )}
                          {isDom && <span className="text-sm" style={{ color: el.color }}>{"\u2605"}</span>}
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Block D: Interpretation */}
          <div className="cosmic-tile p-6">
            <BaZiInterpretation
              animal={yearAnimal}
              element={yearEl}
              balance={wuxingBalance}
              lang={lang}
            />
          </div>
        </motion.div>
      </PremiumGate>

      {/* ═══ LEVI CTA SLOT ═════════════════════════════════════════ */}
      {leviSlot && (
        <motion.div className="mb-12" {...fadeIn(0.35)}>
          {leviSlot}
        </motion.div>
      )}

    </>
  );
}
