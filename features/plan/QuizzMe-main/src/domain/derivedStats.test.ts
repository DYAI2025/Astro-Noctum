/**
 * Unit tests for Derived Stats Calculator
 * Tests all formulas and edge cases per FR-3
 */
import { describe, it, expect } from 'vitest';
import { toPercent01, calcDerivedStats } from './derivedStats';
import { PsycheCoreStats } from '@/lib/types/psyche';

describe('toPercent01', () => {
    it('should convert 0 to 0', () => {
        expect(toPercent01(0)).toBe(0);
    });

    it('should convert 1 to 100', () => {
        expect(toPercent01(1)).toBe(100);
    });

    it('should convert 0.5 to 50', () => {
        expect(toPercent01(0.5)).toBe(50);
    });

    it('should round 0.456 to 46', () => {
        expect(toPercent01(0.456)).toBe(46);
    });

    it('should round 0.455 to 46 (round half to even)', () => {
        expect(toPercent01(0.455)).toBe(46);
    });

    it('should clamp values above 1 to 100', () => {
        expect(toPercent01(1.5)).toBe(100);
        expect(toPercent01(2.0)).toBe(100);
    });

    it('should clamp negative values to 0', () => {
        expect(toPercent01(-0.1)).toBe(0);
        expect(toPercent01(-1.0)).toBe(0);
    });
});

describe('calcDerivedStats', () => {
    describe('vitality (avg of clarity and connection)', () => {
        it('should calculate vitality as average of clarity and connection', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.6,
                connection: 0.8,
                courage: 0,
                order: 0,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            // avg(0.6, 0.8) = 0.7 = 70
            expect(result.vitality).toBe(70);
        });

        it('should return 0 when both clarity and connection are 0', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0,
                order: 0,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            expect(result.vitality).toBe(0);
        });

        it('should return 100 when both clarity and connection are 1', () => {
            const stats: PsycheCoreStats = {
                clarity: 1,
                connection: 1,
                courage: 0,
                order: 0,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            expect(result.vitality).toBe(100);
        });

        it('should handle mixed values correctly', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.72,
                connection: 0.88,
                courage: 0,
                order: 0,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            // avg(0.72, 0.88) = 0.8 = 80
            expect(result.vitality).toBe(80);
        });
    });

    describe('willpower (avg of courage and order)', () => {
        it('should calculate willpower as average of courage and order', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0.4,
                order: 0.6,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            // avg(0.4, 0.6) = 0.5 = 50
            expect(result.willpower).toBe(50);
        });

        it('should return 0 when both courage and order are 0', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0,
                order: 0,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            expect(result.willpower).toBe(0);
        });

        it('should return 100 when both courage and order are 1', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 1,
                order: 1,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            expect(result.willpower).toBe(100);
        });

        it('should handle asymmetric values', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0.45,
                order: 0.30,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            // avg(0.45, 0.30) = 0.375 = 38 (rounded)
            expect(result.willpower).toBe(38);
        });
    });

    describe('chaos (equals shadow)', () => {
        it('should equal shadow value', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0,
                order: 0,
                shadow: 0.35,
            };
            const result = calcDerivedStats(stats);
            expect(result.chaos).toBe(35);
        });

        it('should be 0 when shadow is 0', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.5,
                connection: 0.5,
                courage: 0.5,
                order: 0.5,
                shadow: 0,
            };
            const result = calcDerivedStats(stats);
            expect(result.chaos).toBe(0);
        });

        it('should be 100 when shadow is 1', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0,
                order: 0,
                shadow: 1,
            };
            const result = calcDerivedStats(stats);
            expect(result.chaos).toBe(100);
        });
    });

    describe('harmony (1 - abs(shadow - connection))', () => {
        it('should be 100 when shadow equals connection', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0.5,
                courage: 0,
                order: 0,
                shadow: 0.5,
            };
            const result = calcDerivedStats(stats);
            // 1 - abs(0.5 - 0.5) = 1 - 0 = 1 = 100
            expect(result.harmony).toBe(100);
        });

        it('should be 0 when shadow and connection are maximally apart', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0,
                courage: 0,
                order: 0,
                shadow: 1,
            };
            const result = calcDerivedStats(stats);
            // 1 - abs(1 - 0) = 1 - 1 = 0
            expect(result.harmony).toBe(0);
        });

        it('should handle partial alignment', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0.7,
                courage: 0,
                order: 0,
                shadow: 0.4,
            };
            const result = calcDerivedStats(stats);
            // 1 - abs(0.4 - 0.7) = 1 - 0.3 = 0.7 = 70
            expect(result.harmony).toBe(70);
        });

        it('should be symmetric (shadow > connection)', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0.3,
                courage: 0,
                order: 0,
                shadow: 0.8,
            };
            const result = calcDerivedStats(stats);
            // 1 - abs(0.8 - 0.3) = 1 - 0.5 = 0.5 = 50
            expect(result.harmony).toBe(50);
        });

        it('should be symmetric (connection > shadow)', () => {
            const stats: PsycheCoreStats = {
                clarity: 0,
                connection: 0.8,
                courage: 0,
                order: 0,
                shadow: 0.3,
            };
            const result = calcDerivedStats(stats);
            // 1 - abs(0.3 - 0.8) = 1 - 0.5 = 0.5 = 50
            expect(result.harmony).toBe(50);
        });
    });

    describe('integration tests with real profile data', () => {
        it('should calculate all stats for typical profile', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.72,
                courage: 0.45,
                connection: 0.88,
                order: 0.30,
                shadow: 0.15,
            };
            const result = calcDerivedStats(stats);

            // vitality = avg(0.72, 0.88) = 0.8 = 80
            expect(result.vitality).toBe(80);
            // willpower = avg(0.45, 0.30) = 0.375 = 38
            expect(result.willpower).toBe(38);
            // chaos = 0.15 = 15
            expect(result.chaos).toBe(15);
            // harmony = 1 - abs(0.15 - 0.88) = 1 - 0.73 = 0.27 = 27
            expect(result.harmony).toBe(27);
        });

        it('should handle balanced profile', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.5,
                courage: 0.5,
                connection: 0.5,
                order: 0.5,
                shadow: 0.5,
            };
            const result = calcDerivedStats(stats);

            expect(result.vitality).toBe(50);
            expect(result.willpower).toBe(50);
            expect(result.chaos).toBe(50);
            expect(result.harmony).toBe(100); // Perfect alignment
        });

        it('should handle extreme low profile', () => {
            const stats: PsycheCoreStats = {
                clarity: 0.1,
                courage: 0.05,
                connection: 0.2,
                order: 0.1,
                shadow: 0.9,
            };
            const result = calcDerivedStats(stats);

            // vitality = avg(0.1, 0.2) = 0.15 = 15
            expect(result.vitality).toBe(15);
            // willpower = avg(0.05, 0.1) = 0.075 = 8
            expect(result.willpower).toBe(8);
            // chaos = 0.9 = 90
            expect(result.chaos).toBe(90);
            // harmony = 1 - abs(0.9 - 0.2) = 1 - 0.7 = 0.3 = 30
            expect(result.harmony).toBe(30);
        });
    });
});
