# US-sig-cymatics-bazi-frequency-signature: BaZi-Pfeiler als lebendes Chladni-Frequenzbild auf Signatur-Seite

**Status**: Draft

**Source**: [GOAL-signatur-cymatics](../goals/GOAL-signatur-cymatics.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich auf der Signatur-Seite meine BaZi-Vier-Pfeiler als lebendes Chladni-Frequenzbild sehen — keine statische Grafik, sondern ein aktiv schwingendes (m, n, α, β)-Muster, das meine individuellen Stämme und Zweige abbildet — damit meine Signatur physisch / akustisch-visuell fundiert wirkt statt als abstrakte Dekoration.

## Akzeptanzkriterien (Gherkin)

### AC-1: Deterministisches Muster pro User
- **Gegeben** mein BaZi-Chart enthält Day-Master `Ji` (Erde) und Year-Tier `Mao` (Hase / Holz),
- **Wenn** die Signatur-Seite im 2D-Mode rendert,
- **Dann** zeigt die Cymatics-Oberfläche ein spezifisches (m, n, α, β)-Muster, das reproduzierbar aus `baziToChladniParams(pillars, wuxingWeights, harmonyIndex)` hervorgeht (gleiche Eingabe → gleiches Muster).

### AC-2: Wu-Xing-Farb-Kodierung
- **Gegeben** mein `wuxing.dominant_element` ist `Earth`,
- **Wenn** das Cymatics-Canvas rendert,
- **Dann** ist die Grundfarbe des Musters die festgelegte Erde-Farbe der Palette (dokumentiert in `src/lib/cymatics/bazi-to-chladni.ts` `ELEMENT_COLORS`).

### AC-3: Cymatics ist Default-Renderer (kein Feature-Flag)
- **Gegeben** die Signatur-Seite lädt für einen beliebigen User,
- **Wenn** der 2D-Mode aktiv ist,
- **Dann** rendert immer das Chladni-Cymatics-Canvas (oder der `CymaticsFallback` bei fehlenden `chladniParams` — kein V1/V2/V3 Fallback).

### AC-4: Harmony-Index beeinflusst Amplitude / Sättigung
- **Gegeben** der `wuxing.harmony_index` liegt zwischen 0.0 und 1.0,
- **Wenn** sich der Wert ändert (Transit-Update),
- **Dann** reflektiert die Cymatics-Darstellung die Veränderung (z.B. Muster-Schärfe, Partikel-Dichte) — höherer Index = klareres Muster.

### AC-5: Keine Zahlen in der UI
- **Gegeben** das Cymatics-Canvas rendert,
- **Wenn** der User die Signatur-Seite ansieht,
- **Dann** sind die internen (m, n, α, β)-Werte nicht als sichtbare Zahlen im Hauptansichts-Layout zu finden (nur in DEV-Debug-Panel oder Tooltip erlaubt).

### AC-6: Pinyin-Stem-Support
- **Gegeben** BAFE liefert Himmelsstämme in Pinyin (`Jia`, `Yi`, `Bing`, `Ding`, ...),
- **Wenn** `STEM_NAME_TO_INDEX` das Mapping ausführt,
- **Dann** wird der korrekte Index zurückgegeben (nicht Fallback `?? 0`, der das Bug-Pattern "alle User kollabieren auf (m=2, n=2)" erzeugen würde).

## Verifikation

- **Tests:** `src/__tests__/cymatics-bridge.test.ts` (26 Unit-Tests), `src/__tests__/cymatics-integration.test.tsx`, `src/components/signatur-cymatics/__tests__/SignaturCymaticsCanvas.test.tsx`
- **Prod-Verifikation:** User-Diversitäts-Test auf 50 Prod-Profilen — ≥80% unterschiedliche (m, n)-Paare
- **Canvas-Prüfung:** 2D-Toggle aktiv → `data-testid="signatur-cymatics-canvas"` gemountet, `data-testid="signatur-v1-canvas"` nicht gemountet

## Referenzen

- Plan-Phase: Sprint S-CYMATICS (tasks.md Phase: Sprint S-CYMATICS — Cymatics/Chladni Signatur-Engine)
- Decision: [DEC-cymatics-renderer](../../2-design/decisions/DEC-cymatics-renderer.md)
- Goal: [GOAL-signatur-cymatics](../goals/GOAL-signatur-cymatics.md)
- Requirement: [REQ-F-signatur-cymatics](../requirements/REQ-F-signatur-cymatics.md)
- Handoff-Notiz: Sprint S-CYMATICS abgeschlossen 2026-04-17, dokumentiert in CLAUDE.md "Implementation progress (2026-04-17)"

## Notes

Diese User-Story wurde retroaktiv am 2026-04-23 während der Gap-Analyse angelegt, um GOAL-signatur-cymatics aus der Orphan-Liste zu nehmen. Die Implementierung ist bereits geshipped (Sprint S-CYMATICS completed 2026-04-17 mit 13 Tasks in 4 Phasen) — diese US rekonstruiert das User-Value-Narrativ für Traceability.
