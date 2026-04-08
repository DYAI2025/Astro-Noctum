# Bazodiac — Technische Systemdokumentation
**Stand: 2026-04-08 | Version: V3 / Astro-Noctum**

---

## 1. Überblick

Bazodiac ist eine Fusion-Astrologie-Plattform, die westliche Astrologie, BaZi (Chinesische Vier-Säulen-Astrologie) und Wu-Xing (Fünf-Elemente-Lehre) zu einer personalisierten, dynamischen Nutzersignatur verbindet. Der zentrale Orientierungswert der Plattform ist der **Kohärenzindex** — ein normierter Score (0–1), der den Grad der inneren Resonanz und Aktivierung eines Nutzers zu einem gegebenen Zeitpunkt ausdrückt.

---

## 2. Systemarchitektur

### 2.1 Externe Systeme

| System | ID | Zweck | Auth |
|---|---|---|---|
| FuFirE — Fusion Firmament Engine | `fufire` | Deterministische Astrologie-Berechnungen (BaZi, Western, Wu-Xing, Harmony Index) | `X-API-Key` Header |
| Supabase Bazodiac | `supabase_bazodiac` | Primäres Backend — User-Daten, Caches, Signatur-State | Service Role Key |
| NASA DONKI | `nasa_donki` | Space-Weather-Daten (GST, FLR, CME) | `api_key` Query-Parameter |
| ElevenLabs | `elevenlabs` | Voice AI Agents (Eve — Western, Levi — BaZi) | `xi-api-key` Header |
| Gemini / Anthropic / OpenAI / OpenRouter | diverse | LLM-Fallback-Chain für Deutungs- und HTML-Generierung | API Keys |
| PDFShift | `pdfshift` | HTML → PDF Konvertierung | Basic Auth |
| superglue Email | `superglue-email` | Transaktionale E-Mails | Bearer Token |

### 2.2 Supabase Datenbankschema

```
auth.users
|
+-- profiles
+-- astro_profiles
+-- user_signature_state
+-- agent_conversations
+-- daily_horoscope_cache
+-- space_weather_cache
+-- vibes_cache
+-- weekly_insights_cache
+-- quiz_sessions
+-- entitlements
+-- user_reports
```

#### user_signature_state — Schlüsselspalten

| Spalte | Typ | Inhalt |
|---|---|---|
| `user_id` | UUID PK | Referenz auf auth.users |
| `signature_blueprint_json` | JSONB NOT NULL | Kompletter SignatureBlueprint aus FuFire |
| `soulprint_sectors` | FLOAT[] | 12-Element BaZi-abgeleiteter Natal-Vektor |
| `quiz_sectors` | FLOAT[] | Quiz-abgeleiteter 12-Sektor-Kalibrierungsvektor |
| `quiz_version` | INT | Zähler, steigt bei jedem Quiz-Eingang |
| `kohaerenz_index` | FLOAT | Aktueller Kohärenzindex (0–1) |
| `kohaerenz_raw` | FLOAT | Rohwert vor Membran-Modulation |
| `kohaerenz_layers` | JSONB | Layer-Aufschlüsselung (natal/transit/quiz/membrane) |
| `kohaerenz_computed_at` | TIMESTAMPTZ | Letzter Berechnungszeitpunkt |

#### space_weather_cache — Schema

```sql
CREATE TABLE space_weather_cache (
  cache_key     TEXT NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  source        TEXT NOT NULL DEFAULT 'DONKI',
  payload_json  JSONB NOT NULL,
  PRIMARY KEY (cache_key, fetched_at)
);
```

---

## 3. Der Kohärenzindex

### 3.1 Definition

Der **Kohärenzindex** (intern früher: HarmonieIndex) ist der zentrale Orientierungswert der Plattform.

```
Kohärenzindex ist NICHT:  "Wer bist du?"
Kohärenzindex IST:        "Wie stark resoniert deine Struktur gerade?"
```

### 3.2 Schichtenmodell

| Layer | Quelle | Bedeutung | Dauer | Gewicht |
|---|---|---|---|---|
| **Natal Core** | FuFire `/v1/experience/bootstrap` | Wer du strukturell bist | Dauerhaft | 1.0 |
| **Transit Layer** | FuFire `/v1/transit/state` | Welche Strukturen heute resonieren | Stunden bis Tage | alpha = 0.40 |
| **Quiz Calibration** | ContributionEvents -> quiz_sectors | Wie fein das Profil kalibriert ist | Tage bis Monate | beta = 0.20 |
| **Membrane Layer** | NASA DONKI (Kp, FLR, CME) | Wie stark die Resonanz spürbar wird | Minuten bis Tage | gamma = 0.15 (Multiplikator) |

