/**
 * React hook for Cousto Audio Engine lifecycle management.
 *
 * - Creates engine on mount, disposes on unmount
 * - Suspends on tab hidden, resumes on visible
 * - Updates oscillator gains when dimension weights change
 * - Persists mute/volume state in localStorage
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createCoustoAudioEngine, type CoustoAudioEngine } from '../lib/audio/cousto-audio-engine';

const LS_MUTED = 'cousto_audio_muted';
const LS_VOLUME = 'cousto_audio_volume';

function getStoredMuted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(LS_MUTED) === 'true';
}

function getStoredVolume(): number {
  if (typeof window === 'undefined') return 0.5;
  const stored = localStorage.getItem(LS_VOLUME);
  if (stored === null) return 0.5;
  const parsed = parseFloat(stored);
  return isNaN(parsed) ? 0.5 : Math.max(0, Math.min(1, parsed));
}

export interface UseCoustoAudioReturn {
  /** Whether audio is muted */
  muted: boolean;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Current volume 0–1 */
  volume: number;
  /** Set volume 0–1 */
  setVolume: (v: number) => void;
  /** Whether the engine is active and producing sound */
  isPlaying: boolean;
}

export function useCoustoAudio(
  /** 6 dimension weights keyed by dimension id */
  weights: Record<string, number> | undefined,
  /** Whether audio should be active (e.g., feature flag, component mounted) */
  enabled: boolean = true,
): UseCoustoAudioReturn {
  const engineRef = useRef<CoustoAudioEngine | null>(null);
  const [muted, setMuted] = useState(getStoredMuted);
  const [volume, setVolumeState] = useState(getStoredVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const startedRef = useRef(false);

  // Create engine on mount
  useEffect(() => {
    if (!enabled) return;
    engineRef.current = createCoustoAudioEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      startedRef.current = false;
      setIsPlaying(false);
    };
  }, [enabled]);

  // Start on first user interaction (required for iOS Safari)
  useEffect(() => {
    if (!enabled || muted || startedRef.current) return;

    const startOnGesture = async () => {
      if (engineRef.current && !startedRef.current) {
        await engineRef.current.start();
        startedRef.current = true;
        setIsPlaying(true);
      }
      document.removeEventListener('click', startOnGesture);
      document.removeEventListener('touchstart', startOnGesture);
    };

    document.addEventListener('click', startOnGesture, { once: true });
    document.addEventListener('touchstart', startOnGesture, { once: true });

    return () => {
      document.removeEventListener('click', startOnGesture);
      document.removeEventListener('touchstart', startOnGesture);
    };
  }, [enabled, muted]);

  // Visibility API — suspend/resume
  useEffect(() => {
    const handler = () => {
      if (!engineRef.current) return;
      if (document.hidden) {
        engineRef.current.suspend();
      } else if (!muted) {
        engineRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [muted]);

  // Update weights → oscillator gains
  useEffect(() => {
    if (weights && engineRef.current) {
      engineRef.current.updateWeights(weights);
    }
  }, [weights]);

  // Mute/unmute
  useEffect(() => {
    if (!engineRef.current) return;
    if (muted) {
      engineRef.current.suspend();
      setIsPlaying(false);
    } else if (startedRef.current) {
      engineRef.current.resume();
      setIsPlaying(true);
    }
    localStorage.setItem(LS_MUTED, String(muted));
  }, [muted]);

  // Volume changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
    localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  return { muted, toggleMute, volume, setVolume, isPlaying };
}
