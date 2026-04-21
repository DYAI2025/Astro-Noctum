# Feature: Audible Signature — Die klingende Signatur

**Status:** Concept / Proposed
**Target Release:** Erstes großes Release / Major Version Update
**Dependencies:** Stage 1 (Superglue-Removal Onboarding) muss abgeschlossen sein
**Owner:** Ben (PO)
**Erstellt:** 2026-04-18
**Letzte Aktualisierung:** 2026-04-18

---

## 1. Kurzfassung

Die Signatur des Users wird hörbar gemacht — nicht als generisches Ambient, sondern als **personalisierte, täglich sich wandelnde Komposition**, die aus denselben Daten gespeist wird, die auch die visuelle Signatur (Chladni + 3D-Sphere) erzeugen: BaZi-Natal, Wu-Xing-Balance, aktuelle Transits, kosmisches Wetter und kumulierte Quiz-Beiträge.

Ziel ist eine **fraktale Mitschnitt-Melodie**: dasselbe Motiv taucht auf Tages-, Wochen- und Monats-Skala wieder auf, aber in jeder Skala leicht variiert. Die Melodie ist nicht zufällig — sie ist die hörbare Form derselben Struktur, die der User sieht.

Zwei große offene Fragen strukturieren die weitere Konzeption:
- Wie wird es tatsächlich **schöne, sanfte Musik** — nicht Sonifikation, die wie Messwerte klingt?
- **Tanzt die visuelle Signatur mit** (reagiert auf die Töne in Echtzeit), oder bleibt sie stabil und wird nur von der Melodie umspielt?

---

## 2. Warum dieses Feature (Produkt-Begründung)

### Retention
Visuelle Signatur ist stark, aber statisch-täglich. Eine **hörbare Dimension** gibt dem User einen Grund, länger zu bleiben — 45–60 Sekunden zuhören statt 5 Sekunden gucken. Audio ist zudem ein perfekter "Morgen-Ritual"-Hook.

### Differenzierung
Keine der gängigen Astro-Apps (Co-Star, The Pattern, TimePassages) hat personalisiertes Audio. Das ist ein klarer, nicht-kopierbarer Moat, weil es an die spezifische Datenbasis (Cousto-Frequenzen, BaZi, Wu-Xing) gekoppelt ist, die Bazodiaac aufgebaut hat.

### Shareability
Ein 45-Sekunden-"Fingerprint" als MP3/Video ist teilbar. "Hier ist der Ton meines heutigen Tages" ist ein virales Element, das über die visuelle Signatur hinausgeht.

### Premium-Argument
Eine monatliche **Geburtstagsskomposition** oder **Jahres-Mitschnitt** ist ein überzeugendes Premium-Feature. Keine Cloud-Astro-App kann das anbieten.

### Fraktale Kohärenz
Wenn Audio und Visual aus derselben Struktur kommen, verstärkt jedes Element das andere. Das passt zur Grundthese von Bazodiaac: alles hängt zusammen, auf allen Skalen.

---

## 3. Datenbasis (bereits vorhanden)

Keine der folgenden Datenquellen muss neu gebaut werden:

| Quelle | Inhalt | Zeitskala |
|---|---|---|
| `astro_profiles.astro_json` | BaZi 4-Pillars, Natal Houses, Aspects | statisch (Natal) |
| `astro_profiles.soulprint_sectors` | 12-Sektor-Wu-Xing-Verteilung | statisch |
| `daily_horoscope_cache` | Tages-Transits, Element-Shifts | täglich |
| `space_weather_cache` | K-Index, Sonnenwind, Schumann | stündlich |
| `user_signature_state` | Quiz-Beiträge, kumulierte Resonanz | pro Interaktion |
| `useCoustoAudio` Hook | Cousto-Frequenzen pro Planet (bereits verdrahtet) | — |

**Wichtig:** Der Audio-Hook `useCoustoAudio` ist bereits in `SignaturPage.tsx` (Zeile 126) integriert. Die Frequenz-Berechnung ist also vorhanden — was fehlt, ist die **kompositorische Schicht** darüber.

---

## 4. Scope-Optionen (drei Tiers)

### Tier 1 — Minimal (PoC, ~1 Woche Entwicklung)
**Was:** Ein Play-Button in der Signatur-Ansicht. Beim Klick spielen die Cousto-Frequenzen der drei dominantesten Planeten des Users übereinandergelegt — als Drohne/Grundton, nicht als Melodie.

**Genug für:** Validierung der technischen Basis und des User-Interesses. "Wollen Leute das überhaupt hören?"

