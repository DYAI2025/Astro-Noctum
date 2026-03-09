# 八字 | BA ZI KERNMATHEMATIK & WEST-OST-FUSIONSFRAMEWORK

**Version:** 1.0  
**Stand:** Dezember 2025  
**Architektur:** Deterministisch, reproduzierbar, integrationsfähig

---

## TEIL I: MATHEMATISCHE FUNDAMENTE DER BA ZI BERECHNUNG

### 1. Systemübersicht: Die Vier Säulen (四柱 Sì Zhù)

Ba Zi („Acht Zeichen") berechnet aus einem Geburtszeitpunkt vier **Säulen** (Pillars), jede bestehend aus:
- **Himmelsstamm** (天干 Tiān Gān) – 10 Varianten
- **Erdzweig** (地支 Dì Zhī) – 12 Varianten

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BA ZI CHART STRUKTUR                              │
├──────────────┬──────────────┬──────────────┬──────────────────────────────┤
│  JAHR-SÄULE  │ MONAT-SÄULE  │  TAG-SÄULE   │        STUNDEN-SÄULE        │
│   年柱        │   月柱        │   日柱        │           時柱              │
├──────────────┼──────────────┼──────────────┼──────────────────────────────┤
│  Himmelsstamm│  Himmelsstamm│  Himmelsstamm│        Himmelsstamm         │
│   (年干)      │   (月干)      │   (日干)      │           (時干)            │
├──────────────┼──────────────┼──────────────┼──────────────────────────────┤
│   Erdzweig   │   Erdzweig   │   Erdzweig   │          Erdzweig           │
│   (年支)      │   (月支)      │   (日支)      │           (時支)            │
└──────────────┴──────────────┴──────────────┴──────────────────────────────┘
```

### 2. Der 60-Jahre-Zyklus (六十甲子 Jiǎ Zǐ)

**Fundamentales Prinzip:** Die Kombination von 10 Stämmen und 12 Zweigen ergibt durch das kleinste gemeinsame Vielfache einen 60er-Zyklus:

```
LCM(10, 12) = 60

Mathematische Darstellung als Restklassenring:
Z₆₀ ≅ Z₁₀ × Z₁₂ (via Chinesischer Restsatz)
```

#### 2.1 Himmelsstämme (天干) – Modulare Gruppe Z₁₀

| Index | Name | Pinyin | Element | Polarität | Nummer |
|-------|------|--------|---------|-----------|--------|
| 0 | 甲 | Jiǎ | Holz | Yang | 1 |
| 1 | 乙 | Yǐ | Holz | Yin | 2 |
| 2 | 丙 | Bǐng | Feuer | Yang | 3 |
| 3 | 丁 | Dīng | Feuer | Yin | 4 |
| 4 | 戊 | Wù | Erde | Yang | 5 |
| 5 | 己 | Jǐ | Erde | Yin | 6 |
| 6 | 庚 | Gēng | Metall | Yang | 7 |
| 7 | 辛 | Xīn | Metall | Yin | 8 |
| 8 | 壬 | Rén | Wasser | Yang | 9 |
| 9 | 癸 | Guǐ | Wasser | Yin | 10 |

**Mathematische Ableitung des Elements:**
```
element_index = floor(stem_index / 2)
polarity = stem_index mod 2  // 0 = Yang, 1 = Yin
```

#### 2.2 Erdzweige (地支) – Modulare Gruppe Z₁₂

| Index | Name | Pinyin | Tier | Fix. Element | Polarität |
|-------|------|--------|------|--------------|-----------|
| 0 | 子 | Zǐ | Ratte | Wasser | Yang |
| 1 | 丑 | Chǒu | Büffel | Erde | Yin |
| 2 | 寅 | Yín | Tiger | Holz | Yang |
| 3 | 卯 | Mǎo | Hase | Holz | Yin |
| 4 | 辰 | Chén | Drache | Erde | Yang |
| 5 | 巳 | Sì | Schlange | Feuer | Yin |
| 6 | 午 | Wǔ | Pferd | Feuer | Yang |
| 7 | 未 | Wèi | Ziege | Erde | Yin |
| 8 | 申 | Shēn | Affe | Metall | Yang |
| 9 | 酉 | Yǒu | Hahn | Metall | Yin |
| 10 | 戌 | Xū | Hund | Erde | Yang |
| 11 | 亥 | Hài | Schwein | Wasser | Yin |

**Fixiertes Element pro Erdzweig (Lookup-Tabelle):**
```javascript
const BRANCH_FIXED_ELEMENTS = [
  'Water',  // 0: Zi (Ratte)
  'Earth',  // 1: Chou (Büffel)
  'Wood',   // 2: Yin (Tiger)
  'Wood',   // 3: Mao (Hase)
  'Earth',  // 4: Chen (Drache)
  'Fire',   // 5: Si (Schlange)
  'Fire',   // 6: Wu (Pferd)
  'Earth',  // 7: Wei (Ziege)
  'Metal',  // 8: Shen (Affe)
  'Metal',  // 9: You (Hahn)
  'Earth',  // 10: Xu (Hund)
  'Water'   // 11: Hai (Schwein)
];
```

---

### 3. SÄULENBERECHNUNGEN – KERNALGORITHMEN

#### 3.1 JAHRESSÄULE (年柱)

**Kritisches Konzept:** Das chinesisch-astrologische Jahr beginnt **NICHT** am 1. Januar, sondern beim Solarterm **Li Chun (立春)** – ca. 4. Februar.

**Mathematische Definition:**
```
Li Chun = Zeitpunkt, wenn Sonnenlänge λ☉ = 315°

Wenn Geburt VOR Li Chun im gregorianischen Jahr Y:
    → Verwende Jahr (Y - 1) für Berechnung
```

**Sexagenary-Index des Jahres:**
```
// Referenzpunkt: 1984 = Jiǎ Zǐ (Index 0)
year_index_60 = (year - 1984) mod 60

// Falls negativ (vor 1984):
year_index_60 = ((year - 1984) mod 60 + 60) mod 60

stem_index  = year_index_60 mod 10
branch_index = year_index_60 mod 12
```

**Implementierung:**
```javascript
function yearPillar(year, birthJD_UTC, lichunJD_UTC) {
  // Korrektur für Li Chun
  const effectiveYear = (birthJD_UTC < lichunJD_UTC) ? year - 1 : year;
  
  const idx60 = ((effectiveYear - 1984) % 60 + 60) % 60;
  const stemIdx = idx60 % 10;
  const branchIdx = idx60 % 12;
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemIndex: stemIdx,
    branchIndex: branchIdx
  };
}
```

#### 3.2 MONATSSÄULE (月柱) – Solare Monate

**Prinzip:** Die Monatssäule basiert auf **Solar-Monaten**, die durch die Position der Sonne definiert werden – alle 30° der ekliptikalen Länge.

**Jieqi (節氣) Solar-Term-Grenzen:**

| Monat | Erdzweig | Start-λ☉ | Term-Name | Approx. Datum |
|-------|----------|----------|-----------|---------------|
| 1 | 寅 Yín | 315° | Li Chun 立春 | ~4. Feb |
| 2 | 卯 Mǎo | 345° | Jing Zhe 驚蟄 | ~6. März |
| 3 | 辰 Chén | 15° | Qing Ming 清明 | ~5. April |
| 4 | 巳 Sì | 45° | Li Xia 立夏 | ~6. Mai |
| 5 | 午 Wǔ | 75° | Mang Zhong 芒種 | ~6. Juni |
| 6 | 未 Wèi | 105° | Xiao Shu 小暑 | ~7. Juli |
| 7 | 申 Shēn | 135° | Li Qiu 立秋 | ~8. Aug |
| 8 | 酉 Yǒu | 165° | Bai Lu 白露 | ~8. Sep |
| 9 | 戌 Xū | 195° | Han Lu 寒露 | ~8. Okt |
| 10 | 亥 Hài | 225° | Li Dong 立冬 | ~7. Nov |
| 11 | 子 Zǐ | 255° | Da Xue 大雪 | ~7. Dez |
| 12 | 丑 Chǒu | 285° | Xiao Han 小寒 | ~6. Jan |

**Monat aus Sonnenlänge:**
```javascript
function solarMonthFromSunLongitude(sunLonDeg) {
  // Normalisiere auf [0, 360)
  const lon = ((sunLonDeg % 360) + 360) % 360;
  
  // Solar-Monatsgrenzen: 315°, 345°, 15°, 45°, ...
  // Monat i beginnt bei λ☉ = (285 + 30*i) mod 360
  
  for (let i = 0; i < 12; i++) {
    const startLon = (315 + 30 * i) % 360;
    const endLon = (315 + 30 * (i + 1)) % 360;
    
    // Behandle Wrap-around bei 360°/0°
    if (startLon > endLon) {
      if (lon >= startLon || lon < endLon) return i;
    } else {
      if (lon >= startLon && lon < endLon) return i;
    }
  }
  return 0; // Fallback
}
```

**Fünf-Tiger-Formel (五虎遁 Wǔ Hǔ Dùn) für Monatsstamm:**

Der Monatsstamm wird **deterministisch** aus dem Jahresstamm abgeleitet:

```
Regel: Der erste Monat (Yin 寅) erhält einen Stamm basierend auf dem Jahresstamm.

