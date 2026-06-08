export type TileType =
  | "O" | "B" | "R" | "MD" | "TP" | "H" | "E" | "C" | "CA" | "GA" | "KF" | "T" | "L"
  | "S1" | "S2" | "S3" | "S4";

export type BossRarity = "common" | "rare" | "epic" | "relic";
export type PathLayer = "outer" | "inner";
export type ThemeQuadrant = "tundra" | "volcano" | "ocean" | "mountains";
export type LabelColor = "green" | "grey" | "blue" | "red" | "pink" | "orange" | "white" | "yellow";
export type StartingSeat = "S1" | "S2" | "S3" | "S4";

export interface BoardNode {
  id: string;
  tileType: TileType;
  bossRarity: BossRarity | null;
  pathLayer: PathLayer;
  theme: ThemeQuadrant;
  labelColor: LabelColor;
  isCrossroad: boolean;
  isStarting: StartingSeat | null;
  x: number;
  y: number;
  sequence: number;
  /** Normalized square side length (fraction of board width). */
  tileSize?: number;
}

export interface BoardEdge {
  from: string;
  to: string;
  bidirectional: boolean;
}

export interface BoardGraphMeta {
  cutLine: { from: StartingSeat; to: StartingSeat };
  shopArea?: { x: number; y: number; w: number; h: number };
  bankArea?: { x: number; y: number; w: number; h: number };
  importedFromSketch?: boolean;
  needsLabelCount?: number;
  tilePixelSize?: number;
}

export interface BoardGraph {
  version: 1;
  nodes: BoardNode[];
  edges: BoardEdge[];
  meta: BoardGraphMeta;
}

export type TraceMode = "place" | "connect" | "select" | "pan";
