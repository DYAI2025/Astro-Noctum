import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { CymaticsFallback } from '@/src/components/signatur-cymatics/CymaticsFallback';
import { natalWeightsToChladniPreview } from '@/src/lib/cymatics/bazi-to-chladni';

// Phase C1 — Cymatics is the only renderer. V1/V2/V3 branches were removed on
// 2026-04-18 together with the legacy reveal component. When sectors are
// missing (e.g. bootstrap synthetic fallback) we render the static
// CymaticsFallback directly.
const SignaturCymaticsCanvas = lazy(() =>
  import('@/src/components/signatur-cymatics/SignaturCymaticsCanvas').then((m) => ({
    default: m.SignaturCymaticsCanvas,
  })),
);

interface Props {
  bootstrapData: BootstrapResponse;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
  bootstrapFailed?: boolean;
}

export function SignatureReveal({ bootstrapData, onComplete, bootstrapFailed }: Props) {
  const { t } = useLanguage();
  const [showButton, setShowButton] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  const sectors =
    bootstrapData.soulprint_sectors && bootstrapData.soulprint_sectors.length === 12
      ? bootstrapData.soulprint_sectors
      : undefined;

  const isFallback = bootstrapData.meta?.engine_version === 'fallback';
  const canRenderCanvas = sectors !== undefined;

  // Chladni params interpolated between neutral preset (revealProgress=0)
  // and the weight-derived target (revealProgress=1).
  const previewParams = useMemo(
    () => natalWeightsToChladniPreview(sectors, revealProgress),
    [sectors, revealProgress],
  );

  // Morph animation: neutral → personal over ~2s, continue button at 3s.
  useEffect(() => {
    const morphTimer = setTimeout(() => setRevealProgress(1), 500);
    const buttonTimer = setTimeout(() => setShowButton(true), 3000);
    return () => {
      clearTimeout(morphTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#010409] flex flex-col items-center justify-center z-50">
      {/* Ring container — round clipped */}
      <div className="w-[200px] h-[200px] rounded-full overflow-hidden relative">
        {canRenderCanvas ? (
          <Suspense
            fallback={
              <CymaticsFallback
                dominantElement={previewParams.dominantElement}
                planetariumMode
                className="w-full h-full"
              />
            }
          >
            <SignaturCymaticsCanvas
              params={previewParams}
              planetariumMode
              className="w-full h-full"
            />
          </Suspense>
        ) : (
          <CymaticsFallback
            dominantElement={previewParams.dominantElement}
            planetariumMode
            className="w-full h-full"
          />
        )}
      </div>

      {/* Fallback hint — non-blocking, shown only when bootstrap used synthetic data */}
      {bootstrapFailed && (
        <p className="text-xs text-gold/60 text-center mt-2">
          {t('signatureReveal.soulprintCalculating')}
        </p>
      )}

      {/* Title */}
      <motion.p
        className="mt-8 font-serif text-xl text-[#D4AF37]/80 tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
      >
        {isFallback
          ? t('signatureReveal.signaturePartialError')
          : t('signatureReveal.signatureForming')}
      </motion.p>

      {/* Fallback subtitle — shown when bootstrap used synthetic data */}
      {isFallback && (
        <motion.p
          className="mt-2 text-xs text-white/40 max-w-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          {t('signatureReveal.previewNote')}
        </motion.p>
      )}

      {/* Continue button — appears after animation */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 px-8 py-3 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-[0.3em] rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
            onClick={() => onComplete(null)}
          >
            {isFallback
              ? t('signatureReveal.continueAnyway')
              : t('common.continue')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
