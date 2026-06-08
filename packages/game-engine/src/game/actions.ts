import { getNode, loadBoardGraph } from "../board/graph";
import { legalNextNodes } from "../board/movement";
import { resolveAttack } from "../combat/combat";
import { playOpportunityCard } from "../opportunity/handlers";
import { resolveTile } from "../tiles/handlers";
import { addCurrency, canAfford, pay } from "./economy";
import { advancePhase } from "./state";
import type { GameState } from "./types";

export interface ActionResult {
  ok: boolean;
  state: GameState;
  error?: string;
}

function activePlayer(state: GameState) {
  return state.players.find((p) => p.id === state.activePlayerId);
}

function withLog(state: GameState, ...messages: string[]): GameState {
  return { ...state, log: [...state.log, ...messages] };
}

function updatePlayer(state: GameState, playerId: string, patch: Partial<GameState["players"][0]>): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
  };
}

function beginMovement(state: GameState, steps: number): GameState {
  const player = activePlayer(state);
  if (!player) return state;
  const graph = loadBoardGraph();
  const options = legalNextNodes(player.nodeId, player.seat, graph);
  if (options.length === 0) {
    return withLog(state, `${player.name} rolled ${steps} but has no legal moves`);
  }
  const base = {
    ...withLog(state, `${player.name} rolled ${steps}`),
    diceRoll: steps,
    phase: "dice" as const,
  };
  if (options.length === 1) {
    const walked = stepMovement(
      { ...base, movement: { remainingSteps: steps, pathChoices: options } },
      options[0],
      player.nodeId,
    );
    return typeof walked === "object" && "error" in walked ? base : walked;
  }
  return {
    ...base,
    movement: { remainingSteps: steps, pathChoices: options },
    pendingPrompt: { type: "choosePath", playerId: player.id, options },
  };
}

function landOnTile(state: GameState, playerId: string, nodeId: string): GameState {
  const graph = loadBoardGraph();
  const node = getNode(graph, nodeId);
  if (!node) return state;
  let next = updatePlayer(state, playerId, { nodeId });
  next = { ...next, movement: null, diceRoll: null, phase: "tile" };
  const result = resolveTile(next, node, playerId);
  next = { ...result.state, log: [...next.log, ...result.log] };
  if (result.prompt) {
    next = {
      ...next,
      pendingPrompt: { type: result.prompt.type, playerId, options: result.prompt.options },
    };
  }
  return next;
}

function stepMovement(
  state: GameState,
  chosenNodeId: string,
  previousNodeId?: string,
): GameState | { error: string } {
  const player = activePlayer(state);
  if (!player || !state.movement) return state;
  const { remainingSteps, pathChoices } = state.movement;
  if (!pathChoices.includes(chosenNodeId)) {
    return { error: "Invalid path choice" };
  }

  const graph = loadBoardGraph();
  const fromId = previousNodeId ?? player.nodeId;
  let next = updatePlayer(state, player.id, { nodeId: chosenNodeId });
  const stepsLeft = remainingSteps - 1;

  if (stepsLeft <= 0) {
    return landOnTile({ ...next, movement: null }, player.id, chosenNodeId);
  }

  const options = legalNextNodes(chosenNodeId, player.seat, graph).filter((n) => n !== fromId);
  if (options.length === 0) {
    return landOnTile({ ...next, movement: null }, player.id, chosenNodeId);
  }
  if (options.length === 1) {
    return stepMovement(
      { ...next, movement: { remainingSteps: stepsLeft, pathChoices: options } },
      options[0],
      chosenNodeId,
    );
  }
  return {
    ...next,
    movement: { remainingSteps: stepsLeft, pathChoices: options },
    pendingPrompt: { type: "choosePath", playerId: player.id, options: options },
  };
}

export function applySkipPhase(state: GameState, playerId: string): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  const next = advancePhase(state);
  return { ok: true, state: { ...next, diceRoll: null, movement: null, pendingPrompt: null } };
}

export function applyRollDice(state: GameState, playerId: string): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  if (state.phase !== "dice") return { ok: false, state, error: "Not dice phase" };
  const roll = Math.floor(Math.random() * 6) + 1;
  const next = beginMovement(state, roll);
  return { ok: true, state: next };
}

export function applyChoosePath(state: GameState, playerId: string, nodeId: string): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  if (!state.movement) return { ok: false, state, error: "No movement in progress" };
  const walked = stepMovement({ ...state, pendingPrompt: null }, nodeId);
  if (typeof walked === "object" && "error" in walked) {
    return { ok: false, state, error: walked.error };
  }
  return { ok: true, state: walked };
}

