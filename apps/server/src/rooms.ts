import type { GameState } from "@hunter-party/game-engine/types";
import { createInitialGameState } from "@hunter-party/game-engine/state";

export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  connected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  game: GameState | null;
  started: boolean;
}

const rooms = new Map<string, Room>();

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? randomCode() : code;
}

export function createRoom(hostId: string, hostName: string): Room {
  const code = randomCode();
  const room: Room = {
    code,
    hostId,
    players: [{ id: hostId, name: hostName, color: COLORS[0], connected: true }],
    game: null,
    started: false,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(code: string, playerId: string, name: string): Room | null {
  const room = getRoom(code);
  if (!room || room.started || room.players.length >= 4) return null;
  if (room.players.some((p) => p.id === playerId)) return room;
  room.players.push({
    id: playerId,
    name,
    color: COLORS[room.players.length],
    connected: true,
  });
  return room;
}

export function startRoom(code: string, hostId: string): GameState | null {
  const room = getRoom(code);
  if (!room || room.hostId !== hostId || room.players.length < 2) return null;
  const state = createInitialGameState(
    room.players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
  );
  state.roomCode = room.code;
  room.game = state;
  room.started = true;
  return state;
}

export function setPlayerConnected(code: string, playerId: string, connected: boolean): void {
  const room = getRoom(code);
  const player = room?.players.find((p) => p.id === playerId);
  if (player) player.connected = connected;
}

export function publicRoomView(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    started: room.started,
    hasGame: !!room.game,
  };
}