| Jahresstamm    | Yin-Monat Stamm | Formel                      |
|----------------|-----------------|-----------------------------| 
| Jia (甲) oder Ji (己)   | Bing (丙)       | (yearStemIdx % 5) * 2 + 2   |
| Yi (乙) oder Geng (庚)  | Wu (戊)         |                             |
| Bing (丙) oder Xin (辛) | Geng (庚)       |                             |
| Ding (丁) oder Ren (壬) | Ren (壬)        |                             |
| Wu (戊) oder Gui (癸)   | Jia (甲)        |                             |
```

**Implementierung:**
```javascript
function monthPillar(sunLonDeg, yearStemIndex) {
  const monthIdx = solarMonthFromSunLongitude(sunLonDeg);
  
  // Monatszweig: Index 2 (Yin) + monthIdx
  const branchIdx = (2 + monthIdx) % 12;
  
  // Fünf-Tiger-Formel für Stamm
  const tigerStarts = [2, 4, 6, 8, 0]; // Bing, Wu, Geng, Ren, Jia
  const baseStamIdx = tigerStarts[yearStemIndex % 5];
  const stemIdx = (baseStamIdx + monthIdx) % 10;
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    monthIndexFromTiger: monthIdx
  };
}
```

#### 3.3 TAGESSÄULE (日柱) – Julianisches Datum

**Prinzip:** Die Tagessäule folgt einem kontinuierlichen 60-Tage-Zyklus, berechenbar aus dem Julian Day Number (JDN).

**Formel:**
```
day_index_60 = (JDN + 49) mod 60

