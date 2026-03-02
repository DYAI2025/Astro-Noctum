import { useRef, useState, useCallback, useEffect } from "react";

// All ambiente tracks served from public/ambiente/.
const TRACKS: string[] = [
  "/ambiente/bazodiac/Cosmic Birth A Meditation on Stellar Genesis.mp3",
  "/ambiente/bazodiac/Cosmic Resonance.mp3",
  "/ambiente/bazodiac/Geometry of Grace.mp3",
  "/ambiente/bazodiac/Neptune's Flow (2).mp3",
  "/ambiente/bazodiac/Rite of Emergence.mp3",
  "/ambiente/bazodiac/Wood Dragon Awakening.mp3",
  "/ambiente/bazodiac/Wood Dragon Rebirth.mp3",
];

const VOLUME = 0.6;

export function useAmbientePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  // Whether the user has manually muted (persists across Levi pause/resume)
  const userMutedRef = useRef(false);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = VOLUME;
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

  /** Start playback from the beginning of the playlist (called after user gesture). */
  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userMutedRef.current = false;
    trackIndexRef.current = 0;
    audio.src = TRACKS[0];
    audio.volume = VOLUME;
    audio.play()
      .then(() => setPlaying(true))
      .catch((e) => console.warn("Ambiente autoplay blocked:", e));
  }, []);

  /** Toggle mute/unmute (user button). */
  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      userMutedRef.current = true;
    } else {
      userMutedRef.current = false;
      // If no src yet, start from the top
      if (!audio.src || audio.src === window.location.href) {
        trackIndexRef.current = 0;
        audio.src = TRACKS[0];
      }
      audio.volume = VOLUME;
      audio.play()
        .then(() => setPlaying(true))
        .catch((e) => console.warn("Ambiente play blocked:", e));
    }
  }, [playing]);

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
    if (!audio || userMutedRef.current) return;
    audio.volume = VOLUME;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, []);

  return { playing, start, toggle, pause, resume };
}
