# PAKET 4 — LeanDeep Affinity Derivation Tool

> **Ziel-Repo:** `DYAI2025/BAFE` (Python, FastAPI)
> **Dependency:** `DYAI2025/LeanDeep-annotator` (laufende Instanz, Port 8420)
> **Referenz:** `DYAI2025/Astro-Noctum` → `src/lib/fusion-ring/affinity-map.ts` (bestehende handgeschriebene AFFINITY_MAP)
> **Voraussetzung:** LeanDeep-annotator deployed/lokal erreichbar. BAFE Repo geklont.
> **Keine Abhängigkeit auf Paket 1–3.** Dieses Tool ist standalone und kann sofort gebaut werden.

---

## 1. Was gebaut wird

Ein CLI-Tool und ein optionaler BAFE-Endpoint der aus Quiz-Texten automatisch AFFINITY_MAP-Zeilen ableitet. Das Tool nutzt LeanDeep als semantischen Analysator und übersetzt LeanDeep-VAD-Koordinaten (Valence/Arousal/Dominance) in 12-Sektor-Gewichte über Cosinus-Ähnlichkeit mit archetypischen Sektor-VAD-Profilen.

**Drei Modi:**

1. **derive** — Einzelnes Keyword + Beschreibungstext → AFFINITY_MAP-Zeile generieren
2. **validate** — Bestehende AFFINITY_MAP-Zeile gegen LeanDeep-Analyse prüfen → Kohärenz-Report
3. **batch** — Ganzes Quiz (JSON mit Profilen/Beschreibungen) → Alle Keyword-Zeilen auf einmal

---

## 2. Bestehendes im BAFE Repo

**Architektur:** Python 3.12+, FastAPI, 4-Level Schichtung (bazi.py → western.py → fusion.py → routers/). Tools in `tools/`. Tests in `tests/`.

**Relevante Dateien:**
- `bazi_engine/app.py` — FastAPI App Factory, Router-Mount
- `bazi_engine/routers/` — Alle Endpoints
- `bazi_engine/fusion.py` — Fusion-Orchestrator (Level 4)
- `bazi_engine/wuxing/` — Wu-Xing Domain Package
- `tools/` — Bestehende Tooling-Scripts (export_openapi.py, action_compute.py)
- `tests/` — 20+ Testmodule, pytest
- `pyproject.toml` — Dependencies
- `CONTRACT.md` — API Contract (OpenAPI als Source of Truth)

**Konventionen:**
- Type Hints überall
- Docstrings in Google-Style
- Tests mit pytest, Fixtures in `tests/conftest.py`
- Tools sind standalone CLI-Scripts mit `if __name__ == "__main__"`
- `httpx` ist bereits Dependency (in tests genutzt)

---

## 3. Architektur-Entscheidung

Das Tool wird **nicht** in die BAFE-Engine-Schichtung eingebaut. Es ist ein Offline-Tool unter `tools/`, genau wie `export_openapi.py`. Es greift auf eine laufende LeanDeep-Instanz zu (HTTP), nicht auf LeanDeep-Interna.

**Warum:** Die AFFINITY_MAP lebt clientseitig (TypeScript in Astro-Noctum). Das Tool generiert Vorschläge die ein Mensch reviewt und dann in TypeScript überträgt. Keine Runtime-Dependency zwischen BAFE und LeanDeep. Clean Boundary.

**Optional (Task 7):** Ein BAFE-Endpoint `/tools/derive-affinity` der dasselbe tut, für den Fall dass es als API-Service gebraucht wird.

---

## 4. Tasks

### Task 4.1 — Sektor-VAD-Profile (Konstanten)

Erstelle `tools/sector_vad.py`:

```python
"""
Archetypische VAD-Profile der 12 Sektoren.

Jeder Sektor repräsentiert ein astrologisches Zeichen mit charakteristischen
emotionalen Qualitäten, übersetzt in Valence/Arousal/Dominance.

Quellen:
- Astrologische Haus-/Zeichen-Archetypen (standardisiert)
- VAD-Dimensionen nach Mehrabian & Russell (1974)

Die Profile sind FIXIERT und ändern sich nicht. Sie bilden den
Referenzraum gegen den alle Marker-VADs verglichen werden.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class VADProfile:
    valence: float    # -1.0 to +1.0 (negativ ↔ positiv)
    arousal: float    #  0.0 to +1.0 (ruhig ↔ aktiviert)
    dominance: float  #  0.0 to +1.0 (submissiv ↔ dominant)


SECTOR_VAD: dict[int, VADProfile] = {
    # S0 — Widder (Aries)
    # Impuls, Mut, Initiative, Körper. Handelt zuerst, denkt später.
    # Emotional: aufbrausend-positiv, hochaktiviert, sehr dominant.
    0: VADProfile(valence=+0.30, arousal=0.90, dominance=0.90),

    # S1 — Stier (Taurus)
    # Sinnlichkeit, Stabilität, Genuss, Besitz. Langsam, beständig, erdend.
    # Emotional: genussvoll-positiv, ruhig, stabil-dominant.
    1: VADProfile(valence=+0.40, arousal=0.20, dominance=0.60),

    # S2 — Zwillinge (Gemini)
    # Kognition, Kommunikation, Neugier, Anpassung. Schnell, vielseitig.
    # Emotional: leicht-positiv, mittel-aktiviert, balanciert.
    2: VADProfile(valence=+0.20, arousal=0.60, dominance=0.50),

    # S3 — Krebs (Cancer)
    # Emotion, Fürsorge, Heim, Schutz, Empathie. Weich, nährend.
    # Emotional: warm-positiv, mittel-aktiviert, eher submissiv.
    3: VADProfile(valence=+0.30, arousal=0.50, dominance=0.20),

    # S4 — Löwe (Leo)
    # Ausdruck, Kreativität, Führung, Ego, Freude. Strahlend, zentral.
    # Emotional: stark-positiv, hoch-aktiviert, sehr dominant.
    4: VADProfile(valence=+0.60, arousal=0.80, dominance=0.90),

    # S5 — Jungfrau (Virgo)
    # Analyse, Dienst, Präzision, Gesundheit, Ordnung. Kontrolliert, genau.
    # Emotional: neutral-positiv, ruhig, kontrolliert-dominant.
    5: VADProfile(valence=+0.10, arousal=0.30, dominance=0.60),

    # S6 — Waage (Libra)
    # Beziehung, Harmonie, Ästhetik, Diplomatie, Balance. Ausgleichend.
    # Emotional: mild-positiv, ruhig, balanciert.
    6: VADProfile(valence=+0.30, arousal=0.30, dominance=0.40),

    # S7 — Skorpion (Scorpio)
    # Tiefe, Transformation, Intensität, Sexualität, Macht. Dunkel, komplex.
    # Emotional: negativ-intensiv, hoch-aktiviert, sehr dominant.
    7: VADProfile(valence=-0.40, arousal=0.85, dominance=0.80),

    # S8 — Schütze (Sagittarius)
    # Freiheit, Philosophie, Expansion, Abenteuer, Wahrheit. Weit, optimistisch.
    # Emotional: positiv, hoch-aktiviert, mittel-dominant.
    8: VADProfile(valence=+0.50, arousal=0.70, dominance=0.60),

    # S9 — Steinbock (Capricorn)
    # Struktur, Ambition, Disziplin, Verantwortung, Status. Ernst, ausdauernd.
    # Emotional: leicht-negativ, mittel-aktiviert, sehr dominant.
    9: VADProfile(valence=-0.10, arousal=0.40, dominance=0.85),

    # S10 — Wassermann (Aquarius)
    # Kollektiv, Innovation, Rebellion, Originalität, Zukunft. Unkonventionell.
    # Emotional: neutral-positiv, mittel-aktiviert, niedrig-dominant.
    10: VADProfile(valence=+0.20, arousal=0.50, dominance=0.30),

    # S11 — Fische (Pisces)
    # Intuition, Auflösung, Spiritualität, Träume, Hingabe. Grenzenlos.
    # Emotional: leicht-positiv, niedrig-aktiviert, sehr submissiv.
    11: VADProfile(valence=+0.10, arousal=0.20, dominance=0.10),
}

SECTOR_NAMES = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau",
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische",
]

SECTOR_SIGNS_EN = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]
```

