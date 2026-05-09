---
name: aphorism-curator
description: Use this skill EVERY TIME an aphorism is added, validated, corrected, or imported into the Bazodiac collection under knowledge/bazodiaac-brain/aphorisms/. Verifies source attribution against trusted sources, refines DE and EN translations against the semantic core of the original, enforces the bilingual aphorism schema exactly (YAML frontmatter, body sections, blockquote, controlled vocabulary, attribution status), recomputes word counts, and either delivers a clean .md file or sorts the entry out with a reasoned verdict when attribution is unclear or rights are fraught. Triggers on phrases like "neuer Aphorismus", "Aphorismus hinzufügen", "kurate diesen Spruch", "validiere dieses Zitat", "Block 2 / Block 3", "Aphorismus-Eintrag", "ist dieser Spruch von …", "passt die Zuschreibung". Manual schema enforcement is error-prone — past four files contained eight independent schema violations.
---

# Aphorism Curator

## Why this skill exists

Bazodiacs Aphorismen-Sammlung ist Marken-Asset und Quelle der Tagespuls-Slot-1-Auswahl. Jeder Eintrag muss schema-treu, audit-tauglich zugeschrieben, in beiden Sprachen aphoristisch tragend und semantisch nah am Original sein. Manuelle Eingaben verletzen das Schema systematisch — in einem realen Block von vier Aphorismen gab es acht Schema-Verstöße: vier falsche Wortzahlen, zwei falsche `original_language`, ein falsches Jahr, ein `tone/mode`-Konflikt, plus latente Probleme bei Übersetzungs-Treue und Zuschreibungs-Status.

Dieser Skill bringt einen rohen Eintrag durch sechs Phasen und liefert entweder ein gültiges `.md`-File mit `status: review` oder eine klare Aussortierung mit Begründung. Nichts dazwischen.

**Nicht-Ziel:** Aphorismen erfinden. Der Skill arbeitet immer auf existierenden Sätzen.

## Six-Phase Workflow

### Phase 1 — Intake

Akzeptiere als Input eine der folgenden Formen:

- Roher Spruch mit Autor-Behauptung: *„Hannah Arendt: Niemand hat das Recht zu gehorchen."*
- Spruch ohne klaren Autor: *„Gedacht ist nicht gesagt, gesagt ist nicht gehört …"*
- Existierender Draft mit Frontmatter, der gegen Schema geprüft werden soll
- Block aus mehreren Aphorismen (1–20 Stück) — dann Phasen 2–6 pro Eintrag durchlaufen, am Ende konsolidieren

Frage einmalig beim Intake nach, falls unklar:
- Soll Sprache automatisch übersetzt werden (LLM-Vorschlag, kuratiert) oder gibt es eine etablierte Übersetzung?
- Welcher Themen-Modus ist im Auge — Pulse, Trace, Spannung? (Hinweis, nicht zwingend — wird in Phase 4 sowieso überprüft)

### Phase 2 — Source Verification

Diese Phase ist die wichtigste. Eine falsche Zuschreibung beschädigt die Marke.

Verifiziere die Zuschreibung gegen vertrauenswürdige Quellen. Bei Unklarheit: Web-Recherche.

**Heuristiken nach Autoren-Kategorie:**

- *Klassische Antike (Seneca, Marc Aurel, Cicero, Heraklit, Epiktet):* Originaltext im Werk lokalisieren. Bei Seneca-Briefen: Buch und Brief-Nummer (z. B. *Ep. 104,26*). Bei Marc Aurel: Buch und Abschnitt (*III, 5*). Wenn nicht lokalisierbar → `attribution_status: disputed`.

- *Östliche Klassiker (Laozi, Konfuzius, Buddha, Mencius):* Mehrere Übersetzungen vergleichen. Konzentriere dich auf den semantischen Kern, nicht auf wörtliche Treue der Übersetzung. **Achtung Buddha-Zitate:** Sehr viele moderne Buddha-Zitate sind nicht im Pali-Kanon belegt — automatisch Verdacht auf `apocryphal`.

- *Moderne Denker (Frankl, Fromm, Arendt, Sontag, Foucault):* Im publizierten Werk mit Werks-Titel und Jahr suchen. Achtung auf Sprachen-Falle: viele dachten/schrieben mehrsprachig, das Erstpublikations-Werk bestimmt `original_language`. Beispiel: Erich Fromm schrieb *Escape from Freedom* 1941 auf Englisch in den USA, *Die Furcht vor der Freiheit* ist die Übersetzung 1945.

