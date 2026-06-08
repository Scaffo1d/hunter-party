import type { BoardEdge, BoardGraph, BoardNode, StartingSeat } from "./types";
import boardGraphData from "../../data/board.graph.json";

let cached: BoardGraph | null = null;

export function loadBoardGraph(): BoardGraph {
  if (!cached) cached = boardGraphData as BoardGraph;
  return cached;
}

export function getNode(graph: BoardGraph, nodeId: string): BoardNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

export function getNeighbors(graph: BoardGraph, nodeId: string): string[] {
  const ids = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === nodeId) ids.add(edge.to);
    if (edge.to === nodeId) ids.add(edge.from);
  }
  return [...ids];
}

export function getStartingNode(graph: BoardGraph, seat: StartingSeat): BoardNode | undefined {
  return graph.nodes.find((n) => n.isStarting === seat || n.tileType === seat);
}

export function edgeBetween(graph: BoardGraph, a: string, b: string): BoardEdge | undefined {
  return graph.edges.find(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
  );
}