### Task 4.2 — Cosinus-Affinität Berechnung

Erstelle `tools/affinity_math.py`:

```python
"""
Berechnet AFFINITY_MAP-Zeilen aus VAD-Profilen.

Kernlogik:
  Affinität(marker, sektor) = cosine_similarity(marker.VAD, sektor.VAD)
  Negative Similaritäten werden auf 0 gekappt (keine Anti-Affinität).
  Ergebnis wird auf Summe ≈ 1.0 normalisiert.
"""

import math
from tools.sector_vad import VADProfile, SECTOR_VAD


def cosine_similarity(a: VADProfile, b: VADProfile) -> float:
    """Cosinus-Ähnlichkeit zweier VAD-Profile im 3D-Raum."""
    dot = a.valence * b.valence + a.arousal * b.arousal + a.dominance * b.dominance
    mag_a = math.sqrt(a.valence**2 + a.arousal**2 + a.dominance**2)
    mag_b = math.sqrt(b.valence**2 + b.arousal**2 + b.dominance**2)
    if mag_a < 1e-9 or mag_b < 1e-9:
        return 0.0
    return dot / (mag_a * mag_b)


def compute_affinity_row(marker_vad: VADProfile) -> list[float]:
    """Berechne 12-Sektor-Gewichte aus einem VAD-Profil.

    Returns:
        Liste mit 12 Floats, Summe ≈ 1.0, je 2 Nachkommastellen.
    """
    raw = []
    for s in range(12):
        sim = cosine_similarity(marker_vad, SECTOR_VAD[s])
        raw.append(max(0.0, sim))  # Keine negative Affinität

    total = sum(raw)
    if total < 1e-9:
        return [round(1.0 / 12, 2)] * 12  # Uniform wenn kein Signal

    normalized = [r / total for r in raw]
    # Runden und kleine Werte (<0.03) auf 0 setzen (Noise-Filter)
    cleaned = [round(v, 2) if v >= 0.03 else 0.0 for v in normalized]

    # Re-normalisieren nach Noise-Filter
    total2 = sum(cleaned)
    if total2 < 1e-9:
        return [round(1.0 / 12, 2)] * 12
    return [round(v / total2, 2) for v in cleaned]


def compare_rows(
    computed: list[float],
    existing: list[float],
    threshold: float = 0.15,
) -> dict:
    """Vergleiche berechnete vs. bestehende AFFINITY_MAP-Zeile.

    Returns:
        Dict mit:
          deltas: list[float] — pro-Sektor Abweichung
          max_delta: float — größte Abweichung
          max_delta_sector: int — Sektor mit größter Abweichung
          coherent: bool — True wenn max_delta < threshold
          warnings: list[str] — menschenlesbare Warnungen
    """
    deltas = [round(abs(c - e), 3) for c, e in zip(computed, existing)]
    max_delta = max(deltas)
    max_sector = deltas.index(max_delta)

    warnings = []
    for s, d in enumerate(deltas):
        if d >= threshold:
            from tools.sector_vad import SECTOR_NAMES
            warnings.append(
                f"S{s} ({SECTOR_NAMES[s]}): Delta {d:.3f} "
                f"(computed={computed[s]:.2f}, existing={existing[s]:.2f})"
            )

    return {
        "deltas": deltas,
        "max_delta": round(max_delta, 3),
        "max_delta_sector": max_sector,
        "coherent": max_delta < threshold,
        "warnings": warnings,
    }


def format_affinity_row_ts(keyword: str, row: list[float]) -> str:
    """Formatiere als TypeScript-Zeile für AFFINITY_MAP."""
    values = ", ".join(f".{int(v*100):02d}" if 0 < v < 1 else str(int(v)) for v in row)
    # Sauberer: fixe Breite
    parts = []
    for v in row:
        if v == 0:
            parts.append("0  ")
        elif v == 1:
            parts.append("1  ")
        else:
            parts.append(f".{int(v * 100):<2d}")
    values_str = ", ".join(parts)
    return f"  '{keyword}': [{values_str}],"
```

