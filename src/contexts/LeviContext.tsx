import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// LeviContext — Global voice agent state
// Keeps Levi alive across route changes. The ElevenLabs widget lives at
// App-level, outside the router, so navigation never kills the conversation.
// ─────────────────────────────────────────────────────────────────────────────

export interface LeviState {
  /** Whether Levi is currently in a conversation */
  active: boolean;
  /** Whether the floating widget is expanded or minimised */
  expanded: boolean;
  /** Whether the user has premium access */
  isPremium: boolean;
  /** Current page context for Levi (which feature is the user looking at) */
  pageContext: string;
}

interface LeviContextType extends LeviState {
  startCall: () => void;
  endCall: () => void;
  toggleExpanded: () => void;
  setExpanded: (v: boolean) => void;
  setIsPremium: (v: boolean) => void;
  setPageContext: (ctx: string) => void;
}

const LeviCtx = createContext<LeviContextType | null>(null);

interface LeviProviderProps {
  children: ReactNode;
  onStopAudio: () => void;
  onResumeAudio: () => void;
}

export function LeviProvider({ children, onStopAudio, onResumeAudio }: LeviProviderProps) {
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [pageContext, setPageContext] = useState('dashboard');

  const startCall = useCallback(() => {
    onStopAudio();
    setActive(true);
    setExpanded(true);
  }, [onStopAudio]);

  const endCall = useCallback(() => {
    setActive(false);
    setExpanded(false);
    onResumeAudio();
  }, [onResumeAudio]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    active, expanded, isPremium, pageContext,
    startCall, endCall, toggleExpanded, setExpanded, setIsPremium, setPageContext,
  }), [active, expanded, isPremium, pageContext, startCall, endCall, toggleExpanded]);

  return (
    <LeviCtx.Provider value={value}>
      {children}
    </LeviCtx.Provider>
  );
}

export function useLevi(): LeviContextType {
  const ctx = useContext(LeviCtx);
  if (!ctx) throw new Error('useLevi must be inside LeviProvider');
  return ctx;
}
