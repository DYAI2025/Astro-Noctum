export type WissenArticle = {
  slug: string;
  title: string;
  category: string;
  readingTime: number;
  excerpt: string;
  body: string[];
};

export const WISSEN_ARTICLES: WissenArticle[] = [
  {
    slug: "solar-storms-and-inner-rhythm",
    title: "Solar Storms and Inner Rhythm",
    category: "Space Weather",
    readingTime: 4,
    excerpt:
      "Geomagnetic storms can alter atmospheric and electromagnetic conditions. Bazodiac maps this volatility into your ring intensity.",
    body: [
      "Space weather is measured through Kp index intensity values. Bazodiac uses these values as a transit modulation layer.",
      "This does not replace personal agency. It gives context about periods where energy can feel amplified.",
      "The mobile app keeps this signal available through lightweight polling and offline-safe fallback values."
    ]
  },
  {
    slug: "fusion-astrology-signal-logic",
    title: "Fusion Astrology Signal Logic",
    category: "Fusion Engine",
    readingTime: 5,
    excerpt:
      "Bazodiac merges western placements, BaZi pillars, Wu Xing element balance, and quiz events into one 12-sector vector.",
    body: [
      "Each source contributes weighted sector energy. Oppositional tension and neighboring pull smooth the resulting curve.",
      "Quiz events increase resolution over time, turning the ring from broad profile into sharper personal signature.",
      "Mobile and web share the same core math package to keep interpretation consistent across platforms."
    ]
  }
];
