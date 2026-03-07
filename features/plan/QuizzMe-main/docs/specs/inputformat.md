#
 Blueprint 2.0: Architektur für Virale Persönlichkeitstests und Quiz-Systeme

2
3
**
Version:
**
 2.0  
4
**
Stand:
**
 Dezember 2025  
5
**
Paradigma:
**
 Ko-Kreations-Architektur
6
7
---

8
9
##
 1. Executive Summary

10
11
###
 1.1 Das neue Paradigma: Ko-Kreation statt Diagnose

12
13
>
 
**
„Der Test ist keine Diagnose – er ist ein Lückentext.  
14
> Die Wahrheit entsteht erst, wenn der Nutzer ihn mit seiner Biografie füllt."
**

15
16
Dieser Blueprint definiert eine fundamental neue Perspektive auf Persönlichkeitstests:
17
18
**
Alte Sichtweise:
**
 Test misst → Algorithmus berechnet → Ergebnis wird präsentiert  
19
**
Neue Sichtweise:
**
 Test triggert → Nutzer validiert sich selbst → Ergebnis wird adoptiert
20
21
Der Erfolg viraler Tests liegt nicht in diagnostischer Präzision, sondern in ihrer Fähigkeit zur 
**
Sinnstiftung
**
. Sie sind „Sinn-Maschinen", die dem Nutzer ein Vokabular zur Selbstbeschreibung anbieten, das reicher und bedeutungsvoller ist als nüchterne Statistik.
22
23
###
 1.2 Die zwei Modi

24
25
|
 Aspekt 
|
 Modus A: Selbstreflexion 
|
 Modus B: Viralität 
|

26
|
--------
|
--------------------------
|
-------------------
|

27
|
 
**
Primärziel
**
 
|
 Differenzierte Einsicht 
|
 Maximale Shares 
|

28
|
 
**
Erfolgskriterium
**
 
|
 Nutzbare Selbsterkenntnis 
|
 Completion Rate >65%, Social Shares 
|

29
|
 
**
Testlänge
**
 
|
 20-40 Fragen, 5-15 Min 
|
 
**
8-15 Fragen, <3 Min
**
 
|

30
|
 
**
Ergebnis-Format
**
 
|
 Ausführliches Profil 
|
 Trading Card (9:16) 
|

31
|
 
**
Barnum-Nutzung
**
 
|
 Moderat 
|
 Strategisch maximiert 
|

32

33
###
 1.3 Die 7 universellen Erfolgs-Prinzipien

34
35
Diese Prinzipien bilden die „DNA der Viralität" – sie garantieren Erfolg unabhängig vom Thema:
36
37
|
 
#
 
|
 Prinzip 
|
 Kernmechanismus 
|

38
|
---
|
---------
|
-----------------
|

39
|
 1 
|
 
**
Das Schmeichelhafte Spiegelkabinett
**
 
|
 Keine Verlierer – Schwächen werden zu „tragischer Tiefe" 
|

40
|
 2 
|
 
**
Tribalismus & Instant Tribes
**
 
