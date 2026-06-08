import type { StartingSeat } from "../board/types";

export type TurnPhase =
  | "opportunity"
  | "shop"
  | "dice"
  | "tile"
  | "equip"
  | "waiting";

export type Currency = "G" | "S" | "C" | "LL";

export interface PlayerCounters {
  MD: number;
  BC: number;
}

export interface PlayerCurrencies {
  G: number;
  S: number;
  C: number;
  LL: number;
}

export interface PlayerStats {
  HP: number;
  Str: number;
  Dex: number;
  Int: number;
  Arm: number;
}

export interface EquipmentSlot {
  id: string | null;
  name: string | null;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  seat: StartingSeat;
  nodeId: string;
  stats: PlayerStats;
  currencies: PlayerCurrencies;
  counters: PlayerCounters;
  opportunityCards: string[];
  equipment: {
    weapon: EquipmentSlot;
    armor: EquipmentSlot;
    boots: EquipmentSlot;
    charm: EquipmentSlot;
    storage: [EquipmentSlot, EquipmentSlot];
  };
  alive: boolean;
}

export interface ShopState {
  faceUp: string[];
  faceDownCount: number;
}

export interface PendingPrompt {
  type: string;
  playerId: string;
  options?: unknown[];
}

export interface MovementState {
  remainingSteps: number;
  pathChoices: string[];
}

export interface GameState {
  roomCode: string;
  turnIndex: number;
  activePlayerId: string;
  phase: TurnPhase;
  players: PlayerState[];
  shop: ShopState;
  opportunityDeckCount: number;
  diceRoll: number | null;
  movement: MovementState | null;
  pendingPrompt: PendingPrompt | null;
  log: string[];
}

export interface LobbyPlayer {
  id: string;
  name: string;
  color: string;
}
