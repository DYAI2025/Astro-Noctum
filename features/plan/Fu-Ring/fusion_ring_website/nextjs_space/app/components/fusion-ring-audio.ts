/**
 * Fusion Ring Audio Engine
 * Procedural Web Audio API sound design:
 * - Deep sub-bass drone (idle: low rumble/groan)
 * - Thunder-like peaks during effects
 * - All sounds generated procedurally — no audio files
 */

export interface FusionAudioEngine {
  /** Call every animation frame with current time + effect intensity (0 = idle, 0-1 = effect) */
  update: (time: number, effectIntensity: number, effectType: string | null) => void;
  /** Trigger a peak/strike (call once at effect start) */
  triggerPeak: (effectType: string) => void;
  /** Smooth volume enable */
  enable: () => void;
  /** Smooth volume disable */
  disable: () => void;
  /** Hard cleanup */
  dispose: () => void;
  /** Whether audio is currently enabled */
  isEnabled: () => boolean;
}

export function createFusionAudio(): FusionAudioEngine | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;

  let ctx: AudioContext | null = null;
  let enabled = false;
  let masterGain: GainNode;
  let droneGain: GainNode;
  let rumbleGain: GainNode;
  let effectGain: GainNode;
  let subBassOsc1: OscillatorNode;
  let subBassOsc2: OscillatorNode;
  let subBassOsc3: OscillatorNode;
  let droneLFO: OscillatorNode;
  let droneLFOGain: GainNode;
  let rumbleSource: AudioBufferSourceNode | null = null;
  let disposed = false;

  // Lazy init — browsers require user gesture for AudioContext
  function ensureContext() {
    if (ctx) return;
    ctx = new AudioContext();

    // === MASTER OUTPUT ===
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // === DRONE LAYER (sub-bass oscillators) ===
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.35;
    droneGain.connect(masterGain);

    // Sub-bass 1: deep foundation (32 Hz)
    subBassOsc1 = ctx.createOscillator();
    subBassOsc1.type = 'sine';
    subBassOsc1.frequency.value = 32;
    const sub1Gain = ctx.createGain();
    sub1Gain.gain.value = 0.5;
    subBassOsc1.connect(sub1Gain);
    sub1Gain.connect(droneGain);
    subBassOsc1.start();

    // Sub-bass 2: slightly detuned (35.5 Hz) — creates beating
    subBassOsc2 = ctx.createOscillator();
    subBassOsc2.type = 'sine';
    subBassOsc2.frequency.value = 35.5;
    const sub2Gain = ctx.createGain();
    sub2Gain.gain.value = 0.35;
    subBassOsc2.connect(sub2Gain);
    sub2Gain.connect(droneGain);
    subBassOsc2.start();

    // Sub-bass 3: harmonic color (55 Hz — sub-harmonics of A)
    subBassOsc3 = ctx.createOscillator();
    subBassOsc3.type = 'triangle';
    subBassOsc3.frequency.value = 55;
    const sub3Gain = ctx.createGain();
    sub3Gain.gain.value = 0.15;
    subBassOsc3.connect(sub3Gain);
    sub3Gain.connect(droneGain);
    subBassOsc3.start();

    // LFO modulating drone volume (slow breathing)
    droneLFO = ctx.createOscillator();
    droneLFO.type = 'sine';
    droneLFO.frequency.value = 0.08; // Very slow
    droneLFOGain = ctx.createGain();
    droneLFOGain.gain.value = 0.1;
    droneLFO.connect(droneLFOGain);
    droneLFOGain.connect(droneGain.gain);
    droneLFO.start();

    // === RUMBLE LAYER (filtered noise) ===
    rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.15;

    // Lowpass filter for rumble
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 80;
    rumbleFilter.Q.value = 3;
    rumbleGain.connect(rumbleFilter);
    rumbleFilter.connect(masterGain);

    // Second filter for extra depth
    const rumbleFilter2 = ctx.createBiquadFilter();
    rumbleFilter2.type = 'lowpass';
    rumbleFilter2.frequency.value = 120;
    rumbleFilter2.Q.value = 1;
    rumbleFilter.connect(rumbleFilter2);
    rumbleFilter2.connect(masterGain);

    // Generate brown noise buffer
    startRumbleNoise();

    // === EFFECT LAYER ===
    effectGain = ctx.createGain();
    effectGain.gain.value = 0;
    effectGain.connect(masterGain);
  }

  function startRumbleNoise() {
    if (!ctx) return;
    // Generate brown noise (random walk)
    const bufferSize = ctx.sampleRate * 4; // 4 seconds, looping
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastVal = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastVal = (lastVal + (0.02 * white)) / 1.02;
      data[i] = lastVal * 3.5; // Amplify
    }

    rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = buffer;
    rumbleSource.loop = true;
    rumbleSource.connect(rumbleGain);
    rumbleSource.start();
  }

  /** Trigger a thunder-like strike for effect onset */
  function triggerPeak(effectType: string) {
    if (!ctx || !enabled) return;
    ensureContext();
    const now = ctx.currentTime;

    // Intensity varies by effect type
    const intensityMap: Record<string, number> = {
      resonanzsprung: 0.7,
      dominanzwechsel: 0.5,
      mond_event: 0.3,
      spannungsachse: 0.6,
      korona_eruption: 0.8,
      divergenz_spike: 1.0,
      burst: 1.0,
      crunch: 0.7,
    };
    const peakIntensity = intensityMap[effectType] ?? 0.5;

    // === THUNDER STRIKE: Low frequency sweep + distorted noise burst ===

    // 1. Sub-bass impact (fast frequency sweep downward)
    const impactOsc = ctx.createOscillator();
    impactOsc.type = 'sawtooth';
    impactOsc.frequency.setValueAtTime(80 + peakIntensity * 60, now);
    impactOsc.frequency.exponentialRampToValueAtTime(20, now + 0.8);

    const impactGain = ctx.createGain();
    impactGain.gain.setValueAtTime(peakIntensity * 0.6, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    const impactFilter = ctx.createBiquadFilter();
    impactFilter.type = 'lowpass';
    impactFilter.frequency.setValueAtTime(200 + peakIntensity * 150, now);
    impactFilter.frequency.exponentialRampToValueAtTime(40, now + 1.2);
    impactFilter.Q.value = 5;

    // Waveshaper for distortion/growl
    const waveshaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * (2 + peakIntensity * 4));
    }
    waveshaper.curve = curve;
    waveshaper.oversample = '2x';

    impactOsc.connect(waveshaper);
    waveshaper.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(effectGain);
    impactOsc.start(now);
    impactOsc.stop(now + 2);

    // 2. Noise burst (crackle/thunder texture)
    const noiseLen = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    let lastN = 0;
    for (let i = 0; i < noiseLen; i++) {
      // Mix of white and brown noise for texture
      const white = Math.random() * 2 - 1;
      lastN = (lastN + 0.05 * white) / 1.05;
      const envelope = Math.exp(-i / (ctx.sampleRate * (0.3 + peakIntensity * 0.7)));
      noiseData[i] = (lastN * 4 + white * 0.3) * envelope;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300 + peakIntensity * 200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(50, now + 1.5);
    noiseFilter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(peakIntensity * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(effectGain);
    noiseSource.start(now);
    noiseSource.stop(now + 2.5);

    // 3. Deep boom (single cycle sub-bass)
    const boomOsc = ctx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(25 + peakIntensity * 15, now);
    boomOsc.frequency.exponentialRampToValueAtTime(18, now + 0.6);

    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(peakIntensity * 0.8, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    boomOsc.connect(boomGain);
    boomGain.connect(effectGain);
    boomOsc.start(now);
    boomOsc.stop(now + 1.5);

    // Effect gain envelope
    effectGain.gain.setValueAtTime(1.0, now);
    effectGain.gain.setValueAtTime(1.0, now + 0.5);
    effectGain.gain.exponentialRampToValueAtTime(0.3, now + 2.5);
  }

  /** Continuous update: modulate drone based on effect intensity */
  function update(time: number, effectIntensity: number, effectType: string | null) {
    if (!ctx || !enabled) return;

    // Modulate drone volume: louder during effects
    const targetDroneVol = 0.25 + effectIntensity * 0.5;
    droneGain.gain.setTargetAtTime(targetDroneVol, ctx.currentTime, 0.3);

    // Modulate rumble: more intense during effects
    const targetRumbleVol = 0.12 + effectIntensity * 0.4;
    rumbleGain.gain.setTargetAtTime(targetRumbleVol, ctx.currentTime, 0.2);

    // Slight frequency drift for organic feel
    const drift1 = Math.sin(time * 0.07) * 1.5;
    const drift2 = Math.sin(time * 0.11 + 1.3) * 1.0;
    subBassOsc1.frequency.setTargetAtTime(32 + drift1, ctx.currentTime, 0.5);
    subBassOsc2.frequency.setTargetAtTime(35.5 + drift2, ctx.currentTime, 0.5);

    // During intense effects, add harmonic content
    if (effectIntensity > 0.3) {
      subBassOsc3.frequency.setTargetAtTime(55 + effectIntensity * 15, ctx.currentTime, 0.3);
      const sub3Vol = 0.15 + effectIntensity * 0.25;
      // The sub3Gain node isn't accessible here — use the oscillator detune instead
      subBassOsc3.detune.setTargetAtTime(effectIntensity * 30, ctx.currentTime, 0.2);
    } else {
      subBassOsc3.frequency.setTargetAtTime(55, ctx.currentTime, 1.0);
      subBassOsc3.detune.setTargetAtTime(0, ctx.currentTime, 1.0);
    }

    // LFO speed: faster during effects (more agitated)
    const lfoSpeed = 0.08 + effectIntensity * 0.4;
    droneLFO.frequency.setTargetAtTime(lfoSpeed, ctx.currentTime, 0.5);
    droneLFOGain.gain.setTargetAtTime(0.08 + effectIntensity * 0.15, ctx.currentTime, 0.3);
  }

  function enable() {
    ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    enabled = true;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(0.7, ctx.currentTime, 1.5); // Slow fade in
  }

  function disable() {
    if (!ctx) return;
    enabled = false;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.8); // Smooth fade out
  }

  function dispose() {
    disposed = true;
    if (!ctx) return;
    try {
      subBassOsc1?.stop();
      subBassOsc2?.stop();
      subBassOsc3?.stop();
      droneLFO?.stop();
      rumbleSource?.stop();
      ctx.close();
    } catch {
      // ignore
    }
    ctx = null;
  }

  return {
    update,
    triggerPeak,
    enable,
    disable,
    dispose,
    isEnabled: () => enabled,
  };
}