Wobei JDN = Julianische Tagesnummer (ganzzahlig, wechselt um Mitternacht UT)
```

**Herleitung des Offsets:**
- Referenz: 1. Januar 4713 v. Chr. (JDN = 0) war ein Jiǎ Zǐ Tag? Nein.
- Kalibrierung: JDN 0 entspricht einem bestimmten Ganzhi
- Empirisch verifiziert: Offset = 49 ergibt korrekte Werte

```javascript
function dayPillar(JD_UTC) {
  // JDN wechselt um Mitternacht
  const jdn = Math.floor(JD_UTC + 0.5);
  
  const idx60 = ((jdn + 49) % 60 + 60) % 60;
  const stemIdx = idx60 % 10;
  const branchIdx = idx60 % 12;
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    sexagenaryIndex: idx60
  };
}
```

#### 3.4 STUNDENSÄULE (時柱) – Wahre Sonnenzeit

**Kritisches Konzept:** Die Stundensäule basiert auf **Wahrer Sonnenzeit (True Solar Time, TST)**, nicht auf Zonenzeit!

**Die 12 Doppelstunden (時辰 Shíchen):**

| Erdzweig | Name | TST-Bereich | Mitte |
|----------|------|-------------|-------|
| 子 Zǐ | Ratte | 23:00–01:00 | 00:00 |
| 丑 Chǒu | Büffel | 01:00–03:00 | 02:00 |
| 寅 Yín | Tiger | 03:00–05:00 | 04:00 |
| 卯 Mǎo | Hase | 05:00–07:00 | 06:00 |
| 辰 Chén | Drache | 07:00–09:00 | 08:00 |
| 巳 Sì | Schlange | 09:00–11:00 | 10:00 |
| 午 Wǔ | Pferd | 11:00–13:00 | 12:00 |
| 未 Wèi | Ziege | 13:00–15:00 | 14:00 |
| 申 Shēn | Affe | 15:00–17:00 | 16:00 |
| 酉 Yǒu | Hahn | 17:00–19:00 | 18:00 |
| 戌 Xū | Hund | 19:00–21:00 | 20:00 |
| 亥 Hài | Schwein | 21:00–23:00 | 22:00 |

**Berechnung der Wahren Sonnenzeit:**
```
TST = Zonenzeit + 4×(λ - λ_ref) + EoT

Wobei:
- λ = Geographische Länge (°E positiv)
- λ_ref = Referenzmeridian der Zeitzone (z.B. 15° für CET)
- EoT = Zeitgleichung (Equation of Time) in Minuten
```

**Zeitgleichung (Equation of Time):**
```javascript
function equationOfTimeMinutes(dayOfYear, hour) {
  // NOAA-Approximation
  const gamma = 2 * Math.PI / 365 * (dayOfYear - 1 + (hour - 12) / 24);
  
  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );
}
```

**Fünf-Ratten-Formel (五鼠遁 Wǔ Shǔ Dùn) für Stundenstamm:**

```
| Tagesstamm              | Zi-Stunde Stamm |
|-------------------------|-----------------|
| Jia (甲) oder Ji (己)   | Jia (甲)        |
| Yi (乙) oder Geng (庚)  | Bing (丙)       |
| Bing (丙) oder Xin (辛) | Wu (戊)         |
| Ding (丁) oder Ren (壬) | Geng (庚)       |
| Wu (戊) oder Gui (癸)   | Ren (壬)        |
```

```javascript
function hourPillar(tstMinutes, dayStemIndex) {
  // Bestimme Doppelstunde (0-11, beginnend mit Zi um 23:00)
  // TST 23:00-00:59 = Zi, 01:00-02:59 = Chou, etc.
  
  let hourIdx;
  if (tstMinutes >= 23 * 60 || tstMinutes < 1 * 60) {
    hourIdx = 0; // Zi
  } else {
    hourIdx = Math.floor((tstMinutes + 60) / 120);
  }
  
  // Zi-Stunde Grenze überschreitet Mitternacht:
  // TST 23:00+ gehört zum NÄCHSTEN Tag für Ganzhi!
  const isEarlyZi = (tstMinutes >= 23 * 60);
  
  const branchIdx = hourIdx;
  
  // Fünf-Ratten-Formel
  const ratStarts = [0, 2, 4, 6, 8]; // Jia, Bing, Wu, Geng, Ren
  const baseStemIdx = ratStarts[dayStemIndex % 5];
  const stemIdx = (baseStemIdx + hourIdx) % 10;
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    isEarlyZi: isEarlyZi,
    tstMinutes: tstMinutes
  };
}
```

---

### 4. WU XING (五行) – FÜNF WANDLUNGSPHASEN MATHEMATIK

#### 4.1 Zyklische Relationen als Graphenstruktur

**Hervorbringungszyklus (生 Shēng) – Produktiver Zyklus:**
```
G_sheng = (V, E) mit V = {Holz, Feuer, Erde, Metall, Wasser}

E = {
  (Holz → Feuer),    // Holz nährt Feuer
  (Feuer → Erde),    // Feuer erzeugt Asche/Erde
  (Erde → Metall),   // Erde birgt Erze
  (Metall → Wasser), // Metall kondensiert Wasser
  (Wasser → Holz)    // Wasser nährt Pflanzen
}
```

**Kontrollzyklus (克 Kè) – Restriktiver Zyklus:**
```
G_ke = (V, E) mit gleichen Knoten

E = {
  (Holz → Erde),     // Wurzeln durchdringen Erde
  (Erde → Wasser),   // Erde dämmt Wasser
  (Wasser → Feuer),  // Wasser löscht Feuer
  (Feuer → Metall),  // Feuer schmilzt Metall
  (Metall → Holz)    // Metall schneidet Holz
}
```

#### 4.2 Algebraische Repräsentation

```javascript
const WU_XING = {
  ELEMENTS: ['Wood', 'Fire', 'Earth', 'Metal', 'Water'],
  
  // Adjazenzmatrix für Sheng-Zyklus
  SHENG_MATRIX: [
    // W  F  E  M  Wa  (to)
    [0, 1, 0, 0, 0],  // Wood produces Fire
    [0, 0, 1, 0, 0],  // Fire produces Earth
    [0, 0, 0, 1, 0],  // Earth produces Metal
    [0, 0, 0, 0, 1],  // Metal produces Water
    [1, 0, 0, 0, 0]   // Water produces Wood
  ],
  
  // Adjazenzmatrix für Ke-Zyklus
  KE_MATRIX: [
    // W  F  E  M  Wa  (controls)
    [0, 0, 1, 0, 0],  // Wood controls Earth
    [0, 0, 0, 1, 0],  // Fire controls Metal
    [0, 0, 0, 0, 1],  // Earth controls Water
    [1, 0, 0, 0, 0],  // Metal controls Wood
    [0, 1, 0, 0, 0]   // Water controls Fire
  ],
  
  // Funktionale Beziehungen
  produces: (element) => WU_XING.ELEMENTS[(WU_XING.ELEMENTS.indexOf(element) + 1) % 5],
  producedBy: (element) => WU_XING.ELEMENTS[(WU_XING.ELEMENTS.indexOf(element) + 4) % 5],
  controls: (element) => WU_XING.ELEMENTS[(WU_XING.ELEMENTS.indexOf(element) + 2) % 5],
  controlledBy: (element) => WU_XING.ELEMENTS[(WU_XING.ELEMENTS.indexOf(element) + 3) % 5]
};
```

#### 4.3 Element-Vektor-Quantifizierung

**Ein Ba Zi Chart als 5-dimensionaler Vektor:**
```
S = [s_Holz, s_Feuer, s_Erde, s_Metall, s_Wasser]

