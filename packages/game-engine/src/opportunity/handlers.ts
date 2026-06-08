import type { GameState } from "../game/types";

export interface OpportunityCard {
  id: string;
  name: string;
  effect: string;
}

export const OPPORTUNITY_CARDS: OpportunityCard[] = [
  { id: "copper-discount", name: "Shop Coupon (Copper)", effect: "shop_discount_copper" },
  { id: "silver-discount", name: "Shop Coupon (Silver)", effect: "shop_discount_silver" },
  { id: "lapis-discount", name: "Shop Coupon (Lapis Lazuli)", effect: "shop_discount_ll" },
  { id: "freeze", name: "Freeze", effect: "freeze_opponent" },
  { id: "hired-thief", name: "Hired Thief", effect: "steal_oc" },
  { id: "locker-room", name: "Locker Room Chaos", effect: "swap_equipment" },
  { id: "grand-auction-oc", name: "Grand Auction", effect: "auction" },
  { id: "teleport-magician", name: "Teleport Magician", effect: "teleport" },
  { id: "broken-bridges", name: "Broken Bridges", effect: "block_path" },
  { id: "pre-purchase", name: "Pre-Purchase", effect: "pre_purchase" },
  { id: "hard-bargainer", name: "Hard Bargainer", effect: "hard_bargain" },
  { id: "casino-oc", name: "Casino", effect: "casino" },
  { id: "tax-refund", name: "Tax Refund", effect: "tax_refund" },
];

export function playOpportunityCard(
  state: GameState,
  playerId: string,
  cardId: string,
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.opportunityCards.includes(cardId)) return state;
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, opportunityCards: p.opportunityCards.filter((c) => c !== cardId) }
        : p,
    ),
    log: [...state.log, `${player.name} played opportunity card ${cardId}`],
  };
}
