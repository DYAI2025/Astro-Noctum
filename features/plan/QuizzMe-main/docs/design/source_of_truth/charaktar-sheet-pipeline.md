Zusammenfassung: Chat, Vorgehensweise und Implementierungs-Blueprint (Character Sheet v2)
Hinweis: Ich schreibe bewusst in ASCII (ae/oe/ue statt Umlauten).

1) Ausgangslage und Zielbild
Ihr Kernkonzept war:

Ein dynamisches User-Profil ("Character Sheet"), das sich ueber Zeit durch Quizzes weiterentwickelt.

Jeder Quiz erzeugt Fortschritt (Progressbar -> Completion -> Reward/Visual Upgrade -> teilbares Ergebnis).

Nicht jedes Quiz hat die gleiche Wirkung: manche sind "Flavor" (kosmetisch/leicht), manche "Core" (stark), manche "Growth" (mittel).

Kritische Anforderungen:

Werte duerfen nie "ueber 100" explodieren.

Je naeher ein Wert an 0 oder 100, desto langsamer soll er sich bewegen (Saturation).

Astro (Sternzeichen, Chinese Zodiac, etc.) soll ein stabiler "Grundanker" sein, der nicht zu stark kippt.

Quizzes sollen diesen Anker dynamisch beeinflussen, aber der Anker bleibt dominanter als Einzelquizzes.

Daraus entstand das Systemdesign:

Astro Onboarding = Base Anchor (stabile Grundfarbe)

Quizzes = Evidence (dynamische Updates, saturierend, bounded)

Character Sheet UI zeigt nur "finale UI-Scores" (1..100), ohne selbst zu rechnen.

2) Vorgehensweise (Implementation Phasen)
Die Implementierung lief in klaren, voneinander isolierten Phasen, jeweils mit "Build gruen" als Gate:

Phase 1: Registry Foundation
Ein "Single Source of Truth" fuer alle IDs:

trait.*, marker.*, tag.*, unlock.*, field.*

Validatoren fuer runtime und CI.

Registry-Lint Script, das das Repo nach ID-Strings scannt und failt, wenn etwas nicht in der Registry steht.

Uebergangsweise Allowlist fuer Legacy-Quiz-IDs (mit Prefix-Support) als Bridge bis Phase 7.

Phase 2: Two-Layer Trait System
Interner Trait-Status pro Trait:

baseScore (1..100, stabil)

shiftZ (logit-space offset, dynamisch)

shiftStrength (akkumulierte Evidenz)

Mapping zu UI:

Logit/Sigmoid sorgt fuer Saturation und harte Bounds 1..100.

"Anchor dominance":

Evidence, die gegen den Anchor arbeitet, wird abgeschwaecht und gecappt.

Phase 3: ContributionEvent Pipeline
Einheitliches Event-Format (ContributionEvent) fuer Onboarding und Quizzes.

Validatoren:

Schema/Shape

ID-Validierung (Registry)

Modulregeln (z.B. astro onboarding constraints)

Ingestion:

Marker -> Psyche Update (LME)

Trait-Update:

"Evidence path" (marker/quiz evidence -> shiftZ)

"Observation nudge path" (Legacy: UI-trait observations konvergieren sanft, statt zu ueberschreiben)

Snapshot Builder:

ProfileSnapshot als einziges UI-Inputformat (UI rechnet nicht).

Phase 4: Persistence + Wiring
Persistenter Store (JSON + Memory) fuer ProfileState.

Endpoints:

POST /api/contribute -> ingest -> persist -> snapshot zurueck

GET /api/profile/snapshot -> snapshot laden

Static Export Support:

localStorage Store + dual-mode contribute client (API vs static)

Phase 5: Astro Onboarding
Astro compute (MVP):

Sun sign + Chinese zodiac aus birth date/year

Optional: ascendant/moon spaeter (ohne zu raten, wenn unknown)

Anchor map:

Astro -> baseScores fuer anchorable traits

Gewichtung: sunSign 1.0, asc 0.6, moon 0.4, chineseAnimal 0.25

runOnce:

onboarding.astro.v1 darf nur einmal pro Profil laufen

FLAVOR markers:

astro markers immer non-empty, clamped 0.05..0.15

Phase 6: Character Sheet UI v2
Hook: useProfileSnapshot (dual-mode API/static)

Components:

ZodiacWheel (SVG)

Header (archetype, completion bar)

Trait blocks A-K mit empty state CTAs

Trait sliders 1..100

Unlocks block

/character wird komplett aus ProfileSnapshot gerendert.

Hygiene/DevEx (quer ueber Phasen)
Vor Implementierung: TypeScript build broken durch unused @ts-expect-error -> entfernt, build gruener.

