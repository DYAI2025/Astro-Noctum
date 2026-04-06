/**
 * Tests for the containsBareNumbers() guard in server.mjs.
 *
 * server.mjs is not importable from TypeScript tests — the function is
 * mirrored inline here to guard against silent mutations, following the
 * same pattern used for night-pulse-h-calc.test.ts.
 *
 * REQ-F-transparency-rule: Gemini-generated text must not contain bare numbers.
 */
import { describe, it, expect } from 'vitest';

// ── Mirror of server.mjs containsBareNumbers() ─────────────────────
// Keep in sync with server.mjs implementation.

function containsBareNumbers(text: unknown): boolean {
  if (typeof text !== 'string' || !text) return false;
  // Match: bare percentages (72%) or decimal scores (0.85, 3.4)
  return /\d+\s*%|\b\d+[.,]\d+\b/.test(text);
}

// ── Tests ──────────────────────────────────────────────────────────

describe('containsBareNumbers (REQ-F-transparency-rule Gemini guard)', () => {
  describe('Detects bare numbers that must be rejected', () => {
    it('detects bare percentage', () => {
      expect(containsBareNumbers('Deine Energie liegt bei 72% heute.')).toBe(true);
    });

    it('detects bare percentage with space', () => {
      expect(containsBareNumbers('Resonanz: 85 %')).toBe(true);
    });

    it('detects decimal score (0.85 style)', () => {
      expect(containsBareNumbers('Harmonie-Index 0.85 zeigt Ausgleich.')).toBe(true);
    });

    it('detects decimal score (3.4 style)', () => {
      expect(containsBareNumbers('Score: 3.4')).toBe(true);
    });

    it('detects comma-decimal score (German locale)', () => {
      expect(containsBareNumbers('Wert: 0,72')).toBe(true);
    });

    it('detects percentage at start of string', () => {
      expect(containsBareNumbers('72% der Energie fließt in Kommunikation.')).toBe(true);
    });
  });

  describe('Passes clean qualitative text', () => {
    it('passes clean kurzsignal', () => {
      expect(containsBareNumbers('Deine Energie öffnet sich für neue Impulse.')).toBe(false);
    });

    it('passes text with ordinal numbers in context (e.g. "3 Phasen")', () => {
      // Single-digit integers without decimal are not flagged
      expect(containsBareNumbers('Du durchläufst gerade eine von 3 Phasen.')).toBe(false);
    });

    it('passes text with time reference', () => {
      expect(containsBareNumbers('Die nächsten 2-3 Stunden begünstigen Fokus.')).toBe(false);
    });

    it('passes empty string', () => {
      expect(containsBareNumbers('')).toBe(false);
    });

    it('passes null-ish input gracefully', () => {
      expect(containsBareNumbers(null)).toBe(false);
      expect(containsBareNumbers(undefined)).toBe(false);
      expect(containsBareNumbers(42)).toBe(false);
    });

    it('passes German qualitative labels', () => {
      expect(containsBareNumbers('Intensität')).toBe(false);
      expect(containsBareNumbers('Offenheit und Zuneigung stärken deine Beziehungen.')).toBe(false);
      expect(containsBareNumbers('Fokus und Ausdauer zahlen sich aus.')).toBe(false);
    });

    it('passes explain text without numbers', () => {
      expect(containsBareNumbers('Deine Signatur zeigt Yin-Holz in der Führungsachse.')).toBe(false);
      expect(containsBareNumbers('Mars aktiviert deinen Aufstiegssektor.')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('detects when bare number appears inside longer text', () => {
      expect(containsBareNumbers('Eine gute Phase — Resonanz liegt bei 0.78, nutze sie.')).toBe(true);
    });

    it('does not flag years or centuries (4-digit, no decimal)', () => {
      // 4-digit integers are not flagged by the current pattern
      expect(containsBareNumbers('Im Jahr 2026 beginnt ein neuer Zyklus.')).toBe(false);
    });
  });
});
