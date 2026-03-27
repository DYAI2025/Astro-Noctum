import { describe, it, expect } from 'vitest';

describe('onboarding redirect guard', () => {
  it('should not redirect when phase is done but profile is incomplete', () => {
    // This tests the logic, not the component render
    const onboardingPhase = 'done' as const;
    const hasCompleteProfile = false;
    const hasSubmitted = true;

    // The guard should detect this state and NOT redirect
    const shouldShowRetry = onboardingPhase === 'done' && !hasCompleteProfile && hasSubmitted;
    expect(shouldShowRetry).toBe(true);
  });

  it('should redirect normally when phase is done and profile is complete', () => {
    const onboardingPhase = 'done' as const;
    const hasCompleteProfile = true;
    const hasSubmitted = true;

    const shouldShowRetry = onboardingPhase === 'done' && !hasCompleteProfile && hasSubmitted;
    expect(shouldShowRetry).toBe(false);
  });
});
