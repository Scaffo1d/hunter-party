import { describe, expect, it } from "vitest";
import { getNeighbors, getStartingNode, loadBoardGraph } from "./graph";
import { legalNextNodes, moveAlongPath } from "./movement";
import { createInitialGameState, advancePhase } from "../game/state";
import { validateBoardGraph } from "./validateBoardGraph";

describe("board graph", () => {
  const graph = loadBoardGraph();

  it("loads 80 nodes and full edge set from board.graph.json", () => {
    expect(graph.nodes).toHaveLength(80);
    expect(graph.edges.length).toBeGreaterThanOrEqual(80);
  });

  it("has 12 O tiles, 5 R tiles, four starts, and no orphans", () => {
    const result = validateBoardGraph(graph);
    expect(result.counts.O).toBe(12);
    expect(result.counts.R).toBe(5);
    expect(graph.nodes.filter((n) => n.isStarting).length).toBe(4);
    const orphans = result.warnings.filter((w) => w.message.includes("Orphan"));
    expect(orphans).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("connects neighbors along edges", () => {
    const s1 = getStartingNode(graph, "S1");
    expect(s1).toBeDefined();
    const neighbors = getNeighbors(graph, s1!.id);
    expect(neighbors.length).toBeGreaterThan(0);
  });
});

describe("movement", () => {
  const graph = loadBoardGraph();
  const s1 = getStartingNode(graph, "S1")!;

  it("returns legal neighbors for start", () => {
    const next = legalNextNodes(s1.id, "S1", graph);
    expect(next.length).toBeGreaterThan(0);
  });

  it("moves along path for N steps", () => {
    const end = moveAlongPath(s1.id, 2, "S1", [], graph);
    expect(end).not.toBe(s1.id);
  });
});

describe("game state", () => {
  it("creates initial state for 2 players", () => {
    const state = createInitialGameState([
      { id: "p1", name: "Alice", color: "#f00" },
      { id: "p2", name: "Bob", color: "#00f" },
    ]);
    expect(state.players).toHaveLength(2);
    expect(state.phase).toBe("opportunity");
    expect(state.players[0].currencies.G).toBe(2);
    expect(state.players[1].currencies.G).toBe(3);
  });

  it("advances turn phases", () => {
    let state = createInitialGameState([
      { id: "p1", name: "A", color: "#f00" },
      { id: "p2", name: "B", color: "#00f" },
    ]);
    state = advancePhase(state);
    expect(state.phase).toBe("shop");
  });
});
