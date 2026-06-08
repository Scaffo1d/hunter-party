import { describe, expect, it } from "vitest";
import { allBosses, allEquipment, OPPORTUNITY_DECK } from "../data/catalog";
import { validateBoardGraph } from "../board/validateBoardGraph";
import { loadBoardGraph } from "../board/graph";
import { applyGameAction, applySkipPhase } from "./actions";
import { createInitialGameState } from "./state";

describe("integration scenarios", () => {
  it("loads full game data catalogs", () => {
    expect(allEquipment().length).toBeGreaterThan(50);
    expect(allBosses().length).toBe(44);
    expect(OPPORTUNITY_DECK).toHaveLength(13);
  });

  it("validates board graph for v1 play", () => {
    const graph = loadBoardGraph();
    const result = validateBoardGraph(graph);
    expect(graph.nodes).toHaveLength(80);
    expect(result.counts.O).toBe(12);
    expect(graph.nodes.filter((n) => n.isStarting).length).toBe(4);
  });

  it("simulates 4-player session through movement and tile resolution", () => {
    const players = [
      { id: "a", name: "P1", color: "#f00" },
      { id: "b", name: "P2", color: "#0f0" },
      { id: "c", name: "P3", color: "#00f" },
      { id: "d", name: "P4", color: "#ff0" },
    ];
    let state = createInitialGameState(players);

    for (const player of players) {
      expect(state.activePlayerId).toBe(player.id);
      state = applySkipPhase(state, player.id).state;
      state = applySkipPhase(state, player.id).state;
      const rolled = applyGameAction(state, player.id, { type: "rollDice" });
      expect(rolled.ok).toBe(true);
      state = rolled.state;

      while (state.pendingPrompt?.type === "choosePath") {
        const nodeId = (state.pendingPrompt.options as string[])[0];
        state = applyGameAction(state, player.id, { type: "choosePath", payload: { nodeId } }).state;
      }
      while (state.pendingPrompt) {
        state = applyGameAction(state, player.id, {
          type: "promptChoice",
          payload: { choice: "continue" },
        }).state;
      }
      if (state.phase === "tile") {
        state = applyGameAction(state, player.id, { type: "tileContinue" }).state;
      }
      if (state.phase === "equip") {
        state = applySkipPhase(state, player.id).state;
      }
    }

    expect(state.activePlayerId).toBe(players[0].id);
    expect(state.players.every((p) => p.nodeId)).toBe(true);
  });
});
