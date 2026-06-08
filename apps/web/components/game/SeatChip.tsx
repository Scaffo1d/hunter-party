"use client";

import type { PlayerState } from "@hunter-party/game-engine";

export default function SeatChip({
  player,
  expanded,
  onToggle,
}: {
  player: PlayerState;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-left text-xs shadow-lg backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
        <span className="font-semibold">{player.name}</span>
        <span className="text-zinc-500">OC {player.opportunityCards.length}</span>
      </div>
      {!expanded ? (
        <p className="mt-1 text-zinc-400">
          HP {player.stats.HP} · G{player.currencies.G} MD{player.counters.MD} BC{player.counters.BC}
        </p>
      ) : (
        <div className="mt-2 space-y-1 text-zinc-300">
          <p>Str {player.stats.Str} Dex {player.stats.Dex} Int {player.stats.Int} Arm {player.stats.Arm}</p>
          <p>G{player.currencies.G} S{player.currencies.S} C{player.currencies.C} LL{player.currencies.LL}</p>
          <p>MD {player.counters.MD} · BC {player.counters.BC}</p>
        </div>
      )}
    </button>
  );
}
