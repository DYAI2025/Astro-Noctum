# Bugfix-Auftrag: FusionRing + Dashboard Kohärenz

> **Repo:** `DYAI2025/Astro-Noctum`
> **Priorität:** P0 + P1 — Ring ist unsichtbar, mehrere Kohärenzprobleme
> **Voraussetzung:** Repo geklont, `npm run dev` läuft
> **Geschätzter Aufwand:** 30–45 Minuten

---

## Übersicht: 5 Fixes, 2 Dateien

| # | Prio | Problem | Datei |
|---|------|---------|-------|
| 1 | P0 | Canvas wird nie initialisiert wenn `animated={true}` | `FusionRing.tsx` |
| 2 | P0 | Ring unsichtbar auf hellem Morning-Theme | `Dashboard.tsx` |
| 3 | P1 | Ring + Quizzes versteckt unter Premium-Content | `Dashboard.tsx` |
| 4 | P1 | `TOTAL_QUIZZES=6` aber nur 3 Quizzes im UI | `useFusionRing.ts` + `Dashboard.tsx` |
| 5 | P1 | Resolution zeigt falsche Prozentzahl | `useFusionRing.ts` |

---

## Fix 1 (P0): Canvas-Initialisierung im animierten Pfad

### Ursache

`configureCanvas()` setzt `canvas.width/height`, holt den 2D Context und cached ihn in `ctxRef.current`. Diese Funktion wird NUR innerhalb von `renderStatic()` aufgerufen (Zeile ~308 in `FusionRing.tsx`).

Wenn `animated={true}` (Dashboard-Default), wird `renderStatic()` nie aufgerufen — der Code springt direkt zu `startAnimationLoop()`. Der Animation-Loop prüft `if (!ctx)` → exit. Der Canvas bleibt leer. Das ist der Grund warum Ben eine leere Fläche mit Prozentzahl sieht.

### Datei: `src/components/FusionRing.tsx`

**Fix 1a — Mount-Effect** (der `useEffect` mit leerem Dependency-Array `[]`, ca. Zeile 423):

Den gesamten Effect-Body ersetzen durch:

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
        if (retried.width === 0) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

**Fix 1b — Signal-Change-Effect** (der `useEffect` mit `[signal, animated, size, ...]` Dependencies, ca. Zeile 366):

Am Anfang des Effect-Bodies einfügen, direkt nach `if (!container) return;`:

```typescript
    // Ensure canvas is configured (may not have happened if animated=true on mount)
    configureCanvas();
```

Und `configureCanvas` zu den Dependencies hinzufügen.

**Fix 1c — ResizeObserver** (der `useEffect` mit dem `new ResizeObserver`, ca. Zeile 387):

Im ResizeObserver-Callback als erste Zeile einfügen:

```typescript
      // CRITICAL: always reconfigure canvas on resize
      configureCanvas();
```

Und bei Resize im animated-Pfad die `animatedRadii` auf die neuen Targets snappen (kein Lerp bei Resize, das sieht sonst aus wie ein Bug):

```typescript
      if (animated) {
        animatedRadii.current = [...targetRadii.current];
        startAnimationLoop();
      } else {
        renderStatic();
      }
```

---

## Fix 2 (P0): Dunkler Ring-Container auf Morning-Theme

### Ursache

Die Sektor-Farben (`#2E7D32`, `#1565C0`, `#E65100`) bei `globalAlpha: 0.85` auf dem hellen Morning-Gradient (`#C8DDF0`, weiße Cards) haben zu wenig Kontrast. Der Ring wäre selbst nach Fix 1 kaum sichtbar.

### Datei: `src/components/Dashboard.tsx`

Den Fusion Ring Abschnitt finden (Kommentar `{/* ═══ FUSION RING (BAZAHUAWA) ═══`):

Die `motion.div` und ihren Inhalt ersetzen durch:

```tsx
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

## Fix 3 (P1): Ring + Quizzes über Premium-Content verschieben

### Ursache

Der Ring und die Quiz-Section stehen im Dashboard unterhalb des ElevenLabs Voice Agent PremiumGate-Blocks. User ohne Premium scrollen nie so weit. Ring und Quizzes sind der Engagement-Hook — die müssen sichtbar sein.

### Datei: `src/components/Dashboard.tsx`

Die beiden Blöcke ausschneiden:
1. `{/* ═══ FUSION RING (BAZAHUAWA) ═══ */}` (ca. Zeile 922–942)
2. `{/* ═══ QUIZ SECTION ═══ */}` (ca. Zeile 944–978)
3. `{/* Quiz Overlay */}` (ca. Zeile 980–990)

Und einfügen direkt NACH dem Interpretations-Block (suche nach dem `</PremiumGate>` das den Interpretations-Teaser schließt — das ist die PremiumGate um Zeile 858, NICHT die Levi-PremiumGate um Zeile 919).

Neue Reihenfolge im Dashboard (von oben nach unten):
1. Astro Header (Sun/Moon/Ascendant + Chinese Zodiac)
2. BaZi Pillars (PremiumGate)
3. Wu-Xing Elemente (PremiumGate)
4. Houses (PremiumGate)
5. Interpretation (Free: 2 Paragraphen, Premium: voll)
6. **Bazahuawa Ring** ← hierhin
7. **Quiz Section** ← hierhin
8. **Quiz Overlay** ← hierhin
9. Levi Voice Agent (PremiumGate)
10. Share Card

---

## Fix 4 (P1): TOTAL_QUIZZES dynamisch machen

### Ursache

In `src/hooks/useFusionRing.ts` Zeile 14:
```typescript
const TOTAL_QUIZZES = 6;  // MVP: Love, Krafttier, Personality, EQ, Aura, Social
```

Aber im Dashboard `QUIZ_CATALOG` (Zeile ~143) sind nur 3 Einträge. Das bedeutet: die Resolution kann maximal 50% erreichen (3/6), obwohl der User ALLE verfügbaren Quizzes abgeschlossen hat. Das ist irreführend und frustrierend.

### Datei: `src/hooks/useFusionRing.ts`

**Option A (sauber):** Den Hook so ändern dass er `totalQuizzes` als Parameter bekommt:

```typescript
export function useFusionRing(
  apiResults: ApiResults | null,
  userId?: string,
  totalQuizzes: number = 3,  // ← NEU: Default auf tatsächlich verfügbare Quizzes
) {
```

Und in `computeFusionSignal` statt `TOTAL_QUIZZES`:

```typescript
    return computeFusionSignal(W, B, X, T, completedQuizzes, totalQuizzes);
```

### Datei: `src/App.tsx`

Den Hook-Aufruf anpassen:

```typescript
const { signal, addQuizResult, completedModules } = useFusionRing(apiData, user?.id, 3);
```

### Datei: `src/components/Dashboard.tsx`

Die `QUIZ_CATALOG` Länge als Quelle der Wahrheit verwenden. Im Dashboard-Props oder an den Hook durchreichen:

```typescript
const QUIZ_CATALOG = [
  { id: 'love_languages', title: 'Liebessprache',  moduleId: 'quiz.love_languages.v1', icon: '🔥' },
  { id: 'krafttier',      title: 'Krafttier',      moduleId: 'quiz.krafttier.v1',      icon: '🐺' },
  { id: 'personality',    title: 'Persönlichkeit', moduleId: 'quiz.personality.v1',     icon: '🎭' },
] as const;
// Wenn später Quizzes hinzukommen, wächst dieser Array → Resolution skaliert automatisch
```

---

## Fix 5 (P1): Resolution-Prozent korrigieren

### Zusammenhang mit Fix 4

Durch Fix 4 zeigt die Resolution jetzt korrekte Werte:
- 0 Quizzes → 0%
- 1 von 3 → 33%
- 2 von 3 → 67%
- 3 von 3 → 100%

Zusätzlich prüfen: Wenn `resolution === 100`, sollte die "Absolviere weitere Tests" Zeile verschwinden. Das ist bereits im Code (`fusionSignal.resolution < 100`), aber nach Fix 4 wird dieser Zustand jetzt tatsächlich erreichbar.

---

## Akzeptanzkriterien

1. `npm run lint` (tsc --noEmit) fehlerfrei
2. Ring ist sichtbar — farbiger Ring auf dunklem Container, auch auf Morning-Theme
3. Ring rendert beim ERSTEN Laden (kein Reload nötig)
4. Ring updatet sich live nach Quiz-Abschluss (animated Morph)
5. Glow-Effekte der Peak-Sektoren sichtbar
6. Zodiac-Symbole in Gold lesbar
7. Ring und Quizzes sind sichtbar OHNE Premium zu kaufen (oberhalb Levi-Section)
8. Nach 3 Quizzes zeigt Resolution "100%"
9. "Absolviere weitere Tests" verschwindet bei 100%
10. Bestehende App-Funktionalität (BAFE, Gemini, 3D Orrery, Auth, ElevenLabs) unverändert

## Nicht im Scope

- Keine neuen Quizzes
- Keine Änderung an der Signal Engine Logik
- Kein BAFE Endpoint
- Kein LeanDeep Integration
- Keine Supabase Schema-Änderungen
