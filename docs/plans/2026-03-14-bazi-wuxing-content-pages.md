# BaZi & WuXing Content Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 3 new SEO-Artikel (Wu Xing Detail, FAQ, Chinesische Astrologie vs. BaZi) zu `src/data/articles.ts` — Content aus FlashDocs-Dokumenten konvertiert ins bestehende `ArticleSection[]`-Format.

**Architecture:** Rein additive Änderung — nur `src/data/articles.ts` wird erweitert. Routing (`/wissen/:slug`), Rendering (`ArtikelPage.tsx`), Index (`WissenPage.tsx`) und `ArticleCard` funktionieren bereits generisch über das `ARTICLES`-Array. Keine neuen Komponenten nötig.

**Tech Stack:** TypeScript, bestehende `Article`/`ArticleSection` Interfaces aus `src/data/articles.ts`

---

## Übersicht der 3 neuen Artikel

| # | Slug | Titel | Quelle |
|---|------|-------|--------|
| 1 | `wu-xing-fuenf-wandlungsphasen` | Die Fünf Wandlungsphasen (Wu Xing) | `das_konzept_der_wu_xing_im_westen_oft_als_f.md` |
| 2 | `faq-bazi-wuxing` | FAQ: BaZi, WuXing und dein kosmischer Fingerabdruck | `faq_bazi_wuxing_und_dein_kosmischer_fingerabdruc.md` |
| 3 | `chinesische-astrologie-vs-bazi` | Chinesische Astrologie vs. BaZi Schicksalsanalyse | SEO-Teil aus `DOKU__save_2026-03-14_01-41-06.md` |

Alle 3 nutzen dasselbe Bild (`/images/artikel/bazi-wuxing.jpg`) das bereits existiert.

---

### Task 1: Artikel "Wu Xing — Fünf Wandlungsphasen"

**Files:**
- Modify: `src/data/articles.ts` (vor dem `];` am Ende des ARTICLES-Arrays)

**Step 1: Add Wu Xing article to ARTICLES array**

Füge diesen Artikel nach dem bestehenden `bazi-wuxing-energetische-landkarte` ein (vor `];` in Zeile 695):

