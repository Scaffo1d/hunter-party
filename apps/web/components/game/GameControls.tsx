"use client";

import type { GameState } from "@hunter-party/game-engine";
import { getSocket } from "@/lib/socket";

export default function GameControls({
  game,
  playerId,
}: {
  game: GameState;
  playerId: string | null;
}) {
  const isMyTurn = playerId === game.activePlayerId;
  const active = game.players.find((p) => p.id === game.activePlayerId);

  const emit = (type: string, payload?: Record<string, unknown>) => {
    getSocket().emit("gameAction", { type, payload }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) alert(res?.error ?? "Action failed");
    });
  };

  if (!isMyTurn) {
    return (
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-400">
        Waiting for {active?.name ?? "player"}…
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
        {game.phase === "opportunity" && (
          <>
            <button
              type="button"
              onClick={() => emit("skipPhase")}
              className="rounded bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600"
            >
              Skip OC phase
            </button>
            {game.players
              .find((p) => p.id === playerId)
              ?.opportunityCards.map((card) => (
                <button
                  key={card}
                  type="button"
                  onClick={() => emit("playOpportunityCard", { cardId: card })}
                  className="rounded bg-green-800 px-3 py-1.5 text-sm hover:bg-green-700"
                >
                  Play {card}
                </button>
              ))}
          </>
        )}
        {game.phase === "shop" && (
          <>
            <button type="button" onClick={() => emit("skipPhase")} className="rounded bg-zinc-700 px-3 py-1.5 text-sm">
              Skip shop
            </button>
            {game.shop.faceUp.slice(0, 3).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => emit("shopBuy", { itemId: item })}
                className="rounded bg-amber-800 px-3 py-1.5 text-sm hover:bg-amber-700"
              >
                Buy {item} (1G)
              </button>
            ))}
          </>
        )}
        {game.phase === "dice" && (
          <button
            type="button"
            onClick={() => emit("rollDice")}
            className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-600"
          >
            Roll dice
          </button>
        )}
        {game.pendingPrompt?.type === "choosePath" && (
          <>
            <span className="text-sm text-zinc-400">Choose path:</span>
            {(game.pendingPrompt.options as string[] | undefined)?.map((nodeId) => (
              <button
                key={nodeId}
                type="button"
                onClick={() => emit("choosePath", { nodeId })}
                className="rounded bg-purple-700 px-3 py-1.5 text-sm hover:bg-purple-600"
              >
                → {nodeId}
              </button>
            ))}
          </>
        )}
        {game.pendingPrompt && game.pendingPrompt.type !== "choosePath" && (
          <>
            <span className="text-sm text-zinc-400">{game.pendingPrompt.type}</span>
            {(game.pendingPrompt.options as string[] | undefined)?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => emit("promptChoice", { choice: opt })}
                className="rounded bg-orange-800 px-3 py-1.5 text-sm"
              >
                {opt}
              </button>
            )) ?? (
              <button
                type="button"
                onClick={() => emit("promptChoice", { choice: "continue" })}
                className="rounded bg-orange-800 px-3 py-1.5 text-sm"
              >
                Continue
              </button>
            )}
          </>
        )}
        {game.phase === "tile" && !game.pendingPrompt && !game.movement && (
          <button
            type="button"
            onClick={() => emit("tileContinue")}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600"
          >
            Continue
          </button>
        )}
        {game.phase === "equip" && (
          <button
            type="button"
            onClick={() => emit("skipPhase")}
            className="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600"
          >
            End turn
          </button>
        )}
      </div>
      {game.diceRoll && (
        <p className="mt-1 text-center text-xs text-zinc-500">Last roll: {game.diceRoll}</p>
      )}
    </div>
  );
}
