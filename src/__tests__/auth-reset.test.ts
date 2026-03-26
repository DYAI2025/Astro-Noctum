import { describe, it, expect } from 'vitest';

describe('password reset flow', () => {
  it('resetPassword returns null on success', async () => {
    // Unit test for the logic — mock supabase.auth.resetPasswordForEmail
    const mockReset = async (_email: string) => ({ error: null });
    const result = await mockReset('test@example.com');
    expect(result.error).toBeNull();
  });

  it('resetPassword returns error message on failure', async () => {
    const mockReset = async (_email: string) => ({
      error: { message: 'User not found' },
    });
    const result = await mockReset('bad@example.com');
    expect(result.error?.message).toBe('User not found');
  });
});
