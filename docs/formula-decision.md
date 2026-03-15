# Bazodiac Formel-Entscheidung — Zwei-Layer-Modell

**Datum:** 2026-03-15  
**Status:** Entscheidung getroffen

---

## Zusammenfassung

Es gibt **zwei bewusst verschiedene Formeln** in Bazodiac. Diese sind **keine Diskrepanz**, sondern zwei komplementäre Layer:

### Layer 1: Permanent Signal (Backend — `bazodiac_engine/`)

```
Master = 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost
  N = Natal Signal (FuFirE → 5D)
  Q = Quiz Signal (QuizzMe → 5D)
  G = GCB (Generational Context Baseline → 5D)
```

**Zweck:** Berechnet das zeitunabhängige Master-Signal des Users. Fusioniert **Signal-Quellen** (Natal/Quiz/GCB).  
**Verwendet in:** Horoskop-Service, Narrative Engine, Cross-Reference, GCB-Tagging  
**Update-Frequenz:** Bei neuen Quiz-Ergebnissen oder Profil-Änderungen

### Layer 2: Transient Signal (Frontend — `fusion-ring-transit.ts`)

```
S = 0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C
  W = Western Astro, B = BaZi, X = WuXing, T = Transit, C = Conversation
```

**Zweck:** Berechnet die **live Ring-Deformation** inklusive transienter Effekte (Transit, Konversation).  
Fusioniert **Datentypen** (Western/BaZi/WuXing/Transit/Conversation).  
**Verwendet in:** Fusion Ring 3D Renderer, Transit-Overlay, Partikel-Effekte  
**Update-Frequenz:** Echtzeit (per Animation Frame), Transit-Poll alle 15 Min

---

## Architektur-Begründung

```
                     PERMANENT LAYER (Backend)
                 ┌─────────────────────────────┐
   Natal ──────►│                              │
   Quiz  ──────►│  Master Signal Engine        │──► Horoskope
   GCB   ──────►│  0.35·N + 0.30·Q + 0.20·G   │──► Narratives
                 │  + 0.15·alignment_boost      │──► Ring Profil
                 └──────────────┬──────────────┘
                                │ master_vector
                                ▼
                     TRANSIENT LAYER (Frontend)
                 ┌─────────────────────────────┐
   Western ────►│                              │
   BaZi   ────►│  Ring Deformation Engine      │──► 3D Ring
   WuXing  ────►│  0.27·W + 0.27·B + 0.18·X   │──► Partikel
   Transit ────►│  + 0.18·T + 0.10·C           │──► Effekte
   Convo   ────►│                              │
                 └─────────────────────────────┘
```

**Warum zwei Layer:**
1. Das **permanente Master-Signal** braucht keine Transit-Daten und keine Konversation. Es beschreibt, wer der User *ist*.
2. Das **transiente Ring-Signal** braucht Echtzeit-Input (Planetenpositionen, aktive Konversation). Es beschreibt, was der Ring *jetzt* zeigt.
3. Beide Layer sind unabhängig voneinander gültig und testbar.
4. Das Master-Signal informiert die Ring-Basis. Transit und Konversation modulieren *on top*.

---

## Formel-Zuordnung im Code

| Formel | Datei | Funktion |
|---|---|---|
| Permanent (0.35/0.30/0.20/0.15) | `bazodiac_engine/master_signal.py` | `fuse_signals()` |
| Permanent (TS Mirror) | `src/lib/master-signal/master-signal-builder.ts` | `buildMasterSignal()` |
| Transient (0.27/0.27/0.18/0.18/0.10) | `src/components/fusion-ring-website/fusion-ring-transit.ts` | Signal-Kommentar, Deformation-Logik |

---

## Offene Entscheidungen (Sprint 3)

| Frage | Empfehlung |
|---|---|
| Tageshoroskop: Batch oder on-demand? | **On-demand mit 24h Cache** — einfacher, geringere Infra-Kosten |
| Premium-LLM: Welches Modell? | **Gemini 2.0 Flash** — bereits in `server.mjs` integriert |
| Push-Notifications | **Deferred** — erst nach MVP-Horoskop |

---

*v1.0 — 2026-03-15*
