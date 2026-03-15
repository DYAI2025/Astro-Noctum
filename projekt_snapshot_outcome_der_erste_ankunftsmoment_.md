### Projekt-Snapshot

**Outcome**

Der erste Ankunftsmoment nach Login muss korrekt sein: User landen auf dem Dashboard, sehen den Sternenhimmel im Planetarium und nicht Furing. Parallel muessen die Inhaltsluecken bei Wu und Ren, die unvollstaendige Stripe-Integration und der defekte Ring auf Furing behoben werden. Die PM-Struktur unten folgt dem Backlog-/Artefakt-Schema aus den Projektunterlagen.

artifacts-and-contracts

SKILL

**In-Scope**

Redirect nach erfolgreicher Anmeldung auf Dashboard statt Furing

Planetarium / Sternenhimmel als Ankommensmoment auf dem Dashboard

Mehr Substanz fuer Wu und Ren

Stripe / Payment Layer sichtbar und funktionsfaehig machen

Ring auf Furing kleiner, weiter rausgezoomt und mittig positionieren

**Out-of-Scope**

Neue Berechnungslogik der Astro-Engine

Neue Pricing-Strategie

Vollstaendiger Content-Ausbau aller Tutorial-Seiten

**Wichtige Korrektur**

Die vorhandene Journey-Beschreibung stuetzt deine Anforderung: Nach der Verarbeitung soll auf das Dashboard (AstroSheet) umgeleitet werden, wo Entfaltungsmatrix, dritte Identitaet und weitere Dashboard-Features sichtbar sind. Ein Redirect auf Furing ist damit unpassend zum beschriebenen Zielbild.

full_user_journey_through_the_a…

---

## Backlog

IDTitelZweck/OutcomeDoD / Acceptance CriteriaAbhaengigkeitenAufwandRisikoModus

AN-11Login Redirect auf Dashboard korrigierenNach erfolgreicher Anmeldung landet der User am richtigen OrtNach Login erfolgt Redirect auf `/dashboard` statt Furing; kein Zwischen-Sprung auf falsche Route; Verhalten fuer neue und bestehende User getestetAuth FlowShighMixed

AN-12Planetarium als Ankommensmoment sichtbar machenDashboard muss das eigentliche "Ankommen" liefernSternenhimmel/Planetarium ist im sichtbaren First View des Dashboards; keine leere oder falsche Hero-Zone; Desktop und Mobile geprueftDashboard-LayoutMmedMixed

AN-13Wu-Text ausbauenWu darf nicht wie Platzhalter wirkenWu hat vergleichbare Texttiefe wie die anderen Hauptkarten; mindestens: Bedeutung, Wirkung, Staerken, Schatten, EntwicklungContent-ModellMmedMensch

AN-14Ren-Text ausbauenRen darf nicht wie Platzhalter wirkenRen hat vergleichbare Texttiefe wie die anderen Hauptkarten; gleiche Struktur und inhaltliche Tiefe wie WuContent-ModellMmedMensch

AN-15Stripe Integration vervollstaendigenPayment Layer muss technisch und visuell funktionierenPayment Layer wird angezeigt; Stripe-Komponenten laden ohne Fehler; Checkout-/Payment-Einstieg sichtbar; Test- und Live-Konfiguration getrenntStripe Keys / Env / Frontend WiringMhighMixed

AN-16Payment Visibility DebugFehlerquelle zwischen Backend, Frontend und Feature Flag isolierenKlar dokumentiert, warum der Payment Layer bisher nicht erscheint; Ursache identifiziert: Config, Rendering, Route Guard oder APIStripe IntegrationShighMixed

AN-17Ring auf Furing rauszoomenRing darf nicht ueberdimensioniert wirkenRing ist sichtbar kleiner skaliert; komplett im Bild; keine abgeschnittenen BereicheFuring HeroSmedMixed

AN-18Ring auf Furing mittig ausrichtenRing muss visuell zentriert seinRing sitzt horizontal mittig; kein Rechtsversatz; visuelle Mitte in Standard-ViewportFuring HeroSmedMixed

AN-19Responsive Check fuer RingFix darf nicht nur auf einem Breakpoint funktionierenMobile, Tablet, Desktop geprueft; Ring bleibt mittig und voll sichtbarAN-17, AN-18SmedMixed

