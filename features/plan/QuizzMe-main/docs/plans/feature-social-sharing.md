# Feature: Social Sharing

## Übersicht

Nach Abschluss eines Quizzes wird ein "Teilen"-Button angezeigt, der Nutzern ermöglicht, ihr Ergebnis auf verschiedenen Social-Media-Plattformen zu teilen.

---

## Anforderungen

### UI-Komponente

- [ ] "Teilen"-Button im Quiz-Ergebnis-Popup
- [ ] Dropdown/Modal mit Social-Media-Auswahl
- [ ] Unterstützte Plattformen:
  - Facebook
  - Twitter/X
  - WhatsApp
  - Instagram (Story-Link)
  - LinkedIn
  - Telegram
  - Email
  - Link kopieren

### Geteilter Inhalt

- [ ] Grafik-Asset (Quiz-Ergebnis als Bild)
- [ ] Vorgefertigter Text mit Ergebnis-Zusammenfassung
- [ ] Direktlink zur QuizzMe-Seite (ggf. mit Referral-Parameter)

### Grafik-Generierung

- [ ] Server-seitige Bildgenerierung oder Canvas-Export
- [ ] Template pro Quiz-Typ mit dynamischen Daten
- [ ] Optimierte Größen für verschiedene Plattformen

---

## Technische Umsetzung

### Neue Dateien

```
src/
├── components/
│   └── quiz/
│       ├── ShareButton.tsx
│       └── ShareModal.tsx
├── lib/
│   └── sharing/
│       ├── generateShareImage.ts
│       └── shareLinks.ts
└── app/
    └── api/
        └── share/
            └── image/route.ts
```

### Share-Link-Generierung

```typescript
// shareLinks.ts
export function generateShareLinks(data: ShareData) {
  const url = encodeURIComponent(data.url);
  const text = encodeURIComponent(data.text);
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    linkedin: `https://linkedin.com/sharing/share-offsite/?url=${url}`,
    email: `mailto:?subject=${text}&body=${url}`,
  };
}
```

### ShareModal Komponente

```tsx
<ShareModal
  isOpen={showShare}
  onClose={() => setShowShare(false)}
  quizResult={result}
  imageUrl={shareImageUrl}
/>
```

---

## Akzeptanzkriterien

1. "Teilen"-Button erscheint im Ergebnis-Screen
2. Klick öffnet Modal mit Social-Media-Optionen
3. Jede Plattform öffnet korrekten Share-Dialog
4. Grafik wird korrekt mit Ergebnis generiert
5. Link führt zurück zur QuizzMe-Seite

---

## Abhängigkeiten

- Canvas API oder Server-Side Image Generation (satori/resvg)
- Web Share API (optional für mobile)

## Priorität

**Mittel** – Wichtig für virales Wachstum

## Geschätzter Aufwand

2-3 Tage