### 3.3 Berechnungsformel

```
quiz_effective  = sum( min(quiz_sectors[i], 0.5 * soulprint_sectors[i]) ) / sum(soulprint_sectors)
kohaerenz_raw   = natal_harmony_index * 1.0 + transit_intensity * 0.40 + quiz_effective * 0.20
kohaerenz_index = clamp( kohaerenz_raw * (1 + 0.15 * membrane_gain), 0, 1 )
```

### 3.4 Membrane Gain

```
kp_norm       = max(allKpIndex[].kpIndex) / 9
flare_score   = X->1.0 | M->0.6 | C->0.3 | B->0.1 | keine->0.0
earth_cme     = isEarthGB ? 1.0 : 0.0
membrane_gain = clamp( 0.4*kp_norm + 0.4*flare_score + 0.2*earth_cme, 0, 1 )
```

### 3.5 Semantische Trennung der Layer

```
Natal    -> Basiswert (Identitätskern, stabil)
Transit  -> addiert mit alpha (semantischer Modulator)
Quiz     -> addiert mit beta, clamped (reflexive Kalibrierung)
Membrane -> multipliziert mit gamma (Amplitudenmultiplikator, nicht identitär)
```

---

## 4. Quiz-System und Contribution Events

### 4.1 Quiz-Cluster

| Cluster | Quizze | Significance |
|---|---|---|
| Naturkind | Aura Colors, Krafttier, Blumenwesen, Energiestein | 0.7 |
| Mentalist | Love Languages, Charme, EQ, (4.) | 0.8 |
| Stratege | Personality, Career DNA, Social Role, Spotlight | 0.75 |
| Mystiker | Destiny, RPG Identity, Party Need, Celebrity Soulmate | 0.85 |
| Kinky | Kinky 01-04 | 0.9 |
| Partner Match | Partner Match 01-03, Conversation Analysis | 1.0 |

**Gate-Mechanik:** Erst wenn alle 4 Quizze eines Clusters abgeschlossen sind, werden die Events konvertiert und persistiert.

### 4.2 Einfluss-Pfad

```
User -> scoreQuiz() -> *ToEvent() -> ContributionEvent
     -> Cluster-Gate (alle 4?) -> AFFINITY_MAP
     -> POST /api/contribute -> buildMasterSignal()
     -> quiz_sectors update -> bazodiac-kohaerenz-index
```

### 4.3 Quiz-Constraints

```
quiz_calibration <= 0.50 * natal_core
quiz_coverage = min(1, abgeschlossene_cluster / 6)
```

---

## 5. FuFire API — Schlüssel-Endpoints

Base URL: `https://bafe-production.up.railway.app`
Auth: `X-API-Key: ff_enterprise_...`

| Endpoint | Methode | Key Output |
|---|---|---|
| `/v1/experience/bootstrap` | POST | `profile.harmony_index`, `soulprint_sectors` |
| `/v1/transit/state` | POST | `transit_contribution.transit_intensity` |
| `/v1/transit/now` | GET | Aktuelle Planetenpositionen |
| `/v1/transit/timeline` | GET | Multi-Tage Forecast |
| `/v1/calculate/fusion` | POST | `harmony_index`, `wu_xing_vectors` |
| `/v1/calculate/bazi` | POST | Pfeiler, Day Master |
| `/v1/calculate/western` | POST | Planetenpositionen, Häuser |
| `/v1/experience/signature-delta` | POST | Signatur-Delta |

---

## 6. superglue Tools — Pipeline

| Tool ID | Trigger | Inputs | Outputs |
|---|---|---|---|
| `bazodiac-cosmic-weather` | Cron (alle 15 Min) | — | membrane_gain -> space_weather_cache |
| `bazodiac-daily-transit` | Cron (täglich) | user_id | Transit-Report -> daily_horoscope_cache |
| `bazodiac-kohaerenz-index` | Nach transit + nach Quiz | user_id | Kohärenzindex -> user_signature_state |
| `bazodiac-elevenlabs-context` | ElevenLabs Webhook Session-Start | user_id | Astro-Kontext-JSON |
| `bazodiac-save-conversation` | ElevenLabs Webhook Session-Ende | user_id, summary, topics, agent_type | -> agent_conversations |
| `bazodiac-save-conversation-eve` | ElevenLabs Webhook Eve-Ende | user_id, summary, topics | agent_type: eve |
| `bazodiac-save-conversation-levi` | ElevenLabs Webhook Levi-Ende | user_id, summary, topics | agent_type: levi |
| `bazodiac-generate-deep-reading` | ElevenLabs Webhook Session-Ende >15 Min | conversation_id, user_id | PDF -> Storage -> E-Mail |

