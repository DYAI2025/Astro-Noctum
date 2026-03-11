// Maps English animal names (as returned by BAFE API) to coin asset paths.
// Note: BAFE returns "Ox" but file is "buffalo", "Rooster" but file is "cock".

const COIN_MAP: Record<string, string> = {
  rat:     "/coins/rat.webp",
  ox:      "/coins/buffalo.webp",
  tiger:   "/coins/tiger.webp",
  rabbit:  "/coins/rabbit.webp",
  dragon:  "/coins/dragon.webp",
  snake:   "/coins/snake.webp",
  horse:   "/coins/horse.webp",
  goat:    "/coins/goat.webp",
  monkey:  "/coins/monkey.webp",
  rooster: "/coins/cock.webp",
  dog:     "/coins/dog.webp",
  pig:     "/coins/pig.webp",
};

export function getCoinAsset(animal: string): string | undefined {
  if (!animal) return undefined;
  return COIN_MAP[animal.toLowerCase()];
}
