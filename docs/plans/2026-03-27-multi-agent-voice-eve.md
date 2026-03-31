# Multi-Agent Voice Architecture: Eve Sprint Plan

## Context
- Branch: `feature/multi-agent-voice-eve`
- Goal: GOAL-multi-agent-voice
- Decision: DEC-multi-agent-voice
- All tasks in 3-code/tasks.md under "Multi-Agent Voice Architecture (Eve)"

## Phase 1: Database & Server Foundation

### WP-1.1: TASK-agent-db-migration
Create `supabase-migrations/20260327_multi_agent_voice.sql`:
```sql
ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'levi';
ALTER TABLE agent_conversations
  ADD CONSTRAINT chk_agent_type CHECK (agent_type IN ('levi', 'eve'));
ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_agent
  ON agent_conversations (user_id, agent_type);
```

### WP-1.2: TASK-agent-profile-endpoint
In `server.mjs`, update the `/api/profile/:userId` endpoint:
- Accept `?agent=levi|eve` query param (default: `levi`)
- When fetching from `agent_conversations`, add `.eq('agent_type', agentType)` to the Supabase query
- Return same astrological data regardless of agent — only conversation history is filtered

### WP-1.3: TASK-agent-save-endpoint
In `server.mjs`, update the conversation save endpoint:
- Accept `agent_type` in request body (validate against `['levi', 'eve']`)
- Include `agent_type` in the insert to `agent_conversations`
- Return 400 `{ error: 'invalid_agent_type' }` for unknown values
- Backward compat: default to `'levi'` if `agent_type` is omitted

### WP-1.4: TASK-agent-config-shared
Create `packages/shared/src/agents/config.ts`:
```typescript
export type AgentId = 'levi' | 'eve';

export interface AgentConfig {
  id: AgentId;
  name: string;
  envKey: string;
  persona: 'mentor' | 'provocateur';
  statusColor: { active: string; idle: string };
  accentColor: string;
  icon: string; // asset filename
  description: { de: string; en: string };
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'levi',
    name: 'Levi Bazi',
    envKey: 'VITE_ELEVENLABS_AGENT_ID',
    persona: 'mentor',
    statusColor: { active: 'rgb(52,211,153)', idle: 'rgb(139,105,20)' },
    accentColor: '#8B6914',
    icon: 'levi-symbol.svg',
    description: {
      de: 'Dein ruhiger Mentor. Levi führt dich mit Tiefe und Gelassenheit durch dein Chart.',
      en: 'Your calm mentor. Levi guides you through your chart with depth and composure.'
    }
  },
  {
    id: 'eve',
    name: 'Eve',
    envKey: 'VITE_ELEVENLABS_EVE_AGENT_ID',
    persona: 'provocateur',
    statusColor: { active: 'rgb(236,72,153)', idle: 'rgb(156,63,122)' },
    accentColor: '#9C3F7A',
    icon: 'eve-symbol.svg',
    description: {
      de: 'Direkt. Frech. Auf den Punkt. Eve sagt dir, was Sache ist — ohne Umwege.',
      en: 'Direct. Bold. To the point. Eve tells it like it is — no detours.'
    }
  }
];

export function getAgent(id: AgentId): AgentConfig {
  const agent = AGENTS.find(a => a.id === id);
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}
```

Also export from `packages/shared/src/index.ts`.

### WP-1.5: TASK-agent-env-vars
- Add `VITE_ELEVENLABS_EVE_AGENT_ID=` to `.env.example`
- No code changes needed — the env var is read dynamically from `AgentConfig.envKey`

## Phase 2: Frontend Refactor (Levi → Generic)

### WP-2.1: TASK-agent-provider
Create `src/contexts/AgentContext.tsx`:
- `AgentProvider` wraps children
- State: `activeAgent: AgentId | null`, `agentStates: Record<AgentId, { active: boolean; upgrading: boolean }>`
- Actions: `startAgent(id)`, `stopAgent(id)`, `setUpgrading(id, bool)`
- Import `AGENTS` from `@bazodiac/shared`

### WP-2.2: TASK-agent-section
Create `src/components/dashboard/AgentSection.tsx`:
- Props: `agent: AgentConfig`, `isPremium: boolean`, `userId: string`, `onStopAudio: () => void`, `onResumeAudio: () => void`, `sunSign: string`, `zodiacAnimal: string`, `dominantEl: string`
- Use `useAgent()` context for state
- Render: status dot (agent.statusColor), Badge (agent.name), description (agent.description[lang]), CTA button
- Premium: opens floating widget; Non-premium: triggers checkout
- Load ElevenLabs script once (shared across agents)
- Render ElevenLabs widget when active: `<elevenlabs-convai agent-id={agentId} dynamic-variables={...} />`
- Get agent ID from `import.meta.env[agent.envKey]`

