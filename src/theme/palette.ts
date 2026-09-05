export const palette = {
  paper: "#E8DCC8",
  ink: "#2B2622",
  road: "#4A5560",
  park: "#7A8F6A",
  pup: "#C4B8A4",
  shop: "#E2B84A",
  kebab: "#D4652F",
  bank: "#3D6B8C",
  campus: "#6B4F7A",
  gym: "#3F7A6B",
  cafe: "#A45C4A",
  home: "#8B6B4A",
  accent: "#D4652F",
} as const;

export type PaletteToken = keyof typeof palette;
