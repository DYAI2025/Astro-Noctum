# Story Slices — QuizzMe Light‑Grimoire Character Sheet
Stand: 2025-12-13

## Framing
- **Actor (primär):** Quiz‑Teilnehmer:in
- **Outcome:** Eine premium‑wirkende, helle Character‑Sheet‑Seite (/character) im „Modern Alchemy – grounded mystic“ Look (Light‑Grimoire), die `psyche_profile_v1` robust rendert, `derived_stats_v1` im Frontend berechnet und After‑Quiz‑Deltas verständlich zeigt.
- **KPIs (global):**
  - **SC‑1:** Layout Desktop/Mobile ohne Layout‑Bugs (Screenshots + Review)
  - **SC‑2:** Quiz→Update Flow: Banner + Updates funktionieren (E2E)
  - **SC‑3:** Lighthouse Accessibility ≥ 90 auf `/character`
  - **SC‑4:** Keine Crashes bei fehlenden optionalen Feldern (Tests)
  - **SC‑5:** ≥80% UI via Shared Components/Tokens

---

## SL‑1 — MVP (Walking Skeleton, End‑to‑End)
**Ziel/Outcome:** Nutzer:in kann nach Quiz‑Completion den Charakterbogen öffnen, Werte sehen, abgeleitete Werte korrekt bekommen, After‑Quiz‑Delta‑Banner sehen und den Link kopieren — **ohne** Ornament‑Overload und **ohne** komplexe Motion.

### Enthaltene Stories (Must‑Have)
- US-001 Theme‑Tokens (Light‑Grimoire)
- US-002 Typografie (Serif/Sans + Scale)
- US-003 /character Route + Grid Scaffold (7/5 Desktop, Stack Mobile)
- US-004 Types für `psyche_profile_v1` inkl. optional fields
- US-005 Profile Fetch + Graceful Degradation
- US-006 Derived Stats + Unit Tests
- US-007 Header Copy
- US-009 StatBarRow (reusable)
- US-008 CoreStatsCard (5 Kernwerte)
- US-010 ClimateCard + AxisRail (mind. 5 Achsen)
- US-012 DerivedStatsCard + StatPills (4 Werte)
- US-016 Movers‑Berechnung (last_delta bevorzugt, sonst diff)
- US-015 Delta‑Banner (8–12s + close)
- US-014 Footer CTA „Link kopieren“
- US-020 A11y‑Baseline (Keyboard/Fokus/aria für Kern-UI)
- US-022 Component Test: optional fields fehlen → kein Crash
- US-026 Result‑CTA → /character (wenn Result‑Page existiert)

### Slice‑DoD
- `/character` rendert **vollständig**: Core (5) + Klima (>=5) + Derived (4) + Footer CTA
- Derived‑Formeln stimmen und sind getestet (US-006)
- Banner zeigt 1–3 Movers und ist auto‑dismiss + close (US-015)
- Mindestens 1 Component‑Test für „optional fields fehlen“ (US-022)
- Manuelle Screenshots Desktop/Mobile abgelegt (SC‑1)

### Slice‑KPIs (Messbar)
- 0 Crashes bei fehlenden optional fields (Unit/Component)
- Banner erscheint zuverlässig nach Profil‑Update (manuell + E2E später)
- Lighthouse A11y Ziel für SL‑1: **≥ 85** (>=90 in SL‑2)

### Risiken/Notizen
- **R1 Kontrast:** Gold darf kein Text sein (Tokens erzwingen).
- **R3 Delta‑Quelle:** falls `last_delta` fehlt → diff fallback muss stabil sein.

---

## SL‑2 — Motion + Ornament + A11y Hardening
**Ziel/Outcome:** Updates fühlen sich „magisch aber ruhig“ an: Delta‑Animationsdauer per clamp‑Formel; Ornamente sind subtil (4–8%); A11y erreicht Zielwert.

### Enthaltene Stories
- US-017 Delta‑Driven Animation System (clamp + reduced motion)
- US-018 Highlight Rules (glow + delta chip timing)
- US-019 Ornament Layer (corners + watermark)
- US-023 Performance (SVG optimieren, lazy‑load non‑critical)
- US-029 Responsive Snapshot Baseline (Desktop/Mobile)
- US-028 Lighthouse A11y Gate (>=90)

### Slice‑DoD
- Animationen folgen: `duration_ms = clamp(450, 1400, 450 + 1200 * delta_mag)`
- `prefers-reduced-motion` → nur Crossfade + Number Tween <=250ms
- Ornamente beeinträchtigen Lesbarkeit nicht (Opacity 4–8%)
- Lighthouse A11y ≥ 90 (SC‑3)

### Slice‑KPIs
- Lighthouse A11y **≥ 90**
- Keine „jitter“ Effekte im Light Theme (QA‑Check)
- LCP/INP nicht sichtbar verschlechtert durch Ornamente (Smoke‑Check)

---

## SL‑3 — Story/Narrative + ChangeLog v1 + Hybrid‑Frame Option
**Ziel/Outcome:** Optionaler narrativer Mehrwert ohne Labeling; „Details“ zum Delta; optionaler Emerald‑Frame als Theme‑Variante.

### Enthaltene Stories
- US-013 ArchetypeStoryCard (optional, „Modus/Anteil“ Copy)
- US-025 ChangeLogAccordion minimal (Banner‑CTA öffnet Details)
- US-024 FRAME_MODE (light vs hybrid)

### Slice‑DoD
- Archetypen/Story rendert robust (fehlende Felder → kein Crash)
- Delta‑Details können geöffnet/geschlossen werden
- Frame‑Option via Token ohne Layout‑Break

---

## SL‑4 — Handoff & Sustainability
**Ziel/Outcome:** Übergabe so, dass Implementierung/Erweiterung ohne Rückfragen funktioniert; Map bleibt „lebendig“.

### Enthaltene Stories
- US-027 Handoff Paket (Docs + Assets + Checklist)

### Slice‑DoD
- `docs/handoff/character-sheet.md` vollständig
- Komponentenliste, Token‑Mapping, Ornament‑Regeln, Copy‑Strings und QA‑Checklist enthalten

---

## Definition of Done (global)
- Alle Stories erfüllen INVEST (klein, testbar, klarer Wert)
- Jede Story hat Gherkin‑AC (Given/When/Then) in `story-map.json`
- A11y: Fokus, Keyboard, nicht nur Farbe, Kontrast (AA)
- Reduced Motion: keine langen Animationen bei `prefers-reduced-motion`
- Optional‑Felder crashen nie (Tests)

