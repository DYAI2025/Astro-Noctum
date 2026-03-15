import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
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
  const { t } = useLanguage();

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
    text-[13px] text-[#1E2A3A]/60 leading-relaxed
    prose prose-sm max-w-none
    prose-headings:text-[#1E2A3A] prose-headings:font-serif
    prose-p:text-[#1E2A3A]/60 prose-strong:text-[#1E2A3A]/80
    prose-a:text-[#8B6914] prose-a:no-underline hover:prose-a:underline
    prose-hr:border-[#8B6914]/15
  `;

  return (
    <div className="morning-card p-5 sm:p-8">
      <div className="flex items-center gap-4 mb-5">
        <span className="h-[1px] w-10 bg-[#8B6914]/20" />
        <span className="text-[9px] uppercase tracking-[0.4em] text-[#8B6914]/55">
          {t('dashboard.interpretation.sectionLabel')}
        </span>
      </div>
      <h3 className="font-serif text-2xl text-[#1E2A3A] mb-5">
        {t('dashboard.interpretation.sectionTitle')}
      </h3>

      <div className={proseClasses}>
        <ReactMarkdown>{isPremium ? interpretation : freeInterpretation}</ReactMarkdown>
      </div>

      {!isPremium && hasPremiumInterpretation && (
        <PremiumGate teaser={t('dashboard.premium.teaserInterpretation')}>
          <div className={`${proseClasses} mt-4`}>
            <ReactMarkdown>{interpretationParagraphs.slice(2).join('\n\n')}</ReactMarkdown>
          </div>
        </PremiumGate>
      )}
    </div>
  );
}