```typescript
  {
    slug: 'wu-xing-fuenf-wandlungsphasen',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 10,
    title: 'Die Fünf Wandlungsphasen (Wu Xing)',
    subtitle: 'Holz, Feuer, Erde, Metall, Wasser — dynamische Energievektoren statt statischer Elemente',
    excerpt:
      'Das Konzept der Wu Xing (五行), im Westen oft als „Fünf Elemente" übersetzt, bildet das fundamentale Gerüst der chinesischen Metaphysik. Es handelt sich nicht um statische Materialien, sondern um dynamische Wandlungsphasen, die sich in einem ständigen Zustand der Metamorphose befinden.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'Die Fünf Wandlungsphasen — Holz, Feuer, Erde, Metall, Wasser im kosmischen Kreislauf',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'Wu Xing, Fünf Elemente, Wandlungsphasen, Holz, Feuer, Erde, Metall, Wasser, Qi, Hervorbringungszyklus, Kontrollzyklus, chinesische Metaphysik, BaZi, Persönlichkeitsanalyse',
    ctaText: 'Deine Wu-Xing-Balance entdecken',
    ctaHref: '/wu-xing',
    sections: [
      {
        type: 'p',
        content:
          'Das Konzept der Wu Xing (五行), im Westen oft als „Fünf Elemente" übersetzt, bildet das fundamentale Gerüst der chinesischen Metaphysik. In der professionellen Praxis wird betont, dass es sich hierbei nicht um statische Materialien handelt, sondern um dynamische Wandlungsphasen oder energetische Vektoren, die sich in einem ständigen Zustand der Metamorphose befinden. Das chinesische Wort Xing bedeutet wörtlich „Gehen" oder „Durchgang" und beschreibt den Fluss und Wandel von Energie (Qi).',
      },
      {
        type: 'h2',
        content: '1. Die fünf Wandlungsphasen und ihre Qualitäten',
      },
      {
        type: 'p',
        content: 'Jede Phase repräsentiert spezifische Charakterzüge und energetische Zustände:',
      },
      {
        type: 'h3',
        content: 'Holz (Mù)',
      },
      {
        type: 'p',
        content:
          'Steht für Wachstum, Kreativität, Vision und Flexibilität. Es ist die Energie der Expansion — wie ein junger Baum, der sich unaufhaltsam dem Licht entgegenstreckt.',
      },
      {
        type: 'h3',
        content: 'Feuer (Huǒ)',
      },
      {
        type: 'p',
        content:
          'Repräsentiert Leidenschaft, Dynamik, Transformation und Charisma. Es ist die Phase der maximalen Aktivität — strahlend, anziehend und transformierend.',
      },
      {
        type: 'h3',
        content: 'Erde (Tǔ)',
      },
      {
        type: 'p',
        content:
          'Symbolisiert Stabilität, Fürsorge, Geduld und Vermittlung. Sie dient als nährender Boden und Zentrum des Ausgleichs — der ruhende Pol im ewigen Wandel.',
      },
      {
        type: 'h3',
        content: 'Metall (Jīn)',
      },
      {
        type: 'p',
        content:
          'Steht für Präzision, Disziplin, Klarheit und Entschlossenheit. Es ist die Energie der Verdichtung und Struktur — scharf, klar und fokussiert.',
      },
      {
        type: 'h3',
        content: 'Wasser (Shuǐ)',
      },
      {
        type: 'p',
        content:
          'Repräsentiert Intuition, Anpassung, Tiefe und Weisheit. Es steht für das Fließen und die Ruhe — tiefgründig, anpassungsfähig und weise.',
      },
      {
        type: 'h2',
        content: '2. Die Dynamik der Interaktion: Die zwei Hauptzyklen',
      },
      {
        type: 'p',
        content:
          'Die Phasen existieren nicht isoliert, sondern interagieren über zwei fundamentale Mechanismen miteinander:',
      },
      {
        type: 'h3',
        content: 'Der Hervorbringungszyklus (Sheng): Das Prinzip der Nährung',
      },
      {
        type: 'p',
        content:
          'Dieser harmonische Fluss beschreibt, wie ein Element das nächste stärkt und unterstützt. In der Tradition wird dies mit dem Bild „Die Mutter nährt das Kind" beschrieben.',
      },
      {
        type: 'list',
        content: 'Der Kreislauf der Nährung:',
        items: [
          'Wasser lässt Holz wachsen (Regen nährt den Baum)',
          'Holz dient als Brennstoff für das Feuer',
          'Feuer hinterlässt Asche, die zu Erde wird',
          'In der Erde entstehen Erze (Metall)',
          'An Metall kondensiert Feuchtigkeit zu Wasser',
        ],
      },
      {
        type: 'h3',
        content: 'Der Kontrollzyklus (Ke): Das Prinzip der Regulation',
      },
      {
        type: 'p',
        content:
          'Dieser Zyklus ist notwendig, um Übermaß zu verhindern und Form zu geben. Er fungiert als Korrektiv und wird metaphorisch als „Der Großvater zügelt den Enkel" bezeichnet.',
      },
      {
        type: 'list',
        content: 'Der Kreislauf der Kontrolle:',
        items: [
          'Wasser löscht Feuer (Kühlung)',
          'Feuer schmilzt Metall (Formbarkeit)',
          'Metall schneidet Holz (Beschneiden von Wildwuchs)',
          'Holz durchdringt die Erde (Wurzeln lockern den Boden)',
          'Erde dämmt das Wasser (Kontrolle des Flusses)',
        ],
      },
      {
        type: 'h2',
        content: '3. Bedeutung für die Persönlichkeitsanalyse',
      },
      {
        type: 'p',
        content:
          'In Systemen wie BaZi wird die individuelle Balance dieser Elemente zum Zeitpunkt der Geburt analysiert. Das Ziel ist es, ein energetisches Gleichgewicht herzustellen.',
      },
      {
        type: 'list',
        content: 'Typische Ungleichgewichte:',
        items: [
          'Zu viel Nährung kann zu Stagnation oder Trägheit („Verwöhnung") führen',
          'Zu viel Kontrolle erzeugt Druck, Stress und Instabilität',
          'Spannungen entstehen oft, wenn ein dominantes Element nicht ausreichend reguliert wird (z. B. führt starkes Metall ohne kontrollierendes Feuer zu emotionaler Kälte)',
        ],
      },
      {
        type: 'highlight',
        content:
          'Innerhalb der Bazodiac-App fließt die WuXing-Verteilung mit einer Gewichtung von 20 % in die Masterformel deines Fusion Rings ein. So wird sichtbar, welche energetischen Phasen in dir besonders stark resonieren und wo das tägliche „Energiewetter" dich besonders trifft.',
      },
    ],
  },
```

