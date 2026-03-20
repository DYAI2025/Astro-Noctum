# MetaClaw Decision Framework

## Überblick

MetaClaw ist der lernende Entscheidungs-Bot für Bazodiac. Jede Feature-, Design- oder Code-Entscheidung wird an **BRAND_VOICE.md** und **TRUE_NORTH.md** gemessen.

---

## Decision Protocol

### Vor JEDER Entscheidung (Feature, Design, Code, Copy)

```
1. Dokumente lesen: BRAND_VOICE.md + TRUE_NORTH.md
2. Prüffrage stellen: "Bringt das den Organismus näher an sein Atmen — oder entfernt es ihn davon?"
3. Drei-Schichten-Test: Welcher Schicht dient diese Entscheidung?
   - Obsidian-Kern (deterministisch, unveränderlich)
   - Neurales Myzel (kausal, wachsend, modulierend)
   - Biolumineszente Membran (adaptiv, UI, Visual)
4. Fünf-Gesetze-Check: Verletzt die Entscheidung eines der Gesetze?
5. Brand-Voice-Check: Klingt das nach Bazodiac — oder nach nichts?
```

---

## Decision Matrix

### Frage 1: Welcher Schicht dient es?

| Entscheidung | Obsidian-Kern | Neurales Myzel | Biolumineszente Membran |
|-------------|---------------|----------------|------------------------|
| **FuFirE Engine** | ✅ Dient | ❌ Neutral | ❌ Neutral |
| **Quiz-Cluster** | ❌ Neutral | ✅ Dient | ⚠️ Berührt |
| **UI-Animation** | ❌ Neutral | ⚠️ Berührt | ✅ Dient |
| **Space Weather** | ❌ Neutral | ✅ Dient | ✅ Dient |
| **Paywall** | ❌ Neutral | ⚠️ Berührt | ✅ Dient |

**Regel:** Wenn eine Entscheidung keiner Schicht dient → **NICHT bauen.**

---

### Frage 2: Verletzt es eines der Fünf Gesetze?

| Gesetz | Verletzung | Beispiel |
|--------|-----------|----------|
| **1. Determinismus des Kerns** | Quiz verändert Geburtsdaten | ❌ Quiz ändert Soulprint-Sektoren basierend auf Antworten |
| **2. Modulation statt Mutation** | Live-Daten überschreiben Kern | ❌ Kp-Index > 7 ändert Day Master |
| **3. Kälte × Wärme** | Nur kalt oder nur warm | ❌ "Du bist ein Skorpion!" (nur kalt) oder "Alles wird gut! ✨" (nur warm) |
| **4. Keine fatalistischen Aussagen** | Urteil statt Prozess | ❌ "Ihr passt nicht zusammen" vs ✅ "Diese Spannung lädt euch ein, ..." |
| **5. Z-Achse, nicht Scroll** | Oberfläche statt Tiefe | ❌ Infinite Scroll für Horoskope vs ✅ Deep Dive in ein Haus |

**Regel:** Wenn ein Gesetz verletzt wird → **Entscheidung verwerfen oder anpassen.**

---

### Frage 3: Entspricht es der Brand Voice?

| Voice Attribut | Check | Fragen |
|---------------|-------|--------|
| **Präzise** | ✅/❌ | Ist die Aussage exakt und datengetrieben? Oder vage und allgemein? |
| **Warm ohne Weich** | ✅/❌ | Ist es empathisch ohne Watte? Oder kumpelhaft/casual? |
| **Souverän** | ✅/❌ | Erklären wir warum Astrologie "funktioniert"? Oder zeigen wir einfach? |
| **Prozess, nicht Urteil** | ✅/❌ | Beschreiben wir Dynamiken? Oder labeln wir Zustände? |

**Beispiel-Check:**

