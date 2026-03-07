# Cluster Attribute Documentation

This document defines all variables, formulas, and character sheet mappings for each cluster.

---

## 1. Cluster: Mentalist

**Theme:** Mystical / Cosmic  
**Icon:** 🔮  
**Color:** `#4A0E4E` (Deep Purple)  
**Aesthetic:** `mystical`

### 1.1 Component Quizzes

| Order | Quiz ID | Display Name | Dimension | Weight |
|-------|---------|--------------|-----------|--------|
| 1 | `quiz.lovelang.v1` | Die 5 Sprachen der Liebe | Beziehungsresonanz | 1.0 |
| 2 | `quiz.charme.v1` | Deine Charme-Signatur | Soziale Magie | 1.2 |
| 3 | `quiz.eq.v1` | Deine Emotionale Signatur | Emotionale Alchemie | 1.1 |

---

### 1.2 Variable Definitions per Quiz

#### A) Love Languages Quiz (`quiz.lovelang.v1`)

**Dimensions (Raw Scores):**

| Variable | Description | Range |
|----------|-------------|-------|
| `intensity` | Emotional intensity of love expression | 0–24 |
| `expression` | Preference for acts of service vs. words | 0–24 |
| `connection` | Need for quality time and presence | 0–24 |

**Output Profiles:**

| Profile ID | Title (DE) | Condition |
|------------|------------|-----------|
| `the_poet` | Der Dichter | expression ≤ 8 AND connection ≥ 8 |
| `the_flame` | Die Flamme | intensity ≥ 14 AND connection ≥ 16 |
| `the_architect` | Der Architekt | expression ≥ 14 AND intensity ≤ 10 |
| `the_sanctuary` | Das Refugium | connection ≥ 14 AND intensity ≤ 12 AND 6 ≤ expression ≤ 14 |
| `the_keeper` | Der Hüter | connection ≤ 10 AND 6 ≤ expression ≤ 14 |
| `the_lighthouse` | Der Leuchtturm | connection ≤ 8 AND intensity ≤ 10 |

**Markers Emitted:**

```
marker.psyche.depth: 0.5–0.8 (per question)
marker.psyche.connection: 0.5–1.0 (per question)
marker.psyche.shadow: 0.4–0.5 (per question)
marker.psyche.structure: 0.8–1.0 (per question)
```

---

#### B) Charme Quiz (`quiz.charme.v1`)

**Dimensions (Raw Scores):**

| Variable | Description | Range | Scale |
|----------|-------------|-------|-------|
| `warmth` | Wärme-Orientierung (allozentrisch vs. egozentrisch) | 12–60 | 1–5 per question |
| `resonance` | Resonanz-Modus (verbal-intellektuell vs. nonverbal-emotional) | 12–60 | 1–5 per question |
| `authenticity` | Authentizität (performativ vs. vulnerabel) | 12–60 | 1–5 per question |
| `presence` | Präsenz-Qualität (aktivierend vs. beruhigend) | 12–60 | 1–5 per question |

**Output Profiles:**

| Profile ID | Title (DE) | Primary Condition |
|------------|------------|-------------------|
| `herzoffner` | Der Herzöffner | All dimensions 4–5 |
| `magnetische` | Die Magnetische | warmth 3–5, resonance 1–3, authenticity 2–4, presence 1–3 |
| `stiller-verzauberer` | Der Stille Verzauberer | warmth 3–5, resonance 4–5, authenticity 4–5, presence 3–5 |
| `diplomat` | Der Diplomat | warmth 3–4, resonance 2–4, authenticity 2–4, presence 3–5 |
| `esprit-funke` | Der Esprit-Funke | warmth 2–4, resonance 1–3, authenticity 2–4, presence 1–3 |
| `praesenz-anker` | Der Präsenz-Anker | warmth 4–5, resonance 3–5, authenticity 4–5, presence 5 |

**Normalization Formula:**

```
normalizedDimension = ((rawScore - 12) / (60 - 12)) * 100
```

**Markers Emitted:**

```
marker.charme.warmth: normalizedWarmth / 100
marker.charme.resonance: normalizedResonance / 100
marker.charme.authenticity: normalizedAuthenticity / 100
marker.charme.presence: normalizedPresence / 100
```

---

#### C) EQ Quiz (`quiz.eq.v1`)

**Dimensions (Raw Scores):**

