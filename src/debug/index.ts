/**
 * Signatur DevUI — Public Exports
 * 
 * Alle Debug-Exports an einem Ort für einfache Imports.
 */

export { DebugInjection, isDebugMode, debugOnly } from './debug-injection';
export { DebugPanel } from './DebugPanel';
export { useDebugPanel, isDebugPanelAvailable } from './useDebugPanel';
export { DEBUG_PRESETS, PRESET_LABELS, PRESET_DESCRIPTIONS } from './presets';
export type {
  DebugOverrides,
  DebugState,
  DensityField,
} from './types';

/**
 * Convenience: Globale Debug-Instanz für Browser-Console.
 * 
 * Im Development-Build kann dies im Haupt-Modul aufgerufen werden,
 * um DebugInjection direkt in der Console verfügbar zu machen:
 * 
 *   > debug.setOverrides({ forceDissonance: true })
 */
export { DebugInjection as getDebug } from './debug-injection';
