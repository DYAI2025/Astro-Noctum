# Spec — Home One-Page-Fokus (`/`)

> **Stand:** 2026-04-28
> **Quelle:** Auto-Memory `project_home_page_fokus.md` (2026-04-24, Bens Entscheidung)
> **Status:** Draft — wartet auf 2–3 weitere Tagespuls-Beispielsätze von Ben für finale Sprachregelung
> **Bezug:**
> - `REQ-F-cosmic-encounter-onboarding` (alter Onboarding-Flow — wird durch diese Spec ersetzt, nicht erweitert)
> - `REQ-F-progressive-ui-fluidity` (Bezugs-Mechanik für Fluidity-Layer)
> - `REQ-F-orbital-signatur-visualization` (Ring-Visualisierung)
> - `REQ-F-onboarding-display-name` (Name-Slot)

---

## 1. Mission der Seite

Eine Seite. Eine Route: `/`. Sie ist gleichzeitig **Landing**, **Anmeldung** und **Zuhause**.
Wer kommt, sieht **sofort** das Wichtigste — ohne scrollen, ohne anmelden zu müssen, ohne Vorwissen.
Was tiefer geht, ist Drill-Down weiter unten oder über kontextuelle Vertiefung — niemals primär sichtbar.

**Above-the-fold-Hierarchie (in dieser Reihenfolge, sofort sichtbar):**
1. **Signatur (Ring)** — gross, mittig, organisch lebendig
2. **Tagespuls** (Phase 1 des Rituals — neutraler Tagessatz)
3. **Wahl-Geste** ("Welcher deiner fünf möchte heute mit diesem Puls etwas tun?")
4. **Tagesdeutung** (Phase 2 — erscheint nach der Wahl, ersetzt visuell den Puls oder klappt darunter auf)

**Below the fold** (nur wer scrollt, kommt dahin):
- Drill-Down in Wu-Xing-Detail, Quizzes, Sky/kosmisches Wetter, Wissens-Layer
- Premium-Hinweise (dezent, nicht blockierend)

---

## 2. Drei User-Zustände, eine Seite

### 2.1 Anonym, erstes Mal hier (kein Account, kein Cookie)

- **Sichtbar:** Anmeldeformular im Zentrum, das mit jeder Eingabe **organisch wächst**:
  - Name → ein Punkt erscheint
  - Geburtsdatum → der Punkt bekommt einen Orbit
  - Geburtsort → eine Szene legt sich um den Orbit
  - Submit → der Kern zündet, der Ring formt sich
- Ergebnis: User sieht **seinen eigenen Ring + seinen ersten Tagespuls**, ohne dass er angemeldet ist.
- **Persistenz-Strategie für Anonyme:** Local-Storage-Bridge. Der Ring + Tagespuls werden lokal gehalten. Wer wiederkommt mit demselben Browser, sieht denselben Ring. Wer sich später anmeldet, kriegt seine lokalen Daten in den Account migriert.
- **CTA-Logik:** Sanfter Account-Hinweis erst, wenn User entweder (a) den ersten Archetypen "setzen" will, (b) zurückkommt nach > 24h, (c) tiefer ins Drill-Down klickt. Niemals als Block.

### 2.2 Anonym, wiederkehrend (Cookie/LocalStorage)

- Direkt: Ring + Tagespuls, kein Anmeldeformular mehr.
- Sanfter Account-Hinweis im sekundären Bereich ("Diese Daten an dein Konto binden — drei Klicks").

### 2.3 Eingeloggt

- Cookie-Login landet **immer hier**, nie auf einer separaten "Dashboard"-Route.
- Ring + Tagespuls + bisheriger Profil-Stand werden geladen.
- Drill-Downs unten zeigen mehr (Quiz-Profil, Wu-Xing-Detail, Verlauf des Rats).

---

## 3. Anmeldeformular mit organischem Wachstum

**Reihenfolge der Felder (verbindlich):**
1. Name (oder Wunschname) — Text-Input
2. Geburtsdatum — Date-Picker
3. Geburtszeit — Time-Picker (optional, mit Erklärungs-Tooltip "präziser Ring mit Uhrzeit")
4. Geburtsort — Autocomplete mit Geocoding (BAFE-Pipeline)
5. Submit-Geste — kein "Submit"-Button, sondern eine **Geste/Animation**, die das Zünden auslöst (Ben-Wort: "Kern zündet")

**Visueller Zustand pro Schritt:**
| Eingabe | Zentral-Element | Periphere Reaktion |
|---|---|---|
| (leer) | leerer dunkler Raum, schwacher Glühpunkt | Atmen-Animation, sehr subtil |
| Name | weisser Punkt | Punkt nimmt Namen als Aura auf |
| Datum | Punkt mit dünnem Orbit | Orbit-Linie pulst weich |
| Zeit | Orbit erhält Phase-Marker | Phase-Marker rotiert in echter Zeit-Geschwindigkeit |
| Ort | Szene formt sich (Element-Variante) | Hintergrund wechselt zur Element-Szene |
| Submit | Ring zündet | Ring erscheint, Tagespuls wird geladen |

