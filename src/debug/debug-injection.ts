/**
 * Signatur DevUI — DebugInjection Singleton
 * 
 * Zentrale Schnittstelle für Debug-Overrides in der Signatur V3 Engine.
 * 
 * Verwendung:
 *   const debug = DebugInjection.getInstance();
 *   debug.setOverrides({ forceDissonance: true });
 * 
 * Build-Safety:
 *   - Nur im Development-Build aktiv (NODE_ENV === 'development')
 *   - Wird in Production-Builds durch Tree-Shaking entfernt
 *   - Alle Methoden sind typsicher über DebugOverrides
 */

import { DebugOverrides, DebugState } from './types';

export class DebugInjection {
  private static instance: DebugInjection;
  private overrides: DebugOverrides = {};
  private listeners: Array<(state: DebugState) => void> = [];
  private state: DebugState = { overrides: {} };

  /** Private Constructor für Singleton-Pattern */
  private constructor() {}

  /**
   * Singleton-Zugriff.
   * 
   * @returns Die globale DebugInjection-Instanz
   */
  static getInstance(): DebugInjection {
    if (!DebugInjection.instance) {
      DebugInjection.instance = new DebugInjection();
    }
    return DebugInjection.instance;
  }

  /**
   * Setzt Debug-Overrides.
   * 
   * @param overrides - Partieller Override (bestehende Werte bleiben erhalten)
   * 
   * Beispiel:
   *   debug.setOverrides({
   *     forceDissonance: true,
   *     persistenceOverride: 0.95
   *   });
   */
  setOverrides(overrides: Partial<DebugOverrides>): void {
    this.overrides = { ...this.overrides, ...overrides };
    this.notify();
  }

  /**
   * Holt alle aktuellen Overrides.
   * 
   * @returns Kopie der Overrides (nicht direkt modifizierbar)
   */
  getOverrides(): DebugOverrides {
    return { ...this.overrides };
  }

  /**
   * Holt den aktuellen Debug-State (inkl. Pole-States, Density Field).
   * 
   * @returns Kopie des States (read-only)
   */
  getState(): DebugState {
    return { ...this.state };
  }

  /**
   * Aktualisiert die Pole-States (wird von der Engine aufgerufen).
   * 
   * @param poleStates - Aktuelle Pole-Positionen und Parameter
   */
  updatePoleStates(poleStates: DebugState['poleStates']): void {
    this.state.poleStates = poleStates;
    this.notify();
  }

  /**
   * Aktualisiert das Density Field (wird vom Renderer aufgerufen).
   * 
   * @param field - Density Field Grid für Heatmap-Overlay
   */
  updateDensityField(field: DebugState['densityField']): void {
    this.state.densityField = field;
    this.notify();
  }

  /**
   * Abonniert State-Updates für UI-Rendering.
   * Sendet sofort den aktuellen State an den Subscriber.
   * 
   * @param listener - Callback bei State-Änderung
   * @returns Unsubscribe-Funktion
   * 
   * Beispiel:
   *   const unsubscribe = debug.subscribe((state) => {
   *     console.log('Debug State:', state);
   *   });
   *   // ... später: unsubscribe();
   */
  subscribe(listener: (state: DebugState) => void): () => void {
    this.listeners.push(listener);
    // Sofort aktuellen State senden
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Setzt alle Overrides zurück.
   */
  reset(): void {
    this.overrides = {};
    this.state = { overrides: {} };
    this.notify();
  }

  /**
   * Benachrichtigt alle Subscriber über State-Änderung.
   */
  private notify(): void {
    this.state.overrides = { ...this.overrides };
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (error) {
        console.error('[DebugInjection] Listener error:', error);
      }
    });
  }
}

/**
 * Prüft, ob Debug-Modus aktiv ist.
 * 
 * @returns true wenn NODE_ENV === 'development'
 * 
 * Verwendung:
 *   if (isDebugMode()) {
 *     // Debug-Code hier
 *   }
 */
export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Safe-Wrapper für Debug-Operationen.
 * Führt callback nur im Debug-Modus aus.
 * 
 * @param callback - Funktion die nur im Debug-Modus ausgeführt wird
 * 
 * Beispiel:
 *   debugOnly(() => {
 *     console.log('Debug info:', someValue);
 *   });
 */
export function debugOnly(callback: () => void): void {
  if (isDebugMode()) {
    callback();
  }
}