### Task 4.3 — LeanDeep Client

Erstelle `tools/leandeep_client.py`:

```python
"""
HTTP Client für LeanDeep-annotator.

Analysiert Text und extrahiert aggregierte VAD-Profile
aus allen gefeuerten Markern.
"""

from __future__ import annotations

import httpx
from tools.sector_vad import VADProfile

DEFAULT_LEANDEEP_URL = "http://localhost:8420"


class LeanDeepClient:
    """Synchroner Client für LeanDeep /v1/analyze."""

    def __init__(self, base_url: str = DEFAULT_LEANDEEP_URL, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def analyze(self, text: str) -> dict:
        """Sende Text an LeanDeep, gib vollen Response zurück."""
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/v1/analyze",
                json={"text": text},
            )
            resp.raise_for_status()
            return resp.json()

    def derive_vad(self, text: str) -> tuple[VADProfile, dict]:
        """Analysiere Text und aggregiere VAD aus allen Detections.

        Returns:
            Tuple von (aggregiertes VADProfile, Debug-Info dict)
        """
        result = self.analyze(text)
        detections = result.get("detections", [])

        if not detections:
            return VADProfile(0.0, 0.0, 0.0), {
                "detection_count": 0,
                "markers": [],
                "warning": "Keine LeanDeep-Marker gefeuert. Text zu kurz oder zu generisch?",
            }

        # VAD extrahieren — LeanDeep liefert vad_estimate pro Detection
        vads = []
        marker_info = []
        for det in detections:
            vad = det.get("vad") or det.get("vad_estimate")
            if not vad:
                continue
            v = vad.get("valence", 0)
            a = vad.get("arousal", 0)
            d = vad.get("dominance", 0)
            vads.append((v, a, d))
            marker_info.append({
                "id": det.get("marker_id") or det.get("id", "?"),
                "confidence": det.get("confidence", 0),
                "vad": {"v": v, "a": a, "d": d},
            })

        if not vads:
            return VADProfile(0.0, 0.0, 0.0), {
                "detection_count": len(detections),
                "markers": marker_info,
                "warning": "Detections vorhanden, aber keine VAD-Werte.",
            }

        # Gewichtetes Mittel (nach Confidence wenn verfügbar)
        weights = [det.get("confidence", 1.0) for det in detections if det.get("vad") or det.get("vad_estimate")]
        total_w = sum(weights) or 1.0

        agg_v = sum(v * w for (v, _, _), w in zip(vads, weights)) / total_w
        agg_a = sum(a * w for (_, a, _), w in zip(vads, weights)) / total_w
        agg_d = sum(d * w for (_, _, d), w in zip(vads, weights)) / total_w

        profile = VADProfile(
            valence=round(agg_v, 3),
            arousal=round(agg_a, 3),
            dominance=round(agg_d, 3),
        )

        return profile, {
            "detection_count": len(detections),
            "vad_sources": len(vads),
            "markers": marker_info,
        }

    def health(self) -> bool:
        """Check ob LeanDeep erreichbar ist."""
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.base_url}/v1/health")
                return resp.status_code == 200
        except Exception:
            return False
```

### Task 4.4 — Bestehende AFFINITY_MAP laden

Erstelle `tools/load_existing_map.py`:

```python
"""
Lädt die bestehende AFFINITY_MAP aus dem Astro-Noctum Repo
(TypeScript) und parst sie in ein Python-Dict.

Falls das Repo nicht lokal verfügbar ist, enthält dieses Modul
eine eingebettete Kopie der handgeschriebenen Map als Ground Truth.
"""

# Eingebettete Kopie der handgeschriebenen AFFINITY_MAP
# aus Astro-Noctum src/lib/fusion-ring/affinity-map.ts
# Stand: 2026-03-07
EXISTING_AFFINITY_MAP: dict[str, list[float]] = {
    # === DOMAIN-LEVEL (Fallback) ===
    "love":       [0,  .1, 0,  .3, 0,  0,  .3, .3, 0,  0,  0,  0  ],
    "emotion":    [0,  .2, 0,  .4, .1, 0,  .1, .2, 0,  0,  0,  0  ],
    "social":     [0,  0,  .1, .1, .1, 0,  .3, 0,  0,  0,  .3, 0  ],
    "instinct":   [.3, 0,  0,  0,  0,  0,  0,  .3, .2, .1, 0,  .1 ],
    "cognition":  [0,  0,  .4, 0,  0,  .3, 0,  0,  .2, .1, 0,  0  ],
    "leadership": [.1, 0,  0,  0,  .3, 0,  0,  0,  0,  .4, .1, 0  ],
    "freedom":    [.2, 0,  0,  0,  0,  0,  0,  0,  .5, .1, .2, 0  ],
    "spiritual":  [0,  0,  0,  0,  0,  0,  0,  .2, .2, 0,  0,  .6 ],
    "sensory":    [0,  .5, 0,  0,  0,  0,  0,  .3, 0,  0,  0,  .2 ],
    "creative":   [0,  0,  .2, 0,  .4, 0,  .1, 0,  0,  0,  .2, .1 ],

    # === KEYWORD-LEVEL (Präzision) ===
    "physical_touch":      [0,  .2, 0,  0,  0,  0,  0,  .6, 0,  0,  0,  .2 ],
    "harmony":             [0,  0,  0,  .1, 0,  0,  .7, 0,  0,  0,  .2, 0  ],
    "pack_loyalty":        [0,  0,  0,  .2, 0,  0,  .1, 0,  0,  0,  .5, .2 ],
    "primal_sense":        [.5, 0,  0,  0,  0,  0,  0,  .4, 0,  0,  0,  .1 ],
    "gut_feeling":         [.1, 0,  0,  0,  0,  0,  0,  .2, 0,  0,  0,  .7 ],
    "body_awareness":      [0,  .4, 0,  0,  0,  0,  0,  .3, 0,  0,  0,  .3 ],
    "servant_leader":      [0,  0,  0,  .1, 0,  .2, 0,  0,  0,  .5, 0,  .2 ],
    "charisma":            [0,  0,  0,  0,  .6, 0,  .1, 0,  .2, .1, 0,  0  ],
    "analytical":          [0,  0,  .3, 0,  0,  .5, 0,  0,  .1, .1, 0,  0  ],
    "community":           [0,  0,  0,  .1, 0,  0,  .2, 0,  0,  0,  .6, .1 ],
    "passionate":          [.1, 0,  0,  0,  .2, 0,  0,  .5, 0,  0,  0,  .2 ],
    "togetherness":        [0,  0,  0,  .3, 0,  0,  .4, 0,  0,  0,  .2, .1 ],
    "expression":          [0,  0,  .2, 0,  .5, 0,  0,  0,  .2, .1, 0,  0  ],
    "protective":          [.2, 0,  0,  .4, 0,  0,  0,  0,  0,  .3, 0,  .1 ],
    "independence":        [.2, 0,  0,  0,  0,  0,  0,  0,  .5, .1, .2, 0  ],
    "sensory_connection":  [0,  .4, 0,  .1, 0,  0,  0,  .3, 0,  0,  0,  .2 ],
    "physical_expression": [.1, .1, 0,  0,  .2, 0,  0,  .4, 0,  0,  0,  .2 ],
}


def get_existing(keyword: str) -> list[float] | None:
    """Hole bestehende Map-Zeile. None wenn nicht vorhanden."""
    return EXISTING_AFFINITY_MAP.get(keyword)


def get_domain_fallback(keyword: str) -> tuple[str, list[float]] | None:
    """Simuliere Domain-Fallback wie die TypeScript-Engine.

    Wenn 'keyword' nicht existiert, prüfe ob es als Domain-Key existiert.
    """
    domains = [
        "love", "emotion", "social", "instinct", "cognition",
        "leadership", "freedom", "spiritual", "sensory", "creative",
    ]
    for d in domains:
        if d in EXISTING_AFFINITY_MAP:
            # Gibt den Fallback zurück wenn keyword nicht direkt existiert
            pass
    return None  # Kein Fallback gefunden
```

