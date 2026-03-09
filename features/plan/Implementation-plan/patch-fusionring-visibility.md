# Patch: FusionRing sichtbar machen

> **Repo:** `DYAI2025/Astro-Noctum`
> **Betrifft:** `src/components/FusionRing.tsx`, `src/components/Dashboard.tsx`
> **Priorität:** P0 — Ring ist aktuell komplett unsichtbar

---

## Bug 1: Canvas wird nie initialisiert wenn `animated={true}`

### Ursache

`configureCanvas()` setzt `canvas.width/height`, holt den 2D Context und cached ihn in `ctxRef.current`. Diese Funktion wird NUR innerhalb von `renderStatic()` aufgerufen (Zeile 308). Wenn `animated={true}` (Dashboard-Default), wird `renderStatic()` nie aufgerufen — stattdessen springt der Code direkt zu `startAnimationLoop()`. Der Animation-Loop prüft `if (!ctx)` → exit. Canvas bleibt leer.

Betroffen: Mount-Effect (Zeile 423), Signal-Change-Effect (Zeile 366), ResizeObserver (Zeile 387).

### Fix

`configureCanvas()` muss VOR `startAnimationLoop()` aufgerufen werden — an allen drei Stellen.

**Datei: `src/components/FusionRing.tsx`**

#### Fix 1a: Mount-Effect (Zeile 423–446)

Ersetze den gesamten Mount-Effect:

```typescript
  // Initial render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // CRITICAL: configureCanvas MUST run before any drawing/animation
    const { width } = configureCanvas();

    // If container has no width yet (layout not ready), retry after a frame
    if (width === 0) {
      const retryId = requestAnimationFrame(() => {
        const retried = configureCanvas();
        if (retried.width === 0) return; // still no layout, ResizeObserver will catch it

        const baseRadius = getBaseRadius(retried.width);
        const initial = computeTargetRadii(signalRef.current.sectors, baseRadius);
        animatedRadii.current = [...initial];
        targetRadii.current = [...initial];

        if (animated) {
          startAnimationLoop();
        } else {
          renderStatic();
        }
      });
      return () => cancelAnimationFrame(retryId);
    }

    const baseRadius = getBaseRadius(width);
    const initial = computeTargetRadii(signal.sectors, baseRadius);
    animatedRadii.current = [...initial];
    targetRadii.current = [...initial];

    if (animated) {
      startAnimationLoop();
    } else {
      renderStatic();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

#### Fix 1b: Signal-Change-Effect (Zeile 366–384)

Ersetze:

```typescript
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ensure canvas is configured (may be first render after mount retry)
    configureCanvas();

    const rect = container.getBoundingClientRect();
    let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
    if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
    cssSize = Math.min(cssSize, MAX_SIZE);

    const baseRadius = getBaseRadius(cssSize);
    const newTargets = computeTargetRadii(signal.sectors, baseRadius);
    targetRadii.current = newTargets;

    if (animated) {
      startAnimationLoop();
    } else {
      renderStatic();
    }
  }, [signal, animated, size, getBaseRadius, renderStatic, startAnimationLoop, configureCanvas]);
```

#### Fix 1c: ResizeObserver (Zeile 387–411)

Ersetze den ResizeObserver-Callback:

```typescript
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // CRITICAL: always reconfigure canvas on resize
      configureCanvas();

      const rect = container.getBoundingClientRect();
      let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
      if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
      cssSize = Math.min(cssSize, MAX_SIZE);

      const baseRadius = getBaseRadius(cssSize);
      targetRadii.current = computeTargetRadii(signalRef.current.sectors, baseRadius);

      if (animated) {
        // Snap animated radii to new targets (resize = instant, no lerp)
        animatedRadii.current = [...targetRadii.current];
        startAnimationLoop();
      } else {
        renderStatic();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [animated, size, getBaseRadius, renderStatic, startAnimationLoop, configureCanvas]);
```

---

## Bug 2: Ring unsichtbar auf hellem Morning-Theme

### Ursache

Die Sektor-Farben (`#2E7D32`, `#1565C0`, `#E65100`) bei `globalAlpha: 0.85` auf dem hellen Morning-Gradient (`#C8DDF0`, weiße Cards) haben zu wenig Kontrast. Der Ring rendert korrekt, ist aber visuell kaum wahrnehmbar.

### Fix

Der Ring bekommt einen eigenen dunklen Container im Dashboard — eine obsidian-farbene Card die den Kontrast herstellt.

**Datei: `src/components/Dashboard.tsx`**

Ersetze den Fusion Ring Abschnitt (Zeilen 922–942):

```tsx
      {/* ═══ FUSION RING (BAZAHUAWA) ═══════════════════════════════ */}
      {fusionSignal && (
        <motion.div className="mb-16" {...fadeIn(0.5)}>
          <div
            className="mx-auto flex flex-col items-center gap-4 rounded-2xl px-6 py-8"
            style={{
              background: 'radial-gradient(ellipse at center, #0a0f1a 0%, #00050A 70%)',
              border: '1px solid rgba(212, 175, 55, 0.12)',
              boxShadow: '0 0 60px rgba(0,5,10,0.5), inset 0 0 30px rgba(0,0,0,0.3)',
              maxWidth: '520px',
            }}
          >
            <h2
              className="font-serif text-xl tracking-wide"
              style={{ color: '#D4AF37' }}
            >
              {lang === "de" ? "Dein Bazahuawa" : "Your Bazahuawa"}
            </h2>
            <FusionRing
              signal={fusionSignal}
              size={360}
              showLabels={true}
              animated={true}
            />
            {fusionSignal.resolution < 100 && (
              <p className="text-sm" style={{ color: 'rgba(212, 175, 55, 0.45)' }}>
                {lang === "de"
                  ? `Auflösung: ${fusionSignal.resolution}% — Absolviere weitere Tests`
                  : `Resolution: ${fusionSignal.resolution}% — Complete more tests`}
              </p>
            )}
          </div>
        </motion.div>
      )}
```

---

## Optional: Ring weiter hoch im Dashboard

Ben möchte Ring + Quizzes oberhalb des Premium-Contents. Falls gewünscht, den gesamten `{/* ═══ FUSION RING */}` und `{/* ═══ QUIZ SECTION */}` Block (Zeilen 922–990) AUSSCHNEIDEN und EINFÜGEN direkt nach dem Interpretations-Bereich (nach Zeile 860, vor dem Levi PremiumGate Block).

Das bedeutet: die Zeilen 922–990 verschieben nach Zeile 860. Die bestehende Reihenfolge der anderen Sektionen bleibt unverändert.

Neue Reihenfolge:
1. Astro Header (Sun/Moon/Ascendant + Chinese Zodiac)
2. BaZi Pillars (PremiumGate)
3. Wu-Xing Elemente (PremiumGate)
4. Houses (PremiumGate)
5. Interpretation (Free: 2 Paragraphen, Premium: voll)
6. **Bazahuawa Ring** ← NEU HIER
7. **Quiz Section** ← NEU HIER
8. Levi Voice Agent (PremiumGate)
9. Share Card

---

## Akzeptanzkriterien

1. Ring ist sichtbar — auf hellem UND dunklem Hintergrund
2. Ring rendert beim ersten Laden (kein Reload nötig)
3. Ring rendert auch wenn `animated={true}` (Dashboard-Default)
4. Ring updatet sich live nach Quiz-Abschluss
5. Glow-Effekte der Peak-Sektoren sind sichtbar
6. Zodiac-Symbole in Gold sind lesbar
7. Auflösungs-Prozent wird korrekt angezeigt
8. Kein Flackern bei Resize/Orientation-Change