Next.js workspace root inference warning gefixt (turbopack.root) fuer deterministische Builds.

3) Architekturuebersicht (Layers und Verantwortlichkeiten)
A) Registry Layer (Source of Truth)
Definiert:

Trait IDs, Marker IDs, Tag IDs, Unlock IDs, Field IDs

Metadaten (category, labels, anchorable, marker sign, weight ranges)

Kein Modul darf IDs "erfinden".

B) Event Layer (ContributionEvent)
Standardisierter Event-Container fuer alle Inputs (Onboarding, Quizzes, etc.)

C) Ingestion Layer (Core Engine)
Validiert Events (shape + registry + module rules)

Updated:

Psyche State (aus markers)

TraitStates (baseScore + shiftZ)

Tags/Unlocks/Fields/Astro payload

Erzeugt ProfileSnapshot als UI-Output

D) Persistence Layer
Speichert ProfileState und optional Event Audit

Bietet API endpoints fuer dynamic mode

localStorage fuer static export mode

E) UI Layer
Konsumiert ausschließlich ProfileSnapshot

Keine Berechnung von baseScore/shiftZ in der UI

4) Datenmodelle (Essenz)
ProfileState (intern)
traitStates: Record<traitId, TraitState>

psycheState (LME state)

tags, unlocks, fields, astro, meta, anchors (z.B. astro anchor metadata)

TraitState (Two-Layer)
baseScore = stabiler Anchor (1..100)

shiftZ = dynamischer logit offset

shiftStrength = Evidenzsumme

updatedAt

ProfileSnapshot (UI)
traits: Record<traitId, number> (final UI 1..100)

psyche (archetypeMix, avatarParams, visualAxes)

astro, tags, unlocks, fields

meta.completion (progress bar, unlock counts, etc.)

5) Mechanik: Saturation + Anchor Dominance (warum Werte nie ueber 100 gehen)
Grundidee
UI Score ist eine Sigmoid-Abbildung:

Score 1..100 wird in Wahrscheinlichkeit p abgebildet

p -> logit z

z addiert shiftZ

Rueckweg: sigmoid(z) -> p -> Score

Effekt:

Im mittleren Bereich (um 50) bewegt sich Score schneller.

Nahe 0/100 wird Bewegung sehr langsam (Saturation).

Dadurch keine "Explosionswerte".

Anchor Dominance
Wenn Evidence in Richtung des Anchors geht: mehr Spielraum (ALIGN cap)

Wenn Evidence gegen den Anchor geht: kleinerer Spielraum + Abschwaechung (OPPOSE factor + OPPOSE cap)

Ergebnis:

Astro bleibt "Grundfarbe"

Quizzes koennen gegensteuern, aber nicht unendlich.

6) ContributionEvent: Pipeline-Inputformat
Jeder Producer (Quiz/Onboarding) emittiert ein Event:

Minimalstruktur (vereinfacht):

json
Code kopieren
{
  "specVersion": "sp.contribution.v1",
  "eventId": "uuid",
  "occurredAt": "ISO_TIMESTAMP",
  "source": {
    "vertical": "quiz|character|...",
    "moduleId": "some.module.v1",
    "locale": "de-DE",
    "build": "sha"
  },
  "payload": {
    "markers": [
      { "id": "marker.social.extroversion", "weight": 0.4, "evidence": { "confidence": 0.9 } }
    ],
    "tags": [
      { "id": "tag.style.humor.dry", "kind": "style", "weight": 0.6 }
    ],
    "unlocks": [
      { "id": "unlock.crests.personality", "unlocked": true, "level": 1 }
    ],
    "fields": [
      { "id": "field.meta.fun_facts", "kind": "bullets", "value": ["..."] }
    ],
    "astro": { "...": "only for onboarding.astro.v1" }
  }
}
Wichtig:

IDs muessen in der Registry existieren (oder sind in der Legacy-Bridge allowlisted bis Phase 7).

Marker weights sind positiv; Richtung steckt in marker.sign (registry), nicht im weight.

7) Ingestion Pipeline (End-to-End)
1) Producer: Quiz/Onboarding
berechnet Result/Evidence

baut ContributionEvent

2) Validierung
Schema (Pflichtfelder)

Registry IDs

Modulregeln (z.B. astro darf keine social markers emitten)

3) Persist Event (optional audit)
JSONL oder DB

4) Apply Markers -> Psyche (LME)
markerAggregator + updatePsycheState (bestehendes LME)

5) Apply Trait Updates
Zwei Pfade:

A) Evidence Path (preferred, "new quizzes")

Quiz erzeugt Evidence fuer Traits oder Marker->Trait Mapping

Evidence wird zu deltaZ skaliert (Tier gain) und via applyEvidence in shiftZ integriert

