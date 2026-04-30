# Spec — Fusion-Chart-Overlay (Western × BaZi × Wu-Xing in einer Geometrie)

> **Stand:** 2026-04-29
> **Quelle:** Cowork-Session 2026-04-29, Bens Wahl Variante B + C
> **Status:** **APPROVED — alle 5 Klärungslücken sind entschieden** (Ben delegiert die UX/Design-Entscheidung an Cowork-Planner am 2026-04-29). Begründungen in §13.

---

## 0. Entscheidungs-Box (kanonisch, nicht verhandeln ohne Ben-Veto)

| Entscheidung | Wahl | Kurz-Begründung |
|---|---|---|
| **Erdzweig-Mapping** | **(a) pragmatisch** — Standard-Mapping Branch ↔ Tierkreis-Sektor, gleichindiziert | Visuelle Konsistenz trägt die Fusion-Aussage; Bens Zielgruppe ist nicht der Tradition-Reinhalter |
| **Day-Master-Position** | **Zentrum** + zusätzlich Sektor-Anker via Tag-Pillar (R4 unten) | Zentrum = Identitäts-Aussage. Tag-Säule am Rand zeigt die räumliche Sektor-Wahrheit. Beides leben nebeneinander, verbunden über eine helle Glow-Linie |
| **Position auf der Seite** | **Signatur-Seite** (Option a) + Anker-Link von Home-Below-the-fold | Spirograph-Signatur und Fusion-Chart sind Geschwister: kosmisch-abstrakt + strukturell-didaktisch. Eine eigene Route würde fragmentieren |
| **Sprint-1-Modus** | **Demo-First** | Geometrie zuerst, BAFE-Integration in Phase 8. Klare Trennung Sketch ↔ Daten-Pipeline. Bens visuelle Reviews 4a–5d sind mit hardcodierten Daten sauberer |
| **Pillar-Reihenfolge** | **Top=Jahr, Rechts=Monat, Unten=Tag, Links=Stunde** | Tag-Säule (Day-Master) unten = Anker-Position, Daumen-Zone auf Mobile, ergonomischer Identitäts-Pol |

Diese 5 Entscheidungen sind ab Phase 1 verbindlich. Phase 0 prüft nur noch Code-Realität (BAFE-Outputs + bestehende Komponenten), keine Produkt-Klärung mehr.

---
> **Bezug:**
> - `docs/QUIZZES_AND_SIGNATURE.md` — Sektor-Konstanten + Mapping-Pipeline
> - `docs/po/BAZODIAC_KNOWLEDGE.md` §3 — Master-Signal-Formel (LOCKED)
> - `docs/KOHAERENZ_INDEX.md` — Live-Kohärenz-Layer
> - `1-objectives/requirements/REQ-F-fusion-ring-visualization.md` — abstrakte Spirograph-Signatur (NICHT zu verwechseln, siehe §1)
> - `1-objectives/requirements/REQ-F-orbital-signatur-visualization.md`

---

## 1. Mission und Abgrenzung

**Was wir bauen:** ein **klassisches Geburtschart-Rad** (12-Sektor-Tierkreis), das **westliche Astrologie + BaZi + Wu-Xing in derselben Geometrie** zeigt. Didaktisch-strukturell, sichtbare Fusion. Eine Antwort auf die User-Frage „Wie hängt das alles zusammen?".

**Was wir NICHT bauen:** keine Ersetzung der bestehenden Spirograph-Signatur (`FusionRingCanvasV2`). Diese bleibt unverändert und zeigt die abstrakte ~28K-Partikel-Frequenz. Beide leben nebeneinander:

| Komponente | Aussage | Stilistik |
|---|---|---|
| **Signatur (Spirograph)** | „Was bist du jetzt?" | abstrakt, kosmisch, lebendig |
| **Fusion-Chart (NEU)** | „Woraus berechnet sich das?" | didaktisch, strukturell, lesbar |

