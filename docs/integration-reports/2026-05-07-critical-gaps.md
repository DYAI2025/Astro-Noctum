# Integration Report — Kritische Fehlstellen (Stand 2026-05-07)

**Vergleich:** Lokaler SDLC-Scaffold (Branch `claude/sdlc-spec-noctum-2026-05-07`, Commit `b361c9e`) gegen den aktiven Produktions-Stand `origin/main` (`f45aef4`) von [github.com/DYAI2025/Astro-Noctum](https://github.com/DYAI2025/Astro-Noctum).

**Quelle des lokalen Scaffolds:** [`docs/dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md`](../dev-briefs/2026-05-07-dashboard-flow-daily-pulse.md).

---

## Kritische Fehlstellen (per User, 2026-05-07)

### 1. Daily Pulse / Tageshoroskop auf dem Dashboard

Das Daily Horoscope (Tageshoroskop) **funktioniert bereits bei den Sprachagenten (Levi & Eve)**, allerdings ohne Verwendung der Aphorismen und nicht vollständig sauber.

**Probleme:**
- Auf dem Dashboard befindet sich aktuell nur ein **Platzhalter**.
- Das vollständige Tageshoroskop wird **nicht über die FooFire API abgerufen**, obwohl die Datenstruktur und der Aufbau in der Dokumentation bereits definiert sind.
- Beim Login des Users muss das vollständige Daily Pulse (inkl. Aphorismen) **automatisch geladen und angezeigt** werden.
- Die Aphorismen sind **nur ein Teil** des gesamten Daily Pulse Features, nicht das Feature selbst.

**Konsequenz für den lokalen Scaffold:** Das aktuelle `GOAL-aphorism-personalized-interpretation` rahmt Aphorismus + Council als das Feature und verfehlt damit die korrekte Granularität. Korrekt wäre eine übergeordnete Strategie wie `GOAL-daily-pulse-dashboard-integration` mit Sub-Anforderungen für FuFirE-Anbindung, Auto-Load bei Login, und Aphorismus/Council als ein Slot innerhalb des Daily Pulse.

### 2. Signatur 3D als Kugel mit Wuxing-Element-Overlay

Die 3D-Signaturkugel ist bereits implementiert, wird aber **im Dashboard nicht angezeigt**. Sie muss entsprechend der bestehenden Dokumentation im Dashboard-Flow verankert werden.

**Konsequenz für den lokalen Scaffold:** Das lokale `GOAL-discoverable-signature-anchor` adressiert genau diese Lücke. Auf `origin/main` existieren bereits 5+ Signatur-bezogene Goals (`GOAL-signatur-cymatics`, `-realtime-consistency`, `-phase2-density`, `-phase3-matching`, `GOAL-dashboard-signatur-hygiene`). Die *Integration in Dashboard-Flow* fehlt allerdings als explizites Requirement — hier liefert der lokale Scaffold konkreten Mehrwert (`REQ-USA-signature-first-viewport`, `REQ-USA-signature-empty-state`, `REQ-REL-signature-error-isolation`, `REQ-PERF-signature-no-direct-embed`).

### 3. GDPR / Datenschutz & Compliance

**Es existiert keinerlei Dokumentation oder Anforderungen zu Datenschutzthemen** auf `origin/main`.

**Verifiziert per Audit:**
- 0 Requirements in `1-objectives/requirements/` matchen `gdpr|consent|privacy|rtbf|export|pii|data-subject`.
- 0 Constraints adressieren GDPR oder vergleichbare Compliance-Pflichten.
- Astro-Noctum verarbeitet allerdings sensible personenbezogene Daten (Geburtsdatum / -uhrzeit / -ort, Stripe-Billing-Daten, LLM-Prompts mit Personenbezug). Bei deutschsprachiger Zielgruppe ist EU-GDPR die Grundlage, nicht optional.

**Konsequenz für den lokalen Scaffold:** Die 6 lokalen `REQ-COMP-*` Requirements + `CON-gdpr-applies` + `GOAL-gdpr-compliant-data-handling` decken diese Lücke ab. Sie sind die wertvollste Einzel-Auslieferung dieses Scaffolds an das Produktions-Repo.

---

## Audit-Anhang: Vollständiger Vergleich Lokal vs. `origin/main`

### Layout-Unterschiede

| Ebene | Lokal | `origin/main` | Anmerkung |
|-------|-------|---------------|-----------|
| Specification-Verzeichnis | `1-spec/` | `1-objectives/` | Pfad unterscheidet sich; Inhaltsstruktur (assumptions, constraints, goals, requirements) ist gleich |
| Decisions | `decisions/` (Repo-Root) | `2-design/decisions/` | `origin/main` hat ~30+ DECs unter `2-design/decisions/`; lokaler Scaffold hat nur Templates |
| `3-code/` Komponenten | leer | `api-server/`, `frontend/`, `mobile/`, `shared/` + `tasks.md` | Produktion ist real-codiert; lokaler Scaffold ist nur Plan |
| `4-deploy/runbooks/` | nur Template | 8 echte Runbooks (railway-deploy, supabase-migration, signatur-tests, etc.) | Produktion deutlich reifer |

### Artefakt-Inventar

| Typ | Lokal | `origin/main` | Bewertung |
|-----|-------|---------------|-----------|
| Goals | 6 | 16 | `origin/main` deckt astrology + signatur + dashboard + agents + soulprint breit ab |
| Requirements | 30 (19 Approved) | 63 | `origin/main` granularer, mehrere Sprints akkumuliert |
| Constraints | 7 | 6 | nahezu disjunkt — Lokal: GDPR / Engine-Immutabilität / Stripe-Stack / Polling / Aphorism-Approval / Degraded-State / Signatur-No-Rebuild; Remote: german-ui / mobile-first / dark-luxury / no-unexplained-numbers / quiz-signatur-axiome / resource-oriented-framing |
| Assumptions | 5 | 5 | disjunkt — Lokal: LLM-Determinismus / WebGL / Stripe-Uptime / Supabase-Scale / German-User-Base; Remote: ElevenLabs / Gemini-Quality / NOAA / Fusion-Sufficiency / UED-Metrics |
| Decisions | 0 (nur Templates) | ~30+ | Remote dominant |
| User Stories | 0 (bewusst übersprungen) | unbekannt | nicht audited |

### Überdeckung der lokalen Goals

| Lokales Goal | `origin/main`-Äquivalent | Verdikt |
|--------------|---------------------------|---------|
| `GOAL-reliable-daily-orientation` | `GOAL-daily-chart-coherence-first`, `GOAL-dashboard-signatur-hygiene` | wahrscheinlich überdeckt; Remote-Reqs (z. B. `REQ-F-daily-chart-coherence-hero`, `REQ-F-coherence-hero-impact-datasource`, `REQ-F-daily-chart-dashboard-order`, `REQ-F-dashboard-identity-cards`, `REQ-F-dashboard-live-daily-signals`) sind granularer und produkttauglicher |
| `GOAL-discoverable-signature-anchor` | `GOAL-signatur-cymatics` + 4 weitere Signatur-Goals + `GOAL-dashboard-signatur-hygiene` | überdeckt auf Goal-Ebene; allerdings adressiert kein Remote-Req explizit die *Dashboard-Verankerung* (Gap #2 oben) → lokale 4 Reqs sind net-new auf REQ-Ebene |
| `GOAL-aphorism-personalized-interpretation` | kein Äquivalent | net-new, aber **falsch gerahmt** (siehe Gap #1) — sollte als Sub-Goal eines übergeordneten "Daily Pulse Dashboard"-Goals neu formuliert werden |
| `GOAL-clean-upgrade-funnel` | kein Goal-Äquivalent; PR #327 hat es allerdings *implementiert* | net-new auf Spec-Ebene — codifiziert was PR #327 baute, schützt vor Regression |
| `GOAL-sustainable-client-polling` | kein Äquivalent | net-new |
| `GOAL-gdpr-compliant-data-handling` | kein Äquivalent | net-new — füllt Gap #3 |

### Überdeckung der lokalen Constraints

| Lokales Constraint | `origin/main`-Äquivalent | Verdikt |
|---------------------|---------------------------|---------|
| `CON-no-formula-changes` | nicht explizit | net-new |
| `CON-stripe-payment-stack` | implizit über `DEC-conversion-tiers` (zu prüfen) | wahrscheinlich net-new als Spec-Artefakt |
| `CON-no-signatur-v3-rebuild` | nicht explizit | net-new |
| `CON-aphorisms-human-approved` | nicht explizit | net-new |
| `CON-greenops-polling-budget` | nicht explizit | net-new |
| `CON-degraded-state-transparency` | nicht explizit | net-new |
| `CON-gdpr-applies` | nicht explizit | net-new — füllt Gap #3 |

Alle 7 lokalen Constraints sind net-new gegenüber `origin/main`.

### Überdeckung der lokalen Assumptions

| Lokale Assumption | `origin/main`-Äquivalent | Verdikt |
|---------------------|---------------------------|---------|
| `ASM-llm-determinism-acceptable` | (Remote hat `ASM-gemini-text-quality` — angrenzendes Thema, nicht identisch) | komplementär |
| `ASM-mobile-webgl-availability` | nicht explizit | net-new |
| `ASM-stripe-uptime-acceptable` | nicht explizit | net-new |
| `ASM-supabase-fits-personal-data-scale` | nicht explizit | net-new |
| `ASM-german-primary-user-base` | überdeckt durch `CON-german-ui` (strenger als Annahme) | redundant — Remote-Variante gewinnt |

---

## Empfehlung für die Integration

**Den Orphan-Branch nicht direkt mergen.** Stattdessen einen Feature-Branch off `origin/main` aufsetzen mit gezielter Cherry-Pick-Strategie.

### Strongly recommended (großer Mehrwert, keine Konflikte)

1. **GDPR-Foundation** (füllt Gap #3):
   - `CON-gdpr-applies` → `1-objectives/constraints/`
   - 6 × `REQ-COMP-*` → `1-objectives/requirements/`
   - `GOAL-gdpr-compliant-data-handling` → `1-objectives/goals/`
2. **Operational Hygiene** (net-new, kein Konflikt):
   - `CON-greenops-polling-budget`, `CON-degraded-state-transparency`, `CON-no-formula-changes`, `CON-stripe-payment-stack`, `CON-no-signatur-v3-rebuild`
   - 3 × Polling-Reqs (`REQ-PERF-polling-budget`, `REQ-PERF-polling-visibility`, `REQ-MNT-single-poller-per-source`)
   - `GOAL-sustainable-client-polling`
3. **Upgrade-Funnel als Spec** (codifiziert PR #327 für Regressionsschutz):
   - 5 × Upgrade-Reqs (`REQ-USA-cta-singular`, `REQ-F-checkout-single-trigger`, `REQ-F-checkout-stripe-redirect`, `REQ-USA-checkout-error-categories`, `REQ-F-agent-card-no-checkout`, `REQ-F-manage-subscription`)
   - `GOAL-clean-upgrade-funnel`

### Reframe vor Integration (Gap #1)

- `GOAL-aphorism-personalized-interpretation` → umformulieren oder ersetzen durch übergeordnetes `GOAL-daily-pulse-dashboard-integration` (auto-load on login, full FuFirE API, aphorism als ein Slot)
- 6 lokale Tagespuls/Aphorism-Reqs → unter neuem Daily-Pulse-Goal hängen, ergänzt um:
  - `REQ-F-daily-pulse-auto-load-on-login` (neu)
  - `REQ-F-daily-pulse-fufire-integration` (neu)
  - `REQ-F-daily-pulse-replaces-dashboard-placeholder` (neu)

### Signatur-Integration (Gap #2)

- 4 lokale Signatur-Reqs unter bestehendes Remote-Goal `GOAL-dashboard-signatur-hygiene` hängen (oder ein neues Sub-Goal anlegen, falls die Dashboard-Verankerung nennenswert genug ist)

### Skip / verwerfen

- `GOAL-reliable-daily-orientation` (überdeckt)
- `GOAL-discoverable-signature-anchor` (überdeckt auf Goal-Ebene; nur die 4 Reqs überleben)
- `ASM-german-primary-user-base` (überdeckt durch `CON-german-ui`)

### Pfad-Übersetzung

| Lokal | Ziel auf `origin/main` |
|-------|------------------------|
| `1-spec/goals/GOAL-*.md` | `1-objectives/goals/GOAL-*.md` |
| `1-spec/requirements/REQ-*.md` | `1-objectives/requirements/REQ-*.md` |
| `1-spec/constraints/CON-*.md` | `1-objectives/constraints/CON-*.md` |
| `1-spec/assumptions/ASM-*.md` | `1-objectives/assumptions/ASM-*.md` |
| `decisions/PROCEDURES.md` etc. | `2-design/decisions/PROCEDURES.md` |

---

## Geschätzter Umfang einer Integration-PR

Wenn man dem obigen Cherry-Pick-Plan folgt:

- **+12 Goals → 1** netto (Daily-Pulse-Goal als Ersatz für aphorism-Goal; alle anderen lokalen Goals werden gedroppt oder bestehende Remote-Goals erben unsere Reqs); plus `GOAL-clean-upgrade-funnel`, `GOAL-sustainable-client-polling`, `GOAL-gdpr-compliant-data-handling` = **+4 Goals**.
- **+~22 Requirements** (6 GDPR + 6 Upgrade-Funnel + 3 Polling + 4 Signatur-Verankerung + 3 reformulierte Daily-Pulse-Reqs)
- **+5 bis 7 Constraints** (GDPR, Polling-Budget, Degraded-State, No-Formula-Changes, No-Signatur-Rebuild, Stripe-Stack, Aphorisms-Approval)
- **+4 Assumptions** (LLM-Determinismus, WebGL, Stripe-Uptime, Supabase-Scale)
- **+1 Dev-Brief** preserved unter `docs/dev-briefs/`

Eine fokussierte PR mit ~35-40 Spec-Artefakten — überschaubar für menschliches Review.

---

## Status

- Lokaler Orphan-Branch: `claude/sdlc-spec-noctum-2026-05-07` auf `origin/...` (ungemerged, dient nur der Inspektion).
- `origin/main` unverändert.
- Nächster Schritt **liegt beim Repo-Owner**: Entscheidung, ob die obigen Cherry-Picks als regulärer Feature-Branch off `main` aufgesetzt werden sollen, oder ob das vorliegende Material als Inspirationsquelle reicht.
