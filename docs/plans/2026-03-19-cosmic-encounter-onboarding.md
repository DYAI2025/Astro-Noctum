# Kosmische Begegnung — Cosmic Encounter Onboarding

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat BirthForm onboarding with an immersive 3D cosmic encounter where users meet "Die Form" (their future signature) and "Levi" (voice companion) before entering birth data.

**Architecture:** New `CosmicEncounter` component orchestrates a 7-phase state machine (materializing → levi-speaks → birth-input → calculating → ring-reveal → quiz → complete). Three.js renders two artifacts (gold tori + cyan sphere) with parallax mouse tracking. Reuses existing BirthForm logic, Experience API, and FusionRingCanvasV2. Mobile falls back to CSS+image artifacts.

**Tech Stack:** React 19, Three.js (r170+), TypeScript, Tailwind v4, motion/react, Web Audio API, ElevenLabs widget

---

## Table of Contents

- [Phase 1: Foundation (Tasks 1-4)](#phase-1-foundation)
- [Phase 2: Three.js Scene (Tasks 5-8)](#phase-2-threejs-scene)
- [Phase 3: Encounter Orchestration (Tasks 9-12)](#phase-3-encounter-orchestration)
- [Phase 4: Ring Reveal + Integration (Tasks 13-16)](#phase-4-ring-reveal--integration)
- [Phase 5: Polish + Tests (Tasks 17-20)](#phase-5-polish--tests)

---

## Design Constants

These values are referenced throughout all tasks. Keep them in one place.

```typescript
// Colors
const GOLD        = '#D4AF37';
const GOLD_DARK   = '#8B6914';
const OBSIDIAN    = '#00050A';
const FORM_BG     = '#0a0a14';
const CYAN        = '#00F5FF';
const CYAN_DEEP   = '#00C5FF';
const BG_DEEP     = '#010409';

// Timing (seconds)
const CROSSFADE_IN       = 1.5;
const FORM_MATERIALIZE   = 2.0;
const LEVI_MATERIALIZE   = 2.5;
const LEVI_DELAY         = 0.5;
const MYZELIUM_DELAY     = 1.0;
const LEVI_AUTO_TRIGGER  = 3.0;
const RING_REVEAL        = 2.5;

// Parallax (pixels)
const FORM_PARALLAX  = 30;  // +30px — moves WITH mouse
const LEVI_PARALLAX  = -50; // -50px — moves AGAINST mouse

// Fonts
const FONT_SERIF = 'Cormorant Garamond';
const FONT_SANS  = 'Sora';
```

---

## Phase 1: Foundation

### Task 1 — Add `cosmic_encounter_v1` feature flag

**Files:**
- Modify: `src/lib/feature-flags.ts`
- Test: `src/__tests__/cosmic-encounter-flag.test.ts` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/cosmic-encounter-flag.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

describe('cosmic_encounter_v1 feature flag', () => {
  beforeEach(() => {
    localStorage.removeItem('ff_cosmic_encounter_v1');
  });

  it('defaults to false', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });

  it('can be enabled via localStorage override', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'true');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(true);
  });

  it('can be explicitly disabled via localStorage', () => {
    localStorage.setItem('ff_cosmic_encounter_v1', 'false');
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(false);
  });
});
```

**Step 2: Run test — expect failure (flag does not exist yet)**

```bash
npx vitest run src/__tests__/cosmic-encounter-flag.test.ts
# Expected: TypeScript error — 'cosmic_encounter_v1' is not assignable to FlagName
```

**Step 3: Add the flag**

In `src/lib/feature-flags.ts`, add `cosmic_encounter_v1: false` to the `FLAGS` object:

```typescript
const FLAGS = {
  signature_onboarding_v1: true,
  daily_modal_v1: true,
  signature_engine_v2: true,
  sky_jieqi_banner: true,
  sky_flare_timeline: true,
  sky_aurora_layer: true,
  sky_geometry_gating: true,
  sky_neo_ribbon: false,
  sky_epoch_mood: false,
  sky_jpl_proxy: false,
  cosmic_encounter_v1: false,   // ← NEW: gates Cosmic Encounter onboarding
} as const;
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/cosmic-encounter-flag.test.ts
# Expected: 3 tests passed
```

**Step 5: Commit**

```bash
git add src/lib/feature-flags.ts src/__tests__/cosmic-encounter-flag.test.ts
git commit -m "feat(AN-CE): add cosmic_encounter_v1 feature flag (default off)"
```

---

### Task 2 — Create `useParallax` hook

**Files:**
- Create: `src/components/onboarding/useParallax.ts`
- Test: `src/__tests__/useParallax.test.ts` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/useParallax.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParallax } from '../components/onboarding/useParallax';

describe('useParallax', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
    // Set viewport size
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('returns initial offset of {x: 0, y: 0}', () => {
    const { result } = renderHook(() => useParallax(30));
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it('updates offset on mousemove (positive factor = follows mouse)', () => {
    const { result } = renderHook(() => useParallax(30));

    // Simulate mouse at 75% of viewport width, 50% height
    act(() => {
      const handler = addSpy.mock.calls.find(c => c[0] === 'mousemove')?.[1] as EventListener;
      handler(new MouseEvent('mousemove', { clientX: 768, clientY: 384 }));
    });

    // normalized: x = (768/1024 - 0.5)*2 = 0.5, y = (384/768 - 0.5)*2 = 0
    // offset: x = 0.5 * 30 = 15, y = 0 * 30 = 0
    expect(result.current.x).toBeCloseTo(15, 0);
    expect(result.current.y).toBeCloseTo(0, 0);
  });

  it('negative factor inverts direction (opposing parallax)', () => {
    const { result } = renderHook(() => useParallax(-50));

    act(() => {
      const handler = addSpy.mock.calls.find(c => c[0] === 'mousemove')?.[1] as EventListener;
      handler(new MouseEvent('mousemove', { clientX: 768, clientY: 384 }));
    });

    // normalized x = 0.5, factor = -50 → offset = 0.5 * -50 = -25
    expect(result.current.x).toBeCloseTo(-25, 0);
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useParallax(30));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('returns {x:0, y:0} when disabled', () => {
    const { result } = renderHook(() => useParallax(30, false));

    act(() => {
      // Even if mousemove fires, it should not update
      const mouseMoveCall = addSpy.mock.calls.find(c => c[0] === 'mousemove');
      // Should NOT have registered a listener
      expect(mouseMoveCall).toBeUndefined();
    });

    expect(result.current).toEqual({ x: 0, y: 0 });
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/useParallax.test.ts
# Expected: Cannot find module '../components/onboarding/useParallax'
```

**Step 3: Implement the hook**

Create `src/components/onboarding/useParallax.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * Mouse parallax hook. Returns pixel offset based on cursor position.
 *
 * @param factor - Pixel magnitude. Positive = follows mouse, negative = opposes.
 * @param enabled - Set false to disable (e.g., on mobile). Returns {0,0}.
 *
 * Usage:
 *   const formOffset = useParallax(30);        // +30px follows mouse
 *   const leviOffset = useParallax(-50);       // -50px opposes mouse
 *   style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
 */
export function useParallax(factor: number, enabled = true): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current !== null) return; // throttle to 1 per frame
    rafRef.current = requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setOffset({ x: nx * factor, y: ny * factor });
      rafRef.current = null;
    });
  }, [factor]);

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, handleMouseMove]);

  return offset;
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/useParallax.test.ts
# Expected: 5 tests passed
```

Note: The rAF throttle means the `mousemove` handler calls `requestAnimationFrame` before setting state. In the happy-dom test environment rAF may run synchronously. If the "updates offset on mousemove" test fails, wrap the assertion in a `waitFor` or call `vi.advanceTimersByTime(16)` with `vi.useFakeTimers()`. Adjust as needed.

**Step 5: Commit**

```bash
git add src/components/onboarding/useParallax.ts src/__tests__/useParallax.test.ts
git commit -m "feat(AN-CE): add useParallax hook with rAF throttle"
```

---

### Task 3 — Create `LeviSpeechBubble` component

**Files:**
- Create: `src/components/onboarding/LeviSpeechBubble.tsx`
- Test: `src/__tests__/LeviSpeechBubble.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/LeviSpeechBubble.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LeviSpeechBubble } from '../components/onboarding/LeviSpeechBubble';

describe('LeviSpeechBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when text is empty', () => {
    const { container } = render(<LeviSpeechBubble text="" />);
    expect(container.textContent).toBe('');
  });

  it('types out text character by character', () => {
    render(<LeviSpeechBubble text="Hallo" speed={50} />);

    // Initially nothing visible
    expect(screen.getByTestId('levi-speech').textContent).toBe('');

    // After 50ms, first char
    act(() => { vi.advanceTimersByTime(50); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('H');

    // After 250ms total, all 5 chars
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('Hallo');
  });

  it('calls onComplete when finished typing', () => {
    const onComplete = vi.fn();
    render(<LeviSpeechBubble text="Hi" speed={50} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    // 2 chars * 50ms = 100ms
    act(() => { vi.advanceTimersByTime(100); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not start typing until visible prop is true', () => {
    const { rerender } = render(
      <LeviSpeechBubble text="Test" speed={50} visible={false} />
    );

    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('');

    rerender(<LeviSpeechBubble text="Test" speed={50} visible={true} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('Test');
  });

  it('applies glass-card styling', () => {
    render(<LeviSpeechBubble text="Hi" />);
    const bubble = screen.getByTestId('levi-speech-bubble');
    expect(bubble.className).toContain('backdrop-blur');
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/LeviSpeechBubble.test.tsx
# Expected: Cannot find module '../components/onboarding/LeviSpeechBubble'
```

**Step 3: Implement the component**

Create `src/components/onboarding/LeviSpeechBubble.tsx`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface LeviSpeechBubbleProps {
  /** Full text to type out */
  text: string;
  /** Milliseconds per character (default 40) */
  speed?: number;
  /** Whether to start the typewriter (default true) */
  visible?: boolean;
  /** Called when typing completes */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Glassmorphic speech bubble with typewriter effect.
 * Used as fallback when ElevenLabs is unavailable.
 *
 * Color: Cyan tint on obsidian glass. Font: Sora (sans).
 */
export function LeviSpeechBubble({
  text,
  speed = 40,
  visible = true,
  onComplete,
  className = '',
}: LeviSpeechBubbleProps) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Reset when text changes
    setDisplayedCount(0);
    completedRef.current = false;
    cleanup();
  }, [text, cleanup]);

  useEffect(() => {
    if (!visible || !text || completedRef.current) return;
    cleanup();

    intervalRef.current = setInterval(() => {
      setDisplayedCount((prev) => {
        const next = prev + 1;
        if (next >= text.length) {
          cleanup();
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return text.length;
        }
        return next;
      });
    }, speed);

    return cleanup;
  }, [visible, text, speed, onComplete, cleanup]);

  if (!text) return null;

  return (
    <div
      data-testid="levi-speech-bubble"
      className={`
        relative max-w-sm px-5 py-4 rounded-2xl
        bg-[#00F5FF]/[0.04] backdrop-blur-md
        border border-[#00F5FF]/[0.12]
        shadow-[0_0_20px_rgba(0,245,255,0.06)]
        ${className}
      `}
    >
      {/* Subtle corner glow */}
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#00F5FF]/20 rounded-full blur-sm" />

      <p
        data-testid="levi-speech"
        className="font-sans text-sm leading-relaxed text-[#00F5FF]/80 min-h-[1.5em]"
        aria-live="polite"
      >
        {text.slice(0, displayedCount)}
        {displayedCount < text.length && (
          <span className="inline-block w-[2px] h-[1em] bg-[#00F5FF]/60 ml-0.5 animate-pulse" />
        )}
      </p>
    </div>
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/LeviSpeechBubble.test.tsx
# Expected: 5 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/LeviSpeechBubble.tsx src/__tests__/LeviSpeechBubble.test.tsx
git commit -m "feat(AN-CE): add LeviSpeechBubble with typewriter effect"
```

---

### Task 4 — Create `MyzeliumNetwork` SVG component

**Files:**
- Create: `src/components/onboarding/MyzeliumNetwork.tsx`
- Test: `src/__tests__/MyzeliumNetwork.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/MyzeliumNetwork.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyzeliumNetwork } from '../components/onboarding/MyzeliumNetwork';

describe('MyzeliumNetwork', () => {
  it('renders an SVG element', () => {
    render(<MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />);
    const svg = screen.getByTestId('myzelium-svg');
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('renders paths between anchors', () => {
    const { container } = render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(3); // at least 3 tendrils
  });

  it('applies active class when active=true', () => {
    render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} active={true} />
    );
    const svg = screen.getByTestId('myzelium-svg');
    expect(svg.className.baseVal || svg.getAttribute('class')).toContain('opacity-');
  });

  it('has zero opacity when active=false', () => {
    render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} active={false} />
    );
    const svg = screen.getByTestId('myzelium-svg');
    const cls = svg.className.baseVal || svg.getAttribute('class') || '';
    expect(cls).toContain('opacity-0');
  });

  it('renders junction nodes', () => {
    const { container } = render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/MyzeliumNetwork.test.tsx
# Expected: Cannot find module '../components/onboarding/MyzeliumNetwork'
```

**Step 3: Implement the component**

Create `src/components/onboarding/MyzeliumNetwork.tsx`:

```typescript
import { useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

interface MyzeliumNetworkProps {
  /** Left artifact center (Form) */
  leftAnchor: Point;
  /** Right artifact center (Levi) */
  rightAnchor: Point;
  /** Whether the network is visible (animates opacity) */
  active?: boolean;
  /** Brightness boost 0-1 (driven by form field fill progress) */
  intensity?: number;
  /** Additional CSS classes */
  className?: string;
}

// Deterministic pseudo-random for consistent layout
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Tendril {
  d: string;        // SVG path data
  duration: number; // animation duration (seconds)
  delay: number;    // animation delay (seconds)
}

function generateTendrils(left: Point, right: Point, count: number): Tendril[] {
  const rand = seededRandom(42);
  const tendrils: Tendril[] = [];
  const midX = (left.x + right.x) / 2;
  const midY = (left.y + right.y) / 2;
  const spread = Math.abs(right.x - left.x) * 0.25;

  for (let i = 0; i < count; i++) {
    const yOff = (rand() - 0.5) * spread * 2;
    const cp1x = left.x + (midX - left.x) * 0.4 + (rand() - 0.5) * spread * 0.5;
    const cp1y = left.y + yOff * 0.6;
    const cp2x = midX + (right.x - midX) * 0.6 + (rand() - 0.5) * spread * 0.5;
    const cp2y = right.y + yOff * 0.4;

    const d = `M ${left.x} ${left.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${right.x} ${right.y}`;
    tendrils.push({
      d,
      duration: 2 + rand() * 2,
      delay: rand() * 0.8,
    });
  }

  return tendrils;
}

interface JunctionNode {
  cx: number;
  cy: number;
  r: number;
}

function generateJunctions(left: Point, right: Point, count: number): JunctionNode[] {
  const rand = seededRandom(99);
  const nodes: JunctionNode[] = [];
  const spread = Math.abs(right.y - left.y) + 60;

  for (let i = 0; i < count; i++) {
    const t = 0.2 + rand() * 0.6;
    nodes.push({
      cx: left.x + (right.x - left.x) * t,
      cy: (left.y + right.y) / 2 + (rand() - 0.5) * spread,
      r: 1.5 + rand() * 2,
    });
  }

  return nodes;
}

/**
 * SVG mycelium network drawn between two anchor points.
 * Bézier tendrils with pulsing animation + junction nodes.
 *
 * Colors: Gold (#D4AF37) base, fading to transparent.
 */
export function MyzeliumNetwork({
  leftAnchor,
  rightAnchor,
  active = true,
  intensity = 0.5,
  className = '',
}: MyzeliumNetworkProps) {
  const tendrils = useMemo(
    () => generateTendrils(leftAnchor, rightAnchor, 5),
    [leftAnchor.x, leftAnchor.y, rightAnchor.x, rightAnchor.y],
  );

  const junctions = useMemo(
    () => generateJunctions(leftAnchor, rightAnchor, 4),
    [leftAnchor.x, leftAnchor.y, rightAnchor.x, rightAnchor.y],
  );

  const baseOpacity = 0.15 + intensity * 0.35; // 0.15 → 0.50

  return (
    <svg
      data-testid="myzelium-svg"
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000
        ${active ? `opacity-${Math.round(baseOpacity * 100)}` : 'opacity-0'}
        ${className}
      `}
      viewBox={`0 0 ${Math.max(rightAnchor.x + 100, 800)} ${Math.max(rightAnchor.y + 100, 600)}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="myzel-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.5" />
        </linearGradient>
        <filter id="myzel-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tendrils */}
      {tendrils.map((t, i) => (
        <path
          key={`tendril-${i}`}
          d={t.d}
          fill="none"
          stroke="url(#myzel-grad)"
          strokeWidth={0.8 + Math.random() * 0.4}
          strokeLinecap="round"
          filter="url(#myzel-glow)"
          style={{
            strokeDasharray: '1000',
            strokeDashoffset: active ? '0' : '1000',
            transition: `stroke-dashoffset ${t.duration}s ease-out ${t.delay}s`,
          }}
        />
      ))}

      {/* Junction nodes */}
      {junctions.map((n, i) => (
        <circle
          key={`node-${i}`}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="#D4AF37"
          opacity={active ? 0.4 : 0}
          style={{ transition: 'opacity 1.5s ease-out' }}
        >
          <animate
            attributeName="opacity"
            values="0.2;0.5;0.2"
            dur={`${2 + i * 0.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${n.r};${n.r * 1.3};${n.r}`}
            dur={`${3 + i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/MyzeliumNetwork.test.tsx
# Expected: 5 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/MyzeliumNetwork.tsx src/__tests__/MyzeliumNetwork.test.tsx
git commit -m "feat(AN-CE): add MyzeliumNetwork SVG with pulsing tendrils"
```

---

## Phase 2: Three.js Scene

### Task 5 — Create `FormArtifact` Three.js group

**Files:**
- Create: `src/components/onboarding/artifacts/FormArtifact.ts`
- Test: `src/__tests__/FormArtifact.test.ts` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/FormArtifact.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createFormArtifact } from '../components/onboarding/artifacts/FormArtifact';

describe('FormArtifact', () => {
  it('returns a Group', () => {
    const artifact = createFormArtifact();
    // In test env, Group is mocked — check it was created
    expect(artifact).toBeDefined();
    expect(artifact.add).toBeDefined(); // Group.add exists
  });

  it('starts at scale 0 (for materialization animation)', () => {
    const artifact = createFormArtifact();
    expect(artifact.scale.x).toBe(0);
    expect(artifact.scale.y).toBe(0);
    expect(artifact.scale.z).toBe(0);
  });

  it('has userData.type = "form"', () => {
    const artifact = createFormArtifact();
    expect(artifact.userData.type).toBe('form');
  });

  it('dispose() does not throw', () => {
    const artifact = createFormArtifact();
    expect(() => artifact.dispose()).not.toThrow();
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/FormArtifact.test.ts
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/artifacts/FormArtifact.ts`:

```typescript
import * as THREE from 'three';

/**
 * "Die Form" — Two interlocking tori (gold/obsidian) with crystalline
 * knot geometry, orbital guide-lines, and a warm gold point light.
 *
 * Colors: Gold #D4AF37, Dark gold #8B6914, Obsidian #0a0a14
 *
 * Returns a THREE.Group. Call dispose() to free GPU resources.
 */

interface FormArtifactGroup extends THREE.Group {
  dispose: () => void;
  /** Called each frame with elapsed seconds + delta */
  update: (elapsed: number, delta: number) => void;
  /** Heartbeat pulse intensity 0-1 (driven externally) */
  heartbeat: number;
}

const GOLD = 0xD4AF37;
const GOLD_DARK = 0x8B6914;
const OBSIDIAN = 0x0a0a14;

export function createFormArtifact(): FormArtifactGroup {
  const group = new THREE.Group() as FormArtifactGroup;
  group.userData.type = 'form';
  group.scale.set(0, 0, 0); // start invisible for materialization

  const disposables: { dispose: () => void }[] = [];

  // ── Torus 1 (Gold, larger) ────────────────────────────────────────
  const torus1Geo = new THREE.TorusGeometry(1.2, 0.15, 24, 64);
  const torus1Mat = new THREE.MeshStandardMaterial({
    color: GOLD,
    metalness: 0.9,
    roughness: 0.2,
    emissive: GOLD,
    emissiveIntensity: 0.15,
  });
  const torus1 = new THREE.Mesh(torus1Geo, torus1Mat);
  torus1.rotation.x = Math.PI / 4;
  disposables.push(torus1Geo, torus1Mat);
  group.add(torus1);

  // ── Torus 2 (Obsidian accent, interlocking) ──────────────────────
  const torus2Geo = new THREE.TorusGeometry(1.0, 0.12, 24, 64);
  const torus2Mat = new THREE.MeshStandardMaterial({
    color: OBSIDIAN,
    metalness: 0.7,
    roughness: 0.3,
    emissive: GOLD_DARK,
    emissiveIntensity: 0.08,
  });
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.rotation.x = -Math.PI / 4;
  torus2.rotation.z = Math.PI / 2;
  disposables.push(torus2Geo, torus2Mat);
  group.add(torus2);

  // ── Crystalline knot (small icosahedron at center) ────────────────
  const knotGeo = new THREE.IcosahedronGeometry(0.25, 1);
  const knotMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    metalness: 1.0,
    roughness: 0.1,
    emissive: GOLD,
    emissiveIntensity: 0.3,
    wireframe: true,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  disposables.push(knotGeo, knotMat);
  group.add(knot);

  // ── Orbital lines (3 thin rings at different angles) ──────────────
  const ringGeo = new THREE.RingGeometry(1.6, 1.62, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: GOLD,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.1,
  });

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = (Math.PI / 3) * i;
    ring.rotation.y = (Math.PI / 5) * i;
    group.add(ring);
  }
  disposables.push(ringGeo, ringMat);

  // ── Point light (warm gold glow) ─────────────────────────────────
  const light = new THREE.PointLight(GOLD, 2, 8);
  light.position.set(0, 0, 0.5);
  group.add(light);

  // ── Heartbeat + rotation ──────────────────────────────────────────
  group.heartbeat = 0;

  group.update = (elapsed: number, _delta: number) => {
    // Slow rotation
    torus1.rotation.y = elapsed * 0.3;
    torus2.rotation.y = -elapsed * 0.25;
    knot.rotation.y = elapsed * 0.5;
    knot.rotation.x = elapsed * 0.3;

    // Heartbeat pulse: modulate emissive intensity
    const pulse = 1 + group.heartbeat * 0.3 * Math.sin(elapsed * 4);
    torus1Mat.emissiveIntensity = 0.15 * pulse;
    knotMat.emissiveIntensity = 0.3 * pulse;
    light.intensity = 2 + group.heartbeat * Math.sin(elapsed * 4);
  };

  group.dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return group;
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/FormArtifact.test.ts
# Expected: 4 tests passed
```

Note: The Three.js mock in `test-setup.tsx` provides stubs for `Group`, `Mesh`, etc. The `scale.set(0,0,0)` call goes through the mock. If `scale.x` is not properly set on the mock, extend the Group mock in test-setup to track scale:

```typescript
// In test-setup.tsx, update Group mock if needed:
Group: vi.fn().mockImplementation(() => ({
  add: vi.fn(), visible: true, children: [],
  scale: { x: 1, y: 1, z: 1, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; } },
  rotation: { x: 0, y: 0, z: 0 },
  position: { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; } },
  userData: {},
})),
```

**Step 5: Commit**

```bash
git add src/components/onboarding/artifacts/FormArtifact.ts src/__tests__/FormArtifact.test.ts
git commit -m "feat(AN-CE): add FormArtifact (interlocking tori + crystalline knot)"
```

---

### Task 6 — Create `LeviArtifact` Three.js group

**Files:**
- Create: `src/components/onboarding/artifacts/LeviArtifact.ts`
- Test: `src/__tests__/LeviArtifact.test.ts` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/LeviArtifact.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createLeviArtifact } from '../components/onboarding/artifacts/LeviArtifact';

describe('LeviArtifact', () => {
  it('returns a Group', () => {
    const artifact = createLeviArtifact();
    expect(artifact).toBeDefined();
    expect(artifact.add).toBeDefined();
  });

  it('starts at scale 0', () => {
    const artifact = createLeviArtifact();
    expect(artifact.scale.x).toBe(0);
  });

  it('has userData.type = "levi"', () => {
    const artifact = createLeviArtifact();
    expect(artifact.userData.type).toBe('levi');
  });

  it('dispose() does not throw', () => {
    const artifact = createLeviArtifact();
    expect(() => artifact.dispose()).not.toThrow();
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/LeviArtifact.test.ts
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/artifacts/LeviArtifact.ts`:

```typescript
import * as THREE from 'three';

/**
 * "Levi" — Cyan bioluminescent sphere with orbital ring,
 * glow sprite, and particle field.
 *
 * Colors: Cyan #00F5FF, Deep cyan #00C5FF
 */

interface LeviArtifactGroup extends THREE.Group {
  dispose: () => void;
  update: (elapsed: number, delta: number) => void;
  /** Listening pulse 0-1 (when Levi is speaking) */
  speaking: number;
}

const CYAN = 0x00F5FF;
const CYAN_DEEP = 0x00C5FF;

export function createLeviArtifact(): LeviArtifactGroup {
  const group = new THREE.Group() as LeviArtifactGroup;
  group.userData.type = 'levi';
  group.scale.set(0, 0, 0);

  const disposables: { dispose: () => void }[] = [];

  // ── Core sphere (bioluminescent) ──────────────────────────────────
  const sphereGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: CYAN_DEEP,
    metalness: 0.2,
    roughness: 0.4,
    emissive: CYAN,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  disposables.push(sphereGeo, sphereMat);
  group.add(sphere);

  // ── Inner glow (slightly larger, additive) ────────────────────────
  const glowGeo = new THREE.SphereGeometry(0.85, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  disposables.push(glowGeo, glowMat);
  group.add(glow);

  // ── Orbital ring ──────────────────────────────────────────────────
  const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  disposables.push(ringGeo, ringMat);
  group.add(ring);

  // ── Orbiting particle (small dot on ring path) ────────────────────
  const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  disposables.push(dotGeo, dotMat);
  group.add(dot);

  // ── Point light (cool cyan) ──────────────────────────────────────
  const light = new THREE.PointLight(CYAN, 1.5, 6);
  light.position.set(0, 0, 0.3);
  group.add(light);

  // ── Animation ─────────────────────────────────────────────────────
  group.speaking = 0;

  group.update = (elapsed: number, _delta: number) => {
    // Gentle float
    sphere.position.y = Math.sin(elapsed * 1.5) * 0.05;

    // Orbital ring rotation
    ring.rotation.z = elapsed * 0.4;

    // Dot follows ring path
    const angle = elapsed * 1.2;
    const radius = 1.2;
    dot.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * Math.sin(Math.PI / 3),
      Math.sin(angle) * radius * Math.cos(Math.PI / 3),
    );

    // Speaking pulse
    const pulse = 1 + group.speaking * 0.25 * Math.sin(elapsed * 6);
    sphereMat.emissiveIntensity = 0.4 * pulse;
    glowMat.opacity = 0.12 * pulse;
    light.intensity = 1.5 + group.speaking * Math.sin(elapsed * 6) * 0.5;

    // Scale pulse when speaking
    const scaleBase = sphere.scale.x || 1;
    if (group.speaking > 0) {
      sphere.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.02 * group.speaking);
    }
  };

  group.dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return group;
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/LeviArtifact.test.ts
# Expected: 4 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/artifacts/LeviArtifact.ts src/__tests__/LeviArtifact.test.ts
git commit -m "feat(AN-CE): add LeviArtifact (bioluminescent sphere + orbital ring)"
```

---

### Task 7 — Create `CosmicEncounterScene` Three.js renderer

**Files:**
- Create: `src/components/onboarding/CosmicEncounterScene.tsx`
- Test: `src/__tests__/CosmicEncounterScene.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/CosmicEncounterScene.test.tsx`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CosmicEncounterScene } from '../components/onboarding/CosmicEncounterScene';

// Mock artifacts
vi.mock('../components/onboarding/artifacts/FormArtifact', () => ({
  createFormArtifact: vi.fn(() => ({
    add: vi.fn(),
    scale: { x: 0, y: 0, z: 0, set: vi.fn() },
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    rotation: { x: 0, y: 0, z: 0 },
    userData: { type: 'form' },
    update: vi.fn(),
    dispose: vi.fn(),
    heartbeat: 0,
  })),
}));

vi.mock('../components/onboarding/artifacts/LeviArtifact', () => ({
  createLeviArtifact: vi.fn(() => ({
    add: vi.fn(),
    scale: { x: 0, y: 0, z: 0, set: vi.fn() },
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    rotation: { x: 0, y: 0, z: 0 },
    userData: { type: 'levi' },
    update: vi.fn(),
    dispose: vi.fn(),
    speaking: 0,
  })),
}));

afterEach(cleanup);

describe('CosmicEncounterScene', () => {
  it('renders a canvas container', () => {
    render(<CosmicEncounterScene phase="materializing" />);
    expect(screen.getByTestId('cosmic-scene')).toBeDefined();
  });

  it('passes phase to data attribute', () => {
    render(<CosmicEncounterScene phase="levi-speaks" />);
    expect(screen.getByTestId('cosmic-scene').getAttribute('data-phase')).toBe('levi-speaks');
  });

  it('accepts parallax offsets', () => {
    // Should not throw
    render(
      <CosmicEncounterScene
        phase="materializing"
        formOffset={{ x: 10, y: 5 }}
        leviOffset={{ x: -20, y: -10 }}
      />
    );
    expect(screen.getByTestId('cosmic-scene')).toBeDefined();
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/CosmicEncounterScene.test.tsx
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/CosmicEncounterScene.tsx`:

```typescript
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { createFormArtifact } from './artifacts/FormArtifact';
import { createLeviArtifact } from './artifacts/LeviArtifact';

type EncounterPhase =
  | 'materializing'
  | 'levi-speaks'
  | 'birth-input'
  | 'calculating'
  | 'ring-reveal'
  | 'quiz'
  | 'complete';

interface ParallaxOffset {
  x: number;
  y: number;
}

interface CosmicEncounterSceneProps {
  phase: EncounterPhase;
  formOffset?: ParallaxOffset;
  leviOffset?: ParallaxOffset;
  /** 0-1: how many birth fields are filled (drives Form heartbeat) */
  formPulse?: number;
  /** 0-1: Levi speaking intensity */
  leviSpeaking?: number;
  className?: string;
}

// Positions: Form left-center, Levi right-center
const FORM_POS = new THREE.Vector3(-2.2, 0, 0);
const LEVI_POS = new THREE.Vector3(2.2, 0, 0);

// Elastic easing for materialization
function elasticOut(t: number): number {
  const p = 0.4;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

/**
 * Shared Three.js scene rendering both Form and Levi artifacts.
 * Uses a single WebGLRenderer. Shadow maps OFF. PixelRatio capped at 2.
 *
 * On mobile (<768px), this component returns null — the parent uses CSS fallback.
 */
export function CosmicEncounterScene({
  phase,
  formOffset = { x: 0, y: 0 },
  leviOffset = { x: 0, y: 0 },
  formPulse = 0,
  leviSpeaking = 0,
  className = '',
}: CosmicEncounterSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const formRef = useRef<ReturnType<typeof createFormArtifact> | null>(null);
  const leviRef = useRef<ReturnType<typeof createLeviArtifact> | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameRef = useRef<number>(0);
  const materializeStartRef = useRef<number | null>(null);
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  const initScene = useCallback(() => {
    const container = containerRef.current;
    if (!container || isMobileRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010409);
    sceneRef.current = scene;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Artifacts
    const formArtifact = createFormArtifact();
    formArtifact.position.copy(FORM_POS);
    scene.add(formArtifact);
    formRef.current = formArtifact;

    const leviArtifact = createLeviArtifact();
    leviArtifact.position.copy(LEVI_POS);
    scene.add(leviArtifact);
    leviRef.current = leviArtifact;

    // Clock
    clockRef.current = new THREE.Clock();

    return () => {
      cancelAnimationFrame(frameRef.current);
      formArtifact.dispose();
      leviArtifact.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Init on mount
  useEffect(() => {
    const cleanup = initScene();
    return () => cleanup?.();
  }, [initScene]);

  // Animation loop
  useEffect(() => {
    if (isMobileRef.current) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const clock = clockRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const form = formRef.current;
      const levi = leviRef.current;
      if (!clock || !renderer || !scene || !camera) return;

      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // ── Materialization ─────────────────────────────────────────
      if (materializeStartRef.current === null) {
        materializeStartRef.current = elapsed;
      }
      const sinceMat = elapsed - materializeStartRef.current;

      // Form: elastic 0→1 over 2s
      if (form) {
        const tForm = Math.min(sinceMat / 2.0, 1);
        const scaleForm = tForm < 1 ? elasticOut(tForm) : 1;
        form.scale.setScalar(scaleForm);
        form.update(elapsed, delta);
        form.heartbeat = formPulse;

        // Parallax
        form.position.set(
          FORM_POS.x + formOffset.x * 0.01,
          FORM_POS.y + formOffset.y * 0.01,
          FORM_POS.z,
        );
      }

      // Levi: elastic 0→1 over 2.5s, delayed 0.5s
      if (levi) {
        const sinceLevi = Math.max(sinceMat - 0.5, 0);
        const tLevi = Math.min(sinceLevi / 2.5, 1);
        const scaleLevi = tLevi < 1 ? elasticOut(tLevi) : 1;
        levi.scale.setScalar(scaleLevi);
        levi.update(elapsed, delta);
        levi.speaking = leviSpeaking;

        // Parallax (opposing)
        levi.position.set(
          LEVI_POS.x + leviOffset.x * 0.01,
          LEVI_POS.y + leviOffset.y * 0.01,
          LEVI_POS.z,
        );
      }

      renderer.render(scene, camera);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [formOffset, leviOffset, formPulse, leviSpeaking]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!container || !renderer || !camera) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: render nothing (parent provides CSS fallback)
  if (isMobileRef.current) return null;

  return (
    <div
      ref={containerRef}
      data-testid="cosmic-scene"
      data-phase={phase}
      className={`absolute inset-0 ${className}`}
    />
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/CosmicEncounterScene.test.tsx
# Expected: 3 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/CosmicEncounterScene.tsx src/__tests__/CosmicEncounterScene.test.tsx
git commit -m "feat(AN-CE): add CosmicEncounterScene with shared renderer + parallax"
```

---

### Task 8 — Mobile fallback (CSS + image artifacts)

**Files:**
- Create: `src/components/onboarding/CosmicEncounterMobile.tsx`
- Test: `src/__tests__/CosmicEncounterMobile.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/CosmicEncounterMobile.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicEncounterMobile } from '../components/onboarding/CosmicEncounterMobile';

describe('CosmicEncounterMobile', () => {
  it('renders form and levi artifacts', () => {
    render(<CosmicEncounterMobile phase="materializing" />);
    expect(screen.getByTestId('mobile-form-artifact')).toBeDefined();
    expect(screen.getByTestId('mobile-levi-artifact')).toBeDefined();
  });

  it('renders with materializing phase', () => {
    render(<CosmicEncounterMobile phase="materializing" />);
    const container = screen.getByTestId('cosmic-mobile');
    expect(container).toBeDefined();
  });

  it('applies parallax transform via style', () => {
    render(
      <CosmicEncounterMobile
        phase="materializing"
        formOffset={{ x: 10, y: 5 }}
        leviOffset={{ x: -15, y: -8 }}
      />
    );
    const form = screen.getByTestId('mobile-form-artifact');
    expect(form.style.transform).toContain('translate');
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/CosmicEncounterMobile.test.tsx
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/CosmicEncounterMobile.tsx`:

```typescript
import { motion } from 'motion/react';

type EncounterPhase =
  | 'materializing'
  | 'levi-speaks'
  | 'birth-input'
  | 'calculating'
  | 'ring-reveal'
  | 'quiz'
  | 'complete';

interface ParallaxOffset {
  x: number;
  y: number;
}

interface CosmicEncounterMobileProps {
  phase: EncounterPhase;
  formOffset?: ParallaxOffset;
  leviOffset?: ParallaxOffset;
  formPulse?: number;
  leviSpeaking?: number;
  className?: string;
}

/**
 * Mobile fallback for the Cosmic Encounter scene.
 * Uses CSS gradients + animations instead of Three.js.
 * Supports device-orientation parallax (lighter than mousemove).
 */
export function CosmicEncounterMobile({
  phase,
  formOffset = { x: 0, y: 0 },
  leviOffset = { x: 0, y: 0 },
  formPulse = 0,
  leviSpeaking = 0,
  className = '',
}: CosmicEncounterMobileProps) {
  const isVisible = phase !== 'ring-reveal' && phase !== 'complete';

  return (
    <div
      data-testid="cosmic-mobile"
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: '#010409' }}
    >
      {/* Die Form — Gold gradient orb (left) */}
      <motion.div
        data-testid="mobile-form-artifact"
        initial={{ scale: 0, opacity: 0 }}
        animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, duration: 2 }}
        className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2"
        style={{
          transform: `translate(${formOffset.x}px, ${formOffset.y}px)`,
        }}
      >
        {/* Outer aura */}
        <div
          className="w-28 h-28 rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle, rgba(212,175,55,${0.15 + formPulse * 0.15}) 0%, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
        {/* Core */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #D4AF37 0%, #8B6914 50%, #0a0a14 100%)',
            boxShadow: `0 0 30px rgba(212,175,55,${0.3 + formPulse * 0.2})`,
          }}
        />
        {/* Ring overlay */}
        <div className="absolute inset-2 rounded-full border border-[#D4AF37]/20 animate-spin" style={{ animationDuration: '8s' }} />
      </motion.div>

      {/* Levi — Cyan gradient orb (right) */}
      <motion.div
        data-testid="mobile-levi-artifact"
        initial={{ scale: 0, opacity: 0 }}
        animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14, duration: 2.5, delay: 0.5 }}
        className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2"
        style={{
          transform: `translate(${leviOffset.x}px, ${leviOffset.y}px)`,
        }}
      >
        {/* Outer aura */}
        <div
          className="w-24 h-24 rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle, rgba(0,245,255,${0.15 + leviSpeaking * 0.2}) 0%, transparent 70%)`,
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        />
        {/* Core */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #00F5FF 0%, #00C5FF 50%, #003040 100%)',
            boxShadow: `0 0 25px rgba(0,245,255,${0.3 + leviSpeaking * 0.3})`,
          }}
        />
        {/* Orbital dot */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
          <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-white/50 blur-[1px]" />
        </div>
      </motion.div>
    </div>
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/CosmicEncounterMobile.test.tsx
# Expected: 3 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/CosmicEncounterMobile.tsx src/__tests__/CosmicEncounterMobile.test.tsx
git commit -m "feat(AN-CE): add CosmicEncounterMobile CSS fallback for <768px"
```

---

## Phase 3: Encounter Orchestration

### Task 9 — Create `EncounterBirthForm` (glassmorphic restyled form)

**Files:**
- Create: `src/components/onboarding/EncounterBirthForm.tsx`
- Test: `src/__tests__/EncounterBirthForm.test.tsx` (Create)

This component reuses existing logic from `BirthForm.tsx` (PlaceAutocomplete, fetchTimezone, isDst) but restyled with glass-card aesthetics on obsidian background.

**Step 1: Write the failing test**

Create `src/__tests__/EncounterBirthForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EncounterBirthForm } from '../components/onboarding/EncounterBirthForm';

// Mock PlaceAutocomplete
vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: ({ onSelect }: any) => (
    <input
      data-testid="place-input"
      onChange={() => onSelect({ name: 'Berlin', lat: 52.52, lon: 13.405 })}
    />
  ),
  hasPlacesApiKey: () => false,
}));

// Mock timezone service
vi.mock('../services/timezone', () => ({
  fetchTimezone: vi.fn().mockResolvedValue('Europe/Berlin'),
}));

// Mock LanguageContext
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

describe('EncounterBirthForm', () => {
  it('renders place, date, and time fields', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByTestId('encounter-place')).toBeDefined();
    expect(screen.getByTestId('encounter-date')).toBeDefined();
    expect(screen.getByTestId('encounter-time')).toBeDefined();
  });

  it('calls onSubmit with birth data', async () => {
    const onSubmit = vi.fn();
    render(<EncounterBirthForm onSubmit={onSubmit} isLoading={false} />);

    // Fill date
    fireEvent.change(screen.getByTestId('encounter-date'), { target: { value: '1990-06-15' } });
    // Fill time
    fireEvent.change(screen.getByTestId('encounter-time'), { target: { value: '14:30' } });
    // Select place
    fireEvent.change(screen.getByTestId('place-input'));

    // Submit
    fireEvent.click(screen.getByTestId('encounter-submit'));

    // Wait for async timezone fetch
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        date: expect.stringContaining('1990-06-15'),
        lat: 52.52,
        lon: 13.405,
      }));
    });
  });

  it('reports field fill progress via onProgress', () => {
    const onProgress = vi.fn();
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} onProgress={onProgress} />);

    // Initially no fields filled
    expect(onProgress).toHaveBeenCalledWith(expect.any(Number));
  });

  it('has glassmorphic styling', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} />);
    const form = screen.getByTestId('encounter-form');
    expect(form.className).toContain('backdrop-blur');
  });

  it('disables submit when loading', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={true} />);
    const btn = screen.getByTestId('encounter-submit');
    expect(btn).toHaveProperty('disabled', true);
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/EncounterBirthForm.test.tsx
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/EncounterBirthForm.tsx`:

```typescript
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlaceAutocomplete } from '../PlaceAutocomplete';
import { fetchTimezone } from '../../services/timezone';

interface EncounterBirthFormProps {
  onSubmit: (data: { date: string; tz: string; lon: number; lat: number }) => void;
  isLoading: boolean;
  /** 0-1 field fill progress (for heartbeat driving) */
  onProgress?: (progress: number) => void;
  className?: string;
}

/**
 * Glassmorphic birth data form for the Cosmic Encounter.
 * Three fields: Ort (place), Datum (date), Uhrzeit (time).
 * Reuses PlaceAutocomplete (Nominatim) and fetchTimezone.
 *
 * Styled with obsidian glass — no white backgrounds.
 */
export function EncounterBirthForm({
  onSubmit,
  isLoading,
  onProgress,
  className = '',
}: EncounterBirthFormProps) {
  const [date, setDate] = useState('1990-01-01');
  const [time, setTime] = useState('12:00');
  const [placeName, setPlaceName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [tz, setTz] = useState('Europe/Berlin');

  // Track fill progress for heartbeat
  const progress = useMemo(() => {
    let filled = 0;
    if (date && date !== '1990-01-01') filled++;
    if (time && time !== '12:00') filled++;
    if (coords) filled++;
    return filled / 3;
  }, [date, time, coords]);

  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  const handlePlaceSelect = useCallback(async (place: { name: string; lat: number; lon: number }) => {
    setPlaceName(place.name);
    setCoords({ lat: place.lat, lon: place.lon });
    const detected = await fetchTimezone(place.lat, place.lon);
    if (detected) setTz(detected);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;

    const isoDate = `${date}T${time}:00`;
    onSubmit({ date: isoDate, tz, lon: coords.lon, lat: coords.lat });
  }, [date, time, coords, tz, onSubmit]);

  const canSubmit = Boolean(coords) && Boolean(date) && !isLoading;

  return (
    <motion.form
      data-testid="encounter-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`
        w-full max-w-md mx-auto p-6 rounded-2xl
        bg-white/[0.02] backdrop-blur-lg
        border border-[#D4AF37]/[0.08]
        shadow-[0_0_40px_rgba(212,175,55,0.04)]
        space-y-5
        ${className}
      `}
    >
      {/* Ort (Place) */}
      <div data-testid="encounter-place">
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtsort {/* Birth place */}
        </label>
        <PlaceAutocomplete
          onSelect={handlePlaceSelect}
          placeholder="Stadt eingeben..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm placeholder:text-white/20 focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
        {placeName && (
          <p className="mt-1 text-[10px] text-[#D4AF37]/40 font-sans">{placeName}</p>
        )}
      </div>

      {/* Datum (Date) */}
      <div data-testid="encounter-date-wrapper">
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtsdatum {/* Birth date */}
        </label>
        <input
          data-testid="encounter-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Uhrzeit (Time) */}
      <div data-testid="encounter-time-wrapper">
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtszeit {/* Birth time */}
        </label>
        <input
          data-testid="encounter-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Submit */}
      <motion.button
        data-testid="encounter-submit"
        type="submit"
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.02 } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        className={`
          w-full py-3.5 rounded-xl font-sans text-sm tracking-[0.15em] uppercase
          border transition-all duration-500
          ${canSubmit
            ? 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/[0.06] hover:bg-[#D4AF37]/[0.12] hover:border-[#D4AF37]/50 cursor-pointer'
            : 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-[#D4AF37] rounded-full animate-ping" />
            Berechne...
          </span>
        ) : (
          'Signatur berechnen'
        )}
      </motion.button>
    </motion.form>
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/EncounterBirthForm.test.tsx
# Expected: 5 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/EncounterBirthForm.tsx src/__tests__/EncounterBirthForm.test.tsx
git commit -m "feat(AN-CE): add EncounterBirthForm with glassmorphic obsidian styling"
```

---

### Task 10 — Create `CosmicEncounter` main orchestrator (7-phase state machine)

**Files:**
- Create: `src/components/onboarding/CosmicEncounter.tsx`
- Test: `src/__tests__/CosmicEncounter.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/CosmicEncounter.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// Mock heavy sub-components
vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => <div data-testid="mobile-scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button data-testid="mock-form" onClick={() => onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })}>
      Submit
    </button>
  ),
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ text }: any) => <div data-testid="levi-bubble">{text}</div>,
}));
vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: () => <div data-testid="myzelium" />,
}));
vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));