**Default-Variante (2D, sofort lesbar):** Variante B — direkte Überlagerung in einem Rad.
**Premium-Drill-Down (3D, Erlebnis):** Variante C — gestapelte Schichten entlang einer Z-Achse. Eigener späterer Sprint.

---

## 2. Datenquellen (BAFE-Pipeline)

Alle Daten kommen aus dem bestehenden BAFE-Stack:

| Datenpunkt | Quelle | Form |
|---|---|---|
| Westliche Planeten-Positionen | `/api/calculate/western` | 7 Planeten + Aszendent + MC, jeweils Sektor-Index 0–11 + Grad innerhalb Sektor |
| Westliche Aspekte | `/api/calculate/western` | Liste von `(planetA, planetB, type, orb)` mit Aspekt-Typen (Konjunktion, Opposition, Trigon, Quadrat, Sextil) |
| BaZi 4 Pillars | `/api/calculate/bazi` | 4 Säulen × (Stamm, Zweig, Hidden Stems) |
| BaZi Day-Master | abgeleitet aus Tag-Säule-Stamm | 1 von 10 Stämmen (5 Elemente × Yin/Yang) |
| BaZi Earthly Branch Sektor | abgeleitet aus jedem Zweig | Index 0–11 auf 12-Sektor-Raum |
| Wu-Xing-Verteilung | `/api/calculate/wuxing` (oder aus BaZi abgeleitet) | 5 normalisierte Werte (Wood/Fire/Earth/Metal/Water) summieren auf 1.0 |
| Soulprint-Sektoren | `astro_profiles.soulprint_sectors` | Vektor [12] in [0,1] (für Sektor-Tönungs-Intensität) |

**Verifikations-Pflicht in Phase 0:** alle Endpoints + Response-Shapes verifizieren. Nicht annehmen, dass die BAFE-Outputs den Spec-Inhalten entsprechen.

---

## 3. Ring-Architektur — vier konzentrische Schichten

Von außen nach innen:

| Ring | Radius (norm.) | Inhalt | Symbolsprache |
|---|---|---|---|
| **R4 — Pillar-Anker** | 1.10 | 4 BaZi-Säulen-Marker an cardinal points (top=Jahr, rechts=Monat, unten=Tag/Day-Master, links=Stunde) | Hanzi 年/月/日/時 + Stamm + Zweig |
| **R3 — Westliche Tierkreiszeichen** | 1.00 | 12 Tierkreis-Glyphen ♈–♓ am äußeren Sektor-Rand | Western Glyphen, Gold-Ton |
| **R2 — BaZi-Erdzweige** | 0.80 | 12 Zweig-Symbole (Tiere) auf gleicher Sektor-Position | Hanzi (鼠/牛/虎/兔/...), Lila-Ton |
| **R1 — Westliche Planeten + Aspekte** | 0.45 | Planeten-Positionen + Aspekt-Linien zwischen ihnen | Western Planeten-Glyphen |
| **R0 — Day-Master-Kern** | 0.30 (Glow-Radius) | Day-Master-Stamm im Zentrum, eingefärbt in seinem Element | großer Hanzi-Stamm + Element-Farbe |

**Sektor-Hintergrund-Tönung:** jede der 12 Sektor-Wedges wird leicht (Alpha 0.18) in der Farbe ihres Wu-Xing-Elements eingefärbt. Mapping aus `QUIZZES_AND_SIGNATURE.md`:

| Sektoren | Element | Farbe |
|---|---|---|
| 0 Aries, 11 Pisces | Wood | `#10B981` |
| 1 Taurus, 10 Aquarius | Earth | `#CA8A04` |
| 2 Gemini, 3 Cancer, 4 Leo | Fire | `#EF4444` |
| 5 Virgo, 6 Libra | Metal | `#CBD5E1` |
| 7 Scorpio, 8 Sagittarius, 9 Capricorn | Water | `#3B82F6` |

**Hinweis:** diese Element-Zuordnung pro Sektor ist eine bestehende Bazodiac-Konvention und folgt nicht klassischer westlicher Astrologie 1:1. Sie ist Teil des bewussten Fusion-Mappings.

