import { getNeighbors, getNode, loadBoardGraph } from "./graph";
import type { BoardGraph, StartingSeat } from "./types";

const graph = () => loadBoardGraph();

/** Cut line S1(top) ↔ S3(bottom): left side cannot turn right; right cannot turn left. */
export function isCutLineRestricted(
  playerSeat: StartingSeat,
  fromNodeId: string,
  toNodeId: string,
  g: BoardGraph = graph(),
): boolean {
  const from = getNode(g, fromNodeId);
  const to = getNode(g, toNodeId);
  if (!from || !to) return true;

  const midX = 0.5;
  const onLeft = from.x < midX;
  const onRight = from.x > midX;

  if (playerSeat === "S1" || playerSeat === "S3") {
    if (onLeft && to.x > from.x + 0.02) return true;
    if (onRight && to.x < from.x - 0.02) return true;
  }
  return false;
}

export function legalNextNodes(
  nodeId: string,
  playerSeat: StartingSeat,
  g: BoardGraph = graph(),
): string[] {
  return getNeighbors(g, nodeId).filter(
    (n) => !isCutLineRestricted(playerSeat, nodeId, n, g),
  );
}

export function moveAlongPath(
  startNodeId: string,
  steps: number,
  playerSeat: StartingSeat,
  chosenDirs: string[] = [],
  g: BoardGraph = graph(),
): string {
  let current = startNodeId;
  let remaining = steps;

  while (remaining > 0) {
    const options = legalNextNodes(current, playerSeat, g);
    if (options.length === 0) break;

    let next: string;
    if (options.length === 1) {
      next = options[0];
    } else {
      const pick = chosenDirs.shift();
      next = pick && options.includes(pick) ? pick : options[0];
    }
    current = next;
    remaining -= 1;
  }
  return current;
}