**Step 2: Run type check**

Run: `npm run lint`
Expected: PASS (keine neuen Fehler, pre-existing `quizzme-module-loader.ts` Fehler ignorieren)

**Step 3: Verify article renders**

Run: `npm run dev`
Then open: `http://localhost:3000/wissen/wu-xing-fuenf-wandlungsphasen`
Expected: Article renders with all sections, image loads, CTA links to `/wu-xing`

**Step 4: Commit**

```bash
git add src/data/articles.ts
git commit -m "feat(wissen): add Wu Xing Fünf Wandlungsphasen article"
```

---

### Task 2: Artikel "FAQ: BaZi, WuXing und dein kosmischer Fingerabdruck"

**Files:**
- Modify: `src/data/articles.ts` (nach dem Wu-Xing-Artikel aus Task 1, vor `];`)

**Step 1: Add FAQ article to ARTICLES array**

Das FAQ-Format nutzt `h3` für Fragen und `p` für Antworten — die `renderSection()`-Funktion in `ArtikelPage.tsx` rendert das bereits korrekt.

```typescript
  {
    slug: 'faq-bazi-wuxing',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 6,
    title: 'FAQ: BaZi, WuXing und dein kosmischer Fingerabdruck',
    subtitle: 'Die wichtigsten Fragen und Antworten zu deiner energetischen Grundausstattung',
    excerpt:
      'Was ist BaZi? Wie unterscheidet es sich von der westlichen Astrologie? Und warum ist die Geburtsstunde so wichtig? Hier findest du Antworten auf die häufigsten Fragen rund um deine kosmische DNA.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'FAQ — BaZi und WuXing Fragen und Antworten zur chinesischen Metaphysik',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'BaZi FAQ, WuXing Fragen, Vier Säulen des Schicksals, Tagesmeister, Fusion Ring, chinesische Astrologie Unterschied, Geburtsstunde BaZi, Wahrsagerei, Selbsterkenntnis',
    ctaText: 'Dein kosmisches Profil entdecken',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'h3',
        content: '1. Was ist BaZi eigentlich?',
      },
      {
        type: 'p',
        content:
          'BaZi (八字), auch bekannt als die „Vier Säulen des Schicksals", ist ein jahrtausendealtes chinesisches System zur Persönlichkeitsanalyse. Statt nur dein Geburtsjahr zu betrachten, nutzt BaZi dein exaktes Geburtsdatum und die Uhrzeit, um eine Matrix aus acht Zeichen zu erstellen. Diese Zeichen beschreiben deine energetische Grundausstattung – sozusagen deine „kosmische DNA".',
      },
      {
        type: 'h3',
        content: '2. Wie unterscheidet sich BaZi von der westlichen Astrologie?',
      },
      {
        type: 'p',
        content:
          'Während die westliche Astrologie auf der geometrischen Position der Planeten am Himmel basiert, ist BaZi ein energetisch-klimatologisches Modell. Es nutzt das solare Jahr und die 24 Solartermine, um die „Temperatur" und Qualität der Energie (Qi) zu messen, die zum Zeitpunkt deiner Geburt herrschte. In Bazodiac werden beide Welten im Fusion Ring vereint, um ein vollständiges Bild zu ergeben.',
      },
      {
        type: 'h3',
        content: '3. Was bedeuten die „Vier Säulen"?',
      },
      {
        type: 'p',
        content: 'Dein Chart besteht aus vier vertikalen Einheiten, die jeweils einen Lebensaspekt repräsentieren:',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Jahr: Dein äußeres Auftreten und deine Rolle in der Gesellschaft',
          'Monat: Deine Karriere, Ambitionen und die mittlere Lebensphase',
          'Tag: Dein inneres Selbst – hier findet sich der wichtige Tagesmeister',
          'Stunde: Dein verborgenes Selbst, Träume und das Unterbewusstsein',
        ],
      },
      {
        type: 'h3',
        content: '4. Wer oder was ist der „Tagesmeister"?',
      },
      {
        type: 'p',
        content:
          'Der Tagesmeister ist das Herzstück deines BaZi-Charts. Er wird durch das Element bestimmt, das an deinem Geburtstag im „Himmelsstamm" steht. Er repräsentiert dich selbst in deiner reinsten Form. Alle anderen Zeichen im Chart werden in Bezug auf den Tagesmeister gedeutet: Nähren sie dich, fordern sie dich heraus oder kontrollieren sie dich?',
      },
      {
        type: 'h3',
        content: '5. Was hat WuXing mit meinem Charakter zu tun?',
      },
      {
        type: 'p',
        content:
          'WuXing beschreibt die Fünf Wandlungsphasen (Holz, Feuer, Erde, Metall, Wasser). In der BaZi-Analyse schauen wir uns die Balance dieser Elemente an. Ein Übermaß an Feuer kann beispielsweise für große Leidenschaft, aber auch für Impulsivität stehen, während ein starkes Metall-Element Präzision und Disziplin fördert. Das Ziel ist es, Spannungen zu erkennen und einen Ausgleich zu finden.',
      },
      {
        type: 'h3',
        content: '6. Wie kombiniert Bazodiac BaZi mit meinem westlichen Horoskop?',
      },
      {
        type: 'highlight',
        content:
          'Das ist die Besonderheit von Bazodiac: Die App nutzt eine Masterformel, die deine BaZi-Daten (30%), dein westliches Sternzeichen (30%), die WuXing-Elemente (20%) und deine Ergebnisse aus den Persönlichkeits-Quizzes (20%) zu einem einzigen Signal verschmilzt. Das Ergebnis ist der Fusion Ring – eine lebendige Visualisierung deiner Identität, die sich mit den täglichen Planetentransiten verändert.',
      },
      {
        type: 'h3',
        content: '7. Warum ist meine Geburtsstunde so wichtig?',
      },
      {
        type: 'p',
        content:
          'Ohne die Geburtsstunde fehlt die vierte Säule (die Stundensäule). Diese Säule liefert wertvolle Informationen über deine tiefsten Wünsche und dein verborgenes Potenzial. Während das BaZi-Chart auch ohne Stunde zu etwa 75% interpretierbar bleibt, ist die exakte Zeit für eine vollständige Analyse und die Berechnung bestimmter Sektoren im Fusion Ring unerlässlich.',
      },
      {
        type: 'h3',
        content: '8. Ist BaZi Wahrsagerei oder Schicksalsglaube?',
      },
      {
        type: 'p',
        content:
          'Nein. Bazodiac versteht BaZi als ein Instrument zur Selbsterkenntnis. Es zeigt dir deine Resonanzflächen auf – also die Bereiche, in denen du besonders sensibel oder stark auf äußere Einflüsse (wie das „Energiewetter") reagierst. Es geht nicht darum, was passieren muss, sondern darum, wie du deine Anlagen optimal nutzt, um dein Leben selbstbestimmt zu gestalten.',
      },
      {
        type: 'quote',
        content:
          'Möchtest du mehr über die einzelnen Tiere oder die Berechnungslogik erfahren? Lies unseren ausführlichen Artikel über die Fünf Wandlungsphasen oder entdecke dein persönliches BaZi-Profil im Fusion Ring.',
      },
    ],
  },
```

