// ── Coin Asset Lookup ─────────────────────────────────────────────────────
//
// Maps English animal names (as returned by BAFE API) to coin asset paths.
// Assets live in media/coins/ (Vite publicDir).
//
// Numbering follows dev brief asset inventory:
//   1=Rat, 2=Rooster, 3=Ox, 4=Dog, 5=Tiger, 6=Rabbit,
//   7=Goat, 8=Dragon, 9=Snake, 10=Pig, 11=Horse, 12=Monkey

const COIN_MAP: Record<string, string> = {
  rat:     "/coins/1.webp",
  rooster: "/coins/2.webp",
  ox:      "/coins/3.webp",
  dog:     "/coins/4.webp",
  tiger:   "/coins/5.webp",
  rabbit:  "/coins/6.webp",
  goat:    "/coins/7.webp",
  dragon:  "/coins/8.webp",
  snake:   "/coins/9.webp",
  pig:     "/coins/10.webp",
  horse:   "/coins/11.webp",
  monkey:  "/coins/12.webp",
};

/**
 * Get the coin asset path for a given animal.
 * Returns undefined if the animal is unknown.
 */
export function getCoinAsset(animal: string): string | undefined {
  if (!animal) return undefined;
  return COIN_MAP[animal.toLowerCase()];
}
