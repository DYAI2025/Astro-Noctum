import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip — accessible, hover + click (mobile), ARIA-compliant
// Supports both morning (light) and planetarium (dark) theme contexts.
// ─────────────────────────────────────────────────────────────────────────────

let _tooltipId = 0;

interface TooltipProps {
  /** Tooltip body text */
  content: string;
  /** Trigger element */
  children: ReactNode;
  /** Wider variant (260 px) for longer descriptions */
  wide?: boolean;
  /** Dark variant — used in Planetarium Mode */
  dark?: boolean;
}

export function Tooltip({ content, children, wide = false, dark = false }: TooltipProps) {
  const [show, setShow] = useState(false);
  const id = useMemo(() => `tt-${++_tooltipId}`, []);

  if (!content) return <>{children}</>;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      onClick={() => setShow((v) => !v)}
    >
      <div aria-describedby={show ? id : undefined}>{children}</div>

      <AnimatePresence>
        {show && (
          <motion.div
            id={id}
            role="tooltip"
            aria-live="polite"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={[
              "absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
              wide ? "w-64" : "w-52",
              "rounded-xl px-3.5 py-3 shadow-[0_8px_24px_-4px_rgba(0,30,80,0.14)]",
              "z-50 pointer-events-none",
              dark
                ? "bg-[#060f28]/96 border border-[#3B5BA0]/40 text-slate-200"
                : "bg-white/97 border border-[#8B6914]/20 text-[#1E2A3A]/68",
            ].join(" ")}
          >
            <p className="text-[11px] leading-relaxed">{content}</p>
            {/* Arrow */}
            <div
              className={[
                "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0",
                "border-x-[5px] border-x-transparent border-t-[5px]",
                dark ? "border-t-[#060f28]/96" : "border-t-white/97",
              ].join(" ")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
