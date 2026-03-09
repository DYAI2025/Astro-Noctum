import { useMemo } from "react";
import { motion } from "motion/react";
import { getBaZiInterpretation } from "../lib/astro-data/bazi-interpretations";
import { detectTensions } from "../lib/astro-data/wuxing-cycles";
import { getWuxingByKey } from "../lib/astro-data/wuxing";

interface BaZiInterpretationProps {
  animal: string;
  element: string;
  balance: Record<string, number>;
  lang: "en" | "de";
}

export function BaZiInterpretation({ animal, element, balance, lang }: BaZiInterpretationProps) {
  const interpretation = useMemo(
    () => getBaZiInterpretation(animal, element),
    [animal, element],
  );
  const tensions = useMemo(
    () => detectTensions(balance),
    [balance],
  );

  if (!interpretation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] mb-2">
          {interpretation.title[lang]}
        </h3>
        <p className="text-xs text-[#8B6914]/50 italic">
          {interpretation.short[lang]}
        </p>
      </div>

      {/* Long interpretation — serif font per dev brief ("like a letter, not a widget") */}
      <p className="text-[13px] text-[#1E2A3A]/60 leading-[1.85] font-serif">
        {interpretation.long[lang]}
      </p>

      {/* Strengths & Shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#3D8B37]/70 mb-2">
            {lang === "de" ? "Stärken" : "Strengths"}
          </h4>
          <ul className="space-y-1.5">
            {interpretation.strengths.map((s, i) => (
              <li key={i} className="text-xs text-[#1E2A3A]/50 flex items-start gap-1.5">
                <span className="text-[#3D8B37]/50 mt-0.5 shrink-0">+</span>
                {s[lang]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#D63B0F]/50 mb-2">
            {lang === "de" ? "Schatten" : "Shadows"}
          </h4>
          <ul className="space-y-1.5">
            {interpretation.shadows.map((s, i) => (
              <li key={i} className="text-xs text-[#1E2A3A]/50 flex items-start gap-1.5">
                <span className="text-[#D63B0F]/40 mt-0.5 shrink-0">&ndash;</span>
                {s[lang]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tensions */}
      {tensions.length > 0 && (
        <div className="border-t border-[#8B6914]/10 pt-4">
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#C8930A]/60 mb-3">
            {lang === "de" ? "Spannungen in deiner Balance" : "Tensions in Your Balance"}
          </h4>
          <div className="space-y-2">
            {tensions.map((tension, i) => {
              const domEl = getWuxingByKey(tension.dominant);
              const ctrlEl = getWuxingByKey(tension.controller);
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-[#1E2A3A]/45">
                  <span className="shrink-0 mt-0.5">
                    <span style={{ color: domEl?.color }}>&#9679;</span>
                    {" "}
                    <span className="text-[#1E2A3A]/20">&harr;</span>
                    {" "}
                    <span style={{ color: ctrlEl?.color }}>&#9675;</span>
                  </span>
                  <span>{tension.description[lang]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