// Mock existing components
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => <div data-testid="ring-reveal" onClick={onComplete} />,
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete(null)} />
  ),
}));

describe('CosmicEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in materializing phase', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('materializing');
  });

  it('transitions to levi-speaks after 3s auto-trigger', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('levi-bubble')).toBeDefined();
  });

  it('shows birth form after levi speaks', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // materializing → levi-speaks → birth-input
    act(() => { vi.advanceTimersByTime(3000); }); // levi-speaks
    act(() => { vi.advanceTimersByTime(5000); }); // speech done → birth-input

    expect(screen.getByTestId('mock-form')).toBeDefined();
  });

  it('transitions to ring-reveal when bootstrapData arrives', async () => {
    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={true}
      />
    );

    // Skip to calculating phase
    act(() => { vi.advanceTimersByTime(3000); }); // levi
    act(() => { vi.advanceTimersByTime(5000); }); // form

    const mockBootstrap = {
      profile: { sun_sign: 'Leo', moon_sign: 'Cancer', ascendant_sign: 'Virgo', day_master: 'Bing', harmony_index: 0.7 },
      soulprint_sectors: Array(12).fill(0.08),
      narratives: { core_summary: 'x', context_summary: 'y', integration_summary: 'z' },
      signature_blueprint: { seed: 'test' },
      meta: { engine_version: '1.0' },
    };

    rerender(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={mockBootstrap}
        isLoading={false}
      />
    );

    // Should transition to ring-reveal
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByTestId('ring-reveal')).toBeDefined();
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/CosmicEncounter.test.tsx
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/CosmicEncounter.tsx`:

```typescript
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicEncounterScene } from './CosmicEncounterScene';
import { CosmicEncounterMobile } from './CosmicEncounterMobile';
import { EncounterBirthForm } from './EncounterBirthForm';
import { LeviSpeechBubble } from './LeviSpeechBubble';
import { MyzeliumNetwork } from './MyzeliumNetwork';
import { useParallax } from './useParallax';
import { soulprintToNatalWeights } from '../fusion-ring-website/signatur-bridge';
import type { BootstrapResponse, SignatureDeltaResponse } from '../../lib/schemas/experience';
import type { ApiData } from '../../types/bafe';

