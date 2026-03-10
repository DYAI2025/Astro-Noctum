import { useRef, useState, useCallback, useEffect } from "react";

// All ambiente tracks served from public/ambiente/.
const TRACKS: string[] = [
  "/ambiente/bazodiac/Aetheric Resonance.mp3",
  "/ambiente/bazodiac/Astral Paths.mp3",
  "/ambiente/bazodiac/Bazodiac's Breath - A Digital-Biological Organism.mp3",
  "/ambiente/bazodiac/Cosmic Birth A Meditation on Stellar Genesis.mp3",
  "/ambiente/bazodiac/Cosmic Heartbeat.mp3",
  "/ambiente/bazodiac/Cosmic Resonance.mp3",
  "/ambiente/bazodiac/Darkness Is a Mirror.mp3",
  "/ambiente/bazodiac/Elysian Transition (3).mp3",
  "/ambiente/bazodiac/Elysian Transition.mp3",
  "/ambiente/bazodiac/Galactic Garden.mp3",
  "/ambiente/bazodiac/Geometry of Grace.mp3",
  "/ambiente/bazodiac/Glass Shatters.mp3",
  "/ambiente/bazodiac/Into the Wild.mp3",
  "/ambiente/bazodiac/Neptune's Flow (2).mp3",
  "/ambiente/bazodiac/Rite of Emergence.mp3",
  "/ambiente/bazodiac/Roots and Stars (1).mp3",
  "/ambiente/bazodiac/Roots and Stars.mp3",
  "/ambiente/bazodiac/Sacred Water Flow Through Mycelium.mp3",
  "/ambiente/bazodiac/Shining With the Stars.mp3",
  "/ambiente/bazodiac/Symmetry of the Celestial Sphere (1).mp3",
  "/ambiente/bazodiac/Symmetry of the Celestial Sphere.mp3",
  "/ambiente/bazodiac/Wood Dragon Awakening.mp3",
  "/ambiente/bazodiac/Wood Dragon Rebirth.mp3",
  "/ambiente/bazodiac/Zodiac's Breath (2).mp3",
  "/ambiente/bazodiac/Zodiac's Breath.mp3",
];

const DEFAULT_VOLUME = 0.6;
const STORAGE_KEY_VOLUME = "bazodiac_ambiente_volume";

export function useAmbientePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  
  // Volume state (0 to 1)
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved !== null ? parseFloat(saved) : DEFAULT_VOLUME;
  });

  // Keep track of last non-zero volume for "unmute" snap
  const lastActiveVolumeRef = useRef(volume > 0 ? volume : DEFAULT_VOLUME);

  // Whether the user has manually muted (persists across Levi pause/resume)
  const userMutedRef = useRef(false);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    // When a track ends, advance to the next one
    const handleEnded = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[trackIndexRef.current];
      audio.play().catch(() => {});
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Update real audio volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    if (volume > 0) {
      lastActiveVolumeRef.current = volume;
    }
  }, [volume]);

  const setVolume = useCallback((newVol: number) => {
    setVolumeState(newVol);
    if (newVol === 0) {
      userMutedRef.current = true;
    } else {
      userMutedRef.current = false;
    }
  }, []);

  /** Start playback from the beginning of the playlist (called after user gesture). */
  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userMutedRef.current = volume === 0;
    trackIndexRef.current = 0;
    audio.src = TRACKS[0];
    audio.volume = volume;
    audio.play()
      .then(() => setPlaying(true))
      .catch((e) => console.warn("Ambiente autoplay blocked:", e));
  }, [volume]);

  /** Toggle mute/unmute (user button). */
  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing && volume > 0) {
      // Mute logic
      audio.pause();
      setPlaying(false);
      userMutedRef.current = true;
    } else {
      // Unmute logic
      userMutedRef.current = false;
      
      // If volume is 0, snap back to last active volume
      if (volume === 0) {
        setVolumeState(lastActiveVolumeRef.current);
      }

      // If no src yet, start from the top
      if (!audio.src || audio.src === window.location.href) {
        trackIndexRef.current = 0;
        audio.src = TRACKS[0];
      }
      
      audio.volume = volume === 0 ? lastActiveVolumeRef.current : volume;
      audio.play()
        .then(() => setPlaying(true))
        .catch((e) => console.warn("Ambiente play blocked:", e));
    }
  }, [playing, volume]);

  /** Pause for ElevenLabs agent call. */
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  /** Resume after ElevenLabs agent call (only if user hadn't muted). */
  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userMutedRef.current || volume === 0) return;
    audio.volume = volume;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [volume]);

  return { playing, volume, setVolume, start, toggle, pause, resume };
}
