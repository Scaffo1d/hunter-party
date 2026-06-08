"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSocket } from "@/lib/socket";

export default function LobbyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createRoom = () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const socket = getSocket();
    socket.connect();
    socket.emit("createRoom", { name }, (res: { ok: boolean; room?: { code: string }; playerId?: string; error?: string }) => {
      setLoading(false);
      if (!res?.ok || !res.room) {
        setError(res?.error ?? "Failed to create room");
        return;
      }
      sessionStorage.setItem("hp_player_name", name);
      sessionStorage.setItem("hp_player_id", res.playerId ?? "");
      sessionStorage.setItem("hp_room", JSON.stringify(res.room));
      router.push(`/room/${res.room.code}`);
    });
  };

  const joinRoom = () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError(null);
    const socket = getSocket();
    socket.connect();
    socket.emit("joinRoom", { code: code.toUpperCase(), name }, (res: { ok: boolean; room?: { code: string }; playerId?: string; error?: string }) => {
      setLoading(false);
      if (!res?.ok || !res.room) {
        setError(res?.error ?? "Failed to join room");
        return;
      }
      sessionStorage.setItem("hp_player_name", name);
      sessionStorage.setItem("hp_player_id", res.playerId ?? "");
      sessionStorage.setItem("hp_room", JSON.stringify(res.room));
      router.push(`/room/${res.room.code}`);
    });
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <input
        className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        onClick={createRoom}
        disabled={loading}
        className="rounded bg-green-700 py-2 font-semibold hover:bg-green-600 disabled:opacity-50"
      >
        Create room
      </button>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 uppercase"
          placeholder="Room code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          type="button"
          onClick={joinRoom}
          disabled={loading}
          className="rounded bg-blue-700 px-4 font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          Join
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
