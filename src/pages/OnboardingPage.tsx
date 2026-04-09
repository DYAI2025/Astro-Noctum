import { useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { BirthForm, type OnboardingBirthData } from '@/src/components/BirthForm';
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
  bootstrapFailed?: boolean;
  apiData: ApiData | null;
  isLoading: boolean;
  error: string | null;
  persistError?: string | null;
  onSubmitBirth: (formData: OnboardingBirthData) => void | Promise<void>;
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
  bootstrapFailed,
  apiData,
  isLoading,
  error,
  persistError,
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
    // Case 1: Onboarding done AND profile ready → go to dashboard
    if (onboardingPhase === 'done' && hasCompleteProfile) {
      navigate('/', { replace: true });
      return;
    }

    // Case 2: Onboarding done BUT profile NOT ready → stay, show retry
    // (This prevents redirect loop when both APIs fail)
    if (onboardingPhase === 'done' && !hasCompleteProfile) {
      return;
    }

    // Case 3: Returning user with existing profile who never submitted
    // the birth form (e.g. typed /onboarding manually) → redirect home
    if (hasCompleteProfile && !hasSubmittedRef.current) {
      navigate('/', { replace: true });
      return;
    }

    // Case 4: User IS mid-onboarding (submitted birth form, bootstrap
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

      {persistError && (
        <div className="w-full max-w-md bg-amber-100 border border-amber-300 text-amber-700 px-4 py-3 rounded-xl text-sm text-center">
          {persistError}
        </div>
      )}

      {onboardingPhase === 'form' && (
        <BirthForm onSubmit={onSubmitBirth} isLoading={isLoading} />
      )}

      {onboardingPhase === 'signature' && bootstrapData && (
        <SignatureReveal
          bootstrapData={bootstrapData}
          onComplete={onSignatureComplete}
          bootstrapFailed={bootstrapFailed}
        />
      )}

      {onboardingPhase === 'done' && !hasCompleteProfile && (
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <p className="font-serif text-xl text-[#1E2A3A]/70">
            Beim Laden deiner Daten ist ein Fehler aufgetreten.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-[#8B6914]/30 text-[#8B6914] text-xs uppercase tracking-[0.3em] rounded-lg hover:bg-[#8B6914]/10 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      )}
    </motion.div>
  );
}
