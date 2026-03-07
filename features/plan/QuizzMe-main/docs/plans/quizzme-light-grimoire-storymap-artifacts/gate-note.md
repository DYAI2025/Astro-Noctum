# Gate Note — QuizzMe Light‑Grimoire Character Sheet
Stand: 2025-12-13

## Entscheidungsreife (Ready-to-build)
**Ja — buildable**, unter folgenden expliziten Annahmen:
- A1: Frontend ist React/Next.js + TypeScript + Tailwind; Motion via Framer Motion.
- A2: `GET /api/profile/psyche` liefert `psyche_profile_v1` (optional: `last_delta`).
- A3: Wertebereiche: Kernwerte/Achsen sind 0..1.

## Produktentscheidungen (festgezogen)
- **Look:** Light‑Grimoire (helles Pergament, dark‑ink Text, Gold nur Linien/Icons).
- **Optional:** `FRAME_MODE=hybrid` (dünner Emerald‑Frame) als Token‑Switch; Default `FRAME_MODE=light`.
- **Layout:** Desktop 12‑col (7/5), Mobile Stack, Reihenfolge: Core → Klima → Derived → Archetype → Footer.
- **Delta‑Banner:** auto‑dismiss 8–12s + manuell schließbar.

## Abhängigkeiten
- API Endpoint + Auth/Session (falls nötig) für Profile Fetch.
- UI Tooltip/Popover Library oder eigene minimal implementierte Tooltip‑Komponente.
- E2E Test Runner (Playwright/Cypress) + stabile Test‑Fixtures (Mock API).

## Hauptrisiken & Mitigation
- **R1 Kontrast (Gold auf Beige):** Gold nie als Fließtext; Buttons/Text‑Kontrast in Dark‑Ink prüfen.
- **R2 Ornament‑Overload:** Watermarks strikt 4–8% Opacity; keine busy Texturen; Lazy‑Load non‑critical.
- **R3 Deltas fehlen:** Fallback Snapshot‑Diff; Unit Tests für Movers‑Berechnung.
- **R4 Scope creep:** OG‑Images / volle Timeline bleiben out-of-scope v1.

## Nächster Slice (Empfohlen)
**SL‑1 (MVP Walking Skeleton)** zuerst shippen:
- End‑to‑End: Result → /character → Werte + Derived + Banner + Copy Link
- Robustheit: optional fields crashen nie
- A11y‑Baseline: Keyboard/Fokus

## Exit‑Criteria für SL‑1
- SC‑1 (Layout) erfüllt: Desktop/Mobile Screenshots ohne Bugs
- Derived Stats korrekt + Unit Tests grün
- Banner sichtbar/close/auto‑dismiss funktioniert
- Component Test „ohne optionale Felder“ grün
