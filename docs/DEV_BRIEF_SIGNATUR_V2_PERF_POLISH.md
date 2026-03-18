# Dev Brief: Signatur V2 — Performance & Sizing Polish

**Repo:** `DYAI2025/Astro-Noctum` (Vite/React, Railway)
**Branch:** Erstelle `feature/signatur-v2-perf-polish`
**Bezug:** Code Review Findings M2 + M3 aus PR #88

---

## Kontext

Die Signatur V2 Engine (`FusionRingCanvasV2.tsx`) rendert bis zu 35.000 Partikel via Three.js. Im Animation-Loop werden 3-4 CPU-seitige Durchlaeufe pro Frame ueber alle Partikel ausgefuehrt (Breathing, Displacement-Lerp, Color-Injection, Centerjump-Flow). Auf Mid-Range Mobile Devices kann das bei 60fps Jank verursachen.

Zusaetzlich ueberschreibt das inline `style` auf dem aeusseren Wrapper-Div die `className`-Prop fuer Dimensionen. Caller, die Tailwind-Klassen fuer Groesse verwenden (`w-20 h-20`), werden von `width: 100%` und `height: 100%` im inline-Style ueberschrieben. Aktuell funktioniert es nur, weil der Parent-Div die Groesse setzt — aber das ist fragil.

---

## M2: Idle Breathing vom CPU in den Vertex-Shader verlagern

### Problem

Im Animation-Loop (`animate()`, Zeilen 942-968) wird fuer jeden der bis zu 35K Partikel pro Frame Folgendes berechnet:

1. `Math.atan2(bz, bx)` — Winkel
2. `Math.sin(na * 3 + t * 0.6)` + `Math.sin(na * 7 + t * 0.3)` — Wellen
3. `Math.sqrt(bx * bx + bz * bz)` — Distanz
4. Richtungsvektor-Normalisierung
5. Layer-spezifische Y-Breathing-Berechnung

Das sind ~10 Trig-Operationen pro Partikel pro Frame = ~350.000 Trig-Calls/Frame @ 60fps = **21 Millionen Trig-Calls/Sekunde** auf der CPU.

### Loesung

Die Idle-Breathing-Logik in den bestehenden Vertex-Shader verlagern. Der Shader hat bereits `uTime`, `position`, und `layer` — alle benoetigten Inputs sind verfuegbar.

### Datei

`src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

### Aenderungen

**1. Vertex-Shader erweitern (Zeilen 252-283)**

Aktueller Shader:
```glsl
void main() {
  vColor = color;
  vLayer = layer;
  float finalSize = size;
  float finalAlpha = alpha;
  vec3 pos = position;

  // Reveal Animation
  float revealScale = 0.2 + uReveal * 0.8;
  pos *= revealScale;
  finalAlpha *= smoothstep(0.0, 0.3, uReveal);
  finalSize *= smoothstep(0.0, 0.1, uReveal);

  // Bridge: pulsing logic
  if (layer == 4.0) { ... }
  // Zodiac Roots
  if (layer == 6.0) { ... }

  vAlpha = finalAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = finalSize * (600.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 80.0);
  gl_Position = projectionMatrix * mvPosition;
}
```

Neuen Block **nach** dem Reveal-Block und **vor** dem Bridge-Block einfuegen:

```glsl
// GPU idle breathing (replaces CPU loop at lines 942-968)
float angle = atan(pos.z, pos.x);
float na = angle < 0.0 ? angle + 6.283185 : angle;
float wave = sin(na * 3.0 + uTime * 0.6) * 0.008
           + sin(na * 7.0 + uTime * 0.3) * 0.004;
float dist = length(pos.xz);
vec2 dir = dist > 0.01 ? pos.xz / dist : vec2(0.0);
pos.x += dir.x * wave;
pos.z += dir.y * wave;

// Layer-differentiated Y breathing
float phase_val = phase; // 'phase' attribute already available
if (layer == 0.0) {
  // Glow: slow, wide float
  pos.y += sin(uTime * 0.25 + phase_val) * 0.05;
} else if (layer >= 2.0 && layer <= 3.0) {
  // Fractal/subfractal: fast micro-vibration
  pos.y += sin(uTime * 1.2 + phase_val) * 0.008;
} else {
  // Curve, bridge, centerjump, zodiac: gentle default
  pos.y += sin(uTime * 0.4 + phase_val) * 0.005;
}
```

Dafuer muss `phase` als Vertex-Attribute im Shader deklariert werden. Pruefen ob `attribute float phase;` schon vorhanden ist — falls nicht, zur Deklaration hinzufuegen:

```glsl
attribute float phase;
```

**2. CPU-Loop entfernen (Zeilen 942-968)**

Den gesamten Block `// Idle particle breathing` bis zur schliessenden Klammer entfernen:

```ts
// ENTFERNEN: Zeilen 942-968
if (!effectRef.current) {
  for (let i = 0; i < particleCount; i++) {
    // ... gesamter breathing loop ...
  }
}
```

Wichtig: `displacementTarget` bleibt fuer den Effect-System-Code bestehen — nur der Idle-Breathing-Teil wird entfernt. Der Effect-Code (Zeilen ~800-930) schreibt weiterhin in `displacementTarget` wenn ein Effect aktiv ist.

**3. `applyDisplacements` nur noch bei aktiven Effects aufrufen**

```ts
// VORHER:
const lerpSpeed = effectRef.current ? 0.12 : 0.06;
applyDisplacements(lerpSpeed);

// NACHHER:
if (effectRef.current) {
  applyDisplacements(0.12);
} else {
  // Reset displacements to zero when no effect active (breathing is in shader)
  if (displacementTarget.some(v => v !== 0)) {
    displacementTarget.fill(0);
    applyDisplacements(0.06);
  }
}
```

