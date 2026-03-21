import { useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { BirthForm } from '@/src/components/BirthForm';
import { SignatureReveal } from '@/src/components/onboarding/SignatureReveal';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import type { ApiData } from '@/src/types/bafe';

const CosmicEncounter = lazy(() =>
  import('@/src/components/onboarding/CosmicEncounter').then((m) => ({
    default: m.CosmicEncounter,
  }))
);

type Props = {
  hasCompleteProfile: boolean;
  onboardingPhase: 'form' | 'encounter' | 'signature' | 'done';
  bootstrapData: BootstrapResponse | null;
  apiData: ApiData | null;
  isLoading: boolean;
  error: string | null;
  onSubmitBirth: (formData: { date: string; tz: string; lon: number; lat: number }) => void | Promise<void>;
  onSignatureComplete: (delta: SignatureDeltaResponse | null) => void;
  onEncounterComplete?: (delta: SignatureDeltaResponse | null) => void;
  ambientePause?: () => void;
  ambienteResume?: () => void;
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
  onEncounterComplete,
  ambientePause,
  ambienteResume,
}: Props) {
  const navigate = useNavigate();

  // Track whether the user has submitted the birth form in this session.
  // This distinguishes "new user mid-onboarding" from "returning user who
  // landed on /onboarding by accident". Once set, it stays true for the
  // lifetime of the page — no race condition with BAFE completion.
  const hasSubmittedRef = useRef(false);
  if (onboardingPhase !== 'form') {
    // Phase advanced past 'form' → user must have submitted
    hasSubmittedRef.current = true;
  }

  useEffect(() => {
    // Case 1: Onboarding flow completed → go to dashboard
    if (onboardingPhase === 'done') {
      navigate('/', { replace: true });
      return;
    }

    // Case 2: Returning user with existing profile who never submitted
    // the birth form (e.g. typed /onboarding manually) → redirect home
    if (hasCompleteProfile && !hasSubmittedRef.current) {
      navigate('/', { replace: true });
      return;
    }

    // Case 3: User IS mid-onboarding (submitted birth form, bootstrap
    // running or showing SignatureReveal). BAFE may have already set
    // hasCompleteProfile=true — INTENTIONALLY IGNORED here. The user
    // must complete the signature phase before being redirected.
  }, [onboardingPhase, hasCompleteProfile, navigate]);

  if (onboardingPhase === 'encounter') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#010409]" />}>
        <CosmicEncounter
          onSubmitBirth={onSubmitBirth}
          bootstrapData={bootstrapData}
          isLoading={isLoading}
          onComplete={onEncounterComplete ?? onSignatureComplete}
          ambientePause={ambientePause}
          ambienteResume={ambienteResume}
        />
      </Suspense>
    );
  }

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
          onComplete={onSignatureComplete}
        />
      )}
    </motion.div>
  );
}
