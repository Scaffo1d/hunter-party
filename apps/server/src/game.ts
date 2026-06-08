import type { GameState } from "@hunter-party/game-engine/types";
import { applyGameAction } from "@hunter-party/game-engine/actions";
import { getRoom } from "./rooms.js";

export function handleGameAction(
  code: string,
  playerId: string,
  action: { type: string; payload?: Record<string, unknown> },
): { ok: boolean; state?: GameState; error?: string } {
  const room = getRoom(code);
  if (!room?.game || !room.started) {
    return { ok: false, error: "Game not started" };
  }
  const result = applyGameAction(room.game, playerId, action);
  if (result.ok) {
    room.game = result.state;
  }
  return result;
}

export function getGameState(code: string): GameState | null {
  return getRoom(code)?.game ?? null;
}