```
Text: "Du bist ein typischer Widder: impulsiv und kämpferisch!"

❌ Präzise? Nein — "typisch" ist vage, keine Grad-Angabe
❌ Warm ohne Weich? Nein — "kämpferisch" ist wertend
❌ Souverän? Nein — "typisch" ist Klischee
❌ Prozess, nicht Urteil? NEIN — "du bist" ist ein Urteil

→ TEXT VERWERFEN

Besser: "Deine Sonne steht bei 12° Widder. Das Mars-Dominanz lädt dich ein, Energie zu kanalisieren — nicht zu unterdrücken."
```

---

### Frage 4: Welcher Tonalität braucht dieser Kontext?

| Kontext | Dial Up | Dial Down |
|---------|---------|-----------|
| **Onboarding** | Wärme | Präzision |
| **Daily Horoscope** | Souveränität | Wärme |
| **Signatur-Reveal** | Wärme + Präzision | Alles andere |
| **Quiz-Ergebnis** | Wärme | Souveränität |
| **Premium Upsell** | Souveränität | Wärme |
| **Error / Downtime** | Präzision | Alles andere |
| **Space Weather Alert** | Präzision + Souveränität | — |

**Regel:** Falsche Tonalität = Nutzer-Verwirrung.

---

## MetaClaw Learning Loop

### Nach JEDER Entscheidung

```
1. Entscheidung dokumentieren (in Nuggets: progress/metaclaw-decisions)
2. Outcome beobachten (User-Feedback, Analytics, Bug-Reports)
3. Lernen: War die Entscheidung richtig?
   - Ja → Pattern merken (nuggets remember metaclaw-patterns)
   - Nein → Anti-Pattern merken (nuggets remember metaclaw-antipatterns)
4. Nächste Entscheidung besser machen
```

### Beispiel-Lernpfad

```
Entscheidung: "Quiz-Ergebnis zeigt 'Du bist ein Paladin!'"

MetaClaw Check:
❌ Verletzt Gesetz #4 (Prozess, nicht Urteil)
❌ Verletzt Brand Voice ("du bist" statt "dieses Muster lädt ein")

Outcome: User beschweren sich über "Boxen-Denken"

Lernen:
nuggets remember metaclaw-antipatterns "Quiz-Ergebnisse mit 'du bist' formuliert → User fühlen sich gelabelt"

Nächste Entscheidung:
"Quiz-Ergebnis zeigt 'Deine Rollenspiel-Seele trägt den Paladin in sich'"

MetaClaw Check:
✅ Gesetz #4 erfüllt (Prozess-Sprache)
✅ Brand Voice erfüllt ("trägt in sich" statt "bist")

Outcome: User-Feedback positiv

Lernen:
nuggets remember metaclaw-patterns "Quiz-Ergebnisse mit 'trägt in sich' formuliert → User fühlen sich verstanden"
```

---

## Nuggets Integration

### Decision Tracking

```bash
# Entscheidung dokumentieren
nuggets remember metaclaw-decisions "TASK-029: CloseButton entfernt | Begründung: UX-Polish, keine Kern-Änderung | Schicht: Membran"

# Pattern lernen
nuggets remember metaclaw-patterns "Quiz-Results: 'trägt in sich' > 'du bist' | User-Feedback: +23% positiv"

# Anti-Pattern lernen
nuggets remember metaclaw-antipatterns "Push-Nachrichten mit Emojis | User-Feedback: -15% Öffnungsrate | Grund: Wirkt wie Spam"
```

### Decision Review (wöchentlich)

```bash
# Alle Entscheidungen der Woche anzeigen
nuggets facts metaclaw-decisions

# Patterns anzeigen
nuggets facts metaclaw-patterns

# Anti-Patterns anzeigen
nuggets facts metaclaw-antipatterns
```

---

## Decision Templates

### Template 1: Feature-Entscheidung