Wobei s_i = Summe der Element-Gewichte aus allen 8 Zeichen
```

**Gewichtungsschema:**
```javascript
function calculateElementVector(baziChart) {
  const weights = {
    yearStem: 1.0,
    yearBranch: 1.0,
    monthStem: 1.5,    // Monat = stärkster Einfluss auf Season
    monthBranch: 1.5,
    dayStem: 2.0,      // Tages-Stamm = "Day Master" / Identitätskern
    dayBranch: 1.0,
    hourStem: 0.8,
    hourBranch: 0.8
  };
  
  const vector = [0, 0, 0, 0, 0]; // [Wood, Fire, Earth, Metal, Water]
  
  // Stämme → direktes Element
  const stemElements = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // Index → Element-Index
  
  vector[stemElements[baziChart.year.stemIndex]] += weights.yearStem;
  vector[stemElements[baziChart.month.stemIndex]] += weights.monthStem;
  vector[stemElements[baziChart.day.stemIndex]] += weights.dayStem;
  vector[stemElements[baziChart.hour.stemIndex]] += weights.hourStem;
  
  // Zweige → fixierte Elemente (siehe Lookup oben)
  const branchElements = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  
  vector[branchElements[baziChart.year.branchIndex]] += weights.yearBranch;
  vector[branchElements[baziChart.month.branchIndex]] += weights.monthBranch;
  vector[branchElements[baziChart.day.branchIndex]] += weights.dayBranch;
  vector[branchElements[baziChart.hour.branchIndex]] += weights.hourBranch;
  
  return vector;
}
```

**Normalisierung:**
```javascript
function normalizeElementVector(vector) {
  const sum = vector.reduce((a, b) => a + b, 0);
  return vector.map(v => v / sum);
}
```

---

### 5. KOMPATIBILITÄTS-MATHEMATIK

#### 5.1 San He (三合) – Dreiecksharmonien

Drei Erdzweige im 120°-Abstand bilden eine harmonische Triade:

```
SAN_HE_TRIADS = {
  'Water': [0, 4, 8],   // Zi-Chen-Shen (Ratte-Drache-Affe)
  'Metal': [1, 5, 9],   // Chou-Si-You (Büffel-Schlange-Hahn)
  'Fire':  [2, 6, 10],  // Yin-Wu-Xu (Tiger-Pferd-Hund)
  'Wood':  [3, 7, 11]   // Mao-Wei-Hai (Hase-Ziege-Schwein)
}

Mathematisch: branch_indices ≡ {n, n+4, n+8} (mod 12)
```

#### 5.2 Liu He (六合) – Sechs Harmonien

Sechs Paare von Erdzweigen mit besonderer Affinität:

```
LIU_HE_PAIRS = [
  [0, 1],   // Zi-Chou
  [2, 11],  // Yin-Hai
  [3, 10],  // Mao-Xu
  [4, 9],   // Chen-You
  [5, 8],   // Si-Shen
  [6, 7]    // Wu-Wei
]
```

#### 5.3 Liu Chong (六沖) – Sechs Konflikte

Opposition im 180°-Abstand (6 Positionen auseinander):

```
LIU_CHONG = [
  [0, 6],   // Zi-Wu (Ratte-Pferd)
  [1, 7],   // Chou-Wei (Büffel-Ziege)
  [2, 8],   // Yin-Shen (Tiger-Affe)
  [3, 9],   // Mao-You (Hase-Hahn)
  [4, 10],  // Chen-Xu (Drache-Hund)
  [5, 11]   // Si-Hai (Schlange-Schwein)
]

Formel: clash(b1, b2) = (|b1 - b2| === 6)
```

---

## TEIL II: ANSCHLUSSPUNKTE (ENDPOINTS) ZUR WESTLICHEN ASTROLOGIE

### 6. Gemeinsame Grundlage: ZEIT als universelle Variable

**Die fundamentale Brücke zwischen beiden Systemen ist das Julianische Datum (JD):**

```
                    ┌─────────────────┐
                    │   ZEITPUNKT T   │
                    │   (Geburt)      │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  WESTLICH        │        │  ÖSTLICH         │
    │                  │        │                  │
    │  JD → λ☉, λ☽    │        │  JD → Jia Zi     │
    │  JD → GMST       │        │  JD → Solar Term │
    │  JD → ASC/MC     │        │  λ☉ → Monat      │
    └──────────────────┘        └──────────────────┘
```

### 7. Konversionstabelle: Zeit-Transformationen

| Operation | Westlich | Östlich | Gemeinsame Basis |
|-----------|----------|---------|------------------|
| **Zeitstandard** | UT1, TT | Lokale Sonnenzeit | JD_UTC + ΔT |
| **Primäre Zeiteinheit** | Sekunde (kontinuierlich) | Doppelstunde (diskret) | Tagesfraktion |
| **Jahresbeginn** | 1. Januar / Frühlingspunkt | Li Chun (λ☉ = 315°) | Sonnenlänge |
| **Monatsdefinition** | Synodisch / Tropisch | Solar Term (30° Sonne) | λ☉ |

### 8. ENDPOINT 1: Sonnenlänge (λ☉)

**Die Sonnenlänge ist der primäre Brückenwert:**

```
Westlich: λ☉ → Sonnenzeichen (12 × 30°)
Östlich:  λ☉ → Solar-Monat (12 × 30°, versetzt um ~315°)
```

**Mathematische Transformation:**
```javascript
// Westliches Sonnenzeichen (Tropischer Zodiak)
function westernSunSign(sunLonDeg) {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 
                 'Leo', 'Virgo', 'Libra', 'Scorpio',
                 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(sunLonDeg / 30) % 12];
}

