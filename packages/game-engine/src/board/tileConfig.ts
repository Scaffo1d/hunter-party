import type { BossRarity, LabelColor, TileType } from "./types";

export interface TileTypeConfig {
  tileType: TileType;
  label: string;
  labelColor: LabelColor;
  description: string;
}

export const TILE_TYPE_CONFIGS: TileTypeConfig[] = [
  { tileType: "O", label: "O", labelColor: "green", description: "Draw 1 opportunity card" },
  { tileType: "B", label: "B", labelColor: "grey", description: "Boss tile" },
  { tileType: "R", label: "R", labelColor: "yellow", description: "Relic boss" },
  { tileType: "MD", label: "MD", labelColor: "pink", description: "Magic Dice counter" },
  { tileType: "TP", label: "TP", labelColor: "blue", description: "Teleportal" },
  { tileType: "H", label: "H", labelColor: "blue", description: "Hospital" },
  { tileType: "E", label: "E", labelColor: "red", description: "Exchange" },
  { tileType: "C", label: "C", labelColor: "red", description: "Cave" },
  { tileType: "CA", label: "CA", labelColor: "green", description: "Casino" },
  { tileType: "GA", label: "GA", labelColor: "orange", description: "Grand Auction" },
  { tileType: "KF", label: "KF", labelColor: "orange", description: "King\'s Favor" },
  { tileType: "T", label: "T", labelColor: "white", description: "Taxman" },
  { tileType: "L", label: "L", labelColor: "red", description: "Loot" },
  { tileType: "S1", label: "S1", labelColor: "blue", description: "Start P1 (top)" },
  { tileType: "S2", label: "S2", labelColor: "blue", description: "Start P2 (left)" },
  { tileType: "S3", label: "S3", labelColor: "blue", description: "Start P3 (bottom)" },
  { tileType: "S4", label: "S4", labelColor: "blue", description: "Start P4 (right)" },
];

export const BOSS_RARITY_COLORS: Record<BossRarity, LabelColor> = {
  common: "grey", rare: "blue", epic: "red", relic: "yellow",
};

export function defaultLabelColor(tileType: TileType, bossRarity: BossRarity | null): LabelColor {
  if (tileType === "B" && bossRarity) return BOSS_RARITY_COLORS[bossRarity];
  return TILE_TYPE_CONFIGS.find((c) => c.tileType === tileType)?.labelColor ?? "white";
}

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  green: "#22c55e", grey: "#9ca3af", blue: "#3b82f6", red: "#ef4444",
  pink: "#d946ef", orange: "#f97316", white: "#f8fafc", yellow: "#eab308",
};
