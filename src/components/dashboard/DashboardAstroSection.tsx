import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";
import { BirthChartOrrery } from "../BirthChartOrrery";
import { PremiumGate } from "../PremiumGate";
import { useLanguage } from "../../contexts/LanguageContext";
import { WUXING_ELEMENTS, getWuxingByKey, getWuxingName } from "../../lib/astro-data/wuxing";
import { getBranchByAnimal } from "../../lib/astro-data/earthlyBranches";
import { getCoinAsset } from "../../lib/astro-data/coinAssets";
import { getZodiacSign, getSignName } from "../../lib/astro-data/zodiacSigns";
import { getConstellationForSign } from "../../lib/astro-data/constellationFromSign";
import { usePlanetarium } from "../../contexts/PlanetariumContext";
import { Tooltip } from "../Tooltip";
import { BaZiFourPillars } from "../BaZiFourPillars";
import { BaZiInterpretation } from "../BaZiInterpretation";
import { getStemByCharacter } from "../../lib/astro-data/heavenlyStems";
import { ExpandableText } from "../ExpandableText";
import { getZodiacArt } from "../../lib/astro-data/zodiacAssets";
import type { ApiData } from "../../types/bafe";
import type { TileTexts, HouseTexts } from "../../types/interpretation";

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

const PILLAR_KEYS: Record<string, { label: string; desc: string }> = {
  year:  { label: "dashboard.pillars.year",  desc: "dashboard.pillars.yearDesc"  },
  month: { label: "dashboard.pillars.month", desc: "dashboard.pillars.monthDesc" },
  day:   { label: "dashboard.pillars.day",   desc: "dashboard.pillars.dayDesc"   },
  hour:  { label: "dashboard.pillars.hour",  desc: "dashboard.pillars.hourDesc"  },
};

// ── Western Astrological Houses ───────────────────────────────────────────

const ROMAN = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"] as const;

interface HouseMeaning {
  name:    { en: string; de: string };
  keyword: { en: string; de: string };
}

const HOUSE_MEANINGS: Record<number, HouseMeaning> = {
  1:  { name: { en: "Self",           de: "Selbst"        }, keyword: { en: "Identity & Appearance",               de: "Identität & Erscheinung"                } },
  2:  { name: { en: "Resources",      de: "Ressourcen"    }, keyword: { en: "Wealth, Possessions & Values",        de: "Besitz, Vermögen & Werte"               } },
  3:  { name: { en: "Mind",           de: "Geist"         }, keyword: { en: "Communication, Siblings & Travel",    de: "Kommunikation, Geschwister & Reisen"    } },
  4:  { name: { en: "Foundation",     de: "Fundament"     }, keyword: { en: "Home, Family & Roots",                de: "Heim, Familie & Wurzeln"                } },
  5:  { name: { en: "Creativity",     de: "Kreativität"   }, keyword: { en: "Pleasure, Romance & Expression",      de: "Freude, Romantik & Ausdruck"            } },
  6:  { name: { en: "Service",        de: "Dienst"        }, keyword: { en: "Health, Work & Daily Routine",        de: "Gesundheit, Arbeit & Alltag"            } },
  7:  { name: { en: "Partnership",    de: "Partnerschaft" }, keyword: { en: "Relationships & Contracts",           de: "Beziehungen & Verträge"                 } },
  8:  { name: { en: "Transformation", de: "Wandel"        }, keyword: { en: "Depth, Shared Power & Rebirth",       de: "Tiefe, gemeinsame Macht & Erneuerung"   } },
  9:  { name: { en: "Expansion",      de: "Horizont"      }, keyword: { en: "Philosophy, Travel & Higher Learning",de: "Philosophie, Weite & höheres Lernen"    } },
  10: { name: { en: "Career",         de: "Beruf"         }, keyword: { en: "Public Role, Status & Ambition",      de: "Öffentliche Rolle & Ambition"           } },
  11: { name: { en: "Community",      de: "Gemeinschaft"  }, keyword: { en: "Friendships, Groups & Ideals",        de: "Freundschaften, Gruppen & Ziele"        } },
  12: { name: { en: "Transcendence",  de: "Transzendenz"  }, keyword: { en: "Solitude, Karma & Hidden Matters",    de: "Einsamkeit, Karma & Verborgenes"        } },
};

function parseHouseNum(key: string): number | null {
  const n = parseInt(key.replace(/[^0-9]/g, ""), 10);
  return n >= 1 && n <= 12 ? n : null;
}

type HouseValue = string | { sign?: string; zodiac_sign?: number; sign_index?: number; index?: number };