**Step 2: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 3: Verify article renders**

Open: `http://localhost:3000/wissen/faq-bazi-wuxing`
Expected: FAQ renders with h3 questions + p answers, highlight box for Q6, list for Q3

**Step 4: Commit**

```bash
git add src/data/articles.ts
git commit -m "feat(wissen): add BaZi/WuXing FAQ article"
```

---

### Task 3: Artikel "Chinesische Astrologie vs. BaZi Schicksalsanalyse"

**Files:**
- Modify: `src/data/articles.ts` (nach FAQ-Artikel, vor `];`)

**Step 1: Add SEO article to ARTICLES array**

Dieser Artikel ist der SEO-Text aus dem DOKU-Dokument — tiefergehend als der bestehende `bazi-wuxing-energetische-landkarte`, fokussiert auf den **Unterschied** zwischen populärer chinesischer Astrologie und professioneller BaZi-Analyse.

```typescript
  {
    slug: 'chinesische-astrologie-vs-bazi',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 8,
    title: 'Chinesische Astrologie vs. BaZi Schicksalsanalyse',
    subtitle: 'Ein tiefer Einblick in deine kosmische DNA — warum „Ich bin ein Tiger" nur die Oberfläche ist',
    excerpt:
      'In der westlichen Welt wird „Chinesische Astrologie" oft synonym mit dem Tierkreiszeichen des Geburtsjahres verwendet. Doch das ist nur die Spitze des Eisbergs. Das eigentliche System zur Analyse des menschlichen Potenzials ist die BaZi Schicksalsanalyse.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'BaZi Schicksalsanalyse — die Vier Säulen des Schicksals und deine kosmische DNA',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'chinesische Astrologie, BaZi Schicksalsanalyse, Vier Säulen des Schicksals, Tagesmeister, kosmische DNA, Tierkreiszeichen, Glückszyklen, energetisches Profil, WuXing, Geburtsdatum',
    ctaText: 'Deine kosmische DNA entschlüsseln',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'In der westlichen Welt wird der Begriff „Chinesische Astrologie" oft synonym mit dem Tierkreiszeichen des Geburtsjahres verwendet. Man sagt: „Ich bin ein Tiger" oder „Ich bin ein Drache". Doch das ist nur die Spitze des Eisbergs. Das eigentliche, tiefgründige System zur Analyse des menschlichen Schicksals und Potenzials ist die BaZi Schicksalsanalyse, auch bekannt als die Vier Säulen des Schicksals.',
      },
      {
        type: 'p',
        content:
          'Während sich die populäre Astrologie auf das Jahr beschränkt, berücksichtigt BaZi den exakten Moment deiner Geburt: Jahr, Monat, Tag und Stunde. Aus diesen vier Datenpunkten wird ein komplexes Chart aus acht Zeichen (Himmelsstämme und Erdzweige) erstellt, das ein präzises energetisches Profil deiner Persönlichkeit, deiner Talente, Stärken, Schwächen und deines Lebenswegs liefert.',
      },
      {
        type: 'h2',
        content: 'BaZi: Mehr als nur ein Horoskop',
      },
      {
        type: 'p',
        content:
          'BaZi ist kein System zur Wahrsagerei, das feste Zukunftsprognosen macht. Es ist ein Werkzeug zur Selbsterkenntnis und bewussten Lebensgestaltung. Es zeigt die energetischen Rhythmen und Zyklen deines Lebens auf.',
      },
      {
        type: 'h3',
        content: 'Wer bist du wirklich?',
      },
      {
        type: 'p',
        content:
          'Der Tagesmeister im BaZi ist dein Kern-Ich. Seine Stärke und Beziehung zu den anderen Elementen in deinem Chart definiert deine grundlegendste Natur.',
      },
      {
        type: 'h3',
        content: 'Welche Potenziale liegen in dir?',
      },
      {
        type: 'p',
        content:
          'Die Kombination der Fünf Elemente (WuXing: Holz, Feuer, Erde, Metall, Wasser) und der 12 Tiere in deinem Chart offenbart verborgene Talente, emotionale Muster und wie du mit deiner Umwelt interagierst.',
      },
      {
        type: 'h3',
        content: 'Wann sind gute Zeiten für Veränderungen?',
      },
      {
        type: 'p',
        content:
          'Durch die Analyse der Glückszyklen (10-Jahres-Zyklen) und Jahresenergien kannst du erkennen, wann du Rückenwind für Karriere, Partnerschaft oder Gesundheit hast und wann Vorsicht geboten ist.',
      },
      {
        type: 'h2',
        content: 'Warum eine professionelle BaZi-Analyse wichtig ist',
      },
      {
        type: 'p',
        content:
          'Ein einfacher Online-Rechner kann dir die Zeichen deines Charts nennen, aber nicht deren tiefe Bedeutung und Wechselwirkungen interpretieren. Eine professionelle Analyse hilft dir:',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Deine Berufung zu finden: Welche Berufe entsprechen deinen energetischen Stärken?',
          'Beziehungen besser zu verstehen: Wie passen du und dein Partner, deine Familie oder Kollegen energetisch zusammen?',
          'Die Gesundheit zu fördern: Welche energetischen Ungleichgewichte könnten sich physisch manifestieren?',
        ],
      },
      {
        type: 'quote',
        content:
          'Vermeide die Vereinfachung der populären Astrologie. Tauche ein in die Tiefe deiner kosmischen DNA mit einer fundierten BaZi Schicksalsanalyse.',
      },
    ],
  },
```