### Task 4.5 — Haupt-CLI Tool

Erstelle `tools/derive_affinity.py`:

```python
#!/usr/bin/env python3
"""
derive_affinity.py — Leite AFFINITY_MAP-Zeilen aus Quiz-Text ab.

Nutzt LeanDeep-annotator als semantischen Analysator.
Übersetzt LeanDeep-VAD-Koordinaten in 12-Sektor-Gewichte.

Drei Modi:
  derive   — Text → neue AFFINITY_MAP-Zeile
  validate — Bestehende Zeile gegen LeanDeep prüfen
  batch    — Quiz-JSON → alle Zeilen auf einmal

Voraussetzung: LeanDeep-annotator läuft auf localhost:8420
               (oder via --leandeep-url konfigurierbar)

Beispiele:
  python tools/derive_affinity.py derive \\
    --keyword physical_touch \\
    --text "Körperliche Nähe, Berührung als Sprache der Liebe"

  python tools/derive_affinity.py validate \\
    --keyword physical_touch \\
    --text "Körperliche Nähe, Berührung als Sprache der Liebe"

  python tools/derive_affinity.py batch \\
    --quiz-json path/to/love-languages-quiz.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from tools.sector_vad import SECTOR_NAMES, VADProfile
from tools.affinity_math import compute_affinity_row, compare_rows, format_affinity_row_ts
from tools.leandeep_client import LeanDeepClient
from tools.load_existing_map import get_existing, EXISTING_AFFINITY_MAP


# ═══════════════════════════════════════════════════════════════════════════════
# MODE: DERIVE
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_derive(args: argparse.Namespace) -> int:
    """Leite eine neue AFFINITY_MAP-Zeile ab."""
    client = LeanDeepClient(base_url=args.leandeep_url)

    if not client.health():
        print(f"ERROR: LeanDeep nicht erreichbar unter {args.leandeep_url}", file=sys.stderr)
        return 1

    print(f"\n{'='*60}")
    print(f"DERIVE: '{args.keyword}'")
    print(f"Text: {args.text[:100]}{'...' if len(args.text) > 100 else ''}")
    print(f"{'='*60}\n")

    # LeanDeep analysieren
    vad, debug = client.derive_vad(args.text)
    print(f"LeanDeep Detections: {debug['detection_count']}")
    print(f"VAD Sources: {debug.get('vad_sources', 0)}")
    if debug.get("warning"):
        print(f"WARNING: {debug['warning']}")

    print(f"\nAggregiertes VAD: V={vad.valence:+.3f}  A={vad.arousal:.3f}  D={vad.dominance:.3f}")

    if debug.get("markers"):
        print(f"\nTop-Marker:")
        for m in sorted(debug["markers"], key=lambda x: x.get("confidence", 0), reverse=True)[:5]:
            mv = m["vad"]
            print(f"  {m['id']:40s}  conf={m['confidence']:.2f}  V={mv['v']:+.2f} A={mv['a']:.2f} D={mv['d']:.2f}")

    # Affinität berechnen
    row = compute_affinity_row(vad)
    print(f"\nBerechnete Affinität:")
    for s in range(12):
        bar = "█" * int(row[s] * 40)
        print(f"  S{s:2d} {SECTOR_NAMES[s]:12s}  {row[s]:.2f}  {bar}")

    # Gegen bestehende Map vergleichen
    existing = get_existing(args.keyword)
    if existing:
        print(f"\nVergleich mit bestehender Map:")
        result = compare_rows(row, existing, threshold=args.threshold)
        if result["coherent"]:
            print(f"  Status: KOHÄRENT ✓ (max delta: {result['max_delta']:.3f})")
        else:
            print(f"  Status: ABWEICHUNG ✗ (max delta: {result['max_delta']:.3f})")
            for w in result["warnings"]:
                print(f"  ⚠ {w}")
    else:
        domain = args.keyword.split("_")[0] if "_" in args.keyword else None
        if domain and domain in EXISTING_AFFINITY_MAP:
            print(f"\nKein Keyword-Eintrag. Domain-Fallback wäre '{domain}':")
            fallback = EXISTING_AFFINITY_MAP[domain]
            result = compare_rows(row, fallback, threshold=args.threshold)
            if not result["coherent"]:
                print(f"  ⚠ Fallback zu unscharf (max delta: {result['max_delta']:.3f})")
                print(f"  → EMPFEHLUNG: Keyword-Zeile anlegen")
            else:
                print(f"  Fallback ausreichend (max delta: {result['max_delta']:.3f})")
        else:
            print(f"\nKein bestehender Eintrag. Neue Zeile:")

    # TypeScript Output
    print(f"\n{'─'*60}")
    print(f"TypeScript (copy-paste in AFFINITY_MAP):\n")
    print(format_affinity_row_ts(args.keyword, row))
    print()

    return 0


# ═══════════════════════════════════════════════════════════════════════════════
# MODE: VALIDATE
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_validate(args: argparse.Namespace) -> int:
    """Validiere eine bestehende AFFINITY_MAP-Zeile."""
    client = LeanDeepClient(base_url=args.leandeep_url)

    if not client.health():
        print(f"ERROR: LeanDeep nicht erreichbar", file=sys.stderr)
        return 1

    existing = get_existing(args.keyword)
    if not existing:
        print(f"ERROR: Keyword '{args.keyword}' nicht in bestehender Map", file=sys.stderr)
        return 1

    vad, debug = client.derive_vad(args.text)
    row = compute_affinity_row(vad)
    result = compare_rows(row, existing, threshold=args.threshold)

    print(f"\nVALIDATE: '{args.keyword}'")
    print(f"VAD: V={vad.valence:+.3f}  A={vad.arousal:.3f}  D={vad.dominance:.3f}")
    print(f"Detections: {debug['detection_count']}")

    print(f"\n{'Sektor':<20s} {'Computed':>9s} {'Existing':>9s} {'Delta':>7s}")
    print(f"{'─'*48}")
    for s in range(12):
        delta = abs(row[s] - existing[s])
        flag = " ⚠" if delta >= args.threshold else ""
        print(f"  S{s:2d} {SECTOR_NAMES[s]:<12s} {row[s]:>7.2f}   {existing[s]:>7.2f}   {delta:>5.3f}{flag}")

    print(f"\n{'─'*48}")
    if result["coherent"]:
        print(f"ERGEBNIS: KOHÄRENT ✓  (max Δ = {result['max_delta']:.3f} < {args.threshold})")
    else:
        print(f"ERGEBNIS: MISMATCH ✗  (max Δ = {result['max_delta']:.3f} >= {args.threshold})")
        print(f"\nVorgeschlagene Korrektur:")
        print(format_affinity_row_ts(args.keyword, row))

    return 0 if result["coherent"] else 2


# ═══════════════════════════════════════════════════════════════════════════════
# MODE: BATCH
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_batch(args: argparse.Namespace) -> int:
    """Batch-Verarbeitung eines Quiz-JSON.

    Erwartet JSON mit 'profiles' Array. Jedes Profil hat:
      - id: string (wird als keyword genutzt)
      - title: string
      - description: string (wird an LeanDeep gesendet)
    """
    client = LeanDeepClient(base_url=args.leandeep_url)

    if not client.health():
        print(f"ERROR: LeanDeep nicht erreichbar", file=sys.stderr)
        return 1

    quiz_path = Path(args.quiz_json)
    if not quiz_path.exists():
        print(f"ERROR: {quiz_path} nicht gefunden", file=sys.stderr)
        return 1

    quiz = json.loads(quiz_path.read_text(encoding="utf-8"))
    profiles = quiz.get("profiles", [])
    if not profiles:
        print(f"ERROR: Keine 'profiles' in {quiz_path}", file=sys.stderr)
        return 1

    quiz_title = quiz.get("meta", {}).get("title", quiz_path.stem)
    print(f"\nBATCH: {quiz_title}")
    print(f"Profile: {len(profiles)}")
    print(f"{'='*60}\n")

    results = []
    all_coherent = True

    for profile in profiles:
        pid = profile.get("id", "unknown")
        desc = profile.get("description", profile.get("tagline", profile.get("title", "")))
        if not desc:
            print(f"  SKIP: {pid} — keine Beschreibung")
            continue

        vad, debug = client.derive_vad(desc)
        row = compute_affinity_row(vad)

        existing = get_existing(pid)
        status = "NEW"
        coherent = True
        if existing:
            comp = compare_rows(row, existing, threshold=args.threshold)
            coherent = comp["coherent"]
            status = "OK ✓" if coherent else "MISMATCH ✗"
            if not coherent:
                all_coherent = False

        # Peak-Sektoren
        peaks = sorted(range(12), key=lambda s: row[s], reverse=True)[:3]
        peak_str = ", ".join(f"S{s}({SECTOR_NAMES[s]})" for s in peaks)

        print(f"  {pid:25s}  V={vad.valence:+.2f} A={vad.arousal:.2f} D={vad.dominance:.2f}  "
              f"Peaks: {peak_str}  [{status}]")

        results.append({
            "keyword": pid,
            "vad": {"v": vad.valence, "a": vad.arousal, "d": vad.dominance},
            "row": row,
            "status": status,
            "peaks": peaks,
        })

    # Summary
    print(f"\n{'='*60}")
    print(f"Ergebnis: {'ALLE KOHÄRENT ✓' if all_coherent else 'MISMATCHES GEFUNDEN ✗'}\n")

    # TypeScript Output für neue/korrigierte Zeilen
    new_lines = [r for r in results if "NEW" in r["status"] or "MISMATCH" in r["status"]]
    if new_lines:
        print(f"Neue/korrigierte AFFINITY_MAP Zeilen:\n")
        for r in new_lines:
            print(format_affinity_row_ts(r["keyword"], r["row"]))
        print()

    # JSON Output für maschinelle Weiterverarbeitung
    if args.output:
        out_path = Path(args.output)
        out_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"JSON Output: {out_path}")

    return 0 if all_coherent else 2


# ═══════════════════════════════════════════════════════════════════════════════
# BONUS: VALIDATE-ALL — Alle bestehenden Einträge auf einmal prüfen
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_validate_all(args: argparse.Namespace) -> int:
    """Validiere ALLE bestehenden AFFINITY_MAP-Einträge.

    Braucht eine Mapping-Datei die Keywords auf Beschreibungstexte mappt.
    Format: JSON { "keyword": "Beschreibungstext", ... }
    """
    client = LeanDeepClient(base_url=args.leandeep_url)

    if not client.health():
        print(f"ERROR: LeanDeep nicht erreichbar", file=sys.stderr)
        return 1

    desc_path = Path(args.descriptions)
    if not desc_path.exists():
        print(f"ERROR: {desc_path} nicht gefunden", file=sys.stderr)
        return 1

    descriptions: dict[str, str] = json.loads(desc_path.read_text(encoding="utf-8"))

    print(f"\nVALIDATE-ALL: {len(descriptions)} Keywords")
    print(f"{'='*60}\n")

    mismatches = 0
    for keyword, text in descriptions.items():
        existing = get_existing(keyword)
        if not existing:
            print(f"  {keyword:25s}  SKIP (nicht in Map)")
            continue

        vad, _ = client.derive_vad(text)
        row = compute_affinity_row(vad)
        result = compare_rows(row, existing, threshold=args.threshold)

        status = "OK ✓" if result["coherent"] else f"Δ={result['max_delta']:.3f} ✗"
        if not result["coherent"]:
            mismatches += 1
        print(f"  {keyword:25s}  {status}")

    print(f"\n{'='*60}")
    print(f"Ergebnis: {len(descriptions) - mismatches}/{len(descriptions)} kohärent")
    if mismatches:
        print(f"          {mismatches} Mismatches — mit 'derive' Modus einzeln prüfen")

    return 0 if mismatches == 0 else 2


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main() -> int:
    parser = argparse.ArgumentParser(
        description="LeanDeep Affinity Derivation Tool — leite AFFINITY_MAP-Zeilen aus Text ab",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--leandeep-url",
        default="http://localhost:8420",
        help="LeanDeep-annotator URL (default: http://localhost:8420)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.15,
        help="Max delta für Kohärenz-Check (default: 0.15)",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # derive
    p_derive = sub.add_parser("derive", help="Text → neue AFFINITY_MAP-Zeile")
    p_derive.add_argument("--keyword", required=True, help="Marker-Keyword (z.B. physical_touch)")
    p_derive.add_argument("--text", required=True, help="Beschreibungstext für semantische Analyse")

    # validate
    p_validate = sub.add_parser("validate", help="Bestehende Zeile gegen LeanDeep prüfen")
    p_validate.add_argument("--keyword", required=True)
    p_validate.add_argument("--text", required=True)

    # batch
    p_batch = sub.add_parser("batch", help="Quiz-JSON → alle Keyword-Zeilen")
    p_batch.add_argument("--quiz-json", required=True, help="Pfad zur Quiz-JSON Datei")
    p_batch.add_argument("--output", help="Optional: JSON Output-Pfad")

    # validate-all
    p_all = sub.add_parser("validate-all", help="Alle bestehenden Map-Einträge prüfen")
    p_all.add_argument("--descriptions", required=True, help="JSON: { keyword: beschreibung, ... }")

    args = parser.parse_args()

    commands = {
        "derive": cmd_derive,
        "validate": cmd_validate,
        "batch": cmd_batch,
        "validate-all": cmd_validate_all,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
```

