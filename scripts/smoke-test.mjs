#!/usr/bin/env node
/**
 * Smoke test: health check + Socket.IO create/join/start flow.
 * Usage: node scripts/smoke-test.mjs [wsUrl]
 * Default: http://localhost:3001
 */

import { io } from "socket.io-client";

const wsUrl = process.argv[2] ?? process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

function emit(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${event}`)), 15000);
    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

async function main() {
  console.log(`Smoke test → ${wsUrl}`);

  const health = await fetch(`${wsUrl}/health`);
  if (!health.ok) throw new Error(`Health check failed: ${health.status}`);
  const body = await health.json();
  if (!body.ok) throw new Error("Health body not ok");
  console.log("✓ /health");

  const socket = io(wsUrl, { transports: ["websocket", "polling"], timeout: 15000 });

  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error("Socket connect timeout")), 15000);
  });
  console.log("✓ Socket connected");

  const create = await emit(socket, "createRoom", { name: "SmokeHost" });
  if (!create?.ok || !create.room?.code) throw new Error(`createRoom failed: ${JSON.stringify(create)}`);
  console.log(`✓ createRoom → ${create.room.code}`);

  const socket2 = io(wsUrl, { transports: ["websocket", "polling"], timeout: 15000 });
  await new Promise((resolve, reject) => {
    socket2.on("connect", resolve);
    socket2.on("connect_error", reject);
    setTimeout(() => reject(new Error("Socket2 connect timeout")), 15000);
  });

  const join = await emit(socket2, "joinRoom", { code: create.room.code, name: "SmokeGuest" });
  if (!join?.ok) throw new Error(`joinRoom failed: ${JSON.stringify(join)}`);
  console.log("✓ joinRoom");

  const start = await emit(socket, "startGame", {});
  if (!start?.ok) throw new Error(`startGame failed: ${JSON.stringify(start)}`);

  const gameState = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("gameState timeout")), 15000);
    socket.on("gameState", (state) => {
      clearTimeout(timer);
      resolve(state);
    });
  });
  if (!gameState?.players?.length) throw new Error("gameState missing players");
  console.log(`✓ startGame → ${gameState.players.length} players, phase=${gameState.phase}`);

  socket.disconnect();
  socket2.disconnect();
  console.log("\nAll smoke tests passed.");
}

main().catch((err) => {
  console.error("\nSmoke test FAILED:", err.message);
  process.exit(1);
});