---

## 4. Day-Master-Konvention

**Position:** im Zentrum (R0), als Glühpunkt mit großem Hanzi-Stamm-Symbol.
**Farbe:** Element-Farbe seines Stamms (siehe Tabelle §3).
**Polarität:** kleines Yin/Yang-Glyph als Subtext unter dem Stamm-Symbol.

**Beispiel:** Day-Master = `甲` (Yang Wood). Zentrum zeigt `甲` in Smaragd-Grün, Untertext „YANG WOOD".

**Begründung:** Day-Master IST der User. Symbolisch stark im Zentrum. Mathematisch sitzt er gleichzeitig in seinem Tierkreissektor (siehe §13 Reibungs-Punkt).

---

## 5. Pillar-Marker (R4) — die 4 BaZi-Säulen

Vier Marker an den vier cardinal points. Jeder Marker ist ein kleiner Kreis mit:
- Hanzi für die Säule (年 Jahr, 月 Monat, 日 Tag, 時 Stunde)
- Inline darunter: Stamm + Zweig der Säule (z.B. `甲子` = Yang-Holz + Maus)
- Day-Master-Pillar (Tag) ist visuell hervorgehoben (größerer Kreis, Gold-Border statt Lila)

**Resonanz-Linien:** dünne gestrichelte Linie von jedem Pillar nach innen zum Sektor seines Erdzweigs. Macht sichtbar: „die Maus-Säule deutet auf Sektor 0 (Maus = Steinbock-Region)".