### WP-2.3: TASK-agent-floating-widget
Create `src/components/AgentFloatingWidget.tsx`:
- Manages a floating overlay per agent
- Only one agent can be active at a time — starting agent B stops agent A
- Positioned fixed bottom-right
- Shows agent name + hang-up button

### WP-2.4: TASK-agent-dashboard-integration
In `src/components/Dashboard.tsx`:
- Replace `<DashboardLeviSection>` with:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
    {AGENTS.map(agent => (
      <AgentSection key={agent.id} agent={agent} {...commonProps} />
    ))}
  </div>
  ```
- Wrap with `<AgentProvider>`
- Remove all Levi-specific state from Dashboard

### WP-2.5: TASK-agent-premium-gate
In `AgentSection.tsx`:
- If `!isPremium`: show upgrade CTA button with Lock icon
- On click: trigger Stripe checkout (same as current DashboardLeviSection)
- Both agents gated identically

## Phase 3: Eve Integration & Polish

### WP-3.1: TASK-eve-agent-config
Already done in WP-1.4 (Eve entry in AGENTS array). Verify config renders correctly.

### WP-3.2: TASK-eve-tile-assets
Create `public/agents/levi-symbol.svg` and `public/agents/eve-symbol.svg`:
- Simple geometric symbols (not human portraits)
- Levi: calm/celestial (e.g. circle with inner star)
- Eve: bold/angular (e.g. diamond or lightning)
- SVG, 64x64 viewBox, obsidian/gold palette

### WP-3.3: TASK-eve-microcopy
Add to `src/i18n/translations.ts` under `dashboard.agent`:
```typescript
agent: {
  levi: {
    ready: 'Levi Bazi Bereit',
    active: 'Levi Bazi — Im Gespräch',
    readyDesc: 'Dein ruhiger Mentor. Levi führt dich mit Tiefe und Gelassenheit durch dein Chart.',
    activeDesc: 'Ambient-Musik pausiert. Sprich mit Levi über dein Chart.',
    callBtn: 'Call Levi',
    hangUpBtn: 'Auflegen',
  },
  eve: {
    ready: 'Eve Bereit',
    active: 'Eve — Im Gespräch',
    readyDesc: 'Direkt. Frech. Auf den Punkt. Eve sagt dir, was Sache ist — ohne Umwege.',
    activeDesc: 'Ambient-Musik pausiert. Eve hört zu.',
    callBtn: 'Call Eve',
    hangUpBtn: 'Auflegen',
  },
}
```

### WP-3.4: TASK-eve-coming-soon
In `AgentSection.tsx`:
- If `!import.meta.env[agent.envKey]` (env var missing), show a muted "Coming Soon" badge instead of the CTA button
- Don't crash — graceful degradation

### WP-3.5: TASK-eve-brand-safety-review
Create `docs/eve-brand-safety-checklist.md` with review criteria:
- No vulgar language as default
- No sexual objectification
- No aggressive boundary violations
- No demeaning address
- Must be distinguishable from Levi
- Mark as "review required before production"

## Phase 4: Testing & Verification

### WP-4.1: TASK-agent-section-tests
`src/__tests__/agent-section.test.tsx`:
- Test: renders two agent tiles from AGENTS config
- Test: premium user sees "Call" button, non-premium sees upgrade CTA
- Test: both agents visible simultaneously
- Test: clicking Eve CTA doesn't activate Levi

### WP-4.2: TASK-agent-persistence-tests
`src/__tests__/agent-persistence.test.ts`:
- Test: profile endpoint with `?agent=eve` filters correctly
- Test: save endpoint with `agent_type: 'eve'` persists correctly
- Test: omitting agent_type defaults to 'levi' (backward compat)
- Test: invalid agent_type returns 400

### WP-4.3: TASK-agent-extensibility-test
`src/__tests__/agent-extensibility.test.tsx`:
- Test: temporarily push a third agent to AGENTS, render Dashboard, verify 3 tiles appear

### WP-4.4: TASK-agent-levi-regression
`src/__tests__/agent-levi-regression.test.tsx`:
- Test: Levi tile renders with correct config values
- Test: Levi call/hangup cycle works through AgentProvider
- Test: Levi conversation save includes agent_type 'levi'