### Performance-Gewinn

- **CPU**: 35K * 10 Trig-Ops * 60fps = 21M Ops/s → 0 (GPU uebernimmt)
- **GPU**: ~35K zusaetzliche Vertex-Shader-Instruktionen pro Frame — vernachlaessigbar bei moderner GPU
- **Erwarteter Impact**: Signifikante Frame-Time-Reduktion auf Mobile (~5-15ms pro Frame gespart)

### Testkriterium

1. `npm run lint` — clean
2. Visueller Test: Ring atmet im Idle-Zustand identisch wie vorher
3. Effect-System funktioniert weiterhin (Resonanzsprung, Burst, Crunch)
4. Chrome DevTools Performance Tab: `animate()` Frame-Time < 8ms (vorher ~15-20ms auf Mobile)

### Risiken

- Breathing-Verhalten koennte visuell leicht anders aussehen (GPU-Precision vs CPU). Tolerierbar.
- Edge-Case: Wenn `position`-Buffer durch Effects verschoben wurde und der Shader auf die verschobene Position den Breathing-Offset addiert → doppelte Displacement. Deshalb: `displacementTarget.fill(0)` im Idle-Pfad.

---

## M3: className vs inline Style — Wrapper-Architektur bereinigen

### Problem

`FusionRingCanvas` (Zeile 1467) hat:
```tsx
<div className={className} style={{ width: '100%', height: '100%', background: '#08080e', position: 'relative', overflow: 'hidden' }}>
```

Inline `style` ueberschreibt immer CSS-Klassen. Wenn ein Caller `className="w-20 h-20"` uebergibt, werden Tailwinds `width: 5rem` und `height: 5rem` von `width: 100%` und `height: 100%` im Style-Objekt uebertrumpft.

Aktuell funktioniert es nur, weil alle Caller einen Parent-Div mit fester Groesse haben:
- Dashboard: `<div className="w-20 h-20">` → V2 darin mit `className="w-full h-full"` → `100%` passt
- SignatureReveal: `<motion.div className="relative w-56 h-56">` → selbes Muster

Aber: wenn jemand `<FusionRingCanvasV2 className="w-40 h-40" />` direkt verwendet, wird es ignoriert.

### Loesung

Dimensionen aus dem inline-Style entfernen und per Default-Tailwind-Klassen setzen, die von `className` ueberschrieben werden koennen.

### Datei

`src/components/fusion-ring-website/FusionRingCanvasV2.tsx`

### Aenderungen

**1. Outer Wrapper (Zeile 1467)**

```tsx
// VORHER:
<div className={className} style={{ width: '100%', height: '100%', background: '#08080e', position: 'relative', overflow: 'hidden' }}>

// NACHHER:
<div className={`w-full h-full relative overflow-hidden ${className ?? ''}`} style={{ background: '#08080e' }}>
```

- `w-full h-full` sind Tailwind-Defaults die von uebergebenen Klassen ueberschrieben werden koennen
- `relative` und `overflow-hidden` als Tailwind statt inline
- `background` bleibt als inline-Style (kein Tailwind-Token fuer `#08080e`)

**2. Loading/Fallback States (Zeilen 1444-1457)**

Die Loading- und Fallback-Divs verwenden `className="w-full h-full"`, das ist korrekt — sie fuellen ihren Container.

**3. ThreeScene inner div (Zeile 1053)**

```tsx
// VORHER:
<div ref={canvasRef} style={{ width: '100%', height: '100%', pointerEvents: isMini ? 'none' : 'auto', position: 'relative' }} />

// NACHHER:
<div ref={canvasRef} className="w-full h-full relative" style={{ pointerEvents: isMini ? 'none' : 'auto' }} />
```

`pointerEvents` bleibt als inline-Style, da es dynamisch ist.

### Testkriterium

1. `npm run lint` — clean
2. Dashboard mini-ring (80x80) zeigt V2 korrekt
3. SignatureReveal (224x224 / 288x288 sm) zeigt V2 korrekt
4. `/signatur` Vollansicht fuellt den Container korrekt
5. Test: `<FusionRingCanvasV2 className="w-40 h-40" />` rendert als 160x160px

### Risiken

- Minimal: Tailwind-Klassen-Reihenfolge kann in Edge-Cases zu Spezifitaets-Konflikten fuehren. Tailwind v4 merged Klassen korrekt.

---

## Reihenfolge

```
M2 (Shader-Breathing) → M3 (Wrapper-Styling)
```

M2 ist unabhaengig. M3 beruehrt denselben Wrapper-Div, also nach M2 damit keine Merge-Konflikte.

---

## Dateien NICHT anfassen

- `bazodiac-engine.ts` — Partikel-Generierung bleibt unveraendert
- `signatur-bridge.ts` — Daten-Adapter bleibt
- `Dashboard.tsx`, `FusionRing3D.tsx`, `SignatureReveal.tsx` — nur Caller, keine Aenderungen noetig
- `fusion-ring-audio.ts`, `fusion-ring-input.ts`, `fusion-ring-profile.ts`, `fusion-ring-transit.ts` — untouched

## Akzeptanzkriterien

1. Idle-Breathing ist GPU-seitig (kein CPU-Loop ueber 35K Partikel)
2. `animate()` Frame-Time < 8ms auf Desktop Chrome
3. Effect-System (Resonanzsprung, Burst, Crunch) funktioniert unabhaengig vom Shader-Breathing
4. `className` prop auf `FusionRingCanvasV2` steuert Dimensionen korrekt
5. Alle drei Mount-Points (Dashboard, SignatureReveal, FuRingPage) rendern korrekt
6. `npm run lint` clean, `npm run test` 451/452 pass
