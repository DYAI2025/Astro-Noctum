import { useLanguage } from "../../contexts/LanguageContext";

interface BlueprintCardProps {
  title?: string;
  content: string;
  aspects?: string[];
  elements?: string[];
  ctaText?: string;
  onCtaClick?: () => void;
}

export default function BlueprintCard({
  title,
  content,
  aspects = [],
  elements = [],
  ctaText,
  onCtaClick,
}: BlueprintCardProps) {
  const { t } = useLanguage();

  const resolvedTitle = title ?? t("dashboard.blueprint.title");
  const resolvedCtaText = ctaText ?? t("dashboard.blueprint.cta");

  // Null-safe: show skeleton when content is missing or empty
  if (!content || content.trim().length === 0) {
    return (
      <div className="animate-pulse bg-zinc-900/40 rounded-2xl h-[220px] border border-zinc-800" />
    );
  }

  return (
    <div className="relative group overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-cyan-500/15 to-purple-500/20 rounded-[2rem] blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative bg-[#0A0A14]/80 backdrop-blur-xl border border-[#D4AF37]/15 p-8 md:p-10 rounded-[2rem] space-y-6 transition-all duration-500 hover:border-[#D4AF37]/35 min-h-[220px]">
        <div className="flex justify-between items-start">
          <h2 className="font-serif text-[14px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgb(226, 155, 50)' }}>{resolvedTitle}</h2>
          <div className="flex gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
          </div>
        </div>

        <p className="font-sora text-2xl md:text-3xl font-light leading-relaxed tracking-tight text-white/90">
          {content}
        </p>

        <div className="flex flex-wrap gap-6 pt-2">
          {aspects.length > 0 && (
            <div className="space-y-1">
              <span className="font-sora text-[10px] text-zinc-600 uppercase tracking-widest block">{t("dashboard.blueprint.western")}</span>
              <div className="flex gap-3 text-xs text-zinc-400 font-medium font-sora">
                {aspects.map((aspect, i) => (
                  <span key={i}>{aspect}</span>
                ))}
              </div>
            </div>
          )}

          {elements.length > 0 && (
            <div className="space-y-1">
              <span className="font-sora text-[10px] text-zinc-600 uppercase tracking-widest block">{t("dashboard.blueprint.eastern")}</span>
              <div className="flex gap-3 text-xs text-zinc-400 font-medium font-sora">
                {elements.map((element, i) => (
                  <span key={i} className="text-cyan-400/80">{element}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {onCtaClick && (
          <button
            onClick={onCtaClick}
            className="pt-4 font-serif text-sm font-semibold hover:text-white transition-colors duration-300 flex items-center gap-2 group/btn"
            style={{ color: 'rgb(222, 152, 49)' }}
          >
            <span className="tracking-[0.15em] uppercase">{resolvedCtaText}</span>
            <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