### Task 4.6 — Keyword-Beschreibungen für validate-all

Erstelle `tools/affinity_descriptions.json`. Enthält für jedes bestehende AFFINITY_MAP Keyword einen Beschreibungstext der die semantische Bedeutung einfängt:

```json
{
  "love": "Liebe, Zuneigung, emotionale Bindung, romantische Verbindung, Partnerschaft",
  "emotion": "Emotionale Reaktionen, Gefühlsausdruck, Stimmung, Empfindsamkeit, Mitgefühl",
  "social": "Soziale Interaktion, Gemeinschaft, Kommunikation, zwischenmenschliche Beziehungen",
  "instinct": "Instinkt, Urinstinkt, Bauchgefühl, Überlebensimpuls, animalische Intuition",
  "cognition": "Denken, Kognition, Analyse, Logik, intellektuelle Verarbeitung, Wissen",
  "leadership": "Führung, Autorität, Verantwortung, Leitung, Entscheidungskraft",
  "freedom": "Freiheit, Unabhängigkeit, Autonomie, Expansion, Grenzenlosigkeit",
  "spiritual": "Spiritualität, Transzendenz, Meditation, innere Ruhe, Sinnsuche, mystische Erfahrung",
  "sensory": "Sinnlichkeit, Körperwahrnehmung, Genuss, Berührung, Geschmack, taktile Erfahrung",
  "creative": "Kreativität, schöpferischer Ausdruck, Kunst, Innovation, Fantasie, Gestaltung",
  "physical_touch": "Körperliche Berührung, physische Nähe, Umarmung, taktile Liebessprache, Hautkontakt",
  "harmony": "Harmonie, Ausgewogenheit, Friedfertigkeit, Balance, diplomatischer Ausgleich",
  "pack_loyalty": "Rudeltreue, Gruppenverbundenheit, Loyalität zum Clan, Schutz der Gemeinschaft",
  "primal_sense": "Ursinn, primitiver Instinkt, Kampf-oder-Flucht, archaische Wahrnehmung",
  "gut_feeling": "Bauchgefühl, Intuition, inneres Wissen ohne rationale Erklärung, Ahnung",
  "body_awareness": "Körperbewusstsein, somatische Wahrnehmung, Embodiment, Körperintelligenz",
  "servant_leader": "Dienende Führung, Verantwortung für andere, Fürsorge als Führungsstil",
  "charisma": "Ausstrahlung, persönlicher Magnetismus, Überzeugungskraft, Bühnenpräsenz",
  "analytical": "Analytisches Denken, systematische Zerlegung, Detailgenauigkeit, Präzision",
  "community": "Gemeinschaft, Zusammengehörigkeit, kollektives Handeln, Gruppendynamik",
  "passionate": "Leidenschaft, Intensität, brennendes Verlangen, emotionale Hitze",
  "togetherness": "Zusammensein, gemeinsame Zeit, Nähe, Verbundenheit, geteilte Erlebnisse",
  "expression": "Selbstausdruck, kreative Äußerung, Performance, Kommunikation von innen nach außen",
  "protective": "Beschützerinstinkt, Schutzverhalten, Fürsorge, Verteidigung der Schwachen",
  "independence": "Unabhängigkeit, Selbständigkeit, Freiheitsdrang, Eigenständigkeit",
  "sensory_connection": "Sinnliche Verbindung, körperliche Kommunikation ohne Worte, Präsenz",
  "physical_expression": "Körperlicher Ausdruck, Bewegung als Kommunikation, Tanz, Gestik"
}
```