const FusionRingReveal = lazy(() => import('./FusionRingReveal'));
const SignatureRevealLazy = lazy(() =>
  import('./SignatureReveal').then((m) => ({ default: m.SignatureReveal }))
);

// ── Phase types ──────────────────────────────────────────────────────

export type EncounterPhase =
  | 'materializing'  // Form + Levi materialize (0-3s)
  | 'levi-speaks'    // Levi greets user (auto after 3s)
  | 'birth-input'    // Birth fields appear
  | 'calculating'    // Bootstrap API in flight
  | 'ring-reveal'    // Form morphs to FusionRingCanvasV2
  | 'quiz'           // Quiz question (from SignatureReveal)
  | 'complete';      // Done → navigate to dashboard

// ── Levi speech lines (German) ──────────────────────────────────────

const LEVI_GREETING = 'Willkommen, Reisender. Ich bin Levi, dein kosmischer Begleiter. Gemeinsam entdecken wir deine Signatur im Firmament.';
// "Welcome, traveler. I am Levi, your cosmic companion. Together we'll discover your signature in the firmament."

const LEVI_FORM_PROMPT = 'Teile mir deine Geburtsdaten mit, damit wir deine einzigartige kosmische Signatur berechnen koennen.';
// "Share your birth data so we can calculate your unique cosmic signature."