|
 Sofortige Zugehörigkeit durch Labels („Ich bin ein Gryffindor") 
|

41
|
 3 
|
 
**
Science Mimicry
**
 
|
 Visuelle Komplexität simuliert Validität 
|

42
|
 4 
|
 
**
Ipsative Klarheit
**
 
|
 Entweder-Oder erzeugt befriedigende Eindeutigkeit 
|

43
|
 5 
|
 
**
Narrative Identität
**
 
|
 Der Nutzer wird Protagonist, nicht Datenpunkt 
|

44
|
 6 
|
 
**
Absolution
**
 
|
 Determinismus entlastet von Selbstoptimierungsdruck 
|

45
|
 7 
|
 
**
Shareability
**
 
|
 Output als Content-Generator für Social Media 
|

46

47
---

48
49
##
 2. Fachliches Modell: Die Psychologie des Erfolgs

50
51
###
 2.1 Der Barnum-Effekt als Design-Feature

52
53
Der Barnum-Effekt (Forer-Effekt) ist 
**
kein Bug, sondern das zentrale Feature
**
.
54
55
**
Definition:
**
 Die Tendenz, vage und allgemeingültige Aussagen als hochindividuell wahrzunehmen.
56
57
**
Strategische Nutzung:
**

58
59
```

60
INEFFEKTIV (zu spezifisch):
61
"Du hast am 14. März 2019 eine wichtige Entscheidung getroffen."
62
63
INEFFEKTIV (zu vage):
64
"Du bist ein Mensch mit Gefühlen."
65
66
OPTIMAL (Ko-Kreations-Trigger):
67
"In bestimmten Momenten sehnst du dich nach einer Stille, 
68
die andere nicht verstehen."

69
```

70
71
Die optimale Formulierung:
72
-
 Ist 
**
spezifisch genug
**
, um Validierung zu triggern
73
-
 Ist 
**
vage genug
**
, um biografische Projektion zu ermöglichen
74
-
 Enthält 
**
emotionale Resonanz
**
, die Erinnerungen aktiviert
75
76
###
 2.2 Die Ko-Kreations-Architektur

77
78
```

79
┌─────────────────────────────────────────────────────────────────┐
80
│                    DER KO-KREATIONS-PROZESS                     │
81
├─────────────────────────────────────────────────────────────────┤
82
│                                                                 │
83
│   TEST                        NUTZER                            │
84
│   ┌───────────┐              ┌───────────┐                     │
85
│   │  Liefert  │              │  Füllt    │                     │
86
│   │  VAGE     │─────────────▶│  mit      │                     │
87
│   │  HÜLLE    │              │  BIOGRAFIE│                     │
88
│   └───────────┘              └───────────┘                     │
89
│        │                           │                            │
90
│        │                           │                            │
91
│        ▼                           ▼                            │
92
│   ┌─────────────────────────────────────┐                      │
93
│   │        SUBJEKTIVE WAHRHEIT          │                      │
94
│   │   (fühlt sich valider an als        │                      │
95
│   │    jede objektive Messung)          │                      │
96
│   └─────────────────────────────────────┘                      │
97
│                       │                                         │
98
│                       ▼                                         │
99
│              ┌─────────────────┐                               │
100
│              │  SHARE-IMPULS   │                               │
101
│              │  "Das bin ich!" │                               │
102
│              └─────────────────┘                               │
103
│                                                                 │
104
└─────────────────────────────────────────────────────────────────┘

105
```

106
107
**
Der Prozess im Detail:
**

108
109
1.
 
**
Trigger:
**
 Test präsentiert vage Aussage („Du fühlst dich manchmal missverstanden")
110
2.
 
**
Biografische Suche:
**
 Nutzer scannt Erinnerungen nach Bestätigung
111
3.
 
**
Selektive Validierung:
**
 Passende Momente werden erinnert, widersprüchliche ignoriert
112
4.
 
**
Adoption:
**
 Nutzer übernimmt das Ergebnis als Teil seiner Identität
113
5.
 
**
Sharing:
**
 Ergebnis wird als „Social Currency" geteilt
114
115
###
 2.3 Positives Framing: Die Alchemie der Schwächen

116
117
Jede Eigenschaft kann positiv geframt werden:
118
119
|
 Rohe Eigenschaft 
|
 Negative Deutung 
|
 Positive Umdeutung 
|

120
|
------------------
|
------------------
|
-------------------
|

121
|
 Introvertiert 
|
 Sozial unfähig 
|
 „Geheimnisvolle Tiefe" 
|

122
|
 Impulsiv 
|
 Unzuverlässig 
|
 „Spontane Energie" 
|

123
|
 Detailversessen 
|
 Pedantisch 
|
 „Strategisches Talent" 
|

124
|
 Emotional 
|
 Überempfindlich 
|
 „Empathische Intelligenz" 
|

125
|
 Distanziert 
|
 Kalt 
|
 „Mysteriöse Aura" 
|

126
|
 Chaotisch 
|
 Unorganisiert 
|
 „Kreative Freigeist" 
|

127

128
**
Regel:
**
 Es gibt keine schlechten Ergebnisse. Selbst das „Schwarze Loch" im Cosmos-Test ist nicht destruktiv, sondern „ein Mysterium, das andere anzieht".
129
130
###
 2.4 Tribalismus: Instant Tribes

131
132
Menschen suchen Zugehörigkeit. Tests liefern „sofortige Stämme":
133
134
```

135
┌────────────────────────────────────────────────────────┐
136
│           TRIBALE IDENTIFIKATIONS-KASKADE              │
137
├────────────────────────────────────────────────────────┤
138
│                                                        │
139
│  1. LABEL ERHALTEN                                     │
140
│     "Du bist ein INFJ / Gryffindor / Nekromant"       │
141
│                          │                             │
142
│                          ▼                             │
143
│  2. IN-GROUP FINDEN                                    │
144
│     "Andere INFJs verstehen mich"                      │
145
│                          │                             │
146
│                          ▼                             │
147
│  3. OUT-GROUP DEFINIEREN                               │
148
│     "ESTJs sind so anders als ich"                     │
149
│                          │                             │
150
│                          ▼                             │
151
│  4. SOZIALE WÄHRUNG                                    │
152
│     Ergebnis wird geteilt → Stammeszeichen gezeigt    │
153
│                                                        │
154
└────────────────────────────────────────────────────────┘

155
```

156
157
###
 2.5 Ethische Grenzen

158
159
**
PFLICHT-DISCLAIMER (bei jedem Test):
**

160
161
```

162
Dieser Test dient der spielerischen Selbstreflexion und stellt 
163
KEINE medizinische, psychologische oder diagnostische Bewertung dar.
164
Bei ernsthaften Anliegen wenden Sie sich an qualifizierte Fachpersonen.

165
```

166
167
**
Absolute No-Gos:
**

168
-
 Diagnose-Begriffe (Narzissmus, Depression, ADHS)
169
-
 Stigmatisierende Profilnamen
170
-
 Fragen zu Suizid, Selbstverletzung, illegalen Aktivitäten
171
-
 Suggestive Fragen zu Minderjährigen
172
173
---

174
175
##
 3. Die Goldene Regel: Struktur-Architektur

176
177
###
 3.1 Die magischen Zahlen

178
179
```

180
┌─────────────────────────────────────────────────────────────────┐
181
│                    DIE GOLDENE REGEL                            │
182
├─────────────────────────────────────────────────────────────────┤
183
│                                                                 │
184
│   FRAGEN:     8 - 15  (Sweet Spot: 12)                         │
185
│   DAUER:      < 3 Minuten                                       │
186
│   LAYOUT:     1 Frage pro Seite                                │
187
│   PROGRESS:   Sichtbarer Fortschrittsbalken                    │
188
│   PROFILE:    4 - 8 Ergebnistypen                              │
189
│   DIMENSIONEN: 2 - 4 (oft versteckt)                           │
190
│                                                                 │
191
│   COMPLETION RATE ZIEL: > 65%                                  │
192
│   SHARE RATE ZIEL: > 30%                                       │
193
│                                                                 │
194
└─────────────────────────────────────────────────────────────────┘

195
```

196
197
###
 3.2 Progress Design: Der Zeigarnik-Effekt

198
199
Der Zeigarnik-Effekt: Menschen erinnern sich besser an unvollendete Aufgaben.
200
201
**
UX-Implikationen:
**

202
203
```

204
┌──────────────────────────────────────────────┐
205
│  Frage 7 von 12                              │
206
│  ████████████░░░░░░░░░░░░░  58%             │
207
│                                              │
208
│  "Welche Waffe würdest du in einem           │
209
│   magischen Wald wählen?"                    │
210
│                                              │
211
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
212
│  │ 🗡️      │  │ 🪄      │  │ 🛡️      │      │
213
│  │ Schwert │  │ Zauberstab│ │ Schild  │      │
214
│  └─────────┘  └─────────┘  └─────────┘      │
215
│                                              │
216
└──────────────────────────────────────────────┘

217
```

218
219
**
Prinzipien:
**

220
1.
 
**
Progress Bar immer sichtbar
**
 – erzeugt Commitment
221
2.
 
**
Eine Frage pro Seite
**
 – reduziert kognitive Last
222
3.
 
**
Keine Rückwärts-Navigation
**
 – verhindert Overthinking
223
4.
 
**
Sofortiges Feedback
**
 – Micro-Wins bei jeder Antwort
224
225
###
 3.3 Das Reskinning-Prinzip

226
227
Die „Engine" (psychologisches Modell) bleibt konstant – der „Skin" (Thema) ist austauschbar:
228
229
```

230
┌─────────────────────────────────────────────────────────────────┐
231
│                    RESKINNING-ARCHITEKTUR                       │
232
├─────────────────────────────────────────────────────────────────┤
233
│                                                                 │
234
│   ENGINE (konstant)           SKIN (variabel)                  │
235
│   ┌─────────────────┐        ┌─────────────────┐               │
236
│   │ MBTI 16 Typen   │───────▶│ Cosmos Persona  │               │
237
│   │ oder            │        │ Super Power     │               │
238
│   │ Big Five        │        │ Harry Potter    │               │
239
│   │ oder            │        │ Welches Tier    │               │
240
│   │ Enneagramm      │        │ Fantasy-Klasse  │               │
241
│   └─────────────────┘        └─────────────────┘               │
242
│                                                                 │
243
│   INTJ ────────────────────▶ "Der Nebel" (Cosmos)              │
244
│   INTJ ────────────────────▶ "Nekromant" (Super Power)         │
245
│   INTJ ────────────────────▶ "Ravenclaw" (Potter)              │
246
│                                                                 │
247
└─────────────────────────────────────────────────────────────────┘

248
```

249
250
###
 3.4 Datenmodell (JSON Schema)

251
252
```
json

253
{

254
  
"$schema"
:
 
"https://json-schema.org/draft/2020-12/schema"
,

255
  
"title"
:
 
"ViralTestDefinition"
,

256
  
"type"
:
 
"object"
,

257
  
"required"
:
 
[
"id"
,
 
"meta"
,
 
"questions"
,
 
"profiles"
,
 
"share_config"
]
,

258
  
"properties"
:
 
{

259
    
"id"
:
 
{
 
"type"
:
 
"string"
 
}
,

260
    
"meta"
:
 
{

261
      
"type"
:
 
"object"
,

262
      
"properties"
:
 
{

263
        
"title"
:
 
{
 
"type"
:
 
"string"
,
 
"description"
:
 
"Hook-Titel für Social Media"
 
}
,

264
        
"subtitle"
:
 
{
 
"type"
:
 
"string"
 
}
,

265
        
"engine"
:
 
{
 
"enum"
:
 
[
"mbti"
,
 
"big5"
,
 
"enneagram"
,
 
"custom"
]
 
}
,

266
        
"skin"
:
 
{
 
"type"
:
 
"string"
,
 
"description"
:
 
"Thematischer Überbau"
 
}
,

267
        
"estimated_duration_seconds"
:
 
{
 
"type"
:
 
"integer"
,
 
"maximum"
:
 
180
 
}
,

268
        
"disclaimer"
:
 
{
 
"type"
:
 
"string"
 
}

269
      
}

270
    
}
,

271
    
"dimensions"
:
 
{

272
      
"type"
:
 
"array"
,

273
      
"items"
:
 
{

274
        
"type"
:
 
"object"
,

275
        
"properties"
:
 
{

276
          
"id"
:
 
{
 
"type"
:
 
"string"
 
}
,

277
          
"name"
:
 
{
 
"type"
:
 
"string"
 
}
,

278
          
"pole_low"
:
 
{
 
"type"
:
 
"string"
 
}
,

279
          
"pole_high"
:
 
{
 
"type"
:
 
"string"
 
}
,

280
          
"hidden"
:
 
{
 
"type"
:
 
"boolean"
,
 
"default"
:
 
true
 
}

281
        
}

282
      
}

283
    
}
,

284
    
"questions"
:
 
{

285
      
"type"
:
 
"array"
,

286
      
"minItems"
:
 
8
,

287
      
"maxItems"
:
 
15
,

288
      
"items"
:
 
{

289
        
"type"
:
 
"object"
,

290
        
"required"
:
 
[
"id"
,
 
"text"
,
 
"options"
]
,

291
        
"properties"
:
 
{

292
          
"id"
:
 
{
 
"type"
:
 
"string"
 
}
,

293
          
"text"
:
 
{
 
"type"
:
 
"string"
 
}
,

294
          
"narrative_context"
:
 
{
 
"type"
:
 
"string"
,
 
"description"
:
 
"Szenario-Einbettung"
 
}
,

295
          
"image_url"
:
 
{
 
"type"
:
 
"string"
,
 
"format"
:
 
"uri"
 
}
,

296
          
"options"
:
 
{

297
            
"type"
:
 
"array"
,

298
            
"minItems"
:
 
2
,

299
            
"maxItems"
:
 
4
,

300
            
"items"
:
 
{

301
              
"type"
:
 
"object"
,

302
              
"properties"
:
 
{

303
                
"id"
:
 
{
 
"type"
:
 
"string"
 
}
,

304
                
"text"
:
 
{
 
"type"
:
 
"string"
 
}
,

305
                
"image_url"
:
 
{
 
"type"
:
 
"string"
 
}
,

306
                
"scores"
:
 
{

307
                  
"type"
:
 
"object"
,

308
                  
"additionalProperties"
:
 
{
 
"type"
:
 
"number"
 
}

309
                
}

310
              
}

311
            
}

312
          
}

313
        
}

314
      
}

315
    
}
,

316
    
"profiles"
:
 
{

317
      
"type"
:
 
"array"
,

318
      
"minItems"
:
 
4
,

319
      
"maxItems"
:
 
16
,

320
      
"items"
:
 
{

321
        
"type"
:
 
"object"
,

322
        
"required"
:
 
[
"id"
,
 
"title"
,
 
"description"
,
 
"share_card"
,
 
"compatibility"
]
,

323
        
"properties"
:
 
{

324
          
"id"
:
 
{
 
"type"
:
 
"string"
 
}
,

325
          
"title"
:
 
{
 
"type"
:
 
"string"
,
 
"description"
:
 
"Dramatischer Typen-Name"
 
}
,

326
          
"tagline"
:
 
{
 
"type"
:
 
"string"
,
 
"maxLength"
:
 
100
 
}
,

327
          
"description"
:
 
{
 
328
            
"type"
:
 
"string"
,
 
329
            
"description"
:
 
"Ko-Kreations-Text mit intentionalen Leerstellen"
 
330
          
}
,

331
          
"stats"
:
 
{

332
            
"type"
:
 
"array"
,

333
            
"items"
:
 
{

334
              
"type"
:
 
"object"
,

335
              
"properties"
:
 
{

336
                
"label"
:
 
{
 
"type"
:
 
"string"
 
}
,

337
                
"value"
:
 
{
 
"type"
:
 
"string"
 
}

338
              
}

339
            
}

340
          
}
,

341
          
"compatibility"
:
 
{

342
            
"type"
:
 
"object"
,

343
            
"properties"
:
 
{

344
              
"allies"
:
 
{
 
"type"
:
 
"array"
,
 
"items"
:
 
{
 
"type"
:
 
"string"
 
}
 
}
,

345
              
"nemesis"
:
 
{
 
"type"
:
 
"array"
,
 
"items"
:
 
{
 
"type"
:
 
"string"
 
}
 
}

346
            
}

347
          
}
,

348
          
"share_card"
:
 
{

349
            
"type"
:
 
"object"
,

350
            
"properties"
:
 
{

351
              
"image_url"
:
 
{
 
"type"
:
 
"string"
 
}
,

352
              
"share_text"
:
 
{
 
"type"
:
 
"string"
,
 
"maxLength"
:
 
140
 
}

353
            
}

354
          
}
,

355
          
"matching_criteria"
:
 
{

356
            
"type"
:
 
"object"
,

357
            
"properties"
:
 
{

358
              
"dimension_requirements"
:
 
{
 
"type"
:
 
"object"
 
}
,

359
              
"priority"
:
 
{
 
"type"
:
 
"integer"
 
}

360
            
}

361
          
}

362
        
}

363
      
}

364
    
}
,

365
    
"share_config"
:
 
{

366
      
"type"
:
 
"object"
,

367
      
"properties"
:
 
{

368
        
"card_format"
:
 
{
 
"enum"
:
 
[
"9:16"
,
 
"1:1"
,
 
"16:9"
]
,
 
"default"
:
 
"9:16"
 
}
,

369
        
"include_compatibility"
:
 
{
 
"type"
:
 
"boolean"
,
 
"default"
:
 
true
 
}
,

370
        
"include_stats"
:
 
{
 
"type"
:
 
"boolean"
,
 
"default"
:
 
true
 
}

371
      
}

372
    
}

373
  
}

374
}

375
```

376
377
---

378
379
##
 4. Output-Design: Die Trading Card

380
381
###
 4.1 Das Social-Ready Format

382
383
```

384
┌─────────────────────────────────────┐
385
│                                     │
386
│      ╔═══════════════════════╗      │
387
│      ║   [ILLUSTRATION]      ║      │
388
│      ║   ✦ Charakter/Symbol  ║      │
389
│      ╚═══════════════════════╝      │
390
│                                     │
391
│      ═══════════════════════════    │
392
│             DER NEKROMANT           │
393
│      ═══════════════════════════    │
394
│                                     │
395
│      "Du rufst zurück, was andere   │
396
│       längst vergessen wollen."     │
397
│                                     │
398
│      ─────────────────────────      │
399
│                                     │
400
│      ▓▓▓▓▓▓▓▓░░  80% Chaos         │
401
│      ▓▓▓▓▓▓░░░░  60% Empathie      │
402
│      ▓▓▓▓▓▓▓▓▓▓ 100% Missverstanden│
403
│                                     │
404
│      ─────────────────────────      │
405
│                                     │
406
│      ✓ ALLIES                       │
407
│        Der Heiler • Der Schatten    │
408
│                                     │
409
│      ✗ NEMESIS                      │
410
│        Der Krieger                  │
411
│                                     │
412
│      ─────────────────────────      │
413
│                                     │
414
│      [ 🔗 TEILEN ]  [ 🔄 NOCHMAL ]  │
415
│                                     │
416
└─────────────────────────────────────┘
417
        Format: 9:16 (Story-Ready)

418
```

419
420
###
 4.2 Die Kompatibilitäts-Matrix als Viral-Trigger

421
422
Die Kompatibilitäts-Liste ist der 
**
primäre Viral-Mechanismus
**
:
423
424
```

425
VIRAL-KASKADE:
426
427
1. Nutzer erhält Ergebnis
428
   │
429
   ▼
430
2. Sieht "Passt zu: Heiler, Schatten"
431
   │
432
   ▼
433
3. Fragt sich: "Wer in meinem Umfeld ist das?"
434
   │
435
   ▼
436
4. Teilt Ergebnis + markiert Freunde
437
   │
438
   ▼
439
5. Freunde machen Test → Kaskade wiederholt sich

440
```

441
442
###
 4.3 Stats: Selbstironische Authentizität

443
444
Moderne Tests nutzen humorvolle Stats statt klinischer Werte:
445
446
```

447
KLINISCH (langweilig):        VIRAL (relatable):
448
─────────────────────         ─────────────────────
449
Extraversion: 45%             100% Kaffee-abhängig
450
Offenheit: 78%                60% "Es ist kompliziert"
451
Verträglichkeit: 62%          80% Main Character Energy
452
                              120% Doomscrolling nach 23 Uhr

453
```

454
455
---

456
457
##
 5. Fragen-Design: Narrative statt Aussagen

458
459
###
 5.1 Das Szenario-Prinzip

460
461
```

462
SCHLECHT (abstrakte Aussage):
463
"Ich treffe Entscheidungen lieber nach Gefühl als nach Logik."
464
→ Triggert Social Desirability, Overthinking
465
466
GUT (narratives Szenario):
467
"Du stehst an einer Weggabelung im Wald. 
468
Links führt ein sicherer, beleuchteter Pfad. 
469
Rechts lockt ein Geräusch, das dich neugierig macht. 
470
Wohin gehst du?"
471
→ Triggert intuitive Reaktion, fühlt sich wie Spiel an

472
```

473
474
###
 5.2 Fragen-Typologie für Viralität

475
476
|
 Typ 
|
 Beispiel 
|
 Wirkmechanismus 
|

477
|
-----
|
----------
|
-----------------
|

478
|
 
**
Waffen-Wahl
**
 
|
 „Welche magische Waffe wählst du?" 
|
 Projektion von Macht/Kontrolle 
|

479
|
 
**
Ort-Wahl
**
 
|
 „Wo würdest du in einer Fantasy-Welt leben?" 
|
 Sehnsucht/Eskapismus 
|

480
|
 
**
Reaktions-Szenario
**
 
|
 „Dein Freund hat dich verraten. Was tust du?" 
|
 Moralische Selbstdefinition 
|

481
|
 
**
Präferenz-Bild
**
 
|
 [4 Bilder ohne Text] 
|
 Reduziert Overthinking 
|

482
|
 
**
Superkraft-Dilemma
**
 
|
 „Fliegen oder Gedankenlesen?" 
|
 Forced Choice = Klarheit 
|

483

484
###
 5.3 Identitätsbezogene Fragen

485
486
Fragen sollten direkt das Selbstbild ansprechen:
487
488
```

489
THEMEN MIT HOHER RESONANZ:
490
- Werte (Tapferkeit vs. Klugheit vs. Loyalität)
491
- Soziale Rolle ("Der Anführer", "Der Friedensstifter", "Der Rebell")
492
- Ästhetische Präferenzen (Farben, Jahreszeiten, Elemente)
493
- Fiktive Allianzen ("Welches Tier wäre dein Begleiter?")

494
```

495
496
---

497
498
##
 6. Scoring & Matching

499
500
###
 6.1 Scoring-Pipeline

501
502
```

503
┌─────────────────────────────────────────────────────────────────┐
504
│                      SCORING-PIPELINE                           │
505
├─────────────────────────────────────────────────────────────────┤
506
│                                                                 │
507
│  EINGABE          VERARBEITUNG           AUSGABE               │
508
│  ┌─────────┐      ┌─────────────┐       ┌─────────────┐        │
509
│  │ Antwort │──────│ Score pro   │──────│ Dimension-  │        │
510
│  │ Array   │      │ Dimension   │      │ Profil      │        │
511
│  └─────────┘      └─────────────┘       └─────────────┘        │
512
│                          │                    │                 │
513
│                          ▼                    ▼                 │
514
│                   ┌─────────────┐       ┌─────────────┐        │
515
│                   │ Normali-    │       │ Matching    │        │
516
│                   │ sierung     │       │ Algorithmus │        │
517
│                   │ (0-100)     │       │             │        │
518
│                   └─────────────┘       └─────────────┘        │
519
│                                               │                 │
520
│                                               ▼                 │
521
│                                        ┌─────────────┐         │
522
│                                        │  PROFIL +   │         │
523
│                                        │  SHARE CARD │         │
524
│                                        └─────────────┘         │
525
│                                                                 │
526
└─────────────────────────────────────────────────────────────────┘

527
```

528
529
###
 6.2 Profil-Matching-Logik

530
531
```
javascript

532
function
 
matchProfile
(
dimensionScores
,
 profiles
)
 
{

533
  
// Priorisiere Profile nach Spezifität

534
  
const
 sortedProfiles 
=
 profiles
.
sort
(
(
a
,
 b
)
 
=>
 
535
    
Object
.
keys
(
b
.
matching_criteria
.
dimension_requirements
)
.
length
 
-

536
    
Object
.
keys
(
a
.
matching_criteria
.
dimension_requirements
)
.
length

537
  
)
;

538
539
  
for
 
(
const
 profile 
of
 sortedProfiles
)
 
{

540
    
if
 
(
meetsAllCriteria
(
dimensionScores
,
 profile
.
matching_criteria
)
)
 
{

541
      
return
 profile
;

542
    
}

543
  
}

544
545
  
// Fallback: Nächstes Profil nach Distanz

546
  
return
 
findClosestProfile
(
dimensionScores
,
 profiles
)
;

547
}

548
549
// KRITISCH: Jedes Profil MUSS erreichbar sein

550
function
 
validateProfileReachability
(
profiles
,
 questions
)
 
{

551
  
// Test durch Simulation aller Antwort-Kombinationen

552
}

553
```

554
555
---

556
557
##
 7. Ergebnis-Texte: Die Ko-Kreations-Sprache

558
559
###
 7.1 Formulierungs-Pattern

560
561
```

562
SCHLECHT (geschlossene Aussage):
563
"Du bist introvertiert und brauchst viel Zeit allein."
564
→ Kann widerlegt werden, keine Projektion möglich
565
566
GUT (öffnende Formulierung):
567
"In bestimmten Momenten sehnst du dich nach einer Stille, 
568
die andere nicht verstehen. Das ist keine Schwäche – 
569
es ist der Raum, in dem deine besten Ideen geboren werden."
570
→ Jeder findet "bestimmte Momente", füllt mit eigener Erfahrung

571
```

572
573
###
 7.2 Die Anatomie eines Ko-Kreations-Textes

574
575
```

576
STRUKTUR:
577
578
1. ÖFFNENDE VAGE AUSSAGE
579
   "Es gibt Zeiten, in denen du..."
580
581
2. EMOTIONALE VALIDIERUNG  
582
   "...und das ist völlig okay."
583
584
3. POSITIVE UMDEUTUNG
585
   "Was andere als X sehen, ist in Wahrheit Y."
586
587
4. IDENTITÄTS-ANGEBOT
588
   "Du bist einer der wenigen, die..."
589
590
5. HANDLUNGS-IMPULS
591
   "Deine Stärke entfaltet sich, wenn du..."

592
```

593
594
###
 7.3 Beispiel-Profil

595
596
```
markdown

597
##
 DER NEBEL

598
599
*
"Du umhüllst, was andere nicht sehen wollen."
*

600
601
Es gibt Momente, in denen du spürst, dass du Dinge wahrnimmst, 
602
die anderen verborgen bleiben. Das ist keine Einbildung – 
603
es ist deine Gabe.
604
605
Während andere nach klaren Antworten suchen, verstehst du, 
606
dass manche Wahrheiten nur in der Unschärfe existieren. 
607
Das macht dich nicht unentschlossen – es macht dich weise.
608
609
Menschen kommen zu dir, wenn sie nicht wissen, was sie fühlen. 
610
Du gibst ihnen keinen Rat – du gibst ihnen Raum.
611
612
▸ 90% Intuition
613
▸ 70% Geheimnisvoll  
614
▸ 60% Unergründlich
615
▸ 100% Tiefsinnig
616
617
**
Deine Allies:
**
 Der Heiler, Der Wanderer
618
**
Dein Nemesis:
**
 Der Krieger
619
620
*
"Nicht alles, was wahr ist, muss scharf sein."
*

621
```

622
623
---

624
625
##
 8. Implementierungs-Checklisten

626
627
###
 8.1 Pre-Launch Checkliste

628
629
```
markdown

630
##
 KONZEPTION

631
632
☐ Ziel definiert (Viralität / Selbstreflexion / Lead-Gen)
633
☐ Zielgruppe spezifiziert
634
☐ Engine gewählt (MBTI / Big5 / Enneagram / Custom)
635
☐ Skin/Thema definiert
636
☐ Trade-Off entschieden (Validität vs. Viralität)
637
638
##
 STRUKTUR

639
640
☐ 8-15 Fragen (Sweet Spot: 12)
641
☐ Alle Fragen haben Szenario-Kontext
642
☐ 4-8 Profile definiert
643
☐ Alle Profile positiv geframt
644
☐ Alle Profile erreichbar (mathematisch validiert)
645
☐ Kompatibilitäts-Matrix erstellt
646
647
##
 OUTPUT

648
649
☐ Trading Card Design (9:16)
650
☐ Share-Text < 140 Zeichen
651
☐ Stats humorvoll/relatable
652
☐ Kompatibilität (Allies + Nemesis)
653
☐ Disclaimer integriert
654
655
##
 TECHNIK

656
657
☐ Progress Bar sichtbar
658
☐ 1 Frage pro Seite
659
☐ Mobile-First Design
660
☐ Share-Buttons prominent
661
☐ Analytics für Completion Rate

662
```

663
664
###
 8.2 Qualitäts-Checkliste für Profile

665
666
```
markdown

667
Für JEDES Profil prüfen:
668
669
☐ Titel ist dramatisch/merkbar
670
☐ Tagline ist Social-Media-tauglich
671
☐ Beschreibung enthält Ko-Kreations-Trigger
672
☐ Keine negativen Urteile
673
☐ Schwächen sind als Stärken geframt
674
☐ Allies und Nemesis definiert
675
☐ Share-Text erzeugt Neugier bei anderen
676
☐ Profil ist von mindestens 10% erreichbar

677
```

678
679
---

680
681
##
 9. Anti-Patterns: Was nicht funktioniert

682
683
###
 9.1 Strukturelle Fehler

684
685
|
 Anti-Pattern 
|
 Problem 
|
 Lösung 
|

686
|
--------------
|
---------
|
--------
|

687
|
 
**
20+ Fragen
**
 
|
 Abbruchrate >60% 
|
 Max. 15 Fragen 
|

688
|
 
**
Alle Fragen sichtbar
**
 
|
 Overwhelm 
|
 1 Frage/Seite 
|

689
|
 
**
Keine Progress Bar
**
 
|
 Kein Commitment 
|
 Immer sichtbar 
|

690
|
 
**
Rückwärts-Navigation
**
 
|
 Overthinking 
|
 Deaktivieren 
|

691
|
 
**
Likert-Skalen
**
 
|
 Langweilig, kognitiv anstrengend 
|
 Binäre Bild-Choices 
|

692

693
###
 9.2 Inhaltliche Fehler

694
695
|
 Anti-Pattern 
|
 Problem 
|
 Lösung 
|

696
|
--------------
|
---------
|
--------
|

697
|
 
**
Direkte Trait-Fragen
**
 
|
 Social Desirability 
|
 Narrative Szenarien 
|

698
|
 
**
Negative Profile
**
 
|
 Niemand teilt 
|
 Alles positiv framen 
|

699
|
 
**
Klinische Sprache
**
 
|
 Emotionslos 
|
 Poetisch/humorvoll 
|

700
|
 
**
Fehlende Kompatibilität
**
 
|
 Kein Viral-Trigger 
|
 Allies + Nemesis 
|

701
|
 
**
Generisches Design
**
 
|
 Nicht teilenswert 
|
 Einzigartige Ästhetik 
|

702

703
###
 9.3 Psychologische Fehler

704
705
|
 Anti-Pattern 
|
 Problem 
|
 Lösung 
|

706
|
--------------
|
---------
|
--------
|

707
|
 
**
Zu spezifische Aussagen
**
 
|
 Falsifizierbar 
|
 Vage Hüllen 
|

708
|
 
**
Diagnose-Begriffe
**
 
|
 Rechtliche Risiken 
|
 Entertainment-Framing 
|

709
|
 
**
Fehlender Determinismus
**
 
|
 Keine Entlastung 
|
 „So bist du" statt „So wirst du" 
|

710
|
 
**
Keine Tribal-Labels
**
 
|
 Keine Zugehörigkeit 
|
 Starke Typen-Namen 
|

711

712
---

713
714
##
 10. Metriken & Optimierung

715
716
###
 10.1 Kern-KPIs

717
718
|
 Metrik 
|
 Benchmark 
|
 Optimierungshebel 
|

719
|
--------
|
-----------
|
-------------------
|

720
|
 
**
Completion Rate
**
 
|
 >65% 
|
 Kürzere Tests, bessere Progress UX 
|

721
|
 
**
Share Rate
**
 
|
 >30% 
|
 Bessere Trading Cards, Kompatibilität 
|

722
|
 
**
Time to Complete
**
 
|
 <180s 
|
 Weniger Fragen, schnellere Szenarien 
|

723
|
 
**
Profile Distribution
**
 
|
 Keine >40% 
|
 Fragen rebalancieren 
|

724
|
 
**
Return Rate
**
 
|
 >10% 
|
 Neue Test-Varianten anbieten 
|

725

726
###
 10.2 A/B-Test-Prioritäten

727
728
1.
 
**
Titel
**
 (Höchster Impact auf CTR)
729
2.
 
**
Erstes Bild
**
 (Entscheidet über Abbruch in Sekunde 3)
730
3.
 
**
Trading Card Design
**
 (Impact auf Share Rate)
731
4.
 
**
Fragen-Reihenfolge
**
 (Impact auf Completion)
732
5.
 
**
Profil-Texte
**
 (Impact auf Adoption)
733
734
---

735
736
##
 Anhang: Quick Reference Card

737
738
```

739
╔═══════════════════════════════════════════════════════════════════╗
740
║                 VIRAL TEST QUICK REFERENCE                        ║
741
╠═══════════════════════════════════════════════════════════════════╣
742
║                                                                   ║
743
║  GOLDENE ZAHLEN                                                   ║
744
║  ─────────────                                                    ║
745
║  • Fragen: 8-15 (Sweet Spot: 12)                                 ║
746
║  • Dauer: < 3 Minuten                                            ║
747
║  • Profile: 4-8                                                   ║
748
║  • Completion Ziel: > 65%                                        ║
749
║                                                                   ║
750
║  DIE 7 PRINZIPIEN                                                ║
751
║  ─────────────────                                                ║
752
║  1. Schmeichelhaftes Spiegelkabinett                            ║
753
║  2. Tribalismus & Instant Tribes                                 ║
754
║  3. Science Mimicry                                              ║
755
║  4. Ipsative Klarheit                                            ║
756
║  5. Narrative Identität                                          ║
757
║  6. Absolution                                                    ║
758
║  7. Shareability                                                  ║
759
║                                                                   ║
760
║  KO-KREATIONS-FORMEL                                             ║
761
║  ────────────────────                                             ║
762
║  Test liefert HÜLLE → Nutzer füllt mit BIOGRAFIE                 ║
763
║  → Entsteht SUBJEKTIVE WAHRHEIT → Wird GETEILT                   ║
764
║                                                                   ║
765
║  OUTPUT-FORMAT                                                    ║
766
║  ─────────────                                                    ║
767
║  • 9:16 Trading Card                                             ║
768
║  • Dramatischer Titel                                            ║
769
║  • Humorvolle Stats                                              ║
770
║  • Allies + Nemesis (Viral-Trigger!)                             ║
771
║                                                                   ║
772
║  PFLICHT-DISCLAIMER                                               ║
773
║  ─────────────────                                                ║
774
║  "Dieser Test dient der Selbstreflexion und stellt              ║
775
║   KEINE medizinische oder psychologische Diagnose dar."          ║
776
║                                                                   ║
777
╚═══════════════════════════════════════════════════════════════════╝

778
```

779
780
