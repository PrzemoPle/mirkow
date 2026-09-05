export const TIME_MAX = 10;

export const locationIds = [
  "pup",
  "campus",
  "bank",
  "cafe",
  "gym",
  "home",
  "shop",
  "kebab",
] as const;

export type LocationId = (typeof locationIds)[number];
export type LocationToken = LocationId;
export type LocationNameKey = `loc${Capitalize<LocationId>}`;

export type LocationPreview = {
  id: LocationId;
  nameKey: LocationNameKey;
  token: LocationToken;
  col: 1 | 2 | 3;
  row: 1 | 2 | 3;
};

export const locationPreview: readonly LocationPreview[] = [
  { id: "pup", nameKey: "locPup", token: "pup", col: 1, row: 1 },
  { id: "campus", nameKey: "locCampus", token: "campus", col: 2, row: 1 },
  { id: "bank", nameKey: "locBank", token: "bank", col: 3, row: 1 },
  { id: "cafe", nameKey: "locCafe", token: "cafe", col: 1, row: 2 },
  { id: "gym", nameKey: "locGym", token: "gym", col: 3, row: 2 },
  { id: "home", nameKey: "locHome", token: "home", col: 1, row: 3 },
  { id: "shop", nameKey: "locShop", token: "shop", col: 2, row: 3 },
  { id: "kebab", nameKey: "locKebab", token: "kebab", col: 3, row: 3 },
];
