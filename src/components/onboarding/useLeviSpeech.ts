import { useState, useCallback } from 'react';

type SpeechMode = 'voice' | 'text';

interface LeviSpeechState {
  mode: SpeechMode;
  isAvailable: boolean;
  currentText: string;
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useLeviSpeech(): LeviSpeechState {
  const agentId = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_ELEVENLABS_AGENT_ID as string | undefined)
    : undefined;

  const hasVoice = Boolean(agentId);
  const [currentText, setCurrentText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    setCurrentText(text);
    setIsSpeaking(true);
  }, []);

  const stop = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  return {
    mode: hasVoice ? 'voice' : 'text',
    isAvailable: hasVoice,
    currentText,
    isSpeaking,
    speak,
    stop,
  };
}
