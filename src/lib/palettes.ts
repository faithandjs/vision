// Generated alongside the palette CSS in globals.css; keep the two in sync.
export const PALETTES = [
  { id: "sage", name: "Sage & Cream", light: { bg: "#f1e8c7", accent: "#9ca764", deep: "#5b6830" }, dark: { bg: "#161910", accent: "#9ca764", deep: "#bcc883" } },
  { id: "blush", name: "Blush & Ivory", light: { bg: "#fcf1ef", accent: "#eaa9b2", deep: "#a0465a" }, dark: { bg: "#1d1416", accent: "#eaa9b2", deep: "#f2bcc4" } },
  { id: "lavender", name: "Lavender & Mist", light: { bg: "#f4f1fb", accent: "#bcabe8", deep: "#6a4fb3" }, dark: { bg: "#16131f", accent: "#bcabe8", deep: "#d0c3f4" } },
  { id: "sky", name: "Sky & Cloud", light: { bg: "#eef5fa", accent: "#a3cdea", deep: "#2c6a94" }, dark: { bg: "#10171d", accent: "#a3cdea", deep: "#bcddf3" } },
  { id: "peach", name: "Peach & Sand", light: { bg: "#fcf2e8", accent: "#f4ba98", deep: "#9e5328" }, dark: { bg: "#1c1510", accent: "#f4ba98", deep: "#f7cdb3" } },
  { id: "mint", name: "Mint & Linen", light: { bg: "#eef7f2", accent: "#a5dac5", deep: "#2b725b" }, dark: { bg: "#101a16", accent: "#a5dac5", deep: "#c0e7d7" } },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export const PALETTE_IDS = PALETTES.map((p) => p.id) as readonly PaletteId[];
export const DEFAULT_PALETTE: PaletteId = "sage";