**Position-Konvention (kanonisch in 2026-04-29 festzulegen, siehe §13):** Top=Jahr, Rechts=Monat, Unten=Tag, Links=Stunde. Begründung: Tag (das „Ich") liegt unten am Aszendenten-Pol des Charts, das ist eine etablierte westliche Konvention für das wichtigste Element.

---

## 6. Aspekt-Linien (R1)

**Westliche intra-System-Aspekte** (zwischen Planeten):
- Konjunktion (☌, 0°): solide kurze Linie, neutralfarben
- Opposition (☍, 180°): durchgezogene Linie quer durch das Zentrum, Blau
- Trigon (△, 120°): gestrichelt, Grün
- Quadrat (□, 90°): gestrichelt, Rot
- Sextil (✶, 60°): dünn gestrichelt, Gelb

Aspekt-Toleranz (Orb): aus BAFE-Antwort übernehmen, NICHT clientseitig nachrechnen.

**Cross-System-Resonanz-Linien** (sichtbar gemachter `alignment_boost`):
- Wenn westlicher Planet im selben Sektor sitzt wie ein BaZi-Erdzweig einer der 4 Säulen → goldene gestrichelte Resonanz-Linie zwischen Planet und Pillar
- Wenn westlicher Planet im Sektor des Day-Masters → Resonanz-Linie zum Zentrum (besonderer Glanz)
- Schwellwert: gleicher Sektor (Toleranz: ±3° zum Sektor-Rand zählt noch). Konkretere Logik in Phase 1 mit Code-Verifikation.

**Mode-Toggle (Premium-relevant):** User kann Aspekt-Layer ein-/ausschalten. Default „nur westlich + Cross-Resonanz", erweitert „auch BaZi-interne Stamm-Zweig-Beziehungen" (combined branches, hidden stems).

---

## 7. Wu-Xing-Tönung — zwei Modi

**Modus „statisch"** (Default): Sektoren tragen ihre kanonische Element-Farbe (Tabelle §3) als Hintergrund-Tönung. Konstant, unabhängig vom User.

**Modus „dynamisch"** (Premium oder Toggle): Sektoren-Tönungs-Intensität wird durch das `soulprint_sectors`-Profil des Users moduliert. Sektoren mit hoher Soulprint-Aktivität glühen stärker. Sektoren mit niedrigem Wert bleiben dezent.

**Empfehlung für Sprint 1:** Modus „statisch" zuerst. Dynamisch als kleiner Sprint danach.

---

## 8. Mobile-Adaption (Progressive Reduktion)

Auf Viewport < 768px:

| Element | Mobile-Reduktion |
|---|---|
| BaZi-Erdzweig-Ring (R2) | Tier-Glyphen kollabieren zu kleinen Yin/Yang-Punkten pro Sektor; Glyph erscheint nur bei Tap |
| Pillar-Marker (R4) | Pillar-Beschriftung ("JAHR" etc.) entfällt, nur Hanzi + Glyph |
| Aspekt-Linien | Cross-Resonanz-Linien nur bei Tap auf Planet sichtbar |
| Wu-Xing-Tönung | bleibt (kostet nichts, ist atmosphärisch wichtig) |
| Day-Master-Kern | bleibt prominent |

`prefers-reduced-motion: reduce`: keine Resonanz-Pulse, keine Glow-Animation, statisches Bild.

---

## 9. Interaktionen (Sprint 1 minimal)

- **Tap auf Planet** → Tooltip mit Position (Zeichen + Grad), Aspekte zu anderen Planeten, ggf. Resonanz-Hinweis zu BaZi
- **Tap auf BaZi-Erdzweig** → Tooltip mit Tier-Name, Element, Hidden Stems, Säule(n) die es trägt
- **Tap auf Pillar-Marker** → Tooltip mit voller Stamm-Zweig-Information + Hidden Stems + Bedeutungs-Kurztext
- **Tap auf Day-Master** → Tooltip mit Stamm-Beschreibung, Element, Polarität, deren Bedeutung für den User
- **Long-Press auf Sektor** → Tooltip mit Sektor-Element, welche User-Daten in diesem Sektor liegen (Western + BaZi kombiniert)

Keine Drag/Pan/Zoom-Interaktionen in Sprint 1.

---

## 10. Premium-Drill-Down (Variante C, eigener späterer Sprint)

3D-Stapel entlang Z-Achse:
- Ebene oben: Western-Layer (Tierkreis + Planeten)
- Ebene Mitte: BaZi-Layer (Branches + Pillars)
- Ebene unten: Wu-Xing-Layer (5-Element-Disk)
- Day-Master als Säule durch alle drei Ebenen

Resonanzen (Cross-System-Übereinstimmungen) erscheinen als vertikale Lichtsäulen, die zwei oder drei Ebenen verbinden.

**Tech:** Three.js + R3F, nutzt bestehende Bazodiac-3D-Toolchain.

**Scope:** eigener Sprint, NICHT in dieser Spec implementiert. Hier nur als Roadmap-Referenz.

---

## 11. Position auf der Seite

Wo lebt das Fusion-Chart? Drei Optionen, Ben entscheidet (siehe §13):

a) **Auf der Signatur-Seite** als zweite Visualisierung neben der Spirograph-Signatur. Vorteil: didaktischer Kontext, beide Ansichten zugleich. Nachteil: Seite wird voll.
b) **Auf der Home-One-Page** als Below-the-fold-Drill-Down (siehe Home-Spec §8). Vorteil: ein Ort, alles. Nachteil: nicht im primären Erlebnis sichtbar.
c) **Eigene Route** `/chart` mit Anker-Link von Signatur und Home. Vorteil: Platz, Fokus. Nachteil: noch eine Seite zu warten.

**Meine Empfehlung:** (a) Signatur-Seite, weil das Fusion-Chart erklärt, was die Spirograph-Signatur an Daten hinter sich hat. Beide zusammen sind die komplette astrologische Selbst-Aussage.

---

## 12. Erfolgs-Kriterien

Eine Implementierung gilt als erfolgreich, wenn:

