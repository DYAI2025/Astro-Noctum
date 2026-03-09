from pathlib import Path

mapping = """# AI_MAPPING_LEXICON.md — QuissMe (Flow / Spark / Talk)
**Produktname (UI-Titel):** **QuissMe** (exakt so)  
**Version:** v1.0  
**Zweck:** Sprach- und Output-Baukasten für KI-Deutungen aus Quiz-Ergebnissen + DuoDynamic (Entertainment, warm, nicht-diagnostisch).  
**Locales:** de-DE, en-US

---

## 1) Grundmodell: Drei Zonen statt „gut/schlecht“

QuissMe übersetzt jede Quiz-Welt (Filme, Werte, Bindung, Alltag, Intimität, etc.) auf eine Meta-Ebene:

- **Flow Zone**: hohe Deckungsgleichheit → leicht, stabil, „gleiche Sprache“  
- **Spark Zone**: Komplementarität im Optimum → Spannung/Anziehung ohne Überforderung  
- **Talk Zone**: Differenz zu groß → braucht Abstimmung/Übersetzen (niemals „Problem“)

**Wichtig:** Zonen sind *Spiegel*, keine Diagnose. Immer Chance-orientiert.

---

## 2) Guardrails (Hard Rules)

### 2.1 Darf immer

- Möglichkeitsform: „kann / manchmal / oft / möglicherweise“ | “might / sometimes / often”
- Systemisch statt individuell beschuldigend: „zwischen euch / in eurer Dynamik“ | “between you / in your dynamic”
- Einladende Micro-Ideen: „Vielleicht hilft…“ | “A small idea…”

### 2.2 Darf nie

- Diagnose/Labeling: „krank“, „Störung“, „Therapie“, „toxisch“, „du bist…“ | “disorder”, “toxic”, “you are…”
- Imperativdruck/Urteil: „du musst“, „ihr solltet“, „falsch“ | “you must”, “should”, “wrong”
- Angst/Unsicherheit triggern: „Warnsignal“, „gefährlich“, „Trennung“ | “red flag”, “danger”, “break up”

### 2.3 Optionaler Disclaimer (nur in Long Text, 1 Satz)

- **DE:** „Nur als spielerische Perspektive — kein Rat und kein Urteil.“  
- **EN:** “Just a playful perspective — not advice or a verdict.”

---

## 3) Zulässige Input-Tokens (keine Rohantworten)

Gib der KI ausschließlich aggregierte Tokens; niemals Rohantworten eines Partners.

- `zone` ∈ {`flow`, `spark`, `talk`}
- `facet_label` (z.B. „Humor“, „Ritual“, „Direktheit“, „Abenteuer“ …)
- `axis` ∈ {`nähe`, `flow`, `reibung`} | EN: {`closeness`, `alignment`, `tension`}
- `insight_strength` (6–10 Wörter, positiv)
- `insight_growth` (6–10 Wörter, positiv gerahmt)
- `micro_step` (optional, 1 Satz, druckfrei)
- `buff_name` (optional)
- `astro_context_tag` (optional; nur Ton/Timing, kein Score-Driver)
- `tone` ∈ {`warm_minimal`, `playful`, `premium_poetic`}
- `locale` ∈ {`de-DE`, `en-US`}

---

## 4) Zonen-Vokabular (DE/EN)

### 4.1 Flow Zone

**DE:**

- „Hier seid ihr auf derselben Wellenlänge.“
- „Das trägt euch im Alltag.“
- „Das funktioniert oft ohne große Erklärung.“

**EN:**

- “You’re on the same wavelength here.”
- “This naturally supports you.”
- “It often works without much effort.”

### 4.2 Spark Zone

**DE:**

- „Das ist euer Sweet Spot: unterschiedlich genug, um spannend zu bleiben.“
- „Hier entsteht Anziehung durch Kontrast.“
- „Ein Unterschied, der euch lebendig macht.“

**EN:**

- “This is your sweet spot—different enough to stay exciting.”
- “You create attraction through healthy contrast.”
- “It’s the fun kind of different.”

### 4.3 Talk Zone (immer weich, nie problematisch)

**DE:**

- „Hier lohnt sich eine gemeinsame Sprache.“
- „Kein Problem — eher ein Feld, wo Abstimmung viel bewirken kann.“
- „Wenn ihr hier kurz übersetzt, wird’s schnell leichter.“

**EN:**

- “This is a place where a shared language helps.”
- “Not a problem—more like an area where a little alignment goes a long way.”
- “A small ‘translation moment’ can make this feel lighter.”

---

## 5) Micro-Step Library (1 Satz, druckfrei) DE/EN

**DE:**

- „Vielleicht hilft ein Satz wie: ‚So meinte ich das gerade…‘“
- „Eine kleine Idee: Erst Gefühl, dann Bitte.“
- „Manchmal reicht: ‚Was würdest du dir an dieser Stelle wünschen?‘“
- „Vielleicht: 2 Minuten Check-in — ohne Lösungen, nur Verständnis.“

**EN:**

- “A small idea: feeling first, request second.”
- “Sometimes it helps to ask: ‘How did you mean that?’”
- “A gentle prompt: ‘What would feel good here?’”
- “You could try a 2-minute check-in—no fixing, just understanding.”

---

## 6) Output-Templates (Short Drop / Long Journey)

### 6.1 Short Drop (2–4 Sätze) — DE
>
> **Euer Lernmoment:** {insight_strength}.  
> **Was wirkt:** {zone_sentence}.  
> **Wachstum:** {insight_growth}.  
> **Mini-Idee:** {micro_step} *(optional)*

### 6.2 Short Drop — EN
>
> **Your moment:** {insight_strength}.  
> **What’s working:** {zone_sentence}.  
> **Growth:** {insight_growth}.  
> **Small idea:** {micro_step} *(optional)*

### 6.3 Long Journey (1–2 Absätze) — DE

**Absatz 1:** Warmes Spiegelbild (Zone + Facet, ohne Bewertung).  
**Absatz 2:** Einladender Ausblick + optional 1 Micro-Step + optional Disclaimer.

### 6.4 Long Journey — EN

Same structure.

---

## 7) Metaphern fürs Komplementaritäts-Optimum (DE/EN)

**DE:** „Sweet Spot“, „Unterschied mit Halt“, „spannender Kontrast“, „Balance aus Nähe und Freiraum“  
**EN:** “sweet spot”, “difference with safety”, “healthy contrast”, “balance of closeness and space”

---

## 8) Themen-Unabhängigkeitsregel (Filme vs. Bindung)

Die KI darf das Thema kurz erwähnen (1 Halbsatz), muss aber immer in die Meta-Ebene übersetzen:

- **DE:** „Egal ob Filmgeschmack oder Alltag: hier zeigt sich eure Art, euch abzustimmen.“  
- **EN:** “Whether it’s movie taste or everyday life, it reflects how you align as a duo.”
"""