**Risiken:** Klingt schnell nach Meditations-App. Kein klarer Unterschied zwischen Usern, weil nur 3 Planeten differenzieren. Unterscheidet sich nicht vom Tag.

### Tier 2 — Good (4–6 Wochen)
**Was:** Eine **45–60-Sekunden-Tagesmelodie**, die vier Schichten kombiniert:
1. **Natal-Grundton** — BaZi-Stem/Branch bestimmt Tonart, Pentatonik-/Kirchentonart-Wahl, Tempo
2. **Transit-Soli** — die 3 aktivsten Transits des Tages werden zu Melodielinien über dem Grundton
3. **Kosmische Wetterdynamik** — hoher K-Index → mehr Modulation, mehr Reibung; niedrig → clean, sanft
4. **Quiz-Phrasen** — Quiz-Beiträge der letzten 7 Tage werden als kurze rhythmische/melodische Phrasen eingewoben

**Genug für:** Erstes großes Release. Echt differenzierende User-Experience. Shareable.

**Risiken:** Musikalische Qualität ist ein Handwerk — ohne Komponisten-Input klingt das mit hoher Wahrscheinlichkeit wie "Algorithmus-Musik", nicht wie Musik. Benötigt Konsultation mit jemandem, der sonifizierte Komposition kann.

### Tier 3 — Strong (2–3 Monate, gestaffelt)
**Was:** Tier 2 + **fraktaler Mitschnitt**. Die Tagesmelodie ist ein Motiv; die Wochenmelodie ist eine Variation desselben Motivs auf größerer Zeitskala; der Monat nochmal eine Variation. Der User kann seinen **Jahres-Mitschnitt** als eine einzige lange Komposition hören — seine eigene Symphonie.

Zusätzlich:
- **Anniversary-Kompositionen** (Geburtstag, Jahrestag) als besondere Varianten
- **Export als MP3/Video** für Sharing
- **Layerable Playback** — User kann einzelne Schichten (Natal / Transit / Wetter / Quiz) separat hören oder muten
- **Kopplung Visual × Audio** — die Sphere reagiert in Echtzeit auf die gerade spielenden Töne

**Genug für:** Premium-Tier / Version 2.0 / Anchor-Feature.

---

## 5. Kompositorische Architektur (Tier 2 — Referenz-Design)

### 5.1 Schichten-Modell

```
[ Natal-Grundton ]         ← Basis-Drohne, Tonart, Tempo (tägliche Konstante)
       +
[ Transit-Soli ]           ← 3 Melodielinien, tageweise neu
       +
[ Kosmisches Wetter ]      ← Modulation, Reverb, Filter, Dichte
       +
[ Quiz-Phrasen ]           ← seltene, rhythmische Highlights
```

### 5.2 Tonart-Bestimmung (Natal)

BaZi-Day-Master-Stem → musikalische Tonart:
- Wood → Dur / Ionisch (hell, wachsend)
- Fire → Mixolydisch (warm, lebendig)
- Earth → Pentatonik (stabil, erdig)
- Metal → Phrygisch (klar, scharf)
- Water → Dorisch (fließend, melancholisch)

**Wichtig:** Cousto-Frequenzen (Mars ~144.72 Hz usw.) sind **nicht** in gleichstufiger Stimmung. Für Musik müssen wir sie **auf die nächste Skala-Tonhöhe quantisieren** — sonst klingt es schief. Das ist eine Design-Entscheidung mit Tradeoff:
- Quantisiert → klingt musikalisch, verliert aber die "authentische" Cousto-Frequenz
- Unquantisiert → authentisch, klingt für 98% der User "falsch"

**Vorschlag:** Quantisiert für Musik-Modus, ein Button "Hear the real frequencies" für den Authentik-Modus.

### 5.3 Klangfarbe (Timbre)

Reine Sinustöne klingen schnell nach Hörgerät-Test. Pro Schicht andere Klangfarbe:
- Natal-Grundton: warme Pad-Synth, leicht atmig
- Transit-Soli: glockige Plucks oder kurze Bogenstriche
- Kosmisches Wetter: Reverb-Tails, Filter-Sweeps
- Quiz-Phrasen: kurze, perkussive Elemente (wie Kalimba oder gezupfte Saite)

### 5.4 Rhythmische Struktur

Die 12 BaZi-Doppelstunden als rhythmisches Gerüst. Eine 45s-Tagesmelodie teilt sich in 12 Mikro-Phrasen (je ~3.75s), jede Phrase "gehört" einer Doppelstunde. Die gerade aktive Stunde bekommt die stärkste Betonung.