1. **Sichtbarkeit der Fusion**: Ein neuer User erkennt innerhalb 5 Sekunden, dass das Chart aus zwei astrologischen Traditionen besteht (Wahrnehmung über Symbol-Sprache: Glyphen + Hanzi).
2. **Korrektheit des Mappings**: Westliche Planeten und BaZi-Erdzweige sitzen auf den Sektor-Positionen, die die BAFE-Pipeline berechnet — mit Pixel-genauer Positionierung über alle 12 Sektoren.
3. **Resonanz-Sichtbarkeit**: Wenn ein User einen Sun-Day-Master-Element-Match hat (z.B. Sun in Aries + Day-Master = Yang Wood), zeigt das Chart sichtbar eine Resonanz-Linie. Wenn nicht, zeigt es keine.
4. **Mobile-Lesbarkeit**: Auf 380px-Mobile bleibt der Day-Master, die westlichen Glyphen, die Sektoren-Tönung und mindestens eine Pillar-Markierung lesbar ohne Zoom.
5. **A11y**: SVG hat sinnvolle `role="img"`, `<title>`, `<desc>` für Screen-Reader. Tooltips sind Tab-erreichbar. `prefers-reduced-motion` deaktiviert alle Animationen.
6. **Performance**: Initial-Render < 250ms auf Mid-Range-Mobile, Re-Render bei Tooltip-Open < 50ms.

---

## 13. Entscheidungs-Begründungen (kanonisch — am 2026-04-29 beschlossen)

Ben hat am 2026-04-29 die fünf Klärungsfragen an die Cowork-Planner-Session delegiert mit Auftrag „entscheide im besten Sinne von Usability und Design". Hier die Entscheidungen und das Reasoning, das sie tragen — dokumentiert für künftige Reviewer (und für den Fall, dass eine Entscheidung später revidiert werden muss).

### 13.1 Erdzweig ↔ Tierkreis-Sektor-Mapping → **(a) Pragmatisch**

Drei Optionen waren auf dem Tisch:
- **(a) Pragmatisch**: Branch direkt auf gleichindiziertem Tierkreissektor.
- **(b) Solar-Term-präzise**: ~15° Versatz zur tropischen Tierkreisposition.
- **(c) Kompromiss**: (a) + Indikator-Pfeil zur (b)-Position.

**Entscheidung: (a)**.

**Begründung:** Die Fusion-Erzählung lebt davon, dass User auf einen Blick verstehen „beide Systeme sehen denselben Kosmos durch verschiedene Sprachen". Verschobene Symbole (b) untergraben diese Aussage visuell — der Fokus rutscht zu „warum sitzen die da nicht zusammen?". Der Kompromiss (c) bringt UI-Komplexität, die nur Fach-Publikum würdigen kann; Bens Zielgruppe sind 28-jährige Montag-morgens-User, kein BaZi-Traditionsverein. Das Bazodiac-System ist ohnehin eine bewusste Fusion, keine Pflege einer Reinheit — Option (a) folgt dieser Linie konsequent.

**Reibungs-Hinweis:** Ein BaZi-Kenner mag das als Vereinfachung sehen. Falls Premium-User irgendwann nach „korrekter astronomischer Position" fragen → eigener späterer Toggle „Solar-Term-Modus", aber nicht in Sprint 1.

### 13.2 Day-Master-Position → **Zentrum + Tag-Pillar als Sektor-Anker**

**Entscheidung:** Zentrum bleibt Identitäts-Anker (großer Hanzi-Stamm in Element-Farbe). Zusätzlich sitzt die Tag-Säule (R4, unten) als räumlicher Anker im korrekten Sektor. Eine zarte helle Glow-Linie verbindet beide visuell — symbolisch + mathematisch zugleich, kein Widerspruch.