---

## Priorisierung

### P0 - sofort

**AN-11 Login Redirect auf Dashboard korrigieren**

Das ist ein zentraler Journey-Fehler, weil der beschriebene Zielzustand klar Dashboard-first ist.

full_user_journey_through_the_a…

**AN-15 / AN-16 Stripe Integration + Payment Layer sichtbar machen**

Das ist geschaeftskritisch. Hier ist der Impact hoeher als bei rein visuellen Fehlern.

**AN-17 / AN-18 Ring auf Furing korrigieren**

Sichtbarer UI-Defekt im zentralen Bereich.

### P1 - direkt danach

**AN-12 Planetarium als Ankommensmoment herstellen**

Das ist Experience-kritisch und haengt eng am Redirect.

**AN-13 / AN-14 Wu und Ren textlich auffuellen**

Das ist inhaltlich wichtig, aber nach Redirect/Payment/Ring.

---

## Roadmap

### Milestone 1 - Arrival Fix

Redirect auf Dashboard

Planetarium im First View sichtbar

### Milestone 2 - Revenue Fix

Stripe Wiring komplett

Payment Layer sichtbar und testbar

### Milestone 3 - Visual Fix

Ring kleiner

Ring mittig

Responsive Check bestanden

### Milestone 4 - Content Fix

Wu erweitert

Ren erweitert

Textgewicht wieder konsistent

---

## Top-Risiken

RisikoImpactProbMitigation

Redirect-Logik ist an mehreren Stellen verteilthighmedRoute Guard, Auth Callback und Post-Login Handler gemeinsam pruefen

Stripe ist nicht nur UI-, sondern KonfigurationsproblemhighhighFrontend, Backend, Env-Variablen und Feature Flags systematisch trennen

Ring-Fix funktioniert nur fuer DesktopmedmedBreakpoint-Review verpflichtend

Wu/Ren werden nur kosmetisch verlaengert statt inhaltlich verbessertmedhighTextstruktur mit fachlichem Raster vorgeben

---

## Entscheidungen

**D5:** Erfolgreicher Login muss auf Dashboard gehen, nicht auf Furing, weil die dokumentierte User Journey den Dashboard-Ankunftspunkt beschreibt.

full_user_journey_through_the_a…

**D6:** Planetarium ist Teil des "Ankommens" und gehoert in den sichtbaren Dashboard-Einstieg.

**D7:** Stripe ist kein spaeteres Nice-to-have, sondern ein kritischer Fix.

**D8:** Wu und Ren brauchen gleichwertige inhaltliche Tiefe statt Ein-Satz-Charakter.

---

## Dev-Handlungsanweisung

### 1. Redirect

Post-login redirect hart auf Dashboard legen

Pruefen, ob Furing aktuell als Default-Route oder Fallback gesetzt ist

Auth Callback, Session Restore und Deep-Link-Faelle testen

### 2. Dashboard Arrival

Planetarium / Sternenhimmel im initial sichtbaren Bereich platzieren

Sicherstellen, dass das Dashboard sofort als "Ankommen" lesbar ist

### 3. Stripe

Render-Bedingungen des Payment Layers pruefen

Stripe Publishable Key / Secret / Env Mapping pruefen

Sichtbarkeit nicht nur technisch, sondern auch UI-seitig verifizieren

Test- und Live-Modus sauber trennen

### 4. Ring

Scale reduzieren

X-Offset neutralisieren

Container-Cropping pruefen

Responsive Verhalten validieren

### 5. Wu / Ren

Beide Karten auf gleiche Texttiefe wie die staerkeren Bereiche anheben

Kein Fuelltext; stattdessen klare Struktur:

Kernbedeutung

persoenliche Wirkung

Stabilisierende Qualitaeten

Dysbalance / Schatten

Entwicklungsimpuls

---

## Kurzfassung als echte Packliste

Redirect nach Login: **Dashboard statt Furing**

Dashboard First View: **Planetarium / Sternenhimmel sichtbar**

Wu: **mehr Substanz**

Ren: **mehr Substanz**

Stripe: **Payment Layer sichtbar und Integration fertig**

Furing-Ring: **weiter rausgezoomt**

Furing-Ring: **mittig im Bild**

Furing-Ring: **responsive pruefen**
