import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { FAQ_SECTIONS } from '@/src/data/faq';
import { LegalFooter } from '@/src/components/LegalFooter';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function FaqPage() {
  const { lang, t } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-16"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-gold-deep/55 text-[9px] uppercase tracking-[0.5em] mb-3">
          {t('faq.cosmicKnowledge')}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">
          {t('faq.title')}
        </h1>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {FAQ_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            <h2 className="font-serif text-lg text-ink/90 mb-4 border-b border-gold/10 pb-2">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item, qIdx) => {
                const key = `${sIdx}-${qIdx}`;
                const isOpen = openItems.has(key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-gold/10 bg-obsidian/40 overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gold/5 transition-colors"
                    >
                      <span className="text-sm text-ink/80 pr-4">{item.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0"
                      >
                        <ChevronRight className="w-4 h-4 text-gold/40" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-xs text-ink/40 mb-4">
          {t('faq.ctaText')}
        </p>
        <a
          href="/"
          className="inline-block px-8 py-3 border border-gold/25 text-gold text-[10px] uppercase tracking-[0.3em] rounded-lg hover:bg-gold/10 transition-colors"
        >
          {t('faq.ctaButton')}
        </a>
      </div>

      <div className="mt-12">
        <LegalFooter lang={lang} />
      </div>
    </motion.div>
  );
}