// Östlicher Solar-Monat (für Ba Zi)
function easternSolarMonth(sunLonDeg) {
  // Offset: Yin-Monat beginnt bei 315°
  const adjustedLon = (sunLonDeg - 315 + 360) % 360;
  return Math.floor(adjustedLon / 30);
}
```

### 9. ENDPOINT 2: Lokale Sternzeit (LST) → Aszendent

**Westlich:** LST bestimmt den Aszendenten
**Östlich:** Wahre Sonnenzeit bestimmt die Stundensäule

```
Gemeinsame Berechnung:
LST = GMST + λ_geo / 15

GMST = 18.697374558 + 24.06570982441908 × D

D = (JD - 2451545.0) Tage seit J2000.0
```

**Die Verbindung:**
```javascript
// Beide verwenden den gleichen Geolocation-Input
// und zeitkorrelierte Berechnungen

function calculateAscendantAndHourPillar(input) {
  const { JD_UTC, latDeg, lonDeg, tzOffset } = input;
  
  // GMST → LST
  const gmst = 18.697374558 + 24.06570982441908 * (JD_UTC - 2451545.0);
  const lst = (gmst + lonDeg / 15) % 24;
  
  // WESTLICH: Aszendent
  const lstDeg = lst * 15;
  const eps = 23.4393; // Ekliptikschiefe
  const tanAsc = Math.cos(lstDeg * DEG2RAD) / 
                 (-Math.sin(lstDeg * DEG2RAD) * Math.cos(eps * DEG2RAD) - 
                  Math.tan(latDeg * DEG2RAD) * Math.sin(eps * DEG2RAD));
  const ascendant = normalizeDeg(Math.atan(tanAsc) * RAD2DEG);
  
  // ÖSTLICH: Wahre Sonnenzeit für Stundensäule
  const eot = equationOfTimeMinutes(JD_UTC);
  const localMinutes = /* lokale Zeit in Minuten */;
  const tst = (localMinutes + eot + 4 * lonDeg) % 1440;
  
  return { ascendant, trueSolarTimeMinutes: tst };
}
```

### 10. ENDPOINT 3: Planetare Zuordnungen zu Wu Xing

**Strukturelle Korrespondenz-Matrix:**

| Wu Xing | Planet(en) West | Begründung |
|---------|-----------------|------------|
| **Holz 木** | Jupiter ♃ | Expansion, Wachstum, Optimismus |
| **Feuer 火** | Mars ♂, Sonne ☉ | Energie, Wille, Transformation |
| **Erde 土** | Saturn ♄ | Struktur, Begrenzung, Realität |
| **Metall 金** | Venus ♀ | Raffinement, Werte, Ästhetik |
| **Wasser 水** | Merkur ☿, Mond ☽ | Kommunikation, Emotion, Fluss |

**Quantifizierung für Fusionsanalyse:**
```javascript
const PLANET_WU_XING_WEIGHTS = {
  Sun:     { Fire: 1.0, Wood: 0.2 },
  Moon:    { Water: 1.0, Earth: 0.3 },
  Mercury: { Water: 0.6, Metal: 0.4 },
  Venus:   { Metal: 0.8, Earth: 0.2 },
  Mars:    { Fire: 1.0 },
  Jupiter: { Wood: 1.0, Fire: 0.2 },
  Saturn:  { Earth: 0.7, Metal: 0.3 }
};

function westernElementVector(planetPositions) {
  const vector = [0, 0, 0, 0, 0]; // [Wood, Fire, Earth, Metal, Water]
  
  for (const [planet, weights] of Object.entries(PLANET_WU_XING_WEIGHTS)) {
    const houseWeight = getHouseWeight(planetPositions[planet].house);
    const aspectBonus = getAspectBonus(planetPositions[planet].aspects);
    
    for (const [element, baseWeight] of Object.entries(weights)) {
      const idx = WU_XING.ELEMENTS.indexOf(element);
      vector[idx] += baseWeight * houseWeight * aspectBonus;
    }
  }
  
  return normalizeElementVector(vector);
}
```

### 11. ENDPOINT 4: Häuser-Säulen-Korrelation

**Strukturelle Entsprechungen:**

| Ba Zi Säule | Westliches Haus | Lebensbereich |
|-------------|-----------------|---------------|
| Jahr 年 | 9, 10, 11 | Gesellschaft, Karriere, Gemeinschaft |
| Monat 月 | 4, 6, 10 | Familie, Arbeit, öffentliches Ansehen |
| Tag 日 | 1, 7 | Selbst, Partnerschaft |
| Stunde 時 | 5, 8, 12 | Kreativität, Transformation, Unbewusstes |

---

## TEIL III: FUSIONSFRAMEWORK – KONZEPTIONELLE ARCHITEKTUR

### 12. Framework-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ASTRO-FUSION FRAMEWORK v1.0                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │  INPUT       │         │  CORE ENGINE │         │   OUTPUT     │        │
│  │              │         │              │         │              │        │
│  │ • DateTime   │────────▶│ • Time Conv. │────────▶│ • Unified    │        │
│  │ • Location   │         │ • West Calc  │         │   Profile    │        │
│  │ • Timezone   │         │ • East Calc  │         │ • Element    │        │
│  │              │         │ • Fusion     │         │   Vector     │        │
│  └──────────────┘         └──────────────┘         │ • Harmony    │        │
│                                   │                │   Index      │        │
│                                   │                └──────────────┘        │
│                                   ▼                                         │
│                           ┌──────────────┐                                  │
│                           │  VALIDATORS  │                                  │
│                           │              │                                  │
│                           │ • Sanity     │                                  │
│                           │ • Consistency│                                  │
│                           │ • Integrity  │                                  │
│                           └──────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13. Datenmodell

```typescript
// Unified Birth Input
interface BirthInput {
  datetime: {
    year: number;
    month: number;  // 1-12
    day: number;    // 1-31
    hour: number;   // 0-23
    minute: number; // 0-59
    second?: number;
  };
  location: {
    latitude: number;   // -90 to 90
    longitude: number;  // -180 to 180
    altitude?: number;  // meters
  };
  timezone: {
    iana?: string;      // e.g., "Europe/Berlin"
    offsetMinutes?: number;
  };
}

