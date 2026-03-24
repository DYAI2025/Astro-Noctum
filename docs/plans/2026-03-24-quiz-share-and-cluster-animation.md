# Quiz Share Button & Cluster Completion Animation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all "Nochmal" restart buttons from quizzes (prevents logic corruption), replace with a "Teilen" share popup (Facebook, Instagram, TikTok, WhatsApp), and implement cluster completion resonance animation on the Signatur ring.

**Architecture:** Two independent workstreams: (A) A reusable `SharePopup` component replaces restart buttons across 15 quiz ResultScreens. (B) Enhanced `ClusterPipeline` + ring resonance effect triggered when a cluster completes — intensity scales with cluster significance. Both converge on the FuRingPage where quiz completion → pipeline energy flow → ring burst.

**Tech Stack:** React 19, Framer Motion (`motion/react`), Tailwind CSS v4, Three.js (via FusionRingCanvasV2), Web Share API with social link fallback.

---

## Workstream A: Share Button (replaces "Nochmal")

### Task 1: Create SharePopup component

**Files:**
- Create: `src/components/SharePopup.tsx`
- Test: `src/__tests__/share-popup.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/__tests__/share-popup.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharePopup } from '@/src/components/SharePopup';

// Mock LanguageContext
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

describe('SharePopup', () => {
  it('renders 4 social media buttons', () => {
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={vi.fn()} />);
    expect(screen.getByLabelText('WhatsApp')).toBeDefined();
    expect(screen.getByLabelText('Facebook')).toBeDefined();
    expect(screen.getByLabelText('Instagram')).toBeDefined();
    expect(screen.getByLabelText('TikTok')).toBeDefined();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={onClose} />);
    fireEvent.click(screen.getByTestId('share-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('generates correct WhatsApp share URL', () => {
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={vi.fn()} />);
    const wa = screen.getByLabelText('WhatsApp');
    expect(wa.getAttribute('href')).toContain('api.whatsapp.com');
    expect(wa.getAttribute('href')).toContain('Krafttier');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/share-popup.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the SharePopup component**

```tsx
// src/components/SharePopup.tsx
import { motion } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface SharePopupProps {
  quizTitle: string;
  resultTitle: string;
  onClose: () => void;
}

const SHARE_BASE_URL = 'https://bazodiac.space';

