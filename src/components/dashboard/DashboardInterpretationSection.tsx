import { useMemo, lazy, Suspense } from 'react';
const ReactMarkdown = lazy(() => import('react-markdown'));
import { PremiumGate } from '../PremiumGate';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardInterpretationSectionProps {
  interpretation: string;
  isPremium: boolean;
}

export function DashboardInterpretationSection({
  interpretation,
  isPremium,
}: DashboardInterpretationSectionProps) {
  const { lang, t } = useLanguage();

  const isLoading = !interpretation
    || interpretation.includes("wird geladen")
    || interpretation.includes("Loading your cosmic");

  const interpretationParagraphs = useMemo(
    () => interpretation?.split('\n\n') || [],
    [interpretation],
  );
  const freeInterpretation = useMemo(
    () => interpretationParagraphs.slice(0, 2).join('\n\n'),
    [interpretationParagraphs],
  );
  const hasPremiumInterpretation = interpretationParagraphs.length > 2;

  const proseClasses = `
    text-[13px] text-[#1E2A3A]/70 leading-relaxed
    prose prose-sm max-w-none
    prose-headings:text-[#1E2A3A] prose-headings:font-serif
    prose-p:text-[#1E2A3A]/70 prose-strong:text-[#1E2A3A]/85
    prose-a:text-[#8B6914] prose-a:no-underline hover:prose-a:underline
    prose-hr:border-[#8B6914]/15
  `;

  return (
    <div className="cosmic-tile p-5 sm:p-8 md:col-span-2 max-w-4xl mx-auto">
      <h3 className="font-serif text-2xl text-[#1E2A3A] mb-5">
        {t('dashboard.interpretation.sectionTitle')}
      </h3>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-[#8B6914]/8 rounded w-3/4" />
          <div className="h-3 bg-[#8B6914]/8 rounded w-full" />
          <div className="h-3 bg-[#8B6914]/8 rounded w-5/6" />
          <div className="h-3 bg-[#8B6914]/8 rounded w-2/3" />
          <p className="text-[11px] text-[var(--color-text-bright-dim)] italic mt-4">
            {t('dashboard.interpretation.generating')}
          </p>
        </div>
      ) : (
        <>
          <div className={proseClasses}>
            <Suspense fallback={<div className="animate-pulse space-y-3"><div className="h-4 bg-white/5 rounded w-3/4" /><div className="h-4 bg-white/5 rounded w-1/2" /><div className="h-4 bg-white/5 rounded w-2/3" /></div>}>
              <ReactMarkdown>{isPremium ? interpretation : freeInterpretation}</ReactMarkdown>
            </Suspense>
          </div>

          {!isPremium && hasPremiumInterpretation && (
            <PremiumGate teaser={t('dashboard.premium.teaserInterpretation')}>
              <div className={`${proseClasses} mt-4`}>
                <Suspense fallback={<div className="animate-pulse space-y-3"><div className="h-4 bg-white/5 rounded w-3/4" /><div className="h-4 bg-white/5 rounded w-1/2" /><div className="h-4 bg-white/5 rounded w-2/3" /></div>}>
                  <ReactMarkdown>{interpretationParagraphs.slice(2).join('\n\n')}</ReactMarkdown>
                </Suspense>
              </div>
            </PremiumGate>
          )}
        </>
      )}
    </div>
  );
}