// Western Chart
interface WesternChart {
  sun: CelestialPosition;
  moon: CelestialPosition;
  ascendant: CelestialPosition;
  mc: CelestialPosition;
  planets: Record<string, CelestialPosition>;
  houses: HouseSystem;
  aspects: Aspect[];
}

interface CelestialPosition {
  longitude: number;    // 0-360
  sign: string;         // "Aries", "Taurus", etc.
  degree: number;       // 0-30 within sign
  house?: number;       // 1-12
  retrograde?: boolean;
}

// Ba Zi Chart
interface BaZiChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  dayMaster: {
    element: WuXingElement;
    polarity: 'Yang' | 'Yin';
  };
  chineseZodiacAnimal: string;
}

interface Pillar {
  stem: string;        // Jia, Yi, ...
  branch: string;      // Zi, Chou, ...
  stemIndex: number;   // 0-9
  branchIndex: number; // 0-11
  element: WuXingElement;
  polarity: 'Yang' | 'Yin';
}

// Fusion Output
interface FusionProfile {
  western: WesternChart;
  eastern: BaZiChart;
  
  // Fusions-Metriken
  elementVector: {
    combined: number[];     // [Wood, Fire, Earth, Metal, Water]
    western: number[];
    eastern: number[];
    dominantElement: WuXingElement;
    deficientElement: WuXingElement;
  };
  
  harmonyIndex: number;     // 0-1, Maß für innere Kohärenz
  tensionPoints: string[];  // Identifizierte Spannungen
  
  // Interpretations-Hinweise
  archetypes: {
    western: string;        // z.B. "Sun in Aries, Moon in Cancer"
    eastern: string;        // z.B. "Wood Dragon, Water Day Master"
    fusion: string;         // z.B. "The Diplomatic Pioneer"
  };
  
  meta: {
    calculatedAt: Date;
    modelVersion: string;
    sanityChecks: SanityResult[];
    valid: boolean;
  };
}
```

### 14. Core Engine – Algorithmus

```javascript
class AstroFusionEngine {
  
  /**
   * Haupteinstiegspunkt für Fusionsberechnung
   */
  calculate(input: BirthInput): FusionProfile {
    // 1. Zeit-Standardisierung
    const timeContext = this.standardizeTime(input);
    
    // 2. Westliche Berechnung
    const western = this.calculateWestern(timeContext);
    
    // 3. Östliche Berechnung
    const eastern = this.calculateEastern(timeContext);
    
    // 4. Fusion
    const fusion = this.fuseCharts(western, eastern);
    
    // 5. Validierung
    const validation = this.validate(western, eastern, fusion);
    
    return {
      western,
      eastern,
      ...fusion,
      meta: {
        calculatedAt: new Date(),
        modelVersion: '1.0.0',
        sanityChecks: validation.checks,
        valid: validation.valid
      }
    };
  }
  
  private standardizeTime(input: BirthInput): TimeContext {
    // Löse Timezone auf
    const tzOffsetMin = input.timezone.iana 
      ? this.resolveIanaOffset(input.timezone.iana, input.datetime)
      : input.timezone.offsetMinutes;
    
    // Berechne UTC DateTime
    const utcDate = this.toUTC(input.datetime, tzOffsetMin);
    
    // Julianisches Datum
    const JD_UTC = this.toJulianDate(utcDate);
    
    // DeltaT für TT
    const deltaT = this.calculateDeltaT(input.datetime.year);
    const JD_TT = JD_UTC + deltaT / 86400;
    
    return {
      local: input.datetime,
      utc: utcDate,
      JD_UTC,
      JD_TT,
      deltaT,
      tzOffsetMin,
      location: input.location
    };
  }
  
  private calculateWestern(ctx: TimeContext): WesternChart {
    // Sonnenlänge
    const sunLon = this.calculateSunLongitude(ctx.JD_TT);
    
    // Mondlänge
    const moonLon = this.calculateMoonLongitude(ctx.JD_TT);
    
    // Lokale Sternzeit
    const lst = this.calculateLST(ctx.JD_UTC, ctx.location.longitude);
    
    // Aszendent
    const asc = this.calculateAscendant(lst, ctx.location.latitude);
    
    // MC
    const mc = this.calculateMC(lst);
    
    // Häuser
    const houses = this.calculateHouses(asc, mc, ctx.location.latitude);
    
    // Weitere Planeten
    const planets = this.calculatePlanetPositions(ctx.JD_TT);
    
    // Aspekte
    const aspects = this.calculateAspects([sunLon, moonLon, ...Object.values(planets)]);
    
    return {
      sun: this.toCelestialPosition(sunLon),
      moon: this.toCelestialPosition(moonLon),
      ascendant: this.toCelestialPosition(asc),
      mc: this.toCelestialPosition(mc),
      planets,
      houses,
      aspects
    };
  }
  
  private calculateEastern(ctx: TimeContext): BaZiChart {
    // Li Chun für Jahr
    const lichunJD = this.findSolarLongitude(ctx.local.year, 315);
    
    // Jahressäule
    const year = this.calculateYearPillar(ctx.local.year, ctx.JD_UTC, lichunJD);
    
    // Sonnenlänge für Monat
    const sunLon = this.calculateSunLongitude(ctx.JD_TT);
    
    // Monatssäule
    const month = this.calculateMonthPillar(sunLon, year.stemIndex);
    
    // Tagessäule
    const day = this.calculateDayPillar(ctx.JD_UTC);
    
    // Wahre Sonnenzeit für Stunde
    const tst = this.calculateTST(ctx);
    
    // Stundensäule
    const hour = this.calculateHourPillar(tst, day.stemIndex);
    
    // Day Master
    const dayMaster = {
      element: WU_XING.ELEMENTS[Math.floor(day.stemIndex / 2)],
      polarity: day.stemIndex % 2 === 0 ? 'Yang' : 'Yin'
    };
    
    return {
      year,
      month,
      day,
      hour,
      dayMaster,
      chineseZodiacAnimal: ZODIAC_ANIMALS[year.branchIndex]
    };
  }
  
