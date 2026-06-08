"use client";

import { useEffect, useState } from "react";
import type { BoardGraph, GameState } from "@hunter-party/game-engine";
import BoardView from "./BoardView";
import GameControls from "./GameControls";
import SeatChip from "./SeatChip";
import { getSocket } from "@/lib/socket";

export default function GameScreen({ code }: { code: string }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [graph, setGraph] = useState<BoardGraph | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playerId] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("hp_player_id") : null,
  );

  useEffect(() => {
    const raw = sessionStorage.getItem("hp_game_state");
    if (raw) setGame(JSON.parse(raw) as GameState);

    fetch("/board-sketch-import.json")
      .then((r) => r.json())
      .then((d) => setGraph(d as BoardGraph));

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.on("gameState", (state: GameState) => {
      setGame(state);
      sessionStorage.setItem("hp_game_state", JSON.stringify(state));
    });
    socket.emit("getGameState", { code }, (res: { ok: boolean; state?: GameState }) => {
      if (res?.ok && res.state) {
        setGame(res.state);
        sessionStorage.setItem("hp_game_state", JSON.stringify(res.state));
      }
    });
    return () => {
      socket.off("gameState");
    };
  }, [code]);

  if (!game || !graph) {
    return <p className="p-4 text-zinc-400">Loading game…</p>;
  }

  const active = game.players.find((p) => p.id === game.activePlayerId);

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2 text-sm">
        <span className="font-semibold">Room {code}</span>
        <span className="text-zinc-400">
          Phase: <span className="text-white capitalize">{game.phase}</span>
          {active && <> · {active.name}&apos;s turn</>}
        </span>
      </header>
      <div className="relative min-h-0 flex-1">
        <BoardView graph={graph} game={game} />
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute left-1/2 top-2 -translate-x-1/2">
            {game.players.find((p) => p.seat === "S1") && (
              <SeatChip
                player={game.players.find((p) => p.seat === "S1")!}
                expanded={expandedId === game.players.find((p) => p.seat === "S1")!.id}
                onToggle={() => {
                  const id = game.players.find((p) => p.seat === "S1")!.id;
                  setExpandedId(expandedId === id ? null : id);
                }}
              />
            )}
          </div>
          <div className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2">
            {game.players.find((p) => p.seat === "S2") && (
              <SeatChip
                player={game.players.find((p) => p.seat === "S2")!}
                expanded={expandedId === game.players.find((p) => p.seat === "S2")!.id}
                onToggle={() => {
                  const id = game.players.find((p) => p.seat === "S2")!.id;
                  setExpandedId(expandedId === id ? null : id);
                }}
              />
            )}
          </div>
          <div className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2">
            {game.players.find((p) => p.seat === "S3") && (
              <SeatChip
                player={game.players.find((p) => p.seat === "S3")!}
                expanded={expandedId === game.players.find((p) => p.seat === "S3")!.id}
                onToggle={() => {
                  const id = game.players.find((p) => p.seat === "S3")!.id;
                  setExpandedId(expandedId === id ? null : id);
                }}
              />
            )}
          </div>
          <div className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2">
            {game.players.find((p) => p.seat === "S4") && (
              <SeatChip
                player={game.players.find((p) => p.seat === "S4")!}
                expanded={expandedId === game.players.find((p) => p.seat === "S4")!.id}
                onToggle={() => {
                  const id = game.players.find((p) => p.seat === "S4")!.id;
                  setExpandedId(expandedId === id ? null : id);
                }}
              />
            )}
          </div>
        </div>
      </div>
      <GameControls game={game} playerId={playerId} />
    </div>
  );
}