| Variable | Description | Range | Scale |
|----------|-------------|-------|-------|
| `perception` | Emotionale Wahrnehmung (Pragmatisch vs. Hochsensibel) | 12–60 | 1–5 per question |
| `regulation` | Emotionale Steuerung (Expressiv vs. Reguliert) | 12–60 | 1–5 per question |
| `utilization` | Strategische Nutzung (Intuitiv vs. Strategisch) | 12–60 | 1–5 per question |

**Output Profiles:**

| Profile ID | Title (DE) | Primary Condition |
|------------|------------|-------------------|
| `resonator` | Der Resonator | perception ≥ 70% |
| `regulator` | Der Regulator | regulation ≥ 70% |
| `strategist` | Der Stratege | utilization ≥ 70% |
| `navigator` | Der Navigator | perception ≥ 60% AND utilization ≥ 60% |
| `alchemist` | Der Alchemist | balanced: avg ≥ 60%, variance ≤ 30 |
| `seeker` | Der Suchende | fallback: avg ≤ 50% OR high variance |

**Normalization Formula:**

```
normalizedDimension = ((rawScore - 12) / (60 - 12)) * 100
```

**Markers Emitted:**

```
marker.eq.perception: normalizedPerception / 100
marker.eq.regulation: normalizedRegulation / 100
marker.eq.utilization: normalizedUtilization / 100
```

---

### 1.3 Cluster Aggregation Formula

When all three quizzes are complete, the Mentalist cluster aggregates results:

**Method:** `weighted_average`

**Aggregated Output Traits:**

| Trait ID | Formula | Description |
|----------|---------|-------------|
| `trait.mentalist.empathy` | `(connection + warmth + perception) / 3` | Empathic resonance |
| `trait.mentalist.influence` | `(expression + resonance + utilization) / 3` | Social influence power |
| `trait.mentalist.equilibrium` | `(intensity_inv + regulation + presence) / 3` | Emotional balance |
| `trait.mentalist.insight` | `(authenticity + perception) / 2` | Psychological insight |

**Aggregated Output Markers:**

```
marker.mentalist.social_mastery: avg(warmth, resonance, expression)
marker.mentalist.emotional_depth: avg(connection, perception, authenticity)
marker.mentalist.charismatic_presence: avg(presence, intensity, utilization)
```

---

### 1.4 Character Sheet Effects

| Attribute | Source | Effect on Character Sheet |
|-----------|--------|---------------------------|
| `attribute.mentalist` | Cluster completion | Unlocks "Mentalist" badge, displays archetype card |
| `trait.mentalist.empathy` | Aggregated | Contributes to "Beziehungskompetenz" visual axis |
| `trait.mentalist.influence` | Aggregated | Contributes to "Sozialer Magnetismus" visual axis |
| `trait.mentalist.equilibrium` | Aggregated | Contributes to "Emotionale Stabilität" visual axis |
| `trait.mentalist.insight` | Aggregated | Contributes to "Psychologische Tiefe" visual axis |

---

### 1.5 Unlock Rewards

| Unlock ID | Level | Name | Description |
|-----------|-------|------|-------------|
| `unlock.badges.mentalist_complete` | 3 | Mentalist-Meister | Alle drei Dimensionen des Mentalist-Clusters abgeschlossen |
| `unlock.crests.charme_deep` | 2 | Charme-Signatur | Charme-Quiz abgeschlossen |
| `unlock.crests.eq_signature` | 2 | EQ-Signatur | EQ-Quiz abgeschlossen |
| `unlock.crests.lovelang` | 2 | Liebessprache | Love Languages Quiz abgeschlossen |

---

## 2. Cluster: Naturkind (Reference)

*See existing implementation in `src/lib/clusters/registry.ts`*

| Quiz ID | Dimension | Weight |
|---------|-----------|--------|
| `quiz.aura_colors.v1` | Energetische Signatur | 1.2 |
| `quiz.krafttier.v1` | Instinktive Natur | 1.0 |
| `quiz.blumenwesen.v1` | Wachstums-Essenz | 0.9 |
| `quiz.energiestein.v1` | Materielle Resonanz | 1.1 |

---

## Appendix: Quiz Titles (Brand-Aligned)

| Quiz ID | Proposed Title (DE) | Subtitle |
|---------|---------------------|----------|
| `quiz.charme.v1` | **Die Kunst des Charmes** | Entdecke deine einzigartige Signatur der Anziehung |
| `quiz.eq.v1` | **Deine Emotionale Signatur** | Entdecke dein einzigartiges Muster emotionaler Intelligenz |
| `quiz.lovelang.v1` | **Welche Sprache spricht dein Herz?** | Entdecke deinen Liebenden-Archetyp |