export function applyShopBuy(
  state: GameState,
  playerId: string,
  itemId: string,
  cost: { G?: number; S?: number; C?: number; LL?: number } = { G: 1 },
): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  if (state.phase !== "shop") return { ok: false, state, error: "Not shop phase" };
  if (!state.shop.faceUp.includes(itemId)) return { ok: false, state, error: "Item not in shop" };

  const player = state.players.find((p) => p.id === playerId);
  if (!player || !canAfford(player.currencies, cost)) {
    return { ok: false, state, error: "Cannot afford" };
  }

  const next = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, currencies: pay(p.currencies, cost) } : p,
    ),
    shop: {
      ...state.shop,
      faceUp: state.shop.faceUp.filter((id) => id !== itemId),
      faceDownCount: Math.max(0, state.shop.faceDownCount - 1),
    },
    log: [...state.log, `${player.name} bought ${itemId}`],
  };
  return { ok: true, state: next };
}

export function applyPlayOpportunityCard(
  state: GameState,
  playerId: string,
  cardId: string,
): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  if (state.phase !== "opportunity") return { ok: false, state, error: "Not opportunity phase" };
  const next = playOpportunityCard(state, playerId, cardId);
  return { ok: true, state: next };
}

export function applyTileContinue(state: GameState, playerId: string): ActionResult {
  if (state.activePlayerId !== playerId) return { ok: false, state, error: "Not your turn" };
  if (state.phase !== "tile") return { ok: false, state, error: "Not tile phase" };
  if (state.pendingPrompt) return { ok: false, state, error: "Resolve prompt first" };
  if (state.movement) return { ok: false, state, error: "Choose path first" };

  const player = activePlayer(state);
  if (!player) return { ok: false, state, error: "No active player" };

  const others = state.players.filter((p) => p.id !== playerId && p.alive && p.nodeId === player.nodeId);
  if (others.length > 0) {
    const defender = others[0];
    const result = resolveAttack(
      { dex: player.stats.Dex, int: player.stats.Int, str: player.stats.Str, arm: player.stats.Arm, hp: player.stats.HP },
      { dex: defender.stats.Dex, int: defender.stats.Int, str: defender.stats.Str, arm: defender.stats.Arm, hp: defender.stats.HP },
    );
    let next = withLog(state, ...result.log, `PvP: ${player.name} vs ${defender.name}`);
    if (result.defenderHp <= 0) {
      next = updatePlayer(next, defender.id, { alive: false, stats: { ...defender.stats, HP: 0 } });
      next = {
        ...next,
        players: next.players.map((p) =>
          p.id === playerId
            ? { ...p, counters: { ...p.counters, BC: p.counters.BC + 1 } }
            : p,
        ),
      };
    } else {
      next = updatePlayer(next, defender.id, { stats: { ...defender.stats, HP: result.defenderHp } });
    }
    return { ok: true, state: { ...next, phase: "equip" } };
  }

  return { ok: true, state: advancePhase(state) };
}

export function applyPromptChoice(
  state: GameState,
  playerId: string,
  choice: string,
): ActionResult {
  if (!state.pendingPrompt || state.pendingPrompt.playerId !== playerId) {
    return { ok: false, state, error: "No prompt" };
  }
  const { type } = state.pendingPrompt;
  if (type === "choosePath") {
    return applyChoosePath(state, playerId, choice);
  }
  if (type === "exchange" && choice === "bank") {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return { ok: false, state, error: "No player" };
    const next = {
      ...state,
      pendingPrompt: null,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, currencies: addCurrency(p.currencies, { G: 1 }) } : p,
      ),
      log: [...state.log, `${player.name} exchanged at bank (+1G)`],
    };
    return { ok: true, state: next };
  }
  return { ok: true, state: { ...state, pendingPrompt: null, log: [...state.log, `Prompt ${type}: ${choice}`] } };
}

export function applyGameAction(
  state: GameState,
  playerId: string,
  action: { type: string; payload?: Record<string, unknown> },
): ActionResult {
  switch (action.type) {
    case "skipPhase":
      return applySkipPhase(state, playerId);
    case "rollDice":
      return applyRollDice(state, playerId);
    case "choosePath":
      return applyChoosePath(state, playerId, String(action.payload?.nodeId ?? ""));
    case "shopBuy":
      return applyShopBuy(state, playerId, String(action.payload?.itemId ?? ""));
    case "playOpportunityCard":
      return applyPlayOpportunityCard(state, playerId, String(action.payload?.cardId ?? ""));
    case "tileContinue":
      return applyTileContinue(state, playerId);
    case "promptChoice":
      return applyPromptChoice(state, playerId, String(action.payload?.choice ?? ""));
    default:
      return { ok: false, state, error: `Unknown action: ${action.type}` };
  }
}