B) Observation Nudge (legacy compatibility)

Bestehende Quizzes liefern UI-trait scores (observations)

Ingestion nudged shiftZ in Richtung der Observation (konvergent, learnRate)

Kein Overwrite, keine Explosionswerte

6) Merge cosmetics/content
Tags/Unlocks/Fields/Astro

7) Build ProfileSnapshot
traits[traitId] = uiScore(traitState)

completion meta berechnen

UI bekommt fertigen Snapshot

8) Astro Onboarding (Spezialfall)
runOnce
Wenn astro anchor schon existiert:

accepted=false oder no-op

baseScores bleiben unveraendert

baseScore seeding
Nur ANCHORABLE_TRAIT_IDS

Start 50 + gewichtete deltas aus anchor map

clamp 1..100

shiftZ=0 fuer seeded traits

Marker output (FLAVOR)
Immer 2 markers:

top-1 element

top-1 modality

weights in [0.05..0.15]

Keine personality markers

9) Must-haves fuer ein Quiz, das an die Pipeline angeschlossen wird
Hier ist die "Quiz Authoring Template" Liste, die ein AI-Agent oder Entwickler strikt abarbeiten soll.

A) Modul-Identity (Pflicht)
eindeutige moduleId mit Versionierung:

z.B. quiz.personality.v1

source.vertical korrekt:

typischerweise "quiz" (oder euer definierter Vertikal-Name)

Tier definieren (CORE/GROWTH/FLAVOR):

bestimmt maximale Wirkung (deltaZ budget)

B) Registry Compliance (Pflicht)
Alle IDs muessen aus Registry kommen:

marker IDs, tag IDs, unlock IDs, field IDs, trait IDs (falls observation path)

Keine "freien Strings" als IDs.

Wenn ihr temporaer Legacy habt:

nur ueber allowlist, mit klarer Removal Policy (Phase 7)

C) Marker Output (Must-have, strongly recommended)
Quiz sollte primaer ueber payload.markers[] wirken.

Marker weights:

immer positiv (0..1)

confidence optional (0..1)

Richtung kommt aus marker registry (sign)

D) Trait Update Strategy (choose one)
Evidence-first (best)

map answers -> markers -> trait deltas (oder direkt trait evidence)

ingestion rechnet shiftZ update (bounded, saturating)

Observation nudge (nur als Bridge)

payload.traits als UI scores

ingestion nudged shiftZ konvergent

Regel:

Niemals "hart" baseScore ueberschreiben.

Niemals UI scores direkt in state speichern (nur snapshot derived).

E) Output: Tags/Unlocks/Fields (optional, aber wertvoll)
Tags: Ergebnislabels, style/vibe, archetype, shadow

Unlocks: Crest/Badge pro completion, level up

Fields: qualitative slots (bullets/text) fuer Character Sheet

F) Budgets und Sicherheitsmechaniken (Pflicht im Design)
Marker tier budgets:

FLAVOR klein, GROWTH mittel, CORE groesser

Keine marker spam:

lieber wenige, starke Signale als 30 mini markers

Immer bounded behavior:

expected effect muss im trait-engine saturieren

G) Tests (Must-have)
Pro Quiz mindestens:

Event validiert (shape + registry)

Marker allowlist passt (keine forbidden prefixes)

Ingestion erzeugt snapshot mit traits 1..100

Wiederholtes Ausfuehren:

beeinflusst traits erwartbar, aber ohne Explosionswerte

Static export mode:

contribute-client funktioniert ohne API

H) UI/UX Must-haves (produktseitig)
Fortschritt/Completion sichtbar

Ergebnis teilbar (Share text/card)

Reward: unlock oder visual upgrade (unlock crest, badge, etc.)

CTA: nach Quiz zurueck zum /character snapshot

10) Pipeline-Checkliste fuer ein neues Quiz (kurz und hart)
moduleId + tier festlegen

output design:

markers (2..8 typischer sweet spot)

optional tags/unlocks/fields

alle IDs aus registry

event builder implementieren

validator rules (falls spezifisch)

ingestion: evidence path nutzen (oder nudge legacy)

snapshot sichtbar im character sheet block

tests + registry-lint + build gruen

11) Wo ihr jetzt steht und was als naechstes kommt
Aktueller Stand:

Phasen 1-6 komplett: registry, trait engine, ingestion, persistence, astro onboarding, character UI v2

System ist end-to-end lauffaehig in API mode und static export mode.

Naechster Schritt (Phase 7):

Quiz migrations:

Legacy IDs eliminieren

allowlist schrumpfen bis leer

jedes Quiz an registry marker/tags/unlocks anbinden

sicherstellen, dass Quizzes konsistent in Blocks A-K sichtbar werden