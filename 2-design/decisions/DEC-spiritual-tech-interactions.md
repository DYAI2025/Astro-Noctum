# DEC-spiritual-tech-interactions: Spiritual Tech Interaction Philosophy

**Status**: Active

**Category**: Design

**Scope**: system-wide (frontend, mobile)

**Source**: Design-Fitting Sprint S09

**Last updated**: 2026-03-31

## Context

Bazodiac needs a consistent interaction language that matches its cosmic/spiritual product identity without being clinical or generic. The "Spiritual Tech" philosophy defines how the UI feels — deliberate, revealing, tactile, and self-ironic.

## Decision

### Core Principles

1. **Deliberate** — Transitions are 300ms+ with ease-out curves. Nothing happens instantly. The UI moves like cosmic bodies: smooth, predictable, unhurried.
2. **Revealing** — Information discloses progressively. Accordions, fade-ins, expand panels. The user "discovers" rather than "scrolls."
3. **Tactile** — Every interaction has physical feedback: hover lifts cards, taps compress buttons, focus outlines glow.
4. **Self-Ironic** — Errors and empty states use spiritual metaphor with a wink. Not serious fortune-telling, not dry tech — cosmic comedy.

### Animation Timing

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| Card hover | `300ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Lift + shadow/glow |
| Modal enter | `300ms` | `ease-out` | Scale 0.95→1 + fade |
| Modal exit | `200ms` | `ease-in` | Scale 1→0.95 + fade |
| Progress fill | `1500ms` | `ease-out` | Bar fills, ring segments |
| Expand panel | `300ms` | `ease-out` | Accordion, "Warum?" panels |
| Button tap | `100ms` | `ease-in-out` | `scale(0.98)` press |
| Persona swap | `200ms` | `ease` | Fade-out → swap → fade-in |
| Page transition | `400ms` | `ease-out` | Route changes |

### Error Messages (Cosmic Comedy)

Errors use a structured object with spiritual metaphor and self-ironic tone:

```typescript
interface CosmicError {
  icon: string;       // lucide icon name
  title: string;      // German, metaphorical
  message: string;    // 1 sentence, self-ironic
  action: string;     // CTA text (collaborative, not technical)
}
```

**Tone guidelines:**
- Self-ironic: "Die Sterne haben gerade Pause" (The stars are on break)
- NOT serious: ~~"Ein schwerwiegender Fehler ist aufgetreten"~~
- NOT cringey: ~~"Oopsie! Die Planeten haben sich verirrt 🌟"~~
- Collaborative: "Erneut fragen" (Ask again), NOT "Wiederholen" (Retry)

**Examples:**

| Context | Title | Message | Action |
|---------|-------|---------|--------|
| API timeout | Kosmische Störung | Die Verbindung zum Atlas ist momentan unterbrochen. | Erneut fragen |
| BAFE unreachable | Stille im Kosmos | Die Berechnungen brauchen einen Moment Ruhe. | Nochmal versuchen |
| Gemini fail | Sprachlos | Selbst die Sterne suchen manchmal nach Worten. | Erneut anfragen |
| Empty state | Leere Karte | Hier entsteht noch etwas — gib uns einen Moment. | Aktualisieren |
| Auth expired | Sitzung beendet | Deine kosmische Verbindung ist eingeschlafen. | Neu verbinden |

### Loading States

- **Skeleton UI** for data-dependent sections (not spinners)
- Skeleton uses `--bg-card-elevated` with `animate-pulse`
- Duration hint: "Einen Moment..." text after 3 seconds

### Navigation

- **Mobile:** Top-down drawer menu (not side hamburger) — better thumb reach
- **Desktop:** Horizontal nav with active underline animation (left→right growth)
- **Active indicator:** Dark mode: gold underline. Bright mode: blue underline.
- **Max 5 primary nav items** (ATLAS, SIGNATUR, SKY, WOCHE, LEVI)

### Focus & Accessibility

- Focus outline: `2px solid var(--accent)` with `2px offset`
- Skip-to-content link for keyboard navigation
- All interactive elements reachable via Tab
- Touch targets ≥44px (see DEC-design-system-v2)

## Enforcement

### Trigger conditions

- When writing error handling UI (try/catch → user-facing message)
- When adding animations or transitions
- When designing loading states
- When adding navigation items

### Required patterns

- Transitions ≥300ms for spatial changes (position, size, opacity)
- Error states use `CosmicError` structure with German text
- Loading uses skeleton, not spinner
- Mobile nav uses drawer pattern

### Prohibited patterns

- `transition: all 0ms` or instant state changes for visible UI
- Generic English error text ("Something went wrong")
- Spinner/loader GIFs
- Serious/clinical error language
- More than 5 primary nav items
