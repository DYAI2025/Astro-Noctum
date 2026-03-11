const ZODIAC_ART: Record<string, string> = {
  Aries:       "/zodiac/aries.webp",
  Taurus:      "/zodiac/taurus.webp",
  Gemini:      "/zodiac/gemini.webp",
  Cancer:      "/zodiac/cancer.webp",
  Leo:         "/zodiac/lion.webp",
  Virgo:       "/zodiac/virgo.webp",
  Libra:       "/zodiac/libra.webp",
  Scorpio:     "/zodiac/scorpion.webp",
  Sagittarius: "/zodiac/sagitarius.webp",
  Capricorn:   "/zodiac/capricorn.webp",
  Aquarius:    "/zodiac/aquarius.webp",
  Pisces:      "/zodiac/pisces.webp",
};

export function getZodiacArt(sign: string): string | undefined {
  return ZODIAC_ART[sign];
}