### 5.5 Fraktale Selbstähnlichkeit (Tier 3)

Das **Natal-Motiv** (4–8 Noten) ist die Keimzelle. Dieses Motiv:
- taucht im Tageslevel kurz, schnell, modifiziert auf
- taucht im Wochenlevel langsamer, in anderer Tonart, ausgedehnt auf
- taucht im Monatslevel als Thema mit Variationen auf
- taucht im Jahreslevel als vollständige Durchführung auf

Bach'sche oder Philip-Glass-artige Strukturen als Referenz. Das ist der Punkt, an dem es musikalisch wirklich interessant wird — und an dem ein:e Komponist:in einbezogen werden sollte.

---

## 6. Offene Kernfragen (aus dem PO-Gespräch)

### 6.1 Arrangement-Qualität
**Frage:** "Bekommt man das in schön Töne hin, sodass es wirklich eine sanfte Melodie ist oder wie arrangieren wir das musikalisch?"

**Stand:** Ungeklärt. Hypothese: mit reinem Algorithmus wird es nicht schön. Mit einem Komponisten-Template (vorkomponierte Motive, die algorithmisch variiert werden) könnte es klappen.

**Nächster Schritt:** Konsultation mit einer Person aus generativer Musik / Sonification. Optional: Experimentieren mit Tonic (Tone.js) oder Strudel (live-coded patterns).

### 6.2 Signatur ⇄ Melodie-Kopplung
**Frage:** "Verändert sich die Signatur unter der Melodie oder bleibt sie gleich — tanzt sie quasi mit?"

**Zwei Varianten:**

**Variante A — Signatur tanzt:**
Die 3D-Sphere reagiert in Echtzeit auf die aktuelle Tonhöhe/Lautstärke. Chladni-Parameter modulieren mit dem Audio. **Pro:** Beeindruckend, sehr gekoppelt. **Contra:** Ablenkend von der eigentlichen täglichen Signatur; User verliert den statischen Bezugspunkt; technisch teuer (AnalyserNode + Renderloop-Kopplung).

**Variante B — Signatur bleibt stabil, Audio umspielt sie:**
Die Signatur ist der **Stern**, die Melodie der **Kommentar dazu**. **Pro:** Klare visuelle Identität, User weiß wo er steht, billiger zu implementieren. **Contra:** Fühlt sich weniger "lebendig" an.

**Variante C — Hybrid:**
Signatur bleibt strukturell stabil, aber **atmet** mit der Melodie — leichte Helligkeit-/Sättigungsvariation, keine Strukturänderung. Sphere rotiert minimal schneller/langsamer mit Tempo. Aber Chladni-Muster bleiben fix.

**Empfehlung (zur Diskussion):** **Variante C.** Gibt genug Lebendigkeit, ohne die Signatur zu verlieren.

### 6.3 Weitere offene Fragen (aus der Architektur-Arbeit)

- Cousto-Frequenz-Quantisierung: Wie viel "Authentik" opfern wir für Musik?
- Export-Format und Sharing-UX (MP3? Video mit Signatur-Overlay? Beides?)
- Kosten: Web Audio API ist kostenlos, aber wollen wir Premium-Samples von Splice oder eigenen Sound-Designer?
- Accessibility: Brauchen wir eine Textbeschreibung der Melodie für hörgeschädigte User?
- Datenschutz: Wird die Melodie als Feature speicherbar / exportierbar — ist das DSGVO-relevant?
- Monetarisierung: Free-Tier hört Daily-Melodie; Premium bekommt Woche/Monat/Jahr und Export?

---

## 7. Technische Voraussetzungen

### 7.1 Bereits vorhanden
- `useCoustoAudio` Hook in `src/hooks/useCoustoAudio.ts` (in `SignaturPage.tsx:126` bereits verdrahtet)
- Audio-Controls im Signatur-Header (bereits UI-technisch integriert)
- Cousto-Frequenz-Tabelle für alle 10 Planeten

### 7.2 Muss neu gebaut werden
- **Kompositions-Engine** — nimmt `astro_json`, `soulprint_sectors`, `daily_horoscope_cache`, `space_weather_cache`, `user_signature_state` und produziert eine Sequenz von Events `{time, pitch, velocity, timbre, layer}`
- **Audio-Renderer** — entweder Web Audio API direkt oder Tone.js — spielt die Eventliste ab
- **Caching-Layer** — Tagesmelodie 1× pro User pro Tag komponieren, dann als JSON im State cachen (nicht bei jedem Page-View neu rechnen)
- **Export-Pipeline** (Tier 3) — Offline-Render nach MP3 mit `OfflineAudioContext`
- **Optional: Tight-Loop-Visual-Koppling** (Variante A/C) — AnalyserNode → RequestAnimationFrame → R3F-uniform-Update