export function SharePopup({ quizTitle, resultTitle, onClose }: SharePopupProps) {
  const { lang } = useLanguage();

  const shareText = lang === 'de'
    ? `Mein Bazodiac ${quizTitle}-Ergebnis: ${resultTitle}! Finde dein kosmisches Profil:`
    : `My Bazodiac ${quizTitle} result: ${resultTitle}! Find your cosmic profile:`;

  const shareUrl = `${SHARE_BASE_URL}/signatur`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const links = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: '#25D366',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      color: '#1877F2',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: `https://www.instagram.com/`,
      color: '#E4405F',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: `https://www.tiktok.com/`,
      color: '#000000',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="share-backdrop"
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
      />

      {/* Popup */}
      <motion.div
        className="fixed left-1/2 top-1/2 z-[61] w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0D0F14] p-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="mb-4 text-center font-serif text-lg text-white">
          {lang === 'de' ? 'Ergebnis teilen' : 'Share Result'}
        </h3>

        <div className="grid grid-cols-4 gap-3">
          {links.map(link => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-white/10"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: link.color }}
              >
                {link.icon}
              </div>
              <span className="text-[10px] text-white/60">{link.name}</span>
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs text-white/50 transition hover:text-white"
        >
          {lang === 'de' ? 'Schließen' : 'Close'}
        </button>
      </motion.div>
    </>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/share-popup.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/SharePopup.tsx src/__tests__/share-popup.test.tsx
git commit -m "feat(quiz): add SharePopup component for social sharing"
```

---

### Task 2: Replace "Nochmal" with "Teilen" in 12 standard quizzes (template pattern)

These 12 quizzes all share the exact same ResultScreen pattern with `onRestart` prop:

- `CharmeQuiz.tsx`
- `EnergiesteinQuiz.tsx`
- `BlumenwesenQuiz.tsx`
- `CelebritySoulmateQuiz.tsx`
- `DestinyQuiz.tsx`
- `PartyQuiz.tsx`
- `EQQuiz.tsx`
- `KrafttierQuiz.tsx`
- `RpgIdentityQuiz.tsx`
- `SpotlightQuiz.tsx`
- `CareerDNAQuiz.tsx`
- `SocialRoleQuiz.tsx`

**Files:**
- Modify: All 12 files listed above in `src/components/quizzes/`

**Step 1: For EACH quiz, apply the following transformation**

1. **Import SharePopup** at the top:
```tsx
import { SharePopup } from '@/src/components/SharePopup';
```

2. **Add state in ResultScreen** — replace `onRestart` prop with share state:
```tsx
// REMOVE from props: onRestart: () => void;
// ADD state:
const [showShare, setShowShare] = useState(false);
```

3. **Replace the "Nochmal" button** with "Teilen":
```tsx
// REPLACE:
<button onClick={onRestart} className="...">Nochmal</button>

// WITH:
<button
  onClick={() => setShowShare(true)}
  className="flex-1 bg-transparent border border-[#D4AF37]/30 text-white/60 text-sm py-3 rounded-xl hover:border-[#D4AF37] hover:text-white transition-colors flex items-center justify-center gap-2"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
  Teilen
</button>
{showShare && (
  <SharePopup
    quizTitle={"<QUIZ_NAME>"}
    resultTitle={profile.title}
    onClose={() => setShowShare(false)}
  />
)}
```

4. **Remove `onRestart` from ResultScreen call site** — where the parent passes `onRestart={handleStart}`, remove that prop.

5. **Remove the restart handler** (`handleStart` or equivalent) if it's only used by ResultScreen.

**Step 2: Run tests**

Run: `npm run test`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add src/components/quizzes/CharmeQuiz.tsx src/components/quizzes/EnergiesteinQuiz.tsx src/components/quizzes/BlumenwesenQuiz.tsx src/components/quizzes/CelebritySoulmateQuiz.tsx src/components/quizzes/DestinyQuiz.tsx src/components/quizzes/PartyQuiz.tsx src/components/quizzes/EQQuiz.tsx src/components/quizzes/KrafttierQuiz.tsx src/components/quizzes/RpgIdentityQuiz.tsx src/components/quizzes/SpotlightQuiz.tsx src/components/quizzes/CareerDNAQuiz.tsx src/components/quizzes/SocialRoleQuiz.tsx
git commit -m "fix(quiz): replace Nochmal restart with Teilen share button in 12 quizzes"
```

---

### Task 3: Replace restart in LoveLanguagesQuiz

**Files:**
- Modify: `src/components/quizzes/LoveLanguagesQuiz.tsx`

**Key differences from standard pattern:**
- Uses inline ResultScreen (not a separate function component)
- `handleRestart` at line 374 resets `questionIndex`, `scores`, `resultProfile`, `completedRef`, and `screen`
- "Nochmal" button is at line 620-624

**Step 1: Apply transformation**

1. Add `import { SharePopup } from '@/src/components/SharePopup';` and `useState` for `showShare`
2. Add `const [showShare, setShowShare] = useState(false);` alongside other state
3. Replace the "Nochmal" button block (lines 618-624) with "Teilen" button + SharePopup
4. Remove `handleRestart` callback (lines 374-379) — dead code after removal
5. Keep `onClose` button ("Fertig") untouched

**Step 2: Run tests**

Run: `npm run test`

**Step 3: Commit**

```bash
git add src/components/quizzes/LoveLanguagesQuiz.tsx
git commit -m "fix(quiz): replace Nochmal with Teilen in LoveLanguagesQuiz"
```

---

### Task 4: Replace restart in PersonalityQuiz

**Files:**
- Modify: `src/components/quizzes/PersonalityQuiz.tsx`

**Key differences:**
- Uses `restart` callback (line 391) that resets `phase`, `qi`, `answers`, `dim`, `result`
- Button text is "↺ Neu" not "Nochmal" (line 747)
- Result rendering is inline in main component, not a separate ResultScreen function

**Step 1: Apply transformation**

1. Add `import { SharePopup } from '@/src/components/SharePopup';`
2. Add `const [showShare, setShowShare] = useState(false);`
3. Replace "Neu" button (lines 742-748) with "Teilen" + SharePopup
4. Remove `restart` callback (lines 390-397)

**Step 2: Run tests**

Run: `npm run test`

**Step 3: Commit**

```bash
git add src/components/quizzes/PersonalityQuiz.tsx
git commit -m "fix(quiz): replace Neu restart with Teilen in PersonalityQuiz"
```

---

### Task 5: Replace restart in AuraColorsQuiz

**Files:**
- Modify: `src/components/quizzes/AuraColorsQuiz.tsx`

**Key differences:**
- Has `onRestart` prop in ResultScreen (lines 285, 291)
- "Nochmal" at line 440
- ResultScreen is a separate function but receives `onRestart` as prop

**Step 1: Apply transformation**

Same pattern as Task 2, but verify by reading lines 430-445 before editing.

**Step 2: Commit**

```bash
git add src/components/quizzes/AuraColorsQuiz.tsx
git commit -m "fix(quiz): replace Nochmal with Teilen in AuraColorsQuiz"
```

---

## Workstream B: Cluster Completion Resonance Animation

### Task 6: Add cluster significance weights

**Files:**
- Modify: `src/lib/fusion-ring/clusters.ts`

**Step 1: Add significance weight to ClusterDef**

```typescript
export interface ClusterDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  quizModuleIds: string[];
  /** 0–1 significance weight — drives resonance intensity on completion */
  significance: number;
}
```

Add `significance` to each cluster in `CLUSTER_REGISTRY`:
- naturkind: `0.7` (4 quizzes, nature-grounding)
- mentalist: `0.8` (3 quizzes, emotional depth)
- stratege: `0.75` (4 quizzes, strategic identity)
- mystiker: `0.85` (4 quizzes, deep archetypal)
- kinky: `0.9` (4 premium quizzes, vulnerable)
- partner_match: `1.0` (4 premium quizzes, relational peak)

**Step 2: Commit**

```bash
git add src/lib/fusion-ring/clusters.ts
git commit -m "feat(cluster): add significance weights to cluster definitions"
```

---

### Task 7: Enhance ClusterPipeline with energy flow animation

**Files:**
- Modify: `src/components/signatur/ClusterPipeline.tsx`

**Step 1: Add significance-based intensity**

The current animation is fixed 2.5s with 3 small particles. Enhance to:
- Scale particle count and glow intensity by a `significance` prop
- Add a trailing comet effect
- Increase duration for higher significance

**Step 2: Update props and animation**

```tsx
interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
  significance?: number; // 0-1
}
```

In the `animate` phase, scale:
- Particle glow radius: `8px + significance * 16px`
- Box shadow spread: `10px + significance * 30px`
- Duration: `1.5s + significance * 1.5s` (1.5–3s range)
- Add a 4th "comet" particle for significance > 0.8

**Step 3: Commit**

```bash
git add src/components/signatur/ClusterPipeline.tsx
git commit -m "feat(pipeline): scale energy flow animation by cluster significance"
```

---

### Task 8: Pass significance to ClusterPipeline in FuRingPage

**Files:**
- Modify: `src/pages/FuRingPage.tsx`

**Step 1: Pass significance prop**

```tsx
// Line ~137: Add significance prop
<ClusterPipeline
  key={cluster.id}
  clusterId={cluster.id}
  clusterColor={cluster.color}
  isComplete={
    isClusterComplete(cluster, completedModuleIds) ||
    justCompletedCluster === cluster.id
  }
  significance={cluster.significance}
/>
```

**Step 2: Scale ring effect intensity by significance**

In `handleQuizComplete` (~line 53), pass significance to effect:
```tsx
setRingEffect({
  type: 'burst',
  color: cluster.color,
  timestamp: Date.now(),
  intensity: cluster.significance,  // NEW — drives resonance reaction
});
```

Update the `effectTrigger` type to include optional `intensity`:
```tsx
const [ringEffect, setRingEffect] = useState<{
  type: string;
  color?: string;
  timestamp: number;
  intensity?: number;
} | null>(null);
```

**Step 3: Commit**

```bash
git add src/pages/FuRingPage.tsx
git commit -m "feat(signatur): pass cluster significance to pipeline and ring effect"
```

---

### Task 9: Add resonance reaction to FusionRing3D

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx`

**Step 1: Forward intensity to FusionRingCanvasV2**

The `effectTrigger` prop already flows through. In `FusionRing3D`, where it passes `effectTrigger` to the canvas (~line 122), ensure the `intensity` field is forwarded.

**Step 2: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "feat(ring): forward effect intensity to canvas renderer"
```

---

### Task 10: Implement resonance burst in FusionRingCanvasV2

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

**Step 1: Scale burst effect by intensity**

In the effect handling code (around line 783+), when `eff.type === 'burst'`:
- Read `intensity` from the effect trigger (default 1.0)
- Scale `effectIntensityMultiplier` by `1.0 + intensity * 2.0` (range 1.0–3.0)
- Scale `effectLight1.intensity` by `amp * (3 + intensity * 5)` (range 3–8)
- Scale duration: higher intensity = longer sustain (1s → 3s)
- Add color tinting from `eff.color` to the effect lights

**Step 2: Add "resonance wave" sub-effect for burst**

After the initial burst flash, add a secondary oscillation:
- Ring displacement wave that ripples outward
- Frequency proportional to intensity
- Duration: `500ms + intensity * 1500ms`

This uses the existing displacement system (line ~219) by temporarily increasing displacement amplitude.

**Step 3: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx
git commit -m "feat(ring): implement intensity-scaled resonance burst with displacement wave"
```

---

### Task 11: Write integration test for cluster completion flow

**Files:**
- Create: `src/__tests__/cluster-completion.test.ts`

**Step 1: Write test**

```typescript
import { describe, it, expect } from 'vitest';
import { CLUSTER_REGISTRY, isClusterComplete, findClusterForModule } from '@/src/lib/fusion-ring/clusters';

describe('cluster completion flow', () => {
  it('each cluster has a significance weight between 0 and 1', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      expect(cluster.significance).toBeGreaterThanOrEqual(0);
      expect(cluster.significance).toBeLessThanOrEqual(1);
    }
  });

  it('completing the last quiz in a cluster triggers isClusterComplete', () => {
    const cluster = CLUSTER_REGISTRY[0]; // naturkind
    const partial = new Set(cluster.quizModuleIds.slice(0, -1));
    expect(isClusterComplete(cluster, partial)).toBe(false);

    const full = new Set(cluster.quizModuleIds);
    expect(isClusterComplete(cluster, full)).toBe(true);
  });

  it('findClusterForModule returns cluster with significance', () => {
    const cluster = findClusterForModule('quiz.kinky_01.v1');
    expect(cluster).not.toBeNull();
    expect(cluster!.significance).toBe(0.9);
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/cluster-completion.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/cluster-completion.test.ts
git commit -m "test(cluster): add integration tests for cluster completion + significance"
```

---

### Task 12: Final verification

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All 586+ tests pass

**Step 2: Run TypeScript check**

Run: `npm run lint`
Expected: Clean, no errors

**Step 3: Manual smoke test checklist**

- [ ] Open `/signatur` page
- [ ] Start any quiz from ClusterSidebar
- [ ] Complete quiz → ResultScreen shows "Teilen" button (NOT "Nochmal")
- [ ] Click "Teilen" → SharePopup opens with 4 social links
- [ ] Click WhatsApp → opens WhatsApp share URL
- [ ] Close popup → back to ResultScreen
- [ ] Click "Fertig" → overlay closes
- [ ] Completed quiz shows checkmark in sidebar, button disabled
- [ ] Complete all quizzes in a cluster → pipeline animation fires
- [ ] Ring shows burst effect with cluster color

**Step 4: Final commit**

```bash
git commit -m "feat(signatur): quiz share buttons + cluster resonance animation — complete"
```