  private fuseCharts(western: WesternChart, eastern: BaZiChart): FusionMetrics {
    // Element-Vektoren berechnen
    const westVector = this.westernElementVector(western);
    const eastVector = this.easternElementVector(eastern);
    
    // Kombinierten Vektor berechnen (gewichtetes Mittel)
    const combined = westVector.map((w, i) => (w + eastVector[i]) / 2);
    const normalizedCombined = this.normalizeVector(combined);
    
    // Dominantes und defizientes Element
    const maxIdx = normalizedCombined.indexOf(Math.max(...normalizedCombined));
    const minIdx = normalizedCombined.indexOf(Math.min(...normalizedCombined));
    
    // Harmonie-Index
    const harmony = this.calculateHarmonyIndex(westVector, eastVector);
    
    // Spannungspunkte identifizieren
    const tensions = this.identifyTensions(western, eastern);
    
    return {
      elementVector: {
        combined: normalizedCombined,
        western: westVector,
        eastern: eastVector,
        dominantElement: WU_XING.ELEMENTS[maxIdx],
        deficientElement: WU_XING.ELEMENTS[minIdx]
      },
      harmonyIndex: harmony,
      tensionPoints: tensions,
      archetypes: this.generateArchetypes(western, eastern)
    };
  }
  
  /**
   * Harmonie-Index: Maß für Kohärenz zwischen West und Ost
   * 
   * H = Σ_i (v_west_i × v_east_i × cos(θ_i))
   * 
   * Vereinfacht: Kosinusähnlichkeit der Element-Vektoren
   */
  private calculateHarmonyIndex(west: number[], east: number[]): number {
    // Cosine Similarity
    let dotProduct = 0;
    let normWest = 0;
    let normEast = 0;
    
    for (let i = 0; i < 5; i++) {
      dotProduct += west[i] * east[i];
      normWest += west[i] * west[i];
      normEast += east[i] * east[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(normWest) * Math.sqrt(normEast));
    
    // Auf [0, 1] normieren
    return (similarity + 1) / 2;
  }
  
  private identifyTensions(western: WesternChart, eastern: BaZiChart): string[] {
    const tensions: string[] = [];
    
    // Beispiel: Sun-Mars Quadrat + Feuer-Metall Clash im Ba Zi
    // ... komplexe Logik für Spannungserkennung
    
    return tensions;
  }
}
```

### 15. Validierungs-Schicht

```javascript
class FusionValidator {
  
  validate(western: WesternChart, eastern: BaZiChart, fusion: FusionMetrics): ValidationResult {
    const checks: SanityResult[] = [];
    
    // 1. Sonnenzeichen vs. Kalender-Plausibilität
    checks.push(this.checkSunSignPlausibility(western.sun, /* birthDate */));
    
    // 2. Mond-Geschwindigkeit (11-15°/Tag)
    checks.push(this.checkMoonSpeed(western.moon));
    
    // 3. Ba Zi Li-Chun-Konsistenz
    checks.push(this.checkLiChunConsistency(eastern));
    
    // 4. Element-Vektor-Summe = 1
    checks.push(this.checkVectorNormalization(fusion.elementVector));
    
    // 5. Keine offensichtlichen Berechnungsfehler
    checks.push(this.checkCalculationIntegrity(western, eastern));
    
    return {
      valid: checks.every(c => c.passed),
      checks
    };
  }
  