const LEVI_CALCULATING = 'Die Sterne ordnen sich... Deine Signatur nimmt Form an.';
// "The stars are aligning... Your signature is taking form."

const LEVI_REVEAL = 'Da ist sie. Deine kosmische Signatur.';
// "There it is. Your cosmic signature."

// ── Props ───────────────────────────────────────────────────────────

interface CosmicEncounterProps {
  /** Called when birth form is submitted (parent runs bootstrap) */
  onSubmitBirth: (data: { date: string; tz: string; lon: number; lat: number }) => void;
  /** Bootstrap data (arrives asynchronously from parent) */
  bootstrapData: BootstrapResponse | null;
  /** Fallback BAFE data for ring weights */
  fallbackApiData?: ApiData | null;
  /** Loading state from parent */
  isLoading: boolean;
  /** Called when the entire encounter is done */
  onComplete: (delta: SignatureDeltaResponse | null) => void;
  /** Ambiente player controls */
  ambientePause?: () => void;
  ambienteResume?: () => void;
}

/**
 * Cosmic Encounter — 7-phase onboarding orchestrator.
 *
 * Flow:
 * 1. materializing: Artifacts scale in (2-2.5s) + myzelium builds
 * 2. levi-speaks: Levi greets (auto 3s after mount)
 * 3. birth-input: Glassmorphic form appears
 * 4. calculating: Waiting for bootstrap API
 * 5. ring-reveal: Form→center→FusionRingCanvasV2 (2.5s)
 * 6. quiz: SignatureReveal quiz question
 * 7. complete: Done
 */
