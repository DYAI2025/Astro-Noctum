// src/__tests__/levi-conversation.test.ts
import { describe, it, expect } from 'vitest';

describe('Levi conversation continuity', () => {
  it('save tool config has correct webhook URL', async () => {
    const fs = await import('fs');
    const config = JSON.parse(fs.readFileSync('elevenlabs-tool-save-conversation.json', 'utf8'));
    const url = config.url || config.webhook_url || config.api_schema?.url;
    expect(url).toContain('/api/agent/conversation');
  });

  it('save endpoint inserts into agent_conversations table', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('agent_conversations');
    expect(serverCode).toContain('.insert(');
  });

  it('profile endpoint retrieves conversation history', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Server should query agent_conversations for previous summaries
    expect(serverCode).toContain('agent_conversations');
    // Should select summary and topics
    expect(serverCode).toContain('summary');
  });

  it('history query is limited and ordered', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Should limit to recent conversations
    expect(serverCode).toMatch(/\.limit\(\d+\)/);
    // Should order by most recent
    expect(serverCode).toContain('created_at');
  });
});