function resolveSign(val: HouseValue): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    if (val.sign && typeof val.sign === "string") return val.sign;
    const idx = val.zodiac_sign ?? val.sign_index ?? val.index;
    if (typeof idx === "number") return signFromIndex(idx);
  }
  return "";
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

function SectionDivider({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-[#8B6914]/15 pb-3 sm:pb-4 mb-6 sm:mb-8">
      <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{label}</p>
      <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">{title}</h2>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[8px] uppercase tracking-widest text-[#8B6914]/45 font-sans">
      {text}
    </span>
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
  houseTexts?: HouseTexts;
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
  houseTexts,
}: DashboardAstroSectionProps) {
  const { lang, t } = useLanguage();
  const { planetariumMode, setPlanetariumMode } = usePlanetarium();

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
  const moonSign      = apiData.western?.moon_sign        || "";
  const ascendantSign = apiData.western?.ascendant_sign   || "";
  const zodiacAnimal  = apiData.bazi?.zodiac_sign         || "";
  const dayMaster     = apiData.bazi?.day_master          || "\u2014";
  const monthStem     = apiData.bazi?.pillars?.month?.stem || "\u2014";

  const dayMasterStem = useMemo(() => getStemByCharacter(dayMaster), [dayMaster]);
  const monthStemData = useMemo(() => getStemByCharacter(monthStem), [monthStem]);
  const dominantEl    = apiData.wuxing?.dominant_element  || "";
  const yearElement   = apiData.bazi?.pillars?.year?.element || "";

  // Localised sign names
  const sunSignName  = getSignName(sunSign, lang);
  const moonSignName = getSignName(moonSign, lang);
  const ascSignName  = getSignName(ascendantSign, lang);

  const sunEmoji  = WESTERN_EMOJIS[sunSign]       || "\u2728";
  const moonEmoji = WESTERN_EMOJIS[moonSign]      || "\u2728";
  const ascEmoji  = WESTERN_EMOJIS[ascendantSign] || "\u2728";

  // Sign-specific descriptions
  const sunSignData  = useMemo(() => getZodiacSign(sunSign), [sunSign]);
  const moonSignData = useMemo(() => getZodiacSign(moonSign), [moonSign]);
  const ascSignData  = useMemo(() => getZodiacSign(ascendantSign), [ascendantSign]);

  const yearBranch     = useMemo(() => getBranchByAnimal(zodiacAnimal), [zodiacAnimal]);
  const yearAnimalName = yearBranch ? yearBranch.animal[lang] : zodiacAnimal;
  const dominantWuxing = useMemo(() => getWuxingByKey(dominantEl), [dominantEl]);
  const yearCoinSrc    = useMemo(() => getCoinAsset(zodiacAnimal), [zodiacAnimal]);

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

  // Houses
  const houses: Record<string, HouseValue> = useMemo(
    () => (apiData.western?.houses as Record<string, HouseValue>) || {},
    [apiData.western],
  );
  const houseEntries = useMemo(
    () =>
      Object.entries(houses)
        .filter(([, v]) => v != null)
        .sort(([a], [b]) => (parseHouseNum(a) ?? 99) - (parseHouseNum(b) ?? 99)),
    [houses],
  );

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
      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <motion.div className="mb-14 -mx-4 md:-mx-6" {...fadeIn(0.1)}>
        <BirthChartOrrery
          birthDate={orreryDate}
          planetariumMode={planetariumMode}
          birthConstellation={birthConstellationKey}
          autoPlay={showBirthSkyWelcome}
        />

        {/* Birth Sky Welcome Banner */}
        <AnimatePresence>
          {showBirthSkyWelcome && (
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

      {/* ═══ PRIMARY GRID: Western (left) | BaZi/WuXing (right) ═══════ */}
      <motion.div className="mb-12" {...fadeIn(0.2)}>
        <SectionDivider
          label={t("dashboard.western.sectionLabel")}
          title={t("dashboard.western.sectionTitle")}
        />

        {/* ── Western Signs ─────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">

            {/* Sun Sign */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
                  <Badge text={t("dashboard.western.sunLabel")} />
                </div>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {sunSignName || "\u2014"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.sunTitle")}
                    </p>
                  </div>
                  {(() => { const art = getZodiacArt(sunSign); return art ? (
                    <img src={art} alt={sunSignName} className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2" loading="lazy" />
                  ) : null; })()}
                </div>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {sunSignData
                    ? sunSignData.sun[lang]
                    : t("dashboard.western.sunDesc")}
                </p>
                <ExpandableText text={tileTexts?.sun} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
                {sunSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {sunSignData.element[lang]} · {sunSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.sunSignBadge")} />
              </div>
            </div>

            {/* Moon Sign */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
                  <Badge text={t("dashboard.western.moonLabel")} />
                </div>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {moonSignName || "\u2014"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.moonTitle")}
                    </p>
                  </div>
                  {(() => { const art = getZodiacArt(moonSign); return art ? (
                    <img src={art} alt={moonSignName} className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2" loading="lazy" />
                  ) : null; })()}
                </div>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {moonSignData
                    ? moonSignData.moon[lang]
                    : t("dashboard.western.moonDesc")}
                </p>
                <ExpandableText text={tileTexts?.moon} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
                {moonSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {moonSignData.element[lang]} · {moonSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.moonSignBadge")} />
              </div>
            </div>

            {/* Ascendant */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#3D8B37]">{ascEmoji}</span>
                  <Badge text={t("dashboard.western.ascLabel")} />
                </div>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {ascSignName || "\u2014"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.ascTitle")}
                    </p>
                  </div>
                  {(() => { const art = getZodiacArt(ascendantSign); return art ? (
                    <img src={art} alt={ascSignName} className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2" loading="lazy" />
                  ) : null; })()}
                </div>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {ascSignData
                    ? ascSignData.asc[lang]
                    : t("dashboard.western.ascDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#3D8B37]">{ascEmoji}</span>
                {ascSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {ascSignData.element[lang]} · {ascSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.ascBadge")} />
              </div>
            </div>
          </div>

        <SectionDivider
          label={t("dashboard.bazi.sectionLabel")}
          title={t("dashboard.bazi.sectionTitle")}
        />

          {/* ── BaZi / WuXing ───────────────────────────── */}
          <div className="grid md:grid-cols-4 gap-5 mb-10">

            {/* Year Animal */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none" style={{ color: yearBranch ? '#8B6914' : undefined }}>{yearBranch?.chinese || "\u2728"}</span>
                  <Badge text={t("dashboard.bazi.zodiacLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {yearAnimalName || "\u2014"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {yearElement && yearBranch
                    ? `${getWuxingName(yearElement, lang)}-${yearAnimalName} (${yearBranch.chinese})`
                    : t("dashboard.bazi.yearAnimalTitle")}
                </p>
                {yearCoinSrc && (
                  <div className="flex justify-center my-4">
                    <img
                      src={yearCoinSrc}
                      alt={yearAnimalName}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full"
                      loading="lazy"
                    />
                  </div>
                )}
                {yearBranch && (
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {yearBranch.description[lang]}
                  </p>
                )}
                <ExpandableText text={tileTexts?.yearAnimal} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  {yearBranch && (
                    <span className="font-serif text-xl text-[#8B6914]">{yearBranch.chinese}</span>
                  )}
                  {yearBranch && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {getWuxingName(yearBranch.element, lang)} · {yearBranch.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={t("dashboard.bazi.yearAnimalBadge")} />
              </div>
            </div>

            {/* Dominant WuXing Element */}
            <div
              className="morning-card p-5 sm:p-7 flex flex-col justify-between"
              style={dominantWuxing ? {
                borderLeftColor: dominantWuxing.color + "55",
                borderLeftWidth: "3px",
                borderLeftStyle: "solid",
              } : undefined}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none" style={{ color: dominantWuxing?.color }}>{dominantWuxing?.chinese || "\u2728"}</span>
                  <Badge text={t("dashboard.bazi.essenceLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {dominantWuxing ? dominantWuxing.name[lang] : (dominantEl || "\u2014")}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.bazi.dominantElementTitle")}
                </p>
                {dominantWuxing && (
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {dominantWuxing.description[lang]}
                  </p>
                )}
                <ExpandableText text={tileTexts?.dominantWuXing} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  {dominantWuxing && (
                    <span className="font-serif text-xl leading-none select-none" style={{ color: dominantWuxing.color }}>
                      {dominantWuxing.chinese}
                    </span>
                  )}
                  {dominantWuxing && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {dominantWuxing.pinyin} · {dominantWuxing.direction[lang]} · {dominantWuxing.season[lang]}
                    </span>
                  )}
                </div>
                <Badge text="WUXING" />
              </div>
            </div>

            {/* Day Master */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none text-[#D4AF37]">{dayMaster}</span>
                  <Badge text={t("dashboard.bazi.vitalityLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {dayMaster}{dayMasterStem ? ` ${dayMasterStem.pinyin}` : ""}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {dayMasterStem
                    ? `${t("dashboard.bazi.dayMasterTitle")} \u2014 ${dayMasterStem.name[lang]}`
                    : t("dashboard.bazi.dayMasterTitle")}
                </p>
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {dayMasterStem
                    ? dayMasterStem.dayMaster[lang]
                    : t("dashboard.bazi.dayMasterDesc")}
                </p>
                <ExpandableText text={tileTexts?.dayMaster} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl text-[#8B6914]">{dayMaster}</span>
                  {dayMasterStem && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {dayMasterStem.element} · {dayMasterStem.yinYang === "yang" ? "Yang" : "Yin"} · {dayMasterStem.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={lang === "de" ? "TAGESMEISTER" : "DAY MASTER"} />
              </div>
            </div>

            {/* Month Stem */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg leading-none select-none text-[#8B6914]">{"\u6708"}</span>
                  <Badge text={t("dashboard.bazi.monthStemBadge")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {monthStem}{monthStemData ? ` ${monthStemData.pinyin}` : ""}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {monthStemData
                    ? `${t("dashboard.bazi.monthStemTitle")} \u2014 ${monthStemData.name[lang]}`
                    : t("dashboard.bazi.monthStemTitle")}
                </p>
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {monthStemData
                    ? monthStemData.monthStem[lang]
                    : t("dashboard.bazi.monthStemDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl text-[#8B6914]">{monthStem}</span>
                  {monthStemData && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {monthStemData.element} · {monthStemData.yinYang === "yang" ? "Yang" : "Yin"} · {monthStemData.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={lang === "de" ? "MONATSSTAMM" : "MONTH STEM"} />
              </div>
            </div>
          </div>
      </motion.div>

      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
        <motion.div className="mb-12" {...fadeIn(0.3)}>
          {/* Block A: Header */}
          <SectionDivider
            label={lang === "de" ? "Chinesische Astrologie" : "Chinese Astrology"}
            title={lang === "de" ? "BaZi & WuXing \u2014 Vier S\u00e4ulen des Schicksals" : "BaZi & WuXing \u2014 Four Pillars of Destiny"}
          />

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

            <div className="morning-card p-6 md:p-8">
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
                          <span className="text-2xl font-serif leading-none select-none" style={{ color: el.color }}>
                            {el.chinese}
                          </span>
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

      {/* ═══ WESTERN HOUSES — PREMIUM ════════════════════════════════ */}
      {houseEntries.length > 0 && (
        <PremiumGate teaser={t("dashboard.premium.teaserHouses")}>
        <motion.div className="mb-10" {...fadeIn(0.4)}>
          <SectionDivider
            label={t("dashboard.western.sectionLabel")}
            title={t("dashboard.houses.sectionTitle")}
          />
          <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
            {t("dashboard.houses.sectionDesc")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {houseEntries.map(([houseKey, val]) => {
              const sign    = resolveSign(val);
              const emoji   = WESTERN_EMOJIS[sign] || "";
              const num     = parseHouseNum(houseKey);
              const roman   = num !== null ? ROMAN[num] : houseKey;
              const meaning = num !== null ? HOUSE_MEANINGS[num] : null;
              const signDisplay = sign ? getSignName(sign, lang) : "\u2014";

              const houseText = num !== null ? houseTexts?.[String(num)] : undefined;
              const cardContent = (
                <>
                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0">
                    <span className="font-serif text-base text-[#8B6914] font-medium leading-none shrink-0">
                      {roman}
                    </span>
                    {meaning && (
                      <span className="text-[9px] sm:text-[10px] text-[#1E2A3A]/45 tracking-wide truncate">
                        {meaning.name[lang]}
                      </span>
                    )}
                  </div>

                  <div className="font-serif text-base sm:text-lg text-[#1E2A3A] flex items-center gap-1.5 sm:gap-2 mb-2 min-w-0">
                    <span className="text-[#8B6914]/80 shrink-0">{emoji}</span>
                    <span className="truncate">{signDisplay}</span>
                  </div>

                  {meaning && sign && (
                    <p className="text-[9px] sm:text-[10px] text-[#1E2A3A]/40 leading-relaxed line-clamp-2">
                      {lang === "de"
                        ? `${signDisplay} pr\u00e4gt das Lebensfeld ${meaning.name.de}.`
                        : `${signDisplay} shapes your house of ${meaning.name.en}.`}
                    </p>
                  )}
                </>
              );

              return houseText ? (
                <Tooltip key={houseKey} content={houseText} wide>
                  <div className="morning-card p-4 sm:p-5 overflow-hidden cursor-help">
                    {cardContent}
                  </div>
                </Tooltip>
              ) : (
                <div key={houseKey} className="morning-card p-4 sm:p-5 overflow-hidden">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </motion.div>
        </PremiumGate>
      )}
    </>
  );
}
