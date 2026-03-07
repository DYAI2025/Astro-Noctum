# Feature: Quiz Retake Warning

## Übersicht

Wenn ein Nutzer ein bereits abgeschlossenes Quiz erneut starten möchte, erscheint eine Warnmeldung, die darauf hinweist, dass die vorherigen Werte überschrieben werden.

---

## Anforderungen

### Warnmeldung

- [ ] Modal/Dialog mit Warnung
- [ ] Text: "Achtung, wenn du den Test nochmals machst, werden deine vorherigen Werte überschrieben"
- [ ] Zwei Buttons:
  - "Weiter" – Quiz erneut starten (Ergebnis wird überschrieben)
  - "Abbruch" – Zurück zur Übersicht (kein Start)

### Trigger

- [ ] Warnung erscheint nur bei bereits abgeschlossenen Quizzen
- [ ] Prüfung erfolgt beim Klick auf Quiz-Karte oder Start-Button

### UX-Verhalten

- [ ] Bei "Weiter": Quiz startet normal
- [ ] Bei "Abbruch": Modal schließt, User bleibt auf aktueller Seite

---

## Technische Umsetzung

### Warning Dialog Komponente

```tsx
// RetakeWarningDialog.tsx
interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  quizName: string;
}

export function RetakeWarningDialog({ isOpen, onConfirm, onCancel, quizName }: Props) {
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz wiederholen?</DialogTitle>
        </DialogHeader>
        
        <p className="text-amber-600">
          ⚠ Achtung, wenn du den Test nochmals machst, 
          werden deine vorherigen Werte überschrieben.
        </p>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Abbruch
          </Button>
          <Button onClick={onConfirm}>
            Weiter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration in Quiz-Navigation

```tsx
// QuizCard.tsx oder QuizStartPage.tsx
const [showWarning, setShowWarning] = useState(false);

const handleQuizClick = () => {
  if (isCompleted) {
    setShowWarning(true);
  } else {
    navigateToQuiz();
  }
};

const handleConfirmRetake = () => {
  setShowWarning(false);
  navigateToQuiz();
};
```

---

## Akzeptanzkriterien

1. Warnung erscheint nur bei abgeschlossenen Quizzen
2. "Weiter" startet das Quiz
3. "Abbruch" schließt den Dialog ohne Aktion
4. Dialog-Design ist konsistent mit bestehendem UI

---

## Abhängigkeiten

- Completed Quiz Status Feature (für `isCompleted` Check)
- User Account System

## Priorität

**Mittel** – Wichtig für Datenschutz/UX

## Geschätzter Aufwand

0.5-1 Tag
