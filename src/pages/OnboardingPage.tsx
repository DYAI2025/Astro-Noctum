import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { BirthForm } from '@/src/components/BirthForm';
import { SignatureReveal } from '@/src/components/onboarding/SignatureReveal';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import type { ApiData } from '@/src/types/bafe';

type Props = {
  hasCompleteProfile: boolean;
  onboardingPhase: 'form' | 'signature' | 'done';
  bootstrapData: BootstrapResponse | null;
  apiData: ApiData | null;
  isLoading: boolean;
  error: string | null;
  onSubmitBirth: (formData: { date: string; tz: string; lon: number; lat: number }) => void | Promise<void>;
  onSignatureComplete: (delta: SignatureDeltaResponse | null) => void;
};

export type OnboardingPageProps = Props;

export default function OnboardingPage({
  hasCompleteProfile,
  onboardingPhase,
  bootstrapData,
  apiData,
  isLoading,
  error,
  onSubmitBirth,
  onSignatureComplete,
}: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompleteProfile) navigate('/', { replace: true });
  }, [hasCompleteProfile, navigate]);

  useEffect(() => {
    if (onboardingPhase === 'done') navigate('/', { replace: true });
  }, [onboardingPhase, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8"
    >
      {error && (
        <div className="w-full max-w-md bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {onboardingPhase === 'form' && (
        <BirthForm onSubmit={onSubmitBirth} isLoading={isLoading} />
      )}

      {onboardingPhase === 'signature' && bootstrapData && (
        <SignatureReveal
          bootstrapData={bootstrapData}
          fallbackApiData={apiData}
          onComplete={onSignatureComplete}
        />
      )}
    </motion.div>
  );
}

