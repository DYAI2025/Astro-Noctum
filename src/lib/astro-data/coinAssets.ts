// ── Coin Asset Lookup ─────────────────────────────────────────────────────
//
// Maps English animal names (as returned by BAFE API) to coin asset paths.
// Assets live in media/coins/ (Vite publicDir).
//
// Numbering follows dev brief asset inventory:
//   1=Rat, 2=Rooster, 3=Ox, 4=Dog, 5=Tiger, 6=Rabbit,
//   7=Goat, 8=Dragon, 9=Snake, 10=Pig, 11=Horse, 12=Monkey

const COIN_MAP: Record<string, string> = {
  rat:     "/coins/1.png",
  rooster: "/coins/2.png",
  ox:      "/coins/3.png",
  dog:     "/coins/4.png",
  tiger:   "/coins/5.png",
  rabbit:  "/coins/6.png",
  goat:    "/coins/7.png",
  dragon:  "/coins/8.png",
  snake:   "/coins/9.png",
  pig:     "/coins/10.png",
  horse:   "/coins/11.png",
  monkey:  "/coins/12.png",
};

/**
 * Get the coin asset path for a given animal.
 * Returns undefined if the animal is unknown.
 */
export function getCoinAsset(animal: string): string | undefined {
  if (!animal) return undefined;
  return COIN_MAP[animal.toLowerCase()];
}
