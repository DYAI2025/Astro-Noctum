---
name: day-pulse-trace
description: Use when generating Tagespuls Slot 2 / Slot 3 or Tagesdeutung (Phase 2) for Bazodiac. Operates on top of curated aphorism pool — never generates Slot 1. Enforces modus-abhängige Logik (pulse / trace / spannung) and the Rat-der-sechs constraints from PROMPT_MODULE_DAILY_HOROSCOPE.md.
---

# Tagespuls & Tagesdeutung — Voice-Regeln

## Geltungsbereich

Dieser Skill regelt **wie** die LLM-generierten Anteile des Rituals klingen. Architektur, Modus-Bestimmung, Selektion und Anti-Patterns sind in `PROMPT_MODULE_DAILY_HOROSCOPE.md` definiert. Dieser Skill ist nicht autonom — er setzt das Modul um.

**Der Skill formuliert ausschließlich:**
- Slot 2 (Brücke ins Heute) im Tagespuls
- Slot 3 (Impuls) im Tagespuls
- Die komplette Tagesdeutung in Phase 2

**Der Skill formuliert NIE:**
- Slot 1 (Aphorismus). Der wird aus der Sammlung gezogen, nicht generiert.

**Voice-Quelle:** `BRANDVOICE.md`. Dieser Skill bricht die Voice-Attribute auf das Tageshoroskop herunter.

---

## Slot 2 — Brücke ins Heute

### Funktion

Übersetzt den Aphorismus in den heutigen Tag des Users, ohne Schärfe zu verlieren.

### Regeln

- 10–20 Wörter
- Du-Form, direkt
- Alltags-Deutsch
- Kein Zodiac-Name, kein Grad, kein astrologisches Insider-Wort
- Keine Wiederholung des Aphorismus-Wortlauts
- Bezug zum Aphorismus muss erkennbar sein, ohne ihn zu erklären

### Anker für die Formulierung