```markdown
## Feature: [Name]

### Schichten-Check
- [ ] Obsidian-Kern: Dient / Berührt / Neutral
- [ ] Neurales Myzel: Dient / Berührt / Neutral
- [ ] Biolumineszente Membran: Dient / Berührt / Neutral

### Fünf-Gesetze-Check
- [ ] Gesetz 1 (Determinismus): ✅ / ❌
- [ ] Gesetz 2 (Modulation): ✅ / ❌
- [ ] Gesetz 3 (Kälte × Wärme): ✅ / ❌
- [ ] Gesetz 4 (Prozess): ✅ / ❌
- [ ] Gesetz 5 (Z-Achse): ✅ / ❌

### Brand-Voice-Check
- [ ] Präzise: ✅ / ❌
- [ ] Warm ohne Weich: ✅ / ❌
- [ ] Souverän: ✅ / ❌
- [ ] Prozess, nicht Urteil: ✅ / ❌

### Tonalität
- Kontext: [Onboarding / Daily / Signatur / Quiz / Upsell / Error / Alert]
- Dial Up: [Wärme / Präzision / Souveränität]
- Dial Down: [Wärme / Präzision / Souveränität]

### Entscheidung
✅ BAUEN / ❌ NICHT BAUEN / ⚠️ ANPASSEN

### Begründung
[Kurze Erklärung, warum diese Entscheidung mit True North + Brand Voice übereinstimmt]
```

### Template 2: Copy-Entscheidung

```markdown
## Copy: [Text-Stelle]

### Original
"[Text]"

### Brand-Voice-Check
- Präzise: ✅ / ❌ → [Warum?]
- Warm ohne Weich: ✅ / ❌ → [Warum?]
- Souverän: ✅ / ❌ → [Warum?]
- Prozess, nicht Urteil: ✅ / ❌ → [Warum?]

### Terminologie-Check
- [ ] Verwendet verbotene Begriffe? (siehe BRAND_VOICE.md Terminologie)
- [ ] Verwendet empfohlene Begriffe?

### Entscheidung
✅ BEHALTEN / ❌ ÄNDERN

### Bessere Version
"[Alternativer Text]"
```

---

## MetaClaw als Lern-Bot

### Workflow-Beobachtung

MetaClaw beobachtet alle Agenten-Workflows und lernt:

1. **Welche Entscheidungen führen zu positiven Outcomes?**
   - User-Feedback positiv
   - Analytics zeigen Engagement
   - Weniger Bugs/Support-Tickets

2. **Welche Entscheidungen führen zu negativen Outcomes?**
   - User-Beschwerden
   - Drop-off in Funnels
   - Mehr Bugs/Support-Tickets

3. **Welche Patterns wiederholen sich?**
   - Erfolgreiche Muster → verstärken
   - Gescheiterte Muster → vermeiden

### Auto-Activation

MetaClaw wird automatisch aktiv bei:

- Neuen Feature-Entscheidungen
- Copy-Änderungen (insb. User-facing)
- Design-Reviews
- Architektur-Entscheidungen
- Sprint-Planning (Priorisierung)

---

## Checkliste für Agents

**BEVOR du eine Entscheidung triffst:**

```
[ ] BRAND_VOICE.md gelesen (insb. Voice Attributes, Terminologie, Tonalität)
[ ] TRUE_NORTH.md gelesen (insb. Drei Schichten, Fünf Gesetze, Prüffrage)
[ ] Prüffrage gestellt: "Bringt das den Organismus näher an sein Atmen?"
[ ] Schichten-Check durchgeführt
[ ] Fünf-Gesetze-Check durchgeführt
[ ] Brand-Voice-Check durchgeführt
[ ] Entscheidung in Nuggets dokumentiert (metaclaw-decisions)
```

**NACH der Entscheidung:**

```
[ ] Outcome beobachtet (Feedback, Analytics, Bugs)
[ ] Gelerntes Pattern dokumentiert (metaclaw-patterns oder metaclaw-antipatterns)
[ ] Nächste Entscheidung besser gemacht
```

---

*Bazodiac · DYAI2025 · MetaClaw Decision Framework v1 — 20.03.2026*
