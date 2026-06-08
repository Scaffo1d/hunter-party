import { describe, expect, it } from "vitest";
import { loadBoardGraph } from "../board/graph";
import { resolveAttack } from "../combat/combat";
import { OPPORTUNITY_CARDS } from "../opportunity/handlers";
import {
  applyGameAction,
  applyRollDice,
  applySkipPhase,
} from "./actions";
import { createInitialGameState, advancePhase } from "./state";

const fourPlayers = [
  { id: "p1", name: "North", color: "#ef4444" },
  { id: "p2", name: "West", color: "#3b82f6" },
  { id: "p3", name: "South", color: "#22c55e" },
  { id: "p4", name: "East", color: "#eab308" },
];

describe("4-player game flow", () => {
  it("runs full turn cycle for 4 players", () => {
    let state = createInitialGameState(fourPlayers);
    state.roomCode = "TEST01";
    expect(state.players).toHaveLength(4);
    expect(state.players[0].seat).toBe("S1");
    expect(state.players[3].seat).toBe("S4");

    const phases: string[] = [];
    const startPlayer = state.activePlayerId;

    const completeTurn = (pid: string) => {
      let r = applySkipPhase(state, pid);
      expect(r.ok).toBe(true);
      state = r.state;
      expect(state.phase).toBe("shop");

      r = applySkipPhase(state, pid);
      state = r.state;
      expect(state.phase).toBe("dice");

      r = applyRollDice(state, pid);
      expect(r.ok).toBe(true);
      state = r.state;

      while (state.pendingPrompt?.type === "choosePath") {
        const nodeId = (state.pendingPrompt.options as string[])[0];
        r = applyGameAction(state, pid, { type: "choosePath", payload: { nodeId } });
        expect(r.ok).toBe(true);
        state = r.state;
      }

      while (state.pendingPrompt && state.pendingPrompt.type !== "choosePath") {
        r = applyGameAction(state, pid, { type: "promptChoice", payload: { choice: "continue" } });
        state = r.state;
      }

      if (state.phase === "tile" && !state.pendingPrompt && !state.movement) {
        r = applyGameAction(state, pid, { type: "tileContinue" });
        expect(r.ok).toBe(true);
        state = r.state;
      }

      if (state.phase === "equip") {
        r = applySkipPhase(state, pid);
        expect(r.ok).toBe(true);
        state = r.state;
      }
    };

    for (let turn = 0; turn < 4; turn++) {
      phases.push(state.phase);
      completeTurn(state.activePlayerId);
    }

    expect(phases[0]).toBe("opportunity");
    expect(state.activePlayerId).toBe(startPlayer);
    expect(state.turnIndex).toBe(0);
    expect(state.phase).toBe("opportunity");
  });

  it("places each player on their start node", () => {
    const graph = loadBoardGraph();
    const state = createInitialGameState(fourPlayers);
    for (const p of state.players) {
      const node = graph.nodes.find((n) => n.id === p.nodeId);
      expect(node?.tileType === p.seat || node?.isStarting === p.seat).toBe(true);
    }
  });
});

describe("combat", () => {
  it("resolves attack with deterministic bounds", () => {
    const result = resolveAttack(
      { dex: 10, int: 10, str: 10, arm: 0, hp: 10 },
      { dex: 5, int: 5, str: 5, arm: 0, hp: 10 },
    );
    expect(result.defenderHp).toBeLessThanOrEqual(10);
    expect(result.log.length).toBeGreaterThan(0);
  });
});

describe("opportunity cards", () => {
  it("defines all 13 cards", () => {
    expect(OPPORTUNITY_CARDS).toHaveLength(13);
  });
});

describe("phase machine", () => {
  it("cycles through all phases before next player", () => {
    let state = createInitialGameState(fourPlayers);
    const order = ["opportunity", "shop", "dice", "tile", "equip"];
    for (const phase of order) {
      expect(state.phase).toBe(phase);
      state = advancePhase(state);
    }
    expect(state.phase).toBe("opportunity");
    expect(state.activePlayerId).toBe(fourPlayers[1].id);
  });
});