### 7.3 Abhängigkeiten / Preconditions
- Stage 1 Superglue-Removal ist Voraussetzung — ohne verlässliches `astro_json` + `soulprint_sectors` kann die Kompositions-Engine nicht arbeiten
- `daily_horoscope_cache` muss verlässlich tagesaktuell sein (gilt als gegeben, aber bestätigen vor Start)
- Space-Weather-Cache sollte stündlich frisch sein (aktuell im System)

---

## 8. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Klingt nicht schön, User schalten es nach 2 Tagen ab | Hoch | Hoch | PoC mit 5 Beta-Usern vor Feature-Commit. Komponisten-Konsultation. |
| Latenz beim Audio-Start auf Mobile | Mittel | Mittel | Pre-Rendering / Caching. Nicht beim ersten Page-Load autoplay. |
| Zu hohe Batterie-Last bei Live-Visual-Audio-Kopplung | Mittel | Mittel | Variante C (nur atmen, nicht Live-FFT) als Default; Variante A als opt-in. |
| User verwechselt "Algorithmus-Musik" mit "Bazodiaac klingt billig" | Hoch | Sehr hoch | Keine halbschönen Demos releasen. Lieber Feature zurückhalten als mittelmäßig shippen. |
| Cousto-Community lehnt Quantisierung ab ("das sind nicht mehr die echten Frequenzen") | Mittel | Mittel | Authentik-Modus als Toggle. Transparent kommunizieren. |
| Web Audio API Browser-Inkonsistenzen | Niedrig-Mittel | Mittel | Tone.js als Abstraktionslayer. Safari-spezifisches Testing. |

---

## 9. Empfohlener Entwicklungspfad

### Phase 0 — Jetzt (im SDLC als Concept)
- ✅ Dieses Dokument existiert
- Keine weitere Arbeit bis Stage 1 Superglue-Removal abgeschlossen ist

### Phase 1 — Nach Stage 1
- **Dedicated Design-Session** (2–3 Stunden Ben + Claude): Die offenen Kernfragen (6.1, 6.2) entscheiden. Varianten-Entscheidung für Signatur-Kopplung. Komponisten-Kontakt klären.
- **Prototyp-Skizze**: 1 handkomponiertes 30s-Beispiel (nicht algorithmisch), um Ziel-Qualität zu verankern. Referenzpunkt für "so soll es klingen".

### Phase 2 — PoC (~1 Woche)
- Tier 1 Minimal bauen: 3-Planeten-Drohne, Play-Button, keine Komposition
- 5 Beta-User-Tests
- Geh/Nicht-Geh-Entscheidung

### Phase 3 — Feature-Build (~4–6 Wochen)
- Tier 2 Good bauen
- Kompositions-Engine + 4 Schichten + 45s-Tagesmelodie
- Integration ins Major-Release

### Phase 4 — Premium-Erweiterung (~2–3 Monate nach Release)
- Tier 3 Strong: Fraktaler Mitschnitt, Wochen-/Monats-/Jahresskalierung
- Export, Sharing, Anniversary-Compositions
- Premium-Tier-Kopplung

---

## 10. Was dieses Dokument NICHT tut

- Es legt **kein Ausführungsdatum** fest. Das ist eine bewusste Entscheidung — Stage 1 hat Priorität, und dieses Feature ist zu groß für "zwischendurch".
- Es schreibt **kein Code**. Keine Komponenten, keine Hooks, keine API-Endpunkte. Das ist ein Konzept-Dokument.
- Es entscheidet **nicht die offenen Kernfragen** (6.1, 6.2). Die brauchen eine dedizierte Session, nachdem Stage 1 fertig ist und wir wieder Bandbreite haben.

---

## 11. Nächste konkrete Schritte

1. **Dieses Dokument in Ben's SDLC-Backlog aufnehmen** als Feature-Spec (nicht als Issue).
2. Stage 1 Superglue-Removal abschließen (läuft extern in Claude Code Opus 4.7).
3. **Nach Stage 1:** Separate Session für Abschnitt 6 — die offenen Kernfragen entscheiden.
4. **Nach Entscheidung:** Phase-2-PoC beauftragen.

---

## Historie / Änderungen

- **2026-04-18** — Erstanlage. Konzept-Stand nach PO-Gespräch mit Ben. Offene Kernfragen (6.1, 6.2) explizit festgehalten zur späteren Entscheidung.
