import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeviSpeech } from '../components/onboarding/useLeviSpeech';

describe('useLeviSpeech', () => {
  it('returns fallback mode when VITE_ELEVENLABS_AGENT_ID is not set', () => {
    const { result } = renderHook(() => useLeviSpeech());
    expect(result.current.mode).toBe('text');
    expect(result.current.isAvailable).toBe(false);
  });

  it('provides speak function that does not throw in text mode', () => {
    const { result } = renderHook(() => useLeviSpeech());
    expect(() => act(() => { result.current.speak('hello'); })).not.toThrow();
  });

  it('returns the last spoken text', () => {
    const { result } = renderHook(() => useLeviSpeech());
    act(() => { result.current.speak('Test nachricht'); });
    expect(result.current.currentText).toBe('Test nachricht');
  });
});