- *Berüchtigt häufig falsch zugeschrieben:* Albert Einstein, Mark Twain, Buddha, Abraham Lincoln, Voltaire, Gandhi, Marilyn Monroe, Konrad Lorenz, Henry Ford. Bei diesen Autoren immer skeptisch beginnen — die meisten umlaufenden Zitate sind apokryph.

- *Filme, Games, Songs, Serien:* Quelle muss exakt sein (Film/Episode + Jahr + Szene oder Charakter, falls Dialog). Achtung Urheberrecht: Filme und Games sind unter Copyright, längere wörtliche Zitate gehen nicht unter Zitatrecht. Faustregel: wenn die Verwendung kommerziellen Zweck hat (Bazodiac ist kostenpflichtig), bei Film/Game/Song-Zitaten lieber paraphrasieren oder aussortieren, außer der Spruch ist explizit gemeinfrei oder unter freier Lizenz.

- *Persönlichkeiten (Sportler, Politiker, Unternehmer):* Originalquelle (Interview, Rede, Buch) lokalisieren. Bei Pressekonferenzen oder Interviews: Datum und Outlet als `work` festhalten.

**Suche nach Verbatim-Match:**

Beim Verifizieren immer nach dem **wörtlichen Satz im Originalwerk** suchen. Wenn nur eine Paraphrase oder eine ähnliche Idee gefunden wird → das ist `disputed`, nicht `verified`. Erfasse die tatsächliche wörtliche Form im `attribution_note`.

### Phase 3 — Attribution Status

Setze einen von vier Werten basierend auf Phase-2-Befund:

| Status | Bedingung | Beispiele |
|--------|-----------|-----------|
| `verified` | Wörtlich im Originalwerk lokalisiert mit Werks-Stelle | Seneca *Ep. 104,26*; Hannah Arendt im Spiegel-Interview 1964 |
| `disputed` | Häufig zugeschrieben, Quellenlage unklar oder paraphrasierend | Frankl-Raum-Spruch (geprägt von Covey 1989); Lorenz' Kommunikationsleiter |
| `apocryphal` | Bekannt falsch zugeschrieben, aber so verbreitet, dass die Tradition Teil der Wirkung ist | „Ich denke, also bin ich" als Buddha-Spruch; Einstein-Zitate über Bienen |
| `folkloric` | Volksmund, Sprichwort, ohne Einzelautor | „Wer rastet, der rostet"; „Wo gehobelt wird, fallen Späne" |

**Pflichtfeld bei `≠ verified`:** `attribution_note` — knapp, sachlich, ein Satz. Beispiel: *„Häufig Frankl zugeschrieben; in dieser Form geprägt von Stephen Covey 1989."*

**Aussortier-Bedingungen** (kein Eintrag, sondern Verwerfen):
- Originalquelle nicht identifizierbar UND Zuschreibung möglicherweise erfunden → aussortieren
- Wörtlich aus Film/Game/Song mit Copyright-Risiko und nicht unter Zitatrecht subsumierbar → aussortieren
- Spruch wird im Internet als „Anonymous" gehandelt aber dem User nur über Pinterest/Instagram bekannt → aussortieren (typisch Mindset-Müll)

### Phase 4 — Translation Discipline

Beide Sprachen müssen als **Aphorismus** funktionieren — knapp, treffend, du-fähig in DE bzw. you-fähig in EN. Wörtliche Übersetzung ohne Aphorismus-Qualität ist kein gültiger Endzustand.

**Workflow:**

1. Identifiziere `original_language`. Die Sprache, in der der Autor das **erstpublizierte Werk** verfasst hat. Nicht die Sprache, in der man es kennt.
2. Wenn `original_language ∈ {de, en}`: Original-Sprache übernimmt unverändert (gemeinfreie Klassiker) oder behutsam (lebende Autoren unter Zitatrecht). Andere Sprache wird übersetzt, wenn nicht vorhanden.
3. Wenn `original_language ∉ {de, en}`: Beide Sprachen sind Übersetzungen, Original wird in `## Original` als Beleg geführt.
4. Bei Klassiker-Übersetzungen aus dem Public Domain: bevorzuge etablierte gemeinfreie Übersetzungen (Strauss 1870 für Laozi, Apelt 1924 für Seneca, Wilhelm 1910 für Konfuzius). Trage in `translator_de` / `translator_en` als `"Strauss-1870"` ein.
5. Bei eigener Übersetzung: nutze LLM-Vorschlag, prüfe gegen Original, kuratiere. `translator_*: "ChatGPT, kuratiert"` oder `"Claude, kuratiert"`. Kein `"ben"`, kein `"llm-curated"` — diese sind nicht audit-tauglich und werden vom Build-Script abgelehnt.
6. Bei Ben-eigenen Übersetzungen voller Name: `translator_*: "Benjamin Poersch"`.

