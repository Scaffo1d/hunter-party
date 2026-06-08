import type { BoardGraph, BoardNode } from "./types";

export interface BoardValidationWarning { level: "warn" | "error"; message: string; }
export interface BoardValidationResult { warnings: BoardValidationWarning[]; counts: Record<string, number>; }

export function validateBoardGraph(graph: BoardGraph): BoardValidationResult {
  const warnings: BoardValidationWarning[] = [];
  const counts: Record<string, number> = {};
  for (const node of graph.nodes) counts[node.tileType] = (counts[node.tileType] ?? 0) + 1;

  if ((counts.O ?? 0) !== 12) warnings.push({ level: "warn", message: `Expected 12 O tiles, found ${counts.O ?? 0}` });
  if ((counts.R ?? 0) !== 5) warnings.push({ level: "warn", message: `Expected 5 R tiles, found ${counts.R ?? 0}` });
  for (const seat of ["S1","S2","S3","S4"] as const) {
    if (!graph.nodes.some((n) => n.tileType === seat || n.isStarting === seat))
      warnings.push({ level: "warn", message: `Missing starting position ${seat}` });
  }
  for (const node of graph.nodes) {
    if (node.tileType === "B" && !node.bossRarity)
      warnings.push({ level: "warn", message: `Boss ${node.id} missing rarity` });
  }
  const connected = new Set(graph.edges.flatMap((e) => [e.from, e.to]));
  for (const node of graph.nodes) {
    if (!connected.has(node.id))
      warnings.push({ level: "warn", message: `Orphan node ${node.id} (${node.tileType})` });
  }
  return { warnings, counts };
}

export function createEmptyBoardGraph(): BoardGraph {
  return { version: 1, nodes: [], edges: [], meta: { cutLine: { from: "S1", to: "S3" } } };
}
