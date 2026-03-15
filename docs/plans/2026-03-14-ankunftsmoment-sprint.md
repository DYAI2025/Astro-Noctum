# Ankunftsmoment Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the post-login arrival experience: Dashboard-first redirect, visible Planetarium, functional Stripe payment, centered FuRing, and richer Wu/Ren content.

**Architecture:** 9 backlog items (AN-11 through AN-19) across 4 milestones. All changes are in the existing React SPA + Express server. No new services, no schema changes. Most changes are in `src/App.tsx`, `src/components/`, `src/lib/astro-data/`, `server.mjs`, and the FusionRing canvas.

**Tech Stack:** React 19, React Router v6, Three.js, Tailwind v4, Express, Stripe, Supabase

---

## Milestone 1: Arrival Fix (AN-11, AN-12)

### Task 1: AN-11 — Force Dashboard redirect after login

**Problem:** `App.tsx` renders `<BrowserRouter>` which picks up the browser's current URL. If a user bookmarks `/fu-ring`, closes the browser, then returns and logs in, they land on `/fu-ring` instead of `/`. There is no explicit post-login navigation to `/`.

**Files:**
- Modify: `src/App.tsx:134-168` (the `BrowserRouter` render block)

**Step 1: Add a NavigateToRoot guard inside AppShell**

In `src/App.tsx`, inside `AppShell`, add a one-time redirect effect. When the user first enters the authenticated app (session just established), force-navigate to `/` unless already there.

```tsx
// Add at top of AppShell function body, after const location = useLocation():
import { useNavigate } from 'react-router-dom';

// Inside AppShell:
const navigate = useNavigate();
const hasRedirected = useRef(false);

useEffect(() => {
  if (!hasRedirected.current && location.pathname !== '/') {
    hasRedirected.current = true;
    navigate('/', { replace: true });
  } else {
    hasRedirected.current = true;
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

This runs once on mount. If the user arrives at `/fu-ring` after login, they get silently redirected to `/`. Subsequent navigation to `/fu-ring` via nav links works normally because `hasRedirected` is already `true`.

**Step 2: Import `useRef` and `useNavigate`**

Add `useRef` to the React import and `useNavigate` to the react-router-dom import at the top of `App.tsx`.

**Step 3: Test manually**

1. Login → should land on Dashboard (`/`)
2. Navigate to Fu-Ring via nav link → should work
3. Refresh on Fu-Ring → should redirect to Dashboard (because new mount)
4. Direct URL `/#/fu-ring` → should redirect to Dashboard

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "fix(AN-11): force dashboard redirect after login"
```

---

### Task 2: AN-12 — Planetarium as visible arrival moment

**Problem:** The BirthChartOrrery is already the first element in `DashboardAstroSection` (line 256), but it may not feel like an "arrival moment" because there's no emphasis or full-viewport treatment.

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:255-291`
- Modify: `src/components/Dashboard.tsx:164-190` (page header)

**Step 1: Verify current orrery placement**

Read `DashboardAstroSection.tsx` lines 255-291. The orrery is rendered first with `autoPlay` on first readings. The "Birth Sky Welcome" banner overlays it. This IS the arrival moment.

**Step 2: Make the Orrery more prominent in the first view**

Increase the orrery's visual weight so it dominates the first viewport:

In `DashboardAstroSection.tsx`, change the orrery wrapper from:
```tsx
<motion.div className="mb-14" {...fadeIn(0.1)}>
```
to:
```tsx
<motion.div className="mb-14 -mx-4 md:-mx-6" {...fadeIn(0.1)}>
```

This lets the orrery bleed to the edges of the container, making it feel more immersive on first load.

**Step 3: Push the page header higher and lighter**

In `Dashboard.tsx`, the page header (lines 164-190) takes visual priority over the orrery. Make it smaller so the orrery appears in the first viewport:

Change the header `mb-12` to `mb-6`:
```tsx
<motion.header className="mb-6 text-center" ...>
```

And reduce the quote's `max-w-xl` to `max-w-md` and text from `text-base` to `text-sm`:
```tsx
<p className="mt-3 italic text-[#1E2A3A]/42 font-serif text-sm leading-relaxed max-w-md mx-auto">
```

**Step 4: Test on Desktop and Mobile**