  private checkSunSignPlausibility(sun: CelestialPosition, birthDate: Date): SanityResult {
    // Grobe Zuordnung Monat → Zeichen
    const expectedSigns = this.getExpectedSignsForMonth(birthDate.getMonth() + 1);
    
    const passed = expectedSigns.includes(sun.sign) || 
                   // Erlaube Nachbarzeichen bei Cusp (±2°)
                   (sun.degree < 2 || sun.degree > 28);
    
    return {
      check: 'sun_sign_plausibility',
      passed,
      message: passed ? 'OK' : `Unexpected sun sign ${sun.sign} for month ${birthDate.getMonth() + 1}`
    };
  }
}
```

### 16. API-Schnittstelle

```javascript
/**
 * Öffentliche API für das Fusionsframework
 */
const AstroFusion = {
  
  /**
   * Vollständige Fusionsberechnung
   */
  calculateFusionProfile(input: BirthInput): FusionProfile {
    const engine = new AstroFusionEngine();
    return engine.calculate(input);
  },
  
  /**
   * Nur westliche Berechnung
   */
  calculateWestern(input: BirthInput): WesternChart {
    const engine = new AstroFusionEngine();
    const ctx = engine.standardizeTime(input);
    return engine.calculateWestern(ctx);
  },
  
  /**
   * Nur östliche Berechnung
   */
  calculateEastern(input: BirthInput): BaZiChart {
    const engine = new AstroFusionEngine();
    const ctx = engine.standardizeTime(input);
    return engine.calculateEastern(ctx);
  },
  
  /**
   * Kompatibilitätsanalyse zwischen zwei Profilen
   */
  calculateCompatibility(profile1: FusionProfile, profile2: FusionProfile): CompatibilityResult {
    // San He / Liu He / Liu Chong Analyse
    // Element-Vektor-Vergleich
    // Aspekt-Synastrie
    // ...
  },
  
  /**
   * Aktuelles Jahr/Monat/Tag Energieprofil
   */
  getCurrentEnergy(): CurrentEnergyProfile {
    const now = new Date();
    // Ba Zi für aktuellen Zeitpunkt
    // Ohne persönliche Geburtsdaten
  }
};

export default AstroFusion;
```

---

## TEIL IV: VOLLSTÄNDIGE DOKUMENTATION

### 17. Glossar

| Begriff | Definition |
|---------|------------|
| **Ba Zi (八字)** | "Acht Zeichen" – Vier Säulen × 2 Zeichen pro Säule |
| **Jia Zi (甲子)** | 60-Jahre-Zyklus, benannt nach der ersten Kombination |
| **Tian Gan (天干)** | Himmelsstämme (10 Stück) |
| **Di Zhi (地支)** | Erdzweige (12 Stück, = Tierkreis) |
| **Wu Xing (五行)** | Fünf Wandlungsphasen / Elemente |
| **Li Chun (立春)** | "Frühlingsanfang" – Start des astrolog. Jahres (λ☉ = 315°) |
| **Jieqi (節氣)** | 24 Solarterme, die das Jahr einteilen |
| **Day Master (日主)** | Tages-Stamm als Identitätskern |
| **JD** | Julianisches Datum – kontinuierliche Tageszählung |
| **TT** | Terrestrische Zeit – gleichförmige Zeitskala |
| **ΔT** | Differenz zwischen TT und UT |
| **GMST** | Greenwich Mean Sidereal Time |
| **LST** | Local Sidereal Time |
| **λ☉** | Ekliptikale Länge der Sonne |

### 18. Algorithmus-Flussdiagramm

```
INPUT: Geburtsdatum, -zeit, -ort
                │
                ▼
┌───────────────────────────────────┐
│  1. ZEIT-NORMALISIERUNG           │
│  • Timezone → UTC                 │
│  • UTC → JD_UTC                   │
│  • ΔT → JD_TT                     │
└───────────────┬───────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│  WESTLICH     │ │  ÖSTLICH      │
│               │ │               │
│ λ☉ → Sun Sign│ │ Li Chun Check │
│ λ☽ → Moon    │ │ λ☉ → Monat    │
│ LST → ASC    │ │ JDN → Tag     │
│ LST → MC     │ │ TST → Stunde  │
│ Houses       │ │               │
│ Aspects      │ │ 4 Pillars     │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 ▼
┌───────────────────────────────────┐
│  2. ELEMENT-VEKTOR-BERECHNUNG     │
│  • Western: Planet → Wu Xing      │
│  • Eastern: Pillar → Wu Xing      │
│  • Fusion: Weighted Average       │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│  3. HARMONIE-INDEX                │
│  H = cosine_similarity(W, E)      │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│  4. VALIDIERUNG                   │
│  • Sun sign plausibility          │
│  • Moon speed check               │
│  • Vector normalization           │
│  • Internal consistency           │
└───────────────┬───────────────────┘
                │
                ▼
OUTPUT: FusionProfile
```

### 19. Mathematische Formeln – Zusammenfassung

#### Zeitkonversion
```
JD = 367Y - ⌊7(Y + ⌊(M+9)/12⌋)/4⌋ + ⌊275M/9⌋ + D + 1721013.5 + (h + m/60 + s/3600)/24

JD_TT = JD_UTC + ΔT/86400

GMST = 18.697374558 + 24.06570982441908 × (JD - 2451545.0)

LST = GMST + λ_geo/15
```

#### Aszendent
```
tan(ASC) = cos(θ_LST) / [-sin(θ_LST) × cos(ε) - tan(φ) × sin(ε)]

ε ≈ 23.4393° (Ekliptikschiefe)
φ = geographische Breite
```

#### Sonnenlänge
```
L₀ = 280.46646 + 36000.76983 × T + 0.0003032 × T²

M = 357.52911 + 35999.05029 × T - 0.0001537 × T²

C = (1.914602 - 0.004817T) × sin(M) + 0.019993 × sin(2M) + 0.000289 × sin(3M)

λ☉ = L₀ + C - 0.00569 - 0.00478 × sin(Ω)

T = (JD_TT - 2451545.0) / 36525
```

#### Ba Zi Indizes
```
Sexagenary Index = (JDN + 49) mod 60

Year Index = (Year - 1984) mod 60

Stem Index = Sexagenary Index mod 10

Branch Index = Sexagenary Index mod 12
```

#### Harmonie-Index
```
H = (S_west · S_east) / (|S_west| × |S_east|)

S = [s_Wood, s_Fire, s_Earth, s_Metal, s_Water]
```

### 20. Erweiterungspunkte

Das Framework ist erweiterbar für:

1. **Zi Wei Dou Shu (紫微斗數)** – Komplexere chinesische Astrologie mit 12+ Sternen
2. **Feng Shui Integration** – Raumharmonisierung basierend auf Ba Zi
3. **Dashas/Mahadashas** – Vedische Planetenperioden
4. **Progressionen** – Secondary Progressions, Solar Arc
5. **Transiten-Analyse** – Aktuelle Planeten vs. Natal-Chart

---

## META-CHECK

### Logische Konsistenz
- ✓ Alle Formeln sind aus anerkannten astronomischen Algorithmen abgeleitet (Meeus, NOAA)
- ✓ Ba Zi Regeln entsprechen traditionellen Quellen (Fünf-Tiger, Fünf-Ratten)
- ✓ Element-Zuordnungen sind konsistent über beide Systeme

### Annahmen und Einschränkungen
- Mondposition: Vereinfachte Formel, Genauigkeit ±2° (für Zeichen ausreichend)
- Planetenpositionen: Mittlere Bewegung, keine Störungsrechnung höherer Ordnung
- Häuser: Placidus versagt >66° Breite – Alternative: Äquales System
- Li Chun: Wird numerisch bestimmt (Root-Finding), nicht aus Tabellen

### Verbesserungspotential
- Integration von Swiss Ephemeris für höchste Präzision
- Einbeziehung von Shen Sha (virtuelle Sterne) im Ba Zi
- Machine-Learning-gestützte Interpretations-Engine
- Multilinguale Ausgabe (DE, EN, ZH)

---

**Framework-Version:** 1.0  
**Erstellt:** Dezember 2025  
**Zweck:** Deterministische, reproduzierbare Astrologie-Berechnungen mit West-Ost-Fusion
