export const TIME_MAX = 12;

export const locationIds = [
  "pup",
  "campus",
  "bank",
  "zajezdnia",
  "cafe",
  "elektro",
  "gym",
  "home",
  "shop",
  "lombard",
  "kebab",
] as const;

export type LocationId = (typeof locationIds)[number];
export type LocationToken = LocationId;
export type LocationNameKey = `loc${Capitalize<LocationId>}`;

export type GridCol = 1 | 2 | 3 | 4;
export type GridRow = 1 | 2 | 3 | 4;

export type LocationPreview = {
  id: LocationId;
  nameKey: LocationNameKey;
  token: LocationToken;
  /** Siatka 4×3 na desktopie. */
  col: GridCol;
  row: GridRow;
  /** Siatka 3×4 na telefonie. */
  mobileCol: GridCol;
  mobileRow: GridRow;
};

export const locationPreview: readonly LocationPreview[] = [
  { id: "pup", nameKey: "locPup", token: "pup", col: 1, row: 1, mobileCol: 1, mobileRow: 1 },
  { id: "campus", nameKey: "locCampus", token: "campus", col: 2, row: 1, mobileCol: 2, mobileRow: 1 },
  { id: "bank", nameKey: "locBank", token: "bank", col: 3, row: 1, mobileCol: 3, mobileRow: 1 },
  { id: "zajezdnia", nameKey: "locZajezdnia", token: "zajezdnia", col: 4, row: 1, mobileCol: 3, mobileRow: 2 },
  { id: "cafe", nameKey: "locCafe", token: "cafe", col: 1, row: 2, mobileCol: 1, mobileRow: 2 },
  { id: "elektro", nameKey: "locElektro", token: "elektro", col: 3, row: 2, mobileCol: 3, mobileRow: 3 },
  { id: "gym", nameKey: "locGym", token: "gym", col: 4, row: 2, mobileCol: 1, mobileRow: 4 },
  { id: "home", nameKey: "locHome", token: "home", col: 1, row: 3, mobileCol: 1, mobileRow: 3 },
  { id: "shop", nameKey: "locShop", token: "shop", col: 2, row: 3, mobileCol: 2, mobileRow: 3 },
  { id: "lombard", nameKey: "locLombard", token: "lombard", col: 3, row: 3, mobileCol: 2, mobileRow: 4 },
  { id: "kebab", nameKey: "locKebab", token: "kebab", col: 4, row: 3, mobileCol: 3, mobileRow: 4 },
];

/** Skwer: dekoracja, nie lokacja. */
export const parkCell = { col: 2 as GridCol, row: 2 as GridRow, mobileCol: 2 as GridCol, mobileRow: 2 as GridRow };