**Qualitäts-Tests pro Übersetzung (alle vier müssen passieren):**

- *Aphoristik-Test:* Liest sich der Satz als Aphorismus, oder als Übersetzungs-Übung? Ein guter Aphorismus hat Rhythmus und Pointe. Eine Übersetzung, die nur „korrekt" ist, ist nicht genug.
- *Semantischer-Kern-Test:* Trifft die Übersetzung den Kern des Originals oder verschiebt sie ihn? Beispiel: Senecas *„Non quia difficilia sunt non audemus"* — der Kern ist die Inversion (nicht Schwere ist Hindernis, sondern Nicht-Wagen ist Schwere). Wenn die Übersetzung diese Inversion verliert oder verschwimmt, ist sie nicht akzeptabel.
- *Du-Test (DE):* Funktioniert der Satz mit „Du"-Ansprache, oder klingt er steif?
- *You-Test (EN):* Klingt der Satz natürlich-englisch, oder nach übersetztem Deutsch?

Wenn eine der vier Sprachfassungen nicht alle Tests passiert: `status: draft` und Editor-Notiz, was nachzuarbeiten ist.

### Phase 5 — Schema Conformity

Prüfe gegen das fixierte Schema (siehe `Schema Reference` unten). Acht Regeln, die in der bisherigen Praxis am häufigsten verletzt wurden:

1. **Pflichtfelder vollständig:** `id`, `status`, `text_de`, `text_en`, `source.author`, `source.original_language`, `copyright`, `attribution_status`, `mode_tags`, `quality_rating`, `word_count_de`, `word_count_en`. `attribution_note` ist Pflicht bei `attribution_status ≠ verified`.

2. **Wortzahlen exakt:** Nicht schätzen. Wörter zählen heißt: durch Whitespace tokenisieren, Tokens zählen. Bindestrich-Konstrukte sind ein Wort („Day-Master"). Kontraktionen sind ein Wort („it's"). Gedankenstriche sind keine Wörter.

3. **`original_language` plausibel gegen Autor:** Erich Fromm publizierte *Escape from Freedom* auf Englisch — `original_language: en`. Seneca schrieb auf Latein — `original_language: la`. Frühere Praxis hat `de` als Default gesetzt; das ist falsch. Immer gegen das **Erstpublikations-Werk** prüfen.

4. **`## Original`-Sektion korrekt platziert:**
   - Wenn `original_language ∈ {de, en}` → Sektion **muss fehlen**. Eine leere Sektion mit nur Headline löst Build-Fehler aus.
   - Wenn `original_language ∉ {de, en}` → Sektion **muss vorhanden** sein und einen nicht-leeren Blockquote enthalten.

5. **`tone_tags` und `mode_tags` müssen zueinander passen.** Pulse ist ruhig, tragend, weich — Tone-Tags wie `ruhig`, `weisheitlich`, `kontemplativ`. Trace ist direkt, scharf, geladen — Tone-Tags wie `scharf`, `drängend`, `klar`. `tone: scharf` mit `mode: pulse` ist ein Konflikt — ändere `mode_tags` auf `[trace]`.

6. **Translator-Strings sind Audit-tauglich:** Voller Name oder klare LLM-Bezeichnung. `"ben"` und `"llm-curated"` sind verboten.

7. **Slot-1-Wortzahl-Limit (8–20 Wörter):** Aphorismus muss in dieser Spanne liegen, sonst greift das Selektions-Tool ihn nicht. Bei längeren Klassikern (Seneca, Marc Aurel): verkürzen oder Limit explizit anheben (Schema-Entscheidung).

8. **Filename folgt `aph-NNNN.md`** — vier Stellen, nullgepolstert. ID im Frontmatter muss mit Filename matchen. Optional Slug anhängen: `aph-0042-fluss-und-bruecke.md`.

