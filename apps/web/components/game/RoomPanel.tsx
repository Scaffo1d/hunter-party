"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { GameState } from "@hunter-party/game-engine";
import { getSocket } from "@/lib/socket";

interface RoomView {
  code: string;
  hostId: string;
  players: { id: string; name: string; color: string; connected: boolean }[];
  started: boolean;
}

export default function RoomPanel({ code }: { code: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomView | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("hp_room");
    return raw ? (JSON.parse(raw) as RoomView) : null;
  });
  const [playerId, setPlayerId] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("hp_player_id") : null,
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const name = sessionStorage.getItem("hp_player_name") ?? "Player";
    socket.emit("joinRoom", { code, name }, (res: { ok: boolean; room?: RoomView; playerId?: string }) => {
      if (res?.ok && res.room) {
        setRoom(res.room);
        sessionStorage.setItem("hp_room", JSON.stringify(res.room));
        if (res.playerId) {
          sessionStorage.setItem("hp_player_id", res.playerId);
          setPlayerId(res.playerId);
        }
      }
    });

    socket.on("roomUpdated", (r: RoomView) => {
      setRoom(r);
      sessionStorage.setItem("hp_room", JSON.stringify(r));
    });
    socket.on("gameState", (state: GameState) => {
      router.push(`/game/${code}`);
      sessionStorage.setItem("hp_game_state", JSON.stringify(state));
    });

    return () => {
      socket.off("roomUpdated");
      socket.off("gameState");
    };
  }, [code, router]);

  const startGame = () => {
    getSocket().emit("startGame", {}, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) alert(res?.error ?? "Cannot start");
    });
  };

  if (!room) {
    return <p className="text-zinc-400">Connecting to room {code}…</p>;
  }

  const isHost = playerId === room.hostId;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h2 className="text-xl font-bold">Room {room.code}</h2>
      <ul className="space-y-2">
        {room.players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded bg-zinc-900 px-3 py-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
            {!p.connected && <span className="text-xs text-zinc-500">(offline)</span>}
          </li>
        ))}
      </ul>
      {isHost && !room.started && (
        <button
          type="button"
          onClick={startGame}
          disabled={room.players.length < 2}
          className="rounded bg-green-700 py-2 font-semibold disabled:opacity-50"
        >
          Start game ({room.players.length}/4)
        </button>
      )}
    </div>
  );
}
