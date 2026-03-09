# Feature: Quiz Ergebnis-UI Update

## Übersicht

Anpassung des Quiz-Ergebnis-Popups: Der "Nochmal"-Button wird durch einen "Zum Profil"-Button ersetzt.

---

## Anforderungen

### UI-Änderungen

- [ ] "Nochmal"-Button entfernen
- [ ] "Zum Profil"-Button hinzufügen
- [ ] Button navigiert zu `/character`
- [ ] Konsistentes Styling mit bestehendem Design

### Betroffene Komponenten

- [ ] Alle Quiz-Ergebnis-Screens
- [ ] Generische `QuizResult`-Komponente (falls vorhanden)

---

## Technische Umsetzung

### Änderungen

```tsx
// Vorher
<Button onClick={handleRestart}>Nochmal</Button>

// Nachher
<Link href="/character">
  <Button>Zum Profil</Button>
</Link>
```

### Betroffene Dateien

```
src/components/quizzes/
├── LoveLanguagesQuiz.tsx
├── PersonalityQuiz.tsx
├── AuraColorsQuiz.tsx
├── ... (alle Quiz-Komponenten)
```

---

## Akzeptanzkriterien

1. "Nochmal"-Button ist nicht mehr sichtbar
2. "Zum Profil"-Button erscheint stattdessen
3. Klick navigiert zur Character-Seite
4. Änderung gilt für alle Quizze

---

## Abhängigkeiten

- Keine

## Priorität

**Niedrig** – UI-Verbesserung

## Geschätzter Aufwand

0.5 Tage