**Step 2: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 3: Verify article renders**

Open: `http://localhost:3000/wissen/chinesische-astrologie-vs-bazi`
Expected: Article renders correctly, CTA links to `/fu-ring`

**Step 4: Commit**

```bash
git add src/data/articles.ts
git commit -m "feat(wissen): add Chinesische Astrologie vs. BaZi SEO article"
```

---

### Task 4: Verify /wissen Index and Cross-Links

**Files:**
- No changes — verification only

**Step 1: Check /wissen index page**

Open: `http://localhost:3000/wissen`
Expected:
- Alle 10 Artikel sichtbar (6 bestehende + 1 bereits vorhandener BaZi + 3 neue)
- Kategorie-Filter zeigt "Chinesische Metaphysik" als neue Kategorie
- Featured article (erster Artikel) bleibt "Weltraumwetter"
- Grid zeigt die neuen Artikel mit Bild und Excerpt

**Step 2: Check "Weitere Artikel" section on each new article**

Open each new article and verify the "Weitere Artikel" section at the bottom shows 2 related articles.

**Step 3: Check LandingHero article previews still work**

Open: `http://localhost:3000` (unauthenticated)
Expected: Article previews in LandingHero still show correctly

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(wissen): adjust article rendering for new content"
```

---

## Zusammenfassung

| Task | Was | Datei | Geschätzt |
|------|-----|-------|-----------|
| 1 | Wu Xing Artikel | `articles.ts` | ~5 min |
| 2 | FAQ Artikel | `articles.ts` | ~5 min |
| 3 | Astrologie vs. BaZi SEO | `articles.ts` | ~5 min |
| 4 | Verification | — | ~3 min |

**Gesamtaufwand:** ~18 Minuten. Rein additive Änderung, kein Risiko für bestehende Funktionalität.

**Hinweis:** Alle 3 neuen Artikel nutzen dasselbe Bild (`bazi-wuxing.jpg`). Wenn individuelle Bilder gewünscht sind, müssen diese separat beschafft und in `public/images/artikel/` abgelegt werden.
