/**
 * Signatur DevUI — useDebugPanel Hook
 * 
 * Hook für Debug Panel Steuerung mit Hotkey (Strg+D / Cmd+D).
 * Nur im Development-Modus aktiv.
 * 
 * Verwendung:
 *   const { isOpen, toggle, open, close } = useDebugPanel();
 *   return (
 *     <>
 *       <YourComponent />
 *       <DebugPanel isOpen={isOpen} onClose={close} />
 *     </>
 *   );
 */

import { useState, useEffect, useCallback } from 'react';
import { isDebugMode } from './debug-injection';

interface UseDebugPanelReturn {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function useDebugPanel(): UseDebugPanelReturn {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Hotkey: Strg+D oder Cmd+D
  useEffect(() => {
    if (!isDebugMode()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Strg+D oder Cmd+D (aber nicht wenn Input fokussiert)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        // Verhindern dass Browser-DevTools sich öffnen
        e.preventDefault();
        
        // Nicht wenn in einem Input/Textarea
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
          return;
        }

        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, toggle, open, close };
}

/**
 * Helper: Prüft ob Debug Panel verfügbar ist
 */
export function isDebugPanelAvailable(): boolean {
  return isDebugMode();
}
