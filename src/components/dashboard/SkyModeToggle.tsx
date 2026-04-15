import { motion } from 'motion/react';
import { usePlanetarium } from '../../contexts/PlanetariumContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function SkyModeToggle() {
  const { skyMode, setSkyMode } = usePlanetarium();
  const { t } = useLanguage();

  const nextMode = skyMode === 'birth' ? 'current' : 'birth';

  return (
    <div className="flex justify-center">
      <motion.button
        onClick={() => setSkyMode(nextMode)}
        className={[
          'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.2em]',
          'border transition-colors duration-300',
          skyMode === 'current'
            ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/5'
            : 'border-white/10 text-white/50 hover:text-white/70 hover:border-white/20',
        ].join(' ')}
        whileTap={{ scale: 0.97 }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          {skyMode === 'birth' ? (
            // Clock icon — switch to current
            <>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12,7 12,12 16,14" />
            </>
          ) : (
            // Star icon — switch to birth
            <>
              <polygon points="12,2 15,9 22,9 17,14 18.5,21 12,17 5.5,21 7,14 2,9 9,9" />
            </>
          )}
        </svg>
        <span>{t(`dashboard.skyMode.${skyMode}`)}</span>
        <span className="text-[8px] text-white/30 ml-1">{'\u2192'} {t(`dashboard.skyMode.${nextMode}`)}</span>
      </motion.button>
    </div>
  );
}