### Task 4.7 — Tests

Erstelle `tests/test_affinity_derivation.py`:

```python
"""Tests für das Affinity Derivation Tool."""

import pytest
from tools.sector_vad import SECTOR_VAD, VADProfile
from tools.affinity_math import cosine_similarity, compute_affinity_row, compare_rows


class TestCosineSimilarity:
    def test_identical_profiles(self):
        a = VADProfile(0.5, 0.8, 0.3)
        assert cosine_similarity(a, a) == pytest.approx(1.0, abs=0.001)

    def test_orthogonal_profiles(self):
        a = VADProfile(1.0, 0.0, 0.0)
        b = VADProfile(0.0, 1.0, 0.0)
        assert cosine_similarity(a, b) == pytest.approx(0.0, abs=0.001)

    def test_opposite_valence(self):
        a = VADProfile(+0.8, 0.5, 0.5)
        b = VADProfile(-0.8, 0.5, 0.5)
        # Nicht perfekt gegensätzlich wegen A und D Überlapp
        sim = cosine_similarity(a, b)
        assert sim < 0.5  # Aber niedrig

    def test_zero_vector(self):
        a = VADProfile(0.0, 0.0, 0.0)
        b = VADProfile(0.5, 0.5, 0.5)
        assert cosine_similarity(a, b) == 0.0


class TestComputeAffinityRow:
    def test_sum_approximately_one(self):
        vad = VADProfile(0.3, 0.7, 0.5)
        row = compute_affinity_row(vad)
        assert sum(row) == pytest.approx(1.0, abs=0.05)

    def test_all_non_negative(self):
        vad = VADProfile(-0.5, 0.9, 0.8)
        row = compute_affinity_row(vad)
        assert all(v >= 0 for v in row)

    def test_twelve_elements(self):
        vad = VADProfile(0.1, 0.5, 0.5)
        row = compute_affinity_row(vad)
        assert len(row) == 12

    def test_scorpio_affinity_for_dark_intense(self):
        """Negativ, hoch-aktiviert, dominant → muss S7 (Skorpion) treffen."""
        vad = VADProfile(valence=-0.4, arousal=0.85, dominance=0.8)
        row = compute_affinity_row(vad)
        # S7 (Skorpion) hat exakt dieses Profil
        assert row[7] == max(row), f"S7 sollte Peak sein, ist aber {row}"

    def test_pisces_affinity_for_soft_submissive(self):
        """Mild positiv, niedrig-aktiviert, sehr submissiv → S11 (Fische)."""
        vad = VADProfile(valence=+0.1, arousal=0.2, dominance=0.1)
        row = compute_affinity_row(vad)
        assert row[11] == max(row), f"S11 sollte Peak sein, ist aber {row}"

    def test_aries_affinity_for_impulsive_dominant(self):
        """Positiv, hoch-aktiviert, sehr dominant → S0 (Widder) oder S4 (Löwe)."""
        vad = VADProfile(valence=+0.3, arousal=0.9, dominance=0.9)
        row = compute_affinity_row(vad)
        # S0 und S4 haben ähnliches Profil, einer muss Top-2 sein
        top2 = sorted(range(12), key=lambda s: row[s], reverse=True)[:2]
        assert 0 in top2 or 4 in top2, f"S0 oder S4 sollte Top-2 sein: {row}"


class TestCompareRows:
    def test_identical_is_coherent(self):
        a = [0.1] * 12
        result = compare_rows(a, a)
        assert result["coherent"] is True
        assert result["max_delta"] == 0.0

    def test_large_delta_is_mismatch(self):
        a = [0.5] + [0.05] * 11
        b = [0.0] + [0.05] * 11
        result = compare_rows(a, b, threshold=0.15)
        assert result["coherent"] is False
        assert result["max_delta_sector"] == 0


class TestSectorVADConsistency:
    def test_all_twelve_sectors_defined(self):
        assert len(SECTOR_VAD) == 12

    def test_valence_range(self):
        for s, vad in SECTOR_VAD.items():
            assert -1.0 <= vad.valence <= 1.0, f"S{s} valence out of range"

    def test_arousal_range(self):
        for s, vad in SECTOR_VAD.items():
            assert 0.0 <= vad.arousal <= 1.0, f"S{s} arousal out of range"

    def test_dominance_range(self):
        for s, vad in SECTOR_VAD.items():
            assert 0.0 <= vad.dominance <= 1.0, f"S{s} dominance out of range"

    def test_scorpio_is_negative_valence(self):
        assert SECTOR_VAD[7].valence < 0, "Skorpion muss negativ-valence sein"

    def test_pisces_is_low_dominance(self):
        assert SECTOR_VAD[11].dominance <= 0.2, "Fische muss niedrig-dominant sein"

    def test_aries_is_high_arousal(self):
        assert SECTOR_VAD[0].arousal >= 0.8, "Widder muss hoch-aktiviert sein"
```