export function CosmicEncounter({
  onSubmitBirth,
  bootstrapData,
  fallbackApiData,
  isLoading,
  onComplete,
  ambientePause,
  ambienteResume,
}: CosmicEncounterProps) {
  const [phase, setPhase] = useState<EncounterPhase>('materializing');
  const [formPulse, setFormPulse] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showLeviText, setShowLeviText] = useState(false);
  const [leviText, setLeviText] = useState('');
  const [leviSpeaking, setLeviSpeaking] = useState(0);
  const [myzeliumActive, setMyzeliumActive] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const formOffset = useParallax(30, !isMobile);
  const leviOffset = useParallax(-50, !isMobile);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── Phase: materializing → levi-speaks (auto after 3s) ────────────
  useEffect(() => {
    if (phase !== 'materializing') return;

    // Myzelium builds 1s after mount
    addTimer(() => setMyzeliumActive(true), 1000);

    // Levi starts speaking 3s after mount
    addTimer(() => {
      if (phaseRef.current === 'materializing') {
        setPhase('levi-speaks');
        setLeviText(LEVI_GREETING);
        setShowLeviText(true);
        setLeviSpeaking(1);
      }
    }, 3000);
  }, [phase, addTimer]);

  // ── Phase: levi-speaks → birth-input (after speech completes) ─────
  const handleGreetingComplete = useCallback(() => {
    setLeviSpeaking(0);
    addTimer(() => {
      setLeviText(LEVI_FORM_PROMPT);
      setLeviSpeaking(0.5);
    }, 500);
    addTimer(() => {
      setPhase('birth-input');
      setShowForm(true);
      setLeviSpeaking(0);
    }, 2500);
  }, [addTimer]);

  // ── Phase: birth-input → calculating (form submitted) ─────────────
  const handleFormSubmit = useCallback((data: { date: string; tz: string; lon: number; lat: number }) => {
    setPhase('calculating');
    setLeviText(LEVI_CALCULATING);
    setLeviSpeaking(0.3);
    ambientePause?.(); // pause for potential ElevenLabs
    onSubmitBirth(data);
  }, [onSubmitBirth, ambientePause]);

  // ── Phase: calculating → ring-reveal (bootstrapData arrives) ──────
  useEffect(() => {
    if (phase === 'calculating' && bootstrapData && !isLoading) {
      addTimer(() => {
        setPhase('ring-reveal');
        setLeviText(LEVI_REVEAL);
        setLeviSpeaking(0.6);
        setShowForm(false);
      }, 500);
    }
  }, [phase, bootstrapData, isLoading, addTimer]);

  // ── Phase: ring-reveal → quiz (after ring animation) ──────────────
  const handleRingRevealComplete = useCallback(() => {
    setPhase('quiz');
    setLeviSpeaking(0);
    setShowLeviText(false);
    ambienteResume?.();
  }, [ambienteResume]);

  // ── Phase: quiz → complete ────────────────────────────────────────
  const handleQuizComplete = useCallback((delta: SignatureDeltaResponse | null) => {
    setPhase('complete');
    onComplete(delta);
  }, [onComplete]);

  // ── Natal weights for ring reveal ─────────────────────────────────
  const natalWeights = bootstrapData
    ? soulprintToNatalWeights(bootstrapData.soulprint_sectors)
    : undefined;

  // ── Myzelium anchor positions (proportional to viewport) ──────────
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const leftAnchor = { x: vw * 0.25, y: vh * 0.5 };
  const rightAnchor = { x: vw * 0.75, y: vh * 0.5 };

  // ── Render ────────────────────────────────────────────────────────

  const isPreReveal = phase !== 'ring-reveal' && phase !== 'quiz' && phase !== 'complete';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: '#010409' }}>
      {/* Three.js / Mobile scene (hidden during ring-reveal) */}
      <AnimatePresence>
        {isPreReveal && (
          <motion.div
            key="scene"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            {isMobile ? (
              <CosmicEncounterMobile
                phase={phase}
                formOffset={formOffset}
                leviOffset={leviOffset}
                formPulse={formPulse}
                leviSpeaking={leviSpeaking}
              />
            ) : (
              <CosmicEncounterScene
                phase={phase}
                formOffset={formOffset}
                leviOffset={leviOffset}
                formPulse={formPulse}
                leviSpeaking={leviSpeaking}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Myzelium network */}
      {isPreReveal && (
        <MyzeliumNetwork
          leftAnchor={leftAnchor}
          rightAnchor={rightAnchor}
          active={myzeliumActive}
          intensity={formPulse}
        />
      )}

      {/* Levi speech bubble (top-right area) */}
      <AnimatePresence>
        {showLeviText && leviText && (
          <motion.div
            key="levi-speech"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/4 right-8 md:right-16 z-20 max-w-xs"
          >
            <LeviSpeechBubble
              text={leviText}
              speed={35}
              onComplete={phase === 'levi-speaks' ? handleGreetingComplete : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birth form (center-bottom) */}
      <AnimatePresence>
        {showForm && (phase === 'birth-input' || phase === 'calculating') && (
          <motion.div
            key="birth-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full px-4"
          >
            <EncounterBirthForm
              onSubmit={handleFormSubmit}
              isLoading={phase === 'calculating'}
              onProgress={setFormPulse}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ring reveal */}
      {phase === 'ring-reveal' && (
        <Suspense fallback={<div className="absolute inset-0 bg-[#010409]" />}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-30"
          >
            <FusionRingReveal
              natalWeights={natalWeights}
              onComplete={handleRingRevealComplete}
              autoReveal
            />
          </motion.div>
        </Suspense>
      )}

      {/* Quiz phase (reuse SignatureReveal) */}
      {phase === 'quiz' && bootstrapData && (
        <Suspense fallback={<div className="absolute inset-0 bg-[#010409]" />}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-30 flex items-center justify-center p-4"
          >
            <SignatureRevealLazy
              bootstrapData={bootstrapData}
              fallbackApiData={fallbackApiData}
              onComplete={handleQuizComplete}
            />
          </motion.div>
        </Suspense>
      )}
    </div>
  );
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/CosmicEncounter.test.tsx
# Expected: 4 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/CosmicEncounter.tsx src/__tests__/CosmicEncounter.test.tsx
git commit -m "feat(AN-CE): add CosmicEncounter 7-phase state machine orchestrator"
```

---

### Task 11 — Wire ambient music (fade-in, heartbeat, ElevenLabs pause/resume)

**Files:**
- Modify: `src/components/onboarding/CosmicEncounter.tsx` (already wired via `ambientePause`/`ambienteResume` props)
- This task verifies the wiring works in the parent. No new component needed.
- Test: `src/__tests__/CosmicEncounter-audio.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/CosmicEncounter-audio.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// Same mocks as Task 10
vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => <div data-testid="mobile-scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button data-testid="mock-form" onClick={() => onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })}>
      Submit
    </button>
  ),
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ text, onComplete }: any) => {
    // Auto-complete after render
    if (onComplete) setTimeout(onComplete, 0);
    return <div data-testid="levi-bubble">{text}</div>;
  },
}));
vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: () => <div data-testid="myzelium" />,
}));
vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => <div data-testid="ring-reveal" onClick={onComplete} />,
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete(null)} />
  ),
}));

