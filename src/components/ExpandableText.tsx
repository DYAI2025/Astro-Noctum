import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface ExpandableTextProps {
  text: string | undefined;
}

export function ExpandableText({ text }: ExpandableTextProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  if (!text) return null;

  return (
    <div className="mt-3 border-t border-[#8B6914]/10 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-[#8B6914] uppercase tracking-[0.15em] hover:text-[#8B6914]/80 transition-colors"
      >
        {open
          ? (lang === "de" ? "Weniger" : "Less")
          : (lang === "de" ? "Mehr erfahren" : "Read more")}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <p className="text-xs text-[#1E2A3A]/55 leading-relaxed mt-2">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
