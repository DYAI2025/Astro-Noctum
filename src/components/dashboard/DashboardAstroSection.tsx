import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp, BarChart2, MessageSquare, LayoutGrid } from "lucide-react";
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

// ── Animation helper ──────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  };
}

// ── Section sub-components ────────────────────────────────────────────────

function CardHeader({ label, title, icon }: { label: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        {icon}
        <p className="text-[8px] uppercase tracking-[0.35em]" style={{ color: 'var(--tile-accent)' }}>{label}</p>
      </div>
      <h3 className="font-serif text-lg leading-tight" style={{ color: 'var(--tile-text-primary)' }}>{title}</h3>
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

      {/* ═══ BAZI & WUXING DEEP SECTION — Card Harmony Cluster ════════ */}
      <div id="section-bazi" />
      <div id="section-wuxing" />
      
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-stretch" 
          {...fadeIn(0.3)}
        >
          {/* Card 1: BaZi Four Pillars */}
          <div className="cosmic-tile p-6 flex flex-col h-full">
            <CardHeader 
              label="BaZi" 
              title={t("dashboard.bazi.fourPillarsShort")}
              icon={<LayoutGrid size={12} style={{ color: 'var(--tile-accent)' }} />}
            />
            {apiData.bazi?.pillars ? (
              <div className="flex-1 overflow-visible">
                <BaZiFourPillars
                  pillars={apiData.bazi.pillars}
                  lang={lang}
                  planetariumMode={planetariumMode}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-xs italic opacity-40">
                  {t("dashboard.bazi.birthTimeNotProvided")}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Element Balance */}
          <div className="cosmic-tile p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-0">
              <CardHeader 
                label="WuXing" 
                title={lang === "de" ? "Elemente-Balance" : "Element Balance"}
                icon={<BarChart2 size={12} style={{ color: 'var(--tile-accent)' }} />}
              />
              <Link
                to="/wu-xing"
                className="opacity-40 hover:opacity-100 transition-opacity p-2 -mt-8 -mr-2"
                title={lang === "de" ? "Detailansicht" : "Detailed view"}
              >
                <ArrowUp className="w-4 h-4 rotate-45" />
              </Link>
            </div>
            
            <div className="flex-1 space-y-4">
              {WUXING_ELEMENTS.map((el) => {
                const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
                const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                const pctBar = hasWuxingData ? (count / maxCount) * 100 : 0;
                const isDom = el.key === dominantEl || el.name.de === dominantEl;
                
                return (
                  <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                    <div className="flex items-center gap-3 cursor-help group">
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        <WuXingIcon element={el.key} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-medium truncate" style={{ color: 'var(--tile-text-primary)' }}>
                            {el.name[lang]}
                          </span>
                          {hasWuxingData && pctLabel > 0 && (
                            <span className="text-[9px] opacity-50 font-sans tabular-nums">{pctLabel}%</span>
                          )}
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          {hasWuxingData ? (
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ backgroundColor: el.color, width: `${Math.max(pctBar, pctBar > 0 ? 4 : 0)}%` }}
                            />
                          ) : (
                            <div className="h-full w-full bg-white/10 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                      {isDom && (
                        <div className="w-2 shrink-0 flex items-center justify-center">
                          <span className="text-[10px]" style={{ color: el.color }}>●</span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            <p className="mt-6 text-[10px] leading-relaxed opacity-50 italic">
              {t("dashboard.wuxing.sectionDesc").split('.')[0]}.
            </p>
          </div>

          {/* Card 3: Interpretation */}
          <div className="cosmic-tile p-6 flex flex-col h-full">
            <CardHeader 
              label={t("dashboard.bazi.sectionLabel")}
              title={lang === "de" ? "Dein BaZi-Potenzial" : "Your BaZi Potential"}
              icon={<MessageSquare size={12} style={{ color: 'var(--tile-accent)' }} />}
            />
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <BaZiInterpretation
                animal={yearAnimal}
                element={yearEl}
                balance={wuxingBalance}
                lang={lang}
              />
            </div>
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