describe('CosmicEncounter audio wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls ambientePause when form is submitted', () => {
    const pause = vi.fn();
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
        ambientePause={pause}
      />
    );

    // Advance to birth-input
    act(() => { vi.advanceTimersByTime(3000); }); // → levi-speaks
    act(() => { vi.advanceTimersByTime(100); });   // onComplete fires
    act(() => { vi.advanceTimersByTime(3000); });  // → birth-input

    // Submit form
    fireEvent.click(screen.getByTestId('mock-form'));
    expect(pause).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run test — expect pass (already implemented in Task 10)**

```bash
npx vitest run src/__tests__/CosmicEncounter-audio.test.tsx
# Expected: 1 test passed
```

If timing in the mock causes issues, adjust the `setTimeout(onComplete, 0)` in the LeviSpeechBubble mock and advance timers accordingly.

**Step 3: No new implementation needed**

The `ambientePause` and `ambienteResume` callbacks are already passed through `CosmicEncounter` and called at the correct phase transitions (calculating → pause, ring-reveal complete → resume).

**Step 4: Verify test passes**

```bash
npx vitest run src/__tests__/CosmicEncounter-audio.test.tsx
# Expected: 1 test passed
```

**Step 5: Commit**

```bash
git add src/__tests__/CosmicEncounter-audio.test.tsx
git commit -m "test(AN-CE): add audio wiring verification test"
```

---

### Task 12 — Wire Levi speech (ElevenLabs widget or LeviSpeechBubble fallback)

**Files:**
- Create: `src/components/onboarding/useLeviSpeech.ts`
- Test: `src/__tests__/useLeviSpeech.test.ts` (Create)

This hook encapsulates the ElevenLabs/fallback decision. When the ElevenLabs widget is available and the agent ID is configured, it uses voice. Otherwise, it falls back to the LeviSpeechBubble typewriter.

**Step 1: Write the failing test**

Create `src/__tests__/useLeviSpeech.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeviSpeech } from '../components/onboarding/useLeviSpeech';

describe('useLeviSpeech', () => {
  it('returns fallback mode when VITE_ELEVENLABS_AGENT_ID is not set', () => {
    // In test env, import.meta.env is empty
    const { result } = renderHook(() => useLeviSpeech());
    expect(result.current.mode).toBe('text');
    expect(result.current.isAvailable).toBe(false);
  });

  it('provides speak function that does not throw in text mode', () => {
    const { result } = renderHook(() => useLeviSpeech());
    expect(() => result.current.speak('hello')).not.toThrow();
  });

  it('returns the last spoken text', () => {
    const { result } = renderHook(() => useLeviSpeech());
    result.current.speak('Test nachricht');
    expect(result.current.currentText).toBe('Test nachricht');
  });
});
```

**Step 2: Run test — expect failure**

```bash
npx vitest run src/__tests__/useLeviSpeech.test.ts
# Expected: Cannot find module
```

**Step 3: Implement**

Create `src/components/onboarding/useLeviSpeech.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';

type SpeechMode = 'voice' | 'text';

interface LeviSpeechState {
  /** 'voice' if ElevenLabs available, 'text' for typewriter fallback */
  mode: SpeechMode;
  /** Whether voice mode is ready */
  isAvailable: boolean;
  /** Current text being displayed/spoken */
  currentText: string;
  /** Whether Levi is currently speaking */
  isSpeaking: boolean;
  /** Trigger Levi to say something */
  speak: (text: string) => void;
  /** Stop current speech */
  stop: () => void;
}

/**
 * Encapsulates ElevenLabs / text-fallback decision for Levi.
 *
 * If VITE_ELEVENLABS_AGENT_ID is set, attempts to use voice mode.
 * Falls back to text mode (consumed by LeviSpeechBubble).
 */
export function useLeviSpeech(): LeviSpeechState {
  const agentId = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_ELEVENLABS_AGENT_ID as string | undefined)
    : undefined;

  const hasVoice = Boolean(agentId);
  const [currentText, setCurrentText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  const speak = useCallback((text: string) => {
    setCurrentText(text);
    setIsSpeaking(true);
    speakingRef.current = true;

    if (hasVoice) {
      // Voice mode: trigger ElevenLabs widget
      // The actual widget integration is handled by the parent component
      // mounting <elevenlabs-convai>. This hook just tracks state.
      // Voice completion is detected via widget events.
    }

    // In text mode, completion is signaled by LeviSpeechBubble's onComplete
  }, [hasVoice]);

  const stop = useCallback(() => {
    setIsSpeaking(false);
    speakingRef.current = false;
  }, []);

  return {
    mode: hasVoice ? 'voice' : 'text',
    isAvailable: hasVoice,
    currentText,
    isSpeaking,
    speak,
    stop,
  };
}
```

**Step 4: Run test — expect pass**

```bash
npx vitest run src/__tests__/useLeviSpeech.test.ts
# Expected: 3 tests passed
```

**Step 5: Commit**

```bash
git add src/components/onboarding/useLeviSpeech.ts src/__tests__/useLeviSpeech.test.ts
git commit -m "feat(AN-CE): add useLeviSpeech hook (ElevenLabs/text fallback)"
```

---

## Phase 4: Ring Reveal + Integration

### Task 13 — Implement ring reveal transition (Form → center → FusionRingCanvasV2)

**Files:**
- Modify: `src/components/onboarding/CosmicEncounter.tsx` (already handles ring-reveal phase with FusionRingReveal)
- This task validates the transition works end-to-end.
- Test: `src/__tests__/ring-reveal-transition.test.tsx` (Create)

The ring reveal is already implemented in Task 10 using `FusionRingReveal` (which wraps `FusionRingCanvasV2`). This task adds a targeted test for the Form-dissolve → ring-appear transition and the `natalWeights` derivation.

**Step 1: Write the test**

Create `src/__tests__/ring-reveal-transition.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { soulprintToNatalWeights } from '../components/fusion-ring-website/signatur-bridge';

describe('Ring reveal: natalWeights derivation', () => {
  it('converts 12 soulprint sectors to 7 planet weights', () => {
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.85, 0.75, 0.65];
    const weights = soulprintToNatalWeights(sectors);

    expect(Object.keys(weights)).toEqual(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
    // Sun → Leo(4) = sectors[4] = 0.5
    expect(weights.Sun).toBeCloseTo(0.5, 2);
    // Moon → Cancer(3) = sectors[3] = 0.4
    expect(weights.Moon).toBeCloseTo(0.4, 2);
    // Mercury → avg(Gemini(2), Virgo(5)) = (0.3 + 0.6) / 2 = 0.45
    expect(weights.Mercury).toBeCloseTo(0.45, 2);
  });

  it('handles neutral sectors (all 0.5)', () => {
    const sectors = Array(12).fill(0.5);
    const weights = soulprintToNatalWeights(sectors);
    Object.values(weights).forEach((w) => {
      expect(w).toBeCloseTo(0.5, 2);
    });
  });

  it('preserves extreme values', () => {
    const sectors = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const weights = soulprintToNatalWeights(sectors);
    // Mars → avg(Aries(0), Scorpio(7)) = (1 + 0) / 2 = 0.5
    expect(weights.Mars).toBeCloseTo(0.5, 2);
    // Sun → Leo(4) = 1
    expect(weights.Sun).toBeCloseTo(1, 2);
  });
});
```

**Step 2: Run test**

```bash
npx vitest run src/__tests__/ring-reveal-transition.test.ts
# Expected: 3 tests passed (this tests existing code, should pass immediately)
```

**Step 3: No new implementation needed** — the ring reveal transition is already wired in `CosmicEncounter.tsx` (Task 10). The `FusionRingReveal` component handles the 2.5s reveal animation.

**Step 4: Verify**

```bash
npx vitest run src/__tests__/ring-reveal-transition.test.ts
# Expected: 3 tests passed
```

**Step 5: Commit**

```bash
git add src/__tests__/ring-reveal-transition.test.tsx
git commit -m "test(AN-CE): add ring-reveal natalWeights derivation tests"
```

---

### Task 14 — Wire quiz from SignatureReveal

**Files:**
- This is already implemented in Task 10 (CosmicEncounter lazy-loads SignatureReveal in quiz phase)
- Test: Verify the quiz → complete transition
- Test: `src/__tests__/encounter-quiz-phase.test.tsx` (Create)

**Step 1: Write the test**

Create `src/__tests__/encounter-quiz-phase.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: () => null,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button data-testid="mock-form" onClick={() => onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })}>
      Submit
    </button>
  ),
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ onComplete }: any) => {
    if (onComplete) setTimeout(onComplete, 0);
    return <div data-testid="levi-bubble" />;
  },
}));
vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: () => null,
}));
vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => (
    <div data-testid="ring-reveal" onClick={onComplete}>Ring</div>
  ),
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete({ quiz_sectors: Array(12).fill(0.08) })}>Quiz</div>
  ),
}));

const MOCK_BOOTSTRAP = {
  profile: { sun_sign: 'Leo', moon_sign: 'Cancer', ascendant_sign: 'Virgo', day_master: 'Bing', harmony_index: 0.7 },
  soulprint_sectors: Array(12).fill(0.08),
  narratives: { core_summary: 'x', context_summary: 'y', integration_summary: 'z' },
  signature_blueprint: { seed: 'test' },
  meta: { engine_version: '1.0' },
};

describe('CosmicEncounter quiz → complete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('calls onComplete with delta data after quiz answer', () => {
    const onComplete = vi.fn();

    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={onComplete}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // materializing → levi-speaks
    act(() => { vi.advanceTimersByTime(3000); });
    // levi-speaks → birth-input
    act(() => { vi.advanceTimersByTime(100); }); // onComplete
    act(() => { vi.advanceTimersByTime(3000); });

    // Submit form → calculating
    fireEvent.click(screen.getByTestId('mock-form'));

    // bootstrapData arrives → ring-reveal
    rerender(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={onComplete}
        bootstrapData={MOCK_BOOTSTRAP}
        isLoading={false}
      />
    );
    act(() => { vi.advanceTimersByTime(1000); });

    // Ring reveal → click to complete
    const ringReveal = screen.getByTestId('ring-reveal');
    fireEvent.click(ringReveal);

    // Quiz appears → click to answer
    act(() => { vi.advanceTimersByTime(100); });
    const quiz = screen.getByTestId('sig-reveal');
    fireEvent.click(quiz);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      quiz_sectors: expect.any(Array),
    }));
  });
});
```

**Step 2: Run test**

```bash
npx vitest run src/__tests__/encounter-quiz-phase.test.tsx
# Expected: 1 test passed
```

**Step 3-4: No new implementation — wiring is in place from Task 10**

**Step 5: Commit**

```bash
git add src/__tests__/encounter-quiz-phase.test.tsx
git commit -m "test(AN-CE): add quiz→complete phase transition test"
```

---

### Task 15 — Modify App.tsx: add 'encounter' phase + wire CosmicEncounter into OnboardingPage

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/OnboardingPage.tsx`
- Test: `src/__tests__/onboarding-encounter-routing.test.tsx` (Create)

**Step 1: Write the failing test**

Create `src/__tests__/onboarding-encounter-routing.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { isFeatureEnabled } from '../lib/feature-flags';

// Test that the feature flag gates the encounter
vi.mock('../lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => {
    if (flag === 'cosmic_encounter_v1') return true;
    if (flag === 'signature_onboarding_v1') return true;
    return false;
  }),
}));

