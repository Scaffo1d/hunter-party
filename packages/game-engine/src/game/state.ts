import { getStartingNode, loadBoardGraph } from "../board/graph";
import type { StartingSeat } from "../board/types";
import type { GameState, LobbyPlayer, PlayerState } from "./types";

const SEATS: StartingSeat[] = ["S1", "S2", "S3", "S4"];

function basePlayer(p: LobbyPlayer, seat: StartingSeat, nodeId: string): PlayerState {
  const gold = seat === "S1" ? 2 : 3;
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    seat,
    nodeId,
    stats: { HP: 10, Str: 10, Dex: 10, Int: 10, Arm: 0 },
    currencies: { G: gold, S: 0, C: 0, LL: 0 },
    counters: { MD: 0, BC: 0 },
    opportunityCards: [],
    equipment: {
      weapon: { id: null, name: null },
      armor: { id: null, name: null },
      boots: { id: null, name: null },
      charm: { id: null, name: null },
      storage: [
        { id: null, name: null },
        { id: null, name: null },
      ],
    },
    alive: true,
  };
}

export function createInitialGameState(lobbyPlayers: LobbyPlayer[]): GameState {
  const graph = loadBoardGraph();
  const players = lobbyPlayers.slice(0, 4).map((p, i) => {
    const seat = SEATS[i];
    const start = getStartingNode(graph, seat);
    if (!start) throw new Error(`Missing start node ${seat}`);
    return basePlayer(p, seat, start.id);
  });

  return {
    roomCode: "",
    turnIndex: 0,
    activePlayerId: players[0].id,
    phase: "opportunity",
    players,
    shop: {
      faceUp: ["epic-1", "epic-2", "rare-1", "rare-2", "rare-3", "common-1", "common-2", "common-3", "common-4"],
      faceDownCount: 90,
    },
    opportunityDeckCount: 52,
    diceRoll: null,
    movement: null,
    pendingPrompt: null,
    log: ["Game started"],
  };
}

export function advancePhase(state: GameState): GameState {
  const order: GameState["phase"][] = ["opportunity", "shop", "dice", "tile", "equip"];
  const idx = order.indexOf(state.phase);
  if (idx < order.length - 1) {
    return { ...state, phase: order[idx + 1], log: [...state.log, `Phase: ${order[idx + 1]}`] };
  }
  const nextIdx = (state.turnIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIdx];
  return {
    ...state,
    turnIndex: nextIdx,
    activePlayerId: nextPlayer.id,
    phase: "opportunity",
    log: [...state.log, `Turn: ${nextPlayer.name}`],
  };
}
