import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import { isFeatureEnabled } from '@/src/lib/feature-flags';
import { toDimensionWeightsOrUndefined, toNatalWeightsOrUndefined, deriveCymanticsParams } from '@/src/lib/signatur/weight-utils';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { CymanticsSignature } from '../cymantics/CymanticsSignature';

const FusionRingCanvasV2 = lazy(() => import('@/src/components/fusion-ring-website/FusionRingCanvasV2'));
const FusionRingWebsiteCanvas = lazy(() => import('@/src/components/fusion-ring-website/FusionRingWebsiteCanvas').then(m => ({ default: m.FusionRingWebsiteCanvas })));

const DEFAULT_SECTORS = Array(12).fill(0.5);

// Device capability check for V2
function canRunV2(): boolean {
  if (typeof navigator === 'undefined') return true;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  return cores > 2 && memory >= 4;
}

interface Props {
  bootstrapData: BootstrapResponse;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
  bootstrapFailed?: boolean;
}

export function SignatureReveal({ bootstrapData, onComplete, bootstrapFailed }: Props) {
  const { t } = useLanguage();
  const [showButton, setShowButton] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  const useV3 = isFeatureEnabled('signature_engine_v3');
  const useV2 = !useV3 && isFeatureEnabled('signature_engine_v2') && canRunV2();
  const sectors = bootstrapData.soulprint_sectors?.length === 12
    ? bootstrapData.soulprint_sectors
    : DEFAULT_SECTORS;

  const isFallback = bootstrapData.meta?.engine_version === 'fallback';

  const chladniParams = useMemo(() => deriveCymanticsParams(bootstrapData), [bootstrapData]);
  const natalWeights = useMemo(() => toNatalWeightsOrUndefined(sectors), [sectors]);
  const dimensionWeights = useMemo(() => toDimensionWeightsOrUndefined(sectors), [sectors]);
  const neutralDimensionWeights = useMemo(() => toDimensionWeightsOrUndefined(DEFAULT_SECTORS) ?? {}, []);

  // Morph animation: neutral -> personal over 2s, then show button at 3s
  useEffect(() => {
    const morphTimer = setTimeout(() => setRevealProgress(1), 500);
    const buttonTimer = setTimeout(() => setShowButton(true), 3000);
    return () => { clearTimeout(morphTimer); clearTimeout(buttonTimer); };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#010409] flex flex-col items-center justify-center z-50">
      {/* Ring container — round clipped */}
      <div className="w-[200px] h-[200px] rounded-full overflow-hidden relative">
        <Suspense fallback={<div className="w-full h-full bg-[#010409]" />}>
          {useV3 ? (
            <CymanticsSignature
              natalWeights={(revealProgress > 0 ? dimensionWeights : neutralDimensionWeights) || neutralDimensionWeights}
              quizWeights={{}}
              chladniParams={chladniParams}
              mode="hybrid"
              width={200}
              height={200}
            />
          ) : useV2 ? (
            <FusionRingCanvasV2
              natalWeights={revealProgress > 0 ? natalWeights : undefined}
              isMini
              revealProgress={revealProgress}
              className="w-full h-full"
            />
          ) : (
            <FusionRingWebsiteCanvas
              soulProfile={revealProgress > 0 ? sectors : DEFAULT_SECTORS}
            />
          )}
        </Suspense>
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
