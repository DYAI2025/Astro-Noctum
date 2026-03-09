import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contribute, getSnapshot } from '../contribute-client';

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

// Mock Static Detection to force API mode
vi.mock('../contribute-client', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        // We want to test the API logic, so we bypass static detection inside
        // However, since getClientMode etc are internal or exported, 
        // the easiest way is checking the environment.
        // The implementation uses: window, process.env.NEXT_PUBLIC_STATIC_MODE, file protocol
        // We will mock window location to be a non-static host.
    };
});

describe('Contribute Client (API Mode)', () => {

    beforeEach(() => {
        vi.resetAllMocks();
        // Setup environment to look like "Server Mode" (API)
        // define window if not defined (jsdom usually defines it)
        if (typeof window !== 'undefined') {
            Object.defineProperty(window, 'location', {
                writable: true,
                value: {
                    protocol: 'http:',
                    hostname: 'localhost',
                    href: 'http://localhost'
                }
            });
        }
        process.env.NEXT_PUBLIC_STATIC_MODE = 'false';
        
        globalFetch.mockResolvedValue({
            json: async () => ({ accepted: true, snapshot: {} }),
            ok: true
        });
    });

    it('POST /api/contribute sends userId in body', async () => {
        const mockEvent = { eventId: '123' } as any;
        const testUserId = 'test-user-123';

        await contribute(mockEvent, testUserId);

        expect(globalFetch).toHaveBeenCalledWith('/api/contribute', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(testUserId) // Should be in JSON body
        }));
        
        // Verify body structure specifically
        const callArgs = globalFetch.mock.calls[0];
        const bodyObj = JSON.parse(callArgs[1].body);
        expect(bodyObj.userId).toBe(testUserId);
    });

    it('GET /api/profile/snapshot sends userId in query params', async () => {
        const testUserId = 'test-user-123';

        await getSnapshot(testUserId);

        expect(globalFetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/profile/snapshot?userId=${testUserId}`)
        );
    });

    it('GET /api/profile/snapshot without userId uses default endpoint', async () => {
        await getSnapshot(undefined);

        expect(globalFetch).toHaveBeenCalledWith(
            '/api/profile/snapshot'
        );
    });
});
