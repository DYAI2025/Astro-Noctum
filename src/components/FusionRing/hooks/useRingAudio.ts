import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFusionRing } from '@/hooks/useFusionRing';

type ElementType = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const ELEMENT_FREQS: Record<ElementType, number> = {
  wood:  440,   // A4
  fire:  880,   // A5
  earth: 660,
  metal: 330,
  water: 220,   // A3
};

export const useRingAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const humFilterRef = useRef<BiquadFilterNode | null>(null);
  const lastSpikeTimeRef = useRef<number>(0);
  const isReducedMotion = useRef(false);

  // Lazy AudioContext (User-Gesture-safe)
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Preload Chime-Buffers (einmalig)
  const chimeBuffers = useMemo(() => {
    const ctx = getContext();
    const buffers: Record<ElementType, AudioBuffer> = {} as any;
    Object.keys(ELEMENT_FREQS).forEach((el) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const freq = ELEMENT_FREQS[el as ElementType];
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6); // kristalliner Decay
      }
      buffers[el as ElementType] = buffer;
    });
    return buffers;
  }, [getContext]);

  // Persistent Hum Setup
  const setupHum = useCallback(() => {
    const ctx = getContext();
    if (humOscRef.current) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 38; // tiefer kosmischer Hum

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    const gain = ctx.createGain();
    gain.gain.value = 0.001; // start silent

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();

    humOscRef.current = osc;
    humFilterRef.current = filter;
    humGainRef.current = gain;
  }, [getContext]);

  // Throttled Volume Update (max 30 Hz)
  const setHumVolume = useCallback((strength: number) => {
    if (!humGainRef.current || isReducedMotion.current) return;
    const target = Math.max(0.001, Math.min(0.42, strength * 0.65));
    humGainRef.current.gain.setTargetAtTime(target, getContext().currentTime, 0.08);
  }, [getContext]);

  // Chime Trigger (nur bei neuen Spikes)
  const playChime = useCallback((sector: number, element: ElementType = 'fire') => {
    const now = Date.now();
    if (now - lastSpikeTimeRef.current < 180) return; // debounce
    lastSpikeTimeRef.current = now;

    const ctx = getContext();
    const source = ctx.createBufferSource();
    source.buffer = chimeBuffers[element];
    
    const gain = ctx.createGain();
    gain.gain.value = 0.35 + Math.random() * 0.15;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = ELEMENT_FREQS[element] * (0.9 + Math.random() * 0.2);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.8);
  }, [chimeBuffers, getContext]);

  // Main Integration + Cleanup
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion.current = mediaQuery.matches;

    setupHum();

    return () => {
      if (humOscRef.current) {
        humOscRef.current.stop();
        humOscRef.current.disconnect();
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.close();
      }
    };
  }, [setupHum]);

  // Auto-Trigger Chimes aus FusionRing (optionaler Helper)
  const { spikesData } = useFusionRing(); // nur wenn gewünscht
  useEffect(() => {
    if (spikesData) {
      spikesData
        .filter((s: any) => s.delta > 0.18)
        .forEach((s: any) => playChime(s.sector, s.element as ElementType));
    }
  }, [spikesData, playChime]);

  return { setHumVolume, playChime };
};