### Phase 6 — Output

Liefere genau eines der drei Ergebnisse:

**Output A — Sauberer Eintrag:** Komplettes `.md`-File, das alle Phasen-5-Checks passiert. Default `status: review` (nicht `approved`) — der Mensch kuratiert die letzte Stufe.

**Output B — Sortier-Eintrag mit Anpassungs-Bedarf:** `.md`-File mit `status: draft`, plus expliziter `editor_notes`-Eintrag, was noch zu tun ist (z. B. *„Übersetzungs-EN versteift, Synonym für 'tugendhaft' suchen."*). Plus knappe Erklärung im Skill-Output, was angepasst werden muss.

**Output C — Aussortierung:** Kein `.md`-File. Klare Erklärung, warum der Spruch nicht aufgenommen wird. Beispiele:
- *„Quelle nicht verifizierbar; vermutlich Pinterest-Origin, kein Buddha-Beleg."*
- *„Wörtlich aus 'The Matrix', 1999, Wachowski. Urheberrecht der Studios; Verwendung in kostenpflichtiger App nicht durch Zitatrecht gedeckt."*
- *„Verbatim-Match nicht gefunden, Wendung gehört zu vielen anderen Autoren — keine eindeutige Zuschreibung."*

## Schema Reference

```yaml
---
id: aph-NNNN                        # PFLICHT, vier Stellen, matcht Filename
status: draft                       # PFLICHT, draft | review | approved | retired
author: Hannah Arendt               # PFLICHT
work: "Was bleibt? Spiegel-Interview"  # optional, wenn bekannt
year: 1964                          # optional
original_language: de               # PFLICHT, de | en | zh | la | grc | fr | it | sa | ar | ja | ru | ...
translator_de:                      # leer wenn original_language == de
translator_en: "ChatGPT, kuratiert" # leer wenn original_language == en
copyright: Zitatrecht               # PFLICHT, PD | Zitatrecht | eigene-Übersetzung | lizenziert
attribution_status: verified        # PFLICHT, verified | disputed | apocryphal | folkloric
attribution_note:                   # PFLICHT wenn status ≠ verified
mode_tags: [trace]                  # PFLICHT, Subset von: pulse, trace, spannung
tone_tags: [scharf]                 # frei, kontrolliert via _meta/tone_vocab.md
element_affinity: []                # optional, Subset von: wasser, feuer, erde, holz, metall
figure_affinity: []                 # optional, Subset von: sonne, mond, aszendent, day_master, jahrestier, wuxing_dom
season_affinity: []                 # optional, Subset von: fruehling, sommer, herbst, winter
word_count_de: 6                    # PFLICHT, exakt gezählt
word_count_en: 7                    # PFLICHT, exakt gezählt
quality_rating: 5                   # PFLICHT, 1–5
first_used: null                    # null lassen
cooldown_days: 30                   # Default 30
editor_notes: ""                    # frei
---

## DE

> Niemand hat das Recht zu gehorchen.

## EN

> No one has the right to obey.

## Slot-2-Kandidaten DE

- 

## Slot-2-Candidates EN

- 

## Editor-Kontext

(sprachneutral in DE: warum dieser Aphorismus, wann er passt, was er nicht ist)

## Verwandt

- 
```

Bei `original_language ∉ {de, en}` zusätzlich:

```markdown
## Original

> Non quia difficilia sunt non audemus, sed quia non audemus difficilia sunt.
```

## Real-World Anti-Patterns

Aus dem ersten echten Block (aph-0001 bis aph-0004), zur Schärfung des Blicks:

| Verstoß | Fall | Korrektur |
|---------|------|-----------|
| `tone_tags: [scharf]` mit `mode_tags: [pulse]` | aph-0001, aph-0004 | `mode_tags: [trace]` — scharfe Sprache gehört zu Trace, nicht Pulse |
| `original_language: de` für englisches Originalwerk | aph-0003 (Erich Fromm, *Escape from Freedom* 1941) | `original_language: en`, `translator_de` setzen |
| `original_language: de` für lateinisches Originalwerk | aph-0004 (Seneca) | `original_language: la`, `## Original`-Sektion füllen, `translator_de` und `translator_en` setzen |
| `year: 0` | aph-0004 (Seneca) | Es gibt kein Jahr 0. *Ep. 104,26* wurde um 65 n. Chr. verfasst. |
| Wortzahl falsch gezählt | alle vier | exakt zählen: durch Whitespace tokenisieren |
| `## Original`-Sektion leer aber vorhanden bei `original_language: de` | alle drei DE-Originale | Sektion komplett löschen — leere Headline löst Build-Fehler aus |
| `translator_*: "ben"` | bei eigener Übersetzung | Voller Name `"Benjamin Poersch"` (Audit-Tauglichkeit) |
| `attribution_status` nicht gesetzt bei zweifelhafter Zuschreibung | aph-0002 (Frankl-Raum-Spruch — Covey 1989) | `attribution_status: disputed` mit `attribution_note` |

## Workflow für Block-Verarbeitung

Bei mehreren Aphorismen (typisch: 4–8 pro Block):

1. Phase 1 für alle: Intake-Liste erstellen
2. Phase 2 parallel: Quellenrecherche (Web-Suche, Werks-Verifikation) für jeden gleichzeitig
3. Phase 3 individuell: Status pro Eintrag
4. Phase 4 individuell: Übersetzungs-Disziplin
5. Phase 5 individuell: Schema-Check
6. Phase 6: Block-Übersicht ausgeben mit Status pro Eintrag (Output A/B/C)

Block-Übersicht-Format:

```
Block-Ergebnis (4 Einträge):
✓ aph-0001 — Hannah Arendt — review (alle Checks passiert)
⚠ aph-0002 — Frankl-Raum-Spruch — review (disputed, mit Covey-Note)
⚠ aph-0003 — Erich Fromm — draft (original_language korrigiert, EN-Übersetzung verstärken)
✗ aph-0004 — Seneca — draft (Slot-1-Limit-Verstoß; Verkürzung nötig oder Limit-Entscheidung)
```

## Verweise

- Schema-Quelle: `PROMPT_MODULE_DAILY_HOROSCOPE.md`
- Vault-Heimat: `knowledge/bazodiaac-brain/aphorisms/`
- Template: `knowledge/bazodiaac-brain/_templates/aphorism.md`
- Voice-Regeln (für Slot 2/3 in der Tagespuls-Generierung): `.claude/skills/day-pulse-trace/SKILL.md`
- Architektur-Memory: `project_home_page_fokus.md`

## Common Mistakes

- **„Die Übersetzung ist OK, nur etwas hölzern" akzeptieren.** Nein — wenn die Übersetzung nicht aphoristisch trägt, geht der Eintrag zurück auf `status: draft`. Ein hölzerner Aphorismus liefert keinen guten Tagespuls.

- **Bei berühmten Autoren auf Verifikation verzichten.** Gerade bei Einstein, Buddha, Twain, Lincoln, Voltaire ist Skepsis Pflicht — die Wahrscheinlichkeit, dass ein gehandeltes Zitat tatsächlich von ihnen ist, ist statistisch unter 50 %.

- **`attribution_note` als Marketing-Text formulieren.** Die Note ist sachlich, knapp, faktisch — nicht „eine wundervolle Wendung in der Tradition Frankls", sondern „Häufig Frankl zugeschrieben; geprägt von Stephen Covey 1989."

- **Wortzahlen schätzen statt zählen.** In allen vier ersten Files wurde geschätzt, in allen vier waren sie falsch. Wenn das Build-Script noch nicht steht, manuell durchzählen.

- **`mode_tags` aus dem Bauch wählen.** Lies den Aphorismus, frag dich: Ist das eine Beobachtung, ein Trost, ein Halt? → Pulse. Ist das ein Pfeil, eine Frage, eine Konfrontation? → Trace. Bei Inversionen, Paradoxien, Sequenzen → Spannung.

## Confidence-Level für eigene Verdikte

Beim Output gib einen Hinweis auf eigene Sicherheit:

- *„Hohe Sicherheit"* — wenn Verbatim-Match im Originalwerk gefunden, Schema sauber durchgeprüft, beide Übersetzungen passieren alle Tests.
- *„Mittlere Sicherheit"* — Quelle plausibel aber nicht 100 % verifiziert; Übersetzung könnte pointierter sein.
- *„Niedrige Sicherheit"* — Quellenlage zweifelhaft, Übersetzung wahrscheinlich verbesserungsbedürftig, mehrere Schema-Felder unsicher.

Bei niedriger Sicherheit: explizit empfehlen, dass Ben den Eintrag manuell prüft, bevor er auf `status: review` wandert.