- Desktop: Orrery should be visible above the fold on 1080p
- Mobile: Orrery should be at least partially visible in first viewport

**Step 5: Commit**

```bash
git add src/components/dashboard/DashboardAstroSection.tsx src/components/Dashboard.tsx
git commit -m "feat(AN-12): make planetarium the visible arrival moment on dashboard"
```

---

## Milestone 2: Revenue Fix (AN-15, AN-16)

### Task 3: AN-16 — Debug Payment Layer visibility

**Problem:** The payment flow exists (`PremiumGate.tsx`, `/api/checkout` in `server.mjs`) but users may not see the upgrade option. Need to isolate: is it config, rendering, or route guard?

**Files:**
- Read: `server.mjs:770-774` (Stripe init)
- Read: `src/components/PremiumGate.tsx` (full file)
- Read: `src/hooks/usePremium.ts` (full file)
- Read: `src/components/dashboard/DashboardAstroSection.tsx:594-687` (PremiumGate usage)

**Step 1: Trace the Stripe visibility chain**

The chain is:
1. `server.mjs:772` — `stripe` is `null` if `STRIPE_SECRET_KEY` is missing → `/api/checkout` returns 503
2. `usePremium.ts` — reads `profiles.tier` from Supabase → `isPremium` bool
3. `PremiumGate.tsx` — if `!isPremium`, shows blur overlay + upgrade CTA
4. `DashboardAstroSection.tsx:594` — wraps Four Pillars + WuXing balance in `PremiumGate`
5. `DashboardAstroSection.tsx:691` — wraps Houses in `PremiumGate`
6. `DashboardInterpretationSection.tsx:52-57` — wraps extended interpretation in `PremiumGate`

The payment layer IS rendered for non-premium users — it's the blurred overlay with the "Upgrade" button. If users don't see it, the likely cause is that `PremiumGate` renders on premium-gated sections which are below the fold.

**Step 2: Add a visible upgrade CTA higher on the Dashboard**

Create a dedicated upgrade banner that appears near the top of the Dashboard (above the fold) for non-premium users:

In `src/components/Dashboard.tsx`, after the page header and before the Astro section, add:

```tsx
{/* Upgrade Banner for free users */}
{!isPremium && (
  <motion.div
    className="mb-8 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-[#D4AF37]/05 to-transparent p-5 flex items-center justify-between gap-4"
    {...fadeIn(0.15)}
  >
    <div>
      <p className="text-sm font-medium text-[#1E2A3A]">
        {lang === 'de' ? 'Schalte dein volles kosmisches Profil frei' : 'Unlock your full cosmic profile'}
      </p>
      <p className="text-xs text-[#1E2A3A]/50 mt-1">
        {lang === 'de'
          ? 'Vier Säulen, Häuser-Analyse, Levi Bazi Sprachagent und mehr'
          : 'Four Pillars, Houses analysis, Levi Bazi voice agent and more'}
      </p>
    </div>
    <UpgradeButton />
  </motion.div>
)}
```

**Step 3: Extract UpgradeButton from PremiumGate**

The checkout logic in `PremiumGate.tsx:24-37` should be reusable. Extract the click handler and button into a separate component:

Create `src/components/UpgradeButton.tsx`:

```tsx
import { useState } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { trackEvent } from "@/src/lib/analytics";
import { authedFetch } from "@/src/lib/authedFetch";

interface Props {
  label?: string;
  className?: string;
}

export function UpgradeButton({ label, className }: Props) {
  const { t } = useLanguage();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async () => {
    trackEvent('upgrade_clicked');
    setIsRedirecting(true);
    try {
      const res = await authedFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setIsRedirecting(false);
    } catch {
      setIsRedirecting(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={isRedirecting}
      className={className || "shrink-0 px-5 py-2.5 bg-[#D4AF37] text-[#00050A] text-sm font-semibold rounded-xl hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-60 disabled:cursor-wait"}
    >
      {isRedirecting ? "..." : (label || t("dashboard.premium.cta"))}
    </button>
  );
}
```

**Step 4: Refactor PremiumGate to use UpgradeButton**

In `src/components/PremiumGate.tsx`, replace the inline button with `<UpgradeButton />`.