Der Slot 2 darf einen der folgenden Anker setzen, mehr nicht:
- Eine konkrete Tagessituation („eine Entscheidung, die heute fällt")
- Eine innere Lage des Users („du weißt mehr, als du dir zugestehst")
- Eine Beobachtungsempfehlung („was du heute übersiehst, wird morgen lauter")

### Beispiele

Aphorismus: *„Wer den Fluss kennt, fürchtet die Brücke nicht."*
Slot 2: *„Du weißt heute mehr über deine Lage, als du dir zugestehst."*

Aphorismus: *„Es ist nicht das Was, sondern das Wie." — Moltke*
Slot 2: *„Was heute zu tun ist, weißt du schon. Wie du es tust, entscheidet sich erst."*

Aphorismus: *„Der Stein wird vom Wasser geformt, nicht von der Kraft." — Laozi-nah*
Slot 2: *„Heute trägt Wiederholung mehr als ein einzelner Schub."*

---

## Slot 3 — Impuls

### Funktion

Liefert einen Handlungsimpuls oder eine Beobachtungs-Aufforderung mit offenem Ausgang.

### Regeln

- 10–15 Wörter
- Verb-getrieben
- Offener Ausgang (kein Versprechen, kein Outcome)
- Keine Affirmation („Du schaffst das")
- Keine Ermächtigungsfloskel („Du bist bereit")
- Keine Warnung („Vorsicht vor …")

### Erlaubte Formen

- Imperativ: „Schau hin, ohne sofort zu bewerten."
- Frage: „Was würdest du tun, wenn du es heute genau wüsstest?"
- Beobachtungs-Vorschlag: „Achte heute auf Wiederholungen, die dir auffallen."
- Bedingungs-Satz: „Wenn etwas zögert, lass es zögern."

### Beispiele

- *„Lass das Vertraute den ersten Schritt machen."*
- *„Schau hin, ohne sofort zu bewerten."*
- *„Achte auf den Punkt, an dem du normalerweise abbrichst."*
- *„Eine Sache zu Ende, bevor du die nächste anfängst."*

---

## Phase 2 — Tagesdeutung

### Eingang

Phase 2 wird **nur** ausgelöst nach User-Wahl. Eingabe an die LLM:

```
modus:        pulse | trace | spannung
intensity:    float [0, 1]
aphorismus:   text aus Phase 1
gewählter:    archetyp_name + zeichen_oder_element + house_oder_palace_optional
rat_rest:     liste der fünf nicht gewählten Figuren (für mode=pulse benötigt)
```

### Modus-Logik (zwingend)

| modus | Konstruktion |
|-------|--------------|
| pulse | Gewählter Archetyp ist Hauptbezug. 1 bis 3 weitere Figuren werden mitgenannt, ohne hervorgehoben zu werden. Sprache ist tragend, nicht zuspitzend. |
| trace | Nur der gewählte Archetyp wird benannt. Die anderen fünf kommen im Text nicht vor. Sprache ist direkt und schärfer als bei pulse. |
| spannung | Genau zwei Figuren werden in zeitlicher Abfolge benannt: der gewählte und genau eine weitere. Sprache benennt die Sequenz („zuerst … dann …"). |

### Gemeinsame Regeln aller Modi

- 50–90 Wörter, 3–4 Sätze
- Du-Form
- Zeichen- und Element-Namen sind hier erlaubt (Skorpion, Wasser, Holz)
- Astrologische Mechanik bleibt verboten („weil Mars in Konjunktion …")
- Keine Wertung des Tages („gut", „schwer", „herausfordernd")
- Keine Wiederholung des Aphorismus-Wortlauts
- Der Aphorismus aus Phase 1 wird semantisch fortgeführt, nicht zitiert

### Schärfe in Abhängigkeit von intensity

- intensity < 0.4 — ruhige, beschreibende Sätze
- 0.4 ≤ intensity < 0.7 — direkter, mit klarer Handlungs- oder Beobachtungs-Ebene
- intensity ≥ 0.7 — knapper, ein zusätzlicher Satz erlaubt, aber nicht mehr als 4 insgesamt

### Beispiele

**modus = trace, intensity = 0.72, gewählter = Mond Skorpion**

```
Dein Skorpion-Mond bekommt heute Material zum Arbeiten.
Du siehst eine Schicht unter der Oberfläche, die andere übersehen.
Schau hin, ohne sofort zu bewerten.
Was du heute beobachtest, wird morgen Daten sein, die du brauchst.
```

Konstruktions-Check: nur eine Figur (Mond Skorpion). Direkt. Keine Mechanik. Aphorismus-Anschluss erkennbar (Tiefe, Beobachtung), nicht zitiert.

**modus = pulse, intensity = 0.32, gewählter = Day-Master Wasser**

```
Dein Wasser-Day-Master trägt dich heute durch das Vertraute.
Sonne und Aszendent stehen daneben, ohne zu drängen.
Heute ist kein Tag für Beweise, sondern für Wiederholung.
```

Konstruktions-Check: Hauptbezug Day-Master, zwei weitere Figuren (Sonne, Aszendent) mitgenannt ohne Hervorhebung. Tragend. Drei Sätze.

**modus = spannung, intensity = 0.55, gewählter = Sonne Widder, zweite = Saturn-Jahrestier**

```
Deine Widder-Sonne und dein Jahrestier arbeiten heute nicht gleichzeitig.
Zuerst will deine Sonne loslegen, ohne zu fragen.
Dann braucht das Jahrestier den zweiten Blick auf das, was schon läuft.
Wenn du beide Phasen zulässt, hält der Tag.
```

Konstruktions-Check: zwei Figuren in Sequenz benannt. Zeitliche Marker („zuerst", „dann"). Vier Sätze (intensity > 0.5 erlaubt).

---

## Anti-Patterns mit Korrektur

| Generiert | Problem | Korrektur |
|-----------|---------|-----------|
| „Heute pulsiert Erde." | Element steht im Raum, tut nichts. | „Erde trägt dich heute durch das Vertraute." |
| „Die kosmische Energie des Wasser-Elements …" | Esoterik-Floskel. | „Wasser zieht dich heute nach innen." |
| „Vorsicht vor Konflikten heute!" | Warnung, Wertung, Ausrufezeichen. | „Wenn etwas reibt, lass es reiben, ohne es zu lösen." |
| „Dein Sternzeichen steht unter Mars-Einfluss." | Astrologische Mechanik in Phase 2. | „Dein Skorpion bekommt heute Material zum Arbeiten." |
| „Lass los und vertraue dem Universum." | Pinterest-Esoterik. | „Eine Sache zu Ende, bevor du die nächste anfängst." |
| „Heute wird ein wundervoller Tag." | Wertung, leeres Versprechen. | (streichen — kein Ersatz, der Slot fällt weg) |
| In trace-Modus: „Dein Skorpion-Mond, deine Sonne und dein Day-Master …" | Andere Archetypen mitgenannt, obwohl trace = Abgrenzung. | Nur Skorpion-Mond benennen, andere streichen. |
| In pulse-Modus mit fünf mitgenannten Figuren | Mehr als drei. | Auf 1–3 Figuren reduzieren. |

---

## Qualitäts-Check vor Auslieferung

Jeder Slot-2-, Slot-3-Text und jede Tagesdeutung muss diese fünf Fragen bestehen:

1. **Wortzahl im Limit?** (Slot 2: 10–20, Slot 3: 10–15, Phase 2: 50–90)
2. **Modus-Logik eingehalten?** (Anzahl mitgenannter Figuren stimmt zum Modus)
3. **Keine astrologische Mechanik in Phase 1?** (in Phase 2 erlaubt, aber ohne „weil")
4. **Keine Wertung, keine Affirmation, keine Pinterest-Floskel?**
5. **Aphorismus-Bezug erkennbar, aber nicht wörtlich wiederholt?**

Bei Nein in einer Frage: Text verwerfen und neu generieren. Keine Patches.

---

## Verweise

- Architektur und Schema: `PROMPT_MODULE_DAILY_HOROSCOPE.md`
- Voice-Attribute: `BRANDVOICE.md`
- Aphorismus-Pool: `packages/voice/data/aphorisms.json`
- Vault-Heimat der Aphorismen: `knowledge/bazodiaac-brain/aphorisms/`
