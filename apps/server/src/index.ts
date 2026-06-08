import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  createRoom,
  getRoom,
  joinRoom,
  publicRoomView,
  setPlayerConnected,
  startRoom,
} from "./rooms.js";
import { getGameState, handleGameAction } from "./game.js";

const PORT = Number(process.env.PORT ?? 3001);

function corsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const origins = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: corsOrigins() }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigins(), methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  let roomCode: string | null = null;
  let playerId: string | null = null;

  socket.on("createRoom", ({ name }: { name: string }, ack) => {
    playerId = socket.id;
    const room = createRoom(playerId, name.trim() || "Player");
    roomCode = room.code;
    socket.join(room.code);
    ack?.({ ok: true, room: publicRoomView(room), playerId });
    io.to(room.code).emit("roomUpdated", publicRoomView(room));
  });

  socket.on("joinRoom", ({ code, name }: { code: string; name: string }, ack) => {
    playerId = socket.id;
    const room = joinRoom(code, playerId, name.trim() || "Player");
    if (!room) {
      ack?.({ ok: false, error: "Room not found or full" });
      return;
    }
    roomCode = room.code;
    socket.join(room.code);
    ack?.({ ok: true, room: publicRoomView(room), playerId });
    io.to(room.code).emit("roomUpdated", publicRoomView(room));
  });

  socket.on("startGame", (_payload, ack) => {
    if (!roomCode || !playerId) return;
    const state = startRoom(roomCode, playerId);
    if (!state) {
      ack?.({ ok: false, error: "Cannot start game" });
      return;
    }
    ack?.({ ok: true });
    io.to(roomCode).emit("gameState", state);
  });

  socket.on("getGameState", (payload: { code?: string } | undefined, ack) => {
    const code = payload?.code ?? roomCode;
    if (!code) {
      ack?.({ ok: false, error: "Not in a room" });
      return;
    }
    const state = getGameState(code);
    if (!state) {
      ack?.({ ok: false, error: "No game" });
      return;
    }
    ack?.({ ok: true, state });
  });

  socket.on(
    "gameAction",
    (action: { type: string; payload?: Record<string, unknown> }, ack) => {
      if (!roomCode || !playerId) return;
      const result = handleGameAction(roomCode, playerId, action);
      if (result.ok && result.state) {
        io.to(roomCode).emit("gameState", result.state);
      }
      ack?.(result);
    },
  );

  socket.on("disconnect", () => {
    if (roomCode && playerId) {
      setPlayerConnected(roomCode, playerId, false);
      const room = getRoom(roomCode);
      if (room) io.to(roomCode).emit("roomUpdated", publicRoomView(room));
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Hunter Party server on http://localhost:${PORT}`);
});