core = """# CORE_MECHANICS.md — QuissMe (Independent Play → Shared Insight)
**Produktname (UI-Titel):** **QuissMe** (exakt so)  
**Version:** v1.0  
**Zweck:** Copy/paste-fertige „Core Mechanics“-Sektion für `Product_SPEC.md`.

---

## 1) Independent Play → Shared Insight (ohne Synchron-Zwang)

QuissMe funktioniert als Paar-Ritual ohne Terminzwang:  
Beide Partner*innen machen Quizzes **unabhängig** voneinander auf dem eigenen Handy, wann immer sie wollen.

**Wichtig:** Gemeinsame Erkenntnisse entstehen **nur**, wenn beide denselben **Quiz-Cluster (ClusterCycle)** abgeschlossen haben. Zeitversetzt ist ausdrücklich erlaubt.

**Warum:** Das schützt vor Druck, Vergleich und asymmetrischem Wissen.

---

## 2) Das zentrale Modell: Flow / Spark / Talk (statt gut/schlecht)

Jedes Quiz (egal ob „Filmtyp“ oder „Bindungsstil“) wird auf eine gemeinsame Meta-Ebene gemappt. Pro relevanter Facette entsteht eine Zone:

1) **Flow Zone (Deckungsgleichheit hoch)**  
   → Stabilität, Leichtigkeit, „ihr sprecht dieselbe Sprache“

2) **Spark Zone (Komplementarität optimal)**  
   → Anziehung/Spannung im „Sweet Spot“: unterschiedlich genug, aber nicht überfordernd

3) **Talk Zone (Differenz zu groß)**  
   → kein Problem-Label: ein Feld für Kommunikation, Verständnis, Akzeptanz („Übersetzen“)

**Produktziel:** Paare erleben Unterschiede als **Chance**, nicht als Zweifel.

---

## 3) Meta-Mapping: Wie jede Quiz-Welt in DuoDynamic übersetzt wird

Pro Quiz erzeugt die Engine 1–3 **Facet-Tags** (z.B. Humor, Ritual, Direktheit, Abenteuer, Nähe, Struktur …).  
Aus den beiden Einzel-Ergebnissen berechnet die Engine pro Facette:

- **Similarity** (wie ähnlich seid ihr?)  
- **Complementarity** (wie „sparkig / ausgleichend“ ist der Unterschied?)  
- **Divergence** (wo ist der Unterschied zu groß?)

Daraus entsteht die Zone (Flow/Spark/Talk) und ein Beitrag zum **DuoDynamic** Profil:

- **Stärken** (Flow + Spark, die bereits gut wirken)
- **Herausforderungen** (Talk, weich gerahmt)
- **Fähigkeiten** (was ihr zusammen könnt)
- **Blinde Flecken** (wo ihr euch leicht missversteht)

---

## 4) DuoDynamic Darstellung (UI)

DuoDynamic wird als **RPG-Style Stats** dargestellt:

- Traits als **Balken** (intern 0–100 möglich)  
- UI bleibt weich: keine Diagnose, keine harten Scores als Urteil  
- Tendenzen: **hoch / mittel / im Aufbau** + 1–2 warme Sätze

---

## 5) Cluster Gating: Wann das Paarprofil aktualisiert wird

Ein **ClusterCycle** gilt als „Duo Ready“, wenn:

- Partner A: completed = true  
- Partner B: completed = true  

Erst dann:

1) **Drop** (Stärken / Ausgleich / Wachstum) wird erzeugt und veröffentlicht  
2) **DuoDynamic** wird aktualisiert (sanft, nicht sprunghaft)  
3) **Genau 1 Buff** wird freigeschaltet (Surprise, nicht vorher angekündigt)  
4) Eine **KI-Deutung** wird erzeugt und als Station gespeichert (Journey)

---

## 6) Organic Update (Neuroplastik-Feeling, keine Sprünge)

Das DuoDynamic Profil aktualisiert sich „smooth“:

- neue Cluster beeinflussen Traits moderat  
- alte Themen werden mit der Zeit „weicher“, wenn sie nicht bestätigt werden  
- UI zeigt: „Euer Profil wird klarer“ statt Zahlen

---

## 7) Buff Mechanic (1 pro Cluster, 7 Tage, einmalig pro Paar)

Nach jedem gemeinsam abgeschlossenen ClusterCycle wird **ein Buff** freigeschaltet:

- Buff wird **vorher nicht angekündigt**  
- Buff ist ein **Meaning Moment**: Visualisierung des Lernwerts („Spiegel & Spiel“)  
- Buff wirkt **temporär**: Standard **1 Woche** (Countdown)  
- Buff „boostet“ gezielt passende Traits (Overlay-Segment auf Balken)

**Einmaligkeits-Regel:**  
Ein Buff darf pro Paar **nur einmal jemals** auftauchen. DB-seitig z.B. über Unique Constraint:  
`UNIQUE(couple_id, buff_id)` → existiert = permanent forbidden.

---

## 8) KI-Deutung (Entertainment, warm, nicht beratend)

Nach Cluster-Abschluss generiert die KI:

- einen kurzen Text für den Drop (2–4 Sätze)  
- einen längeren Text als Station in der Journey (1–2 Absätze)

**Hard Rules:** keine Diagnose, kein Coaching-Versprechen, keine Schuldzuweisung, immer Chance-orientiert.
"""

out_dir = Path("/mnt/data")
mapping_path = out_dir / "AI_MAPPING_LEXICON.md"
core_path = out_dir / "CORE_MECHANICS.md"
mapping_path.write_text(mapping, encoding="utf-8")
core_path.write_text(core, encoding="utf-8")

(mapping_path, core_path, mapping_path.stat().st_size, core_path.stat().st_size)