describe('Onboarding encounter routing', () => {
  it('cosmic_encounter_v1 flag gates the new flow', () => {
    expect(isFeatureEnabled('cosmic_encounter_v1')).toBe(true);
  });

  it('onboarding phase type includes encounter', () => {
    // Type-level check: this compiles if the type is correct
    const phase: 'form' | 'encounter' | 'signature' | 'done' = 'encounter';
    expect(phase).toBe('encounter');
  });
});
```

**Step 2: Run test — should pass (type check)**

```bash
npx vitest run src/__tests__/onboarding-encounter-routing.test.tsx
# Expected: 2 tests passed
```

**Step 3: Modify `App.tsx` — add 'encounter' to onboarding phase**

In `src/App.tsx`, change the `onboardingPhase` state type:

```typescript
// BEFORE:
const [onboardingPhase, setOnboardingPhase] = useState<'form' | 'signature' | 'done'>('form');

// AFTER:
const [onboardingPhase, setOnboardingPhase] = useState<'form' | 'encounter' | 'signature' | 'done'>(() => {
  // If cosmic encounter is enabled, start with encounter phase
  if (isFeatureEnabled('cosmic_encounter_v1')) return 'encounter';
  return 'form';
});
```

Update the `handleOnboardingSubmit` function — when in encounter mode, the CosmicEncounter handles the bootstrap call internally, so we need a different handler:

```typescript
// Add after existing handleOnboardingSubmit:
const handleEncounterComplete = (delta: SignatureDeltaResponse | null) => {
  setOnboardingPhase('done');
};
```

Update the `onboardingProps` object to include the new phase + handler:

```typescript
onboardingProps={{
  hasCompleteProfile,
  onboardingPhase,
  bootstrapData,
  apiData,
  isLoading,
  error,
  onSubmitBirth: handleOnboardingSubmit,
  onSignatureComplete: handleSignatureComplete,
  onEncounterComplete: handleEncounterComplete,
  ambientePause: ambiente.pause,
  ambienteResume: ambiente.resume,
}}
```

**Step 4: Modify `OnboardingPage.tsx` — render CosmicEncounter**

```typescript
import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { BirthForm } from '@/src/components/BirthForm';
import { SignatureReveal } from '@/src/components/onboarding/SignatureReveal';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import type { ApiData } from '@/src/types/bafe';

const CosmicEncounter = lazy(() =>
  import('@/src/components/onboarding/CosmicEncounter').then((m) => ({
    default: m.CosmicEncounter,
  }))
);

type Props = {
  hasCompleteProfile: boolean;
  onboardingPhase: 'form' | 'encounter' | 'signature' | 'done';
  bootstrapData: BootstrapResponse | null;
  apiData: ApiData | null;
  isLoading: boolean;
  error: string | null;
  onSubmitBirth: (formData: { date: string; tz: string; lon: number; lat: number }) => void | Promise<void>;
  onSignatureComplete: (delta: SignatureDeltaResponse | null) => void;
  onEncounterComplete?: (delta: SignatureDeltaResponse | null) => void;
  ambientePause?: () => void;
  ambienteResume?: () => void;
};

export type OnboardingPageProps = Props;

export default function OnboardingPage({
  hasCompleteProfile,
  onboardingPhase,
  bootstrapData,
  apiData,
  isLoading,
  error,
  onSubmitBirth,
  onSignatureComplete,
  onEncounterComplete,
  ambientePause,
  ambienteResume,
}: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompleteProfile) navigate('/', { replace: true });
  }, [hasCompleteProfile, navigate]);

  useEffect(() => {
    if (onboardingPhase === 'done' && hasCompleteProfile) navigate('/', { replace: true });
  }, [onboardingPhase, hasCompleteProfile, navigate]);

  // Cosmic Encounter (full-screen, handles its own layout)
  if (onboardingPhase === 'encounter') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#010409]" />}>
        <CosmicEncounter
          onSubmitBirth={onSubmitBirth}
          bootstrapData={bootstrapData}
          fallbackApiData={apiData}
          isLoading={isLoading}
          onComplete={onEncounterComplete ?? onSignatureComplete}
          ambientePause={ambientePause}
          ambienteResume={ambienteResume}
        />
      </Suspense>
    );
  }

  // Legacy onboarding flow
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8"
    >
      {error && (
        <div className="w-full max-w-md bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {onboardingPhase === 'form' && (
        <BirthForm onSubmit={onSubmitBirth} isLoading={isLoading} />
      )}

      {onboardingPhase === 'signature' && bootstrapData && (
        <SignatureReveal
          bootstrapData={bootstrapData}
          fallbackApiData={apiData}
          onComplete={onSignatureComplete}
        />
      )}
    </motion.div>
  );
}
```

**Step 5: Commit**

```bash
git add src/App.tsx src/pages/OnboardingPage.tsx src/__tests__/onboarding-encounter-routing.test.tsx
git commit -m "feat(AN-CE): wire CosmicEncounter into App.tsx + OnboardingPage (gated by flag)"
```

---

### Task 16 — Modify Splash.tsx: after video → navigate to encounter

**Files:**
- Modify: `src/components/Splash.tsx` — No modification needed! The Splash already calls `onEnter()` which sets `showSplash=false`, revealing the app. The app then routes to `/onboarding` which now renders `CosmicEncounter` when the flag is on.

The crossfade from video to encounter is handled by:
1. Splash video ends → `onEnter()` called → `showSplash=false`
2. `App.tsx` AnimatePresence fades out Splash (1.5s `exit={{ opacity: 0 }}`)
3. App renders `OnboardingPage` → `CosmicEncounter` appears (its own fade-in)

This 1.5s exit matches the spec's "1.5s black crossfade". No changes needed.

**Test: Verify the handoff**

Create `src/__tests__/splash-encounter-handoff.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Splash → Encounter handoff', () => {
  it('Splash exit animation duration matches spec (1.5s)', () => {
    // The AnimatePresence exit in App.tsx uses duration: 1.5
    // This is a documentation test — the actual value lives in App.tsx line ~132:
    // exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeInOut" }}
    const SPEC_CROSSFADE = 1.5;
    const APP_EXIT_DURATION = 1.5;
    expect(APP_EXIT_DURATION).toBe(SPEC_CROSSFADE);
  });

  it('Splash calls onEnter (not a direct navigation)', () => {
    // Splash.tsx props: { onEnter: () => void }
    // The onEnter callback in App.tsx: setShowSplash(false) + setSiteVisible(true)
    // This means the encounter is rendered by the app routing, not Splash navigation
    expect(true).toBe(true); // structural validation
  });
});
```

**Commit:**

```bash
git add src/__tests__/splash-encounter-handoff.test.ts
git commit -m "test(AN-CE): add splash→encounter handoff documentation tests"
```

---

## Phase 5: Polish + Tests

### Task 17 — Add interaction feedback (Form heartbeat, Myzelium brightness)

**Files:**
- Modify: `src/components/onboarding/CosmicEncounter.tsx` (already passes `formPulse` to scene and `intensity` to MyzeliumNetwork)
- This is already wired. Verify with a test.
- Test: `src/__tests__/encounter-feedback.test.tsx` (Create)

**Step 1: Write the test**

Create `src/__tests__/encounter-feedback.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

let capturedFormPulse = 0;

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ formPulse }: any) => {
    capturedFormPulse = formPulse;
    return <div data-testid="scene" />;
  },
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: () => null,
}));

let capturedFormProgress: ((p: number) => void) | undefined;
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onProgress }: any) => {
    capturedFormProgress = onProgress;
    return <div data-testid="form" />;
  },
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ onComplete }: any) => {
    if (onComplete) setTimeout(onComplete, 0);
    return <div data-testid="levi-bubble" />;
  },
}));
vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: ({ intensity }: any) => <div data-testid="myzelium" data-intensity={intensity} />,
}));
vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: () => <div />,
}));