**Begründung:** Day-Master ist die Identitäts-Aussage des User („Du bist Yang Wood"). Im Zentrum ist diese Aussage maximal lesbar, einzigartig, hängenbleibend. Würde der Day-Master nur im Sektor sitzen, wäre er einer von vielen Punkten — die Identitäts-Aussage wäre verwässert. Aber: räumliche Wahrheit braucht auch ihren Platz, deshalb die Tag-Säule am Rand. Das Bild trägt beides.

### 13.3 Position auf der Seite → **(a) Signatur-Seite**

**Entscheidung:** Das Fusion-Chart lebt auf der **Signatur-Seite** als zweite Visualisierung neben der Spirograph-Signatur. Plus Anker-Link von der Home-Below-the-fold-Ebene 2 (Wu-Xing-Detail) → springt direkt zur Fusion-Chart-Sektion.

**Begründung:** Signatur und Fusion-Chart sind Geschwister: die eine zeigt **was du jetzt bist** (kosmisch, abstrakt, lebendig), die andere zeigt **woraus sich das berechnet** (strukturell, didaktisch). Beide auf derselben Seite zu sehen ist die vollständige astrologische Selbst-Aussage — abstrakt und konkret in einem Blick. Eigene Route (c) würde fragmentieren und Bens One-Page-Fokus-Prinzip aus der Memory unterlaufen. Home-Below (b) als Primär-Position würde das Chart vom konzeptionellen Geschwisterstück trennen, hilfreich nur als Verweis.

### 13.4 Sprint-1-Modus → **Demo-First**

**Entscheidung:** Phasen 1–7 mit hardcodierten Demo-Daten. BAFE-Integration in Phase 8.

**Begründung:** Bens Reviews in den Sub-Phasen 4a–5d sind visuell, nicht datenbezogen. Demo-First erlaubt fokussierte HALT-Punkte — „passt die Geometrie?", „passen die Symbole?", „passt das Layering?" — ohne dass BAFE-Edge-Cases (fehlende Felder, Stunden-Säule ohne Geburtszeit) das Bild stören. BAFE-First würde Phase 0 mit Datenpfad-Verifikation überlasten und Phase 4 verzögern, weil dort sonst BAFE-Mocks gebraucht werden, die später wieder ausgetauscht werden müssten. Saubere Trennung Geometrie ↔ Daten-Pipeline ist der schnellere Weg zu beiden.

### 13.5 Pillar-Reihenfolge → **Top=Jahr · Rechts=Monat · Unten=Tag · Links=Stunde**

**Entscheidung:** Tag-Säule (Day-Master, User-Identität) sitzt **unten**.

**Begründung:** Unten ist die ergonomische Anker-Position — Daumen-Zone auf Mobile, natürlicher Augen-Endpunkt beim Lesen, in der westlichen Astrologie traditionell die Stelle des Aszendenten/Identitäts-Pols. Top=Jahr ist die Wurzel (Vergangenheit, Familie, Erbe). Rechts=Monat (gegenwärtige Lebensumstände). Links=Stunde (das, was gerade tut). Diese Anordnung hat einen narrativen Bogen: oben (Wurzel) → rechts (Umstand) → unten (Ich) → links (Tat). Das ist lesbar, auch wenn man die BaZi-Logik nicht kennt.

---

## 14. Verweise auf existierende Code-Anker

(Verifikation Pflicht in Phase 0 — diese sind aus dem aktuellen Doku-Stand, müssen gegen Code geprüft werden)

- `src/lib/fusion-ring/test-signal.ts` — `eventToSectorSignals()` für Sektor-Mapping
- `src/components/fusion-ring-website/signatur-bridge.ts` — `soulprintToNatalWeights()` als Bridge-Vorbild
- `src/services/api.ts` — BAFE-Client, dort Western/BaZi/WuXing-Endpoints
- `BirthChartOrrery` (laut `BAZODIAC_KNOWLEDGE.md` §4) — bestehende 3D-Geburtschart-Komponente, könnte für Variante C wiederverwendet werden
- `FusionRingCanvasV2` — die Spirograph-Signatur, NICHT zu ändern, nur als „Geschwister" einplanen
- `docs/QUIZZES_AND_SIGNATURE.md` Sektor-Konstanten-Tabelle — die kanonische 12-Sektor-Element-Zuordnung, gilt 1:1
- `docs/po/BAZODIAC_KNOWLEDGE.md` §3 — Master-Signal-Formel, der `alignment_boost` ist die mathematische Basis der Cross-Resonanz-Linien
