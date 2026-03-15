"""
bazodiac_engine/gcb_engine.py
==============================
Generational Context Baseline (GCB) Engine — Bazodiac v1.0

PURPOSE
  Derives a contextual baseline from birth year / age.
  This is NOT a personality assessment.
  This is NOT a second natal derivation.
  GCB describes the generational and life-stage context in which a person
  developed — a shared backdrop, not an individual fingerprint.

SIGNAL IDENTITY
  Natal Signal  → individual astronomical birth pattern (FuFirE)
  Quiz Signal   → current self-report (QuizzMe Engine)
  GCB           → cohort + life-stage context baseline (this module)

ARCHITECTURE
  derive_gcb(birth_date) → GCBModel
    ├── generation_label     (Gen Z / Millennial / Gen X / Boomer / Silent / Alpha)
    ├── cohort_5y / cohort_10y  (deterministic birth-year windows)
    ├── life_stage           (young_adult / emerging_adult / mid_adult / mature_adult / senior)
    ├── baseline_vector      (GCBVector — maps to shared cluster dimensions)
    ├── baseline_explanation (human-readable context description)
    └── evidence_mode        ("heuristic_v1" — transparent, non-empirical)

DIMENSION SPACE
  All three signals (Natal, Quiz, GCB) map to the same 5 cluster dimensions:
    passion     — expressivity, desire, initiative
    stability   — continuity, grounding, reliability
    future      — orientation toward growth and possibility
    connection  — relational depth, intimacy, social bonds
    autonomy    — self-direction, independence, individuation

  This shared space enables the Cross-Reference Engine to compute
  alignment and divergence meaningfully.

EVIDENCE TRANSPARENCY
  V1 uses heuristic mappings based on sociological generational research
  (Howe/Strauss, Pew Research Center, cross-cultural generational literature).
  All vectors are marked evidence_mode="heuristic_v1".
  No claim of statistical validity or universality is made.
  GCB must never be presented to users as their "true" or "core" personality.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional, Tuple

# ── Dimension Keys ─────────────────────────────────────────────────────────────

CLUSTER_DIMS = ["passion", "stability", "future", "connection", "autonomy"]

# ── Generation Definitions ─────────────────────────────────────────────────────

@dataclass(frozen=True)
class GenerationDef:
    label: str
    label_de: str
    birth_year_start: int
    birth_year_end: int
    description_de: str
    description_en: str
    # Heuristic baseline weights per cluster dimension (normalized, sum to 1.0)
    # These reflect documented generational tendencies as context, not destiny.
    baseline_weights: Dict[str, float]


GENERATIONS: List[GenerationDef] = [
    GenerationDef(
        label="Gen Alpha",
        label_de="Generation Alpha",
        birth_year_start=2013,
        birth_year_end=2028,
        description_de=(
            "Aufgewachsen in vollständig vernetzten Umgebungen. "
            "Stark zukunftsorientiert, explorative Identitätsbildung noch im Gange."
        ),
        description_en=(
            "Raised in fully networked environments. "
            "Strong future-orientation; identity formation still emerging."
        ),
        baseline_weights={
            "passion":    0.20,
            "stability":  0.10,
            "future":     0.35,
            "connection": 0.25,
            "autonomy":   0.10,
        },
    ),
    GenerationDef(
        label="Gen Z",
        label_de="Generation Z",
        birth_year_start=1997,
        birth_year_end=2012,
        description_de=(
            "Digitale Eingeborene unter realen Unsicherheiten. "
            "Hohe Authentizitätsorientierung, pragmatischer Idealismus, "
            "Identitätsfluidität als Normalzustand."
        ),
        description_en=(
            "Digital natives under real-world uncertainty. "
            "High authenticity-orientation, pragmatic idealism, "
            "identity fluidity as norm."
        ),
        baseline_weights={
            "passion":    0.22,
            "stability":  0.13,
            "future":     0.28,
            "connection": 0.22,
            "autonomy":   0.15,
        },
    ),
    GenerationDef(
        label="Millennial",
        label_de="Millennials",
        birth_year_start=1981,
        birth_year_end=1996,
        description_de=(
            "Aufgewachsen zwischen Analogem und Digitalem. "
            "Erfahrungen mit verzögerten Übergängen, starkes Streben nach Bedeutung, "
            "Balancesuche zwischen Stabilität und Selbstverwirklichung."
        ),
        description_en=(
            "Raised between analog and digital worlds. "
            "Experienced delayed life transitions; strong search for meaning, "
            "balancing stability with self-actualization."
        ),
        baseline_weights={
            "passion":    0.25,
            "stability":  0.18,
            "future":     0.27,
            "connection": 0.18,
            "autonomy":   0.12,
        },
    ),
    GenerationDef(
        label="Gen X",
        label_de="Generation X",
        birth_year_start=1965,
        birth_year_end=1980,
        description_de=(
            "Selbstständig groß geworden, pragmatisch und adaptiv. "
            "Hohe Eigenverantwortung, selektives Vertrauen, "
            "Stabilität als errungener Wert."
        ),
        description_en=(
            "Self-reliant upbringing, pragmatic and adaptive. "
            "High personal accountability, selective trust, "
            "stability as an earned value."
        ),
        baseline_weights={
            "passion":    0.18,
            "stability":  0.28,
            "future":     0.18,
            "connection": 0.16,
            "autonomy":   0.20,
        },
    ),
    GenerationDef(
        label="Boomer",
        label_de="Baby-Boomer",
        birth_year_start=1946,
        birth_year_end=1964,
        description_de=(
            "Geprägt von Nachkriegsaufbruch und kollektivem Optimismus. "
            "Institutionenvertrauen, strukturierte Lebensplanung, "
            "Leidenschaft im Rahmen gesellschaftlicher Normen."
        ),
        description_en=(
            "Shaped by post-war expansion and collective optimism. "
            "Institutional trust, structured life-planning, "
            "passion within societal frameworks."
        ),
        baseline_weights={
            "passion":    0.20,
            "stability":  0.32,
            "future":     0.15,
            "connection": 0.20,
            "autonomy":   0.13,
        },
    ),
    GenerationDef(
        label="Silent Generation",
        label_de="Stille Generation",
        birth_year_start=1928,
        birth_year_end=1945,
        description_de=(
            "Geformt durch Entbehrung und kollektive Resilienz. "
            "Tiefe Loyalität, Stabilität als höchster Wert, "
            "Leidenschaft als privat gelebte Kraft."
        ),
        description_en=(
            "Forged through scarcity and collective resilience. "
            "Deep loyalty, stability as highest value, "
            "passion as a privately lived force."
        ),
        baseline_weights={
            "passion":    0.15,
            "stability":  0.38,
            "future":     0.10,
            "connection": 0.25,
            "autonomy":   0.12,
        },
    ),
]


# ── Life Stage Definitions ─────────────────────────────────────────────────────

@dataclass(frozen=True)
class LifeStageDef:
    key: str
    label_de: str
    label_en: str
    age_min: int
    age_max: int
    description_de: str
    description_en: str
    # Modifier applied multiplicatively to generation baseline (1.0 = no change)
    modifier: Dict[str, float]


LIFE_STAGES: List[LifeStageDef] = [
    LifeStageDef(
        key="young_adult",
        label_de="Junges Erwachsenalter",
        label_en="Young Adulthood",
        age_min=17, age_max=25,
        description_de="Phase aktiver Identitätsbildung, Exploration und hoher Veränderungsbereitschaft.",
        description_en="Phase of active identity formation, exploration, and high change-readiness.",
        modifier={"passion": 1.3, "stability": 0.7, "future": 1.2, "connection": 1.1, "autonomy": 1.1},
    ),
    LifeStageDef(
        key="emerging_adult",
        label_de="Aufbauphase",
        label_en="Emerging Adulthood",
        age_min=26, age_max=35,
        description_de="Aufbau von Strukturen: Beruf, Beziehung, Selbstbild. Hohe Integrations­anforderung.",
        description_en="Building structures: career, relationships, self-concept. High integration demand.",
        modifier={"passion": 1.15, "stability": 0.9, "future": 1.15, "connection": 1.1, "autonomy": 1.0},
    ),
    LifeStageDef(
        key="mid_adult",
        label_de="Mittleres Erwachsenalter",
        label_en="Mid Adulthood",
        age_min=36, age_max=50,
        description_de="Konsolidierung von Werten und Beziehungen. Tiefe statt Breite. Orientierungsanker.",
        description_en="Consolidation of values and relationships. Depth over breadth. Orienting anchor.",
        modifier={"passion": 0.95, "stability": 1.15, "future": 0.95, "connection": 1.05, "autonomy": 1.0},
    ),
    LifeStageDef(
        key="mature_adult",
        label_de="Reifes Erwachsenalter",
        label_en="Mature Adulthood",
        age_min=51, age_max=65,
        description_de="Reflexion auf Lebens­entscheidungen. Leidenschaft mit Tiefe. Selektive Zukunftsorientierung.",
        description_en="Reflection on life choices. Passion with depth. Selective future-orientation.",
        modifier={"passion": 1.0, "stability": 1.1, "future": 0.85, "connection": 1.1, "autonomy": 1.05},
    ),
    LifeStageDef(
        key="senior",
        label_de="Spätes Erwachsenalter",
        label_en="Senior Adulthood",
        age_min=66, age_max=120,
        description_de="Weisheit und Präsenz. Stabilität als gelebte Wahrheit. Leidenschaft im Jetzt.",
        description_en="Wisdom and presence. Stability as lived truth. Passion rooted in the present.",
        modifier={"passion": 0.9, "stability": 1.2, "future": 0.70, "connection": 1.15, "autonomy": 1.0},
    ),
]


# ── GCB Data Model ─────────────────────────────────────────────────────────────

@dataclass
class GCBVector:
    """
    Normalized 5D contextual baseline vector.
    Maps to the shared cluster dimension space: passion / stability / future / connection / autonomy.
    """
    passion:    float
    stability:  float
    future:     float
    connection: float
    autonomy:   float

    def to_dict(self) -> Dict[str, float]:
        return {
            "passion":    self.passion,
            "stability":  self.stability,
            "future":     self.future,
            "connection": self.connection,
            "autonomy":   self.autonomy,
        }

    def normalize(self) -> GCBVector:
        total = sum(self.to_dict().values())
        if total < 1e-9:
            return GCBVector(0.2, 0.2, 0.2, 0.2, 0.2)
        d = self.to_dict()
        return GCBVector(**{k: v / total for k, v in d.items()})


@dataclass
class GCBModel:
    """
    Full Generational Context Baseline model.

    IMPORTANT: This is a CONTEXT model, not a personality assessment.
    evidence_mode must always be surfaced in UI/API outputs.
    """
    birth_year: int
    age: int

    # Cohort windows
    cohort_5y: str        # e.g. "1993–1997"
    cohort_10y: str       # e.g. "1990–1999"

    # Generation
    generation_label: str
    generation_label_de: str

    # Life stage
    life_stage: str       # key, e.g. "emerging_adult"
    life_stage_label_de: str
    life_stage_label_en: str

    # Baseline vector (normalized)
    baseline_vector: GCBVector

    # Contextual narrative
    baseline_explanation_de: str
    baseline_explanation_en: str

    # Transparency marker
    evidence_mode: str = "heuristic_v1"

    # Dominant dimension (highest weight)
    dominant_dimension: str = ""

    def to_dict(self) -> dict:
        return {
            "birth_year":            self.birth_year,
            "age":                   self.age,
            "cohort_5y":             self.cohort_5y,
            "cohort_10y":            self.cohort_10y,
            "generation_label":      self.generation_label,
            "generation_label_de":   self.generation_label_de,
            "life_stage":            self.life_stage,
            "life_stage_label_de":   self.life_stage_label_de,
            "life_stage_label_en":   self.life_stage_label_en,
            "baseline_vector":       self.baseline_vector.to_dict(),
            "dominant_dimension":    self.dominant_dimension,
            "baseline_explanation":  {
                "de-DE": self.baseline_explanation_de,
                "en-US": self.baseline_explanation_en,
            },
            "evidence_mode":         self.evidence_mode,
        }


# ── Derivation Logic ───────────────────────────────────────────────────────────

def _get_generation(birth_year: int) -> GenerationDef:
    for gen in GENERATIONS:
        if gen.birth_year_start <= birth_year <= gen.birth_year_end:
            return gen
    # Fallback for edge cases
    if birth_year < 1928:
        return GENERATIONS[-1]  # Silent Generation
    return GENERATIONS[1]  # Gen Z as safe default for future years


def _get_life_stage(age: int) -> LifeStageDef:
    for ls in LIFE_STAGES:
        if ls.age_min <= age <= ls.age_max:
            return ls
    if age < 17:
        # Underage — return young_adult as approximation
        return LIFE_STAGES[0]
    return LIFE_STAGES[-1]  # Senior


def _compute_cohort_windows(birth_year: int) -> Tuple[str, str]:
    """Compute deterministic 5-year and 10-year cohort windows."""
    # 5-year window: floor to nearest 5
    start_5 = (birth_year // 5) * 5
    cohort_5y = f"{start_5}–{start_5 + 4}"

    # 10-year window: floor to nearest 10
    start_10 = (birth_year // 10) * 10
    cohort_10y = f"{start_10}–{start_10 + 9}"

    return cohort_5y, cohort_10y


def _build_baseline_vector(gen: GenerationDef, life_stage: LifeStageDef) -> GCBVector:
    """
    Combine generation baseline with life-stage modifier.
    Each dimension: weight = gen_weight × life_stage_modifier
    Result is normalized to sum to 1.0.
    """
    raw = {}
    for dim in CLUSTER_DIMS:
        gen_w = gen.baseline_weights.get(dim, 0.2)
        ls_mod = life_stage.modifier.get(dim, 1.0)
        raw[dim] = gen_w * ls_mod

    total = sum(raw.values())
    normalized = {k: v / total for k, v in raw.items()}
    return GCBVector(**normalized)


def _build_explanation(
    gen: GenerationDef,
    life_stage: LifeStageDef,
    dominant: str,
) -> Tuple[str, str]:
    """Build localized contextual explanation strings."""

    dim_labels_de = {
        "passion":    "Leidenschaft und Initiative",
        "stability":  "Stabilität und Kontinuität",
        "future":     "Zukunftsorientierung",
        "connection": "Verbundenheit",
        "autonomy":   "Eigenständigkeit",
    }
    dim_labels_en = {
        "passion":    "passion and initiative",
        "stability":  "stability and continuity",
        "future":     "future-orientation",
        "connection": "connection and belonging",
        "autonomy":   "autonomy and self-direction",
    }

    de = (
        f"{gen.description_de} "
        f"In der Lebensphase '{life_stage.label_de}': {life_stage.description_de} "
        f"Kontextuell prägend: {dim_labels_de.get(dominant, dominant)}. "
        f"[Kontext-Baseline — kein Persönlichkeitsbeweis]"
    )
    en = (
        f"{gen.description_en} "
        f"In the life stage '{life_stage.label_en}': {life_stage.description_en} "
        f"Contextually dominant: {dim_labels_en.get(dominant, dominant)}. "
        f"[Context baseline — not a personality claim]"
    )
    return de, en


def derive_gcb(birth_date: date, reference_date: Optional[date] = None) -> GCBModel:
    """
    Derive the full GCBModel from a birth date.

    Args:
        birth_date: The person's date of birth.
        reference_date: Reference date for age calculation (defaults to today).

    Returns:
        GCBModel — fully populated, evidence_mode="heuristic_v1"
    """
    if reference_date is None:
        reference_date = date.today()

    birth_year = birth_date.year
    age = (
        reference_date.year - birth_year
        - (1 if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day) else 0)
    )

    cohort_5y, cohort_10y = _compute_cohort_windows(birth_year)
    gen = _get_generation(birth_year)
    life_stage = _get_life_stage(age)

    baseline_vector = _build_baseline_vector(gen, life_stage)
    normalized = baseline_vector.normalize()

    # Dominant dimension
    vec_dict = normalized.to_dict()
    dominant = max(vec_dict, key=vec_dict.get)

    explanation_de, explanation_en = _build_explanation(gen, life_stage, dominant)

    return GCBModel(
        birth_year=birth_year,
        age=age,
        cohort_5y=cohort_5y,
        cohort_10y=cohort_10y,
        generation_label=gen.label,
        generation_label_de=gen.label_de,
        life_stage=life_stage.key,
        life_stage_label_de=life_stage.label_de,
        life_stage_label_en=life_stage.label_en,
        baseline_vector=normalized,
        baseline_explanation_de=explanation_de,
        baseline_explanation_en=explanation_en,
        evidence_mode="heuristic_v1",
        dominant_dimension=dominant,
    )


# ── Convenience ────────────────────────────────────────────────────────────────

def derive_gcb_from_iso(birth_date_iso: str, reference_date_iso: Optional[str] = None) -> GCBModel:
    """derive_gcb accepting ISO 8601 date strings (YYYY-MM-DD)."""
    from datetime import date as _date
    bd = _date.fromisoformat(birth_date_iso)
    rd = _date.fromisoformat(reference_date_iso) if reference_date_iso else None
    return derive_gcb(bd, rd)