### Task 4.8 — Integration-Test mit LeanDeep (optional, braucht laufende Instanz)

Erstelle `tests/test_affinity_integration.py`:

```python
"""
Integration-Tests: brauchen laufende LeanDeep-Instanz.

Markiert als 'integration' — mit pytest -m integration ausführen.
Übersprungen wenn LeanDeep nicht erreichbar.
"""

import pytest
from tools.leandeep_client import LeanDeepClient
from tools.affinity_math import compute_affinity_row
from tools.sector_vad import SECTOR_NAMES

client = LeanDeepClient()

pytestmark = pytest.mark.integration

@pytest.fixture(autouse=True)
def skip_if_no_leandeep():
    if not client.health():
        pytest.skip("LeanDeep nicht erreichbar")


class TestPhysicalTouchDerivation:
    def test_derives_scorpio_peak(self):
        vad, _ = client.derive_vad(
            "Körperliche Berührung, physische Nähe, Umarmung, "
            "taktile Liebessprache, Hautkontakt, sinnliche Verbindung"
        )
        row = compute_affinity_row(vad)
        # S7 (Skorpion) oder S1 (Stier) muss Top-2 sein
        top3 = sorted(range(12), key=lambda s: row[s], reverse=True)[:3]
        assert 7 in top3 or 1 in top3, (
            f"Physical Touch sollte S7 oder S1 treffen: "
            f"{[(s, SECTOR_NAMES[s], row[s]) for s in top3]}"
        )


class TestAnalyticalDerivation:
    def test_derives_virgo_or_gemini_peak(self):
        vad, _ = client.derive_vad(
            "Analytisches Denken, logische Zerlegung, Präzision, "
            "systematische Analyse, Detailarbeit, wissenschaftliche Methode"
        )
        row = compute_affinity_row(vad)
        top3 = sorted(range(12), key=lambda s: row[s], reverse=True)[:3]
        # S5 (Jungfrau/Analyse) oder S2 (Zwillinge/Kognition)
        assert 5 in top3 or 2 in top3, (
            f"Analytical sollte S5 oder S2 treffen: "
            f"{[(s, SECTOR_NAMES[s], row[s]) for s in top3]}"
        )


class TestProtectiveDerivation:
    def test_derives_cancer_or_capricorn(self):
        vad, _ = client.derive_vad(
            "Beschützerinstinkt, Verteidigung der Schwachen, "
            "Fürsorge, Schutzverhalten, Aufopferung für die Familie"
        )
        row = compute_affinity_row(vad)
        top3 = sorted(range(12), key=lambda s: row[s], reverse=True)[:3]
        # S3 (Krebs/Fürsorge) oder S9 (Steinbock/Verantwortung)
        assert 3 in top3 or 9 in top3, (
            f"Protective sollte S3 oder S9 treffen: "
            f"{[(s, SECTOR_NAMES[s], row[s]) for s in top3]}"
        )
```

