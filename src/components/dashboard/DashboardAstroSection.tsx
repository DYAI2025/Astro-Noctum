import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";
const BirthChartOrrery = lazy(() => import("../BirthChartOrrery").then(m => ({ default: m.BirthChartOrrery })));
import { PremiumGate } from "../PremiumGate";
import { useLanguage } from "../../contexts/LanguageContext";
import { WUXING_ELEMENTS, getWuxingName } from "../../lib/astro-data/wuxing";
import { getConstellationForSign } from "../../lib/astro-data/constellationFromSign";
import { usePlanetarium } from "../../contexts/PlanetariumContext";
import { Tooltip } from "../Tooltip";
import { BaZiFourPillars } from "../BaZiFourPillars";
import { BaZiInterpretation } from "../BaZiInterpretation";
import type { ApiData } from "../../types/bafe";
import type { TileTexts } from "../../types/interpretation";
import { AstroAccordion } from "./AstroAccordion";
import { DashboardHeroNav } from "./DashboardHeroNav";
import { SkyModeToggle } from "./SkyModeToggle";
import { WuXingIcon } from "../animated-icons/CosmicSymbols";
import { IconOrbit } from "../animated-icons";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const WESTERN_EMOJIS: Record<string, string> = {
  Aries: "\u2648", Taurus: "\u2649", Gemini: "\u264A", Cancer: "\u264B",
  Leo: "\u264C", Virgo: "\u264D", Libra: "\u264E", Scorpio: "\u264F",
  Sagittarius: "\u2650", Capricorn: "\u2651", Aquarius: "\u2652", Pisces: "\u2653",
};

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
      <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{label}</p>
      <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">{icon}{title}</h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardAstroSectionProps {
  apiData: ApiData;
  birthDate: string | null;
  isPremium: boolean;
  isFirstReading: boolean;
  tileTexts?: TileTexts;
  leviSlot?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardAstroSection({
  apiData,
  birthDate,
  isPremium,
  isFirstReading,
  tileTexts,
  leviSlot,
}: DashboardAstroSectionProps) {
  const { lang, t } = useLanguage();
  const { planetariumMode, setPlanetariumMode, skyMode } = usePlanetarium();

  // ── First-visit Birth Sky welcome ────────────────────────────────
  const [showBirthSkyWelcome, setShowBirthSkyWelcome] = useState(false);

  useEffect(() => {
    if (isFirstReading) {
      setPlanetariumMode(true);
      setShowBirthSkyWelcome(true);
      const timer = setTimeout(() => setShowBirthSkyWelcome(false), 12000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — setPlanetariumMode is a stable context setter; only isFirstReading should trigger
  }, [isFirstReading]);

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

  const orreryDate = useMemo(() => {
    if (!birthDate) return new Date();
    const d = new Date(birthDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [birthDate]);

  // Birth constellation for Planetarium Mode
  const birthConstellationKey = useMemo(
    () => getConstellationForSign(sunSign)?.key,
    [sunSign],
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
      />

      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <div id="section-western" />
      <motion.div className="mb-14 -mx-4 md:-mx-6" {...fadeIn(0.1)}>
        <Suspense fallback={<div className="w-full aspect-square bg-[#0A0A14] rounded-2xl animate-pulse" />}>
          <BirthChartOrrery
            birthDate={orreryDate}
            planetariumMode={planetariumMode}
            birthConstellation={birthConstellationKey}
            autoPlay={showBirthSkyWelcome}
            currentSky={skyMode === 'current'}
          />
        </Suspense>

        {/* Birth Sky Welcome Banner */}
        <AnimatePresence>
          {showBirthSkyWelcome && planetariumMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="relative -mt-20 mb-4 z-20 flex justify-center pointer-events-none"
            >
              <div className="bg-[#050a14]/80 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl px-8 py-5 max-w-lg text-center shadow-[0_0_40px_rgba(212,175,55,0.08)]">
                <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-2">{"\u2726"} {lang === "de" ? "Dein Geburtshimmel" : "Your Birth Sky"} {"\u2726"}</p>
                <p className="text-white/80 text-sm leading-relaxed font-serif italic">
                  {(() => {
                    const d = orreryDate;
                    const locale = lang === "de" ? "de-DE" : "en-GB";
                    const dateStr = d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
                    const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                    const tmpl = t("dashboard.birthSky.messageNoPlace");
                    return tmpl
                      .replace("{date}", dateStr)
                      .replace("{time}", timeStr);
                  })()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ SKY MODE TOGGLE ═══════════════════════════════════════════ */}
      {planetariumMode && (
        <motion.div className="mb-8 -mt-6" {...fadeIn(0.15)}>
          <SkyModeToggle />
        </motion.div>
      )}

      {/* ═══ ASTRO ACCORDION (Western + BaZi/WuXing) ═════════════════════ */}
      <motion.div className="mb-12" {...fadeIn(0.2)}>
        <AstroAccordion apiData={apiData} tileTexts={tileTexts || {}} />
      </motion.div>

      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <div id="section-bazi" />
      <div id="section-wuxing" />
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
        <motion.div className="mb-12" {...fadeIn(0.3)}>
          {/* Block A: Header */}
          <SectionDivider
            label={lang === "de" ? "Chinesische Astrologie" : "Chinese Astrology"}
            title={lang === "de" ? "BaZi & WuXing \u2014 Vier S\u00e4ulen des Schicksals" : "BaZi & WuXing \u2014 Four Pillars of Destiny"}
            icon={<IconOrbit className="w-5 h-5 text-[#8B6914] inline-block mr-2 align-middle" />}
          />

          {/* Block C: Element Balance */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50">
                WuXing {"\u4E94\u884C"}
              </p>
              <Link
                to="/wu-xing"
                className="text-[9px] uppercase tracking-[0.2em] text-[#8B6914]/60 hover:text-[#8B6914] transition-colors flex items-center gap-1.5"
              >
                <span>{lang === 'de' ? 'Detailansicht' : 'Detailed View'}</span>
                <ArrowUp className="w-3 h-3 rotate-45" />
              </Link>
            </div>
            <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
              {t("dashboard.wuxing.sectionDesc")}
            </p>

            <div className="morning-card p-5 md:p-6 max-w-2xl">
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
                            <div className="text-xs font-medium text-[#1E2A3A] truncate">{el.name[lang]}</div>
                            <div className="text-[10px] text-[#1E2A3A]/35">{el.pinyin}</div>
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
                            <span className="text-[10px] text-[#1E2A3A]/45 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{pctLabel}%</span>
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

          {/* Block B: Four Pillars */}
          {apiData.bazi?.pillars && (
            <div className="mb-10">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 mb-4">
                {lang === "de" ? "Die Vier S\u00e4ulen" : "The Four Pillars"}
              </p>
              <BaZiFourPillars
                pillars={apiData.bazi.pillars}
                lang={lang}
                planetariumMode={planetariumMode}
              />
            </div>
          )}

          {/* Block D: Interpretation */}
          <div className="morning-card p-6 md:p-8">
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
