# Feature: Completed Quiz Status

## Übersicht

Abgeschlossene Quizze werden für den Nutzer visuell als erledigt gekennzeichnet: ausgegraut mit einem roten "Completed"-Stempel.

---

## Anforderungen

### Visuelle Darstellung

- [ ] Abgeschlossene Quiz-Karten werden ausgegraut (Opacity oder Grayscale-Filter)
- [ ] Roter "Completed"-Stempel wird über der Karte angezeigt
- [ ] Stempel-Design: Schräg, stempelartig, mit roter Farbe

### Datenquelle

- [ ] Prüfung ob Quiz bereits abgeschlossen (aus Profil/Snapshot)
- [ ] `completedQuizzes: string[]` Array im User-Profil

### Betroffene Seiten

- [ ] Quiz-Übersichtsseite (`/verticals/quiz`)
- [ ] Dashboard/Altar-Ansicht (falls Quizze dort angezeigt werden)

---

## Technische Umsetzung

### Neue Komponente

```tsx
// CompletedBadge.tsx
export function CompletedBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="
        text-red-600 font-bold text-2xl uppercase
        border-4 border-red-600 rounded-lg px-4 py-2
        rotate-[-12deg] opacity-90
      ">
        Completed
      </span>
    </div>
  );
}
```

### Quiz-Karte Anpassung

```tsx
// QuizCard.tsx
<div className={cn(
  "relative",
  isCompleted && "grayscale opacity-60"
)}>
  <QuizContent />
  {isCompleted && <CompletedBadge />}
</div>
```

### Profil-Schema Erweiterung

```typescript
interface ProfileSnapshot {
  // ... existing fields
  completedQuizzes?: string[]; // ["love-languages", "personality", ...]
}
```

---

## Akzeptanzkriterien

1. Abgeschlossene Quizze sind visuell ausgegraut
2. Roter "Completed"-Stempel ist sichtbar
3. Status wird korrekt aus dem Profil geladen
4. Nicht-abgeschlossene Quizze bleiben normal

---

## Abhängigkeiten

- User Account System (für persistente Speicherung)
- ProfileSnapshot-Erweiterung

## Priorität

**Mittel** – Wichtig für UX

## Geschätzter Aufwand

1 Tag