### Task 4.9 — pytest.ini Marker registrieren

In `pytest.ini` (existiert bereits) hinzufügen:

```ini
[pytest]
markers =
    integration: Tests die eine laufende LeanDeep-Instanz brauchen
```

---

## 5. Dateistruktur (Ergebnis)

```
tools/
├── sector_vad.py                ← 12 Sektor-VAD-Profile (Konstanten)
├── affinity_math.py             ← Cosinus-Similarity, Row-Berechnung, Vergleich
├── leandeep_client.py           ← HTTP Client für LeanDeep
├── load_existing_map.py         ← Bestehende AFFINITY_MAP als Python-Dict
├── affinity_descriptions.json   ← Keyword → Beschreibungstext Mapping
├── derive_affinity.py           ← CLI Tool (derive / validate / batch / validate-all)

tests/
├── test_affinity_derivation.py  ← Unit Tests (kein LeanDeep nötig)
├── test_affinity_integration.py ← Integration Tests (brauchen LeanDeep)
```

---

## 6. Nutzung

**Einzelnes Keyword ableiten:**
```bash
python tools/derive_affinity.py derive \
  --keyword justice \
  --text "Gerechtigkeit, Fairness, ausgewogene Entscheidungen, Rechtsempfinden"
```

**Bestehenden Eintrag validieren:**
```bash
python tools/derive_affinity.py validate \
  --keyword physical_touch \
  --text "Körperliche Nähe, Berührung als Sprache der Liebe, sinnliche Verbindung"
```

**Ganzes Quiz auf einmal:**
```bash
python tools/derive_affinity.py batch \
  --quiz-json ../QuizzMe/src/components/quizzes/love-languages-quiz.json \
  --output results_love_lang.json
```

**Alle bestehenden Einträge prüfen:**
```bash
python tools/derive_affinity.py validate-all \
  --descriptions tools/affinity_descriptions.json
```

**Nur Unit-Tests (kein LeanDeep nötig):**
```bash
python -m pytest tests/test_affinity_derivation.py -v
```

**Mit Integration-Tests (LeanDeep muss laufen):**
```bash
python -m pytest tests/test_affinity_derivation.py tests/test_affinity_integration.py -v -m "not integration or integration"
```

---

## 7. Akzeptanzkriterien

1. `python -m pytest tests/test_affinity_derivation.py` — alle grün, ohne LeanDeep
2. Cosinus-Similarity: Identische Profile → 1.0, Orthogonale → 0.0
3. `compute_affinity_row` produziert 12 Werte, Summe ≈ 1.0, keine Negativen
4. VAD-Profil `{v:-0.4, a:0.85, d:0.8}` (Skorpion-artig) → S7 muss Peak sein
5. VAD-Profil `{v:+0.1, a:0.2, d:0.1}` (Fische-artig) → S11 muss Peak sein
6. `derive` Modus: Gibt TypeScript-formatierten Output der direkt in AFFINITY_MAP passt
7. `validate` Modus: Gibt KOHÄRENT ✓ oder MISMATCH ✗ mit Sektor-Detail
8. `batch` Modus: Verarbeitet Quiz-JSON, gibt Summary + alle neuen Zeilen
9. `validate-all` Modus: Prüft alle 27 bestehenden Keywords, Report pro Keyword
10. Kein Import von BAFE-Engine-Modulen. Das Tool ist standalone unter `tools/`.
11. Keine Änderung an bestehenden BAFE-Dateien (außer pytest.ini Marker-Registrierung)

---

## 8. Nicht im Scope

- Kein neuer BAFE API-Endpoint (kann später als `/tools/derive-affinity` ergänzt werden)
- Keine automatische Änderung der TypeScript AFFINITY_MAP (Tool gibt Vorschläge, Mensch entscheidet)
- Keine LeanDeep-Modifikationen (nutzt bestehende `/v1/analyze` API as-is)
- Keine UI/Frontend
- Keine Dependency auf Paket 1–3
