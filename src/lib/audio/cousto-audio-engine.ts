/**
 * Cousto Audio Engine — generates ambient sound from planetary Cousto frequencies.
 *
 * 6 oscillators, one per bipolar dimension, tuned to Hans Cousto's Cosmic Octave:
 *   Mars 144.72 Hz, Moon 210.42 Hz, Sun 126.22 Hz,
 *   Mercury 141.27 Hz, Jupiter 183.58 Hz, Saturn 147.85 Hz
 *
 * Each oscillator's gain is proportional to its dimension's pole weight.
 * No external audio input is processed — the engine generates its own sound.
 */

export interface CoustoOscillator {
  dimensionId: string;
  hz: number;
  oscillator: OscillatorNode;
  gain: GainNode;
}

export interface CoustoAudioEngine {
  /** Start all oscillators (requires user gesture on iOS Safari) */
  start(): Promise<void>;
  /** Suspend audio context (tab hidden, muted) */
  suspend(): void;
  /** Resume audio context (tab visible, unmuted) */
  resume(): void;
  /** Stop and dispose all nodes */
  dispose(): void;
  /** Update oscillator gains from dimension weights (smooth interpolation) */
  updateWeights(weights: Record<string, number>): void;
  /** Set master volume 0–1 */
  setVolume(volume: number): void;
  /** Whether the engine is currently producing sound */
  readonly isPlaying: boolean;
}

const DIMENSION_FREQUENCIES: Record<string, number> = {
  assertion: 144.72,   // Mars
  empathy: 210.42,     // Moon
  creativity: 126.22,  // Sun
  logic: 141.27,       // Mercury
  intuition: 183.58,   // Jupiter
  discipline: 147.85,  // Saturn
};

/** Ramp time for smooth gain transitions (seconds) */
const RAMP_TIME = 0.3;

/** Base gain per oscillator (scaled by weight) */
const BASE_GAIN = 0.06;

export function createCoustoAudioEngine(): CoustoAudioEngine {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let oscillators: CoustoOscillator[] = [];
  let playing = false;

  function ensureContext(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  return {
    get isPlaying() {
      return playing;
    },

    async start() {
      const audioCtx = ensureContext();

      // iOS Safari requires resume after user gesture
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      if (playing) return;

      oscillators = Object.entries(DIMENSION_FREQUENCIES).map(([dimId, hz]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.value = BASE_GAIN * 0.5; // start at neutral weight

        osc.connect(gain);
        gain.connect(masterGain!);
        osc.start();

        return { dimensionId: dimId, hz, oscillator: osc, gain };
      });

      playing = true;
    },

    suspend() {
      if (ctx && ctx.state === 'running') {
        void ctx.suspend();
      }
    },

    resume() {
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
    },

    dispose() {
      for (const osc of oscillators) {
        try {
          osc.oscillator.stop();
          osc.oscillator.disconnect();
          osc.gain.disconnect();
        } catch {
          // already stopped
        }
      }
      oscillators = [];
      playing = false;

      if (ctx) {
        void ctx.close();
        ctx = null;
        masterGain = null;
      }
    },

    updateWeights(weights: Record<string, number>) {
      if (!ctx || !playing) return;
      const now = ctx.currentTime;

      for (const osc of oscillators) {
        const weight = weights[osc.dimensionId] ?? 0.5;
        const targetGain = BASE_GAIN * weight;
        osc.gain.gain.cancelScheduledValues(now);
        osc.gain.gain.setValueAtTime(osc.gain.gain.value, now);
        osc.gain.gain.linearRampToValueAtTime(targetGain, now + RAMP_TIME);
      }
    },

    setVolume(volume: number) {
      if (masterGain && ctx) {
        const clamped = Math.max(0, Math.min(1, volume));
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(clamped, now + RAMP_TIME);
      }
    },
  };
}