**Step 5: Import UpgradeButton in Dashboard.tsx**

Add the upgrade banner from Step 2 to `Dashboard.tsx`.

**Step 6: Verify env vars documentation**

In `.env.example`, ensure these Stripe vars are clearly documented:
- `STRIPE_SECRET_KEY` — required for checkout to work (server returns 503 without it)
- `STRIPE_PRICE_ID` — the Stripe price to charge
- `STRIPE_WEBHOOK_SECRET` — for Stripe webhook verification

**Step 7: Test**

1. Without `STRIPE_SECRET_KEY`: Banner appears, clicking shows error (503) — expected
2. With `STRIPE_SECRET_KEY`: Banner appears, clicking opens Stripe Checkout
3. Premium user: Banner does not appear

**Step 8: Commit**

```bash
git add src/components/UpgradeButton.tsx src/components/PremiumGate.tsx src/components/Dashboard.tsx
git commit -m "feat(AN-15/AN-16): add visible upgrade banner and extract UpgradeButton"
```

---

## Milestone 3: Visual Fix (AN-17, AN-18, AN-19)

### Task 4: AN-17/AN-18 — Scale down and center the FuRing

**Problem:** The FusionRingWebsiteCanvas renders at `window.innerWidth × window.innerHeight` with a camera at distance ~8.5 and 40° FOV. The ring (RADIUS=2) fills most of the viewport. The container in `FusionRing3D.tsx:94` constrains it to `h-[62vh] min-h-[420px] max-h-[760px]` but the Three.js canvas still sizes to window dimensions, not the container.

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx:84,94,639-642`
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:94` (container height)

**Step 1: Fix canvas to use container dimensions instead of window**

In `FusionRingWebsiteCanvas.tsx`, the renderer and camera use `window.innerWidth/innerHeight`. This makes the ring oversized inside the constrained container. Fix by using the container's dimensions:

At line ~72 (inside the `useEffect`), after getting the `canvasRef`:
```tsx
const container = canvasRef.current;
if (!container) return;
const rect = container.getBoundingClientRect();
const width = rect.width;
const height = rect.height;
```

Then replace all instances of `window.innerWidth` with `width` and `window.innerHeight` with `height`:
- Line 84: `renderer.setSize(width, height);`
- Line 94: `new THREE.PerspectiveCamera(40, width / height, 0.1, 100);`

In the resize handler (line 639-642):
```tsx
const onResize = () => {
  const rect = container.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
  // ... keep existing uniform updates
};
```

**Step 2: Zoom the camera out for a smaller ring**

Increase camera distance from `8.5` to `11.5` to make the ring appear ~25% smaller:

Line 96: change from:
```tsx
camera.position.set(0, Math.sin(1.48) * 8.5, Math.cos(1.48) * 8.5);
```
to:
```tsx
camera.position.set(0, Math.sin(1.48) * 11.5, Math.cos(1.48) * 11.5);
```

**Step 3: Ensure horizontal centering**

The ring group is already at origin `(0,0,0)` and camera looks at origin. If there's a visual offset, check if the container has asymmetric padding. In `FuRingPage.tsx:15`, the section has `px-4 md:px-10` — this is symmetric, so no offset.

The `FusionRing3D.tsx:92` container has `overflow-hidden rounded-3xl` which is also symmetric. No X-offset fix needed — the container-based sizing from Step 1 should center it.

**Step 4: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx
git commit -m "fix(AN-17/AN-18): scale down ring and use container-based sizing"
```

---

### Task 5: AN-19 — Responsive check for ring

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:94` (container constraints)

**Step 1: Adjust container height for mobile**

Current: `h-[62vh] min-h-[420px] max-h-[760px]`

On small phones (375px wide, 667px tall), 62vh = 413px which is close to min-h. The ring should have breathing room. Change to:

```tsx
<div className="relative h-[55vh] min-h-[340px] w-full max-h-[700px] sm:h-[62vh] sm:min-h-[420px] sm:max-h-[760px]">
```

This gives mobile a shorter, more proportional container while keeping desktop the same.

**Step 2: Add ResizeObserver instead of window resize**

The resize handler from Task 4 uses `container.getBoundingClientRect()`. To handle responsive layout shifts (e.g., sidebar toggle), use a ResizeObserver in the canvas component:

In `FusionRingWebsiteCanvas.tsx`, replace the `window.addEventListener('resize', onResize)` with:

```tsx
const resizeObserver = new ResizeObserver(() => {
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
  ringMat.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio, 1.5);
  coronaMat.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio, 1.5);
});
resizeObserver.observe(container);
```

And in cleanup, replace `window.removeEventListener('resize', onResize)` with `resizeObserver.disconnect()`.

**Step 3: Test on 3 breakpoints**

- Mobile (375px): Ring fully visible, centered, no clipping
- Tablet (768px): Ring visible, centered
- Desktop (1440px): Ring visible, centered, not oversized

**Step 4: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx
git commit -m "fix(AN-19): responsive ring sizing with ResizeObserver"
```

---

## Milestone 4: Content Fix (AN-13, AN-14)

### Task 6: AN-13 — Expand Wù (戊) Heavenly Stem content

**Problem:** Wù has a single-paragraph dayMaster and monthStem description. The snapshot requires a 5-part structure: Kernbedeutung, persönliche Wirkung, Stabilisierende Qualitäten, Dysbalance/Schatten, Entwicklungsimpuls.

**Files:**
- Modify: `src/lib/astro-data/heavenlyStems.ts:79-88` (Wù entry)

**Step 1: Expand the Wù dayMaster text**

Replace the existing dayMaster content at line 81-83 with a structured 5-part description. The new text should be ~120-150 words per language. Structure:

```
Paragraph 1 (Kernbedeutung): What Wù fundamentally IS — the mountain archetype
Paragraph 2 (Persönliche Wirkung): How it manifests in the person's life, relationships, presence
Paragraph 3 (Stabilisierende Qualitäten): The strengths and gifts this energy provides
Paragraph 4 (Dysbalance/Schatten): Shadow side, risks, what happens when overexpressed
Paragraph 5 (Entwicklungsimpuls): Growth direction, what to cultivate
```

New `dayMaster.en`:
```
Wù 戊 is the mountain — immovable, dependable, and commanding through sheer presence. Your elemental identity is stability itself. In the landscape of the ten Heavenly Stems, you are the foundation upon which everything else is built.

In your relationships and daily life, this translates into a grounding force that others instinctively rely on. You are the person who stays calm when chaos erupts, the one whose word carries weight precisely because you never give it lightly. Trust forms around you like sediment — slowly, but in layers that endure.

Your stabilising gifts are patience, honesty, and an unshakeable sense of duty. You build trust over years and hold it for a lifetime. When you commit, your commitment becomes a landmark that others navigate by.

In shadow, the mountain becomes the wall. Stubbornness, emotional rigidity, and resistance to necessary change are your risks. You may cling to positions, relationships, or habits long after they have stopped serving you — mistaking endurance for wisdom.

Your growth lies in learning to move without losing your centre. A mountain that can shift — even slightly — reshapes the entire landscape. When you allow flexibility into your foundation, your stability transforms from a defence into an invitation.
```

New `dayMaster.de`:
```
Wù 戊 ist der Berg — unbeweglich, verlässlich und befehlend durch pure Präsenz. Deine elementare Identität ist Stabilität selbst. In der Landschaft der zehn Himmelsstämme bist du das Fundament, auf dem alles andere errichtet wird.

In deinen Beziehungen und im Alltag zeigt sich das als erdende Kraft, auf die sich andere instinktiv verlassen. Du bist die Person, die ruhig bleibt, wenn Chaos ausbricht — diejenige, deren Wort Gewicht trägt, gerade weil du es nie leichtfertig gibst. Vertrauen bildet sich um dich wie Sediment — langsam, aber in Schichten, die Bestand haben.

Deine stabilisierenden Gaben sind Geduld, Ehrlichkeit und ein unerschütterliches Pflichtbewusstsein. Du baust Vertrauen über Jahre auf und hältst es ein Leben lang. Wenn du dich verpflichtest, wird deine Verpflichtung zu einem Orientierungspunkt, an dem sich andere ausrichten.

Im Schatten wird der Berg zur Mauer. Sturheit, emotionale Rigidität und Widerstand gegen notwendigen Wandel sind deine Risiken. Du klammerst dich möglicherweise an Positionen, Beziehungen oder Gewohnheiten, lange nachdem sie dir nicht mehr dienen — und verwechselst Ausdauer mit Weisheit.

