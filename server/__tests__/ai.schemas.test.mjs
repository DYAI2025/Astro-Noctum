// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { InterpretSchema, AnalyzeConversationSchema } from '../schemas/ai.schemas.mjs';

describe('InterpretSchema', () => {
  it('accepts valid interpret request', () => {
    const result = InterpretSchema.safeParse({
      userId: 'user-abc',
      lang: 'de',
      data: { dayMaster: 'Wood', zodiac_sign: 'Aries' },
    });
    expect(result.success).toBe(true);
  });

  it('strips unknown keys silently', () => {
    const result = InterpretSchema.safeParse({
      userId: 'u', lang: 'de', data: {}, malicious: 'x',
    });
    expect(result.success).toBe(true);
    expect(result.data.malicious).toBeUndefined();
  });

  it('rejects oversized data payload', () => {
    const oversized = {};
    for (let i = 0; i < 200; i++) {
      oversized[`field${i}`] = 'x'.repeat(100);
    }
    const result = InterpretSchema.safeParse({
      userId: 'u', lang: 'de', data: oversized,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid lang enum', () => {
    const result = InterpretSchema.safeParse({
      userId: 'u', lang: 'fr', data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing data field', () => {
    const result = InterpretSchema.safeParse({ lang: 'de' });
    expect(result.success).toBe(false);
  });

  it('defaults lang to de when missing', () => {
    const result = InterpretSchema.safeParse({ data: {} });
    expect(result.success).toBe(true);
    expect(result.data.lang).toBe('de');
  });
});

describe('AnalyzeConversationSchema', () => {
  it('accepts valid conversation', () => {
    const result = AnalyzeConversationSchema.safeParse({
      userId: 'user-abc',
      text: 'A: hello\nB: hi',
      lang: 'de',
    });
    expect(result.success).toBe(true);
  });

  it('rejects conversation longer than 5000 chars', () => {
    const result = AnalyzeConversationSchema.safeParse({
      userId: 'u',
      text: 'x'.repeat(5001),
      lang: 'de',
    });
    expect(result.success).toBe(false);
  });

  it('strips null bytes from text', () => {
    const result = AnalyzeConversationSchema.safeParse({
      userId: 'u',
      text: 'hello\x00world',
      lang: 'de',
    });
    expect(result.success).toBe(true);
    expect(result.data.text).not.toContain('\x00');
  });
});
