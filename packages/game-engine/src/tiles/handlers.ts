import type { BoardNode } from "../board/types";
import type { GameState } from "../game/types";

export interface TileActionResult {
  state: GameState;
  prompt?: { type: string; options?: unknown[] };
  log: string[];
}

export type TileHandler = (state: GameState, node: BoardNode, playerId: string) => TileActionResult;

const handlers: Record<string, TileHandler> = {
  O: (state, node, playerId) => ({
    state: {
      ...state,
      opportunityDeckCount: Math.max(0, state.opportunityDeckCount - 1),
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, opportunityCards: [...p.opportunityCards, `oc-${Date.now()}`] }
          : p,
      ),
    },
    log: [`${playerId} drew opportunity card on ${node.id}`],
  }),
  MD: (state, node, playerId) => ({
    state: {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, counters: { ...p.counters, MD: p.counters.MD + 1 } } : p,
      ),
    },
    log: [`${playerId} gained MD on ${node.id}`],
  }),
  E: (state, node, playerId) => ({
    state,
    prompt: { type: "exchange", options: ["bank", "equipment"] },
    log: [`${playerId} landed on Exchange ${node.id}`],
  }),
  TP: (state, node, playerId) => ({
    state,
    prompt: { type: "teleport", options: [] },
    log: [`${playerId} landed on Teleportal ${node.id}`],
  }),
  B: (state, node, playerId) => ({
    state,
    prompt: { type: "bossChallenge", options: [{ nodeId: node.id, rarity: node.bossRarity }] },
    log: [`${playerId} may challenge boss on ${node.id}`],
  }),
  R: (state, node, playerId) => ({
    state,
    prompt: { type: "relicBoss", options: [{ nodeId: node.id }] },
    log: [`${playerId} may challenge relic boss on ${node.id}`],
  }),
  T: (state, node, playerId) => {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return { state, log: [] };
    const tax = Math.min(player.currencies.G, 2);
    return {
      state: {
        ...state,
        players: state.players.map((p) =>
          p.id === playerId
            ? { ...p, currencies: { ...p.currencies, G: p.currencies.G - tax } }
            : p,
        ),
      },
      log: [`${player.name} paid ${tax}G to Taxman`],
    };
  },
  CA: (state, node, playerId) => ({
    state,
    prompt: { type: "casino", options: ["bet1", "bet2", "bet3"] },
    log: [`${playerId} at Casino ${node.id}`],
  }),
  GA: (state, node, playerId) => ({
    state,
    prompt: { type: "auction", options: [] },
    log: [`${playerId} at Grand Auction ${node.id}`],
  }),
  H: (state, node, playerId) => {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return { state, log: [] };
    return {
      state: {
        ...state,
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, stats: { ...p.stats, HP: Math.min(10, p.stats.HP + 3) } } : p,
        ),
      },
      log: [`${player.name} healed at Hospital`],
    };
  },
  C: (state, node, playerId) => ({
    state,
    prompt: { type: "cave", options: ["explore", "leave"] },
    log: [`${playerId} entered Cave ${node.id}`],
  }),
  L: (state, node, playerId) => ({
    state: {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, currencies: { ...p.currencies, G: p.currencies.G + 1 } } : p,
      ),
    },
    log: [`${playerId} looted +1G`],
  }),
  KF: (state, node, playerId) => ({
    state: {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, counters: { ...p.counters, MD: p.counters.MD + 1 } } : p,
      ),
    },
    log: [`${playerId} gained King's Favor (+1 MD)`],
  }),
};

export function resolveTile(
  state: GameState,
  node: BoardNode,
  playerId: string,
): TileActionResult {
  const handler = handlers[node.tileType];
  if (handler) return handler(state, node, playerId);
  return { state, log: [`${playerId} landed on ${node.tileType} (${node.id})`] };
}