**Element-Szenen-Varianten** (nach dominantem Wu-Xing-Element des Geburts-BaZi):
- Feuer: warme Farbtemperatur, schnelle Partikel
- Erde: erdige Textur, langsame stabile Bewegung
- Holz: organische Wachstums-Linien, Aufwärts-Flow
- Metall: klare scharfe Geometrien, kühles Glänzen
- Wasser: fliessende Wellen-Layer, Tiefe-Effekt

**Validierung:**
- Inline, sanft (kein Modal, kein Error-Toast)
- Bei ungültigem Datum/Ort: das visuelle Wachstum stagniert an der Stelle, kommt erst weiter, wenn Eingabe valide

**Privacy-Hinweis:** Mikrocopy direkt unter dem Formular: "Nur du siehst, was du eingibst. Wir generieren deinen Ring lokal, bevor du dich anmeldest."

---

## 4. Tagespuls (Phase 1 des Rituals)

**Definition (verbindlich):** Was für **diesen User** heute zusammenkommt — Transit × Natal × kosmisches Wetter × Lage/Rhythmus. Binär: **Pulse-Tag** (weich/Rückzug) oder **Trace-Tag** (aktiv/sichtbar). Drittfall: **Spannung**.

**Existierende Quelle:** `day_mode: 'pulse' | 'trace'` ist bereits im Code (`PROMPT_MODULE_DAILY_HOROSCOPE.md`). Diese Spec **erweitert** das nicht inhaltlich, sondern definiert die Sprach-Grammatik der Ausgabe.

**Tagespuls-Grammatik (3 Slots, 30–50 Wörter gesamt):**
1. **Aphorismus-Opener** (8–15 Wörter, durch Gedankenstrich abgetrennt) — weisheitlich/zitatartig (Laozi, Moltke, schlichte Beobachtung). **Kuratiert aus Sammlung, NICHT von Gemini erfunden.**
2. **Brücke zu heute** (10–20 Wörter, Du-Form, Alltags-Deutsch) — übersetzt den Aphorismus ins Jetzt.
3. **Impuls oder Tür** (10–15 Wörter) — Handlungsimpuls oder Prognose mit offenem Ausgang. Keine Ermächtigungsfloskel.

**Verbotene Worte im Tagespuls:**
- Kein Zodiac-Name ("Skorpion", "Stier")
- Keine Grade ("12° Widder")
- Kein astrologisches Insider-Wort ("Trigon", "Konjunktion")
- Kein "Tageswetter" (Drift-Begriff, NIE verwenden)

**Aphorismen-Sammlung** als Marken-Asset:
- 200–300 kuratierte Sätze
- Gegliedert nach Pulse / Trace / Spannung + Unter-Tönen
- Liegt in `packages/voice/aphorisms/` (zu erstellen) — Markdown-Front-Matter mit Tags
- Wächst mit der Zeit, redaktionell gepflegt

---

## 5. Wahl-Geste — "Setzen" eines Archetyps

**Frage an User** (wortwörtlich): „Welcher deiner fünf möchte heute mit diesem Puls etwas tun?"

**Rat der sechs** (verbindlich, bestätigt 2026-04-24):
1. Sonne (Western)
2. Mond (Western)
3. Aszendent (Western)
4. Day-Master (BaZi — die Säule, IST der User)
5. Jahrestier (BaZi — der plakativste BaZi-Marker, sofort intuitiv)
6. Dominantes Wu-Xing-Element

**NICHT auf dem Brett (bewusste Auslassung):** Monatsmeister, Stundenmeister. Die bleiben im Backend für Herkunftsspur und tiefere Deutung.

**Geste:** Ein Tap. Ein einziger Tap, niedrige Schwelle.

**Wording im UI:** „setzen" (Ben-Wort). Nicht "wählen", nicht "auswählen".

---

## 6. Tagesdeutung (Phase 2 — nach dem Setzen)

**Definition:** Tagespuls × gewählter Archetyp = personalisierte Deutung.

**Tagesdeutungs-Grammatik (50–90 Wörter, 3–4 Sätze):**

Der Tagespuls-Modus bestimmt die Beziehung des gewählten Archetyps zu den anderen vier im Rat:
- **Pulse (weich) → INTEGRATION:** andere Archetypen werden mitgenannt, kollegium-still
- **Trace (aktiv) → ABGRENZUNG:** andere Archetypen reichen nicht, der gewählte tritt heraus
- **Spannung → SEQUENZ:** Archetypen arbeiten in Phasen nacheinander

**Technisch:** Template mit 4 Slots + kuratierter Figuren-Liste (Affe, Tiger, Skorpion, Holz-Baum, Wasser-Fluss …). Gemini formuliert die Slots, **halluziniert keine Struktur**. Kein Freistil.

**Nach dem Setzen ist die Wahl für heute fixiert.** Kein Re-Setzen am gleichen Tag (Append-only-Prinzip wie bei Quizzen).

---

## 7. Was NICHT auf dieser Seite ist