### 6.1 bazodiac-cosmic-weather

Steps: fetchGST -> fetchFLR -> fetchCME -> computeMembraneGain -> writeSpaceWeatherCache

```json
{ "membrane_gain": 0.0, "kp_max": 0, "flare_max_score": 0.0, "earth_directed_cme": false }
```

### 6.2 bazodiac-daily-transit

Steps: fetchAstroProfile -> fetchTransitNow -> buildTransitReport -> upsertDailyCache

### 6.3 bazodiac-kohaerenz-index

Steps: fetchAstroProfile -> fetchSignatureState -> fetchTransitCache -> fetchSpaceWeather -> computeKohaerenzIndex -> prepareUpsertBody -> upsertSignatureState

```json
{
  "kohaerenz_index": 0.6094,
  "kohaerenz_raw": 0.6094,
  "layers": {
    "natal":    { "harmony_index": 0.6094, "weight": 1.0 },
    "transit":  { "intensity": 0.07, "alpha": 0.40 },
    "quiz":     { "effective": 0.0, "beta": 0.20 },
    "membrane": { "gain": 0.0, "gamma": 0.15 }
  }
}
```

### 6.4 bazodiac-elevenlabs-context

Steps: fetchProfile -> fetchAstroProfile -> fetchPastConversations -> buildContext

### 6.5 bazodiac-generate-deep-reading

Steps: fetchConversation -> fetchAstroProfile -> fetchUserProfile -> checkEligibility -> generateDeutung (Gemini/Claude/GPT/OpenRouter) -> generateHTML -> pickDeutung/HTML -> convertToPDF -> uploadToStorage -> prepareReportData -> saveReportUrl -> sendEmail

---

## 7. Trigger-Kette

### Täglich (UTC)

```
06:00  bazodiac-cosmic-weather     (global)
06:05  bazodiac-daily-transit      (pro User)
06:10  bazodiac-kohaerenz-index    (pro User)
```

### Event-basiert

```
Quiz-Cluster abgeschlossen  -> bazodiac-kohaerenz-index
ElevenLabs Session-Start    -> bazodiac-elevenlabs-context
ElevenLabs Session-Ende     -> bazodiac-save-conversation-eve/levi
                            -> bazodiac-generate-deep-reading (wenn >15 Min)
```

---

## 8. Datenfluss

```
NASA DONKI -----------------------> space_weather_cache (membrane_gain)
FuFire bootstrap -----------------> astro_profiles (harmony_index, soulprint_sectors)
FuFire transit/state -------------> daily_horoscope_cache (transit_intensity)
Quiz ContributionEvents ----------> user_signature_state (quiz_sectors)

alle vier -----------------------> bazodiac-kohaerenz-index
                                        |
                                        v
                               user_signature_state
                               kohaerenz_index (0-1)
                                        |
                                        v
                               Frontend: Kohärenzindex immer präsent
```

---

## 9. Konfigurationsparameter

| Parameter | Wert | Beschreibung |
|---|---|---|
| `natal_weight` | 1.0 | Natal Core Referenzgewicht |
| `transit_alpha` | 0.40 | Transit-Anteil |
| `quiz_beta` | 0.20 | Quiz-Anteil |
| `membrane_gamma` | 0.15 | Membran-Multiplikator |
| `quiz_clamp` | 0.50 | Max. Abweichung quiz von soulprint |
| `kp_normalization` | kp/9 | Kp-Skala 0-9 auf 0-1 |
| `space_weather_ttl` | 15 Min | Cache-TTL |
| `transit_window` | 2 Tage | DONKI Lookback |
| `max_quiz_clusters` | 6 | Gesamtzahl Cluster |

---

## 10. Migrations-Log

| Migration | Datum | Inhalt |
|---|---|---|
| `20260316_experience_tables.sql` | 2026-03-16 | user_signature_state, daily_horoscope_cache |
| `20260321_first_time_experience.sql` | 2026-03-21 | First-Time-Experience Flags |
| `20260324_dissonance_state.sql` | 2026-03-24 | Dissonanz-State |
| `20260327_multi_agent_voice.sql` | 2026-03-27 | Multi-Agent Voice Support |
| `20260330_vibes_cache.sql` | 2026-03-30 | vibes_cache |
| `20260330_weekly_insights_cache.sql` | 2026-03-30 | weekly_insights_cache |
| space_weather_cache (manuell) | 2026-04-08 | Neue Tabelle Space-Weather-Cache |
| user_signature_state Erweiterung | 2026-04-08 | kohaerenz_index, kohaerenz_raw, kohaerenz_layers, kohaerenz_computed_at |

---

*Dokumentation generiert via superglue Agent — Bazodiac Engineering*