Dein Wachstum liegt darin, dich bewegen zu lernen, ohne deine Mitte zu verlieren. Ein Berg, der sich verschiebt — selbst leicht — formt die gesamte Landschaft neu. Wenn du Flexibilität in dein Fundament einlässt, verwandelt sich deine Stabilität von einer Verteidigung in eine Einladung.
```

Also expand `monthStem` with similar depth (~80 words per language):

New `monthStem.en`:
```
Wù in your month pillar gives your career a foundation-building quality. You are drawn to roles requiring endurance, trustworthiness, and long-term commitment — management, property, finance, or anything where reliability is the currency.

Your professional reputation grows slowly but becomes unshakeable. Others seek you out not for flash or innovation, but for the certainty that what you build will last. Your challenge at work is delegation: the mountain tries to carry everything alone. Your growth comes from trusting others to share the weight.
```

New `monthStem.de`:
```
Wù in deiner Monatssäule verleiht deiner Karriere eine fundamentbauende Qualität. Du wirst von Rollen angezogen, die Ausdauer, Vertrauenswürdigkeit und langfristiges Engagement erfordern — Management, Immobilien, Finanzen oder alles, wo Zuverlässigkeit die Währung ist.

Dein beruflicher Ruf wächst langsam, wird aber unerschütterlich. Andere suchen dich nicht wegen Glanz oder Innovation, sondern wegen der Gewissheit, dass das, was du aufbaust, Bestand haben wird. Deine Herausforderung im Beruf ist Delegation: Der Berg versucht, alles allein zu tragen. Dein Wachstum entsteht, wenn du anderen vertraust, die Last mitzutragen.
```

**Step 2: Verify no type errors**

```bash
npm run lint
```

**Step 3: Commit**

```bash
git add src/lib/astro-data/heavenlyStems.ts
git commit -m "content(AN-13): expand Wù 戊 stem descriptions with structured depth"
```

---

### Task 7: AN-14 — Expand Rén (壬) Heavenly Stem content

**Files:**
- Modify: `src/lib/astro-data/heavenlyStems.ts:127-137` (Rén entry)

**Step 1: Expand the Rén dayMaster text**

Same 5-part structure as Wù. New `dayMaster.en`:
```
Rén 壬 is the ocean — vast, deep, and governed by currents invisible to the surface. Your elemental identity is one of expansive thinking and philosophical depth. Among the ten Heavenly Stems, you hold the most boundless energy: the power to connect disparate worlds.

In daily life, this manifests as intellectual restlessness and emotional range. Ideas, people, and perspectives flow through you in ways that can be overwhelming but are never shallow. You are drawn to the horizon — to whatever lies beyond the known — and your conversations often leave others with more questions than answers, which is exactly your gift.

Your stabilising qualities are vision, adaptability, and the ability to see connections that span entire systems. Where others see isolated facts, you see currents. Your intuition operates at the level of patterns, not details, which makes you a natural strategist and synthesiser.

In shadow, the ocean becomes the flood. Scattered focus, emotional overwhelm, and an inability to commit to a single direction are your risks. You may start ten projects and finish none, or absorb others' emotions until you lose track of your own. Depth without containment becomes chaos.

Your growth lies in learning to channel without constricting. A river is no less powerful than the ocean — but it moves with purpose. When you give your vast energy a deliberate direction, you become the force that reshapes the landscape.
```

New `dayMaster.de`:
```
Rén 壬 ist der Ozean — weit, tief und von Strömungen regiert, die an der Oberfläche unsichtbar sind. Deine elementare Identität ist die des expansiven Denkens und der philosophischen Tiefe. Unter den zehn Himmelsstämmen trägst du die grenzenloseste Energie: die Kraft, verschiedene Welten zu verbinden.

Im Alltag zeigt sich das als intellektuelle Rastlosigkeit und emotionale Bandbreite. Ideen, Menschen und Perspektiven fließen durch dich auf Weisen, die überwältigend sein können, aber niemals oberflächlich. Du wirst vom Horizont angezogen — von allem, was jenseits des Bekannten liegt — und deine Gespräche hinterlassen bei anderen oft mehr Fragen als Antworten, was genau deine Gabe ist.

