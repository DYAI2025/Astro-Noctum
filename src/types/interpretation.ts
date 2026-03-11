export interface TileTexts {
  sun?: string;
  moon?: string;
  yearAnimal?: string;
  dominantWuXing?: string;
  dayMaster?: string;
}

export interface HouseTexts {
  [houseNumber: string]: string;
}

export interface InterpretationResponse {
  interpretation: string;
  tiles: TileTexts;
  houses: HouseTexts;
}