- Kein separates "Dashboard". Cookie-Login landet hier.
- Keine separate "Landing"-Route mit Marketing-Block, der Eingeloggte verwirrt.
- Kein dauerhaftes Wu-Xing-Detail-Tile (das ist Drill-Down).
- Kein doppelter Kohärenzindex-Block (eine Visualisierung, klar).
- Keine Quizze als prominente Kachel above-the-fold (die kommen aus dem Drill-Down — Quiz-Fokus verschiebt sich gemäss Memory: Quizzes schärfen Slots, drei reichen, kommen NACH dieser Seite).
- Kein "Vibes-abrufen"-Button. Vibes ist tot, falls nicht angeschlossen (Policy).

---

## 8. Below-the-fold: Drill-Down-Layer

Sanftes Scrolling enthüllt:

1. **Wu-Xing-Detail** — der eigene Element-Mix als ausführliche Karte
2. **Heute-Erklärung** — was den Tagespuls genau formt (Transit-Konstellationen, kosmisches Wetter)
3. **Kollegium der fünf/sechs** — alle Archetypen einzeln mit Mini-Erklärung
4. **Quiz-Einladung** — wenn ein Slot heute schärfer werden könnte (kontextuell)
5. **Verlauf** — frühere Tagesdeutungen als zarte Zeitleiste

Diese Layer sind **klar getrennt** vom oberen Ritual, nicht überlagernd.

---

## 9. Element-Sprachregelung (verbindlich, niemals abweichen)

| Begriff | Bedeutung | Heimat |
|---|---|---|
| **Kosmisches Wetter** | Äusserer Zustand (Sonnensturm, Mondphase, Transit-Konstellation, Jieqi). Wirkt auf alle, moduliert. | sky.bazodiac.space |
| **Tagespuls** | Was für diesen User heute zusammenkommt. Pulse / Trace / Spannung. | Diese Seite (Phase 1) |
| **Tagesdeutung** | Tagespuls × gewählter Archetyp. | Diese Seite (Phase 2) |
| **Setzen** | Die Geste, einen Archetyp für heute zu wählen. | UI-Wording |
| **Der Rat** | Das Kollegium der Archetypen (5 oder 6). | Marken-Wort |
| **Tageswetter** | DRIFT-BEGRIFF. NIE VERWENDEN. | — |

---

## 10. Erfolgs-Kriterien (was diese Seite erreichen muss)

Eine User-Session gilt als erfolgreich, wenn:
1. **First-time anonym:** User formt seinen Ring und liest seinen Tagespuls innerhalb der ersten Session, ohne sich anzumelden.
2. **Wiederkehrend:** User landet auf der Seite, sieht seinen Ring sofort, setzt seinen Archetyp innerhalb der ersten 30 Sekunden.
3. **Eingeloggt:** Tagesdeutung ist binnen 1.5 Sekunden nach dem Setzen sichtbar.
4. **Sprach-Hygiene:** Kein Tagespuls enthält ein verbotenes Wort. Kein Drift-Begriff erscheint.
5. **Doku-Hygiene:** Pro implementierter Phase wird eine User-Story unter `docs/user-stories/2026-04-28/US-HOME-*` angelegt.

---

## 11. Bekannte Lücken (vor Implementierung zu klären, mit Ben)

- **Aphorismen-Sammlung:** Initial-Liefermenge (50? 200?) und Quelle (Ben kuratiert? Editorial-Workflow?) noch offen.
- **Element-Szenen-Varianten:** Konkrete visuelle Specs (Farbtemperaturen, Partikel-Logik) sind narrativ beschrieben, nicht als Tokens. Vor Build-Phase muss `frontend-design`/`design:design-system` einen Token-Layer für die 5 Element-Varianten liefern.
- **Anonym → angemeldet Migration:** Datenmodell-Bridge (LocalStorage-Schlüssel, was wird übertragen, wie wird Konflikt mit existierendem Account behandelt) noch nicht spezifiziert.
- **Wahl-Re-Setzen:** Spec sagt "kein Re-Setzen am gleichen Tag" — Edge-Case "User hat versehentlich gesetzt" braucht Mikrocopy + UI-Pfad ("zurück zum Pulse" — Untu-Window? Confirmation? Hard-Lock?).
- **Tagespuls-Beispielsätze:** Memory sagt "wenn Ben 2–3 weitere liefert, Spec finalisieren". Die Grammatik ist klar, die Tonalität braucht echte Beispiele.

---

## 12. Verweise auf existierende Code-Pfade (Stand der Memory, vor Build verifizieren)

- `day_mode: 'pulse' | 'trace'` — laut Memory in `PROMPT_MODULE_DAILY_HOROSCOPE.md`
- `cosmic_encounter_v1` — Feature-Flag des alten Onboardings (`REQ-F-cosmic-encounter-onboarding`)
- BAFE-Pipeline — bestehende Berechnungs-Pipeline für Natal-Daten
- `FusionRingCanvasV2` — bestehende Ring-Visualisierung (`REQ-F-orbital-signatur-visualization`)

**Verifikation Pflicht** vor Implementierung — diese Pfade sind aus Memory, nicht aus aktuellem Code-Audit. Claude Code (oder ein Research-Agent) verifiziert sie in Phase 0.
