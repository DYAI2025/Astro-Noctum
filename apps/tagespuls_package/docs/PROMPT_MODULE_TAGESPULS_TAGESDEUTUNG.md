# PROMPT-MODUL: TAGESPULS & TAGESDEUTUNG

Version: 2.1
Datum: 2026-04-30
Status: verbindliche Ziel-Spec fuer `/` und `packages/voice`

## 1. Begriffe

Nicht mischen:

- **Kosmisches Wetter**: aeusserer Zustand. Wirkt auf alle. Heimat: `sky.bazodiac.space`.
- **Tagespuls**: was fuer diesen User heute zusammenkommt. Phase 1. Ohne Archetyp-Bezug.
- **Tagesdeutung**: Tagespuls mal gewaehlter Archetyp. Phase 2. Entsteht erst nach Wahl.
- **Verboten**: Tageswetter.

## 2. Ritual in zwei Phasen

```text
Kosmisches Wetter + User-Profil
        |
        v
Mode-Bestimmung: pulse | trace | spannung
        |
        v
Phase 1: Tagespuls, 3 Slots, 30-50 Woerter
        |
        v
Wahl: "Welcher deiner sechs moechte heute mit diesem Puls etwas tun?"
        |
        v
Phase 2: Tagesdeutung, 50-90 Woerter, 3-4 Saetze
```

## 3. Phase 1: Tagespuls

Drei Slots:

1. **Aphorismus-Opener**: 8-20 Woerter. Kuratiert aus Sammlung. Nicht vom LLM erfunden. Durch Gedankenstrich abgetrennt.
2. **Bruecke zu heute**: 10-20 Woerter. Alltags-Deutsch, Du-Form. Wird von LLM formuliert.
3. **Impuls oder Tuer**: 10-15 Woerter. Handlung oder Beobachtung mit offenem Ausgang. Wird von LLM formuliert.

Verbote in Phase 1:

- Zodiac-Name
- Grad, Haus, Aspekt
- BaZi-Insiderwort
- Element im Slot 1
- direkte Archetyp-Anrede
- Wertung des Tages als gut/schlecht

## 4. Wahl-Moment

Frage:

> Welcher deiner sechs moechte heute mit diesem Puls etwas tun?

Rat der sechs:

| Position | Figur | Quelle |
|---|---|---|
| 1 | Sonne | West-Astro |
| 2 | Mond | West-Astro |
| 3 | Aszendent | West-Astro |
| 4 | Day-Master | BaZi, Tages-Stamm |
| 5 | Jahrestier | BaZi, Jahreszweig |
| 6 | Dominantes Wu-Xing-Element | BaZi/Fusion-Profil |

Kein Auto-Pick. Ohne Wahl bleibt der Tagespuls allein stehen.

## 5. Phase 2: Tagesdeutung

Input:

```yaml
modus: pulse | trace | spannung
intensity: number # 0..1
aphorismus_id: aph-NNNN
aphorismus_text_de: string
selected_archetype:
  key: sonne | mond | aszendent | day_master | jahrestier | wuxing_dom
  display_name: string
  sign_or_element: string
rat_rest: []
locale: de | en
```

Modus-Logik:

| Modus | Logik | Pflicht |
|---|---|---|
| pulse | Integration | Gewaehlter plus 1-3 weitere Figuren, ohne Hervorhebung |
| trace | Abgrenzung | Nur gewaehlter Archetyp; keine anderen Figuren |
| spannung | Sequenz | Gewaehlter plus genau eine zweite Figur in zeitlicher Abfolge |

Verbote:

- astrologische Mechanik erklaeren
- mehr als drei Zusatzfiguren in pulse
- Zusatzfiguren in trace
- Affirmation oder Pinterest-Esoterik
- Aphorismus erneut zitieren

## 6. Mode-Bestimmung

Vorlaeufiges Modell:

```text
H = cosine_similarity(western_wuxing_vector, bazi_wuxing_vector)
if H < 0.45:        modus = spannung
if 0.45 <= H < 0.5: modus = pulse
if H >= 0.5:        modus = trace
intensity = abs(H - 0.45) / 0.55, clamp 0..1
```

Hinweis: Die Schwellwerte muessen nach Real-Nutzungsdaten kalibriert werden. Bis dahin sind sie Produktannahme, nicht empirisch validierter Fakt.

## 7. Aphorismus-Selektion

```text
Pool = approved aphorisms where modus in mode_tags
remove cooldown conflicts
score = quality_rating
score += 2 if user dominant element in element_affinity
score += 1 if current season in season_affinity
score += 1 if selected/day figure in figure_affinity
if modus == trace and intensity > 0.7 and tone includes scharf or draengend: score *= 1.2
seed = hash(user_id + date + modus)
pick deterministic from top 5
```

## 8. LLM-Rolle

Das LLM darf:

- Slot 2 formulieren.
- Slot 3 formulieren.
- Phase 2 formulieren.
- recherchierte Kandidaten fuer Aphorismen vorschlagen.

Das LLM darf nicht:

- Slot 1 erfinden.
- Struktur oder Modus halluzinieren.
- ungepruefte Zitate als verifiziert markieren.
- astrologische Berechnung selbst durchfuehren, wenn Engine-Daten fehlen.