Deine stabilisierenden Qualitäten sind Vision, Anpassungsfähigkeit und die Fähigkeit, Verbindungen zu erkennen, die ganze Systeme umspannen. Wo andere isolierte Fakten sehen, siehst du Strömungen. Deine Intuition operiert auf der Ebene von Mustern, nicht von Details, was dich zu einem natürlichen Strategen und Synthesizer macht.

Im Schatten wird der Ozean zur Flut. Verstreuter Fokus, emotionale Überwältigung und die Unfähigkeit, sich auf eine einzige Richtung festzulegen, sind deine Risiken. Du beginnst möglicherweise zehn Projekte und beendest keines, oder absorbierst die Emotionen anderer, bis du den Überblick über deine eigenen verlierst. Tiefe ohne Begrenzung wird zum Chaos.

Dein Wachstum liegt darin, zu kanalisieren, ohne einzuengen. Ein Fluss ist nicht weniger kraftvoll als der Ozean — aber er bewegt sich mit Absicht. Wenn du deiner weiten Energie eine bewusste Richtung gibst, wirst du die Kraft, die die Landschaft neu formt.
```

New `monthStem.en`:
```
Rén in your month pillar shapes a career through exploration, strategy, and broad vision. You thrive in roles that demand big-picture thinking — consulting, academia, travel, diplomacy, or entrepreneurship.

Your social energy is expansive, gathering diverse people into your orbit. Colleagues value your ability to see around corners and synthesise information from unlikely sources. Your professional challenge is focus: the ocean resists being channelled. Your growth comes from choosing depth over breadth in the projects that truly matter.
```

New `monthStem.de`:
```
Rén in deiner Monatssäule formt eine Karriere durch Erkundung, Strategie und weite Vision. Du blühst in Rollen auf, die Weitblick erfordern — Beratung, Akademia, Reisen, Diplomatie oder Unternehmertum.

Deine soziale Energie ist expansiv und sammelt verschiedene Menschen in deinem Orbit. Kollegen schätzen deine Fähigkeit, um Ecken zu denken und Informationen aus unerwarteten Quellen zu synthetisieren. Deine berufliche Herausforderung ist Fokus: Der Ozean wehrt sich dagegen, kanalisiert zu werden. Dein Wachstum entsteht, wenn du bei den Projekten, die wirklich zählen, Tiefe über Breite wählst.
```

**Step 2: Verify no type errors**

```bash
npm run lint
```

**Step 3: Commit**

```bash
git add src/lib/astro-data/heavenlyStems.ts
git commit -m "content(AN-14): expand Rén 壬 stem descriptions with structured depth"
```

---

## Summary: Files Changed

| File | Tasks | What changes |
|------|-------|-------------|
| `src/App.tsx` | AN-11 | Add useRef, useNavigate; post-login redirect to `/` |
| `src/components/Dashboard.tsx` | AN-12, AN-15/16 | Tighter header spacing; upgrade banner |
| `src/components/dashboard/DashboardAstroSection.tsx` | AN-12 | Orrery bleed-to-edges styling |
| `src/components/UpgradeButton.tsx` | AN-15/16 | New: extracted checkout button component |
| `src/components/PremiumGate.tsx` | AN-15/16 | Refactored to use UpgradeButton |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | AN-17/18/19 | Container-based sizing, zoomed camera, ResizeObserver |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | AN-19 | Responsive container heights |
| `src/lib/astro-data/heavenlyStems.ts` | AN-13, AN-14 | Expanded Wù + Rén content |

## Execution Order

1. **AN-11** (Task 1) — redirect fix, no dependencies
2. **AN-12** (Task 2) — dashboard arrival, depends on nothing
3. **AN-15/16** (Task 3) — Stripe visibility, depends on nothing
4. **AN-17/18** (Task 4) — ring scaling, depends on nothing
5. **AN-19** (Task 5) — responsive ring, depends on Task 4
6. **AN-13** (Task 6) — Wù content, depends on nothing
7. **AN-14** (Task 7) — Rén content, depends on nothing

Tasks 1-4 and 6-7 are parallelizable. Task 5 must follow Task 4.
