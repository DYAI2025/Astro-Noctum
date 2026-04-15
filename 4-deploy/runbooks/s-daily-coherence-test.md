# Runbook: S-DAILY Coherence-First Dashboard — Manual Testing

## Overview

Verify all features delivered in Sprint S-DAILY: Kohärenzindex hero, Impact-derived planet cards, dashboard section order, /api/impact/active endpoint, /api/experience/daily v2 with include=["impact"], and premium gating.

## Prerequisites

- Production deployment on Railway (latest `main`) or local dev
- A registered user account with astro profile + soulprint data
- Desktop browser (Chrome/Firefox) + mobile viewport (375px via DevTools)
- Optional: a premium and a free-tier account (to verify gating)

## Quick Start

```bash
# Local verification
npm run dev              # Vite on :3000
PORT=3001 node server.mjs  # Express API on :3001
```

---

## Test Scenarios

### 1. Kohärenzindex Above the Fold

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 1.1 | Load dashboard on desktop (1280px) | Kohärenzindex ring (0-100) visible without scrolling | |
| 1.2 | Load dashboard on mobile (375px) | Kohärenzindex ring visible without scrolling | |
| 1.3 | Kohärenzindex label present | "Kohärenzindex" text visible alongside the number | |
| 1.4 | Contextualising title present | "Hohe/Mittlere/Niedrige Übereinstimmung" displayed | |
| 1.5 | Driver strip shows 4 pills | Geomagnetik, Solardruck, Transit-Aktivität, Tagesfeld | |
| 1.6 | Value is not static/zero | Ring shows a real computed value (not always 0 or always 50) | |

### 2. Impact-Derived Planet Cards

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 2.1 | Planet cards rendered from Impact data | Cards show only planets with active transit aspects (variable count, not always 6) | |
| 2.2 | Card shows planet name + symbol | e.g., ♂ Mars | |
| 2.3 | Card shows aspect type + orb with ° | e.g., "Konjunktion 1.2°" | |
| 2.4 | Card shows strength bar | Visual bar + percentage (e.g., 85%) | |
| 2.5 | Card shows BaZi resonance badge | Gleichklang / Nährung / Kontrolle / Neutral | |
| 2.6 | Card shows Wu-Xing element badge | Feuer / Wasser / Holz / Erde / Metall | |
| 2.7 | Card color follows resonance type | Blue for Gleichklang/Nährung, red for Kontrolle, gold for Neutral | |
| 2.8 | No active planets → empty state | "Heute keine starken Transit-Aspekte" message shown (no broken UI) | |

### 3. Dashboard Section Order

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 3.1 | Coherence Hero is first content block | KohaerenzHero renders above all other dashboard sections | |
| 3.2 | Active Influences is second | Planet cards appear directly below Kohärenzindex | |
| 3.3 | Planetarium is below daily content | BirthChartOrrery appears after Day Pulse, Vibes, Agents, Blueprint, Identity | |
| 3.4 | Planetarium is NOT removed | Orrery still renders and is functional when scrolled to | |

### 4. API Endpoint Verification

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 4.1 | POST /api/impact/active (auth) | Returns ACTIVE_IMPACTS_v1 JSON with harmony_index, active_planets[], resonance_badges[] | |
| 4.2 | Response: harmony_index range | Value is 0–100 integer | |
| 4.3 | Response: active_planets orb filter | All planets have orb ≤ 8° (conjunction/opposition), ≤ 6° (trine/square), ≤ 4° (sextile) | |
| 4.4 | Response: no LLM text fields | No `fusion.synthesis`, `fusion.action`, or `narrative` keys in response | |
| 4.5 | Cache: second call within 15 min | Response has `meta.cached: true` | |
| 4.6 | POST /api/experience/daily without include | Response identical to v1 (no impact block) | |
| 4.7 | POST /api/experience/daily with include=["impact"] | Response includes both `fusion` and `impact` blocks | |

### 5. Premium Gating (with include=["impact"])

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 5.1 | Premium user: fusion.action present | Contains a specific recommendation referencing active planets | |
| 5.2 | Free user: fusion.action is teaser | "Deine persönliche Tagesempfehlung ist Teil von Bazodiac Premium." | |
| 5.3 | Free user: fusion.action_locked flag | `action_locked: true` in response | |
| 5.4 | Premium user: impact.resonance_badges populated | Non-empty array with transit/weather/sektor badges | |
| 5.5 | Free user: impact.resonance_badges empty | Empty array `[]` | |

### 6. Backward Compatibility

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 6.1 | Existing DashboardTagesEnergie | Still renders correctly (not broken by new sections) | |
| 6.2 | Existing CosmicWeatherCard | Still renders when Kp data available | |
| 6.3 | Existing Agents section | Levi + Eve tiles still visible and functional | |
| 6.4 | Existing Blueprint section | Collapsed accordion still opens/closes | |

---

## API Test Commands

```bash
# Get auth token (replace with your session token)
TOKEN="your-supabase-jwt"

# Test /api/impact/active
curl -s -X POST http://localhost:3001/api/impact/active \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Test /api/experience/daily v1 (no include)
curl -s -X POST http://localhost:3001/api/experience/daily \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"birth":{"date":"1990-07-15","time":"14:30:00","lat":53.55,"lon":9.99,"tz":"Europe/Berlin"}}' | jq 'keys'

# Test /api/experience/daily v2 (with include=["impact"])
curl -s -X POST http://localhost:3001/api/experience/daily \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"birth":{"date":"1990-07-15","time":"14:30:00","lat":53.55,"lon":9.99,"tz":"Europe/Berlin"},"include":["impact"]}' | jq '{has_impact: (.impact != null), has_fusion: (.fusion != null)}'
```

---

## Automated Test Coverage

| Area | Test file | Tests |
|------|-----------|-------|
| BaZi resonance + schema | `impact-active.test.ts` | 16 |
| Daily v2 contract | `experience-daily-v2.test.ts` | 12 |
| Zod schema validation | `use-active-impacts.test.ts` | 13 |
| KohaerenzHero rendering | `kohaerenz-hero.test.tsx` | 9 |
| Impact planet cards | `impact-planet-cards.test.tsx` | 9 |
| Dashboard section order | `dashboard-section-order.test.tsx` | 6 |
| **Total** | | **65** |

Run: `npx vitest run` — expect 1626+ green, 0 failures.
