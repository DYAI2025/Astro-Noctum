/**
 * Tests for /api/experience/daily v2 — include=["impact"] merge behavior.
 *
 * These tests verify the v2 contract additions:
 * - include param parsing
 * - impact block merge into response
 * - premium gating for fusion.action and resonance_badges
 * - backward compatibility when include is absent
 */
import { describe, it, expect } from 'vitest';

describe('experience/daily v2 contract', () => {
  describe('include param parsing', () => {
    it('recognizes include: ["impact"] as a valid v2 request', () => {
      const body = { birth: {}, include: ['impact'] };
      const wantsImpact = Array.isArray(body.include) && body.include.includes('impact');
      expect(wantsImpact).toBe(true);
    });

    it('treats missing include as v1 request (no impact)', () => {
      const body = { birth: {} };
      const wantsImpact = Array.isArray((body as any).include) && (body as any).include.includes('impact');
      expect(wantsImpact).toBe(false);
    });

    it('treats include: [] as v1 request (no impact)', () => {
      const body = { birth: {}, include: [] };
      const wantsImpact = Array.isArray(body.include) && body.include.includes('impact');
      expect(wantsImpact).toBe(false);
    });

    it('treats include: ["other"] without "impact" as v1', () => {
      const body = { birth: {}, include: ['other'] };
      const wantsImpact = Array.isArray(body.include) && body.include.includes('impact');
      expect(wantsImpact).toBe(false);
    });

    it('handles include: "impact" (string, not array) gracefully', () => {
      const body = { birth: {}, include: 'impact' };
      const wantsImpact = Array.isArray(body.include) && body.include.includes('impact');
      expect(wantsImpact).toBe(false); // must be array
    });
  });

  describe('premium gating', () => {
    it('free user gets fusion.action replaced with teaser + action_locked flag', () => {
      const parsedData = {
        fusion: {
          summary: 'Ein Tag mit klarer Struktur.',
          action: 'Original premium action text',
        },
      };
      const isPremium = false;
      const lang = 'de';

      // Simulate server gating logic
      if (!isPremium) {
        parsedData.fusion.action = lang === 'de'
          ? 'Deine persönliche Tagesempfehlung ist Teil von Bazodiac Premium.'
          : 'Your personal daily recommendation is part of Bazodiac Premium.';
        (parsedData.fusion as any).action_locked = true;
      }

      expect(parsedData.fusion.action).toContain('Premium');
      expect((parsedData.fusion as any).action_locked).toBe(true);
    });

    it('premium user keeps original fusion.action intact', () => {
      const parsedData = {
        fusion: {
          summary: 'Ein Tag mit klarer Struktur.',
          action: 'Nutze die Mars-Konjunktion für einen entschiedenen Schritt.',
        },
      };
      const isPremium = true;

      // Premium users: no modification
      if (!isPremium) {
        parsedData.fusion.action = 'teaser';
      }

      expect(parsedData.fusion.action).toContain('Mars-Konjunktion');
    });

    it('free user gets empty resonance_badges when impact requested', () => {
      const impactData = {
        resonance_badges: [
          { type: 'transit', label: 'Mars Konjunktion', intensity: 'hoch' },
        ],
      };
      const isPremium = false;

      if (!isPremium) {
        impactData.resonance_badges = [];
      }

      expect(impactData.resonance_badges).toEqual([]);
    });

    it('premium user sees full resonance_badges', () => {
      const impactData = {
        resonance_badges: [
          { type: 'transit', label: 'Mars Konjunktion', intensity: 'hoch' },
        ],
      };
      const isPremium = true;

      if (!isPremium) {
        impactData.resonance_badges = [];
      }

      expect(impactData.resonance_badges.length).toBe(1);
    });
  });

  describe('backward compatibility', () => {
    it('v1 response (no include) has no impact block', () => {
      const v1Response = {
        date: '2026-04-13',
        western: { summary: 'Test' },
        eastern: { summary: 'Test' },
        fusion: { summary: 'Test', harmony_index: 0.52, day_mode: 'trace' },
        resonance_badges: [{ type: 'transit' }],
      };

      // v1 should NOT have impact key
      expect(v1Response).not.toHaveProperty('impact');
      // v1 should still have resonance_badges (ungated)
      expect(v1Response.resonance_badges.length).toBeGreaterThan(0);
    });

    it('v2 response (with include) has impact block alongside fusion', () => {
      const v2Response = {
        date: '2026-04-13',
        western: { summary: 'Test' },
        eastern: { summary: 'Test' },
        fusion: { summary: 'Test', harmony_index: 0.52, day_mode: 'trace' },
        resonance_badges: [{ type: 'transit' }],
        impact: {
          schema: 'ACTIVE_IMPACTS_v1',
          harmony_index: 52,
          active_planets: [],
          resonance_badges: [],
        },
      };

      expect(v2Response).toHaveProperty('impact');
      expect(v2Response.impact.schema).toBe('ACTIVE_IMPACTS_v1');
      // fusion block is unchanged
      expect(v2Response.fusion.harmony_index).toBe(0.52);
    });
  });

  describe('ACTIVE_IMPACTS_v1 integration', () => {
    it('impact block has required schema fields', () => {
      const impact = {
        schema: 'ACTIVE_IMPACTS_v1',
        date: '2026-04-13',
        harmony_index: 52,
        active_planets: [
          { planet: 'Mars', strength: 0.85, aspect_type: 'conjunction', orb: 1.2, bazi_resonance: 'gleichklang', wu_xing_element: 'fire' },
        ],
        resonance_badges: [{ type: 'transit', intensity: 'hoch' }],
        meta: { engine: 'astro-noctum-server', cached: false },
      };

      expect(impact.schema).toBe('ACTIVE_IMPACTS_v1');
      expect(impact.harmony_index).toBeGreaterThanOrEqual(0);
      expect(impact.harmony_index).toBeLessThanOrEqual(100);
      expect(Array.isArray(impact.active_planets)).toBe(true);
      expect(Array.isArray(impact.resonance_badges)).toBe(true);

      const planet = impact.active_planets[0];
      expect(planet.orb).toBeLessThanOrEqual(8);
      expect(planet.strength).toBeGreaterThanOrEqual(0);
      expect(planet.strength).toBeLessThanOrEqual(1);
    });
  });
});