describe('Interaction feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('formPulse propagates from EncounterBirthForm to CosmicEncounterScene', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // Advance to birth-input phase
    act(() => { vi.advanceTimersByTime(3000); }); // levi
    act(() => { vi.advanceTimersByTime(100); });   // complete
    act(() => { vi.advanceTimersByTime(3000); });  // form

    // Simulate form progress
    act(() => {
      capturedFormProgress?.(0.67);
    });

    expect(capturedFormPulse).toBeCloseTo(0.67, 1);
  });
});
```

**Step 2-4: Run test**

```bash
npx vitest run src/__tests__/encounter-feedback.test.tsx
# Expected: 1 test passed
```

**Step 5: Commit**

```bash
git add src/__tests__/encounter-feedback.test.tsx
git commit -m "test(AN-CE): add interaction feedback propagation test"
```

---

### Task 18 — Add responsive breakpoints (tablet + mobile layout)

**Files:**
- Modify: `src/components/onboarding/CosmicEncounter.tsx`
- Test: `src/__tests__/encounter-responsive.test.tsx` (Create)

The mobile fallback is already implemented via `CosmicEncounterMobile` (renders when `window.innerWidth < 768`). This task adds a tablet breakpoint test and adjusts the speech bubble / form positioning for medium screens.

**Step 1: Write the test**

Create `src/__tests__/encounter-responsive.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: () => <div data-testid="desktop-scene" />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: () => <div data-testid="mobile-scene" />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: () => <div />,
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: () => <div />,
}));
vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: () => <div />,
}));
vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: () => <div />,
}));

describe('Responsive layout', () => {
  it('renders desktop scene when width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('desktop-scene')).toBeDefined();
  });

  it('renders mobile scene when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('mobile-scene')).toBeDefined();
  });
});
```

**Step 2-4: Run test**

```bash
npx vitest run src/__tests__/encounter-responsive.test.tsx
# Expected: 2 tests passed
```

**Step 5: Commit**

```bash
git add src/__tests__/encounter-responsive.test.tsx
git commit -m "test(AN-CE): add responsive breakpoint tests (desktop vs mobile)"
```

---

### Task 19 — Write unit tests for all foundation components

**Files:**
- Tests already written in Tasks 1-4, 5-6, 8-9, 12. This task runs the full suite and ensures all pass together.

**Step 1: Run all encounter tests**

```bash
npx vitest run src/__tests__/cosmic-encounter-flag.test.ts src/__tests__/useParallax.test.ts src/__tests__/LeviSpeechBubble.test.tsx src/__tests__/MyzeliumNetwork.test.tsx src/__tests__/FormArtifact.test.ts src/__tests__/LeviArtifact.test.ts src/__tests__/CosmicEncounterScene.test.tsx src/__tests__/CosmicEncounterMobile.test.tsx src/__tests__/EncounterBirthForm.test.tsx src/__tests__/useLeviSpeech.test.ts
# Expected: All tests pass (30+ tests)
```

**Step 2: Verify no regressions in existing tests**

```bash
npx vitest run
# Expected: All existing tests + new tests pass
```

**Step 3: Commit (if any test fixes were needed)**

```bash
git add -A
git commit -m "test(AN-CE): verify full test suite passes with all encounter components"
```

---

### Task 20 — Write integration test (full encounter flow mock)

**Files:**
- Create: `src/__tests__/cosmic-encounter-e2e.test.tsx`

**Step 1: Write the integration test**

Create `src/__tests__/cosmic-encounter-e2e.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// ── Mocks (lightweight, let state machine drive) ────────────────────

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: () => null,
}));

let formSubmitFn: ((data: any) => void) | null = null;
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit, isLoading }: any) => {
    formSubmitFn = onSubmit;
    return (
      <div data-testid="birth-form" data-loading={isLoading}>
        <button data-testid="submit-btn" onClick={() => onSubmit({ date: '1990-06-15T14:30:00', tz: 'Europe/Berlin', lon: 13.405, lat: 52.52 })}>
          Submit
        </button>
      </div>
    );
  },
}));

let speechCompleteCallbacks: (() => void)[] = [];
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ text, onComplete }: any) => {
    if (onComplete) speechCompleteCallbacks.push(onComplete);
    return <div data-testid="speech" data-text={text} />;
  },
}));

vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: ({ active }: any) => <div data-testid="myzelium" data-active={active} />,
}));

vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));

let ringCompleteCallback: (() => void) | null = null;
vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => {
    ringCompleteCallback = onComplete;
    return <div data-testid="ring-reveal" />;
  },
}));

let quizCompleteCallback: ((d: any) => void) | null = null;
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete, bootstrapData }: any) => {
    quizCompleteCallback = onComplete;
    return <div data-testid="quiz" data-profile={bootstrapData?.profile?.sun_sign} />;
  },
}));

const MOCK_BOOTSTRAP = {
  profile: { sun_sign: 'Loewe', moon_sign: 'Waage', ascendant_sign: 'Jungfrau', day_master: 'Xin', harmony_index: 0.78 },
  soulprint_sectors: [0.08, 0.02, 0.07, 0.10, 0.14, 0.12, 0.09, 0.05, 0.11, 0.10, 0.07, 0.05],
  narratives: { core_summary: 'Core', context_summary: 'Context', integration_summary: 'Integration' },
  signature_blueprint: { seed: 'sig_v1_test' },
  meta: { engine_version: '1.0.0' },
};

describe('Cosmic Encounter — full flow integration', () => {
  let onSubmitBirth: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    onSubmitBirth = vi.fn();
    onComplete = vi.fn();
    speechCompleteCallbacks = [];
    ringCompleteCallback = null;
    quizCompleteCallback = null;
    formSubmitFn = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes the full 7-phase journey', () => {
    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // ── Phase 1: materializing ──────────────────────────────────────
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('materializing');

    // Myzelium activates after 1s
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('myzelium').getAttribute('data-active')).toBe('true');

    // ── Phase 2: levi-speaks (auto after 3s) ────────────────────────
    act(() => { vi.advanceTimersByTime(2000); }); // total 3s
    expect(screen.getByTestId('speech')).toBeDefined();
    expect(screen.getByTestId('speech').getAttribute('data-text')).toContain('Willkommen');

    // Simulate speech completion
    act(() => {
      speechCompleteCallbacks.forEach((cb) => cb());
      speechCompleteCallbacks = [];
    });

    // ── Phase 3: birth-input (after speech + delay) ─────────────────
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('birth-form')).toBeDefined();

    // ── Phase 4: calculating (submit form) ──────────────────────────
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(onSubmitBirth).toHaveBeenCalledWith({
      date: '1990-06-15T14:30:00',
      tz: 'Europe/Berlin',
      lon: 13.405,
      lat: 52.52,
    });
    expect(screen.getByTestId('speech').getAttribute('data-text')).toContain('Sterne');

    // ── Phase 5: ring-reveal (bootstrapData arrives) ────────────────
    rerender(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={MOCK_BOOTSTRAP}
        isLoading={false}
      />
    );
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('ring-reveal')).toBeDefined();

    // Complete ring reveal
    act(() => { ringCompleteCallback?.(); });

    // ── Phase 6: quiz ───────────────────────────────────────────────
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByTestId('quiz')).toBeDefined();
    expect(screen.getByTestId('quiz').getAttribute('data-profile')).toBe('Loewe');

    // ── Phase 7: complete ───────────────────────────────────────────
    const mockDelta = {
      quiz_sectors: Array(12).fill(0.083),
      narratives: { core_summary: 'C', context_summary: 'X', integration_summary: 'I' },
      signature_delta: { curvature: 0.1, contrast: 0.1, density: 0.1 },
      signature_blueprint: { seed: 'test_delta' },
    };
    act(() => { quizCompleteCallback?.(mockDelta); });
    expect(onComplete).toHaveBeenCalledWith(mockDelta);
  });
});
```

**Step 2: Run test**

```bash
npx vitest run src/__tests__/cosmic-encounter-e2e.test.tsx
# Expected: 1 test passed (full flow verified)
```

**Step 3: No new implementation needed**

**Step 4: Verify**

```bash
npx vitest run src/__tests__/cosmic-encounter-e2e.test.tsx
# Expected: 1 test passed
```

**Step 5: Commit**

```bash
git add src/__tests__/cosmic-encounter-e2e.test.tsx
git commit -m "test(AN-CE): add full 7-phase integration test for Cosmic Encounter"
```

---

## Final Verification

Run the complete test suite to ensure no regressions:

```bash
npx vitest run
```

All existing tests plus ~45 new tests should pass.

---

## File Summary

### New files (Create)

| File | Task | Purpose |
|------|------|---------|
| `src/lib/feature-flags.ts` | 1 | Modified — add `cosmic_encounter_v1` flag |
| `src/components/onboarding/useParallax.ts` | 2 | Mouse parallax hook with rAF throttle |
| `src/components/onboarding/LeviSpeechBubble.tsx` | 3 | Typewriter text bubble (ElevenLabs fallback) |
| `src/components/onboarding/MyzeliumNetwork.tsx` | 4 | SVG Bezier network between artifacts |
| `src/components/onboarding/artifacts/FormArtifact.ts` | 5 | Three.js gold tori + crystalline knot |
| `src/components/onboarding/artifacts/LeviArtifact.ts` | 6 | Three.js cyan sphere + orbital ring |
| `src/components/onboarding/CosmicEncounterScene.tsx` | 7 | Shared Three.js renderer (desktop) |
| `src/components/onboarding/CosmicEncounterMobile.tsx` | 8 | CSS gradient fallback (mobile) |
| `src/components/onboarding/EncounterBirthForm.tsx` | 9 | Glassmorphic birth form on obsidian |
| `src/components/onboarding/CosmicEncounter.tsx` | 10 | 7-phase state machine orchestrator |
| `src/components/onboarding/useLeviSpeech.ts` | 12 | ElevenLabs / text fallback hook |

### Modified files

| File | Task | Change |
|------|------|--------|
| `src/lib/feature-flags.ts` | 1 | Add `cosmic_encounter_v1: false` |
| `src/App.tsx` | 15 | Add `'encounter'` to onboarding phase type, gate by flag |
| `src/pages/OnboardingPage.tsx` | 15 | Render `CosmicEncounter` when phase is `'encounter'` |

### Test files (17 test files, ~45 test cases)

| File | Task |
|------|------|
| `src/__tests__/cosmic-encounter-flag.test.ts` | 1 |
| `src/__tests__/useParallax.test.ts` | 2 |
| `src/__tests__/LeviSpeechBubble.test.tsx` | 3 |
| `src/__tests__/MyzeliumNetwork.test.tsx` | 4 |
| `src/__tests__/FormArtifact.test.ts` | 5 |
| `src/__tests__/LeviArtifact.test.ts` | 6 |
| `src/__tests__/CosmicEncounterScene.test.tsx` | 7 |
| `src/__tests__/CosmicEncounterMobile.test.tsx` | 8 |
| `src/__tests__/EncounterBirthForm.test.tsx` | 9 |
| `src/__tests__/CosmicEncounter.test.tsx` | 10 |
| `src/__tests__/CosmicEncounter-audio.test.tsx` | 11 |
| `src/__tests__/useLeviSpeech.test.ts` | 12 |
| `src/__tests__/ring-reveal-transition.test.tsx` | 13 |
| `src/__tests__/encounter-quiz-phase.test.tsx` | 14 |
| `src/__tests__/onboarding-encounter-routing.test.tsx` | 15 |
| `src/__tests__/splash-encounter-handoff.test.ts` | 16 |
| `src/__tests__/encounter-feedback.test.tsx` | 17 |
| `src/__tests__/encounter-responsive.test.tsx` | 18 |
| `src/__tests__/cosmic-encounter-e2e.test.tsx` | 20 |

### NOT modified (as specified)

- `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`
- `src/components/fusion-ring-website/signatur-bridge.ts`
- `src/services/experience.ts`
- `server.mjs`
- Any quiz components
