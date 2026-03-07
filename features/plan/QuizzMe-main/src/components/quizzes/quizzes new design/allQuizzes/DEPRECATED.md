# ⚠️ DEPRECATED QUIZ VERSIONS

Diese Datei dokumentiert veraltete Quiz-Versionen, die nicht mehr aktiv gepflegt werden.
**Verwende stattdessen die aktuellen v2/v3 Versionen mit ContributionEvent-Integration.**

---

## Deprecated Files (Do Not Use)

### Celebrity Soulmate Quiz
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `celebrity-soulmate-quiz.html` | `celebrity-soulmate-quiz-v2.html` | Kein ContributionEvent, veraltetes Design |
| `celebrity-soulmate-quiz-light.html` | `celebrity-soulmate-quiz-v2.html` | Experimentelle Variante, nicht maintained |
| `celebrity-soulmate-quiz-quizzme.html` | `celebrity-soulmate-quiz-v2.html` | Brand-Experiment, nicht maintained |

### Krafttier Quiz
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `krafttier-quiz.html` | `krafttier-quiz-v2.html` | Kein ContributionEvent, veraltetes Scoring |

### Social Role Quiz
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `social-role-quiz.html` | `social-role-quiz-v2.html` | Kein ContributionEvent, veraltetes Design |

### Chinesisches Horoskop
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `chinesisches-horoskop-v2.html` | `chinesisches-horoskop-v3.html` | v3 hat vollständiges ContributionEvent |

### Totem/Avatar Experimente
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `evolving-totem.html` | - | Konzept-Experiment, nicht production-ready |
| `evolving-character.html` | - | Konzept-Experiment, nicht production-ready |
| `totem-warrior.html` | `totem-warrior-v3.html` | Veraltete Version |

### Love Languages Varianten
| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `love-languages-botanical.html` | `love-languages-quizzme.jsx` | Design-Experiment |

---

## Migration Guide

### ContributionEvent nachrüsten
Falls du eine deprecated Version erweitern musst, nutze dieses Template:

```javascript
// Add after quiz data definition
const CONTRIBUTION_CONFIG = {
    source: {
        vertical: "quiz",
        moduleId: "quiz.{name}.v1",
        locale: "de-DE"
    },
    profileMeta: {
        // Add markers, traits, tags, unlockId per profile
    }
};

// Add buildContributionEvent function
function buildContributionEvent(profile) {
    return {
        specVersion: "sp.contribution.v1",
        eventId: generateUUID(),
        occurredAt: new Date().toISOString(),
        source: CONTRIBUTION_CONFIG.source,
        payload: {
            markers: [...],
            traits: [...],
            tags: [...],
            unlocks: [...],
            summary: {...}
        }
    };
}
```

### Design System Migration
Stelle sicher, dass folgende Design-Tokens verwendet werden:

**Modern Alchemy (Dark Theme)**
```css
--bg-gradient: linear-gradient(135deg, #053B3F, #041726);
--text-primary: #F7F3EA;
--accent-gold: #D2A95A;
--font-headline: 'Cormorant Garamond', serif;
--font-body: 'Inter', sans-serif;
```

**Botanical Garden (Light Theme)**
```css
--bg-gradient: linear-gradient(135deg, #F7F0E6, #F2E3CF);
--text-primary: #271C16;
--accent-emerald: #053B3F;
--accent-gold: #D2A95A;
```

---

## Archivierung

Diese Dateien sollten bei nächster Gelegenheit in einen `/archive/` Ordner verschoben werden:
- celebrity-soulmate-quiz.html
- celebrity-soulmate-quiz-light.html
- celebrity-soulmate-quiz-quizzme.html
- krafttier-quiz.html
- social-role-quiz.html
- chinesisches-horoskop-v2.html
- evolving-totem.html
- evolving-character.html
- totem-warrior.html

---

## Aktive Versionen (Stand: 2025-12-16)

### Production-Ready (mit ContributionEvent)
- ✅ `celebrity-soulmate-quiz-v2.html`
- ✅ `krafttier-quiz-v2.html`
- ✅ `social-role-quiz-v2.html`
- ✅ `chinesisches-horoskop-v3.html`
- ✅ `aufmerksamkeit-quiz.html` (jetzt mit CE)
- ✅ `karriere-dna-test.html` (jetzt mit CE)
- ✅ `ueberforderungs-quiz.html`
- ✅ `destiny-quiz-v2.jsx`
- ✅ `personality-quiz-pipeline.html`

### Pending CE-Integration
- ⚠️ `love-languages-quizzme.jsx`
- ⚠️ `superhero-quiz.html`

---

*Last updated: 2025-12-16*
