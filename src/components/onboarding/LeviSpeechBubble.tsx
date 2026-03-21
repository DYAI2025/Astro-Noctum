import { useState, useEffect, useRef, useCallback } from 'react';

interface LeviSpeechBubbleProps {
  text: string;
  speed?: number;
  visible?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function LeviSpeechBubble({
  text,
  speed = 40,
  visible = true,
  onComplete,
  className = '',
}: LeviSpeechBubbleProps) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setDisplayedCount(0);
    completedRef.current = false;
    cleanup();
  }, [text, cleanup]);

  useEffect(() => {
    if (!visible || !text || completedRef.current) return;
    cleanup();

    intervalRef.current = setInterval(() => {
      setDisplayedCount((prev) => {
        const next = prev + 1;
        if (next >= text.length) {
          cleanup();
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return text.length;
        }
        return next;
      });
    }, speed);

    return cleanup;
  }, [visible, text, speed, onComplete, cleanup]);

  if (!text) return null;

  return (
    <div
      data-testid="levi-speech-bubble"
      className={`
        relative max-w-sm px-5 py-4 rounded-2xl
        bg-[#00F5FF]/[0.04] backdrop-blur-md
        border border-[#00F5FF]/[0.12]
        shadow-[0_0_20px_rgba(0,245,255,0.06)]
        ${className}
      `}
    >
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#00F5FF]/20 rounded-full blur-sm" />
      <p
        data-testid="levi-speech"
        className="font-sans text-sm leading-relaxed text-[#00F5FF]/80 min-h-[1.5em]"
        aria-live="polite"
      >
        {text.slice(0, displayedCount)}
        {displayedCount < text.length && (
          <span className="inline-block w-[2px] h-[1em] bg-[#00F5FF]/60 ml-0.5 animate-pulse" />
        )}
      </p>
    </div>
  );
}
